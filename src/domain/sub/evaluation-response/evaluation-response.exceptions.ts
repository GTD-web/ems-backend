/**
 * 평가 응답 도메인 예외 클래스들
 */

// 기본 도메인 예외
export class EvaluationResponseDomainException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly statusCode: number = 400,
    public readonly context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'EvaluationResponseDomainException';
  }
}

// 평가 응답 조회 실패 예외
export class EvaluationResponseNotFoundException extends EvaluationResponseDomainException {
  constructor(identifier: string) {
    super(
      `평가 응답을 찾을 수 없습니다: ${identifier}`,
      'EVALUATION_RESPONSE_NOT_FOUND',
      404,
      { identifier },
    );
    this.name = 'EvaluationResponseNotFoundException';
  }
}

// 중복 평가 응답 예외
export class DuplicateEvaluationResponseException extends EvaluationResponseDomainException {
  constructor(questionId: string, evaluationId: string) {
    super(
      `이미 존재하는 평가 응답입니다: 질문 ${questionId}, 평가 ${evaluationId}`,
      'DUPLICATE_EVALUATION_RESPONSE',
      409,
      { questionId, evaluationId },
    );
    this.name = 'DuplicateEvaluationResponseException';
  }
}

// 유효하지 않은 질문 참조 예외
export class InvalidQuestionReferenceException extends EvaluationResponseDomainException {
  constructor(questionId: string) {
    super(
      `유효하지 않은 질문 참조입니다: ${questionId}`,
      'INVALID_QUESTION_REFERENCE',
      400,
      { questionId },
    );
    this.name = 'InvalidQuestionReferenceException';
  }
}

// 유효하지 않은 평가 참조 예외
export class InvalidEvaluationReferenceException extends EvaluationResponseDomainException {
  constructor(evaluationId: string) {
    super(
      `유효하지 않은 평가 참조입니다: ${evaluationId}`,
      'INVALID_EVALUATION_REFERENCE',
      400,
      { evaluationId },
    );
    this.name = 'InvalidEvaluationReferenceException';
  }
}

// 유효하지 않은 응답 점수 예외
export class InvalidResponseScoreException extends EvaluationResponseDomainException {
  constructor(score: number, minScore: number, maxScore: number) {
    super(
      `유효하지 않은 응답 점수입니다: ${score} (범위: ${minScore}-${maxScore})`,
      'INVALID_RESPONSE_SCORE',
      400,
      { score, minScore, maxScore },
    );
    this.name = 'InvalidResponseScoreException';
  }
}

// 응답 내용 누락 예외
export class MissingResponseContentException extends EvaluationResponseDomainException {
  constructor(questionType: string) {
    super(
      `${questionType} 유형의 질문에는 응답 내용이 필요합니다`,
      'MISSING_RESPONSE_CONTENT',
      400,
      { questionType },
    );
    this.name = 'MissingResponseContentException';
  }
}

// 응답 점수 누락 예외
export class MissingResponseScoreException extends EvaluationResponseDomainException {
  constructor(questionType: string) {
    super(
      `${questionType} 유형의 질문에는 응답 점수가 필요합니다`,
      'MISSING_RESPONSE_SCORE',
      400,
      { questionType },
    );
    this.name = 'MissingResponseScoreException';
  }
}

// 평가 기간 종료 후 응답 시도 예외
export class EvaluationPeriodEndedException extends EvaluationResponseDomainException {
  constructor(evaluationId: string, endDate: Date) {
    super(
      `평가 기간이 종료되어 응답할 수 없습니다: ${evaluationId} (종료일: ${endDate.toISOString()})`,
      'EVALUATION_PERIOD_ENDED',
      403,
      { evaluationId, endDate },
    );
    this.name = 'EvaluationPeriodEndedException';
  }
}

// 권한 없는 응답 시도 예외
export class UnauthorizedResponseException extends EvaluationResponseDomainException {
  constructor(evaluationId: string, userId: string) {
    super(
      `응답 권한이 없습니다: 평가 ${evaluationId}, 사용자 ${userId}`,
      'UNAUTHORIZED_RESPONSE',
      403,
      { evaluationId, userId },
    );
    this.name = 'UnauthorizedResponseException';
  }
}
