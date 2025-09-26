import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Employee } from '../employee.entity';
import { EmployeeRepository } from '../employee.repository';
import { EmployeeFilter } from '../employee.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

describe('EmployeeRepository', () => {
  let repository: EmployeeRepository;
  let typeormRepository: Repository<Employee>;
  let dataSource: DataSource;
  let module: TestingModule;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // PostgreSQL Testcontainer 시작
    container = await new PostgreSqlContainer('postgres:15-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .withExposedPorts(5432)
      .start();

    // 테스트 모듈 생성
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getMappedPort(5432),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [Employee],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Employee]),
      ],
      providers: [EmployeeRepository, TransactionManagerService],
    }).compile();

    repository = module.get<EmployeeRepository>(EmployeeRepository);
    typeormRepository = module.get<Repository<Employee>>('EmployeeRepository');
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    if (container) {
      await container.stop();
    }
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터베이스 정리
    await typeormRepository.clear();
    // 추가적으로 직접 DELETE 쿼리 실행하여 완전히 정리
    await dataSource.query('DELETE FROM employee');
  });

  describe('기본 CRUD 작업', () => {
    it('직원을 생성하고 저장할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25007',
        '유경준',
        'yu.gyeongjun@lumir.space',
        'ext-001',
        '',
        new Date('1970-02-24'),
        'MALE',
        new Date('2025-01-01'),
        null,
        '재직중',
        'dept-001',
        'pos-001',
        'rank-001',
        new Date('2025-03-12T05:08:06.293Z'),
        new Date('2025-03-12T08:59:32.367Z'),
      );

      // When
      const savedEmployee = await repository.save(employee);

      // Then
      expect(savedEmployee).toBeDefined();
      expect(savedEmployee.id).toBeDefined();
      expect(savedEmployee.employeeNumber).toBe('25007');
      expect(savedEmployee.name).toBe('유경준');
      expect(savedEmployee.email).toBe('yu.gyeongjun@lumir.space');
      expect(savedEmployee.externalId).toBe('ext-001');
      expect(savedEmployee.gender).toBe('MALE');
      expect(savedEmployee.status).toBe('재직중');
      expect(savedEmployee.departmentId).toBe('dept-001');
      expect(savedEmployee.positionId).toBe('pos-001');
      expect(savedEmployee.rankId).toBe('rank-001');
    });

    it('EntityManager를 사용하여 직원을 저장할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25008',
        '김개발',
        'kim.dev@lumir.space',
        'ext-002',
        '010-1234-5678',
        new Date('1985-05-15'),
        'MALE',
        new Date('2023-01-01'),
        'manager-001',
        '재직중',
        'dept-002',
        'pos-002',
        'rank-002',
        new Date('2023-01-01'),
        new Date('2023-01-01'),
      );

      // When
      await dataSource.transaction(async (manager: EntityManager) => {
        const savedEmployee = await repository.saveWithManager(
          employee,
          manager,
        );

        // Then
        expect(savedEmployee).toBeDefined();
        expect(savedEmployee.employeeNumber).toBe('25008');
        expect(savedEmployee.name).toBe('김개발');
        expect(savedEmployee.phoneNumber).toBe('010-1234-5678');
        expect(savedEmployee.managerId).toBe('manager-001');
      });
    });

    it('ID로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25009',
        '박테스트',
        'park.test@lumir.space',
        'ext-003',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      const savedEmployee = await repository.save(employee);

      // When
      const foundEmployee = await repository.findById(savedEmployee.id);

      // Then
      expect(foundEmployee).toBeDefined();
      expect(foundEmployee?.id).toBe(savedEmployee.id);
      expect(foundEmployee?.name).toBe('박테스트');
    });

    it('외부 ID로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25010',
        '이외부',
        'lee.external@lumir.space',
        'ext-004',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      await repository.save(employee);

      // When
      const foundEmployee = await repository.findByExternalId('ext-004');

      // Then
      expect(foundEmployee).toBeDefined();
      expect(foundEmployee?.externalId).toBe('ext-004');
      expect(foundEmployee?.name).toBe('이외부');
    });

    it('직원번호로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25011',
        '최번호',
        'choi.number@lumir.space',
        'ext-005',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      await repository.save(employee);

      // When
      const foundEmployee = await repository.findByEmployeeNumber('25011');

      // Then
      expect(foundEmployee).toBeDefined();
      expect(foundEmployee?.employeeNumber).toBe('25011');
      expect(foundEmployee?.name).toBe('최번호');
    });

    it('이메일로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25012',
        '정이메일',
        'jung.email@lumir.space',
        'ext-006',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      await repository.save(employee);

      // When
      const foundEmployee = await repository.findByEmail(
        'jung.email@lumir.space',
      );

      // Then
      expect(foundEmployee).toBeDefined();
      expect(foundEmployee?.email).toBe('jung.email@lumir.space');
      expect(foundEmployee?.name).toBe('정이메일');
    });

    it('모든 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const employees = [
        new Employee(
          '25013',
          '직원1',
          'emp1@lumir.space',
          'ext-007',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
        new Employee(
          '25014',
          '직원2',
          'emp2@lumir.space',
          'ext-008',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
        new Employee(
          '25015',
          '직원3',
          'emp3@lumir.space',
          'ext-009',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
      ];
      await repository.saveMany(employees);

      // When
      const allEmployees = await repository.findAll();

      // Then
      expect(allEmployees).toHaveLength(3);
      expect(allEmployees.map((emp) => emp.name)).toEqual([
        '직원1',
        '직원2',
        '직원3',
      ]);
    });

    it('직원을 삭제할 수 있어야 한다', async () => {
      // Given
      const employee = new Employee(
        '25016',
        '삭제대상',
        'delete.target@lumir.space',
        'ext-010',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      const savedEmployee = await repository.save(employee);

      // When
      await repository.delete(savedEmployee.id);

      // Then
      const deletedEmployee = await repository.findById(savedEmployee.id);
      expect(deletedEmployee).toBeNull();
    });
  });

  describe('필터링 및 검색', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const employees = [
        new Employee(
          '25017',
          '김개발자',
          'kim.dev@lumir.space',
          'ext-011',
          '010-1111-1111',
          new Date('1990-01-01'),
          'MALE',
          new Date('2020-01-01'),
          'manager-001',
          '재직중',
          'dept-dev',
          'pos-senior',
          'rank-engineer',
          new Date(),
          new Date(),
        ),
        new Employee(
          '25018',
          '이디자이너',
          'lee.design@lumir.space',
          'ext-012',
          '010-2222-2222',
          new Date('1992-02-02'),
          'FEMALE',
          new Date('2021-01-01'),
          'manager-002',
          '재직중',
          'dept-design',
          'pos-junior',
          'rank-designer',
          new Date(),
          new Date(),
        ),
        new Employee(
          '25019',
          '박매니저',
          'park.manager@lumir.space',
          'ext-013',
          '010-3333-3333',
          new Date('1985-03-03'),
          'MALE',
          new Date('2018-01-01'),
          null,
          '휴직중',
          'dept-mgmt',
          'pos-manager',
          'rank-manager',
          new Date(),
          new Date(),
        ),
      ];
      await repository.saveMany(employees);
    });

    it('부서별로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const devEmployees = await repository.findByDepartmentId('dept-dev');

      // Then
      expect(devEmployees).toHaveLength(1);
      expect(devEmployees[0].name).toBe('김개발자');
    });

    it('상태별로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const activeEmployees = await repository.findByStatus('재직중');
      const onLeaveEmployees = await repository.findByStatus('휴직중');

      // Then
      expect(activeEmployees).toHaveLength(2);
      expect(onLeaveEmployees).toHaveLength(1);
      expect(onLeaveEmployees[0].name).toBe('박매니저');
    });

    it('성별로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const maleEmployees = await repository.findByGender('MALE');
      const femaleEmployees = await repository.findByGender('FEMALE');

      // Then
      expect(maleEmployees).toHaveLength(2);
      expect(femaleEmployees).toHaveLength(1);
      expect(femaleEmployees[0].name).toBe('이디자이너');
    });

    it('직급별로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const seniorEmployees = await repository.findByPositionId('pos-senior');

      // Then
      expect(seniorEmployees).toHaveLength(1);
      expect(seniorEmployees[0].name).toBe('김개발자');
    });

    it('직책별로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const engineers = await repository.findByRankId('rank-engineer');

      // Then
      expect(engineers).toHaveLength(1);
      expect(engineers[0].name).toBe('김개발자');
    });

    it('활성 직원만 조회할 수 있어야 한다', async () => {
      // When
      const activeEmployees = await repository.findActiveEmployees();

      // Then
      expect(activeEmployees).toHaveLength(2);
      expect(activeEmployees.map((emp) => emp.name)).toEqual([
        '김개발자',
        '이디자이너',
      ]);
    });

    it('이름으로 직원을 검색할 수 있어야 한다', async () => {
      // When
      const searchResults = await repository.searchByName('김');

      // Then
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toBe('김개발자');
    });

    it('필터를 사용하여 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const filter: EmployeeFilter = {
        departmentId: 'dept-dev',
        status: '재직중',
        gender: 'MALE',
      };

      // When
      const filteredEmployees = await repository.findByFilter(filter);

      // Then
      expect(filteredEmployees).toHaveLength(1);
      expect(filteredEmployees[0].name).toBe('김개발자');
    });

    it('복합 필터를 사용하여 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const filter: EmployeeFilter = {
        status: '재직중',
        positionId: 'pos-junior',
      };

      // When
      const filteredEmployees = await repository.findByFilter(filter);

      // Then
      expect(filteredEmployees).toHaveLength(1);
      expect(filteredEmployees[0].name).toBe('이디자이너');
    });
  });

  describe('통계 조회', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const employees = [
        new Employee(
          '25020',
          '통계1',
          'stat1@lumir.space',
          'ext-020',
          undefined,
          undefined,
          'MALE',
          undefined,
          undefined,
          '재직중',
          'dept-001',
          'pos-001',
          'rank-001',
          new Date(),
          new Date(),
        ),
        new Employee(
          '25021',
          '통계2',
          'stat2@lumir.space',
          'ext-021',
          undefined,
          undefined,
          'FEMALE',
          undefined,
          undefined,
          '재직중',
          'dept-001',
          'pos-002',
          'rank-001',
          new Date(),
          new Date(),
        ),
        new Employee(
          '25022',
          '통계3',
          'stat3@lumir.space',
          'ext-022',
          undefined,
          undefined,
          'MALE',
          undefined,
          undefined,
          '휴직중',
          'dept-002',
          'pos-001',
          'rank-002',
          new Date(),
          new Date(),
        ),
        new Employee(
          '25023',
          '통계4',
          'stat4@lumir.space',
          'ext-023',
          undefined,
          undefined,
          'FEMALE',
          undefined,
          undefined,
          '퇴사',
          'dept-002',
          'pos-002',
          'rank-002',
          new Date(),
          new Date(),
        ),
      ];

      // lastSyncAt 설정
      const syncTime = new Date();
      employees.forEach((emp) => {
        emp.lastSyncAt = syncTime;
      });

      await repository.saveMany(employees);
    });

    it('직원 통계를 조회할 수 있어야 한다', async () => {
      // When
      const stats = await repository.getEmployeeStats();

      // Then
      expect(stats.totalEmployees).toBe(4);
      expect(stats.activeEmployees).toBe(2);
      expect(stats.onLeaveEmployees).toBe(1);
      expect(stats.resignedEmployees).toBe(1);

      // 부서별 통계
      expect(stats.employeesByDepartment['dept-001']).toBe(2);
      expect(stats.employeesByDepartment['dept-002']).toBe(2);

      // 직급별 통계
      expect(stats.employeesByPosition['pos-001']).toBe(2);
      expect(stats.employeesByPosition['pos-002']).toBe(2);

      // 직책별 통계
      expect(stats.employeesByRank['rank-001']).toBe(2);
      expect(stats.employeesByRank['rank-002']).toBe(2);

      // 성별 통계
      expect(stats.employeesByGender['MALE']).toBe(2);
      expect(stats.employeesByGender['FEMALE']).toBe(2);

      // 상태별 통계
      expect(stats.employeesByStatus['재직중']).toBe(2);
      expect(stats.employeesByStatus['휴직중']).toBe(1);
      expect(stats.employeesByStatus['퇴사']).toBe(1);

      // 마지막 동기화 시간
      expect(stats.lastSyncAt).toBeDefined();
    });

    it('EntityManager를 사용하여 통계를 조회할 수 있어야 한다', async () => {
      // When & Then
      await dataSource.transaction(async (manager: EntityManager) => {
        const stats = await repository.getEmployeeStatsWithManager(manager);

        expect(stats.totalEmployees).toBe(4);
        expect(stats.activeEmployees).toBe(2);
        expect(stats.onLeaveEmployees).toBe(1);
        expect(stats.resignedEmployees).toBe(1);
      });
    });
  });

  describe('일괄 처리', () => {
    it('여러 직원을 일괄 저장할 수 있어야 한다', async () => {
      // Given
      const employees = [
        new Employee(
          '25024',
          '일괄1',
          'batch1@lumir.space',
          'ext-024',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
        new Employee(
          '25025',
          '일괄2',
          'batch2@lumir.space',
          'ext-025',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
        new Employee(
          '25026',
          '일괄3',
          'batch3@lumir.space',
          'ext-026',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
      ];

      // When
      const savedEmployees = await repository.saveMany(employees);

      // Then
      expect(savedEmployees).toHaveLength(3);
      expect(savedEmployees.every((emp) => emp.id)).toBe(true);

      const allEmployees = await repository.findAll();
      expect(allEmployees).toHaveLength(3);
    });

    it('EntityManager를 사용하여 여러 직원을 일괄 저장할 수 있어야 한다', async () => {
      // Given
      const employees = [
        new Employee(
          '25027',
          '트랜잭션1',
          'trans1@lumir.space',
          'ext-027',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
        new Employee(
          '25028',
          '트랜잭션2',
          'trans2@lumir.space',
          'ext-028',
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          new Date(),
          new Date(),
        ),
      ];

      // When & Then
      await dataSource.transaction(async (manager: EntityManager) => {
        const savedEmployees = await repository.saveManyWithManager(
          employees,
          manager,
        );

        expect(savedEmployees).toHaveLength(2);
        expect(savedEmployees.every((emp) => emp.id)).toBe(true);
      });

      const allEmployees = await repository.findAll();
      expect(allEmployees).toHaveLength(2);
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 ID로 조회시 null을 반환해야 한다', async () => {
      // When
      const nonExistentEmployee = await repository.findById(
        '550e8400-e29b-41d4-a716-446655440000',
      );

      // Then
      expect(nonExistentEmployee).toBeNull();
    });

    it('존재하지 않는 외부 ID로 조회시 null을 반환해야 한다', async () => {
      // When
      const nonExistentEmployee = await repository.findByExternalId(
        'non-existent-external-id',
      );

      // Then
      expect(nonExistentEmployee).toBeNull();
    });

    it('존재하지 않는 직원번호로 조회시 null을 반환해야 한다', async () => {
      // When
      const nonExistentEmployee =
        await repository.findByEmployeeNumber('99999');

      // Then
      expect(nonExistentEmployee).toBeNull();
    });

    it('존재하지 않는 이메일로 조회시 null을 반환해야 한다', async () => {
      // When
      const nonExistentEmployee = await repository.findByEmail(
        'nonexistent@lumir.space',
      );

      // Then
      expect(nonExistentEmployee).toBeNull();
    });

    it('중복된 직원번호로 저장시 에러가 발생해야 한다', async () => {
      // Given
      const employee1 = new Employee(
        '25029',
        '중복1',
        'dup1@lumir.space',
        'ext-029',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      const employee2 = new Employee(
        '25029',
        '중복2',
        'dup2@lumir.space',
        'ext-030',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );

      await repository.save(employee1);

      // When & Then
      await expect(repository.save(employee2)).rejects.toThrow();
    });

    it('중복된 이메일로 저장시 에러가 발생해야 한다', async () => {
      // Given
      const employee1 = new Employee(
        '25030',
        '이메일중복1',
        'duplicate@lumir.space',
        'ext-031',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      const employee2 = new Employee(
        '25031',
        '이메일중복2',
        'duplicate@lumir.space',
        'ext-032',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );

      await repository.save(employee1);

      // When & Then
      await expect(repository.save(employee2)).rejects.toThrow();
    });

    it('중복된 외부 ID로 저장시 에러가 발생해야 한다', async () => {
      // Given
      const employee1 = new Employee(
        '25032',
        '외부ID중복1',
        'extdup1@lumir.space',
        'ext-duplicate',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );
      const employee2 = new Employee(
        '25033',
        '외부ID중복2',
        'extdup2@lumir.space',
        'ext-duplicate',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        new Date(),
        new Date(),
      );

      await repository.save(employee1);

      // When & Then
      await expect(repository.save(employee2)).rejects.toThrow();
    });
  });
});
