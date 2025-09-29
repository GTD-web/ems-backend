import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { Department } from '../../domain/common/department/department.entity';
import { DepartmentRepository } from '../../domain/common/department/department.repository';
import { Employee } from '../../domain/common/employee/employee.entity';
import { EmployeeRepository } from '../../domain/common/employee/employee.repository';
import { OrganizationManagementService } from './organization-management.service';

describe('OrganizationManagementService Integration Tests', () => {
  let service: OrganizationManagementService;
  let dataSource: DataSource;
  let module: TestingModule;
  let departmentRepository: DepartmentRepository;
  let employeeRepository: EmployeeRepository;

  const testUserId = 'test-user-123';
  const adminUserId = 'admin-456';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<OrganizationManagementService>(
      OrganizationManagementService,
    );
    dataSource = module.get<DataSource>(DataSource);
    departmentRepository =
      module.get<DepartmentRepository>(DepartmentRepository);
    employeeRepository = module.get<EmployeeRepository>(EmployeeRepository);

    await module.init();
    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  describe('부서 관리 (CQRS)', () => {
    let testDepartments: Department[];

    beforeEach(async () => {
      // 테스트용 부서 데이터 생성
      testDepartments = [];

      // 루트 부서 생성
      const rootDept = new Department();
      Object.assign(rootDept, {
        name: '루미르',
        code: 'LUMIR',
        order: 1,
        externalId: 'ext-root-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      rootDept.생성자설정한다(adminUserId);
      const savedRootDept = await departmentRepository.save(rootDept);
      testDepartments.push(savedRootDept);

      // 하위 부서들 생성
      const devDept = new Department();
      Object.assign(devDept, {
        name: '개발팀',
        code: 'DEV',
        order: 1,
        parentDepartmentId: savedRootDept.id,
        managerId: 'manager-dev-001',
        externalId: 'ext-dev-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      devDept.생성자설정한다(adminUserId);
      const savedDevDept = await departmentRepository.save(devDept);
      testDepartments.push(savedDevDept);

      const hrDept = new Department();
      Object.assign(hrDept, {
        name: '인사팀',
        code: 'HR',
        order: 2,
        parentDepartmentId: savedRootDept.id,
        managerId: 'manager-hr-001',
        externalId: 'ext-hr-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      hrDept.생성자설정한다(adminUserId);
      const savedHrDept = await departmentRepository.save(hrDept);
      testDepartments.push(savedHrDept);

      // 개발팀 하위 부서
      const frontendDept = new Department();
      Object.assign(frontendDept, {
        name: '프론트엔드팀',
        code: 'FRONTEND',
        order: 1,
        parentDepartmentId: savedDevDept.id,
        managerId: 'manager-frontend-001',
        externalId: 'ext-frontend-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      frontendDept.생성자설정한다(adminUserId);
      const savedFrontendDept = await departmentRepository.save(frontendDept);
      testDepartments.push(savedFrontendDept);
    });

    describe('전체부서목록조회', () => {
      it('모든 부서를 조회할 수 있다', async () => {
        // When
        const result = await service.전체부서목록조회();

        // Then
        expect(result).toHaveLength(4);
        expect(result.map((d) => d.name)).toContain('루미르');
        expect(result.map((d) => d.name)).toContain('개발팀');
        expect(result.map((d) => d.name)).toContain('인사팀');
        expect(result.map((d) => d.name)).toContain('프론트엔드팀');
      });

      it('부서 정보가 올바르게 변환된다', async () => {
        // When
        const result = await service.전체부서목록조회();

        // Then
        const rootDept = result.find((d) => d.name === '루미르');
        expect(rootDept).toBeDefined();
        expect(rootDept!.code).toBe('LUMIR');
        expect(rootDept!.order).toBe(1);
        expect(rootDept!.externalId).toBe('ext-root-001');
      });
    });

    describe('부서정보조회', () => {
      it('특정 부서 정보를 조회할 수 있다', async () => {
        // Given
        const devDept = testDepartments.find((d) => d.name === '개발팀')!;

        // When
        const result = await service.부서정보조회(devDept.id);

        // Then
        expect(result).toBeDefined();
        expect(result!.name).toBe('개발팀');
        expect(result!.code).toBe('DEV');
        expect(result!.managerId).toBe('manager-dev-001');
      });

      it('존재하지 않는 부서 ID로 조회 시 null을 반환한다', async () => {
        // When
        const result = await service.부서정보조회(
          '00000000-0000-0000-0000-000000000000',
        );

        // Then
        expect(result).toBeNull();
      });
    });

    describe('하위부서목록조회', () => {
      it('특정 부서의 하위 부서들을 조회할 수 있다', async () => {
        // Given
        const rootDept = testDepartments.find((d) => d.name === '루미르')!;

        // When
        const result = await service.하위부서목록조회(rootDept.id);

        // Then
        expect(result).toHaveLength(2);
        expect(result.map((d) => d.name)).toContain('개발팀');
        expect(result.map((d) => d.name)).toContain('인사팀');
      });

      it('하위 부서가 없는 경우 빈 배열을 반환한다', async () => {
        // Given
        const hrDept = testDepartments.find((d) => d.name === '인사팀')!;

        // When
        const result = await service.하위부서목록조회(hrDept.id);

        // Then
        expect(result).toHaveLength(0);
      });
    });

    describe('상위부서조회', () => {
      it('특정 부서의 상위 부서를 조회할 수 있다', async () => {
        // Given
        const devDept = testDepartments.find((d) => d.name === '개발팀')!;

        // When
        const result = await service.상위부서조회(devDept.id);

        // Then
        expect(result).toBeDefined();
        expect(result!.name).toBe('루미르');
        expect(result!.code).toBe('LUMIR');
      });

      it('루트 부서의 경우 null을 반환한다', async () => {
        // Given
        const rootDept = testDepartments.find((d) => d.name === '루미르')!;

        // When
        const result = await service.상위부서조회(rootDept.id);

        // Then
        expect(result).toBeNull();
      });
    });
  });

  describe('직원 관리 (CQRS)', () => {
    let testDepartments: Department[];
    let testEmployees: Employee[];

    beforeEach(async () => {
      // 테스트용 부서 생성
      const rootDept = new Department();
      Object.assign(rootDept, {
        name: '루미르',
        code: 'LUMIR',
        order: 1,
        externalId: 'ext-root-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      rootDept.생성자설정한다(adminUserId);
      const savedRootDept = await departmentRepository.save(rootDept);

      const devDept = new Department();
      Object.assign(devDept, {
        name: '개발팀',
        code: 'DEV',
        order: 1,
        parentDepartmentId: savedRootDept.id,
        externalId: 'ext-dev-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      devDept.생성자설정한다(adminUserId);
      const savedDevDept = await departmentRepository.save(devDept);

      testDepartments = [savedRootDept, savedDevDept];

      // 테스트용 직원 데이터 생성
      testEmployees = [];

      // 팀장 직원
      const manager = new Employee();
      Object.assign(manager, {
        employeeNumber: 'EMP001',
        name: '김팀장',
        email: 'manager@lumir.com',
        phoneNumber: '010-1234-5678',
        status: '재직중',
        departmentId: savedDevDept.id,
        externalId: 'ext-emp-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      manager.생성자설정한다(adminUserId);
      const savedManager = await employeeRepository.save(manager);
      testEmployees.push(savedManager);

      // 일반 직원들
      const employee1 = new Employee();
      Object.assign(employee1, {
        employeeNumber: 'EMP002',
        name: '이개발',
        email: 'dev1@lumir.com',
        phoneNumber: '010-2345-6789',
        status: '재직중',
        departmentId: savedDevDept.id,
        managerId: savedManager.id,
        externalId: 'ext-emp-002',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      employee1.생성자설정한다(adminUserId);
      const savedEmployee1 = await employeeRepository.save(employee1);
      testEmployees.push(savedEmployee1);

      const employee2 = new Employee();
      Object.assign(employee2, {
        employeeNumber: 'EMP003',
        name: '박프론트',
        email: 'frontend@lumir.com',
        phoneNumber: '010-3456-7890',
        status: '재직중',
        departmentId: savedDevDept.id,
        managerId: savedManager.id,
        externalId: 'ext-emp-003',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      employee2.생성자설정한다(adminUserId);
      const savedEmployee2 = await employeeRepository.save(employee2);
      testEmployees.push(savedEmployee2);

      // 휴직 중인 직원
      const employee3 = new Employee();
      Object.assign(employee3, {
        employeeNumber: 'EMP004',
        name: '최휴직',
        email: 'leave@lumir.com',
        status: '휴직중',
        departmentId: savedDevDept.id,
        externalId: 'ext-emp-004',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      employee3.생성자설정한다(adminUserId);
      const savedEmployee3 = await employeeRepository.save(employee3);
      testEmployees.push(savedEmployee3);
    });

    describe('전체직원목록조회', () => {
      it('모든 직원을 조회할 수 있다', async () => {
        // When
        const result = await service.전체직원목록조회();

        // Then
        expect(result).toHaveLength(4);
        expect(result.map((e) => e.name)).toContain('김팀장');
        expect(result.map((e) => e.name)).toContain('이개발');
        expect(result.map((e) => e.name)).toContain('박프론트');
        expect(result.map((e) => e.name)).toContain('최휴직');
      });

      it('직원 정보가 올바르게 변환된다', async () => {
        // When
        const result = await service.전체직원목록조회();

        // Then
        const manager = result.find((e) => e.name === '김팀장');
        expect(manager).toBeDefined();
        expect(manager!.employeeNumber).toBe('EMP001');
        expect(manager!.email).toBe('manager@lumir.com');
        expect(manager!.status).toBe('재직중');
      });
    });

    describe('직원정보조회', () => {
      it('특정 직원 정보를 조회할 수 있다', async () => {
        // Given
        const manager = testEmployees.find((e) => e.name === '김팀장')!;

        // When
        const result = await service.직원정보조회(manager.id);

        // Then
        expect(result).toBeDefined();
        expect(result!.name).toBe('김팀장');
        expect(result!.employeeNumber).toBe('EMP001');
        expect(result!.email).toBe('manager@lumir.com');
      });

      it('존재하지 않는 직원 ID로 조회 시 null을 반환한다', async () => {
        // When
        const result = await service.직원정보조회(
          '00000000-0000-0000-0000-000000000000',
        );

        // Then
        expect(result).toBeNull();
      });
    });

    describe('부서별직원목록조회', () => {
      it('특정 부서의 직원들을 조회할 수 있다', async () => {
        // Given
        const devDept = testDepartments.find((d) => d.name === '개발팀')!;

        // When
        const result = await service.부서별직원목록조회(devDept.id);

        // Then
        expect(result).toHaveLength(4);
        expect(result.map((e) => e.name)).toContain('김팀장');
        expect(result.map((e) => e.name)).toContain('이개발');
        expect(result.map((e) => e.name)).toContain('박프론트');
        expect(result.map((e) => e.name)).toContain('최휴직');
      });

      it('직원이 없는 부서의 경우 빈 배열을 반환한다', async () => {
        // Given
        const rootDept = testDepartments.find((d) => d.name === '루미르')!;

        // When
        const result = await service.부서별직원목록조회(rootDept.id);

        // Then
        expect(result).toHaveLength(0);
      });
    });

    describe('활성직원목록조회', () => {
      it('재직 중인 직원들만 조회할 수 있다', async () => {
        // When
        const result = await service.활성직원목록조회();

        // Then
        expect(result).toHaveLength(3);
        expect(result.map((e) => e.name)).toContain('김팀장');
        expect(result.map((e) => e.name)).toContain('이개발');
        expect(result.map((e) => e.name)).toContain('박프론트');
        expect(result.map((e) => e.name)).not.toContain('최휴직');
        expect(result.every((e) => e.status === '재직중')).toBe(true);
      });
    });

    describe('상급자조회', () => {
      it('직원의 상급자를 조회할 수 있다', async () => {
        // Given
        const employee = testEmployees.find((e) => e.name === '이개발')!;

        // When
        const result = await service.상급자조회(employee.id);

        // Then
        expect(result).toBeDefined();
        expect(result!.name).toBe('김팀장');
        expect(result!.employeeNumber).toBe('EMP001');
      });

      it('상급자가 없는 경우 null을 반환한다', async () => {
        // Given
        const manager = testEmployees.find((e) => e.name === '김팀장')!;

        // When
        const result = await service.상급자조회(manager.id);

        // Then
        expect(result).toBeNull();
      });
    });

    describe('하급자목록조회', () => {
      it('직원의 하급자들을 조회할 수 있다', async () => {
        // Given
        const manager = testEmployees.find((e) => e.name === '김팀장')!;

        // When
        const result = await service.하급자목록조회(manager.id);

        // Then
        expect(result).toHaveLength(2);
        expect(result.map((e) => e.name)).toContain('이개발');
        expect(result.map((e) => e.name)).toContain('박프론트');
      });

      it('하급자가 없는 경우 빈 배열을 반환한다', async () => {
        // Given
        const employee = testEmployees.find((e) => e.name === '이개발')!;

        // When
        const result = await service.하급자목록조회(employee.id);

        // Then
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('조직도 관리 (CQRS)', () => {
    beforeEach(async () => {
      // 복잡한 조직 구조 생성
      const departments: Department[] = [];
      const employees: Employee[] = [];

      // 루트 부서
      const rootDept = new Department();
      Object.assign(rootDept, {
        name: '루미르',
        code: 'LUMIR',
        order: 1,
        externalId: 'ext-root-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      rootDept.생성자설정한다(adminUserId);
      const savedRootDept = await departmentRepository.save(rootDept);
      departments.push(savedRootDept);

      // 개발본부
      const devDivision = new Department();
      Object.assign(devDivision, {
        name: '개발본부',
        code: 'DEV_DIV',
        order: 1,
        parentDepartmentId: savedRootDept.id,
        externalId: 'ext-dev-div-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      devDivision.생성자설정한다(adminUserId);
      const savedDevDivision = await departmentRepository.save(devDivision);
      departments.push(savedDevDivision);

      // 프론트엔드팀
      const frontendTeam = new Department();
      Object.assign(frontendTeam, {
        name: '프론트엔드팀',
        code: 'FRONTEND',
        order: 1,
        parentDepartmentId: savedDevDivision.id,
        externalId: 'ext-frontend-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      frontendTeam.생성자설정한다(adminUserId);
      const savedFrontendTeam = await departmentRepository.save(frontendTeam);
      departments.push(savedFrontendTeam);

      // 백엔드팀
      const backendTeam = new Department();
      Object.assign(backendTeam, {
        name: '백엔드팀',
        code: 'BACKEND',
        order: 2,
        parentDepartmentId: savedDevDivision.id,
        externalId: 'ext-backend-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      backendTeam.생성자설정한다(adminUserId);
      const savedBackendTeam = await departmentRepository.save(backendTeam);
      departments.push(savedBackendTeam);

      // 인사팀
      const hrTeam = new Department();
      Object.assign(hrTeam, {
        name: '인사팀',
        code: 'HR',
        order: 2,
        parentDepartmentId: savedRootDept.id,
        externalId: 'ext-hr-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      hrTeam.생성자설정한다(adminUserId);
      const savedHrTeam = await departmentRepository.save(hrTeam);
      departments.push(savedHrTeam);

      // 직원들 생성
      const employeeData = [
        { name: 'CEO', dept: savedRootDept, empNo: 'EMP001' },
        { name: '개발본부장', dept: savedDevDivision, empNo: 'EMP002' },
        { name: '프론트엔드팀장', dept: savedFrontendTeam, empNo: 'EMP003' },
        { name: '프론트엔드개발자1', dept: savedFrontendTeam, empNo: 'EMP004' },
        { name: '프론트엔드개발자2', dept: savedFrontendTeam, empNo: 'EMP005' },
        { name: '백엔드팀장', dept: savedBackendTeam, empNo: 'EMP006' },
        { name: '백엔드개발자1', dept: savedBackendTeam, empNo: 'EMP007' },
        { name: '인사팀장', dept: savedHrTeam, empNo: 'EMP008' },
      ];

      for (const empData of employeeData) {
        const employee = new Employee();
        Object.assign(employee, {
          employeeNumber: empData.empNo,
          name: empData.name,
          email: `${empData.empNo.toLowerCase()}@lumir.com`,
          status: '재직중',
          departmentId: empData.dept.id,
          externalId: `ext-${empData.empNo.toLowerCase()}`,
          externalCreatedAt: new Date('2024-01-01'),
          externalUpdatedAt: new Date('2024-01-01'),
        });
        employee.생성자설정한다(adminUserId);
        const savedEmployee = await employeeRepository.save(employee);
        employees.push(savedEmployee);
      }
    });

    describe('조직도조회', () => {
      it('전체 조직 구조를 조회할 수 있다', async () => {
        // When
        const result = await service.조직도조회();

        // Then
        expect(result).toBeDefined();
        expect(result.totalEmployeeCount).toBe(8);
        expect(result.departments).toHaveLength(1); // 루트 부서만
        expect(result.lastUpdatedAt).toBeDefined();

        const rootDept = result.departments[0];
        expect(rootDept.name).toBe('루미르');
        expect(rootDept.employees).toHaveLength(1); // CEO
        expect(rootDept.subDepartments).toHaveLength(2); // 개발본부, 인사팀
      });

      it('부서별 직원 정보가 올바르게 포함된다', async () => {
        // When
        const result = await service.조직도조회();

        // Then
        const rootDept = result.departments[0];
        const devDivision = rootDept.subDepartments.find(
          (d) => d.name === '개발본부',
        )!;

        expect(devDivision).toBeDefined();
        expect(devDivision.employees).toHaveLength(1); // 개발본부장
        expect(devDivision.subDepartments).toHaveLength(2); // 프론트엔드팀, 백엔드팀

        const frontendTeam = devDivision.subDepartments.find(
          (d) => d.name === '프론트엔드팀',
        )!;
        expect(frontendTeam.employees).toHaveLength(3); // 팀장 + 개발자 2명
      });

      it('계층 구조가 올바르게 구성된다', async () => {
        // When
        const result = await service.조직도조회();

        // Then
        const rootDept = result.departments[0];
        expect(rootDept.name).toBe('루미르');

        const hrTeam = rootDept.subDepartments.find(
          (d) => d.name === '인사팀',
        )!;
        expect(hrTeam).toBeDefined();
        expect(hrTeam.employees).toHaveLength(1); // 인사팀장
        expect(hrTeam.subDepartments).toHaveLength(0); // 하위 부서 없음
      });
    });
  });

  describe('복합 시나리오 테스트', () => {
    it('전체 조직 관리 기능을 통합적으로 테스트할 수 있다', async () => {
      // 1. 부서 구조 생성
      const rootDept = new Department();
      Object.assign(rootDept, {
        name: '통합테스트회사',
        code: 'TEST_COMPANY',
        order: 1,
        externalId: 'ext-test-root',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      rootDept.생성자설정한다(adminUserId);
      const savedRootDept = await departmentRepository.save(rootDept);

      const techDept = new Department();
      Object.assign(techDept, {
        name: '기술팀',
        code: 'TECH',
        order: 1,
        parentDepartmentId: savedRootDept.id,
        externalId: 'ext-tech',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      techDept.생성자설정한다(adminUserId);
      const savedTechDept = await departmentRepository.save(techDept);

      // 2. 직원 생성
      const ceo = new Employee();
      Object.assign(ceo, {
        employeeNumber: 'CEO001',
        name: '대표이사',
        email: 'ceo@test.com',
        status: '재직중',
        departmentId: savedRootDept.id,
        externalId: 'ext-ceo',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      ceo.생성자설정한다(adminUserId);
      const savedCeo = await employeeRepository.save(ceo);

      const techLead = new Employee();
      Object.assign(techLead, {
        employeeNumber: 'TL001',
        name: '기술리드',
        email: 'techlead@test.com',
        status: '재직중',
        departmentId: savedTechDept.id,
        managerId: savedCeo.id,
        externalId: 'ext-techlead',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      techLead.생성자설정한다(adminUserId);
      const savedTechLead = await employeeRepository.save(techLead);

      const developer = new Employee();
      Object.assign(developer, {
        employeeNumber: 'DEV001',
        name: '개발자',
        email: 'dev@test.com',
        status: '재직중',
        departmentId: savedTechDept.id,
        managerId: savedTechLead.id,
        externalId: 'ext-dev',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      developer.생성자설정한다(adminUserId);
      const savedDeveloper = await employeeRepository.save(developer);

      // 3. 전체 부서 목록 조회 테스트
      const allDepartments = await service.전체부서목록조회();
      expect(allDepartments).toHaveLength(2);
      expect(allDepartments.map((d) => d.name)).toContain('통합테스트회사');
      expect(allDepartments.map((d) => d.name)).toContain('기술팀');

      // 4. 전체 직원 목록 조회 테스트
      const allEmployees = await service.전체직원목록조회();
      expect(allEmployees).toHaveLength(3);
      expect(allEmployees.map((e) => e.name)).toContain('대표이사');
      expect(allEmployees.map((e) => e.name)).toContain('기술리드');
      expect(allEmployees.map((e) => e.name)).toContain('개발자');

      // 5. 부서별 직원 조회 테스트
      const techEmployees = await service.부서별직원목록조회(savedTechDept.id);
      expect(techEmployees).toHaveLength(2);
      expect(techEmployees.map((e) => e.name)).toContain('기술리드');
      expect(techEmployees.map((e) => e.name)).toContain('개발자');

      // 6. 상하급자 관계 테스트
      const developerManager = await service.상급자조회(savedDeveloper.id);
      expect(developerManager).toBeDefined();
      expect(developerManager!.name).toBe('기술리드');

      const techLeadSubordinates = await service.하급자목록조회(
        savedTechLead.id,
      );
      expect(techLeadSubordinates).toHaveLength(1);
      expect(techLeadSubordinates[0].name).toBe('개발자');

      // 7. 부서 계층 구조 테스트
      const subDepartments = await service.하위부서목록조회(savedRootDept.id);
      expect(subDepartments).toHaveLength(1);
      expect(subDepartments[0].name).toBe('기술팀');

      const parentDepartment = await service.상위부서조회(savedTechDept.id);
      expect(parentDepartment).toBeDefined();
      expect(parentDepartment!.name).toBe('통합테스트회사');

      // 8. 조직도 전체 구조 테스트
      const orgChart = await service.조직도조회();
      expect(orgChart.totalEmployeeCount).toBe(3);
      expect(orgChart.departments).toHaveLength(1); // 루트 부서만

      const rootInChart = orgChart.departments[0];
      expect(rootInChart.name).toBe('통합테스트회사');
      expect(rootInChart.employees).toHaveLength(1); // 대표이사
      expect(rootInChart.subDepartments).toHaveLength(1); // 기술팀

      const techInChart = rootInChart.subDepartments[0];
      expect(techInChart.name).toBe('기술팀');
      expect(techInChart.employees).toHaveLength(2); // 기술리드, 개발자

      // 9. 활성 직원 조회 테스트
      const activeEmployees = await service.활성직원목록조회();
      expect(activeEmployees).toHaveLength(3);
      expect(activeEmployees.every((e) => e.status === '재직중')).toBe(true);
    });

    it('대규모 조직 구조에서 성능을 테스트할 수 있다', async () => {
      // 대규모 조직 구조 생성 (10개 부서, 50명 직원)
      const departments: Department[] = [];
      const employees: Employee[] = [];

      // 루트 부서
      const rootDept = new Department();
      Object.assign(rootDept, {
        name: '대기업',
        code: 'BIG_CORP',
        order: 1,
        externalId: 'ext-big-corp',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      });
      rootDept.생성자설정한다(adminUserId);
      const savedRootDept = await departmentRepository.save(rootDept);
      departments.push(savedRootDept);

      // 10개 부서 생성
      for (let i = 1; i <= 10; i++) {
        const dept = new Department();
        Object.assign(dept, {
          name: `부서${i}`,
          code: `DEPT${i.toString().padStart(2, '0')}`,
          order: i,
          parentDepartmentId: savedRootDept.id,
          externalId: `ext-dept-${i}`,
          externalCreatedAt: new Date('2024-01-01'),
          externalUpdatedAt: new Date('2024-01-01'),
        });
        dept.생성자설정한다(adminUserId);
        const savedDept = await departmentRepository.save(dept);
        departments.push(savedDept);
      }

      // 50명 직원 생성 (각 부서에 5명씩)
      for (let deptIdx = 1; deptIdx <= 10; deptIdx++) {
        const dept = departments[deptIdx];
        for (let empIdx = 1; empIdx <= 5; empIdx++) {
          const empNo = `EMP${deptIdx.toString().padStart(2, '0')}${empIdx.toString().padStart(2, '0')}`;
          const employee = new Employee();
          Object.assign(employee, {
            employeeNumber: empNo,
            name: `직원${empNo}`,
            email: `${empNo.toLowerCase()}@bigcorp.com`,
            status: '재직중',
            departmentId: dept.id,
            externalId: `ext-${empNo.toLowerCase()}`,
            externalCreatedAt: new Date('2024-01-01'),
            externalUpdatedAt: new Date('2024-01-01'),
          });
          employee.생성자설정한다(adminUserId);
          const savedEmployee = await employeeRepository.save(employee);
          employees.push(savedEmployee);
        }
      }

      // 성능 테스트
      const startTime = Date.now();

      // 전체 조회 테스트
      const allDepartments = await service.전체부서목록조회();
      const allEmployees = await service.전체직원목록조회();
      const orgChart = await service.조직도조회();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // 결과 검증
      expect(allDepartments).toHaveLength(11); // 루트 + 10개 부서
      expect(allEmployees).toHaveLength(50);
      expect(orgChart.totalEmployeeCount).toBe(50);
      expect(orgChart.departments[0].subDepartments).toHaveLength(10);

      // 성능 검증 (2초 이내)
      expect(executionTime).toBeLessThan(2000);

      console.log(`대규모 조직 조회 성능: ${executionTime}ms`);
    });
  });
});
