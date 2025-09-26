import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import axios from 'axios';
import { EmployeeSyncService } from '../employee-sync.service';
import { EmployeeRepository } from '../employee.repository';
import { Employee } from '../employee.entity';
import { ExternalEmployeeData, EmployeeSyncResult } from '../employee.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

// axios 모킹
jest.mock('axios');
const mockedAxios = axios;

describe('EmployeeSyncService - 히트미스 전략 통합 테스트 (매시간 동기화)', () => {
  let service: EmployeeSyncService;
  let repository: EmployeeRepository;
  let typeormRepository: Repository<Employee>;
  let dataSource: DataSource;
  let module: TestingModule;
  let container: StartedPostgreSqlContainer;

  // 모킹된 외부 API 데이터
  const mockExternalEmployees: ExternalEmployeeData[] = [
    {
      _id: '67d116b691e5366c32791630',
      employee_number: '25007',
      name: '유경준',
      email: 'yu.gyeongjun@lumir.space',
      phone_number: '',
      date_of_birth: '1970-02-24T00:00:00.000Z',
      gender: 'MALE',
      hire_date: '2025-01-01T00:00:00.000Z',
      manager_id: null,
      status: '재직중',
      department_history: [],
      position_history: [],
      rank_history: [],
      created_at: '2025-03-12T05:08:06.293Z',
      updated_at: '2025-03-12T08:59:32.367Z',
      __v: 0,
      position: {
        _id: '67d1436e91e5366c32791be3',
        position_title: '직원',
        position_code: '직원',
        level: 6,
      },
      rank: {
        _id: '67d1081c9af04fc1b2f65c1d',
        rank_name: '연구원',
        rank_code: '연구원',
        level: 9,
      },
      department: {
        _id: '67d0f1d19af04fc1b2f65af2',
        department_name: 'RF파트',
        department_code: '우주-RF',
        order: 4,
        parent_department_id: '684bd41148148ddbd9068cd9',
      },
    },
    {
      _id: '67d116b691e5366c32791631',
      employee_number: '25008',
      name: '김개발',
      email: 'kim.dev@lumir.space',
      phone_number: '010-1234-5678',
      date_of_birth: '1985-05-15T00:00:00.000Z',
      gender: 'MALE',
      hire_date: '2023-01-01T00:00:00.000Z',
      manager_id: '67d116b691e5366c32791630',
      status: '재직중',
      department_history: [],
      position_history: [],
      rank_history: [],
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z',
      __v: 0,
      position: {
        _id: '67d1436e91e5366c32791be4',
        position_title: '선임',
        position_code: '선임',
        level: 5,
      },
      rank: {
        _id: '67d1081c9af04fc1b2f65c1e',
        rank_name: '개발자',
        rank_code: '개발자',
        level: 8,
      },
      department: {
        _id: '67d0f1d19af04fc1b2f65af3',
        department_name: '개발팀',
        department_code: 'DEV-001',
        order: 1,
        parent_department_id: '67d0f1d19af04fc1b2f65af2',
      },
    },
    {
      _id: '67d116b691e5366c32791632',
      employee_number: '25009',
      name: '이디자이너',
      email: 'lee.design@lumir.space',
      phone_number: '010-9876-5432',
      date_of_birth: '1992-08-20T00:00:00.000Z',
      gender: 'FEMALE',
      hire_date: '2021-03-01T00:00:00.000Z',
      manager_id: '67d116b691e5366c32791630',
      status: '재직중',
      department_history: [],
      position_history: [],
      rank_history: [],
      created_at: '2021-03-01T00:00:00.000Z',
      updated_at: '2021-03-01T00:00:00.000Z',
      __v: 0,
      position: {
        _id: '67d1436e91e5366c32791be5',
        position_title: '주임',
        position_code: '주임',
        level: 7,
      },
      rank: {
        _id: '67d1081c9af04fc1b2f65c1f',
        rank_name: '디자이너',
        rank_code: '디자이너',
        level: 7,
      },
      department: {
        _id: '67d0f1d19af04fc1b2f65af4',
        department_name: '디자인팀',
        department_code: 'DESIGN-001',
        order: 2,
        parent_department_id: '67d0f1d19af04fc1b2f65af2',
      },
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
          entities: [Employee],
          synchronize: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([Employee]),
      ],
      providers: [
        EmployeeSyncService,
        EmployeeRepository,
        TransactionManagerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                EXTERNAL_METADATA_API_URL: 'https://test-api.example.com',
                EMPLOYEE_SYNC_ENABLED: true,
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeSyncService>(EmployeeSyncService);
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
    await dataSource.query('DELETE FROM employee');

    // axios 모킹 초기화
    jest.clearAllMocks();
  });

  describe('외부 API 데이터 조회', () => {
    it('외부 API에서 직원 데이터를 성공적으로 조회해야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: mockExternalEmployees,
      });

      // When
      const result = await service.fetchExternalEmployees();

      // Then
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('유경준');
      expect(result[1].name).toBe('김개발');
      expect(result[2].name).toBe('이디자이너');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test-api.example.com/api/employees?detailed=true',
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    });

    it('외부 API 호출 실패시 적절한 에러를 던져야 한다', async () => {
      // Given
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      // When & Then
      await expect(service.fetchExternalEmployees()).rejects.toThrow(
        '외부 직원 데이터 조회에 실패했습니다.',
      );
    });
  });

  describe('데이터 동기화', () => {
    it('새로운 직원 데이터를 성공적으로 동기화해야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: mockExternalEmployees,
      });

      // When
      const result: EmployeeSyncResult = await service.syncEmployees();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(3);
      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(0);

      // 데이터베이스 확인
      const savedEmployees = await repository.findAll();
      expect(savedEmployees).toHaveLength(3);

      const yuEmployee = savedEmployees.find((emp) => emp.name === '유경준');
      expect(yuEmployee).toBeDefined();
      expect(yuEmployee?.employeeNumber).toBe('25007');
      expect(yuEmployee?.email).toBe('yu.gyeongjun@lumir.space');
      expect(yuEmployee?.externalId).toBe('67d116b691e5366c32791630');
      expect(yuEmployee?.gender).toBe('MALE');
      expect(yuEmployee?.status).toBe('재직중');
      expect(yuEmployee?.departmentId).toBe('67d0f1d19af04fc1b2f65af2');
      expect(yuEmployee?.positionId).toBe('67d1436e91e5366c32791be3');
      expect(yuEmployee?.rankId).toBe('67d1081c9af04fc1b2f65c1d');
    });

    it('기존 직원 데이터를 성공적으로 업데이트해야 한다', async () => {
      // Given - 기존 직원 데이터 저장
      const existingEmployee = new Employee(
        '25007',
        '유경준_구버전',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
        '',
        new Date('1970-02-24'),
        'MALE',
        new Date('2025-01-01'),
        null,
        '재직중',
        'old-dept-id',
        'old-pos-id',
        'old-rank-id',
        new Date('2025-03-12T05:08:06.293Z'),
        new Date('2025-03-12T05:08:06.293Z'), // 구버전 업데이트 시간
      );
      await repository.save(existingEmployee);

      // 업데이트된 외부 데이터
      const updatedExternalData = [
        {
          ...mockExternalEmployees[0],
          name: '유경준_신버전',
          updated_at: '2025-03-12T10:00:00.000Z', // 더 최신 시간
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: updatedExternalData,
      });

      // When
      const result: EmployeeSyncResult = await service.syncEmployees();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);

      // 업데이트된 데이터 확인
      const updatedEmployee = await repository.findByExternalId(
        '67d116b691e5366c32791630',
      );
      expect(updatedEmployee).toBeDefined();
      expect(updatedEmployee?.name).toBe('유경준_신버전');
      expect(updatedEmployee?.departmentId).toBe('67d0f1d19af04fc1b2f65af2'); // 새로운 부서 ID
    });

    it('업데이트가 필요하지 않은 경우 스킵해야 한다', async () => {
      // Given - 최신 데이터로 기존 직원 저장
      const existingEmployee = new Employee(
        '25007',
        '유경준',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
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
      existingEmployee.externalUpdatedAt = new Date('2025-03-12T10:00:00.000Z'); // 더 최신 시간
      existingEmployee.lastSyncAt = new Date();
      await repository.save(existingEmployee);

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockExternalEmployees[0]], // 구버전 데이터
      });

      // When
      const result: EmployeeSyncResult = await service.syncEmployees();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0); // 업데이트되지 않음
      expect(result.errors).toHaveLength(0);
    });

    it('강제 동기화시 모든 데이터를 업데이트해야 한다', async () => {
      // Given - 최신 데이터로 기존 직원 저장
      const existingEmployee = new Employee(
        '25007',
        '유경준_구버전',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
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
      existingEmployee.externalUpdatedAt = new Date('2025-03-12T10:00:00.000Z'); // 더 최신 시간
      existingEmployee.lastSyncAt = new Date();
      await repository.save(existingEmployee);

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockExternalEmployees[0]], // 구버전 데이터
      });

      // When - 강제 동기화
      const result: EmployeeSyncResult = await service.syncEmployees(true);

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(1);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1); // 강제로 업데이트됨
      expect(result.errors).toHaveLength(0);

      // 업데이트된 데이터 확인
      const updatedEmployee = await repository.findByExternalId(
        '67d116b691e5366c32791630',
      );
      expect(updatedEmployee?.name).toBe('유경준'); // 외부 데이터로 업데이트됨
    });

    it('동기화가 비활성화된 경우 동기화를 수행하지 않아야 한다', async () => {
      // Given - ConfigService 모킹을 통해 동기화 비활성화
      const configService = module.get<ConfigService>(ConfigService);
      const originalGet = configService.get;

      // syncEnabled를 false로 설정하기 위해 모킹
      jest
        .spyOn(configService, 'get')
        .mockImplementation((key: string, defaultValue?: any) => {
          if (key === 'EMPLOYEE_SYNC_ENABLED') return false;
          if (key === 'EXTERNAL_METADATA_API_URL')
            return 'https://test-api.example.com';
          return originalGet.call(configService, key, defaultValue);
        });

      // 새로운 서비스 인스턴스 생성 (syncEnabled가 false로 초기화됨)
      const disabledService = new EmployeeSyncService(
        module.get<EmployeeRepository>(EmployeeRepository),
        configService,
      );

      // When
      const result: EmployeeSyncResult = await disabledService.syncEmployees();

      // Then
      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toContain('동기화가 비활성화되어 있습니다.');
      expect(mockedAxios.get).not.toHaveBeenCalled();

      // 원래 모킹 복원
      configService.get = originalGet;
    });

    it('개별 직원 처리 중 에러가 발생해도 다른 직원은 정상 처리되어야 한다', async () => {
      // Given - repository의 findByExternalId를 모킹하여 특정 직원에서 에러 발생시키기
      const originalFindByExternalId = repository.findByExternalId;
      jest
        .spyOn(repository, 'findByExternalId')
        .mockImplementation(async (externalId: string) => {
          if (externalId === '67d116b691e5366c32791631') {
            // 김개발의 외부 ID
            throw new Error('Database lookup failed for employee');
          }
          return originalFindByExternalId.call(repository, externalId);
        });

      mockedAxios.get.mockResolvedValueOnce({
        data: mockExternalEmployees,
      });

      // When
      const result: EmployeeSyncResult = await service.syncEmployees();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(3);
      expect(result.created).toBe(2); // 정상 데이터 2개만 생성 (유경준, 이디자이너)
      expect(result.updated).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0); // 김개발 처리 에러
      expect(result.errors[0]).toContain('김개발');

      // 정상 데이터는 저장되었는지 확인
      const savedEmployees = await repository.findAll();
      expect(savedEmployees).toHaveLength(2);
      const savedNames = savedEmployees.map((emp) => emp.name).sort();
      expect(savedNames).toEqual(['유경준', '이디자이너']);

      // 원래 메서드 복원
      repository.findByExternalId = originalFindByExternalId;
    });
  });

  describe('히트미스 전략', () => {
    it('로컬 데이터가 없는 경우 외부 API에서 동기화해야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: mockExternalEmployees,
      });

      // When
      const employees = await service.getEmployees();

      // Then
      expect(employees).toHaveLength(3);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);

      // 데이터베이스에 저장되었는지 확인
      const savedEmployees = await repository.findAll();
      expect(savedEmployees).toHaveLength(3);
    });

    it('로컬 데이터가 있는 경우 외부 API 호출 없이 로컬 데이터를 반환해야 한다', async () => {
      // Given - 로컬 데이터 준비
      const localEmployee = new Employee(
        '25007',
        '유경준',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
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
      localEmployee.lastSyncAt = new Date(); // 최근 동기화됨
      await repository.save(localEmployee);

      // When
      const employees = await service.getEmployees();

      // Then
      expect(employees).toHaveLength(1);
      expect(employees[0].name).toBe('유경준');
      expect(mockedAxios.get).not.toHaveBeenCalled(); // 외부 API 호출 안함
    });

    it('강제 새로고침시 외부 API에서 동기화해야 한다', async () => {
      // Given - 로컬 데이터 준비
      const localEmployee = new Employee(
        '25007',
        '유경준_구버전',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
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
      localEmployee.lastSyncAt = new Date();
      await repository.save(localEmployee);

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockExternalEmployees[0]],
      });

      // When - 강제 새로고침
      const employees = await service.getEmployees(true);

      // Then
      expect(employees).toHaveLength(1);
      expect(employees[0].name).toBe('유경준'); // 외부 데이터로 업데이트됨
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('24시간 이상 동기화되지 않은 경우 백그라운드 동기화를 시작해야 한다', async () => {
      // Given - 오래된 로컬 데이터 준비
      const oldEmployee = new Employee(
        '25007',
        '유경준',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
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
      const oldSyncTime = new Date();
      oldSyncTime.setDate(oldSyncTime.getDate() - 2); // 2일 전
      oldEmployee.lastSyncAt = oldSyncTime;
      await repository.save(oldEmployee);

      mockedAxios.get.mockResolvedValueOnce({
        data: [mockExternalEmployees[0]],
      });

      // When
      const employees = await service.getEmployees();

      // Then
      expect(employees).toHaveLength(1); // 즉시 로컬 데이터 반환
      expect(employees[0].name).toBe('유경준');

      // 백그라운드 동기화가 시작되었는지 확인 (비동기이므로 잠시 대기)
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('개별 직원 조회', () => {
    beforeEach(async () => {
      // 테스트 데이터 준비
      const employee = new Employee(
        '25007',
        '유경준',
        'yu.gyeongjun@lumir.space',
        '67d116b691e5366c32791630',
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
      employee.lastSyncAt = new Date();
      await repository.save(employee);
    });

    it('ID로 직원을 조회할 수 있어야 한다', async () => {
      // Given
      const savedEmployee = await repository.findByEmployeeNumber('25007');

      // When
      const employee = await service.getEmployeeById(savedEmployee!.id);

      // Then
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('유경준');
      expect(mockedAxios.get).not.toHaveBeenCalled(); // 로컬에서 조회
    });

    it('외부 ID로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const employee = await service.getEmployeeByExternalId(
        '67d116b691e5366c32791630',
      );

      // Then
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('유경준');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('직원번호로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const employee = await service.getEmployeeByEmployeeNumber('25007');

      // Then
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('유경준');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('이메일로 직원을 조회할 수 있어야 한다', async () => {
      // When
      const employee = await service.getEmployeeByEmail(
        'yu.gyeongjun@lumir.space',
      );

      // Then
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('유경준');
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('존재하지 않는 직원 조회시 외부 API에서 동기화 후 조회해야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: [mockExternalEmployees[1]], // 김개발 데이터
      });

      // When
      const employee = await service.getEmployeeByEmployeeNumber('25008');

      // Then
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('김개발');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // 외부 API 호출됨
    });

    it('강제 새로고침시 외부 API에서 동기화 후 조회해야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: [mockExternalEmployees[0]],
      });

      // When - 강제 새로고침
      const employee = await service.getEmployeeByEmployeeNumber('25007', true);

      // Then
      expect(employee).toBeDefined();
      expect(employee?.name).toBe('유경준');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('수동 동기화', () => {
    it('수동 동기화를 트리거할 수 있어야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: mockExternalEmployees,
      });

      // When
      const result = await service.triggerManualSync();

      // Then
      expect(result.success).toBe(true);
      expect(result.totalProcessed).toBe(3);
      expect(result.created).toBe(3);
      expect(result.updated).toBe(0);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('에러 처리', () => {
    it('외부 API 에러시 적절한 에러 메시지를 반환해야 한다', async () => {
      // Given
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      // When
      const result = await service.syncEmployees();

      // Then
      expect(result.success).toBe(false);
      expect(result.totalProcessed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('직원 동기화 실패');
    });

    it('데이터베이스 에러시 적절한 에러 메시지를 반환해야 한다', async () => {
      // Given
      mockedAxios.get.mockResolvedValueOnce({
        data: mockExternalEmployees,
      });

      // repository의 saveMany 메서드를 모킹하여 에러 발생시키기
      const originalSaveMany = repository.saveMany;
      jest
        .spyOn(repository, 'saveMany')
        .mockRejectedValueOnce(new Error('Database connection failed'));

      // When
      const result = await service.syncEmployees();

      // Then
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('직원 동기화 실패');
      expect(result.errors[0]).toContain('Database connection failed');

      // 원래 메서드 복원
      repository.saveMany = originalSaveMany;
    });
  });
});
