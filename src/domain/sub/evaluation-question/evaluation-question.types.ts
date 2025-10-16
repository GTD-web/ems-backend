/**
 * 평가 질문 생성 DTO
 */
export interface CreateEvaluationQuestionDto {
  /** 질문 내용 */
  text: string;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 그룹 ID (선택사항 - 제공 시 해당 그룹에 자동 추가) */
  groupId?: string;
  /** 표시 순서 (그룹 추가 시 사용) */
  displayOrder?: number;
}

/**
 * 평가 질문 업데이트 DTO
 */
export interface UpdateEvaluationQuestionDto {
  /** 질문 내용 */
  text?: string;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
}

/**
 * 평가 질문 DTO
 */
export interface EvaluationQuestionDto {
  /** 평가 질문 고유 식별자 */
  id: string;
  /** 질문 내용 */
  text: string;
  /** 최소 점수 */
  minScore?: number;
  /** 최대 점수 */
  maxScore?: number;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 평가 질문 필터
 */
export interface EvaluationQuestionFilter {
  /** 질문 내용 검색 */
  textSearch?: string;
}
