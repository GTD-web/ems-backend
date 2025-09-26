import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { DepartmentRepository } from '../department.repository';
import { Department } from '../department.entity';
import { DepartmentFilter } from '../department.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

describe('DepartmentRepository', () => {
  let repository: DepartmentRepository;
  let typeormRepository: Repository<Department>;
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
          entities: [Department],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Department]),
      ],
      providers: [DepartmentRepository, TransactionManagerService],
    }).compile();

    repository = module.get<DepartmentRepository>(DepartmentRepository);
    typeormRepository = module.get<Repository<Department>>(
      'DepartmentRepository',
    );
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
    await dataSource.query('DELETE FROM department');
  });

  describe('기본 CRUD 작업', () => {
    it('부서를 생성하고 저장할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '경영지원본부',
        'MGMT001',
        'ext-001',
        0,
        'manager-001',
        null,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      // When
      const savedDepartment = await repository.save(department);

      // Then
      expect(savedDepartment).toBeDefined();
      expect(savedDepartment.id).toBeDefined();
      expect(savedDepartment.name).toBe('경영지원본부');
      expect(savedDepartment.code).toBe('MGMT001');
      expect(savedDepartment.externalId).toBe('ext-001');
      expect(savedDepartment.order).toBe(0);
      expect(savedDepartment.managerId).toBe('manager-001');
      expect(savedDepartment.parentDepartmentId).toBeNull();
    });

    it('EntityManager를 사용하여 부서를 저장할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '개발팀',
        'DEV001',
        'ext-002',
        1,
        'manager-002',
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const savedDepartment = await repository.saveWithManager(
          department,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();

        // Then
        expect(savedDepartment).toBeDefined();
        expect(savedDepartment.id).toBeDefined();
        expect(savedDepartment.name).toBe('개발팀');
        expect(savedDepartment.code).toBe('DEV001');
        expect(savedDepartment.parentDepartmentId).toBe('ext-001');
      } finally {
        await queryRunner.release();
      }
    });

    it('ID로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '인사팀',
        'HR001',
        'ext-003',
        2,
        undefined,
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      const savedDepartment = await repository.save(department);

      // When
      const foundDepartment = await repository.findById(savedDepartment.id);

      // Then
      expect(foundDepartment).toBeDefined();
      expect(foundDepartment!.id).toBe(savedDepartment.id);
      expect(foundDepartment!.name).toBe('인사팀');
      expect(foundDepartment!.code).toBe('HR001');
    });

    it('EntityManager를 사용하여 ID로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '재무팀',
        'FIN001',
        'ext-004',
        3,
        'manager-004',
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      const savedDepartment = await repository.save(department);

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const foundDepartment = await repository.findByIdWithManager(
          savedDepartment.id,
          queryRunner.manager,
        );

        // Then
        expect(foundDepartment).toBeDefined();
        expect(foundDepartment!.id).toBe(savedDepartment.id);
        expect(foundDepartment!.name).toBe('재무팀');
        expect(foundDepartment!.managerId).toBe('manager-004');
      } finally {
        await queryRunner.release();
      }
    });

    it('존재하지 않는 ID로 조회하면 null을 반환해야 한다', async () => {
      // When
      const foundDepartment = await repository.findById(
        '00000000-0000-0000-0000-000000000000',
      );

      // Then
      expect(foundDepartment).toBeNull();
    });

    it('부서를 삭제할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '마케팅팀',
        'MKT001',
        'ext-005',
        4,
        undefined,
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      const savedDepartment = await repository.save(department);

      // When
      await repository.delete(savedDepartment.id);

      // Then
      const foundDepartment = await repository.findById(savedDepartment.id);
      expect(foundDepartment).toBeNull();
    });

    it('EntityManager를 사용하여 부서를 삭제할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '영업팀',
        'SALES001',
        'ext-006',
        5,
        'manager-006',
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      const savedDepartment = await repository.save(department);

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await repository.deleteWithManager(
          savedDepartment.id,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();

        // Then
        const foundDepartment = await repository.findById(savedDepartment.id);
        expect(foundDepartment).toBeNull();
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('외부 ID 조회', () => {
    it('외부 ID로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '기획팀',
        'PLAN001',
        'ext-007',
        6,
        'manager-007',
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      await repository.save(department);

      // When
      const foundDepartment = await repository.findByExternalId('ext-007');

      // Then
      expect(foundDepartment).toBeDefined();
      expect(foundDepartment!.externalId).toBe('ext-007');
      expect(foundDepartment!.name).toBe('기획팀');
      expect(foundDepartment!.code).toBe('PLAN001');
    });

    it('EntityManager를 사용하여 외부 ID로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        '품질관리팀',
        'QA001',
        'ext-008',
        7,
        undefined,
        'ext-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      await repository.save(department);

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const foundDepartment = await repository.findByExternalIdWithManager(
          'ext-008',
          queryRunner.manager,
        );

        // Then
        expect(foundDepartment).toBeDefined();
        expect(foundDepartment!.externalId).toBe('ext-008');
        expect(foundDepartment!.name).toBe('품질관리팀');
      } finally {
        await queryRunner.release();
      }
    });

    it('존재하지 않는 외부 ID로 조회하면 null을 반환해야 한다', async () => {
      // When
      const foundDepartment = await repository.findByExternalId('non-existent');

      // Then
      expect(foundDepartment).toBeNull();
    });
  });

  describe('조건별 조회', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const departments = [
        new Department(
          '경영지원본부',
          'MGMT001',
          'ext-001',
          0,
          'manager-001',
          null,
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '개발팀',
          'DEV001',
          'ext-002',
          1,
          'manager-002',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '인사팀',
          'HR001',
          'ext-003',
          2,
          'manager-001',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '재무팀',
          'FIN001',
          'ext-004',
          3,
          'manager-004',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      for (const department of departments) {
        await repository.save(department);
      }
    });

    it('부서명으로 부서를 조회할 수 있어야 한다', async () => {
      // When
      const foundDepartment = await repository.findByName('개발팀');

      // Then
      expect(foundDepartment).toBeDefined();
      expect(foundDepartment!.name).toBe('개발팀');
      expect(foundDepartment!.code).toBe('DEV001');
    });

    it('부서 코드로 부서를 조회할 수 있어야 한다', async () => {
      // When
      const foundDepartment = await repository.findByCode('HR001');

      // Then
      expect(foundDepartment).toBeDefined();
      expect(foundDepartment!.name).toBe('인사팀');
      expect(foundDepartment!.code).toBe('HR001');
    });

    it('상위 부서별 하위 부서를 조회할 수 있어야 한다', async () => {
      // When
      const childDepartments =
        await repository.findByParentDepartmentId('ext-001');

      // Then
      expect(childDepartments).toHaveLength(3);
      expect(
        childDepartments.every((d) => d.parentDepartmentId === 'ext-001'),
      ).toBe(true);
    });

    it('EntityManager를 사용하여 상위 부서별 하위 부서를 조회할 수 있어야 한다', async () => {
      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const childDepartments =
          await repository.findByParentDepartmentIdWithManager(
            'ext-001',
            queryRunner.manager,
          );

        // Then
        expect(childDepartments).toHaveLength(3);
        expect(
          childDepartments.every((d) => d.parentDepartmentId === 'ext-001'),
        ).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });

    it('루트 부서 목록을 조회할 수 있어야 한다', async () => {
      // When
      const rootDepartments = await repository.findRootDepartments();

      // Then
      // 테스트 데이터에서 parentDepartmentId가 null인 부서는 '경영지원본부' 1개만 있어야 함
      const rootDepartmentNames = rootDepartments.map((d) => d.name);
      expect(rootDepartments).toHaveLength(1);
      expect(rootDepartments[0].name).toBe('경영지원본부');
      expect(rootDepartments[0].parentDepartmentId).toBeNull();
    });

    it('필터로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const filter: DepartmentFilter = {
        managerId: 'manager-001',
      };

      // When
      const filteredDepartments = await repository.findByFilter(filter);

      // Then
      expect(filteredDepartments).toHaveLength(2);
      expect(
        filteredDepartments.every((d) => d.managerId === 'manager-001'),
      ).toBe(true);
    });

    it('EntityManager를 사용하여 필터로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const filter: DepartmentFilter = {
        name: '개발',
      };

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const filteredDepartments = await repository.findByFilterWithManager(
          filter,
          queryRunner.manager,
        );

        // Then
        expect(filteredDepartments).toHaveLength(1);
        expect(filteredDepartments[0].name).toBe('개발팀');
      } finally {
        await queryRunner.release();
      }
    });

    it('복합 필터로 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const filter: DepartmentFilter = {
        parentDepartmentId: 'ext-001',
        code: 'DEV001',
      };

      // When
      const filteredDepartments = await repository.findByFilter(filter);

      // Then
      expect(filteredDepartments).toHaveLength(1);
      expect(filteredDepartments[0].name).toBe('개발팀');
      expect(filteredDepartments[0].code).toBe('DEV001');
      expect(filteredDepartments[0].parentDepartmentId).toBe('ext-001');
    });
  });

  describe('일괄 저장', () => {
    it('여러 부서를 일괄 저장할 수 있어야 한다', async () => {
      // Given
      const departments = [
        new Department(
          '디자인팀',
          'DESIGN001',
          'ext-010',
          10,
          'manager-010',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '운영팀',
          'OPS001',
          'ext-011',
          11,
          'manager-011',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      // When
      const savedDepartments = await repository.saveMany(departments);

      // Then
      expect(savedDepartments).toHaveLength(2);
      expect(savedDepartments[0].id).toBeDefined();
      expect(savedDepartments[1].id).toBeDefined();
      expect(savedDepartments[0].name).toBe('디자인팀');
      expect(savedDepartments[1].name).toBe('운영팀');
    });

    it('EntityManager를 사용하여 여러 부서를 일괄 저장할 수 있어야 한다', async () => {
      // Given
      const departments = [
        new Department(
          '보안팀',
          'SEC001',
          'ext-012',
          12,
          'manager-012',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '법무팀',
          'LEGAL001',
          'ext-013',
          13,
          'manager-013',
          'ext-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const savedDepartments = await repository.saveManyWithManager(
          departments,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();

        // Then
        expect(savedDepartments).toHaveLength(2);
        expect(savedDepartments[0].name).toBe('보안팀');
        expect(savedDepartments[1].name).toBe('법무팀');
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('통계 조회', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const departments = [
        new Department(
          '본부',
          'HQ001',
          'ext-100',
          0,
          'manager-100',
          null,
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '팀1',
          'TEAM001',
          'ext-101',
          1,
          'manager-101',
          'ext-100',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '팀2',
          'TEAM002',
          'ext-102',
          2,
          'manager-102',
          'ext-100',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      // 동기화 시간 설정
      departments[0].lastSyncAt = new Date('2024-01-02');
      departments[1].lastSyncAt = new Date('2024-01-03');

      for (const department of departments) {
        await repository.save(department);
      }
    });

    it('부서 통계를 조회할 수 있어야 한다', async () => {
      // When
      const stats = await repository.getDepartmentStats();

      // Then
      expect(stats.totalDepartments).toBe(3);
      expect(stats.rootDepartments).toBe(1);
      expect(stats.subDepartments).toBe(2);
      expect(stats.lastSyncAt).toBeDefined();
    });

    it('EntityManager를 사용하여 부서 통계를 조회할 수 있어야 한다', async () => {
      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const stats = await repository.getDepartmentStatsWithManager(
          queryRunner.manager,
        );

        // Then
        expect(stats.totalDepartments).toBe(3);
        expect(stats.rootDepartments).toBe(1);
        expect(stats.subDepartments).toBe(2);
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('동기화 관련 메서드', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const departments = [
        new Department(
          '최신 부서',
          'NEW001',
          'ext-200',
          0,
          'manager-200',
          null,
          yesterday,
          now,
        ),
        new Department(
          '오래된 부서',
          'OLD001',
          'ext-201',
          1,
          'manager-201',
          'ext-200',
          yesterday,
          yesterday,
        ),
      ];

      // 동기화 시간 설정 (오래된 부서만)
      departments[1].lastSyncAt = yesterday;

      for (const department of departments) {
        await repository.save(department);
      }
    });

    it('동기화가 필요한 부서를 조회할 수 있어야 한다', async () => {
      // When
      const outdatedDepartments = await repository.findOutdatedDepartments();

      // Then
      expect(outdatedDepartments.length).toBeGreaterThanOrEqual(1);
      // 최신 부서는 lastSyncAt이 null이므로 포함됨
      // 오래된 부서는 lastSyncAt < externalUpdatedAt 조건에 따라 포함될 수 있음
    });

    it('EntityManager를 사용하여 동기화가 필요한 부서를 조회할 수 있어야 한다', async () => {
      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const outdatedDepartments =
          await repository.findOutdatedDepartmentsWithManager(
            queryRunner.manager,
          );

        // Then
        expect(outdatedDepartments.length).toBeGreaterThanOrEqual(1);
      } finally {
        await queryRunner.release();
      }
    });

    it('마지막 동기화 시간을 업데이트할 수 있어야 한다', async () => {
      // Given
      const syncTime = new Date();
      const externalIds = ['ext-200', 'ext-201'];

      // When
      await repository.updateLastSyncAt(externalIds, syncTime);

      // Then
      const department1 = await repository.findByExternalId('ext-200');
      const department2 = await repository.findByExternalId('ext-201');

      expect(department1!.lastSyncAt).toBeDefined();
      expect(department2!.lastSyncAt).toBeDefined();
      // 시간 비교 (초 단위까지만 비교)
      expect(
        Math.abs(department1!.lastSyncAt!.getTime() - syncTime.getTime()),
      ).toBeLessThan(1000);
    });

    it('EntityManager를 사용하여 마지막 동기화 시간을 업데이트할 수 있어야 한다', async () => {
      // Given
      const syncTime = new Date();
      const externalIds = ['ext-200'];

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await repository.updateLastSyncAtWithManager(
          externalIds,
          syncTime,
          queryRunner.manager,
        );
        await queryRunner.commitTransaction();

        // Then
        const department = await repository.findByExternalId('ext-200');
        expect(department!.lastSyncAt).toBeDefined();
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('전체 조회', () => {
    it('모든 부서를 정렬 순서대로 조회할 수 있어야 한다', async () => {
      // Given
      const departments = [
        new Department(
          '세 번째',
          'THIRD001',
          'ext-300',
          2,
          'manager-300',
          null,
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '첫 번째',
          'FIRST001',
          'ext-301',
          0,
          'manager-301',
          null,
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '두 번째',
          'SECOND001',
          'ext-302',
          1,
          'manager-302',
          null,
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      for (const department of departments) {
        await repository.save(department);
      }

      // When
      const allDepartments = await repository.findAll();

      // Then
      expect(allDepartments).toHaveLength(3);
      expect(allDepartments[0].name).toBe('첫 번째'); // order: 0
      expect(allDepartments[1].name).toBe('두 번째'); // order: 1
      expect(allDepartments[2].name).toBe('세 번째'); // order: 2
    });

    it('EntityManager를 사용하여 모든 부서를 조회할 수 있어야 한다', async () => {
      // Given
      const department = new Department(
        'EntityManager 테스트',
        'EM001',
        'ext-400',
        0,
        'manager-400',
        null,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      await repository.save(department);

      // When
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        const allDepartments = await repository.findAllWithManager(
          queryRunner.manager,
        );

        // Then
        expect(allDepartments.length).toBeGreaterThanOrEqual(1);
        expect(
          allDepartments.some((d) => d.name === 'EntityManager 테스트'),
        ).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });
  });

  describe('트랜잭션 테스트', () => {
    it('트랜잭션 내에서 여러 부서를 저장하고 롤백할 수 있어야 한다', async () => {
      // Given
      const department1 = new Department(
        '트랜잭션 테스트 1',
        'TX001',
        'ext-tx-001',
        0,
        'manager-tx-001',
        null,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      const department2 = new Department(
        '트랜잭션 테스트 2',
        'TX002',
        'ext-tx-002',
        1,
        'manager-tx-002',
        'ext-tx-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // When - 트랜잭션 내에서 저장
        await repository.saveWithManager(department1, queryRunner.manager);
        await repository.saveWithManager(department2, queryRunner.manager);

        // 의도적으로 롤백
        await queryRunner.rollbackTransaction();

        // Then - 롤백 후 데이터가 없어야 함
        const found1 = await repository.findById(department1.id);
        const found2 = await repository.findById(department2.id);

        expect(found1).toBeNull();
        expect(found2).toBeNull();
      } finally {
        await queryRunner.release();
      }
    });

    it('트랜잭션 내에서 여러 부서를 저장하고 커밋할 수 있어야 한다', async () => {
      // Given
      const department1 = new Department(
        '트랜잭션 커밋 1',
        'TXC001',
        'ext-txc-001',
        0,
        'manager-txc-001',
        null,
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );
      const department2 = new Department(
        '트랜잭션 커밋 2',
        'TXC002',
        'ext-txc-002',
        1,
        'manager-txc-002',
        'ext-txc-001',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // When - 트랜잭션 내에서 저장
        const saved1 = await repository.saveWithManager(
          department1,
          queryRunner.manager,
        );
        const saved2 = await repository.saveWithManager(
          department2,
          queryRunner.manager,
        );

        await queryRunner.commitTransaction();

        // Then - 커밋 후 데이터가 존재해야 함
        const found1 = await repository.findById(saved1.id);
        const found2 = await repository.findById(saved2.id);

        expect(found1).toBeDefined();
        expect(found1!.name).toBe('트랜잭션 커밋 1');
        expect(found2).toBeDefined();
        expect(found2!.name).toBe('트랜잭션 커밋 2');
      } finally {
        await queryRunner.release();
      }
    });

    it('트랜잭션 내에서 복잡한 쿼리를 실행할 수 있어야 한다', async () => {
      // Given
      const departments = [
        new Department(
          '복잡한 쿼리 본부',
          'COMPLEX001',
          'ext-complex-001',
          0,
          'manager-complex-001',
          null,
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '복잡한 쿼리 팀1',
          'COMPLEX002',
          'ext-complex-002',
          1,
          'manager-complex-001',
          'ext-complex-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
        new Department(
          '복잡한 쿼리 팀2',
          'COMPLEX003',
          'ext-complex-003',
          2,
          'manager-complex-003',
          'ext-complex-001',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ];

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // When - 트랜잭션 내에서 저장
        for (const department of departments) {
          await repository.saveWithManager(department, queryRunner.manager);
        }

        // 트랜잭션 내에서 복잡한 조회
        const rootDepartmentsInTx =
          await repository.findRootDepartmentsWithManager(queryRunner.manager);

        const childDepartmentsInTx =
          await repository.findByParentDepartmentIdWithManager(
            'ext-complex-001',
            queryRunner.manager,
          );

        const filterInTx: DepartmentFilter = {
          managerId: 'manager-complex-001',
        };
        const filteredInTx = await repository.findByFilterWithManager(
          filterInTx,
          queryRunner.manager,
        );

        await queryRunner.commitTransaction();

        // Then
        // 트랜잭션 내에서 생성한 루트 부서만 확인 (이전 테스트 데이터 제외)
        const complexRootDepartments = rootDepartmentsInTx.filter(
          (d) => d.name === '복잡한 쿼리 본부',
        );
        expect(complexRootDepartments).toHaveLength(1);
        expect(complexRootDepartments[0].name).toBe('복잡한 쿼리 본부');

        expect(childDepartmentsInTx).toHaveLength(2);
        expect(
          childDepartmentsInTx.every(
            (d) => d.parentDepartmentId === 'ext-complex-001',
          ),
        ).toBe(true);

        expect(filteredInTx).toHaveLength(2); // 본부와 팀1이 같은 매니저
        expect(
          filteredInTx.every((d) => d.managerId === 'manager-complex-001'),
        ).toBe(true);

        // 트랜잭션 외부에서도 확인 - 복잡한 쿼리 본부가 포함되어 있는지 확인
        const rootDepartmentsAfterCommit =
          await repository.findRootDepartments();
        const hasComplexDepartment = rootDepartmentsAfterCommit.some(
          (d) => d.name === '복잡한 쿼리 본부',
        );
        expect(hasComplexDepartment).toBe(true);
      } finally {
        await queryRunner.release();
      }
    });
  });
});
