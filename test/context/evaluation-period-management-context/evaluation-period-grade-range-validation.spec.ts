import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource, Repository } from 'typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriodBusinessRuleViolationException } from '@domain/core/evaluation-period/evaluation-period.exceptions';
import { CreateEvaluationPeriodMinimalDto } from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';
import {
  CreateEvaluationPeriodCommandHandler,
  CreateEvaluationPeriodCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/create-evaluation-period.handler';
import {
  UpdateEvaluationPeriodGradeRangesCommandHandler,
  UpdateEvaluationPeriodGradeRangesCommand,
} from '@context/evaluation-period-management-context/handlers/evaluation-period/commands/update-evaluation-period-grade-ranges.handler';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodValidationService } from '@domain/core/evaluation-period/evaluation-period-validation.service';
import { EvaluationPeriodAutoPhaseService } from '@domain/core/evaluation-period/evaluation-period-auto-phase.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { UpdateGradeRangesDto } from '@context/evaluation-period-management-context/interfaces/evaluation-period-creation.interface';

/**
 * 평가기간 등급 구간 점수 범위 검증 테스트
 *
 * 등급 구간의 점수 최대값이 1000으로 제한되는지 검증합니다.
 * - 생성 시 등급 구간 검증
 * - 수정 시 등급 구간 검증
 * - 1000 이하 값은 정상 처리
 * - 1000 초과 값은 예외 발생
 */
describe('평가기간 등급 구간 점수 범위 검증', () => {
  let createHandler: CreateEvaluationPeriodCommandHandler;
  let updateHandler: UpdateEvaluationPeriodGradeRangesCommandHandler;
  let dataSource: DataSource;
  let module: TestingModule;
  let evaluationPeriodRepository: Repository<EvaluationPeriod>;

  const systemAdminId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        CqrsModule,
        TypeOrmModule.forFeature([EvaluationPeriod, Employee]),
      ],
      providers: [
        // 서비스
        EvaluationPeriodService,
        EvaluationPeriodValidationService,
        EvaluationPeriodAutoPhaseService,
        EmployeeService,
        TransactionManagerService,
        // 핸들러
        CreateEvaluationPeriodCommandHandler,
        UpdateEvaluationPeriodGradeRangesCommandHandler,
      ],
    }).compile();

    createHandler = module.get<CreateEvaluationPeriodCommandHandler>(
      CreateEvaluationPeriodCommandHandler,
    );
    updateHandler = module.get<UpdateEvaluationPeriodGradeRangesCommandHandler>(
      UpdateEvaluationPeriodGradeRangesCommandHandler,
    );
    dataSource = module.get<DataSource>(DataSource);
    evaluationPeriodRepository = dataSource.getRepository(EvaluationPeriod);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    try {
      const periods = await evaluationPeriodRepository.find();
      await evaluationPeriodRepository.remove(periods);
    } catch (error) {
      // 초기 테스트에서는 무시
    }
  });

  describe('평가기간 생성 시 등급 구간 검증', () => {
    it('등급 구간의 최대값이 1000 이하인 경우 정상적으로 생성되어야 한다', async () => {
      // Given
      const 유효한등급구간 = [
        { grade: 'S', minRange: 950, maxRange: 1000 },
        { grade: 'A', minRange: 900, maxRange: 949 },
        { grade: 'B', minRange: 800, maxRange: 899 },
        { grade: 'C', minRange: 700, maxRange: 799 },
        { grade: 'D', minRange: 0, maxRange: 699 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 상반기 평가',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 최대값 1000 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 유효한등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(5);
      expect(result.gradeRanges[0].maxRange).toBe(1000);
      expect(result.gradeRanges[0].grade).toBe('S');
    });

    it('등급 구간의 최대값이 정확히 1000인 경우 정상적으로 생성되어야 한다', async () => {
      // Given
      const 최대값1000등급구간 = [
        { grade: 'S', minRange: 999, maxRange: 1000 },
        { grade: 'A', minRange: 0, maxRange: 998 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 하반기 평가',
        startDate: new Date('2024-07-01'),
        peerEvaluationDeadline: new Date('2024-12-31'),
        description: '등급 구간 최대값 1000 경계값 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 최대값1000등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(2);
      expect(result.gradeRanges[0].maxRange).toBe(1000);
    });

    it('등급 구간의 최대값이 1000을 초과하는 경우 예외가 발생해야 한다', async () => {
      // Given
      const 최대값초과등급구간 = [
        { grade: 'S', minRange: 950, maxRange: 1001 }, // 1000 초과
        { grade: 'A', minRange: 900, maxRange: 949 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 초과값 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 최대값 초과 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 최대값초과등급구간,
      };

      // When & Then
      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow('등급 S의 점수 범위는 0-1000 사이여야 합니다.');
    });

    it('여러 등급 구간 중 하나라도 최대값이 1000을 초과하면 예외가 발생해야 한다', async () => {
      // Given
      const 일부초과등급구간 = [
        { grade: 'S', minRange: 950, maxRange: 1000 },
        { grade: 'A', minRange: 900, maxRange: 949 },
        { grade: 'B', minRange: 800, maxRange: 899 },
        { grade: 'C', minRange: 700, maxRange: 1001 }, // 1000 초과
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 일부 초과값 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 일부 최대값 초과 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 일부초과등급구간,
      };

      // When & Then
      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow('등급 C의 점수 범위는 0-1000 사이여야 합니다.');
    });

    it('등급 구간의 최소값이 0 미만인 경우 예외가 발생해야 한다', async () => {
      // Given
      const 최소값미만등급구간 = [
        { grade: 'S', minRange: -1, maxRange: 1000 }, // 0 미만
        { grade: 'A', minRange: 0, maxRange: 999 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 최소값 미만 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 최소값 미만 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 최소값미만등급구간,
      };

      // When & Then
      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow('등급 S의 점수 범위는 0-1000 사이여야 합니다.');
    });
  });

  describe('평가기간 등급 구간 수정 시 검증', () => {
    let 기존평가기간Id: string;

    beforeEach(async () => {
      // 테스트용 평가기간 생성
      const 기본등급구간 = [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 90, maxRange: 94 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 수정 테스트용 평가기간',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 수정 테스트용',
        maxSelfEvaluationRate: 120,
        gradeRanges: 기본등급구간,
      };

      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      기존평가기간Id = result.id;
    });

    it('등급 구간의 최대값이 1000 이하로 수정하는 경우 정상적으로 수정되어야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: 950, maxRange: 1000 },
          { grade: 'A', minRange: 900, maxRange: 949 },
          { grade: 'B', minRange: 800, maxRange: 899 },
          { grade: 'C', minRange: 700, maxRange: 799 },
          { grade: 'D', minRange: 0, maxRange: 699 },
        ],
      };

      // When
      const result = await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          기존평가기간Id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(5);
      expect(result.gradeRanges[0].maxRange).toBe(1000);
      expect(result.gradeRanges[0].grade).toBe('S');
    });

    it('등급 구간의 최대값이 정확히 1000으로 수정하는 경우 정상적으로 수정되어야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: 999, maxRange: 1000 },
          { grade: 'A', minRange: 0, maxRange: 998 },
        ],
      };

      // When
      const result = await updateHandler.execute(
        new UpdateEvaluationPeriodGradeRangesCommand(
          기존평가기간Id,
          수정할등급구간,
          systemAdminId,
        ),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges).toHaveLength(2);
      expect(result.gradeRanges[0].maxRange).toBe(1000);
    });

    it('등급 구간의 최대값이 1000을 초과하도록 수정 시도 시 예외가 발생해야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: 950, maxRange: 1001 }, // 1000 초과
          { grade: 'A', minRange: 900, maxRange: 949 },
        ],
      };

      // When & Then
      await expect(
        updateHandler.execute(
          new UpdateEvaluationPeriodGradeRangesCommand(
            기존평가기간Id,
            수정할등급구간,
            systemAdminId,
          ),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        updateHandler.execute(
          new UpdateEvaluationPeriodGradeRangesCommand(
            기존평가기간Id,
            수정할등급구간,
            systemAdminId,
          ),
        ),
      ).rejects.toThrow('등급 S의 점수 범위는 0-1000 사이여야 합니다.');
    });

    it('여러 등급 구간 중 하나라도 최대값이 1000을 초과하면 수정 시 예외가 발생해야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: 950, maxRange: 1000 },
          { grade: 'A', minRange: 900, maxRange: 949 },
          { grade: 'B', minRange: 800, maxRange: 899 },
          { grade: 'C', minRange: 700, maxRange: 1001 }, // 1000 초과
        ],
      };

      // When & Then
      await expect(
        updateHandler.execute(
          new UpdateEvaluationPeriodGradeRangesCommand(
            기존평가기간Id,
            수정할등급구간,
            systemAdminId,
          ),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        updateHandler.execute(
          new UpdateEvaluationPeriodGradeRangesCommand(
            기존평가기간Id,
            수정할등급구간,
            systemAdminId,
          ),
        ),
      ).rejects.toThrow('등급 C의 점수 범위는 0-1000 사이여야 합니다.');
    });

    it('등급 구간의 최소값이 0 미만으로 수정 시도 시 예외가 발생해야 한다', async () => {
      // Given
      const 수정할등급구간: UpdateGradeRangesDto = {
        gradeRanges: [
          { grade: 'S', minRange: -1, maxRange: 1000 }, // 0 미만
          { grade: 'A', minRange: 0, maxRange: 999 },
        ],
      };

      // When & Then
      await expect(
        updateHandler.execute(
          new UpdateEvaluationPeriodGradeRangesCommand(
            기존평가기간Id,
            수정할등급구간,
            systemAdminId,
          ),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        updateHandler.execute(
          new UpdateEvaluationPeriodGradeRangesCommand(
            기존평가기간Id,
            수정할등급구간,
            systemAdminId,
          ),
        ),
      ).rejects.toThrow('등급 S의 점수 범위는 0-1000 사이여야 합니다.');
    });
  });

  describe('경계값 테스트', () => {
    it('등급 구간의 최대값이 999인 경우 정상적으로 생성되어야 한다', async () => {
      // Given
      const 최대값999등급구간 = [
        { grade: 'S', minRange: 998, maxRange: 999 },
        { grade: 'A', minRange: 0, maxRange: 997 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 경계값 999 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 최대값 999 경계값 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 최대값999등급구간,
      };

      // When
      const result = await createHandler.execute(
        new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
      );

      // Then
      expect(result).toBeDefined();
      expect(result.gradeRanges[0].maxRange).toBe(999);
    });

    it('등급 구간의 최대값이 1001인 경우 예외가 발생해야 한다', async () => {
      // Given
      const 최대값1001등급구간 = [
        { grade: 'S', minRange: 1000, maxRange: 1001 }, // 1000 초과
        { grade: 'A', minRange: 0, maxRange: 999 },
      ];

      const 평가기간데이터: CreateEvaluationPeriodMinimalDto = {
        name: '2024년 경계값 1001 테스트',
        startDate: new Date('2024-01-01'),
        peerEvaluationDeadline: new Date('2024-06-30'),
        description: '등급 구간 최대값 1001 경계값 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: 최대값1001등급구간,
      };

      // When & Then
      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow(EvaluationPeriodBusinessRuleViolationException);

      await expect(
        createHandler.execute(
          new CreateEvaluationPeriodCommand(평가기간데이터, systemAdminId),
        ),
      ).rejects.toThrow('등급 S의 점수 범위는 0-1000 사이여야 합니다.');
    });
  });
});

