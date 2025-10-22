export enum SeedScenario {
  MINIMAL = 'minimal',
  WITH_PERIOD = 'with_period',
  WITH_ASSIGNMENTS = 'with_assignments',
  WITH_SETUP = 'with_setup',
  FULL = 'full',
}

export interface SeedDataConfig {
  scenario: SeedScenario;
  clearExisting: boolean;
  dataScale: {
    departmentCount: number;
    employeeCount: number;
    projectCount: number;
    wbsPerProject: number;
  };
  evaluationConfig?: {
    periodCount: number;
  };
  stateDistribution?: StateDistributionConfig;
  useRealDepartments?: boolean;
  useRealEmployees?: boolean;
}

export interface StateDistributionConfig {
  // === Phase 1: 조직 데이터 ===

  // 부서 계층 구조
  departmentHierarchy?: {
    maxDepth: number; // 최대 깊이 (기본: 3)
    childrenPerParent: {
      min: number; // 최소 하위 부서 (기본: 0)
      max: number; // 최대 하위 부서 (기본: 3)
    };
    rootDepartmentRatio: number; // 최상위 부서 비율 (기본: 0.20)
  };

  // 직원 상태 분포
  employeeStatus?: {
    active: number; // 재직중 (기본: 0.85)
    onLeave: number; // 휴직중 (기본: 0.05)
    resigned: number; // 퇴사 (기본: 0.10)
  };

  // 직원 조회 제외 비율 (전체 시스템에서 제외)
  excludedFromList?: number; // (기본: 0.03)

  // 프로젝트 상태 분포
  projectStatus?: {
    active: number; // 진행중 (기본: 0.70)
    completed: number; // 완료 (기본: 0.25)
    cancelled: number; // 취소 (기본: 0.05)
  };

  // 프로젝트 매니저 할당 비율
  projectManagerAssignmentRatio?: number; // (기본: 0.95)

  // WBS 계층 구조
  wbsHierarchy?: {
    maxDepth: number; // 최대 깊이 (기본: 3)
    childrenPerParent: {
      min: number; // 최소 하위 WBS (기본: 0)
      max: number; // 최대 하위 WBS (기본: 4)
    };
  };

  // WBS 상태 분포
  wbsStatus?: {
    pending: number; // 대기 (기본: 0.20)
    inProgress: number; // 진행중 (기본: 0.60)
    completed: number; // 완료 (기본: 0.20)
  };

  // WBS 담당자 할당 비율
  wbsAssignmentRatio?: number; // (기본: 0.90)

  // === Phase 2: 평가기간 ===

  // 평가기간 상태 분포
  evaluationPeriodStatus?: {
    waiting: number; // 대기 (기본: 0.20)
    inProgress: number; // 진행중 (기본: 0.70)
    completed: number; // 완료 (기본: 0.10)
  };

  // 평가기간 현재 단계 분포 (inProgress일 때만 적용)
  evaluationPeriodPhase?: {
    evaluationSetup: number; // 평가설정 (기본: 0.20)
    performance: number; // 업무수행 (기본: 0.20)
    selfEvaluation: number; // 자기평가 (기본: 0.25)
    peerEvaluation: number; // 하향/동료평가 (기본: 0.25)
    closure: number; // 종결 (기본: 0.10)
  };

  // 평가 대상 제외 비율
  excludedFromEvaluation?: number; // (기본: 0.05)

  // === Phase 4: 평가 기준 및 라인 ===

  // WBS당 평가기준 개수
  wbsCriteriaPerWbs?: {
    min: number; // 최소 (기본: 2)
    max: number; // 최대 (기본: 5)
  };

  // 평가 라인 생성 수
  evaluationLineCount?: {
    primary: number; // 주평가자 라인 (기본: 1)
    secondary: number; // 부평가자 라인 (기본: 1)
    additionalMin: number; // 추가평가자 라인 최소 (기본: 0)
    additionalMax: number; // 추가평가자 라인 최대 (기본: 2)
  };

  // 평가 라인 매핑 비율 (직원별)
  evaluationLineMappingTypes?: {
    primaryOnly: number; // 1차만 (기본: 0.30)
    primaryAndSecondary: number; // 1,2차 (기본: 0.50)
    withAdditional: number; // 추가 평가 포함 (기본: 0.20)
  };

  // === Phase 5: 산출물 ===

  // WBS당 산출물 개수 분포
  deliverablePerWbs?: {
    none: number; // 없음 (기본: 0.15)
    one: number; // 1개 (기본: 0.30)
    twoToThree: number; // 2-3개 (기본: 0.40)
    fourOrMore: number; // 4개 이상 (기본: 0.15)
  };

  // 산출물 타입 분포
  deliverableType?: {
    url: number; // URL 타입 (기본: 0.60)
    nas: number; // NAS 타입 (기본: 0.40)
  };

  // === Phase 6: 질문 그룹 및 질문 ===

  // 질문 그룹 생성 수
  questionGroupCount?: {
    min: number; // 최소 (기본: 3)
    max: number; // 최대 (기본: 8)
  };

  // 질문 그룹 특수 속성
  questionGroupSpecial?: {
    defaultGroupRatio: number; // 기본 그룹 비율 (기본: 0.30)
    nonDeletableRatio: number; // 삭제 불가 그룹 비율 (기본: 0.40)
  };

  // 그룹당 평가 질문 수
  questionsPerGroup?: {
    min: number; // 최소 (기본: 3)
    max: number; // 최대 (기본: 10)
  };

  // 평가 질문 유형 분포
  questionType?: {
    scoreOnly: number; // 점수만 (기본: 0.40)
    textOnly: number; // 서술형만 (기본: 0.30)
    scoreAndText: number; // 점수+서술형 (기본: 0.30)
  };

  // 질문이 속하는 그룹 수 분포
  questionGroupMappingRatio?: {
    singleGroup: number; // 1개 그룹만 (기본: 0.60)
    twoGroups: number; // 2개 그룹 (기본: 0.30)
    threeOrMore: number; // 3개 이상 (기본: 0.10)
  };

  // === Phase 7: 평가 실행 ===

  // 자기평가 진행 상태
  selfEvaluationProgress?: {
    notStarted: number; // 미작성 (기본: 0.15)
    inProgress: number; // 진행중 (기본: 0.25)
    completed: number; // 완료 (기본: 0.60)
  };

  // 하향평가 진행 상태 (전체 - 1차/2차 구분 없음)
  downwardEvaluationProgress?: {
    notStarted: number; // 미작성 (기본: 0.20)
    inProgress: number; // 진행중 (기본: 0.30)
    completed: number; // 완료 (기본: 0.50)
  };

  // 1차 하향평가 진행 상태 (우선 적용)
  primaryDownwardEvaluationProgress?: {
    notStarted: number; // 미작성 (기본: 0.20)
    inProgress: number; // 진행중 (기본: 0.30)
    completed: number; // 완료 (기본: 0.50)
  };

  // 2차 하향평가 진행 상태 (우선 적용)
  secondaryDownwardEvaluationProgress?: {
    notStarted: number; // 미작성 (기본: 0.20)
    inProgress: number; // 진행중 (기본: 0.30)
    completed: number; // 완료 (기본: 0.50)
  };

  // 하향평가 평가자 구성
  downwardEvaluationTypes?: {
    primaryOnly: number; // 1차만 (기본: 0.20)
    secondaryOnly: number; // 2차만 (기본: 0.10)
    both: number; // 1,2차 모두 (기본: 0.70)
  };

  // 하향평가 자기평가 참조 비율
  downwardEvaluationSelfReference?: number; // (기본: 0.80)

  // 동료평가 진행 상태
  peerEvaluationProgress?: {
    notStarted: number; // 미작성 (기본: 0.25)
    inProgress: number; // 진행중 (기본: 0.35)
    completed: number; // 완료 (기본: 0.40)
  };

  // 동료평가자 수 분포
  peerEvaluatorCount?: {
    one: number; // 1명 (기본: 0.20)
    two: number; // 2명 (기본: 0.40)
    three: number; // 3명 (기본: 0.30)
    fourOrMore: number; // 4명 이상 (기본: 0.10)
  };

  // 동료평가에 질문 할당 비율
  peerEvaluationQuestionAssignment?: {
    noQuestions: number; // 질문 없음 (기본: 0.10)
    oneGroup: number; // 1개 그룹 (기본: 0.30)
    twoGroups: number; // 2개 그룹 (기본: 0.40)
    threeOrMore: number; // 3개 이상 그룹 (기본: 0.20)
  };

  // 최종평가 진행 상태
  finalEvaluationProgress?: {
    notStarted: number; // 미작성 (기본: 0.40)
    inProgress: number; // 진행중 (기본: 0.20)
    completed: number; // 완료 (기본: 0.40)
  };

  // 평가 점수 생성 규칙
  scoreGeneration?: {
    min: number; // 최소 점수 (기본: 60)
    max: number; // 최대 점수 (기본: 100)
    distribution: 'normal' | 'uniform'; // 분포 방식 (기본: 'normal')
    mean?: number; // 정규분포 평균 (기본: 80)
    stdDev?: number; // 정규분포 표준편차 (기본: 10)
  };

  // === Phase 8: 응답 ===

  // 평가 응답 생성 비율
  evaluationResponseRatio?: {
    noResponse: number; // 응답 없음 (기본: 0.10)
    hasResponse: number; // 응답 있음 (기본: 0.90)
  };

  // === 날짜 생성 규칙 ===

  dateGeneration?: {
    evaluationPeriod: {
      durationMonths: {
        min: number; // 최소 기간 (기본: 6)
        max: number; // 최대 기간 (기본: 12)
      };
      phaseGapDays: number; // 단계 간 간격 (기본: 7)
    };
    project: {
      durationMonths: {
        min: number; // 최소 기간 (기본: 3)
        max: number; // 최대 기간 (기본: 12)
      };
    };
    wbs: {
      durationDays: {
        min: number; // 최소 기간 (기본: 7)
        max: number; // 최대 기간 (기본: 90)
      };
    };
  };
}

// Generator 공통 결과 타입
export interface GeneratorResult {
  phase: string;
  entityCounts: Record<string, number>;
  generatedIds: Record<string, string[] | string>;
  stateDistribution?: Record<string, Record<string, number>>;
  duration: number;
  errors?: string[];
}
