/**
 * 평가 질문 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EvaluationQuestionDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationQuestionDomainException';
  }
}

// 평가 질문 조회 실패 예외
export class EvaluationQuestionNotFoundException extends EvaluationQuestionDomainException {
  constructor(identifier: string) {
    super(
      `평가 질문을 찾을 수 없습니다: ${identifier}`,
      'EVALUATION_QUESTION_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EvaluationQuestionNotFoundException';
  }
}

// 중복 평가 질문 예외
export class DuplicateEvaluationQuestionException extends EvaluationQuestionDomainException {
  constructor(groupId: string, text: string) {
    super(
      `이미 존재하는 평가 질문입니다: 그룹 ${groupId}, 질문 "${text}"`,
      'DUPLICATE_EVALUATION_QUESTION',
      409,
      { groupId, text },
    );
    this.name = 'DuplicateEvaluationQuestionException';
  }
}

// 유효하지 않은 질문 그룹 참조 예외
export class InvalidQuestionGroupReferenceException extends EvaluationQuestionDomainException {
  constructor(groupId: string) {
    super(
      `유효하지 않은 질문 그룹 참조입니다: ${groupId}`,
      'INVALID_QUESTION_GROUP_REFERENCE',
      400,
      { groupId },
    );
    this.name = 'InvalidQuestionGroupReferenceException';
  }
}

// 유효하지 않은 점수 범위 예외
export class InvalidScoreRangeException extends EvaluationQuestionDomainException {
  constructor(minScore: number, maxScore: number) {
    super(
      `유효하지 않은 점수 범위입니다: 최소 ${minScore}, 최대 ${maxScore}`,
      'INVALID_SCORE_RANGE',
      400,
      { minScore, maxScore },
    );
    this.name = 'InvalidScoreRangeException';
  }
}

// 점수형 질문에 점수 범위 누락 예외
export class ScoreRangeRequiredException extends EvaluationQuestionDomainException {
  constructor(questionType: string) {
    super(
      `${questionType} 유형의 질문에는 점수 범위가 필요합니다`,
      'SCORE_RANGE_REQUIRED',
      400,
      { questionType },
    );
    this.name = 'ScoreRangeRequiredException';
  }
}

// 빈 질문 내용 예외
export class EmptyQuestionTextException extends EvaluationQuestionDomainException {
  constructor() {
    super('질문 내용은 비어있을 수 없습니다', 'EMPTY_QUESTION_TEXT', 400);
    this.name = 'EmptyQuestionTextException';
  }
}

// 응답이 있는 질문 삭제 시도 예외
export class QuestionWithResponsesException extends EvaluationQuestionDomainException {
  constructor(questionId: string, responseCount: number) {
    super(
      `응답이 있는 질문은 삭제할 수 없습니다: ${questionId} (응답 수: ${responseCount})`,
      'QUESTION_HAS_RESPONSES',
      409,
      { questionId, responseCount },
    );
    this.name = 'QuestionWithResponsesException';
  }
}
