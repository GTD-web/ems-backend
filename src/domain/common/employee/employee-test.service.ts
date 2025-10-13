import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Employee } from './employee.entity';
import { EmployeeDto, EmployeeGender, EmployeeStatus } from './employee.types';

/**
 * 직원 테스트용 서비스
 *
 * 테스트 시 사용할 목데이터를 생성하고 관리하는 서비스입니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 */
@Injectable()
export class EmployeeTestService {
  constructor(
    @InjectRepository(Employee)
    public readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * 테스트용 직원 목데이터를 생성한다
   * @returns 생성된 직원 목록
   */
  async 테스트용_목데이터를_생성한다(): Promise<EmployeeDto[]> {
    // 기존 테스트 데이터 정리
    await this.테스트_데이터를_정리한다();

    const testEmployees = [
      // 경영진
      {
        employeeNumber: 'EMP001',
        name: '김대표',
        email: 'ceo@company.com',
        phoneNumber: '010-0001-0001',
        dateOfBirth: new Date('1970-01-01'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2020-01-01'),
        managerId: undefined,
        status: '재직중' as EmployeeStatus,
        departmentId: 'exec-001',
        positionId: 'pos-001',
        rankId: 'rank-001',
        externalId: 'emp-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },
      {
        employeeNumber: 'EMP002',
        name: '박이사',
        email: 'director@company.com',
        phoneNumber: '010-0002-0002',
        dateOfBirth: new Date('1975-05-15'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2020-03-01'),
        managerId: 'emp-001',
        status: '재직중' as EmployeeStatus,
        departmentId: 'exec-001',
        positionId: 'pos-002',
        rankId: 'rank-002',
        externalId: 'emp-002',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },

      // 기술개발본부
      {
        employeeNumber: 'EMP003',
        name: '이개발팀장',
        email: 'dev.manager@company.com',
        phoneNumber: '010-0003-0003',
        dateOfBirth: new Date('1980-03-20'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2021-01-15'),
        managerId: 'emp-002',
        status: '재직중' as EmployeeStatus,
        departmentId: 'tech-001',
        positionId: 'pos-003',
        rankId: 'rank-003',
        externalId: 'emp-003',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        employeeNumber: 'EMP004',
        name: '정백엔드개발자',
        email: 'backend.dev@company.com',
        phoneNumber: '010-0004-0004',
        dateOfBirth: new Date('1985-07-10'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2021-06-01'),
        managerId: 'emp-003',
        status: '재직중' as EmployeeStatus,
        departmentId: 'backend-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-004',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        employeeNumber: 'EMP005',
        name: '최프론트엔드개발자',
        email: 'frontend.dev@company.com',
        phoneNumber: '010-0005-0005',
        dateOfBirth: new Date('1988-11-25'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2021-08-15'),
        managerId: 'emp-003',
        status: '재직중' as EmployeeStatus,
        departmentId: 'frontend-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-005',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        employeeNumber: 'EMP006',
        name: '한데이터엔지니어',
        email: 'data.engineer@company.com',
        phoneNumber: '010-0006-0006',
        dateOfBirth: new Date('1983-04-12'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2021-09-01'),
        managerId: 'emp-003',
        status: '재직중' as EmployeeStatus,
        departmentId: 'data-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-006',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },

      // 영업본부
      {
        employeeNumber: 'EMP007',
        name: '강영업팀장',
        email: 'sales.manager@company.com',
        phoneNumber: '010-0007-0007',
        dateOfBirth: new Date('1978-09-08'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2020-11-01'),
        managerId: 'emp-002',
        status: '재직중' as EmployeeStatus,
        departmentId: 'sales-001',
        positionId: 'pos-003',
        rankId: 'rank-003',
        externalId: 'emp-007',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },
      {
        employeeNumber: 'EMP008',
        name: '윤국내영업',
        email: 'domestic.sales@company.com',
        phoneNumber: '010-0008-0008',
        dateOfBirth: new Date('1987-12-03'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2022-02-01'),
        managerId: 'emp-007',
        status: '재직중' as EmployeeStatus,
        departmentId: 'domestic-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-008',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },
      {
        employeeNumber: 'EMP009',
        name: '서해외영업',
        email: 'global.sales@company.com',
        phoneNumber: '010-0009-0009',
        dateOfBirth: new Date('1986-06-18'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2022-03-15'),
        managerId: 'emp-007',
        status: '재직중' as EmployeeStatus,
        departmentId: 'global-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-009',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },

      // 인사관리부
      {
        employeeNumber: 'EMP010',
        name: '조인사팀장',
        email: 'hr.manager@company.com',
        phoneNumber: '010-0010-0010',
        dateOfBirth: new Date('1979-08-22'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2020-12-01'),
        managerId: 'emp-002',
        status: '재직중' as EmployeeStatus,
        departmentId: 'hr-001',
        positionId: 'pos-003',
        rankId: 'rank-003',
        externalId: 'emp-010',
        externalCreatedAt: new Date('2024-01-04'),
        externalUpdatedAt: new Date('2024-01-04'),
      },
      {
        employeeNumber: 'EMP011',
        name: '임채용담당',
        email: 'recruiter@company.com',
        phoneNumber: '010-0011-0011',
        dateOfBirth: new Date('1990-02-14'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2022-05-01'),
        managerId: 'emp-010',
        status: '재직중' as EmployeeStatus,
        departmentId: 'recruit-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-011',
        externalCreatedAt: new Date('2024-01-04'),
        externalUpdatedAt: new Date('2024-01-04'),
      },
      {
        employeeNumber: 'EMP012',
        name: '배교육담당',
        email: 'trainer@company.com',
        phoneNumber: '010-0012-0012',
        dateOfBirth: new Date('1984-10-30'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2022-07-01'),
        managerId: 'emp-010',
        status: '재직중' as EmployeeStatus,
        departmentId: 'training-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-012',
        externalCreatedAt: new Date('2024-01-04'),
        externalUpdatedAt: new Date('2024-01-04'),
      },

      // 휴직중인 직원
      {
        employeeNumber: 'EMP013',
        name: '김휴직자',
        email: 'onleave@company.com',
        phoneNumber: '010-0013-0013',
        dateOfBirth: new Date('1982-01-05'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2021-01-01'),
        managerId: 'emp-003',
        status: '휴직중' as EmployeeStatus,
        departmentId: 'backend-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-013',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },

      // 퇴사한 직원
      {
        employeeNumber: 'EMP014',
        name: '박퇴사자',
        email: 'resigned@company.com',
        phoneNumber: '010-0014-0014',
        dateOfBirth: new Date('1981-03-15'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2020-06-01'),
        managerId: 'emp-007',
        status: '퇴사' as EmployeeStatus,
        departmentId: 'marketing-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-014',
        externalCreatedAt: new Date('2024-01-03'),
        externalUpdatedAt: new Date('2024-01-03'),
      },
    ];

    // 직원 엔티티 생성 및 저장
    const employees = testEmployees.map((emp) => {
      const employee = new Employee(
        emp.employeeNumber,
        emp.name,
        emp.email,
        emp.externalId,
        emp.phoneNumber,
        emp.dateOfBirth,
        emp.gender,
        emp.hireDate,
        emp.managerId,
        emp.status,
        emp.departmentId,
        emp.positionId,
        emp.rankId,
        emp.externalCreatedAt,
        emp.externalUpdatedAt,
      );
      return employee;
    });

    const savedEmployees = await this.employeeRepository.save(employees);

    // UUID 매핑 테이블 생성
    const externalIdToUuid = new Map<string, string>();
    savedEmployees.forEach((emp) => {
      externalIdToUuid.set(emp.externalId, emp.id);
    });

    // managerId를 externalId에서 UUID로 변환
    const employeesToUpdate = savedEmployees
      .filter((emp) => emp.managerId)
      .map((emp) => {
        const managerUuid = externalIdToUuid.get(emp.managerId!);
        if (managerUuid) {
          emp.managerId = managerUuid;
        }
        return emp;
      });

    // 업데이트된 직원들 저장
    if (employeesToUpdate.length > 0) {
      await this.employeeRepository.save(employeesToUpdate);
    }

    return savedEmployees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 특정 직원의 테스트 데이터를 생성한다
   * @param employeeData 직원 데이터
   * @returns 생성된 직원 정보
   */
  async 특정_직원_테스트데이터를_생성한다(employeeData: {
    employeeNumber: string;
    name: string;
    email: string;
    externalId: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    gender?: EmployeeGender;
    hireDate?: Date;
    managerId?: string;
    status?: EmployeeStatus;
    departmentId?: string;
    positionId?: string;
    rankId?: string;
    externalCreatedAt?: Date;
    externalUpdatedAt?: Date;
  }): Promise<EmployeeDto> {
    const employee = new Employee(
      employeeData.employeeNumber,
      employeeData.name,
      employeeData.email,
      employeeData.externalId,
      employeeData.phoneNumber,
      employeeData.dateOfBirth,
      employeeData.gender,
      employeeData.hireDate,
      employeeData.managerId,
      employeeData.status || '재직중',
      employeeData.departmentId,
      employeeData.positionId,
      employeeData.rankId,
      employeeData.externalCreatedAt || new Date(),
      employeeData.externalUpdatedAt || new Date(),
    );

    const savedEmployee = await this.employeeRepository.save(employee);
    return savedEmployee.DTO로_변환한다();
  }

  /**
   * 테스트용 랜덤 직원 데이터를 생성한다
   * @param count 생성할 직원 수
   * @returns 생성된 직원 목록
   */
  async 랜덤_테스트데이터를_생성한다(
    count: number = 10,
  ): Promise<EmployeeDto[]> {
    const employees: Employee[] = [];
    const genders: EmployeeGender[] = ['MALE', 'FEMALE'];
    const statuses: EmployeeStatus[] = ['재직중', '휴직중', '퇴사'];

    for (let i = 0; i < count; i++) {
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const birthYear = 1970 + Math.floor(Math.random() * 30);
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;

      const employee = new Employee(
        `TEST${String(i + 1).padStart(3, '0')}`,
        `테스트직원${i + 1}`,
        `test${i + 1}@company.com`,
        `test-emp-${i + 1}`,
        `010-${String(i + 1).padStart(4, '0')}-${String(i + 1).padStart(4, '0')}`,
        new Date(birthYear, birthMonth - 1, birthDay),
        gender,
        new Date(
          2020 + Math.floor(Math.random() * 4),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        undefined,
        status,
        `dept-${Math.floor(Math.random() * 5) + 1}`,
        `pos-${Math.floor(Math.random() * 5) + 1}`,
        `rank-${Math.floor(Math.random() * 5) + 1}`,
        new Date(),
        new Date(),
      );
      employees.push(employee);
    }

    const savedEmployees = await this.employeeRepository.save(employees);
    return savedEmployees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 테스트 데이터를 정리한다
   * @returns 삭제된 직원 수
   */
  async 테스트_데이터를_정리한다(): Promise<number> {
    // 테스트용 직원들을 삭제 (externalId가 test-로 시작하거나 특정 패턴을 가진 것들)
    const result = await this.employeeRepository
      .createQueryBuilder()
      .delete()
      .where(
        'externalId LIKE :pattern1 OR externalId LIKE :pattern2 OR externalId LIKE :pattern3',
        {
          pattern1: 'test-%',
          pattern2: 'emp-%',
          pattern3: 'TEST%',
        },
      )
      .execute();

    return result.affected || 0;
  }

  /**
   * 모든 테스트 데이터를 삭제한다
   * @returns 삭제된 직원 수
   */
  async 모든_테스트데이터를_삭제한다(): Promise<number> {
    const result = await this.employeeRepository
      .createQueryBuilder()
      .delete()
      .execute();

    return result.affected || 0;
  }

  /**
   * 부서별 직원 테스트 데이터를 생성한다
   * @param departmentId 부서 ID
   * @param count 생성할 직원 수
   * @returns 생성된 직원 목록
   */
  async 부서별_직원_테스트데이터를_생성한다(
    departmentId: string,
    count: number = 5,
  ): Promise<EmployeeDto[]> {
    const employees: Employee[] = [];
    const genders: EmployeeGender[] = ['MALE', 'FEMALE'];

    for (let i = 0; i < count; i++) {
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const birthYear = 1980 + Math.floor(Math.random() * 20);
      const birthMonth = Math.floor(Math.random() * 12) + 1;
      const birthDay = Math.floor(Math.random() * 28) + 1;

      const employee = new Employee(
        `DEPT${departmentId.slice(-3)}${String(i + 1).padStart(2, '0')}`,
        `${departmentId}부서직원${i + 1}`,
        `dept${departmentId.slice(-3)}${i + 1}@company.com`,
        `dept-${departmentId}-emp-${i + 1}`,
        `010-${departmentId.slice(-3)}${String(i + 1).padStart(4, '0')}`,
        new Date(birthYear, birthMonth - 1, birthDay),
        gender,
        new Date(
          2021 + Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        undefined,
        '재직중',
        departmentId,
        `pos-${Math.floor(Math.random() * 3) + 1}`,
        `rank-${Math.floor(Math.random() * 3) + 1}`,
        new Date(),
        new Date(),
      );
      employees.push(employee);
    }

    const savedEmployees = await this.employeeRepository.save(employees);
    return savedEmployees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 현재 데이터베이스에 있는 직원 수를 조회한다
   * @returns 직원 수
   */
  async 현재_직원_수를_조회한다(): Promise<number> {
    const count = await this.employeeRepository.count({
      where: { deletedAt: IsNull() },
    });
    return count;
  }

  /**
   * 현재 데이터베이스에 있는 모든 직원을 조회한다
   * @returns 직원 목록
   */
  async 현재_직원_목록을_조회한다(): Promise<EmployeeDto[]> {
    const employees = await this.employeeRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
    return employees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 테스트용 직원이 존재하는지 확인한다
   * @returns 테스트용 직원 존재 여부
   */
  async 테스트용_직원이_존재하는가(): Promise<boolean> {
    const count = await this.employeeRepository.count({
      where: [
        { externalId: 'emp-001', deletedAt: IsNull() },
        { externalId: 'emp-002', deletedAt: IsNull() },
        { externalId: 'emp-003', deletedAt: IsNull() },
      ],
    });
    return count > 0;
  }

  /**
   * 직원 데이터가 충분한지 확인하고 부족하면 생성한다
   * @param minCount 최소 필요한 직원 수
   * @returns 직원 목록
   */
  async 직원_데이터를_확인하고_생성한다(
    minCount: number = 3,
  ): Promise<EmployeeDto[]> {
    const currentCount = await this.현재_직원_수를_조회한다();

    console.log(`현재 직원 수: ${currentCount}, 최소 필요 수: ${minCount}`);

    if (currentCount < minCount) {
      console.log('직원 데이터가 부족합니다. 새로 생성합니다...');
      // 기존 데이터 정리를 하지 않고 바로 생성
      const employees = await this.테스트용_직원_데이터만_생성한다();
      console.log(`새로 생성된 직원 수: ${employees.length}`);
      return employees;
    } else {
      console.log('충분한 직원 데이터가 존재합니다.');
      return await this.현재_직원_목록을_조회한다();
    }
  }

  /**
   * 테스트용 직원 데이터만 생성한다 (기존 데이터 정리 없이)
   * @returns 생성된 직원 목록
   */
  async 테스트용_직원_데이터만_생성한다(): Promise<EmployeeDto[]> {
    const testEmployees = [
      // 경영진
      {
        employeeNumber: 'EMP001',
        name: '김대표',
        email: 'ceo@company.com',
        phoneNumber: '010-0001-0001',
        dateOfBirth: new Date('1970-01-01'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2020-01-01'),
        managerId: undefined,
        status: '재직중' as EmployeeStatus,
        departmentId: 'exec-001',
        positionId: 'pos-001',
        rankId: 'rank-001',
        externalId: 'emp-001',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },
      {
        employeeNumber: 'EMP002',
        name: '박이사',
        email: 'director@company.com',
        phoneNumber: '010-0002-0002',
        dateOfBirth: new Date('1975-05-15'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2020-03-01'),
        managerId: 'emp-001',
        status: '재직중' as EmployeeStatus,
        departmentId: 'exec-001',
        positionId: 'pos-002',
        rankId: 'rank-002',
        externalId: 'emp-002',
        externalCreatedAt: new Date('2024-01-01'),
        externalUpdatedAt: new Date('2024-01-01'),
      },
      {
        employeeNumber: 'EMP003',
        name: '이개발팀장',
        email: 'dev.manager@company.com',
        phoneNumber: '010-0003-0003',
        dateOfBirth: new Date('1980-03-20'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2021-01-15'),
        managerId: 'emp-002',
        status: '재직중' as EmployeeStatus,
        departmentId: 'tech-001',
        positionId: 'pos-003',
        rankId: 'rank-003',
        externalId: 'emp-003',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        employeeNumber: 'EMP004',
        name: '정백엔드개발자',
        email: 'backend.dev@company.com',
        phoneNumber: '010-0004-0004',
        dateOfBirth: new Date('1985-07-10'),
        gender: 'MALE' as EmployeeGender,
        hireDate: new Date('2021-06-01'),
        managerId: 'emp-003',
        status: '재직중' as EmployeeStatus,
        departmentId: 'backend-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-004',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
      {
        employeeNumber: 'EMP005',
        name: '최프론트엔드개발자',
        email: 'frontend.dev@company.com',
        phoneNumber: '010-0005-0005',
        dateOfBirth: new Date('1988-11-25'),
        gender: 'FEMALE' as EmployeeGender,
        hireDate: new Date('2021-08-15'),
        managerId: 'emp-003',
        status: '재직중' as EmployeeStatus,
        departmentId: 'frontend-001',
        positionId: 'pos-004',
        rankId: 'rank-004',
        externalId: 'emp-005',
        externalCreatedAt: new Date('2024-01-02'),
        externalUpdatedAt: new Date('2024-01-02'),
      },
    ];

    // 직원 엔티티 생성 및 저장
    const employees = testEmployees.map((emp) => {
      const employee = new Employee(
        emp.employeeNumber,
        emp.name,
        emp.email,
        emp.externalId,
        emp.phoneNumber,
        emp.dateOfBirth,
        emp.gender,
        emp.hireDate,
        emp.managerId,
        emp.status,
        emp.departmentId,
        emp.positionId,
        emp.rankId,
        emp.externalCreatedAt,
        emp.externalUpdatedAt,
      );
      return employee;
    });

    const savedEmployees = await this.employeeRepository.save(employees);
    console.log(`데이터베이스에 저장된 직원 수: ${savedEmployees.length}`);

    // UUID 매핑 테이블 생성
    const externalIdToUuid = new Map<string, string>();
    savedEmployees.forEach((emp) => {
      externalIdToUuid.set(emp.externalId, emp.id);
    });

    // managerId를 externalId에서 UUID로 변환
    const employeesToUpdate = savedEmployees
      .filter((emp) => emp.managerId)
      .map((emp) => {
        const managerUuid = externalIdToUuid.get(emp.managerId!);
        if (managerUuid) {
          emp.managerId = managerUuid;
        }
        return emp;
      });

    // 업데이트된 직원들 저장
    if (employeesToUpdate.length > 0) {
      await this.employeeRepository.save(employeesToUpdate);
      console.log(`managerId를 UUID로 업데이트: ${employeesToUpdate.length}명`);
    }

    // 트랜잭션 강제 커밋 및 격리 수준 조정
    try {
      // 현재 트랜잭션 커밋
      await this.employeeRepository.manager.connection.query('COMMIT');
      console.log('직원 데이터 트랜잭션 커밋 완료');

      // READ UNCOMMITTED로 격리 수준 변경 (테스트 환경에서만)
      if (process.env.NODE_ENV === 'test') {
        await this.employeeRepository.manager.connection.query(
          'SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED',
        );
        console.log('테스트 환경: 격리 수준을 READ UNCOMMITTED로 변경');
      }

      // 새 트랜잭션 시작
      await this.employeeRepository.manager.connection.query('BEGIN');
      console.log('새 트랜잭션 시작');
    } catch (error) {
      console.warn('트랜잭션 처리 중 오류:', error.message);

      // 실패 시 강제로 데이터 플러시
      try {
        await this.employeeRepository.manager.connection.query('SELECT 1'); // 연결 확인
        console.log('데이터베이스 연결 확인 완료');
      } catch (syncError) {
        console.warn('데이터베이스 연결 확인 실패:', syncError.message);
      }
    }

    // 저장 후 실제로 조회되는지 확인 (새 쿼리로)
    const verifyCount = await this.employeeRepository.manager.connection.query(
      'SELECT COUNT(*) as count FROM employee WHERE "deletedAt" IS NULL',
    );
    console.log(`저장 후 검증 - 현재 직원 수: ${verifyCount[0]?.count || 0}`);

    return savedEmployees.map((employee) => employee.DTO로_변환한다());
  }

  /**
   * 매니저-하위직원 관계를 가진 테스트 데이터를 생성한다
   * @param managerCount 매니저 수
   * @param employeesPerManager 매니저당 하위 직원 수
   * @returns 생성된 직원 목록
   */
  async 매니저_하위직원_테스트데이터를_생성한다(
    managerCount: number = 3,
    employeesPerManager: number = 3,
  ): Promise<EmployeeDto[]> {
    const allEmployees: Employee[] = [];
    const managerIds: string[] = [];

    // 매니저들 생성
    for (let i = 0; i < managerCount; i++) {
      const manager = new Employee(
        `MGR${String(i + 1).padStart(3, '0')}`,
        `매니저${i + 1}`,
        `manager${i + 1}@company.com`,
        `mgr-${i + 1}`,
        `010-${String(i + 1).padStart(4, '0')}-0000`,
        new Date(
          1975 + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        Math.random() > 0.5 ? 'MALE' : 'FEMALE',
        new Date(
          2020,
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ),
        undefined,
        '재직중',
        `dept-${i + 1}`,
        'pos-mgr',
        'rank-mgr',
        new Date(),
        new Date(),
      );
      allEmployees.push(manager);
      managerIds.push(`mgr-${i + 1}`);
    }

    // 하위 직원들 생성
    for (let mgrIndex = 0; mgrIndex < managerCount; mgrIndex++) {
      for (let empIndex = 0; empIndex < employeesPerManager; empIndex++) {
        const employee = new Employee(
          `EMP${String(mgrIndex + 1).padStart(2, '0')}${String(empIndex + 1).padStart(2, '0')}`,
          `직원${mgrIndex + 1}-${empIndex + 1}`,
          `emp${mgrIndex + 1}${empIndex + 1}@company.com`,
          `emp-${mgrIndex + 1}-${empIndex + 1}`,
          `010-${String(mgrIndex + 1).padStart(2, '0')}${String(empIndex + 1).padStart(2, '0')}-0000`,
          new Date(
            1985 + Math.floor(Math.random() * 15),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
          ),
          Math.random() > 0.5 ? 'MALE' : 'FEMALE',
          new Date(
            2021 + Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28) + 1,
          ),
          managerIds[mgrIndex],
          '재직중',
          `dept-${mgrIndex + 1}`,
          'pos-emp',
          'rank-emp',
          new Date(),
          new Date(),
        );
        allEmployees.push(employee);
      }
    }

    const savedEmployees = await this.employeeRepository.save(allEmployees);
    return savedEmployees.map((employee) => employee.DTO로_변환한다());
  }
}
