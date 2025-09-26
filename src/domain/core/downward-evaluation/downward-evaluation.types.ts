/**
 * 하향 평가 유형
 */
export enum DownwardEvaluationType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
}

/**
 * 하향 평가 생성 DTO
 * 실제 하향평가 데이터만 포함합니다.
 */
export interface CreateDownwardEvaluationDto {
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가 유형 */
  evaluationType: DownwardEvaluationType;
}

/**
 * 하향 평가 업데이트 DTO
 */
export interface UpdateDownwardEvaluationDto {
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
}

/**
 * 하향 평가 DTO
 * 실제 하향평가 데이터만 포함합니다.
 */
export interface DownwardEvaluationDto {
  /** 하향 평가 고유 식별자 */
  id: string;
  /** 하향평가 내용 */
  downwardEvaluationContent?: string;
  /** 하향평가 점수 */
  downwardEvaluationScore?: number;
  /** 평가일 */
  evaluationDate: Date;
  /** 평가 유형 */
  evaluationType: DownwardEvaluationType;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 하향 평가 필터
 * 실제 하향평가 데이터 기준 필터입니다.
 */
export interface DownwardEvaluationFilter {
  /** 평가 유형 */
  evaluationType?: DownwardEvaluationType;
  /** 완료된 평가만 조회 */
  completedOnly?: boolean;
  /** 점수 범위 필터 - 최소 */
  scoreFrom?: number;
  /** 점수 범위 필터 - 최대 */
  scoreTo?: number;
  /** 평가일 범위 - 시작 */
  evaluationDateFrom?: Date;
  /** 평가일 범위 - 종료 */
  evaluationDateTo?: Date;
}

/**
 * 하향 평가 통계
 */
export interface DownwardEvaluationStatistics {
  /** 전체 하향 평가 수 */
  totalEvaluations: number;
  /** 평가 유형별 통계 */
  evaluationsByType: Record<DownwardEvaluationType, number>;
  /** 완료된 평가 수 */
  completedEvaluations: number;
  /** 평균 하향평가 점수 */
  averageDownwardScore: number;
  /** 최고 점수 */
  maxScore: number;
  /** 최저 점수 */
  minScore: number;
}
