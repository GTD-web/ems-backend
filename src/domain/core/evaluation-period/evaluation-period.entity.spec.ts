import { EvaluationPeriod } from './evaluation-period.entity';
import {
  InvalidEvaluationPeriodStatusTransitionException,
  InvalidSelfEvaluationRateException,
} from './evaluation-period.exceptions';
import {
  EvaluationPeriodPhase,
  EvaluationPeriodStatus,
  GradeRange,
  GradeType,
  SubGradeType,
} from './evaluation-period.types';

describe('EvaluationPeriod Entity', () => {
  let evaluationPeriod: EvaluationPeriod;
  const testUserId = 'test-user-123';

  beforeEach(() => {
    evaluationPeriod = new EvaluationPeriod();
    evaluationPeriod.id = 'test-period-id';
    evaluationPeriod.name = '2024년 상반기 평가';
    evaluationPeriod.description = '2024년 상반기 인사평가 기간';
    evaluationPeriod.startDate = new Date('2024-01-01');
    evaluationPeriod.endDate = new Date('2024-06-30');
    evaluationPeriod.status = EvaluationPeriodStatus.WAITING;
    evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;
    evaluationPeriod.maxSelfEvaluationRate = 120;
    evaluationPeriod.gradeRanges = [];
    evaluationPeriod.createdBy = testUserId;
    evaluationPeriod.updatedBy = testUserId;
    evaluationPeriod.createdAt = new Date();
    evaluationPeriod.updatedAt = new Date();
  });

  describe('평가 기간 상태 관리', () => {
    describe('평가기간_시작한다', () => {
      it('대기 상태에서 진행 상태로 변경되고 평가설정 단계로 이동한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.WAITING;
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;

        // When
        evaluationPeriod.평가기간_시작한다(testUserId);

        // Then
        expect(evaluationPeriod.status).toBe(
          EvaluationPeriodStatus.IN_PROGRESS,
        );
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('대기 상태가 아닌 경우 예외를 발생시킨다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

        // When & Then
        expect(() => evaluationPeriod.평가기간_시작한다(testUserId)).toThrow(
          InvalidEvaluationPeriodStatusTransitionException,
        );
      });
    });

    describe('평가기간_완료한다', () => {
      it('종결 단계에서 완료 상태로 변경된다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.CLOSURE;

        // When
        evaluationPeriod.평가기간_완료한다(testUserId);

        // Then
        expect(evaluationPeriod.status).toBe(EvaluationPeriodStatus.COMPLETED);
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.CLOSURE,
        );
        expect(evaluationPeriod.completedDate).toBeDefined();
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('종결 단계가 아닌 경우 예외를 발생시킨다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(() => evaluationPeriod.평가기간_완료한다(testUserId)).toThrow(
          InvalidEvaluationPeriodStatusTransitionException,
        );
      });
    });

    describe('평가기간_대기상태로_되돌린다', () => {
      it('진행 중인 상태에서 대기 상태로 되돌린다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When
        evaluationPeriod.평가기간_대기상태로_되돌린다(testUserId);

        // Then
        expect(evaluationPeriod.status).toBe(EvaluationPeriodStatus.WAITING);
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.WAITING,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('진행 중이 아닌 상태에서는 예외를 발생시킨다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.COMPLETED;

        // When & Then
        expect(() =>
          evaluationPeriod.평가기간_대기상태로_되돌린다(testUserId),
        ).toThrow(InvalidEvaluationPeriodStatusTransitionException);
      });
    });
  });

  describe('단계 전이 관리', () => {
    beforeEach(() => {
      evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
    });

    describe('평가설정_단계로_이동한다', () => {
      it('대기 단계에서 평가설정 단계로 이동한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;

        // When
        evaluationPeriod.평가설정_단계로_이동한다(testUserId);

        // Then
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('업무수행_단계로_이동한다', () => {
      it('평가설정 단계에서 업무수행 단계로 이동한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.EVALUATION_SETUP;

        // When
        evaluationPeriod.업무수행_단계로_이동한다(testUserId);

        // Then
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.PERFORMANCE,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('자기평가_단계로_이동한다', () => {
      it('업무수행 단계에서 자기평가 단계로 이동한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When
        evaluationPeriod.자기평가_단계로_이동한다(testUserId);

        // Then
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.SELF_EVALUATION,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('하향동료평가_단계로_이동한다', () => {
      it('자기평가 단계에서 하향동료평가 단계로 이동한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.SELF_EVALUATION;

        // When
        evaluationPeriod.하향동료평가_단계로_이동한다(testUserId);

        // Then
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.PEER_EVALUATION,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('종결_단계로_이동한다', () => {
      it('하향동료평가 단계에서 종결 단계로 이동한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PEER_EVALUATION;

        // When
        evaluationPeriod.종결_단계로_이동한다(testUserId);

        // Then
        expect(evaluationPeriod.currentPhase).toBe(
          EvaluationPeriodPhase.CLOSURE,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });
  });

  describe('상태 및 단계 검증', () => {
    describe('시작_가능한가', () => {
      it('대기 상태일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.WAITING;

        // When & Then
        expect(evaluationPeriod.시작_가능한가()).toBe(true);
      });

      it('대기 상태가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

        // When & Then
        expect(evaluationPeriod.시작_가능한가()).toBe(false);
      });
    });

    describe('완료_가능한가', () => {
      it('진행 중이고 종결 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.CLOSURE;

        // When & Then
        expect(evaluationPeriod.완료_가능한가()).toBe(true);
      });

      it('종결 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(evaluationPeriod.완료_가능한가()).toBe(false);
      });
    });

    describe('활성화된_상태인가', () => {
      it('진행 중 상태일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

        // When & Then
        expect(evaluationPeriod.활성화된_상태인가()).toBe(true);
      });

      it('진행 중이 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.WAITING;

        // When & Then
        expect(evaluationPeriod.활성화된_상태인가()).toBe(false);
      });
    });

    describe('완료된_상태인가', () => {
      it('완료 상태일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.COMPLETED;

        // When & Then
        expect(evaluationPeriod.완료된_상태인가()).toBe(true);
      });

      it('완료 상태가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

        // When & Then
        expect(evaluationPeriod.완료된_상태인가()).toBe(false);
      });
    });
  });

  describe('자기평가 달성률 관리', () => {
    describe('자기평가_달성률_유효한가', () => {
      it('유효한 달성률(0-200, 정수)에 대해 true를 반환한다', () => {
        expect(evaluationPeriod.자기평가_달성률_유효한가(0)).toBe(true);
        expect(evaluationPeriod.자기평가_달성률_유효한가(100)).toBe(true);
        expect(evaluationPeriod.자기평가_달성률_유효한가(200)).toBe(true);
      });

      it('유효하지 않은 달성률에 대해 false를 반환한다', () => {
        expect(evaluationPeriod.자기평가_달성률_유효한가(-1)).toBe(false);
        expect(evaluationPeriod.자기평가_달성률_유효한가(201)).toBe(false);
        expect(evaluationPeriod.자기평가_달성률_유효한가(100.5)).toBe(false);
      });
    });

    describe('자기평가_달성률최대값_설정한다', () => {
      it('유효한 달성률을 설정한다', () => {
        // When
        evaluationPeriod.자기평가_달성률최대값_설정한다(150, testUserId);

        // Then
        expect(evaluationPeriod.maxSelfEvaluationRate).toBe(150);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('유효하지 않은 달성률에 대해 예외를 발생시킨다', () => {
        // When & Then
        expect(() =>
          evaluationPeriod.자기평가_달성률최대값_설정한다(250, testUserId),
        ).toThrow(InvalidSelfEvaluationRateException);
      });
    });
  });

  describe('등급 구간 관리', () => {
    const testGradeRanges: GradeRange[] = [
      { grade: 'S', minRange: 95, maxRange: 100 },
      { grade: 'A', minRange: 85, maxRange: 94 },
      { grade: 'B', minRange: 75, maxRange: 84 },
      { grade: 'C', minRange: 65, maxRange: 74 },
      { grade: 'F', minRange: 0, maxRange: 64 },
    ];

    describe('등급구간_설정한다', () => {
      it('유효한 등급 구간을 설정한다', () => {
        // When
        evaluationPeriod.등급구간_설정한다(testGradeRanges, testUserId);

        // Then
        expect(evaluationPeriod.gradeRanges).toHaveLength(5);
        expect(evaluationPeriod.gradeRanges[0].grade).toBe('S');
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('빈 등급 구간에 대해 예외를 발생시킨다', () => {
        // When & Then
        expect(() =>
          evaluationPeriod.등급구간_설정한다([], testUserId),
        ).toThrow('등급 구간은 최소 1개 이상 설정되어야 합니다.');
      });

      it('중복된 등급에 대해 예외를 발생시킨다', () => {
        // Given
        const duplicateGrades: GradeRange[] = [
          { grade: 'A', minRange: 85, maxRange: 100 },
          { grade: 'A', minRange: 70, maxRange: 84 },
        ];

        // When & Then
        expect(() =>
          evaluationPeriod.등급구간_설정한다(duplicateGrades, testUserId),
        ).toThrow('중복된 등급이 존재합니다.');
      });

      it('잘못된 점수 범위에 대해 예외를 발생시킨다', () => {
        // Given
        const invalidRanges: GradeRange[] = [
          { grade: 'A', minRange: 90, maxRange: 80 }, // min > max
        ];

        // When & Then
        expect(() =>
          evaluationPeriod.등급구간_설정한다(invalidRanges, testUserId),
        ).toThrow('등급 A의 최소 범위는 최대 범위보다 작아야 합니다.');
      });

      it('범위를 벗어난 점수에 대해 예외를 발생시킨다', () => {
        // Given
        const outOfRangeGrades: GradeRange[] = [
          { grade: 'A', minRange: -10, maxRange: 50 }, // min < 0
        ];

        // When & Then
        expect(() =>
          evaluationPeriod.등급구간_설정한다(outOfRangeGrades, testUserId),
        ).toThrow('등급 A의 점수 범위는 0-100 사이여야 합니다.');
      });

      it('겹치는 점수 범위에 대해 예외를 발생시킨다', () => {
        // Given
        const overlappingRanges: GradeRange[] = [
          { grade: 'A', minRange: 80, maxRange: 90 },
          { grade: 'B', minRange: 85, maxRange: 95 }, // 겹침
        ];

        // When & Then
        expect(() =>
          evaluationPeriod.등급구간_설정한다(overlappingRanges, testUserId),
        ).toThrow('등급 A와 B의 점수 범위가 겹칩니다.');
      });
    });

    describe('점수로_등급_조회한다', () => {
      beforeEach(() => {
        evaluationPeriod.등급구간_설정한다(testGradeRanges, testUserId);
      });

      it('점수에 해당하는 등급을 정확히 조회한다', () => {
        // When
        const result = evaluationPeriod.점수로_등급_조회한다(97);

        // Then
        expect(result).toBeDefined();
        expect(result!.grade).toBe('S');
        expect(result!.score).toBe(97);
        expect(result!.finalGrade).toBe('S');
      });

      it('범위에 해당하지 않는 점수에 대해 null을 반환한다', () => {
        // When
        const result = evaluationPeriod.점수로_등급_조회한다(105);

        // Then
        expect(result).toBeNull();
      });

      it('등급 구간이 설정되지 않은 경우 null을 반환한다', () => {
        // Given
        evaluationPeriod.gradeRanges = [];

        // When
        const result = evaluationPeriod.점수로_등급_조회한다(90);

        // Then
        expect(result).toBeNull();
      });

      it('세부 등급이 있는 경우 올바르게 계산한다', () => {
        // Given
        const gradeRangesWithSub: GradeRange[] = [
          {
            grade: 'A',
            minRange: 85,
            maxRange: 94,
            subGrades: [
              { type: SubGradeType.PLUS, minRange: 92, maxRange: 94 },
              { type: SubGradeType.NONE, minRange: 88, maxRange: 91 },
              { type: SubGradeType.MINUS, minRange: 85, maxRange: 87 },
            ],
          },
        ];
        evaluationPeriod.등급구간_설정한다(gradeRangesWithSub, testUserId);

        // When
        const resultPlus = evaluationPeriod.점수로_등급_조회한다(93);
        const resultNone = evaluationPeriod.점수로_등급_조회한다(90);
        const resultMinus = evaluationPeriod.점수로_등급_조회한다(86);

        // Then
        expect(resultPlus!.finalGrade).toBe('A+');
        expect(resultNone!.finalGrade).toBe('A');
        expect(resultMinus!.finalGrade).toBe('A-');
      });
    });

    describe('등급구간_설정됨', () => {
      it('등급 구간이 설정된 경우 true를 반환한다', () => {
        // Given
        evaluationPeriod.등급구간_설정한다(testGradeRanges, testUserId);

        // When & Then
        expect(evaluationPeriod.등급구간_설정됨()).toBe(true);
      });

      it('등급 구간이 설정되지 않은 경우 false를 반환한다', () => {
        // Given
        evaluationPeriod.gradeRanges = [];

        // When & Then
        expect(evaluationPeriod.등급구간_설정됨()).toBe(false);
      });
    });

    describe('등급구간_조회한다', () => {
      beforeEach(() => {
        evaluationPeriod.등급구간_설정한다(testGradeRanges, testUserId);
      });

      it('특정 등급의 구간 정보를 조회한다', () => {
        // When
        const result = evaluationPeriod.등급구간_조회한다('A');

        // Then
        expect(result).toBeDefined();
        expect(result!.grade).toBe('A');
        expect(result!.minRange).toBe(85);
        expect(result!.maxRange).toBe(94);
      });

      it('존재하지 않는 등급에 대해 null을 반환한다', () => {
        // Given
        const limitedGrades: GradeRange[] = [
          { grade: 'A', minRange: 85, maxRange: 100 },
        ];
        evaluationPeriod.등급구간_설정한다(limitedGrades, testUserId);

        // When
        const result = evaluationPeriod.등급구간_조회한다('B');

        // Then
        expect(result).toBeNull();
      });
    });
  });

  describe('DTO 변환', () => {
    describe('DTO_변환한다', () => {
      it('엔티티를 DTO로 올바르게 변환한다', () => {
        // Given
        evaluationPeriod.등급구간_설정한다(
          [{ grade: 'A', minRange: 85, maxRange: 100 }],
          testUserId,
        );

        // When
        const dto = evaluationPeriod.DTO_변환한다();

        // Then
        expect(dto.id).toBe(evaluationPeriod.id);
        expect(dto.name).toBe(evaluationPeriod.name);
        expect(dto.status).toBe(evaluationPeriod.status);
        expect(dto.currentPhase).toBe(evaluationPeriod.currentPhase);
        expect(dto.gradeRanges).toHaveLength(1);
        expect(dto.gradeRanges[0].grade).toBe('A');
      });

      it('등급 구간이 없는 경우 빈 배열을 반환한다', () => {
        // Given
        evaluationPeriod.gradeRanges = [];

        // When
        const dto = evaluationPeriod.DTO_변환한다();

        // Then
        expect(dto.gradeRanges).toEqual([]);
      });
    });
  });

  describe('수동 허용 설정 관리', () => {
    describe('평가기준설정_수동허용_활성화한다', () => {
      it('평가 기준 설정 수동 허용을 활성화한다', () => {
        // Given
        evaluationPeriod.criteriaSettingEnabled = false;

        // When
        evaluationPeriod.평가기준설정_수동허용_활성화한다(testUserId);

        // Then
        expect(evaluationPeriod.criteriaSettingEnabled).toBe(true);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('자기평가설정_수동허용_활성화한다', () => {
      it('자기 평가 설정 수동 허용을 활성화한다', () => {
        // Given
        evaluationPeriod.selfEvaluationSettingEnabled = false;

        // When
        evaluationPeriod.자기평가설정_수동허용_활성화한다(testUserId);

        // Then
        expect(evaluationPeriod.selfEvaluationSettingEnabled).toBe(true);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('최종평가설정_수동허용_활성화한다', () => {
      it('최종 평가 설정 수동 허용을 활성화한다', () => {
        // Given
        evaluationPeriod.finalEvaluationSettingEnabled = false;

        // When
        evaluationPeriod.최종평가설정_수동허용_활성화한다(testUserId);

        // Then
        expect(evaluationPeriod.finalEvaluationSettingEnabled).toBe(true);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });
  });

  describe('단계별 상태 확인', () => {
    describe('대기_단계인가', () => {
      it('대기 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;

        // When & Then
        expect(evaluationPeriod.대기_단계인가()).toBe(true);
      });

      it('대기 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(evaluationPeriod.대기_단계인가()).toBe(false);
      });
    });

    describe('평가설정_단계인가', () => {
      it('평가설정 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.EVALUATION_SETUP;

        // When & Then
        expect(evaluationPeriod.평가설정_단계인가()).toBe(true);
      });

      it('평가설정 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(evaluationPeriod.평가설정_단계인가()).toBe(false);
      });
    });

    describe('업무수행_단계인가', () => {
      it('업무수행 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(evaluationPeriod.업무수행_단계인가()).toBe(true);
      });

      it('업무수행 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;

        // When & Then
        expect(evaluationPeriod.업무수행_단계인가()).toBe(false);
      });
    });

    describe('자기평가_단계인가', () => {
      it('자기평가 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.SELF_EVALUATION;

        // When & Then
        expect(evaluationPeriod.자기평가_단계인가()).toBe(true);
      });

      it('자기평가 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(evaluationPeriod.자기평가_단계인가()).toBe(false);
      });
    });

    describe('하향동료평가_단계인가', () => {
      it('하향동료평가 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PEER_EVALUATION;

        // When & Then
        expect(evaluationPeriod.하향동료평가_단계인가()).toBe(true);
      });

      it('하향동료평가 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.SELF_EVALUATION;

        // When & Then
        expect(evaluationPeriod.하향동료평가_단계인가()).toBe(false);
      });
    });

    describe('종결_단계인가', () => {
      it('종결 단계일 때 true를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.CLOSURE;

        // When & Then
        expect(evaluationPeriod.종결_단계인가()).toBe(true);
      });

      it('종결 단계가 아닐 때 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PEER_EVALUATION;

        // When & Then
        expect(evaluationPeriod.종결_단계인가()).toBe(false);
      });
    });
  });

  describe('전이 유효성 검증', () => {
    describe('상태전이_유효한가', () => {
      it('대기 상태에서 진행 상태로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.WAITING;

        // When & Then
        expect(
          evaluationPeriod.상태전이_유효한가(
            EvaluationPeriodStatus.IN_PROGRESS,
          ),
        ).toBe(true);
      });

      it('진행 상태에서 완료 상태로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

        // When & Then
        expect(
          evaluationPeriod.상태전이_유효한가(EvaluationPeriodStatus.COMPLETED),
        ).toBe(true);
      });

      it('진행 상태에서 대기 상태로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.IN_PROGRESS;

        // When & Then
        expect(
          evaluationPeriod.상태전이_유효한가(EvaluationPeriodStatus.WAITING),
        ).toBe(true);
      });

      it('완료 상태에서 다른 상태로의 전이는 유효하지 않다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.COMPLETED;

        // When & Then
        expect(
          evaluationPeriod.상태전이_유효한가(EvaluationPeriodStatus.WAITING),
        ).toBe(false);
        expect(
          evaluationPeriod.상태전이_유효한가(
            EvaluationPeriodStatus.IN_PROGRESS,
          ),
        ).toBe(false);
      });

      it('유효하지 않은 전이에 대해 false를 반환한다', () => {
        // Given
        evaluationPeriod.status = EvaluationPeriodStatus.WAITING;

        // When & Then
        expect(
          evaluationPeriod.상태전이_유효한가(EvaluationPeriodStatus.COMPLETED),
        ).toBe(false);
      });
    });

    describe('단계전이_유효한가', () => {
      it('대기 단계에서 평가설정 단계로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(
            EvaluationPeriodPhase.EVALUATION_SETUP,
          ),
        ).toBe(true);
      });

      it('평가설정 단계에서 업무수행 단계로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.EVALUATION_SETUP;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(EvaluationPeriodPhase.PERFORMANCE),
        ).toBe(true);
      });

      it('업무수행 단계에서 자기평가 단계로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PERFORMANCE;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(
            EvaluationPeriodPhase.SELF_EVALUATION,
          ),
        ).toBe(true);
      });

      it('자기평가 단계에서 하향동료평가 단계로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.SELF_EVALUATION;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(
            EvaluationPeriodPhase.PEER_EVALUATION,
          ),
        ).toBe(true);
      });

      it('하향동료평가 단계에서 종결 단계로의 전이는 유효하다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.PEER_EVALUATION;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(EvaluationPeriodPhase.CLOSURE),
        ).toBe(true);
      });

      it('종결 단계에서 다른 단계로의 전이는 유효하지 않다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.CLOSURE;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(EvaluationPeriodPhase.WAITING),
        ).toBe(false);
      });

      it('currentPhase가 null일 때 평가설정 단계로의 전이만 유효하다', () => {
        // Given
        evaluationPeriod.currentPhase = undefined;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(
            EvaluationPeriodPhase.EVALUATION_SETUP,
          ),
        ).toBe(true);
        expect(
          evaluationPeriod.단계전이_유효한가(EvaluationPeriodPhase.PERFORMANCE),
        ).toBe(false);
      });

      it('유효하지 않은 단계 전이에 대해 false를 반환한다', () => {
        // Given
        evaluationPeriod.currentPhase = EvaluationPeriodPhase.WAITING;

        // When & Then
        expect(
          evaluationPeriod.단계전이_유효한가(EvaluationPeriodPhase.PERFORMANCE),
        ).toBe(false);
        expect(
          evaluationPeriod.단계전이_유효한가(EvaluationPeriodPhase.CLOSURE),
        ).toBe(false);
      });
    });
  });

  describe('자기평가 달성률 조회', () => {
    describe('자기평가_달성률_최대값', () => {
      it('설정된 최대 달성률을 반환한다', () => {
        // Given
        evaluationPeriod.maxSelfEvaluationRate = 150;

        // When
        const result = evaluationPeriod.자기평가_달성률_최대값();

        // Then
        expect(result).toBe(150);
      });

      it('기본값 120을 반환한다', () => {
        // Given
        evaluationPeriod.maxSelfEvaluationRate = 120;

        // When
        const result = evaluationPeriod.자기평가_달성률_최대값();

        // Then
        expect(result).toBe(120);
      });
    });
  });

  describe('정보 업데이트 관리', () => {
    describe('정보_업데이트한다', () => {
      it('평가 기간명과 설명을 업데이트한다', () => {
        // Given
        const newName = '2024년 하반기 평가';
        const newDescription = '2024년 하반기 인사평가 기간';

        // When
        evaluationPeriod.정보_업데이트한다(newName, newDescription, testUserId);

        // Then
        expect(evaluationPeriod.name).toBe(newName);
        expect(evaluationPeriod.description).toBe(newDescription);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('평가 기간명만 업데이트한다', () => {
        // Given
        const originalDescription = evaluationPeriod.description;
        const newName = '2024년 하반기 평가';

        // When
        evaluationPeriod.정보_업데이트한다(newName, undefined, testUserId);

        // Then
        expect(evaluationPeriod.name).toBe(newName);
        expect(evaluationPeriod.description).toBe(originalDescription);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('설명만 업데이트한다', () => {
        // Given
        const originalName = evaluationPeriod.name;
        const newDescription = '새로운 설명';

        // When
        evaluationPeriod.정보_업데이트한다(
          undefined,
          newDescription,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.name).toBe(originalName);
        expect(evaluationPeriod.description).toBe(newDescription);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('빈 평가 기간명에 대해 예외를 발생시킨다', () => {
        // When & Then
        expect(() =>
          evaluationPeriod.정보_업데이트한다('', undefined, testUserId),
        ).toThrow('평가 기간명은 필수입니다.');

        expect(() =>
          evaluationPeriod.정보_업데이트한다('   ', undefined, testUserId),
        ).toThrow('평가 기간명은 필수입니다.');
      });

      it('빈 설명은 undefined로 설정된다', () => {
        // When
        evaluationPeriod.정보_업데이트한다(undefined, '', testUserId);

        // Then
        expect(evaluationPeriod.description).toBeUndefined();
      });
    });

    describe('일정_업데이트한다', () => {
      it('시작일과 종료일을 업데이트한다', () => {
        // Given
        const newStartDate = new Date('2024-07-01');
        const newEndDate = new Date('2024-12-31');

        // When
        evaluationPeriod.일정_업데이트한다(
          newStartDate,
          newEndDate,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.startDate).toEqual(newStartDate);
        expect(evaluationPeriod.endDate).toEqual(newEndDate);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('시작일만 업데이트한다', () => {
        // Given
        const originalEndDate = evaluationPeriod.endDate;
        const newStartDate = new Date('2024-02-01');

        // When
        evaluationPeriod.일정_업데이트한다(newStartDate, undefined, testUserId);

        // Then
        expect(evaluationPeriod.startDate).toEqual(newStartDate);
        expect(evaluationPeriod.endDate).toEqual(originalEndDate);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('종료일만 업데이트한다', () => {
        // Given
        const originalStartDate = evaluationPeriod.startDate;
        const newEndDate = new Date('2024-12-31');

        // When
        evaluationPeriod.일정_업데이트한다(undefined, newEndDate, testUserId);

        // Then
        expect(evaluationPeriod.startDate).toEqual(originalStartDate);
        expect(evaluationPeriod.endDate).toEqual(newEndDate);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('시작일이 종료일보다 늦은 경우 예외를 발생시킨다', () => {
        // Given
        const newStartDate = new Date('2024-12-31');
        const newEndDate = new Date('2024-01-01');

        // When & Then
        expect(() =>
          evaluationPeriod.일정_업데이트한다(
            newStartDate,
            newEndDate,
            testUserId,
          ),
        ).toThrow('시작일은 종료일보다 이전이어야 합니다.');
      });

      it('시작일과 종료일이 같은 경우 예외를 발생시킨다', () => {
        // Given
        const sameDate = new Date('2024-06-15');

        // When & Then
        expect(() =>
          evaluationPeriod.일정_업데이트한다(sameDate, sameDate, testUserId),
        ).toThrow('시작일은 종료일보다 이전이어야 합니다.');
      });
    });
  });

  describe('단계별 마감일 관리', () => {
    describe('단계별_마감일_업데이트한다', () => {
      it('모든 단계의 마감일을 업데이트한다', () => {
        // Given
        const evaluationSetupDeadline = new Date('2024-02-15');
        const performanceDeadline = new Date('2024-04-15');
        const selfEvaluationDeadline = new Date('2024-05-15');
        const peerEvaluationDeadline = new Date('2024-06-15');

        // When
        evaluationPeriod.단계별_마감일_업데이트한다(
          evaluationSetupDeadline,
          performanceDeadline,
          selfEvaluationDeadline,
          peerEvaluationDeadline,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.evaluationSetupDeadline).toEqual(
          evaluationSetupDeadline,
        );
        expect(evaluationPeriod.performanceDeadline).toEqual(
          performanceDeadline,
        );
        expect(evaluationPeriod.selfEvaluationDeadline).toEqual(
          selfEvaluationDeadline,
        );
        expect(evaluationPeriod.peerEvaluationDeadline).toEqual(
          peerEvaluationDeadline,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('일부 단계의 마감일만 업데이트한다', () => {
        // Given
        const originalPerformanceDeadline =
          evaluationPeriod.performanceDeadline;
        const newEvaluationSetupDeadline = new Date('2024-02-20');
        const newSelfEvaluationDeadline = new Date('2024-05-20');

        // When
        evaluationPeriod.단계별_마감일_업데이트한다(
          newEvaluationSetupDeadline,
          undefined,
          newSelfEvaluationDeadline,
          undefined,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.evaluationSetupDeadline).toEqual(
          newEvaluationSetupDeadline,
        );
        expect(evaluationPeriod.performanceDeadline).toEqual(
          originalPerformanceDeadline,
        );
        expect(evaluationPeriod.selfEvaluationDeadline).toEqual(
          newSelfEvaluationDeadline,
        );
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });
    });

    describe('단계_마감일_설정한다', () => {
      it('평가설정 단계 마감일을 설정한다', () => {
        // Given
        const deadline = new Date('2024-02-15');

        // When
        evaluationPeriod.단계_마감일_설정한다(
          EvaluationPeriodPhase.EVALUATION_SETUP,
          deadline,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.evaluationSetupDeadline).toEqual(deadline);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('업무수행 단계 마감일을 설정한다', () => {
        // Given
        const deadline = new Date('2024-04-15');

        // When
        evaluationPeriod.단계_마감일_설정한다(
          EvaluationPeriodPhase.PERFORMANCE,
          deadline,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.performanceDeadline).toEqual(deadline);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('자기평가 단계 마감일을 설정한다', () => {
        // Given
        const deadline = new Date('2024-05-15');

        // When
        evaluationPeriod.단계_마감일_설정한다(
          EvaluationPeriodPhase.SELF_EVALUATION,
          deadline,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.selfEvaluationDeadline).toEqual(deadline);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('하향동료평가 단계 마감일을 설정한다', () => {
        // Given
        const deadline = new Date('2024-06-15');

        // When
        evaluationPeriod.단계_마감일_설정한다(
          EvaluationPeriodPhase.PEER_EVALUATION,
          deadline,
          testUserId,
        );

        // Then
        expect(evaluationPeriod.peerEvaluationDeadline).toEqual(deadline);
        expect(evaluationPeriod.updatedBy).toBe(testUserId);
      });

      it('지원하지 않는 단계에 대해 예외를 발생시킨다', () => {
        // Given
        const deadline = new Date('2024-06-15');

        // When & Then
        expect(() =>
          evaluationPeriod.단계_마감일_설정한다(
            EvaluationPeriodPhase.WAITING,
            deadline,
            testUserId,
          ),
        ).toThrow('지원하지 않는 단계입니다: waiting');

        expect(() =>
          evaluationPeriod.단계_마감일_설정한다(
            EvaluationPeriodPhase.CLOSURE,
            deadline,
            testUserId,
          ),
        ).toThrow('지원하지 않는 단계입니다: closure');
      });
    });

    describe('단계_마감일_조회한다', () => {
      beforeEach(() => {
        evaluationPeriod.evaluationSetupDeadline = new Date('2024-02-15');
        evaluationPeriod.performanceDeadline = new Date('2024-04-15');
        evaluationPeriod.selfEvaluationDeadline = new Date('2024-05-15');
        evaluationPeriod.peerEvaluationDeadline = new Date('2024-06-15');
      });

      it('평가설정 단계 마감일을 조회한다', () => {
        // When
        const result = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );

        // Then
        expect(result).toEqual(new Date('2024-02-15'));
      });

      it('업무수행 단계 마감일을 조회한다', () => {
        // When
        const result = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.PERFORMANCE,
        );

        // Then
        expect(result).toEqual(new Date('2024-04-15'));
      });

      it('자기평가 단계 마감일을 조회한다', () => {
        // When
        const result = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.SELF_EVALUATION,
        );

        // Then
        expect(result).toEqual(new Date('2024-05-15'));
      });

      it('하향동료평가 단계 마감일을 조회한다', () => {
        // When
        const result = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.PEER_EVALUATION,
        );

        // Then
        expect(result).toEqual(new Date('2024-06-15'));
      });

      it('마감일이 설정되지 않은 단계에 대해 null을 반환한다', () => {
        // Given
        evaluationPeriod.evaluationSetupDeadline = undefined;

        // When
        const result = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );

        // Then
        expect(result).toBeNull();
      });

      it('지원하지 않는 단계에 대해 null을 반환한다', () => {
        // When
        const result1 = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.WAITING,
        );
        const result2 = evaluationPeriod.단계_마감일_조회한다(
          EvaluationPeriodPhase.CLOSURE,
        );

        // Then
        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });
    });

    describe('단계_마감된_상태인가', () => {
      it('마감일이 지난 단계에 대해 true를 반환한다', () => {
        // Given
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        evaluationPeriod.evaluationSetupDeadline = yesterday;

        // When
        const result = evaluationPeriod.단계_마감된_상태인가(
          EvaluationPeriodPhase.EVALUATION_SETUP,
        );

        // Then
        expect(result).toBe(true);
      });

      it('마감일이 지나지 않은 단계에 대해 false를 반환한다', () => {
        // Given
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        evaluationPeriod.performanceDeadline = tomorrow;

        // When
        const result = evaluationPeriod.단계_마감된_상태인가(
          EvaluationPeriodPhase.PERFORMANCE,
        );

        // Then
        expect(result).toBe(false);
      });

      it('마감일이 설정되지 않은 단계에 대해 false를 반환한다', () => {
        // Given
        evaluationPeriod.selfEvaluationDeadline = undefined;

        // When
        const result = evaluationPeriod.단계_마감된_상태인가(
          EvaluationPeriodPhase.SELF_EVALUATION,
        );

        // Then
        expect(result).toBe(false);
      });
    });
  });

  describe('하위 호환성', () => {
    describe('DTO변환한다', () => {
      it('DTO_변환한다와 동일한 결과를 반환한다', () => {
        // Given
        evaluationPeriod.등급구간_설정한다(
          [{ grade: 'A', minRange: 85, maxRange: 100 }],
          testUserId,
        );

        // When
        const dto1 = evaluationPeriod.DTO변환한다();
        const dto2 = evaluationPeriod.DTO_변환한다();

        // Then
        expect(dto1).toEqual(dto2);
        expect(dto1.id).toBe(evaluationPeriod.id);
        expect(dto1.name).toBe(evaluationPeriod.name);
        expect(dto1.status).toBe(evaluationPeriod.status);
      });
    });
  });

  describe('날짜 및 마감일 관리', () => {
    describe('평가기간_내인가', () => {
      it('현재 날짜가 평가 기간 내에 있으면 true를 반환한다', () => {
        // Given
        const now = new Date();
        evaluationPeriod.startDate = new Date(
          now.getTime() - 24 * 60 * 60 * 1000,
        ); // 어제
        evaluationPeriod.endDate = new Date(
          now.getTime() + 24 * 60 * 60 * 1000,
        ); // 내일

        // When & Then
        expect(evaluationPeriod.평가기간_내인가()).toBe(true);
      });

      it('현재 날짜가 평가 기간 밖에 있으면 false를 반환한다', () => {
        // Given
        const now = new Date();
        evaluationPeriod.startDate = new Date(
          now.getTime() + 24 * 60 * 60 * 1000,
        ); // 내일
        evaluationPeriod.endDate = new Date(
          now.getTime() + 48 * 60 * 60 * 1000,
        ); // 모레

        // When & Then
        expect(evaluationPeriod.평가기간_내인가()).toBe(false);
      });
    });

    describe('만료된_상태인가', () => {
      it('종료일이 지난 경우 true를 반환한다', () => {
        // Given
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        evaluationPeriod.endDate = yesterday;

        // When & Then
        expect(evaluationPeriod.만료된_상태인가()).toBe(true);
      });

      it('종료일이 지나지 않은 경우 false를 반환한다', () => {
        // Given
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        evaluationPeriod.endDate = tomorrow;

        // When & Then
        expect(evaluationPeriod.만료된_상태인가()).toBe(false);
      });
    });
  });
});
