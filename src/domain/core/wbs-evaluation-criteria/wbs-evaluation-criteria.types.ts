/**
 * WBS 평가 기준 생성 DTO
 */
export interface CreateWbsEvaluationCriteriaDto {
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 평가 기준 내용 */
  criteria: string;
}

/**
 * WBS 평가 기준 업데이트 DTO
 */
export interface UpdateWbsEvaluationCriteriaDto {
  /** 평가 기준 내용 */
  criteria?: string;
}

/**
 * WBS 평가 기준 DTO
 */
export interface WbsEvaluationCriteriaDto {
  /** WBS 평가 기준 고유 식별자 */
  id: string;
  /** WBS 항목 ID */
  wbsItemId: string;
  /** 평가 기준 내용 */
  criteria: string;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * WBS 평가 기준 필터
 */
export interface WbsEvaluationCriteriaFilter {
  /** WBS 항목 ID */
  wbsItemId?: string;
  /** 기준 내용 검색 */
  criteriaSearch?: string;
}
