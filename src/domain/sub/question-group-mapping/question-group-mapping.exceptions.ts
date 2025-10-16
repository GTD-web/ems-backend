/**
 * 질문 그룹 매핑 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class QuestionGroupMappingDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'QuestionGroupMappingDomainException';
  }
}

// 질문 그룹 매핑 조회 실패 예외
export class QuestionGroupMappingNotFoundException extends QuestionGroupMappingDomainException {
  constructor(identifier: string) {
    super(
      `질문 그룹 매핑을 찾을 수 없습니다: ${identifier}`,
      'QUESTION_GROUP_MAPPING_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'QuestionGroupMappingNotFoundException';
  }
}

// 중복 질문 그룹 매핑 예외
export class DuplicateQuestionGroupMappingException extends QuestionGroupMappingDomainException {
  constructor(groupId: string, questionId: string) {
    super(
      `이미 존재하는 질문 그룹 매핑입니다: 그룹 ${groupId}, 질문 ${questionId}`,
      'DUPLICATE_QUESTION_GROUP_MAPPING',
      409,
      { groupId, questionId },
    );
    this.name = 'DuplicateQuestionGroupMappingException';
  }
}

// 유효하지 않은 질문 그룹 참조 예외
export class InvalidQuestionGroupMappingReferenceException extends QuestionGroupMappingDomainException {
  constructor(groupId: string, questionId: string) {
    super(
      `유효하지 않은 참조입니다: 그룹 ${groupId}, 질문 ${questionId}`,
      'INVALID_QUESTION_GROUP_MAPPING_REFERENCE',
      400,
      { groupId, questionId },
    );
    this.name = 'InvalidQuestionGroupMappingReferenceException';
  }
}

