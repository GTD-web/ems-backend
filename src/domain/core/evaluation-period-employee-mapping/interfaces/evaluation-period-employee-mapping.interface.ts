/**
 * 평가기간-직원 맵핑 인터페이스
 *
 * 평가기간별 평가 대상자를 관리하는 맵핑 엔티티
 */
export interface IEvaluationPeriodEmployeeMapping {
  /** 맵핑 ID */
  readonly id: string;

  /** 평가기간 ID */
  readonly evaluationPeriodId: string;

  /** 직원 ID */
  readonly employeeId: string;

  /** 평가 대상 제외 여부 */
  readonly isExcluded: boolean;

  /** 평가 대상 제외 사유 */
  readonly excludeReason?: string | null;

  /** 제외 처리자 ID */
  readonly excludedBy?: string | null;

  /** 제외 처리 일시 */
  readonly excludedAt?: Date | null;

  /** 평가기준 제출 여부 */
  readonly isCriteriaSubmitted: boolean;

  /** 평가기준 제출 일시 */
  readonly criteriaSubmittedAt?: Date | null;

  /** 평가기준 제출 처리자 ID */
  readonly criteriaSubmittedBy?: string | null;

  /** 생성자 ID */
  readonly createdBy?: string;

  /** 수정자 ID */
  readonly updatedBy?: string;

  /** 생성 일시 */
  readonly createdAt: Date;

  /** 수정 일시 */
  readonly updatedAt: Date;

  /** 삭제 일시 (소프트 삭제) */
  readonly deletedAt?: Date | null;
}

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
 * 평가기간-직원 맵핑 수정 데이터
 */
export interface UpdateEvaluationPeriodEmployeeMappingData {
  /** 평가 대상 제외 여부 */
  isExcluded?: boolean;

  /** 평가 대상 제외 사유 */
  excludeReason?: string | null;

  /** 제외 처리자 ID */
  excludedBy?: string | null;

  /** 제외 처리 일시 */
  excludedAt?: Date | null;

  /** 수정자 ID */
  updatedBy: string;
}

/**
 * 평가 대상자 제외 데이터
 */
export interface ExcludeEvaluationTargetData {
  /** 제외 사유 */
  excludeReason: string;

  /** 제외 처리자 ID */
  excludedBy: string;
}

/**
 * 평가 대상자 포함 데이터 (제외 취소)
 */
export interface IncludeEvaluationTargetData {
  /** 포함 처리자 ID */
  updatedBy: string;
}

/**
 * 평가기간-직원 맵핑 조회 필터
 */
export interface EvaluationPeriodEmployeeMappingFilter {
  /** 평가기간 ID */
  evaluationPeriodId?: string;

  /** 직원 ID */
  employeeId?: string;

  /** 평가 대상 제외 여부 */
  isExcluded?: boolean;

  /** 제외된 대상자 포함 여부 (기본: false) */
  includeExcluded?: boolean;

  /** 제외된 대상자만 조회 */
  excludedOnly?: boolean;

  /** 제외 처리자 ID */
  excludedBy?: string;

  /** 제외 일시 시작 */
  excludedAtFrom?: Date;

  /** 제외 일시 종료 */
  excludedAtTo?: Date;

  /** 정렬 기준 필드 */
  orderBy?: string;

  /** 정렬 방향 */
  orderDirection?: 'ASC' | 'DESC';

  /** 페이지 번호 */
  page?: number;

  /** 페이지당 개수 */
  limit?: number;
}
