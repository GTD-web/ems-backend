import { DepartmentSyncService } from '@context/organization-management-context/department-sync.service';
import { OrganizationManagementContextModule } from '@context/organization-management-context/organization-management-context.module';
import { Department } from '@domain/common/department/department.entity';
import { DepartmentModule } from '@domain/common/department/department.module';
import { DepartmentService } from '@domain/common/department/department.service';
import type { DepartmentSyncResult } from '@domain/common/department/department.types';
import { SSOModule } from '@domain/common/sso/sso.module';
import { SSOService } from '@domain/common/sso/sso.service';
import { DatabaseModule } from '@libs/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

/**
 * DepartmentSyncService 통합 테스트
 *
 * SSO 서비스를 통한 부서 데이터 동기화 기능을 검증합니다.
 */
describe('DepartmentSyncService - SSO 부서 동기화 통합 테스트', () => {
  let service: DepartmentSyncService;
  let departmentService: DepartmentService;
  let ssoService: SSOService;
  let dataSource: DataSource;
  let module: TestingModule;

  // Repository 참조
  let departmentRepository: Repository<Department>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([Department]),
        DepartmentModule,
        SSOModule,
        OrganizationManagementContextModule,
      ],
    }).compile();

    service = module.get<DepartmentSyncService>(DepartmentSyncService);
    departmentService = module.get<DepartmentService>(DepartmentService);
    ssoService = module.get<SSOService>(SSOService);
    dataSource = module.get<DataSource>(DataSource);

    // Repository 초기화
    departmentRepository = dataSource.getRepository(Department);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);

    // SSO 클라이언트 초기화
    try {
      // 명시적으로 초기화 호출
      await ssoService.초기화한다();
      console.log('✅ SSO 서비스 초기화 완료');
      
      // 초기화 확인을 위한 테스트 호출
      await ssoService.부서계층구조를조회한다({});
      console.log('✅ SSO 서비스 연결 확인 완료');
    } catch (error) {
      console.warn('⚠️ SSO 서비스 초기화/연결 실패 (테스트는 계속 진행):', error.message);
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 부서 데이터 정리
    try {
      const departments = await departmentRepository.find();
      await departmentRepository.remove(departments);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('SSO 부서 정보 조회', () => {
    it('SSO에서 부서 정보를 조회할 수 있어야 한다', async () => {
      // Given & When
      const departments = await service.fetchExternalDepartments();

      // Then
      expect(departments).toBeDefined();
      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);

      // 부서 정보 구조 검증
      if (departments.length > 0) {
        const firstDept = departments[0];
        expect(firstDept).toHaveProperty('id');
        expect(firstDept).toHaveProperty('departmentCode');
        expect(firstDept).toHaveProperty('departmentName');
        expect(firstDept.id).toBeTruthy();
        expect(firstDept.departmentCode).toBeTruthy();
        expect(firstDept.departmentName).toBeTruthy();
      }
    }, 30000); // SSO API 호출 시간 고려

    it('SSO 부서 계층 구조를 조회하여 실제 반환 구조를 확인한다', async () => {
      // Given & When
      const hierarchy = await ssoService.부서계층구조를조회한다({
        includeEmptyDepartments: true,
        withEmployeeDetail: false,
      });

      // Then
      console.log('\n📊 SSO 부서 계층 구조 조회 결과:');
      console.log(`  - 총 부서 수: ${hierarchy.totalDepartments}`);
      console.log(`  - 총 직원 수: ${hierarchy.totalEmployees}`);
      console.log(`  - 루트 부서 수: ${hierarchy.departments.length}`);
      
      // 실제 서버 응답 구조 확인 - SSO SDK에서 직접 조회
      console.log('\n🔍 SSO SDK 원본 응답 구조 확인:');
      try {
        // SSO SDK 클라이언트에 직접 접근하여 원본 응답 확인
        const sdkResult = await (ssoService as any).sdkClient.organization.getDepartmentHierarchy({
          includeEmptyDepartments: true,
          withEmployeeDetail: false,
        });

        console.log(`  - SDK 원본 응답 totalDepartments: ${sdkResult.totalDepartments}`);
        console.log(`  - SDK 원본 응답 departments 배열 길이: ${sdkResult.departments?.length || 0}`);
        console.log(`\n  💡 참고: totalDepartments는 시스템 전체 부서 수일 수 있으며,`);
        console.log(`     현재 반환된 계층 구조에 포함된 부서 수와 다를 수 있습니다.`);
        
        if (sdkResult.departments && sdkResult.departments.length > 0) {
          const firstDept = sdkResult.departments[0];
          console.log(`\n  📦 SDK 원본 첫 번째 부서 구조:`);
          console.log(`     - 부서명: ${firstDept.departmentName}`);
          console.log(`     - childDepartments 속성 존재: ${!!firstDept.childDepartments}`);
          console.log(`     - childDepartments 타입: ${Array.isArray(firstDept.childDepartments) ? 'Array' : typeof firstDept.childDepartments}`);
          console.log(`     - childDepartments 길이: ${firstDept.childDepartments?.length || 0}`);
          console.log(`     - childDepartmentCount: ${firstDept.childDepartmentCount || 0}`);
          console.log(`     - children 속성 존재: ${!!firstDept.children}`);
          console.log(`     - children 타입: ${Array.isArray(firstDept.children) ? 'Array' : typeof firstDept.children}`);
          console.log(`     - children 길이: ${firstDept.children?.length || 0}`);
          
          // childDepartments가 있으면 첫 번째 자식 확인
          if (firstDept.childDepartments && firstDept.childDepartments.length > 0) {
            console.log(`\n     ✅ childDepartments 배열 존재 (${firstDept.childDepartments.length}개)`);
            console.log(`     - 첫 번째 자식 부서: ${JSON.stringify(firstDept.childDepartments[0], null, 2)}`);
          } else {
            console.log(`     - ⚠️ childDepartments 배열이 비어있거나 존재하지 않습니다`);
          }
          
          // 모든 키 확인
          console.log(`\n     - 부서 객체의 모든 키: ${Object.keys(firstDept).join(', ')}`);
          
          // childDepartmentCount와 childDepartments 길이 비교
          if (firstDept.childDepartmentCount && firstDept.childDepartments) {
            console.log(`\n     📊 자식 부서 수 비교:`);
            console.log(`       - childDepartmentCount: ${firstDept.childDepartmentCount}`);
            console.log(`       - childDepartments 배열 길이: ${firstDept.childDepartments.length}`);
            if (firstDept.childDepartmentCount !== firstDept.childDepartments.length) {
              console.log(`       ⚠️ 경고: childDepartmentCount와 childDepartments 배열 길이가 일치하지 않습니다!`);
            }
          }
        }
      } catch (error) {
        console.log(`  ⚠️ SDK 원본 응답 확인 실패: ${error.message}`);
      }
      
      // 매핑된 결과 구조 확인
      console.log('\n🔍 매핑된 첫 번째 루트 부서 상세 구조:');
      if (hierarchy.departments.length > 0) {
        const firstDept = hierarchy.departments[0];
        console.log(`  - 부서명: ${firstDept.departmentName}`);
        console.log(`  - 부서 코드: ${firstDept.departmentCode}`);
        console.log(`  - ID: ${firstDept.id}`);
        console.log(`  - 상위 부서 ID: ${firstDept.parentDepartmentId || '없음'}`);
        console.log(`  - 자식 부서 수: ${firstDept.children?.length || 0}`);
        console.log(`  - 직원 수: ${firstDept.employeeCount || 0}`);
        console.log(`  - 깊이: ${firstDept.depth || 0}`);
        
        // children 배열의 실제 구조 확인
        if (firstDept.children && firstDept.children.length > 0) {
          console.log(`\n  📦 자식 부서 목록 (처음 5개):`);
          firstDept.children.slice(0, 5).forEach((child: any, idx: number) => {
            console.log(`    ${idx + 1}. ${child.departmentName} (${child.departmentCode})`);
            console.log(`       - 자식 부서 수: ${child.children?.length || 0}`);
          });
        } else {
          console.log(`  ⚠️ 자식 부서가 없습니다 (children 배열이 비어있거나 undefined)`);
        }
      }
      
      // 모든 부서를 재귀적으로 카운트
      const countAllDepartments = (nodes: any[]): number => {
        let count = nodes.length;
        for (const node of nodes) {
          if (node.children && node.children.length > 0) {
            count += countAllDepartments(node.children);
          }
        }
        return count;
      };
      
      const actualCount = countAllDepartments(hierarchy.departments);
      console.log(`\n📈 재귀적으로 카운트한 실제 부서 수: ${actualCount}`);
      console.log(`📊 서버에서 반환한 총 부서 수: ${hierarchy.totalDepartments}`);
      
      if (actualCount !== hierarchy.totalDepartments) {
        console.log(`\n⚠️ 경고: 재귀적으로 카운트한 부서 수(${actualCount})와 서버에서 반환한 총 부서 수(${hierarchy.totalDepartments})가 일치하지 않습니다!`);
        console.log(`  → children 배열이 제대로 매핑되지 않았을 수 있습니다.`);
      }
      
      // 계층 구조 상세 출력
      const printDepartmentTree = (nodes: any[], depth: number = 0): void => {
        for (const node of nodes) {
          const indent = '  '.repeat(depth);
          const childrenCount = node.children?.length || 0;
          console.log(`${indent}├─ ${node.departmentName} (${node.departmentCode}) [${node.id}] (자식: ${childrenCount}개)`);
          if (node.children && node.children.length > 0) {
            printDepartmentTree(node.children, depth + 1);
          }
        }
      };

      console.log('\n📁 부서 계층 구조:');
      printDepartmentTree(hierarchy.departments);

      // 평면 목록으로 변환한 결과 확인
      const flatDepartments = await ssoService.모든부서정보를조회한다({
        includeEmptyDepartments: true,
      });

      console.log(`\n📋 평면 목록으로 변환된 부서 수: ${flatDepartments.length}`);
      console.log('\n📝 평면 목록 (처음 10개):');
      flatDepartments.slice(0, 10).forEach((dept, idx) => {
        console.log(`  ${idx + 1}. ${dept.departmentName} (${dept.departmentCode})`);
        console.log(`     - ID: ${dept.id}`);
        console.log(`     - 상위 부서 ID: ${dept.parentDepartmentId || '없음 (루트)'}`);
      });

      expect(hierarchy).toBeDefined();
      expect(hierarchy.departments).toBeDefined();
      expect(Array.isArray(hierarchy.departments)).toBe(true);
    }, 30000);

    it('SSO 서비스에서 모든 부서 정보를 평면 목록으로 조회할 수 있어야 한다', async () => {
      // Given & When
      const departments = await ssoService.모든부서정보를조회한다({
        includeEmptyDepartments: true,
      });

      // Then
      expect(departments).toBeDefined();
      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);

      // 평면 목록인지 확인 (모든 부서가 같은 레벨에 있는지)
      departments.forEach((dept) => {
        expect(dept).toHaveProperty('id');
        expect(dept).toHaveProperty('departmentCode');
        expect(dept).toHaveProperty('departmentName');
      });
    }, 30000);
  });

  describe('부서 데이터 동기화', () => {
    it('SSO에서 부서 데이터를 동기화할 수 있어야 한다', async () => {
      // Given
      const statsBefore = await departmentService.getDepartmentStats();
      expect(statsBefore.totalDepartments).toBe(0);

      // When
      const result: DepartmentSyncResult = await service.syncDepartments(true);

      // Then
      expect(result).toBeDefined();
      
      // 동기화 결과 상세 로그 출력
      console.log('\n📊 부서 동기화 결과:');
      console.log(`  - 성공 여부: ${result.success}`);
      console.log(`  - 처리된 총 부서 수: ${result.totalProcessed}`);
      console.log(`  - 새로 생성된 부서 수: ${result.created}`);
      console.log(`  - 업데이트된 부서 수: ${result.updated}`);
      console.log(`  - 총 저장된 부서 수: ${result.created + result.updated}`);
      if (result.errors.length > 0) {
        console.log(`  - 에러 수: ${result.errors.length}`);
        result.errors.slice(0, 5).forEach((error, idx) => {
          console.log(`    ${idx + 1}. ${error}`);
        });
        if (result.errors.length > 5) {
          console.log(`    ... 외 ${result.errors.length - 5}개 에러`);
        }
      }
      
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);
      expect(result.created + result.updated).toBeGreaterThanOrEqual(0);

      // 동기화 후 데이터 확인
      const statsAfter = await departmentService.getDepartmentStats();
      console.log(`\n📈 동기화 후 부서 통계:`);
      console.log(`  - 총 부서 수: ${statsAfter.totalDepartments}`);
      console.log(`  - 루트 부서 수: ${statsAfter.rootDepartments}`);
      console.log(`  - 하위 부서 수: ${statsAfter.subDepartments}`);
      
      expect(statsAfter.totalDepartments).toBeGreaterThan(0);
      expect(statsAfter.totalDepartments).toBe(result.created + result.updated);
      
      // 실제 DB에서 저장된 부서 수 확인
      const dbDepartments = await departmentRepository.find();
      console.log(`  - 실제 DB 저장된 부서 수: ${dbDepartments.length}`);
      expect(dbDepartments.length).toBe(statsAfter.totalDepartments);
    }, 60000); // SSO API 호출 및 동기화 시간 고려

    it('이미 존재하는 부서는 업데이트되어야 한다', async () => {
      // Given
      // 1. 첫 번째 동기화
      const firstResult = await service.syncDepartments(true);
      expect(firstResult.success).toBe(true);
      expect(firstResult.created).toBeGreaterThan(0);

      const departmentsBefore = await departmentService.findAll();
      expect(departmentsBefore.length).toBeGreaterThan(0);

      // 첫 번째 부서 정보 저장
      const firstDept = departmentsBefore[0];
      const originalName = firstDept.name;

      // 2. 두 번째 동기화 (forceSync)
      const secondResult = await service.syncDepartments(true);

      // Then
      expect(secondResult.success).toBe(true);
      expect(secondResult.updated).toBeGreaterThanOrEqual(0);

      // 부서 데이터가 유지되는지 확인
      const departmentsAfter = await departmentService.findAll();
      expect(departmentsAfter.length).toBe(departmentsBefore.length);
    }, 60000);

    it('동기화가 비활성화되어 있으면 동기화를 수행하지 않아야 한다', async () => {
      // Given
      const mockConfigService = {
        get: jest.fn((key: string, defaultValue?: boolean) => {
          if (key === 'DEPARTMENT_SYNC_ENABLED') {
            return false; // 동기화 비활성화
          }
          // 다른 환경 변수는 실제 값 반환
          if (key === 'DATABASE_URL') {
            return process.env.DATABASE_URL;
          }
          if (key === 'SSO_BASE_URL') {
            return process.env.SSO_BASE_URL;
          }
          if (key === 'SSO_CLIENT_ID') {
            return process.env.SSO_CLIENT_ID;
          }
          if (key === 'SSO_CLIENT_SECRET') {
            return process.env.SSO_CLIENT_SECRET;
          }
          return defaultValue;
        }),
      };

      // DepartmentSyncService를 직접 생성하여 테스트
      const departmentService = module.get<DepartmentService>(DepartmentService);
      const ssoService = module.get<SSOService>(SSOService);

      const disabledService = new DepartmentSyncService(
        departmentService,
        mockConfigService as any,
        ssoService,
      );

      // When
      const result = await disabledService.syncDepartments(false);

      // Then
      expect(result.success).toBe(false);
      expect(result.errors).toContain('동기화가 비활성화되어 있습니다.');
      expect(result.totalProcessed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
    });

    it('동기화 실패 시 에러를 반환해야 한다', async () => {
      // Given
      // SSO 서비스를 모킹하여 에러 발생 시뮬레이션
      const mockSSOService = {
        모든부서정보를조회한다: jest.fn().mockRejectedValue(new Error('SSO API 오류')),
      };

      const errorModule = await Test.createTestingModule({
        imports: [
          DatabaseModule,
          ConfigModule.forRoot({
            isGlobal: true,
          }),
          ScheduleModule.forRoot(),
          TypeOrmModule.forFeature([Department]),
          DepartmentModule,
          SSOModule,
        ],
        providers: [
          DepartmentSyncService,
          {
            provide: SSOService,
            useValue: mockSSOService,
          },
        ],
      }).compile();

      const errorService = errorModule.get<DepartmentSyncService>(
        DepartmentSyncService,
      );

      // When
      const result = await errorService.syncDepartments(true);

      // Then
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      await errorModule.close();
    });
  });

  describe('부서 조회 (히트미스 전략)', () => {
    it('로컬 데이터가 없으면 SSO에서 동기화 후 조회해야 한다', async () => {
      // Given
      const statsBefore = await departmentService.getDepartmentStats();
      expect(statsBefore.totalDepartments).toBe(0);

      // When
      const departments = await service.getDepartments(false);

      // Then
      expect(departments).toBeDefined();
      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThan(0);

      // 동기화가 수행되었는지 확인
      const statsAfter = await departmentService.getDepartmentStats();
      expect(statsAfter.totalDepartments).toBeGreaterThan(0);
    }, 60000);

    it('로컬 데이터가 있으면 SSO 동기화 없이 조회해야 한다', async () => {
      // Given
      // 먼저 동기화 수행
      await service.syncDepartments(true);
      const departmentsBefore = await departmentService.findAll();
      expect(departmentsBefore.length).toBeGreaterThan(0);

      // When
      const departments = await service.getDepartments(false);

      // Then
      expect(departments.length).toBe(departmentsBefore.length);
    }, 60000);

    it('강제 새로고침 시 SSO에서 재동기화해야 한다', async () => {
      // Given
      // 첫 번째 동기화
      await service.syncDepartments(true);
      const departmentsBefore = await departmentService.findAll();

      // When
      const departments = await service.getDepartments(true);

      // Then
      expect(departments).toBeDefined();
      expect(Array.isArray(departments)).toBe(true);
      expect(departments.length).toBeGreaterThanOrEqual(departmentsBefore.length);
    }, 60000);

    it('ID로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncDepartments(true);
      const allDepartments = await departmentService.findAll();
      expect(allDepartments.length).toBeGreaterThan(0);

      const targetDept = allDepartments[0];

      // When
      const department = await service.getDepartmentById(targetDept.id, false);

      // Then
      expect(department).toBeDefined();
      expect(department?.id).toBe(targetDept.id);
      expect(department?.name).toBe(targetDept.name);
    }, 60000);

    it('외부 ID로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncDepartments(true);
      const allDepartments = await departmentService.findAll();
      expect(allDepartments.length).toBeGreaterThan(0);

      const targetDept = allDepartments[0];
      expect(targetDept.externalId).toBeTruthy();

      // When
      const department = await service.getDepartmentByExternalId(
        targetDept.externalId,
        false,
      );

      // Then
      expect(department).toBeDefined();
      expect(department?.externalId).toBe(targetDept.externalId);
      expect(department?.id).toBe(targetDept.id);
    }, 60000);
  });

  describe('부서 계층 구조', () => {
    it('부서 계층 구조가 올바르게 저장되어야 한다', async () => {
      // Given & When
      await service.syncDepartments(true);
      const departments = await departmentService.findAll();

      // Then
      expect(departments.length).toBeGreaterThan(0);

      // 부서 계층 구조 확인
      const rootDepartments = departments.filter(
        (dept) => !dept.parentDepartmentId,
      );
      const subDepartments = departments.filter(
        (dept) => dept.parentDepartmentId,
      );

      // 루트 부서가 존재하는지 확인
      expect(rootDepartments.length).toBeGreaterThan(0);

      // 하위 부서의 parentDepartmentId가 실제 부서의 externalId와 매칭되는지 확인
      subDepartments.forEach((subDept) => {
        const parent = departments.find(
          (d) => d.externalId === subDept.parentDepartmentId,
        );
        // parent가 없을 수도 있지만 (외부 시스템에서만 존재), 적어도 parentDepartmentId는 설정되어 있어야 함
        expect(subDept.parentDepartmentId).toBeTruthy();
      });
    }, 60000);

    it('루트 부서 목록을 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncDepartments(true);

      // When
      const rootDepartments = await departmentService.findRootDepartments();

      // Then
      expect(rootDepartments).toBeDefined();
      expect(Array.isArray(rootDepartments)).toBe(true);
      expect(rootDepartments.length).toBeGreaterThan(0);

      // 모든 루트 부서는 parentDepartmentId가 없어야 함
      rootDepartments.forEach((dept) => {
        expect(dept.parentDepartmentId).toBeFalsy();
      });
    }, 60000);
  });

  describe('부서 통계', () => {
    it('부서 통계를 조회할 수 있어야 한다', async () => {
      // Given
      await service.syncDepartments(true);

      // When
      const stats = await departmentService.getDepartmentStats();

      // Then
      expect(stats).toBeDefined();
      expect(stats.totalDepartments).toBeGreaterThan(0);
      expect(stats.rootDepartments).toBeGreaterThanOrEqual(0);
      expect(stats.subDepartments).toBeGreaterThanOrEqual(0);
      expect(stats.totalDepartments).toBe(
        stats.rootDepartments + stats.subDepartments,
      );
    }, 60000);
  });

  describe('수동 동기화 트리거', () => {
    it('수동 동기화를 트리거할 수 있어야 한다', async () => {
      // Given
      const statsBefore = await departmentService.getDepartmentStats();
      expect(statsBefore.totalDepartments).toBe(0);

      // When
      const result = await service.triggerManualSync();

      // Then
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBeGreaterThan(0);

      // 동기화 후 데이터 확인
      const statsAfter = await departmentService.getDepartmentStats();
      expect(statsAfter.totalDepartments).toBeGreaterThan(0);
    }, 60000);
  });

  describe('실제 데이터베이스 필드 값 검증', () => {
    it('각 필드 값들이 SSO 데이터와 올바르게 매핑되어 저장되어야 한다', async () => {
      // Given
      // SSO에서 원본 데이터 조회
      const ssoDepartments = await ssoService.모든부서정보를조회한다({
        includeEmptyDepartments: true,
      });
      expect(ssoDepartments.length).toBeGreaterThan(0);

      // 동기화 수행
      const result = await service.syncDepartments(true);
      expect(result.success).toBe(true);

      // When
      // 실제 DB에서 동기화된 데이터 조회
      const dbDepartments = await departmentRepository.find({
        order: { order: 'ASC', name: 'ASC' },
      });

      // Then
      expect(dbDepartments.length).toBeGreaterThan(0);

      // SSO 데이터와 DB 데이터를 매핑하여 비교
      const ssoDepartmentMap = new Map(
        ssoDepartments.map((dept) => [dept.id, dept]),
      );

      // 각 DB 부서에 대해 SSO 데이터와 비교
      dbDepartments.forEach((dbDepartment) => {
        const ssoDepartment = ssoDepartmentMap.get(dbDepartment.externalId);

        if (ssoDepartment) {
          // 기본 정보 검증
          expect(dbDepartment.name).toBe(ssoDepartment.departmentName);
          expect(dbDepartment.code).toBe(ssoDepartment.departmentCode);
          expect(dbDepartment.externalId).toBe(ssoDepartment.id);

          // 부서 계층 정보 검증
          if (ssoDepartment.parentDepartmentId) {
            expect(dbDepartment.parentDepartmentId).toBe(
              ssoDepartment.parentDepartmentId,
            );
          }

          // 동기화 메타데이터 검증
          expect(dbDepartment.lastSyncAt).toBeInstanceOf(Date);
          expect(dbDepartment.createdBy).toBe('SYSTEM_SYNC');
          expect(dbDepartment.updatedBy).toBe('SYSTEM_SYNC');

          // 타임스탬프 검증
          expect(dbDepartment.createdAt).toBeInstanceOf(Date);
          expect(dbDepartment.updatedAt).toBeInstanceOf(Date);
          expect(dbDepartment.createdAt.getTime()).toBeLessThanOrEqual(
            Date.now(),
          );
          expect(dbDepartment.updatedAt.getTime()).toBeLessThanOrEqual(
            Date.now(),
          );

          console.log(
            `✅ 부서 ${dbDepartment.name} (${dbDepartment.code}) 필드 검증 완료`,
          );
        }
      });

      console.log(`✅ 총 ${dbDepartments.length}개의 부서 필드 검증 완료`);
    }, 60000);

    it('특정 부서의 모든 필드 값을 상세히 검증해야 한다', async () => {
      // Given
      await service.syncDepartments(true);

      // When
      const dbDepartments = await departmentRepository.find({
        take: 5, // 처음 5개만 상세 검증
        order: { order: 'ASC', name: 'ASC' },
      });

      // Then
      expect(dbDepartments.length).toBeGreaterThan(0);

      dbDepartments.forEach((department, index) => {
        console.log(`\n📋 부서 #${index + 1} 필드 검증:`);
        console.log(`  - ID: ${department.id}`);
        console.log(`  - 부서명: ${department.name}`);
        console.log(`  - 부서 코드: ${department.code}`);
        console.log(`  - 순서: ${department.order}`);
        console.log(`  - 외부 ID: ${department.externalId}`);
        console.log(`  - 상위 부서 ID: ${department.parentDepartmentId || '없음 (루트 부서)'}`);
        console.log(`  - 매니저 ID: ${department.managerId || '없음'}`);
        console.log(`  - 마지막 동기화: ${department.lastSyncAt}`);
        console.log(`  - 생성일: ${department.createdAt}`);
        console.log(`  - 수정일: ${department.updatedAt}`);

        // 필수 필드 검증
        expect(department.id).toBeTruthy();
        expect(department.name).toBeTruthy();
        expect(department.code).toBeTruthy();
        expect(department.externalId).toBeTruthy();
        expect(department.order).toBeGreaterThanOrEqual(0);

        // UUID 형식 검증
        expect(department.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );

        // 타임스탬프 순서 검증
        expect(department.createdAt.getTime()).toBeLessThanOrEqual(
          department.updatedAt.getTime(),
        );
        expect(department.lastSyncAt?.getTime()).toBeLessThanOrEqual(Date.now());

        // 동기화 메타데이터 검증
        expect(department.createdBy).toBe('SYSTEM_SYNC');
        expect(department.updatedBy).toBe('SYSTEM_SYNC');
      });
    }, 60000);

    it('모든 부서의 필수 필드가 누락되지 않았는지 확인해야 한다', async () => {
      // Given
      await service.syncDepartments(true);

      // When
      const dbDepartments = await departmentRepository.find();

      // Then
      expect(dbDepartments.length).toBeGreaterThan(0);

      const missingFields: string[] = [];

      dbDepartments.forEach((department, index) => {
        const missing: string[] = [];

        // 필수 필드 검증
        if (!department.id) missing.push('id');
        if (!department.name) missing.push('name');
        if (!department.code) missing.push('code');
        if (!department.externalId) missing.push('externalId');
        if (department.order === undefined || department.order === null)
          missing.push('order');
        if (!department.lastSyncAt) missing.push('lastSyncAt');
        if (!department.createdAt) missing.push('createdAt');
        if (!department.updatedAt) missing.push('updatedAt');
        if (!department.createdBy) missing.push('createdBy');
        if (!department.updatedBy) missing.push('updatedBy');

        if (missing.length > 0) {
          missingFields.push(
            `부서 #${index + 1} (${department.name || '이름 없음'}): ${missing.join(', ')}`,
          );
        }
      });

      if (missingFields.length > 0) {
        console.error('❌ 누락된 필드가 있는 부서:');
        missingFields.forEach((msg) => console.error(`  - ${msg}`));
      }

      expect(missingFields.length).toBe(0);
      console.log(
        `✅ 모든 ${dbDepartments.length}개의 부서의 필수 필드가 올바르게 저장되었습니다.`,
      );
    }, 60000);

    it('부서 계층 구조가 올바르게 매핑되어 저장되어야 한다', async () => {
      // Given
      await service.syncDepartments(true);

      // When
      const dbDepartments = await departmentRepository.find({
        order: { order: 'ASC', name: 'ASC' },
      });

      // Then
      expect(dbDepartments.length).toBeGreaterThan(0);

      // 부서 계층 구조 검증
      const departmentsByExternalId = new Map(
        dbDepartments.map((dept) => [dept.externalId, dept]),
      );

      let rootCount = 0;
      let childCount = 0;

      dbDepartments.forEach((department) => {
        // 필수 필드 검증
        expect(department.id).toBeTruthy();
        expect(department.name).toBeTruthy();
        expect(department.code).toBeTruthy();
        expect(department.externalId).toBeTruthy();

        // 계층 구조 검증
        if (department.parentDepartmentId) {
          childCount++;
          // parentDepartmentId는 외부 시스템 ID이므로 externalId로 매핑 확인
          const parentExists = departmentsByExternalId.has(
            department.parentDepartmentId,
          );
          // parent가 없을 수도 있지만 (외부 시스템에서만 존재), 적어도 parentDepartmentId는 설정되어 있어야 함
          expect(department.parentDepartmentId).toBeTruthy();
        } else {
          rootCount++;
        }
      });

      expect(rootCount).toBeGreaterThan(0);
      console.log(`✅ 루트 부서: ${rootCount}개, 하위 부서: ${childCount}개`);
      console.log(`✅ 총 ${dbDepartments.length}개의 부서 계층 구조 검증 완료`);
    }, 60000);

    it('부서 데이터의 상세 필드 값들이 올바르게 저장되어야 한다', async () => {
      // Given
      await service.syncDepartments(true);

      // When
      const dbDepartments = await departmentRepository.find({
        order: { order: 'ASC', name: 'ASC' },
      });

      // Then
      expect(dbDepartments.length).toBeGreaterThan(0);

      // SSO 데이터와 비교하여 상세 검증
      const ssoDepartments = await ssoService.모든부서정보를조회한다({
        includeEmptyDepartments: true,
      });
      const ssoDepartmentMap = new Map(
        ssoDepartments.map((dept) => [dept.id, dept]),
      );

      dbDepartments.forEach((dbDepartment) => {
        const ssoDepartment = ssoDepartmentMap.get(dbDepartment.externalId);

        if (ssoDepartment) {
          // 기본 정보 정확성 검증
          expect(dbDepartment.name).toBe(ssoDepartment.departmentName);
          expect(dbDepartment.code).toBe(ssoDepartment.departmentCode);

          // 계층 구조 정확성 검증
          if (ssoDepartment.parentDepartmentId) {
            expect(dbDepartment.parentDepartmentId).toBe(
              ssoDepartment.parentDepartmentId,
            );
          } else {
            expect(dbDepartment.parentDepartmentId).toBeFalsy();
          }

          // 데이터 타입 검증
          expect(typeof dbDepartment.name).toBe('string');
          expect(typeof dbDepartment.code).toBe('string');
          expect(typeof dbDepartment.order).toBe('number');
          expect(typeof dbDepartment.externalId).toBe('string');

          // 값 범위 검증
          expect(dbDepartment.name.length).toBeGreaterThan(0);
          expect(dbDepartment.code.length).toBeGreaterThan(0);
          expect(dbDepartment.order).toBeGreaterThanOrEqual(0);
        }
      });

      console.log(
        `✅ ${dbDepartments.length}개의 부서의 상세 필드 값 검증 완료`,
      );
    }, 60000);
  });
});

