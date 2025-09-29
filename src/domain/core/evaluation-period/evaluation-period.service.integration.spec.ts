import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EvaluationPeriodService } from './evaluation-period.service';
import { EvaluationPeriod } from './evaluation-period.entity';
import { EvaluationPeriodValidationService } from './evaluation-period-validation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DatabaseModule } from '@libs/database/database.module';
import {
  EvaluationPeriodStatus,
  EvaluationPeriodPhase,
  CreateEvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
  GradeType,
  CreateGradeRangeDto,
} from './evaluation-period.types';
import {
  EvaluationPeriodNotFoundException,
  InvalidEvaluationPeriodStatusTransitionException,
} from './evaluation-period.exceptions';

describe('EvaluationPeriodService Integration Tests', () => {
  let service: EvaluationPeriodService;
  let dataSource: DataSource;
  let module: TestingModule;

  const testUserId = 'test-user-123';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, TypeOrmModule.forFeature([EvaluationPeriod])],
      providers: [
        EvaluationPeriodService,
        EvaluationPeriodValidationService,
        TransactionManagerService,
      ],
    }).compile();

    service = module.get<EvaluationPeriodService>(EvaluationPeriodService);
    dataSource = module.get<DataSource>(DataSource);

    // 데이터베이스 스키마 동기화
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await module.close();
  });

  beforeEach(async () => {
    // 각 테스트 전에 데이터 정리
    await dataSource.getRepository(EvaluationPeriod).clear();
  });

  describe('평가 기간 생성', () => {
    describe('생성한다', () => {
      it('새로운 평가 기간을 생성할 수 있다', async () => {
        // Given
        const createDto: CreateEvaluationPeriodDto = {
          name: '2024년 상반기 평가',
          description: '2024년 상반기 인사평가 기간',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          evaluationSetupDeadline: new Date('2024-01-15'),
          performanceDeadline: new Date('2024-06-15'),
          selfEvaluationDeadline: new Date('2024-06-25'),
          peerEvaluationDeadline: new Date('2024-06-30'),
          maxSelfEvaluationRate: 120,
        };

        // When
        const result = await service.생성한다(createDto, testUserId);

        // Then
        expect(result).toBeDefined();
        expect(result.name).toBe(createDto.name);
        expect(result.description).toBe(createDto.description);
        expect(result.status).toBe(EvaluationPeriodStatus.WAITING);
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.WAITING);
        expect(result.maxSelfEvaluationRate).toBe(120);
        expect(result.createdBy).toBe(testUserId);
      });

      it('등급 구간과 함께 평가 기간을 생성할 수 있다', async () => {
        // Given
        const gradeRanges: CreateGradeRangeDto[] = [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 75, maxRange: 84 },
          { grade: 'C', minRange: 65, maxRange: 74 },
          { grade: 'F', minRange: 0, maxRange: 64 },
        ];

        const createDto: CreateEvaluationPeriodDto = {
          name: '2024년 상반기 평가',
          description: '2024년 상반기 인사평가 기간',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
          gradeRanges,
        };

        // When
        const result = await service.생성한다(createDto, testUserId);

        // Then
        expect(result).toBeDefined();
        expect(result.gradeRanges).toHaveLength(5);
        expect(result.gradeRanges[0].grade).toBe(GradeType.S);
      });

      it('중복된 이름으로 생성 시 예외를 발생시킨다', async () => {
        // Given
        const createDto: CreateEvaluationPeriodDto = {
          name: '2024년 상반기 평가',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-06-30'),
        };

        await service.생성한다(createDto, testUserId);

        // When & Then
        await expect(service.생성한다(createDto, testUserId)).rejects.toThrow();
      });
    });
  });

  describe('평가 기간 조회', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    describe('ID로_조회한다', () => {
      it('존재하는 ID로 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.ID로_조회한다(createdPeriod.id);

        // Then
        expect(result).toBeDefined();
        expect(result!.id).toBe(createdPeriod.id);
        expect(result!.name).toBe('2024년 상반기 평가');
      });

      it('존재하지 않는 ID로 조회 시 null을 반환한다', async () => {
        // When
        const result = await service.ID로_조회한다(
          '00000000-0000-0000-0000-000000000000',
        );

        // Then
        expect(result).toBeNull();
      });
    });

    describe('이름으로_조회한다', () => {
      it('존재하는 이름으로 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.이름으로_조회한다('2024년 상반기 평가');

        // Then
        expect(result).toBeDefined();
        expect(result!.name).toBe('2024년 상반기 평가');
      });

      it('존재하지 않는 이름으로 조회 시 null을 반환한다', async () => {
        // When
        const result = await service.이름으로_조회한다('존재하지 않는 평가');

        // Then
        expect(result).toBeNull();
      });
    });

    describe('전체_조회한다', () => {
      it('모든 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.전체_조회한다();

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('2024년 상반기 평가');
      });
    });

    describe('상태별_조회한다', () => {
      it('특정 상태의 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.상태별_조회한다(
          EvaluationPeriodStatus.WAITING,
        );

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe(EvaluationPeriodStatus.WAITING);
      });

      it('해당 상태의 평가 기간이 없으면 빈 배열을 반환한다', async () => {
        // When
        const result = await service.상태별_조회한다(
          EvaluationPeriodStatus.COMPLETED,
        );

        // Then
        expect(result).toHaveLength(0);
      });
    });

    describe('단계별_조회한다', () => {
      it('특정 단계의 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.단계별_조회한다(
          EvaluationPeriodPhase.WAITING,
        );

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].currentPhase).toBe(EvaluationPeriodPhase.WAITING);
      });
    });

    describe('활성화된_평가기간_조회한다', () => {
      it('활성화된 평가 기간을 조회할 수 있다', async () => {
        // Given
        await service.시작한다(createdPeriod.id, testUserId);

        // When
        const result = await service.활성화된_평가기간_조회한다();

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      });

      it('활성화된 평가 기간이 없으면 빈 배열을 반환한다', async () => {
        // When
        const result = await service.활성화된_평가기간_조회한다();

        // Then
        expect(result).toHaveLength(0);
      });
    });

    describe('현재_진행중_평가기간_조회한다', () => {
      it('현재 진행 중인 평가 기간을 조회할 수 있다', async () => {
        // Given
        const now = new Date();
        const updateDto: UpdateEvaluationPeriodDto = {
          startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 어제
          endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 내일
        };
        await service.업데이트한다(createdPeriod.id, updateDto, testUserId);
        await service.시작한다(createdPeriod.id, testUserId);

        // When
        const result = await service.현재_진행중_평가기간_조회한다();

        // Then
        expect(result).toBeDefined();
        expect(result!.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      });

      it('현재 진행 중인 평가 기간이 없으면 null을 반환한다', async () => {
        // When
        const result = await service.현재_진행중_평가기간_조회한다();

        // Then
        expect(result).toBeNull();
      });
    });

    describe('완료된_평가기간_조회한다', () => {
      it('완료된 평가 기간을 조회할 수 있다', async () => {
        // Given
        await service.시작한다(createdPeriod.id, testUserId); // 자동으로 EVALUATION_SETUP으로 이동
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.SELF_EVALUATION,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PEER_EVALUATION,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.CLOSURE,
          testUserId,
        );
        await service.완료한다(createdPeriod.id, testUserId);

        // When
        const result = await service.완료된_평가기간_조회한다();

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe(EvaluationPeriodStatus.COMPLETED);
      });
    });

    describe('필터_조회한다', () => {
      it('필터 조건으로 평가 기간을 조회할 수 있다', async () => {
        // When
        const result = await service.필터_조회한다({
          status: EvaluationPeriodStatus.WAITING,
          currentPhase: EvaluationPeriodPhase.WAITING,
        });

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe(EvaluationPeriodStatus.WAITING);
        expect(result[0].currentPhase).toBe(EvaluationPeriodPhase.WAITING);
      });

      it('activeOnly 필터로 활성화된 평가 기간만 조회할 수 있다', async () => {
        // Given
        await service.시작한다(createdPeriod.id, testUserId);

        // When
        const result = await service.필터_조회한다({ activeOnly: true });

        // Then
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      });
    });
  });

  describe('평가 기간 업데이트', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    describe('업데이트한다', () => {
      it('평가 기간 정보를 업데이트할 수 있다', async () => {
        // Given
        const updateDto: UpdateEvaluationPeriodDto = {
          name: '2024년 상반기 평가 (수정)',
          description: '수정된 설명',
          maxSelfEvaluationRate: 150,
        };

        // When
        const result = await service.업데이트한다(
          createdPeriod.id,
          updateDto,
          testUserId,
        );

        // Then
        expect(result.name).toBe('2024년 상반기 평가 (수정)');
        expect(result.description).toBe('수정된 설명');
        expect(result.maxSelfEvaluationRate).toBe(150);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('등급 구간을 업데이트할 수 있다', async () => {
        // Given
        const gradeRanges: CreateGradeRangeDto[] = [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
        ];
        const updateDto: UpdateEvaluationPeriodDto = {
          gradeRanges,
        };

        // When
        const result = await service.업데이트한다(
          createdPeriod.id,
          updateDto,
          testUserId,
        );

        // Then
        expect(result.gradeRanges).toHaveLength(2);
        expect(result.gradeRanges[0].grade).toBe(GradeType.S);
      });

      it('존재하지 않는 ID로 업데이트 시 예외를 발생시킨다', async () => {
        // Given
        const updateDto: UpdateEvaluationPeriodDto = {
          name: '수정된 이름',
        };

        // When & Then
        await expect(
          service.업데이트한다(
            '00000000-0000-0000-0000-000000000000',
            updateDto,
            testUserId,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });
  });

  describe('평가 기간 삭제', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    describe('삭제한다', () => {
      it('평가 기간을 삭제할 수 있다', async () => {
        // When
        await service.삭제한다(createdPeriod.id, testUserId);

        // Then
        const result = await service.ID로_조회한다(createdPeriod.id);
        expect(result).toBeNull();
      });

      it('존재하지 않는 ID로 삭제 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.삭제한다('00000000-0000-0000-0000-000000000000', testUserId),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });
  });

  describe('평가 기간 상태 관리', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    describe('시작한다', () => {
      it('평가 기간을 시작할 수 있다', async () => {
        // When
        const result = await service.시작한다(createdPeriod.id, testUserId);

        // Then
        expect(result.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
        expect(result.currentPhase).toBe(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );
        expect(result.updatedBy).toBe(testUserId);
      });

      it('이미 시작된 평가 기간을 다시 시작하려 하면 예외를 발생시킨다', async () => {
        // Given
        await service.시작한다(createdPeriod.id, testUserId);

        // When & Then
        await expect(
          service.시작한다(createdPeriod.id, testUserId),
        ).rejects.toThrow(InvalidEvaluationPeriodStatusTransitionException);
      });

      it('존재하지 않는 ID로 시작 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.시작한다('00000000-0000-0000-0000-000000000000', testUserId),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });

    describe('완료한다', () => {
      it('종결 단계에서 평가 기간을 완료할 수 있다', async () => {
        // Given
        await service.시작한다(createdPeriod.id, testUserId); // 자동으로 EVALUATION_SETUP으로 이동
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.SELF_EVALUATION,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PEER_EVALUATION,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.CLOSURE,
          testUserId,
        );

        // When
        const result = await service.완료한다(createdPeriod.id, testUserId);

        // Then
        expect(result.status).toBe(EvaluationPeriodStatus.COMPLETED);
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);
        expect(result.completedDate).toBeDefined();
        expect(result.updatedBy).toBe(testUserId);
      });

      it('종결 단계가 아닌 상태에서 완료하려 하면 예외를 발생시킨다', async () => {
        // Given
        await service.시작한다(createdPeriod.id, testUserId);

        // When & Then
        await expect(
          service.완료한다(createdPeriod.id, testUserId),
        ).rejects.toThrow(InvalidEvaluationPeriodStatusTransitionException);
      });

      it('존재하지 않는 ID로 완료 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.완료한다('00000000-0000-0000-0000-000000000000', testUserId),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });

    describe('단계_변경한다', () => {
      beforeEach(async () => {
        await service.시작한다(createdPeriod.id, testUserId);
      });

      it('업무수행 단계로 변경할 수 있다', async () => {
        // When
        const result = await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          testUserId,
        );

        // Then
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.PERFORMANCE);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('자기평가 단계로 변경할 수 있다', async () => {
        // Given
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          testUserId,
        );

        // When
        const result = await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.SELF_EVALUATION,
          testUserId,
        );

        // Then
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.SELF_EVALUATION);
      });

      it('하향동료평가 단계로 변경할 수 있다', async () => {
        // Given
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.SELF_EVALUATION,
          testUserId,
        );

        // When
        const result = await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PEER_EVALUATION,
          testUserId,
        );

        // Then
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.PEER_EVALUATION);
      });

      it('종결 단계로 변경할 수 있다', async () => {
        // Given
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PERFORMANCE,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.SELF_EVALUATION,
          testUserId,
        );
        await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.PEER_EVALUATION,
          testUserId,
        );

        // When
        const result = await service.단계_변경한다(
          createdPeriod.id,
          EvaluationPeriodPhase.CLOSURE,
          testUserId,
        );

        // Then
        expect(result.currentPhase).toBe(EvaluationPeriodPhase.CLOSURE);
      });

      it('지원하지 않는 단계로 변경 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.단계_변경한다(
            createdPeriod.id,
            'INVALID_PHASE' as EvaluationPeriodPhase,
            testUserId,
          ),
        ).rejects.toThrow();
      });

      it('존재하지 않는 ID로 단계 변경 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.단계_변경한다(
            '00000000-0000-0000-0000-000000000000',
            EvaluationPeriodPhase.PERFORMANCE,
            testUserId,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });
  });

  describe('수동 허용 설정 관리', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    describe('수동허용설정_변경한다', () => {
      it('평가 기준 설정 수동 허용을 활성화할 수 있다', async () => {
        // When
        const result = await service.수동허용설정_변경한다(
          createdPeriod.id,
          true,
          undefined,
          undefined,
          testUserId,
        );

        // Then
        expect(result.criteriaSettingEnabled).toBe(true);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('자기평가 설정 수동 허용을 활성화할 수 있다', async () => {
        // When
        const result = await service.수동허용설정_변경한다(
          createdPeriod.id,
          undefined,
          true,
          undefined,
          testUserId,
        );

        // Then
        expect(result.selfEvaluationSettingEnabled).toBe(true);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('최종평가 설정 수동 허용을 활성화할 수 있다', async () => {
        // When
        const result = await service.수동허용설정_변경한다(
          createdPeriod.id,
          undefined,
          undefined,
          true,
          testUserId,
        );

        // Then
        expect(result.finalEvaluationSettingEnabled).toBe(true);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('모든 수동 허용 설정을 한 번에 변경할 수 있다', async () => {
        // When
        const result = await service.수동허용설정_변경한다(
          createdPeriod.id,
          true,
          true,
          true,
          testUserId,
        );

        // Then
        expect(result.criteriaSettingEnabled).toBe(true);
        expect(result.selfEvaluationSettingEnabled).toBe(true);
        expect(result.finalEvaluationSettingEnabled).toBe(true);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('존재하지 않는 ID로 설정 변경 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.수동허용설정_변경한다(
            '00000000-0000-0000-0000-000000000000',
            true,
            undefined,
            undefined,
            testUserId,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });
  });

  describe('자기평가 달성률 관리', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    describe('자기평가_달성률최대값_설정한다', () => {
      it('자기평가 달성률 최대값을 설정할 수 있다', async () => {
        // When
        const result = await service.자기평가_달성률최대값_설정한다(
          createdPeriod.id,
          150,
          testUserId,
        );

        // Then
        expect(result.maxSelfEvaluationRate).toBe(150);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('존재하지 않는 ID로 설정 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.자기평가_달성률최대값_설정한다(
            '00000000-0000-0000-0000-000000000000',
            150,
            testUserId,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });
  });

  describe('등급 구간 관리', () => {
    let createdPeriod: any;

    beforeEach(async () => {
      const createDto: CreateEvaluationPeriodDto = {
        name: '2024년 상반기 평가',
        description: '2024년 상반기 인사평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      };
      createdPeriod = await service.생성한다(createDto, testUserId);
    });

    const testGradeRanges: CreateGradeRangeDto[] = [
      { grade: 'S', minRange: 95, maxRange: 100 },
      { grade: 'A', minRange: 85, maxRange: 94 },
      { grade: 'B', minRange: 75, maxRange: 84 },
      { grade: 'C', minRange: 65, maxRange: 74 },
      { grade: 'F', minRange: 0, maxRange: 64 },
    ];

    describe('등급구간_설정한다', () => {
      it('평가 기간의 등급 구간을 설정할 수 있다', async () => {
        // When
        const result = await service.등급구간_설정한다(
          createdPeriod.id,
          testGradeRanges,
          testUserId,
        );

        // Then
        expect(result.gradeRanges).toHaveLength(5);
        expect(result.gradeRanges[0].grade).toBe(GradeType.S);
        expect(result.updatedBy).toBe(testUserId);
      });

      it('존재하지 않는 ID로 설정 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.등급구간_설정한다(
            '00000000-0000-0000-0000-000000000000',
            testGradeRanges,
            testUserId,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });

    describe('점수로_등급_조회한다', () => {
      beforeEach(async () => {
        await service.등급구간_설정한다(
          createdPeriod.id,
          testGradeRanges,
          testUserId,
        );
      });

      it('점수에 해당하는 등급을 조회할 수 있다', async () => {
        // When
        const result = await service.점수로_등급_조회한다(createdPeriod.id, 97);

        // Then
        expect(result).toBeDefined();
        expect(result!.grade).toBe(GradeType.S);
        expect(result!.score).toBe(97);
        expect(result!.finalGrade).toBe('S');
      });

      it('범위에 해당하지 않는 점수에 대해 null을 반환한다', async () => {
        // When
        const result = await service.점수로_등급_조회한다(
          createdPeriod.id,
          105,
        );

        // Then
        expect(result).toBeNull();
      });

      it('존재하지 않는 ID로 조회 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.점수로_등급_조회한다(
            '00000000-0000-0000-0000-000000000000',
            97,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });

    describe('등급구간_목록_조회한다', () => {
      beforeEach(async () => {
        await service.등급구간_설정한다(
          createdPeriod.id,
          testGradeRanges,
          testUserId,
        );
      });

      it('평가 기간의 등급 구간 목록을 조회할 수 있다', async () => {
        // When
        const result = await service.등급구간_목록_조회한다(createdPeriod.id);

        // Then
        expect(result).toHaveLength(5);
        expect(result[0].grade).toBe(GradeType.S);
      });

      it('등급 구간이 설정되지 않은 경우 빈 배열을 반환한다', async () => {
        // Given
        const newPeriod = await service.생성한다(
          {
            name: '새로운 평가 기간',
            startDate: new Date('2024-07-01'),
            endDate: new Date('2024-12-31'),
          },
          testUserId,
        );

        // When
        const result = await service.등급구간_목록_조회한다(newPeriod.id);

        // Then
        expect(result).toHaveLength(0);
      });

      it('존재하지 않는 ID로 조회 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.등급구간_목록_조회한다(
            '00000000-0000-0000-0000-000000000000',
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });

    describe('등급구간_조회한다', () => {
      beforeEach(async () => {
        await service.등급구간_설정한다(
          createdPeriod.id,
          testGradeRanges,
          testUserId,
        );
      });

      it('특정 등급의 구간 정보를 조회할 수 있다', async () => {
        // When
        const result = await service.등급구간_조회한다(
          createdPeriod.id,
          GradeType.A,
        );

        // Then
        expect(result).toBeDefined();
        expect(result!.grade).toBe(GradeType.A);
        expect(result!.minRange).toBe(85);
        expect(result!.maxRange).toBe(94);
      });

      it('존재하지 않는 등급에 대해 null을 반환한다', async () => {
        // Given
        const limitedGrades: CreateGradeRangeDto[] = [
          { grade: 'A', minRange: 85, maxRange: 100 },
        ];
        await service.등급구간_설정한다(
          createdPeriod.id,
          limitedGrades,
          testUserId,
        );

        // When
        const result = await service.등급구간_조회한다(
          createdPeriod.id,
          GradeType.B,
        );

        // Then
        expect(result).toBeNull();
      });

      it('존재하지 않는 ID로 조회 시 예외를 발생시킨다', async () => {
        // When & Then
        await expect(
          service.등급구간_조회한다(
            '00000000-0000-0000-0000-000000000000',
            GradeType.A,
          ),
        ).rejects.toThrow(EvaluationPeriodNotFoundException);
      });
    });
  });
});
