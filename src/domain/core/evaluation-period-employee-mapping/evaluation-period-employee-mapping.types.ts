/**
 * 평가기간-직원 맵핑 생성 데이터
 */
export interface CreateEvaluationPeriodEmployeeMappingData {
  /** 평가기간 ID */
  evaluationPeriodId: string;

  /** 직원 ID */
  employeeId: string;

  /** 생성자 ID */
  createdBy: string;
}

/**
 * 평가기간-직원 맵핑 DTO
 */
export interface EvaluationPeriodEmployeeMappingDto {
  /** 맵핑 ID */
  id: string;

  /** 평가기간 ID */
  evaluationPeriodId: string;

  /** 직원 ID */
  employeeId: string;

  /** 평가 대상 제외 여부 */
  isExcluded: boolean;

  /** 평가 대상 제외 사유 */
  excludeReason?: string | null;

  /** 제외 처리자 ID */
  excludedBy?: string | null;

  /** 제외 처리 일시 */
  excludedAt?: Date | null;

  /** 평가기준 제출 여부 */
  isCriteriaSubmitted: boolean;

  /** 평가기준 제출 일시 */
  criteriaSubmittedAt?: Date | null;

  /** 평가기준 제출 처리자 ID */
  criteriaSubmittedBy?: string | null;

  /** 신규 등록 여부 (등록 후 24시간 이내) */
  isNewEnrolled: boolean;

  /** 생성자 ID */
  createdBy: string;

  /** 수정자 ID */
  updatedBy: string;

  /** 생성 일시 */
  createdAt: Date;

  /** 수정 일시 */
  updatedAt: Date;

  /** 삭제 일시 */
  deletedAt?: Date | null;
}

/**
 * 평가 대상자 요약 정보 DTO
 * - 직원 정보와 함께 제공되는 맵핑 정보
 */
export interface EvaluationTargetSummaryDto {
  /** 맵핑 ID */
  mappingId: string;

  /** 평가기간 ID */
  evaluationPeriodId: string;

  /** 직원 ID */
  employeeId: string;

  /** 직원 사번 */
  employeeNumber: string;

  /** 직원명 */
  employeeName: string;

  /** 이메일 */
  email: string;

  /** 부서명 */
  departmentName?: string;

  /** 직책명 */
  rankName?: string;

  /** 평가 대상 제외 여부 */
  isExcluded: boolean;

  /** 제외 사유 */
  excludeReason?: string | null;

  /** 제외 처리 일시 */
  excludedAt?: Date | null;
}

/**
 * 평가기간별 평가 대상자 통계 DTO
 */
export interface EvaluationPeriodTargetStatisticsDto {
  /** 평가기간 ID */
  evaluationPeriodId: string;

  /** 전체 등록된 대상자 수 */
  totalTargets: number;

  /** 평가 대상자 수 (제외되지 않은) */
  activeTargets: number;

  /** 제외된 대상자 수 */
  excludedTargets: number;

  /** 제외 비율 (%) */
  excludeRate: number;
}
