/**
 * 평가 응답 생성 DTO
 */
export interface CreateEvaluationResponseDto {
  /** 질문 ID */
  questionId: string;
  /** 평가 ID */
  evaluationId: string;
  /** 평가 유형 */
  evaluationType: EvaluationResponseType;
  /** 응답 내용 */
  answer?: string;
  /** 응답 점수 */
  score?: number;
}

/**
 * 평가 응답 업데이트 DTO
 */
export interface UpdateEvaluationResponseDto {
  /** 응답 내용 */
  answer?: string;
  /** 응답 점수 */
  score?: number;
}

/**
 * 평가 응답 DTO
 */
export interface EvaluationResponseDto {
  /** 평가 응답 고유 식별자 */
  id: string;
  /** 질문 ID */
  questionId: string;
  /** 평가 ID */
  evaluationId: string;
  /** 평가 유형 */
  evaluationType: EvaluationResponseType;
  /** 응답 내용 */
  answer?: string;
  /** 응답 점수 */
  score?: number;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 응답 필터
 */
export interface EvaluationResponseFilter {
  /** 질문 ID */
  questionId?: string;
  /** 평가 ID */
  evaluationId?: string;
  /** 평가 유형 */
  evaluationType?: EvaluationResponseType;
  /** 응답 내용 검색 */
  answerSearch?: string;
  /** 점수 범위 */
  minScore?: number;
  maxScore?: number;
}

/**
 * 평가 응답 유형
 */
export enum EvaluationResponseType {
  /** 자기평가 */
  SELF = 'self',
  /** 동료평가 */
  PEER = 'peer',
  /** 추가평가 */
  ADDITIONAL = 'additional',
  /** 하향평가 */
  DOWNWARD = 'downward',
}

/**
 * 평가 응답 유형 라벨
 */
export const EvaluationResponseTypeLabels = {
  [EvaluationResponseType.SELF]: '자기평가',
  [EvaluationResponseType.PEER]: '동료평가',
  [EvaluationResponseType.ADDITIONAL]: '추가평가',
  [EvaluationResponseType.DOWNWARD]: '하향평가',
} as const;

/**
 * 평가 응답 통계
 */
export interface EvaluationResponseStats {
  /** 총 응답 수 */
  totalCount: number;
  /** 평가 유형별 응답 수 */
  countByType: Record<EvaluationResponseType, number>;
  /** 평균 점수 */
  averageScore?: number;
  /** 최고 점수 */
  maxScore?: number;
  /** 최저 점수 */
  minScore?: number;
}
