import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { EvaluationPeriodValidationService } from './evaluation-period-validation.service';
import { EvaluationPeriod } from './evaluation-period.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  CreateEvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
} from './evaluation-period.types';
import {
  EvaluationPeriodNameDuplicateException,
  EvaluationPeriodOverlapException,
  EvaluationPeriodRequiredDataMissingException,
  InvalidEvaluationPeriodDataFormatException,
  InvalidEvaluationPeriodDateRangeException,
  InvalidSelfEvaluationRateException,
  EvaluationPeriodBusinessRuleViolationException,
} from './evaluation-period.exceptions';

describe('EvaluationPeriodValidationService', () => {
  let service: EvaluationPeriodValidationService;
  let repository: jest.Mocked<Repository<EvaluationPeriod>>;
  let transactionManager: jest.Mocked<TransactionManagerService>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockTransactionManager = {
      getRepository: jest.fn(),
    };

    const mockEntityManagerInstance = {} as EntityManager;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationPeriodValidationService,
        {
          provide: getRepositoryToken(EvaluationPeriod),
          useValue: mockRepository,
        },
        {
          provide: TransactionManagerService,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    service = module.get<EvaluationPeriodValidationService>(
      EvaluationPeriodValidationService,
    );
    repository = module.get(getRepositoryToken(EvaluationPeriod));
    transactionManager = module.get(TransactionManagerService);
    mockEntityManager = mockEntityManagerInstance as jest.Mocked<EntityManager>;

    // TransactionManager가 repository를 반환하도록 설정
    transactionManager.getRepository.mockReturnValue(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('생성데이터검증한다', () => {
    const validCreateDto: CreateEvaluationPeriodDto = {
      name: '2024년 상반기 평가',
      description: '2024년 상반기 인사평가 기간',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      maxSelfEvaluationRate: 120,
    };

    it('유효한 생성 데이터를 검증한다', async () => {
      // Given
      repository.findOne.mockResolvedValue(null); // 중복 없음
      repository.find.mockResolvedValue([]); // 겹치는 기간 없음

      // When & Then
      await expect(
        service.생성데이터검증한다(validCreateDto),
      ).resolves.not.toThrow();
    });

    it('필수 데이터가 누락된 경우 예외를 발생시킨다', async () => {
      // Given
      const invalidDto = {
        ...validCreateDto,
        name: '', // 필수 데이터 누락
      };

      // When & Then
      await expect(service.생성데이터검증한다(invalidDto)).rejects.toThrow(
        EvaluationPeriodRequiredDataMissingException,
      );
    });

    it('잘못된 날짜 범위인 경우 예외를 발생시킨다', async () => {
      // Given
      const invalidDto = {
        ...validCreateDto,
        startDate: new Date('2024-06-30'),
        endDate: new Date('2024-01-01'), // 시작일이 종료일보다 늦음
      };

      // When & Then
      await expect(service.생성데이터검증한다(invalidDto)).rejects.toThrow(
        InvalidEvaluationPeriodDateRangeException,
      );
    });

    it('중복된 이름인 경우 예외를 발생시킨다', async () => {
      // Given
      const existingPeriod = new EvaluationPeriod();
      existingPeriod.name = validCreateDto.name;
      repository.findOne.mockResolvedValue(existingPeriod);

      // When & Then
      await expect(service.생성데이터검증한다(validCreateDto)).rejects.toThrow(
        EvaluationPeriodNameDuplicateException,
      );
    });

    it('기간이 겹치는 경우 예외를 발생시킨다', async () => {
      // Given
      repository.findOne.mockResolvedValue(null); // 이름 중복 없음

      const overlappingPeriod = new EvaluationPeriod();
      overlappingPeriod.startDate = new Date('2023-12-01');
      overlappingPeriod.endDate = new Date('2024-03-31');
      repository.find.mockResolvedValue([overlappingPeriod]);

      // When & Then
      await expect(service.생성데이터검증한다(validCreateDto)).rejects.toThrow(
        EvaluationPeriodOverlapException,
      );
    });

    it('잘못된 자기평가 달성률인 경우 예외를 발생시킨다', async () => {
      // Given
      const invalidDto = {
        ...validCreateDto,
        maxSelfEvaluationRate: 250, // 유효 범위 초과
      };
      repository.findOne.mockResolvedValue(null);
      repository.find.mockResolvedValue([]);

      // When & Then
      await expect(service.생성데이터검증한다(invalidDto)).rejects.toThrow(
        InvalidSelfEvaluationRateException,
      );
    });
  });

  describe('업데이트데이터검증한다', () => {
    const validUpdateDto: UpdateEvaluationPeriodDto = {
      name: '2024년 상반기 평가 (수정)',
      description: '수정된 설명',
      maxSelfEvaluationRate: 150,
    };

    const existingPeriod = new EvaluationPeriod();
    existingPeriod.id = 'existing-id';
    existingPeriod.name = '기존 평가 기간';
    existingPeriod.startDate = new Date('2024-01-01');
    existingPeriod.endDate = new Date('2024-06-30');

    it('유효한 업데이트 데이터를 검증한다', async () => {
      // Given
      repository.findOne.mockResolvedValue(null); // 중복 없음
      repository.find.mockResolvedValue([]); // 겹치는 기간 없음

      // When & Then
      await expect(
        service.업데이트데이터검증한다('existing-id', validUpdateDto),
      ).resolves.not.toThrow();
    });

    it('중복된 이름으로 업데이트 시 예외를 발생시킨다', async () => {
      // Given
      const duplicatePeriod = new EvaluationPeriod();
      duplicatePeriod.id = 'different-id';
      duplicatePeriod.name = validUpdateDto.name!;
      repository.findOne.mockResolvedValue(duplicatePeriod);

      // When & Then
      await expect(
        service.업데이트데이터검증한다('existing-id', validUpdateDto),
      ).rejects.toThrow(EvaluationPeriodNameDuplicateException);
    });

    it('같은 ID의 평가 기간은 이름 중복 검증에서 제외한다', async () => {
      // Given
      const samePeriod = new EvaluationPeriod();
      samePeriod.id = 'existing-id'; // 같은 ID
      samePeriod.name = validUpdateDto.name!;
      repository.findOne.mockResolvedValue(samePeriod);
      repository.find.mockResolvedValue([]);

      // When & Then
      await expect(
        service.업데이트데이터검증한다('existing-id', validUpdateDto),
      ).resolves.not.toThrow();
    });

    it('잘못된 날짜 범위로 업데이트 시 예외를 발생시킨다', async () => {
      // Given
      const invalidDto = {
        ...validUpdateDto,
        startDate: new Date('2024-06-30'),
        endDate: new Date('2024-01-01'), // 시작일이 종료일보다 늦음
      };
      repository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.업데이트데이터검증한다('existing-id', invalidDto),
      ).rejects.toThrow(InvalidEvaluationPeriodDateRangeException);
    });

    it('잘못된 자기평가 달성률로 업데이트 시 예외를 발생시킨다', async () => {
      // Given
      const invalidDto = {
        ...validUpdateDto,
        maxSelfEvaluationRate: -10, // 유효 범위 미만
      };
      repository.findOne.mockResolvedValue(null);
      repository.find.mockResolvedValue([]);

      // When & Then
      await expect(
        service.업데이트데이터검증한다('existing-id', invalidDto),
      ).rejects.toThrow(InvalidSelfEvaluationRateException);
    });
  });

  describe('평가기간삭제비즈니스규칙검증한다', () => {
    const existingPeriod = new EvaluationPeriod();
    existingPeriod.id = 'existing-id';
    existingPeriod.status = EvaluationPeriodStatus.WAITING;

    it('대기 상태의 평가 기간은 삭제할 수 있다', async () => {
      // Given
      existingPeriod.status = EvaluationPeriodStatus.WAITING;

      // When & Then
      await expect(
        service.평가기간삭제비즈니스규칙검증한다(existingPeriod),
      ).resolves.not.toThrow();
    });

    it('진행 중인 평가 기간은 삭제할 수 없다', async () => {
      // Given
      existingPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

      // When & Then
      await expect(
        service.평가기간삭제비즈니스규칙검증한다(existingPeriod),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);
    });

    it('완료된 평가 기간은 삭제할 수 없다', async () => {
      // Given
      existingPeriod.status = EvaluationPeriodStatus.COMPLETED;

      // When & Then
      await expect(
        service.평가기간삭제비즈니스규칙검증한다(existingPeriod),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);
    });
  });

  describe('평가기간시작비즈니스규칙검증한다', () => {
    it('대기 상태의 평가 기간은 시작할 수 있다', async () => {
      // Given
      const existingPeriod = new EvaluationPeriod();
      existingPeriod.status = EvaluationPeriodStatus.WAITING;
      repository.findOne.mockResolvedValue(existingPeriod);

      // When & Then
      await expect(
        service.평가기간시작비즈니스규칙검증한다('existing-id'),
      ).resolves.not.toThrow();
    });

    it('이미 진행 중인 평가 기간은 시작할 수 없다', async () => {
      // Given
      const existingPeriod = new EvaluationPeriod();
      existingPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
      repository.findOne.mockResolvedValue(existingPeriod);

      // When & Then
      await expect(
        service.평가기간시작비즈니스규칙검증한다('existing-id'),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);
    });

    it('완료된 평가 기간은 시작할 수 없다', async () => {
      // Given
      const existingPeriod = new EvaluationPeriod();
      existingPeriod.status = EvaluationPeriodStatus.COMPLETED;
      repository.findOne.mockResolvedValue(existingPeriod);

      // When & Then
      await expect(
        service.평가기간시작비즈니스규칙검증한다('existing-id'),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);
    });

    it('존재하지 않는 평가 기간 시작 시 예외를 발생시킨다', async () => {
      // Given
      repository.findOne.mockResolvedValue(null);

      // When & Then
      await expect(
        service.평가기간시작비즈니스규칙검증한다('non-existing-id'),
      ).rejects.toThrow();
    });
  });

  // Private 메서드들은 public 메서드를 통해 간접적으로 테스트됨

  describe('EntityManager를 사용한 검증', () => {
    it('EntityManager가 제공되면 해당 매니저를 사용한다', async () => {
      // Given
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };

      transactionManager.getRepository.mockReturnValue(
        mockEntityManager as any,
      );
      mockEntityManager.findOne.mockResolvedValue(null);
      mockEntityManager.find.mockResolvedValue([]);

      // When
      await service.생성데이터검증한다(createDto, mockEntityManager);

      // Then
      expect(transactionManager.getRepository).toHaveBeenCalledWith(
        EvaluationPeriod,
        repository,
        mockEntityManager,
      );
    });
  });
});
