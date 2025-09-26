/**
 * 평가자 유형
 */
export enum EvaluatorType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  ADDITIONAL = 'additional',
}

/**
 * 평가 라인 생성 DTO
 * 실제 평가 라인 데이터만 포함합니다.
 */
export interface CreateEvaluationLineDto {
  /** 평가자 유형 */
  evaluatorType: EvaluatorType;
  /** 평가 순서 */
  order: number;
  /** 필수 평가자 여부 */
  isRequired?: boolean;
  /** 자동 할당 여부 */
  isAutoAssigned?: boolean;
}

/**
 * 평가 라인 업데이트 DTO
 */
export interface UpdateEvaluationLineDto {
  /** 평가자 유형 */
  evaluatorType?: EvaluatorType;
  /** 평가 순서 */
  order?: number;
  /** 필수 평가자 여부 */
  isRequired?: boolean;
  /** 자동 할당 여부 */
  isAutoAssigned?: boolean;
}

/**
 * 평가 라인 DTO
 * 실제 평가 라인 데이터만 포함합니다.
 */
export interface EvaluationLineDto {
  /** 평가 라인 고유 식별자 */
  id: string;
  /** 평가자 유형 */
  evaluatorType: EvaluatorType;
  /** 평가 순서 */
  order: number;
  /** 필수 평가자 여부 */
  isRequired: boolean;
  /** 자동 할당 여부 */
  isAutoAssigned: boolean;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 라인 필터
 * 실제 평가 라인 데이터 기준 필터입니다.
 */
export interface EvaluationLineFilter {
  /** 평가자 유형 */
  evaluatorType?: EvaluatorType;
  /** 필수 평가자만 조회 */
  requiredOnly?: boolean;
  /** 자동 할당만 조회 */
  autoAssignedOnly?: boolean;
  /** 평가 순서 범위 - 최소 */
  orderFrom?: number;
  /** 평가 순서 범위 - 최대 */
  orderTo?: number;
}

/**
 * 평가 라인 통계
 */
export interface EvaluationLineStatistics {
  /** 전체 평가 라인 수 */
  totalLines: number;
  /** 평가자 유형별 통계 */
  evaluatorTypeCounts: Record<EvaluatorType, number>;
  /** 필수 평가자 수 */
  requiredEvaluators: number;
  /** 자동 할당 평가자 수 */
  autoAssignedEvaluators: number;
  /** 수동 지정 평가자 수 */
  manualAssignedEvaluators: number;
}
