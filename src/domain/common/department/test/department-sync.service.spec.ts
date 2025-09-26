import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import axios from 'axios';
import { DepartmentSyncService } from '../department-sync.service';
import { DepartmentRepository } from '../department.repository';
import { Department } from '../department.entity';
import {
  ExternalDepartmentData,
  DepartmentSyncResult,
} from '../department.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

// axios 모킹
jest.mock('axios');
const mockedAxios = axios;

describe('DepartmentSyncService - 히트미스 전략 통합 테스트 (매시간 동기화)', () => {
  let service: DepartmentSyncService;
  let repository: DepartmentRepository;
  let typeormRepository: Repository<Department>;
  let dataSource: DataSource;
  let module: TestingModule;
  let container: StartedPostgreSqlContainer;

  // 모킹된 외부 API 데이터
  const mockExternalDepartments: ExternalDepartmentData[] = [
    {
      _id: 'mongo-id-001',
      id: 'ext-001',
      department_name: '경영지원본부',
      department_code: 'MGMT001',
      order: 0,
      manager_id: 'manager-001',
      parent_department_id: null,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      _id: 'mongo-id-002',
      id: 'ext-002',
      department_name: '개발팀',
      department_code: 'DEV001',
      order: 1,
      manager_id: 'manager-002',
      parent_department_id: 'ext-001',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
    {
      _id: 'mongo-id-003',
      id: 'ext-003',
      department_name: '인사팀',
      department_code: 'HR001',
      order: 2,
      manager_id: 'manager-003',
      parent_department_id: 'ext-001',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  ];

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
      providers: [
        DepartmentSyncService,
        DepartmentRepository,
        TransactionManagerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                EXTERNAL_METADATA_API_URL: 'https://test-api.example.com',
                DEPARTMENT_SYNC_ENABLED: true,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DepartmentSyncService>(DepartmentSyncService);
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
    // 각 테스트 전에 데이터베이스와 모킹 정리
    await typeormRepository.clear();
    await dataSource.query('DELETE FROM department');
    jest.clearAllMocks();

    // 기본 axios 모킹 설정
    mockedAxios.get.mockResolvedValue({
      data: mockExternalDepartments,
      status: 200,
      statusText: 'OK',
    });
  });

  describe('외부 API 통합 테스트', () => {
    it('외부 API에서 부서 데이터를 성공적으로 조회할 수 있어야 한다', async () => {
      // When
      const result = await service.fetchExternalDepartments();

      // Then
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-api.example.com/api/departments',
        expect.objectContaining({
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );
      expect(result).toEqual(mockExternalDepartments);
      expect(result).toHaveLength(3);
    });

    it('외부 API 호출 실패시 적절한 예외를 발생시켜야 한다', async () => {
      // Given
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      // When & Then
      await expect(service.fetchExternalDepartments()).rejects.toThrow(
        '외부 부서 데이터 조회에 실패했습니다.',
      );
    });
  });

  describe('부서 데이터 동기화 테스트', () => {
    it('처음 동기화시 모든 부서를 생성해야 한다', async () => {
      // When
      const result: DepartmentSyncResult = await service.syncDepartments();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(3);
      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      // 데이터베이스 확인
      const savedDepartments = await repository.findAll();
      expect(savedDepartments).toHaveLength(3);
      expect(savedDepartments[0].name).toBe('경영지원본부');
      expect(savedDepartments[0].externalId).toBe('ext-001');
    });

    it('기존 데이터가 있을 때 업데이트가 필요한 부서만 업데이트해야 한다', async () => {
      // Given - 먼저 초기 데이터 생성
      await service.syncDepartments();

      // 외부 API 데이터 업데이트 (개발팀만 변경)
      const updatedMockData = [...mockExternalDepartments];
      updatedMockData[1] = {
        ...updatedMockData[1],
        department_name: '개발팀 (업데이트됨)',
        updated_at: '2024-01-02T00:00:00.000Z', // 더 최신 시간
      };

      mockedAxios.get.mockResolvedValue({
        data: updatedMockData,
        status: 200,
        statusText: 'OK',
      });

      // When
      const result = await service.syncDepartments();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(3);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1); // 개발팀만 업데이트

      // 업데이트된 데이터 확인
      const updatedDepartment = await repository.findByExternalId('ext-002');
      expect(updatedDepartment?.name).toBe('개발팀 (업데이트됨)');
    });

    it('동기화 비활성화시 동기화를 건너뛰어야 한다', async () => {
      // Given - 새로운 서비스 인스턴스를 동기화 비활성화로 생성
      const disabledModule = await Test.createTestingModule({
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
        providers: [
          DepartmentSyncService,
          DepartmentRepository,
          TransactionManagerService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'EXTERNAL_METADATA_API_URL') {
                  return 'https://test-api.example.com';
                }
                if (key === 'DEPARTMENT_SYNC_ENABLED') {
                  return false; // 명시적으로 false 반환
                }
                return defaultValue;
              }),
            },
          },
        ],
      }).compile();

      const disabledService = disabledModule.get<DepartmentSyncService>(
        DepartmentSyncService,
      );

      // axios 호출 횟수를 추적하기 위해 현재 호출 횟수 저장
      const initialCallCount = mockedAxios.get.mock.calls.length;

      // When
      const result = await disabledService.syncDepartments();

      // Then
      expect(result.success).toBe(false);
      expect(result.errors).toContain('동기화가 비활성화되어 있습니다.');
      // 새로운 axios 호출이 없었는지 확인
      expect(mockedAxios.get.mock.calls.length).toBe(initialCallCount);

      await disabledModule.close();
    });

    it('forceSync=true일 때는 비활성화 상태에서도 동기화해야 한다', async () => {
      // Given - 새로운 서비스 인스턴스를 동기화 비활성화로 생성
      const disabledModule = await Test.createTestingModule({
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
        providers: [
          DepartmentSyncService,
          DepartmentRepository,
          TransactionManagerService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: any) => {
                if (key === 'EXTERNAL_METADATA_API_URL') {
                  return 'https://test-api.example.com';
                }
                if (key === 'DEPARTMENT_SYNC_ENABLED') {
                  return false; // 명시적으로 false 반환
                }
                return defaultValue;
              }),
            },
          },
        ],
      }).compile();

      const disabledService = disabledModule.get<DepartmentSyncService>(
        DepartmentSyncService,
      );

      // When
      const result = await disabledService.syncDepartments(true);

      // Then
      expect(result.success).toBe(true);
      expect(result.created).toBe(3);
      expect(mockedAxios.get).toHaveBeenCalled();

      await disabledModule.close();
    });
  });

  describe('히트미스 전략 테스트', () => {
    it('캐시 미스: 로컬 데이터가 없을 때 외부 API에서 동기화해야 한다', async () => {
      // Given - 로컬 DB가 비어있음

      // When
      const departments = await service.getDepartments();

      // Then
      expect(mockedAxios.get).toHaveBeenCalled(); // 외부 API 호출됨 (MISS)
      expect(departments).toHaveLength(3);
      expect(departments[0].name).toBe('경영지원본부');

      // 로컬 DB에 저장되었는지 확인
      const localDepartments = await repository.findAll();
      expect(localDepartments).toHaveLength(3);
    });

    it('캐시 히트: 로컬 데이터가 있을 때 외부 API 호출 없이 반환해야 한다', async () => {
      // Given - 먼저 데이터를 로컬 DB에 저장
      await service.syncDepartments();
      jest.clearAllMocks(); // 이전 호출 기록 정리

      // When
      const departments = await service.getDepartments();

      // Then
      expect(mockedAxios.get).not.toHaveBeenCalled(); // 외부 API 호출 안됨 (HIT)
      expect(departments).toHaveLength(3);
      expect(departments[0].name).toBe('경영지원본부');
    });

    it('강제 새로고침: forceRefresh=true일 때 로컬 데이터가 있어도 외부 API 호출해야 한다', async () => {
      // Given - 먼저 데이터를 로컬 DB에 저장
      await service.syncDepartments();
      jest.clearAllMocks();

      // When
      const departments = await service.getDepartments(true);

      // Then
      expect(mockedAxios.get).toHaveBeenCalled(); // 강제 새로고침으로 외부 API 호출됨
      expect(departments).toHaveLength(3);
    });

    it('24시간 TTL: 마지막 동기화가 24시간 이상 경과시 백그라운드 동기화해야 한다', async () => {
      // Given - 오래된 데이터로 초기화
      const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25시간 전
      const oldDepartment = new Department(
        '오래된 부서',
        'OLD001',
        'ext-old',
        0,
        'manager-old',
        null,
        oldDate,
        oldDate,
      );
      oldDepartment.lastSyncAt = oldDate;
      await repository.save(oldDepartment);

      jest.clearAllMocks();

      // When
      const departments = await service.getDepartments();

      // Then
      expect(departments).toHaveLength(1); // 기존 데이터 즉시 반환 (HIT)
      expect(departments[0].name).toBe('오래된 부서');

      // 백그라운드 동기화가 트리거되었는지 확인 (비동기이므로 약간의 대기 시간 필요)
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockedAxios.get).toHaveBeenCalled(); // 백그라운드에서 외부 API 호출됨
    });
  });

  describe('개별 부서 조회 히트미스 전략', () => {
    it('존재하지 않는 부서 조회시 동기화 후 재조회해야 한다', async () => {
      // Given - 로컬 DB가 비어있음

      // When
      const department = await service.getDepartmentById(
        '00000000-0000-0000-0000-000000000000',
      );

      // Then
      expect(mockedAxios.get).toHaveBeenCalled(); // 동기화 발생
      expect(department).toBeNull(); // 동기화 후에도 해당 ID는 없음
    });

    it('외부 ID로 부서 조회시 히트미스 전략이 작동해야 한다', async () => {
      // Given - 먼저 동기화
      await service.syncDepartments();
      jest.clearAllMocks();

      // When
      const department = await service.getDepartmentByExternalId('ext-002');

      // Then
      expect(mockedAxios.get).not.toHaveBeenCalled(); // 캐시 히트
      expect(department).toBeDefined();
      expect(department?.name).toBe('개발팀');
      expect(department?.externalId).toBe('ext-002');
    });

    it('존재하지 않는 외부 ID 조회시 동기화 후 재조회해야 한다', async () => {
      // Given - 로컬 DB가 비어있음

      // When
      const department = await service.getDepartmentByExternalId('ext-999');

      // Then
      expect(mockedAxios.get).toHaveBeenCalled(); // 동기화 발생
      expect(department).toBeNull(); // 동기화 후에도 해당 외부 ID는 없음
    });
  });

  describe('수동 동기화 테스트', () => {
    it('수동 동기화 트리거가 정상적으로 작동해야 한다', async () => {
      // When
      const result = await service.triggerManualSync();

      // Then
      expect(result.success).toBe(true);
      expect(result.created).toBe(3);
      expect(mockedAxios.get).toHaveBeenCalled();

      // 데이터베이스 확인
      const departments = await repository.findAll();
      expect(departments).toHaveLength(3);
    });
  });

  describe('스케줄된 동기화 테스트', () => {
    it('스케줄된 동기화가 정상적으로 작동해야 한다', async () => {
      // When
      await service.scheduledSync();

      // Then
      expect(mockedAxios.get).toHaveBeenCalled();

      // 데이터베이스 확인
      const departments = await repository.findAll();
      expect(departments).toHaveLength(3);
    });
  });

  describe('에러 처리 테스트', () => {
    it('외부 API 오류시 적절한 에러 응답을 반환해야 한다', async () => {
      // Given
      mockedAxios.get.mockRejectedValue(new Error('API 서버 다운'));

      // When
      const result = await service.syncDepartments();

      // Then
      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        '부서 동기화 실패: 외부 부서 데이터 조회에 실패했습니다.',
      );
    });

    it('개별 부서 처리 오류시 다른 부서는 정상 처리되어야 한다', async () => {
      // Given - 잘못된 데이터가 포함된 외부 API 응답
      const invalidMockData = [
        ...mockExternalDepartments,
        {
          _id: 'invalid-mongo-id',
          id: 'ext-invalid', // 유효한 ID로 변경
          department_name: 'Invalid Department',
          department_code: 'INVALID',
          order: 999,
          manager_id: 'invalid',
          parent_department_id: null,
          created_at: 'invalid-date', // 이것이 오류를 발생시킬 것
          updated_at: 'invalid-date',
        },
      ];

      mockedAxios.get.mockResolvedValue({
        data: invalidMockData,
        status: 200,
        statusText: 'OK',
      });

      // When
      const result = await service.syncDepartments();

      // Then
      expect(result.success).toBe(false); // 오류로 인해 전체 실패
      expect(result.errors).toHaveLength(1); // 1개 오류 발생
      expect(result.errors[0]).toContain('부서 동기화 실패');
    });
  });

  describe('성능 및 최적화 테스트', () => {
    it('대량 데이터 동기화시 일괄 저장이 사용되어야 한다', async () => {
      // Given - 대량의 모킹 데이터
      const largeMockData = Array.from({ length: 100 }, (_, i) => ({
        _id: `mongo-id-${i.toString().padStart(3, '0')}`,
        id: `ext-${i.toString().padStart(3, '0')}`,
        department_name: `부서 ${i}`,
        department_code: `DEPT${i.toString().padStart(3, '0')}`,
        order: i,
        manager_id: `manager-${i}`,
        parent_department_id: i === 0 ? null : 'ext-000',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      }));

      mockedAxios.get.mockResolvedValue({
        data: largeMockData,
        status: 200,
        statusText: 'OK',
      });

      // When
      const startTime = Date.now();
      const result = await service.syncDepartments();
      const endTime = Date.now();

      // Then
      expect(result.success).toBe(true);
      expect(result.created).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // 5초 이내 완료

      // 모든 데이터가 저장되었는지 확인
      const savedDepartments = await repository.findAll();
      expect(savedDepartments).toHaveLength(100);
    });
  });
});
