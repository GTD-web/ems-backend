/**
 * 평가 상태
 */
export enum EvaluationStatus {
  NOT_COMPLETED = '미완료',
  IN_PROGRESS = '입력중',
  COMPLETED = '완료',
}

/**
 * 최종 등급
 */
export enum FinalGrade {
  S_PLUS = 'S+',
  S = 'S',
  S_MINUS = 'S-',
  A_PLUS = 'A+',
  A = 'A',
  A_MINUS = 'A-',
  B_PLUS = 'B+',
  B = 'B',
  B_MINUS = 'B-',
  C_PLUS = 'C+',
  C = 'C',
  C_MINUS = 'C-',
  F = 'F',
}

/**
 * 직무 등급
 */
export enum JobGrade {
  T1U = 'T1u',
  T1N = 'T1n',
  T1A = 'T1a',
  T2U = 'T2u',
  T2N = 'T2n',
  T2A = 'T2a',
  T3U = 'T3u',
  T3N = 'T3n',
  T3A = 'T3a',
}

/**
 * 직원 평가 상태 생성 DTO
 * 실제 평가 상태 데이터만 포함합니다.
 */
export interface CreateEmployeeEvaluationStatusDto {
  /** 평가 제외 여부 */
  isExcluded?: boolean;
  /** 직무 등급 */
  jobGrade?: JobGrade;
}

/**
 * 직원 평가 상태 업데이트 DTO
 */
export interface UpdateEmployeeEvaluationStatusDto {
  /** 평가 제외 여부 */
  isExcluded?: boolean;
  /** 평가 항목 설정 완료 */
  evaluationItems?: boolean;
  /** 평가 기준 설정 완료 */
  evaluationCriteria?: boolean;
  /** 평가 라인 설정 완료 */
  evaluationLine?: boolean;
  /** 성과 입력 상태 */
  performanceInput?: EvaluationStatus;
  /** 자기 평가 상태 */
  selfEvaluation?: EvaluationStatus;
  /** 자기 평가 점수 */
  selfEvaluationScore?: number;
  /** 1차 평가 상태 */
  firstEvaluation?: EvaluationStatus;
  /** 1차 평가 점수 */
  firstEvaluationScore?: number;
  /** 2차 평가 상태 */
  secondEvaluation?: EvaluationStatus;
  /** 2차 평가 점수 */
  secondEvaluationScore?: number;
  /** 동료 평가 상태 */
  peerEvaluation?: EvaluationStatus;
  /** 동료 평가 점수 */
  peerEvaluationScore?: number;
  /** 추가 평가 상태 */
  additionalEvaluation?: EvaluationStatus;
  /** 추가 평가 점수 */
  additionalEvaluationScore?: number;
  /** 최종 승인 여부 */
  finalApproval?: boolean;
  /** 최종 등급 */
  finalGrade?: FinalGrade;
  /** 직무 등급 */
  jobGrade?: JobGrade;
  /** 자기 평가 수동 허용 */
  selfEvaluationManuallyEnabled?: boolean;
  /** 하향 평가 수동 허용 */
  downwardEvaluationManuallyEnabled?: boolean;
}

/**
 * 직원 평가 상태 DTO
 * 실제 평가 상태 데이터만 포함합니다.
 */
export interface EmployeeEvaluationStatusDto {
  /** 평가 상태 고유 식별자 */
  id: string;
  /** 평가 제외 여부 */
  isExcluded: boolean;
  /** 평가 항목 설정 완료 */
  evaluationItems: boolean;
  /** 평가 기준 설정 완료 */
  evaluationCriteria: boolean;
  /** 평가 라인 설정 완료 */
  evaluationLine: boolean;
  /** 성과 입력 상태 */
  performanceInput: EvaluationStatus;
  /** 자기 평가 상태 */
  selfEvaluation: EvaluationStatus;
  /** 자기 평가 점수 */
  selfEvaluationScore?: number;
  /** 1차 평가 상태 */
  firstEvaluation: EvaluationStatus;
  /** 1차 평가 점수 */
  firstEvaluationScore?: number;
  /** 2차 평가 상태 */
  secondEvaluation: EvaluationStatus;
  /** 2차 평가 점수 */
  secondEvaluationScore?: number;
  /** 동료 평가 상태 */
  peerEvaluation: EvaluationStatus;
  /** 동료 평가 점수 */
  peerEvaluationScore?: number;
  /** 추가 평가 상태 */
  additionalEvaluation: EvaluationStatus;
  /** 추가 평가 점수 */
  additionalEvaluationScore?: number;
  /** 최종 승인 여부 */
  finalApproval: boolean;
  /** 최종 등급 */
  finalGrade?: FinalGrade;
  /** 직무 등급 */
  jobGrade?: JobGrade;
  /** 자기 평가 수동 허용 */
  selfEvaluationManuallyEnabled: boolean;
  /** 하향 평가 수동 허용 */
  downwardEvaluationManuallyEnabled: boolean;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 직원 평가 상태 필터
 * 실제 평가 상태 데이터 기준 필터입니다.
 */
export interface EmployeeEvaluationStatusFilter {
  /** 평가 제외 여부 */
  isExcluded?: boolean;
  /** 평가 항목 설정 완료 */
  evaluationItems?: boolean;
  /** 평가 기준 설정 완료 */
  evaluationCriteria?: boolean;
  /** 평가 라인 설정 완료 */
  evaluationLine?: boolean;
  /** 성과 입력 상태 */
  performanceInput?: EvaluationStatus;
  /** 자기 평가 상태 */
  selfEvaluation?: EvaluationStatus;
  /** 1차 평가 상태 */
  firstEvaluation?: EvaluationStatus;
  /** 2차 평가 상태 */
  secondEvaluation?: EvaluationStatus;
  /** 동료 평가 상태 */
  peerEvaluation?: EvaluationStatus;
  /** 추가 평가 상태 */
  additionalEvaluation?: EvaluationStatus;
  /** 최종 승인 여부 */
  finalApproval?: boolean;
  /** 최종 등급 */
  finalGrade?: FinalGrade;
  /** 직무 등급 */
  jobGrade?: JobGrade;
}

/**
 * 직원 평가 상태 통계
 */
export interface EmployeeEvaluationStatusStatistics {
  /** 전체 평가 상태 수 */
  totalStatuses: number;
  /** 평가 제외된 직원 수 */
  excludedEmployees: number;
  /** 설정 완료된 평가 수 */
  completedSetups: number;
  /** 평가 완료된 직원 수 */
  completedEvaluations: number;
  /** 최종 승인된 직원 수 */
  finalApprovals: number;
  /** 평가 상태별 통계 */
  statusCounts: Record<EvaluationStatus, number>;
  /** 최종 등급별 통계 */
  gradeCounts: Record<FinalGrade, number>;
  /** 직무 등급별 통계 */
  jobGradeCounts: Record<JobGrade, number>;
  /** 평균 자기평가 점수 */
  averageSelfScore: number;
  /** 평균 1차평가 점수 */
  averageFirstScore: number;
  /** 평균 2차평가 점수 */
  averageSecondScore: number;
  /** 평균 동료평가 점수 */
  averagePeerScore: number;
}
