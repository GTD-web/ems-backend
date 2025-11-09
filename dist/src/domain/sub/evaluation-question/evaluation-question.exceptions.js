"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionWithResponsesException = exports.EmptyQuestionTextException = exports.ScoreRangeRequiredException = exports.InvalidScoreRangeException = exports.DuplicateEvaluationQuestionException = exports.EvaluationQuestionNotFoundException = exports.EvaluationQuestionDomainException = void 0;
class EvaluationQuestionDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'EvaluationQuestionDomainException';
    }
}
exports.EvaluationQuestionDomainException = EvaluationQuestionDomainException;
class EvaluationQuestionNotFoundException extends EvaluationQuestionDomainException {
    constructor(identifier) {
        super(`평가 질문을 찾을 수 없습니다: ${identifier}`, 'EVALUATION_QUESTION_NOT_FOUND', 404, { identifier });
        this.name = 'EvaluationQuestionNotFoundException';
    }
}
exports.EvaluationQuestionNotFoundException = EvaluationQuestionNotFoundException;
class DuplicateEvaluationQuestionException extends EvaluationQuestionDomainException {
    constructor(text) {
        super(`이미 존재하는 평가 질문입니다: "${text}"`, 'DUPLICATE_EVALUATION_QUESTION', 409, { text });
        this.name = 'DuplicateEvaluationQuestionException';
    }
}
exports.DuplicateEvaluationQuestionException = DuplicateEvaluationQuestionException;
class InvalidScoreRangeException extends EvaluationQuestionDomainException {
    constructor(minScore, maxScore) {
        super(`유효하지 않은 점수 범위입니다: 최소 ${minScore}, 최대 ${maxScore}`, 'INVALID_SCORE_RANGE', 400, { minScore, maxScore });
        this.name = 'InvalidScoreRangeException';
    }
}
exports.InvalidScoreRangeException = InvalidScoreRangeException;
class ScoreRangeRequiredException extends EvaluationQuestionDomainException {
    constructor(questionId) {
        super(`점수 범위가 필요합니다`, 'SCORE_RANGE_REQUIRED', 400, {
            questionId,
        });
        this.name = 'ScoreRangeRequiredException';
    }
}
exports.ScoreRangeRequiredException = ScoreRangeRequiredException;
class EmptyQuestionTextException extends EvaluationQuestionDomainException {
    constructor() {
        super('질문 내용은 비어있을 수 없습니다', 'EMPTY_QUESTION_TEXT', 400);
        this.name = 'EmptyQuestionTextException';
    }
}
exports.EmptyQuestionTextException = EmptyQuestionTextException;
class QuestionWithResponsesException extends EvaluationQuestionDomainException {
    constructor(questionId, responseCount) {
        super(`응답이 있는 질문은 삭제할 수 없습니다: ${questionId} (응답 수: ${responseCount})`, 'QUESTION_HAS_RESPONSES', 409, { questionId, responseCount });
        this.name = 'QuestionWithResponsesException';
    }
}
exports.QuestionWithResponsesException = QuestionWithResponsesException;
//# sourceMappingURL=evaluation-question.exceptions.js.map