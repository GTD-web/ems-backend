import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '@libs/database/database.module';
import { OrganizationManagementContextModule } from '@context/organization-management-context/organization-management-context.module';
import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';
import { EmployeeSyncService } from '@context/organization-management-context/employee-sync.service';
import {
  GetDepartmentHierarchyQueryHandler,
  GetDepartmentHierarchyWithEmployeesQueryHandler,
} from '@context/organization-management-context/queries';
import { DepartmentModule } from '@domain/common/department/department.module';
import { EmployeeModule } from '@domain/common/employee/employee.module';
import { SSOModule } from '@domain/common/sso/sso.module';
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { SSOService } from '@domain/common/sso';
import type { ISSOService } from '@domain/common/sso/interfaces';
import type {
  DepartmentHierarchyDto,
  DepartmentHierarchyWithEmployeesDto,
} from '@context/organization-management-context/interfaces/organization-management-context.interface';

/**
 * OrganizationManagementContext 하이라키 조회 통합 테스트
 *
 * 동기화 후 부서와 직원의 하이라키 구조가 올바르게 조회되는지 검증합니다.
 */
describe('OrganizationManagementContext - 하이라키 조회 통합 테스트', () => {
  let departmentHierarchyHandler: GetDepartmentHierarchyQueryHandler;
  let departmentHierarchyWithEmployeesHandler: GetDepartmentHierarchyWithEmployeesQueryHandler;
  let departmentSyncService: DepartmentSyncService;
  let employeeSyncService: EmployeeSyncService;
  let ssoService: ISSOService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let departmentRepository: Repository<Department>;
  let employeeRepository: Repository<Employee>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Department, Employee]),
        DepartmentModule,
        EmployeeModule,
        SSOModule,
        OrganizationManagementContextModule,
      ],
      providers: [
        GetDepartmentHierarchyQueryHandler,
        GetDepartmentHierarchyWithEmployeesQueryHandler,
      ],
    }).compile();

    departmentHierarchyHandler = module.get<GetDepartmentHierarchyQueryHandler>(
      GetDepartmentHierarchyQueryHandler,
    );
    departmentHierarchyWithEmployeesHandler =
      module.get<GetDepartmentHierarchyWithEmployeesQueryHandler>(
        GetDepartmentHierarchyWithEmployeesQueryHandler,
      );
    departmentSyncService = module.get<DepartmentSyncService>(
      DepartmentSyncService,
    );
    employeeSyncService = module.get<EmployeeSyncService>(EmployeeSyncService);
    ssoService = module.get<ISSOService>(SSOService);
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    departmentRepository = dataSource.getRepository(Department);
    employeeRepository = dataSource.getRepository(Employee);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    // SSO 클라이언트 초기화
    try {
      await ssoService.초기화한다();
      console.log('✅ SSO 서비스 초기화 완료');

      // 초기화 확인을 위한 테스트 호출
      await ssoService.부서계층구조를조회한다({});
      console.log('✅ SSO 서비스 연결 확인 완료');
    } catch (error) {
      console.warn(
        '⚠️ SSO 서비스 초기화/연결 실패 (테스트는 계속 진행):',
        error.message,
      );
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const employees = await employeeRepository.find();
      await employeeRepository.remove(employees);

      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('부서 하이라키 조회', () => {
    it('동기화 후 부서 하이라키 구조가 올바르게 조회되어야 한다', async () => {
      // Given: 부서 동기화 수행
      const deptSyncResult = await departmentSyncService.syncDepartments(true);
      expect(deptSyncResult.success).toBe(true);
      expect(deptSyncResult.created + deptSyncResult.updated).toBeGreaterThan(
        0,
      );

      // When: 부서 하이라키 조회
      const hierarchy = await departmentHierarchyHandler.execute({});

      // Then: 하이라키 구조 검증
      expect(hierarchy).toBeDefined();
      expect(Array.isArray(hierarchy)).toBe(true);
      expect(hierarchy.length).toBeGreaterThan(0);

      // 루트 부서 검증
      hierarchy.forEach((rootDept) => {
        expect(rootDept).toHaveProperty('id');
        expect(rootDept).toHaveProperty('name');
        expect(rootDept).toHaveProperty('code');
        expect(rootDept).toHaveProperty('order');
        expect(rootDept).toHaveProperty('parentDepartmentId');
        expect(rootDept).toHaveProperty('level');
        expect(rootDept).toHaveProperty('depth');
        expect(rootDept).toHaveProperty('childrenCount');
        expect(rootDept).toHaveProperty('totalDescendants');
        expect(rootDept).toHaveProperty('subDepartments');

        // 루트 부서는 parentDepartmentId가 null이어야 함
        expect(rootDept.parentDepartmentId).toBeNull();

        // 루트 부서의 level은 0이어야 함
        expect(rootDept.level).toBe(0);
      });

      // 부서 맵을 생성하여 externalId로 매핑
      const allDbDepartments = await departmentRepository.find();
      const deptMapById = new Map(allDbDepartments.map((d) => [d.id, d]));

      // 계층 구조 재귀 검증
      const validateHierarchy = (
        depts: DepartmentHierarchyDto[],
        expectedLevel: number,
      ): number => {
        let totalCount = 0;

        for (const dept of depts) {
          totalCount++;
          expect(dept.level).toBe(expectedLevel);
          expect(dept.childrenCount).toBe(dept.subDepartments.length);

          // 하위 부서가 있으면 재귀 검증
          if (dept.subDepartments.length > 0) {
            // 하위 부서의 level은 부모보다 1 커야 함
            // parentDepartmentId는 externalId를 참조하므로, 부서의 externalId로 매칭 확인
            const dbDept = deptMapById.get(dept.id);
            dept.subDepartments.forEach((child) => {
              expect(child.level).toBe(expectedLevel + 1);
              // parentDepartmentId는 externalId를 참조하므로 부서의 externalId와 비교
              if (dbDept) {
                expect(child.parentDepartmentId).toBe(dbDept.externalId);
              }
            });

            const childCount = validateHierarchy(
              dept.subDepartments,
              expectedLevel + 1,
            );
            expect(dept.totalDescendants).toBe(childCount);
          } else {
            // leaf 노드는 depth가 0이어야 함
            expect(dept.depth).toBe(0);
            expect(dept.totalDescendants).toBe(0);
          }

          totalCount += dept.totalDescendants;
        }

        return totalCount;
      };

      const totalCount = validateHierarchy(hierarchy, 0);

      // 실제 DB의 부서 수와 비교
      const dbDepartments = await departmentRepository.find();
      expect(totalCount).toBe(dbDepartments.length);

      console.log(`✅ 부서 하이라키 구조 검증 완료: ${totalCount}개 부서`);
    }, 120000);

    it('부서 하이라키의 계층 정보가 올바르게 계산되어야 한다', async () => {
      // Given: 부서 동기화 수행
      const deptSyncResult = await departmentSyncService.syncDepartments(true);
      expect(deptSyncResult.success).toBe(true);

      // When: 부서 하이라키 조회
      const hierarchy = await departmentHierarchyHandler.execute({});

      // Then: 계층 정보 검증
      const validateHierarchyInfo = (
        depts: DepartmentHierarchyDto[],
        currentLevel: number,
      ): number => {
        let maxDepth = 0;

        for (const dept of depts) {
          expect(dept.level).toBe(currentLevel);

          if (dept.subDepartments.length > 0) {
            const childDepth = validateHierarchyInfo(
              dept.subDepartments,
              currentLevel + 1,
            );
            expect(dept.depth).toBe(childDepth + 1);
            maxDepth = Math.max(maxDepth, childDepth + 1);

            // totalDescendants는 직계 하위 + 모든 손자 부서 개수
            const calculatedTotalDescendants = dept.subDepartments.reduce(
              (sum, child) => sum + 1 + child.totalDescendants,
              0,
            );
            expect(dept.totalDescendants).toBe(calculatedTotalDescendants);
          } else {
            expect(dept.depth).toBe(0);
            expect(dept.totalDescendants).toBe(0);
          }
        }

        return maxDepth;
      };

      validateHierarchyInfo(hierarchy, 0);

      console.log('✅ 부서 하이라키 계층 정보 검증 완료');
    }, 120000);
  });

  describe('부서 하이라키 (직원 포함) 조회', () => {
    it('동기화 후 부서 하이라키와 직원이 올바르게 조회되어야 한다', async () => {
      // Given: 부서 및 직원 동기화 수행
      const deptSyncResult = await departmentSyncService.syncDepartments(true);
      expect(deptSyncResult.success).toBe(true);

      const empSyncResult = await employeeSyncService.syncEmployees(true);
      expect(empSyncResult.success).toBe(true);

      // When: 부서 하이라키 (직원 포함) 조회
      const hierarchyWithEmployees =
        await departmentHierarchyWithEmployeesHandler.execute({});

      // Then: 하이라키 구조 및 직원 검증
      expect(hierarchyWithEmployees).toBeDefined();
      expect(Array.isArray(hierarchyWithEmployees)).toBe(true);
      expect(hierarchyWithEmployees.length).toBeGreaterThan(0);

      // 계층 구조 및 직원 재귀 검증
      const validateHierarchyWithEmployees = (
        depts: DepartmentHierarchyWithEmployeesDto[],
        expectedLevel: number,
      ): { totalDepts: number; totalEmployees: number } => {
        let totalDepts = 0;
        let totalEmployees = 0;

        for (const dept of depts) {
          totalDepts++;
          totalEmployees += dept.employeeCount;

          // 부서 정보 검증
          expect(dept).toHaveProperty('id');
          expect(dept).toHaveProperty('name');
          expect(dept).toHaveProperty('code');
          expect(dept).toHaveProperty('order');
          expect(dept).toHaveProperty('parentDepartmentId');
          expect(dept).toHaveProperty('level');
          expect(dept).toHaveProperty('depth');
          expect(dept).toHaveProperty('childrenCount');
          expect(dept).toHaveProperty('totalDescendants');
          expect(dept).toHaveProperty('employeeCount');
          expect(dept).toHaveProperty('employees');
          expect(dept).toHaveProperty('subDepartments');

          // 직원 수 검증
          expect(dept.employeeCount).toBe(dept.employees.length);
          expect(Array.isArray(dept.employees)).toBe(true);

          // 직원 정보 검증
          dept.employees.forEach((emp) => {
            expect(emp).toHaveProperty('id');
            expect(emp).toHaveProperty('employeeNumber');
            expect(emp).toHaveProperty('name');
            expect(emp).toHaveProperty('email');
            expect(emp).toHaveProperty('isActive');
          });

          // 하위 부서 재귀 검증
          if (dept.subDepartments.length > 0) {
            const childResult = validateHierarchyWithEmployees(
              dept.subDepartments,
              expectedLevel + 1,
            );
            totalDepts += childResult.totalDepts;
            totalEmployees += childResult.totalEmployees;
          }
        }

        return { totalDepts, totalEmployees };
      };

      const { totalDepts, totalEmployees } = validateHierarchyWithEmployees(
        hierarchyWithEmployees,
        0,
      );

      // 실제 DB 데이터와 비교
      const dbDepartments = await departmentRepository.find();
      const dbEmployees = await employeeRepository.find();

      expect(totalDepts).toBe(dbDepartments.length);
      expect(totalEmployees).toBe(dbEmployees.length);

      console.log(
        `✅ 부서 하이라키 (직원 포함) 검증 완료: ${totalDepts}개 부서, ${totalEmployees}명 직원`,
      );
    }, 120000);

    it('부서별 직원이 올바르게 매핑되어야 한다', async () => {
      // Given: 부서 및 직원 동기화 수행
      const deptSyncResult = await departmentSyncService.syncDepartments(true);
      expect(deptSyncResult.success).toBe(true);

      const empSyncResult = await employeeSyncService.syncEmployees(true);
      expect(empSyncResult.success).toBe(true);

      // When: 부서 하이라키 (직원 포함) 조회
      const hierarchyWithEmployees =
        await departmentHierarchyWithEmployeesHandler.execute({});

      // Then: 부서별 직원 매핑 검증
      const allDepts = new Map<string, DepartmentHierarchyWithEmployeesDto>();

      const collectAllDepartments = (
        depts: DepartmentHierarchyWithEmployeesDto[],
      ): void => {
        for (const dept of depts) {
          allDepts.set(dept.id, dept);
          if (dept.subDepartments.length > 0) {
            collectAllDepartments(dept.subDepartments);
          }
        }
      };

      collectAllDepartments(hierarchyWithEmployees);

      // 실제 DB의 직원과 부서 매핑 검증
      const dbEmployees = await employeeRepository.find();

      for (const emp of dbEmployees) {
        if (emp.departmentId) {
          // 직원의 departmentId는 부서의 externalId를 참조
          const dept = Array.from(allDepts.values()).find(
            (d) => d.id === emp.departmentId,
          );

          if (dept) {
            // 해당 부서의 직원 목록에 포함되어야 함
            const empInDept = dept.employees.find((e) => e.id === emp.id);
            expect(empInDept).toBeDefined();
            expect(empInDept?.employeeNumber).toBe(emp.employeeNumber);
            expect(empInDept?.name).toBe(emp.name);
          }
        }
      }

      console.log('✅ 부서별 직원 매핑 검증 완료');
    }, 120000);

    it('부서 하이라키의 계층 정보와 직원 수가 올바르게 계산되어야 한다', async () => {
      // Given: 부서 및 직원 동기화 수행
      const deptSyncResult = await departmentSyncService.syncDepartments(true);
      expect(deptSyncResult.success).toBe(true);

      const empSyncResult = await employeeSyncService.syncEmployees(true);
      expect(empSyncResult.success).toBe(true);

      // When: 부서 하이라키 (직원 포함) 조회
      const hierarchyWithEmployees =
        await departmentHierarchyWithEmployeesHandler.execute({});

      // Then: 계층 정보 및 직원 수 검증
      const validateHierarchyInfo = (
        depts: DepartmentHierarchyWithEmployeesDto[],
        currentLevel: number,
      ): number => {
        let maxDepth = 0;

        for (const dept of depts) {
          expect(dept.level).toBe(currentLevel);
          expect(dept.employeeCount).toBe(dept.employees.length);

          if (dept.subDepartments.length > 0) {
            const childDepth = validateHierarchyInfo(
              dept.subDepartments,
              currentLevel + 1,
            );
            expect(dept.depth).toBe(childDepth + 1);
            maxDepth = Math.max(maxDepth, childDepth + 1);

            // totalDescendants 계산 검증
            const calculatedTotalDescendants = dept.subDepartments.reduce(
              (sum, child) => sum + 1 + child.totalDescendants,
              0,
            );
            expect(dept.totalDescendants).toBe(calculatedTotalDescendants);
          } else {
            expect(dept.depth).toBe(0);
            expect(dept.totalDescendants).toBe(0);
          }
        }

        return maxDepth;
      };

      validateHierarchyInfo(hierarchyWithEmployees, 0);

      console.log('✅ 부서 하이라키 계층 정보 및 직원 수 검증 완료');
    }, 120000);
  });
});
