"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedResponseException = exports.EvaluationPeriodEndedException = exports.MissingResponseScoreException = exports.MissingResponseContentException = exports.InvalidResponseScoreException = exports.InvalidEvaluationReferenceException = exports.InvalidQuestionReferenceException = exports.DuplicateEvaluationResponseException = exports.EvaluationResponseNotFoundException = exports.EvaluationResponseDomainException = void 0;
class EvaluationResponseDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'EvaluationResponseDomainException';
    }
}
exports.EvaluationResponseDomainException = EvaluationResponseDomainException;
class EvaluationResponseNotFoundException extends EvaluationResponseDomainException {
    constructor(identifier) {
        super(`평가 응답을 찾을 수 없습니다: ${identifier}`, 'EVALUATION_RESPONSE_NOT_FOUND', 404, { identifier });
        this.name = 'EvaluationResponseNotFoundException';
    }
}
exports.EvaluationResponseNotFoundException = EvaluationResponseNotFoundException;
class DuplicateEvaluationResponseException extends EvaluationResponseDomainException {
    constructor(questionId, evaluationId) {
        super(`이미 존재하는 평가 응답입니다: 질문 ${questionId}, 평가 ${evaluationId}`, 'DUPLICATE_EVALUATION_RESPONSE', 409, { questionId, evaluationId });
        this.name = 'DuplicateEvaluationResponseException';
    }
}
exports.DuplicateEvaluationResponseException = DuplicateEvaluationResponseException;
class InvalidQuestionReferenceException extends EvaluationResponseDomainException {
    constructor(questionId) {
        super(`유효하지 않은 질문 참조입니다: ${questionId}`, 'INVALID_QUESTION_REFERENCE', 400, { questionId });
        this.name = 'InvalidQuestionReferenceException';
    }
}
exports.InvalidQuestionReferenceException = InvalidQuestionReferenceException;
class InvalidEvaluationReferenceException extends EvaluationResponseDomainException {
    constructor(evaluationId) {
        super(`유효하지 않은 평가 참조입니다: ${evaluationId}`, 'INVALID_EVALUATION_REFERENCE', 400, { evaluationId });
        this.name = 'InvalidEvaluationReferenceException';
    }
}
exports.InvalidEvaluationReferenceException = InvalidEvaluationReferenceException;
class InvalidResponseScoreException extends EvaluationResponseDomainException {
    constructor(score, minScore, maxScore) {
        super(`유효하지 않은 응답 점수입니다: ${score} (범위: ${minScore}-${maxScore})`, 'INVALID_RESPONSE_SCORE', 400, { score, minScore, maxScore });
        this.name = 'InvalidResponseScoreException';
    }
}
exports.InvalidResponseScoreException = InvalidResponseScoreException;
class MissingResponseContentException extends EvaluationResponseDomainException {
    constructor(questionType) {
        super(`${questionType} 유형의 질문에는 응답 내용이 필요합니다`, 'MISSING_RESPONSE_CONTENT', 400, { questionType });
        this.name = 'MissingResponseContentException';
    }
}
exports.MissingResponseContentException = MissingResponseContentException;
class MissingResponseScoreException extends EvaluationResponseDomainException {
    constructor(questionType) {
        super(`${questionType} 유형의 질문에는 응답 점수가 필요합니다`, 'MISSING_RESPONSE_SCORE', 400, { questionType });
        this.name = 'MissingResponseScoreException';
    }
}
exports.MissingResponseScoreException = MissingResponseScoreException;
class EvaluationPeriodEndedException extends EvaluationResponseDomainException {
    constructor(evaluationId, endDate) {
        super(`평가 기간이 종료되어 응답할 수 없습니다: ${evaluationId} (종료일: ${endDate.toISOString()})`, 'EVALUATION_PERIOD_ENDED', 403, { evaluationId, endDate });
        this.name = 'EvaluationPeriodEndedException';
    }
}
exports.EvaluationPeriodEndedException = EvaluationPeriodEndedException;
class UnauthorizedResponseException extends EvaluationResponseDomainException {
    constructor(evaluationId, userId) {
        super(`응답 권한이 없습니다: 평가 ${evaluationId}, 사용자 ${userId}`, 'UNAUTHORIZED_RESPONSE', 403, { evaluationId, userId });
        this.name = 'UnauthorizedResponseException';
    }
}
exports.UnauthorizedResponseException = UnauthorizedResponseException;
//# sourceMappingURL=evaluation-response.exceptions.js.map