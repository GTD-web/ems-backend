/**
 * 질문 그룹 매핑 생성 DTO
 */
export interface CreateQuestionGroupMappingDto {
  /** 질문 그룹 ID */
  groupId: string;
  /** 평가 질문 ID */
  questionId: string;
  /** 표시 순서 */
  displayOrder?: number;
}

/**
 * 질문 그룹 매핑 업데이트 DTO
 */
export interface UpdateQuestionGroupMappingDto {
  /** 표시 순서 */
  displayOrder?: number;
}

/**
 * 질문 그룹 매핑 DTO
 */
export interface QuestionGroupMappingDto {
  /** 질문 그룹 매핑 고유 식별자 */
  id: string;
  /** 질문 그룹 ID */
  groupId: string;
  /** 평가 질문 ID */
  questionId: string;
  /** 표시 순서 */
  displayOrder: number;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 질문 그룹 매핑 필터
 */
export interface QuestionGroupMappingFilter {
  /** 질문 그룹 ID */
  groupId?: string;
  /** 평가 질문 ID */
  questionId?: string;
}

