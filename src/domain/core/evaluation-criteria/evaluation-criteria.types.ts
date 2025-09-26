/**
 * 평가 기준 생성 DTO
 */
export interface CreateEvaluationCriteriaDto {
  /** 템플릿 ID */
  templateId: string;
  /** 평가 기준명 */
  name: string;
  /** 평가 기준 설명 */
  description?: string;
  /** 가중치 (%) */
  weight: number;
  /** 최소 점수 */
  minScore: number;
  /** 최대 점수 */
  maxScore: number;
  /** 점수별 라벨 배열 */
  scoreLabels?: Record<number, string>;
}

/**
 * 평가 기준 업데이트 DTO
 */
export interface UpdateEvaluationCriteriaDto {
  /** 평가 기준명 */
  name?: string;
  /** 평가 기준 설명 */
  description?: string;
  /** 가중치 (%) */
  weight?: number;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 점수별 라벨 배열 */
  scoreLabels?: Record<number, string>;
}

/**
 * 평가 기준 DTO
 */
export interface EvaluationCriteriaDto {
  /** 평가 기준 고유 식별자 */
  id: string;
  /** 템플릿 ID */
  templateId: string;
  /** 평가 기준명 */
  name: string;
  /** 평가 기준 설명 */
  description?: string;
  /** 가중치 (%) */
  weight: number;
  /** 최소 점수 */
  minScore: number;
  /** 최대 점수 */
  maxScore: number;
  /** 점수별 라벨 배열 */
  scoreLabels?: Record<number, string>;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 기준 필터
 */
export interface EvaluationCriteriaFilter {
  /** 템플릿 ID */
  templateId?: string;
  /** 이름 검색 */
  nameSearch?: string;
  /** 가중치 범위 - 최소 */
  weightFrom?: number;
  /** 가중치 범위 - 최대 */
  weightTo?: number;
}

/**
 * 평가 기준 통계
 */
export interface EvaluationCriteriaStatistics {
  /** 전체 평가 기준 수 */
  totalCriteria: number;
  /** 템플릿별 평가 기준 수 */
  criteriaByTemplate: Record<string, number>;
  /** 평균 가중치 */
  averageWeight: number;
  /** 평균 점수 범위 */
  averageScoreRange: number;
}
