/**
 * 질문 그룹 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class QuestionGroupDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'QuestionGroupDomainException';
  }
}

// 질문 그룹 조회 실패 예외
export class QuestionGroupNotFoundException extends QuestionGroupDomainException {
  constructor(identifier: string) {
    super(
      `질문 그룹을 찾을 수 없습니다: ${identifier}`,
      'QUESTION_GROUP_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'QuestionGroupNotFoundException';
  }
}

// 중복 질문 그룹 예외
export class DuplicateQuestionGroupException extends QuestionGroupDomainException {
  constructor(name: string) {
    super(
      `이미 존재하는 질문 그룹입니다: ${name}`,
      'DUPLICATE_QUESTION_GROUP',
      409,
      { name },
    );
    this.name = 'DuplicateQuestionGroupException';
  }
}

// 기본 그룹 삭제 시도 예외
export class DefaultGroupDeletionException extends QuestionGroupDomainException {
  constructor(groupId: string) {
    super(
      `기본 그룹은 삭제할 수 없습니다: ${groupId}`,
      'DEFAULT_GROUP_DELETION_NOT_ALLOWED',
      403,
      { groupId },
    );
    this.name = 'DefaultGroupDeletionException';
  }
}

// 삭제 불가능한 그룹 삭제 시도 예외
export class UndeletableGroupException extends QuestionGroupDomainException {
  constructor(groupId: string) {
    super(
      `삭제할 수 없는 그룹입니다: ${groupId}`,
      'GROUP_DELETION_NOT_ALLOWED',
      403,
      { groupId },
    );
    this.name = 'UndeletableGroupException';
  }
}

// 질문이 있는 그룹 삭제 시도 예외
export class GroupWithQuestionsException extends QuestionGroupDomainException {
  constructor(groupId: string, questionCount: number) {
    super(
      `질문이 있는 그룹은 삭제할 수 없습니다: ${groupId} (질문 수: ${questionCount})`,
      'GROUP_HAS_QUESTIONS',
      409,
      { groupId, questionCount },
    );
    this.name = 'GroupWithQuestionsException';
  }
}

// 빈 그룹명 예외
export class EmptyGroupNameException extends QuestionGroupDomainException {
  constructor() {
    super('그룹명은 비어있을 수 없습니다', 'EMPTY_GROUP_NAME', 400);
    this.name = 'EmptyGroupNameException';
  }
}
