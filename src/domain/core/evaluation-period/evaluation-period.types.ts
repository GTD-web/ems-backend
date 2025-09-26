/**
 * 평가 기간 상태
 */
export enum EvaluationPeriodStatus {
  INACTIVE = 'inactive',
  CRITERIA_SETTING = 'criteria-setting',
  ACTIVE = 'active',
  PERFORMANCE_INPUT = 'performance-input',
  FINAL_EVALUATION = 'final-evaluation',
  COMPLETED = 'completed',
}

/**
 * 평가 기간 현재 단계
 */
export enum EvaluationPeriodPhase {
  CRITERIA_SETTING = 'criteria-setting',
  ACTIVE = 'active',
  PERFORMANCE_INPUT = 'performance-input',
  FINAL_EVALUATION = 'final-evaluation',
}

/**
 * 평가 기간 생성 DTO
 */
export interface CreateEvaluationPeriodDto {
  /** 평가 기간명 */
  name: string;
  /** 평가 기간 시작일 */
  startDate: Date;
  /** 평가 기간 종료일 */
  endDate: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가 기준 설정 시작일 */
  criteriaStartDate?: Date;
  /** 평가 기준 설정 종료일 */
  criteriaEndDate?: Date;
  /** 성과 입력 시작일 */
  performanceStartDate?: Date;
  /** 성과 입력 종료일 */
  performanceEndDate?: Date;
  /** 최종 평가 시작일 */
  finalEvaluationStartDate?: Date;
  /** 최종 평가 종료일 */
  finalEvaluationEndDate?: Date;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate?: number;
}

/**
 * 평가 기간 업데이트 DTO
 */
export interface UpdateEvaluationPeriodDto {
  /** 평가 기간명 */
  name?: string;
  /** 평가 기간 시작일 */
  startDate?: Date;
  /** 평가 기간 종료일 */
  endDate?: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가 기준 설정 시작일 */
  criteriaStartDate?: Date;
  /** 평가 기준 설정 종료일 */
  criteriaEndDate?: Date;
  /** 성과 입력 시작일 */
  performanceStartDate?: Date;
  /** 성과 입력 종료일 */
  performanceEndDate?: Date;
  /** 최종 평가 시작일 */
  finalEvaluationStartDate?: Date;
  /** 최종 평가 종료일 */
  finalEvaluationEndDate?: Date;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate?: number;
}

/**
 * 평가 기간 DTO
 */
export interface EvaluationPeriodDto {
  /** 평가 기간 고유 식별자 */
  id: string;
  /** 평가 기간명 */
  name: string;
  /** 평가 기간 시작일 */
  startDate: Date;
  /** 평가 기간 종료일 */
  endDate: Date;
  /** 평가 기간 설명 */
  description?: string;
  /** 평가 기간 상태 */
  status: EvaluationPeriodStatus;
  /** 현재 진행 단계 */
  currentPhase?: EvaluationPeriodPhase;
  /** 평가 기준 설정 시작일 */
  criteriaStartDate?: Date;
  /** 평가 기준 설정 종료일 */
  criteriaEndDate?: Date;
  /** 성과 입력 시작일 */
  performanceStartDate?: Date;
  /** 성과 입력 종료일 */
  performanceEndDate?: Date;
  /** 최종 평가 시작일 */
  finalEvaluationStartDate?: Date;
  /** 최종 평가 종료일 */
  finalEvaluationEndDate?: Date;
  /** 평가 완료일 */
  completedDate?: Date;
  /** 평가 기준 설정 수동 허용 여부 */
  criteriaSettingEnabled: boolean;
  /** 자기 평가 설정 수동 허용 여부 */
  selfEvaluationSettingEnabled: boolean;
  /** 하향/동료평가 설정 수동 허용 여부 */
  finalEvaluationSettingEnabled: boolean;
  /** 자기평가 달성률 최대값 (%) */
  maxSelfEvaluationRate: number;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 기간 필터
 */
export interface EvaluationPeriodFilter {
  /** 상태별 필터 */
  status?: EvaluationPeriodStatus;
  /** 현재 단계별 필터 */
  currentPhase?: EvaluationPeriodPhase;
  /** 기간별 필터 - 시작일 */
  startDateFrom?: Date;
  /** 기간별 필터 - 종료일 */
  endDateTo?: Date;
  /** 활성화된 기간만 조회 */
  activeOnly?: boolean;
  /** 자기평가 달성률 최대값 범위 - 최소 */
  maxSelfEvaluationRateFrom?: number;
  /** 자기평가 달성률 최대값 범위 - 최대 */
  maxSelfEvaluationRateTo?: number;
}

/**
 * 평가 기간 통계
 */
export interface EvaluationPeriodStatistics {
  /** 전체 평가 기간 수 */
  totalPeriods: number;
  /** 상태별 통계 */
  statusCounts: Record<EvaluationPeriodStatus, number>;
  /** 현재 활성 기간 수 */
  activePeriods: number;
  /** 완료된 기간 수 */
  completedPeriods: number;
  /** 진행중인 기간 수 */
  inProgressPeriods: number;
  /** 자기평가 달성률 최대값 평균 */
  averageMaxSelfEvaluationRate: number;
  /** 자기평가 달성률 최대값 최고 */
  highestMaxSelfEvaluationRate: number;
  /** 자기평가 달성률 최대값 최저 */
  lowestMaxSelfEvaluationRate: number;
}
