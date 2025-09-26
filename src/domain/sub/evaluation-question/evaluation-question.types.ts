/**
 * 평가 질문 생성 DTO
 */
export interface CreateEvaluationQuestionDto {
  /** 질문 그룹 ID */
  groupId: string;
  /** 질문 내용 */
  text: string;
  /** 질문 유형 */
  type: EvaluationQuestionType;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 신규 질문 여부 */
  isNewQuestion?: boolean;
  /** 그룹 포함 여부 */
  includeInGroup?: boolean;
}

/**
 * 평가 질문 업데이트 DTO
 */
export interface UpdateEvaluationQuestionDto {
  /** 질문 그룹 ID */
  groupId?: string;
  /** 질문 내용 */
  text?: string;
  /** 질문 유형 */
  type?: EvaluationQuestionType;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 신규 질문 여부 */
  isNewQuestion?: boolean;
  /** 그룹 포함 여부 */
  includeInGroup?: boolean;
}

/**
 * 평가 질문 DTO
 */
export interface EvaluationQuestionDto {
  /** 평가 질문 고유 식별자 */
  id: string;
  /** 질문 그룹 ID */
  groupId: string;
  /** 질문 내용 */
  text: string;
  /** 질문 유형 */
  type: EvaluationQuestionType;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 신규 질문 여부 */
  isNewQuestion: boolean;
  /** 그룹 포함 여부 */
  includeInGroup: boolean;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 질문 필터
 */
export interface EvaluationQuestionFilter {
  /** 질문 그룹 ID */
  groupId?: string;
  /** 질문 내용 검색 */
  textSearch?: string;
  /** 질문 유형 */
  type?: EvaluationQuestionType;
  /** 신규 질문 여부 */
  isNewQuestion?: boolean;
  /** 그룹 포함 여부 */
  includeInGroup?: boolean;
}

/**
 * 평가 질문 유형
 */
export enum EvaluationQuestionType {
  /** 설문형 (텍스트 응답) */
  QUESTIONNAIRE = 'questionnaire',
  /** 점수형 (숫자 응답) */
  SCORE = 'score',
  /** 혼합형 (텍스트 + 점수) */
  MIXED = 'mixed',
}

/**
 * 평가 질문 유형 라벨
 */
export const EvaluationQuestionTypeLabels = {
  [EvaluationQuestionType.QUESTIONNAIRE]: '설문형',
  [EvaluationQuestionType.SCORE]: '점수형',
  [EvaluationQuestionType.MIXED]: '혼합형',
} as const;
