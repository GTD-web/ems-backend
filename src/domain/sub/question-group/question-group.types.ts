/**
 * 질문 그룹 생성 DTO
 */
export interface CreateQuestionGroupDto {
  /** 그룹명 */
  name: string;
  /** 기본 그룹 여부 */
  isDefault?: boolean;
  /** 삭제 가능 여부 */
  isDeletable?: boolean;
}

/**
 * 질문 그룹 업데이트 DTO
 */
export interface UpdateQuestionGroupDto {
  /** 그룹명 */
  name?: string;
  /** 기본 그룹 여부 */
  isDefault?: boolean;
  /** 삭제 가능 여부 */
  isDeletable?: boolean;
}

/**
 * 질문 그룹 DTO
 */
export interface QuestionGroupDto {
  /** 질문 그룹 고유 식별자 */
  id: string;
  /** 그룹명 */
  name: string;
  /** 기본 그룹 여부 */
  isDefault: boolean;
  /** 삭제 가능 여부 */
  isDeletable: boolean;
  /** 생성일시 */
  createdAt: Date;
  /** 수정일시 */
  updatedAt: Date;
}

/**
 * 질문 그룹 필터
 */
export interface QuestionGroupFilter {
  /** 그룹명 검색 */
  nameSearch?: string;
  /** 기본 그룹 여부 */
  isDefault?: boolean;
  /** 삭제 가능 여부 */
  isDeletable?: boolean;
}
