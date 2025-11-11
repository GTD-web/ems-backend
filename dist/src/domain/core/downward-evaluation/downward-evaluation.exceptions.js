"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownwardEvaluationNotCompletedException = exports.DownwardEvaluationAlreadyCompletedException = exports.DownwardEvaluationPeriodExpiredException = exports.DownwardEvaluationEvaluatorMismatchException = exports.DownwardEvaluationDuplicateException = exports.DownwardEvaluationValidationException = exports.DownwardEvaluationPermissionDeniedException = exports.DownwardEvaluationNotFoundException = exports.DuplicateDownwardEvaluationException = exports.InvalidDownwardEvaluationScoreException = exports.DownwardEvaluationDomainException = void 0;
const common_1 = require("@nestjs/common");
class DownwardEvaluationDomainException extends common_1.HttpException {
    code;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message, statusCode);
        this.code = code;
        this.context = context;
        this.name = 'DownwardEvaluationDomainException';
    }
}
exports.DownwardEvaluationDomainException = DownwardEvaluationDomainException;
class InvalidDownwardEvaluationScoreException extends DownwardEvaluationDomainException {
    constructor(score, minScore, maxScore, evaluationId) {
        super(`하향 평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`, 'INVALID_DOWNWARD_EVALUATION_SCORE', 400, { score, minScore, maxScore, evaluationId });
        this.name = 'InvalidDownwardEvaluationScoreException';
    }
}
exports.InvalidDownwardEvaluationScoreException = InvalidDownwardEvaluationScoreException;
class DuplicateDownwardEvaluationException extends DownwardEvaluationDomainException {
    constructor(employeeId, evaluatorId, periodId, evaluationType) {
        super(`이미 존재하는 하향 평가입니다: 직원 ${employeeId}, 평가자 ${evaluatorId}, 평가기간 ${periodId}, 유형 ${evaluationType}`, 'DUPLICATE_DOWNWARD_EVALUATION', 409, { employeeId, evaluatorId, periodId, evaluationType });
        this.name = 'DuplicateDownwardEvaluationException';
    }
}
exports.DuplicateDownwardEvaluationException = DuplicateDownwardEvaluationException;
class DownwardEvaluationNotFoundException extends DownwardEvaluationDomainException {
    constructor(identifier) {
        super(`하향 평가를 찾을 수 없습니다: ${identifier}`, 'DOWNWARD_EVALUATION_NOT_FOUND', 404, { identifier });
        this.name = 'DownwardEvaluationNotFoundException';
    }
}
exports.DownwardEvaluationNotFoundException = DownwardEvaluationNotFoundException;
class DownwardEvaluationPermissionDeniedException extends DownwardEvaluationDomainException {
    constructor(evaluatorId, employeeId) {
        super(`하향 평가 권한이 없습니다: 평가자 ${evaluatorId}, 피평가자 ${employeeId}`, 'DOWNWARD_EVALUATION_PERMISSION_DENIED', 403, { evaluatorId, employeeId });
        this.name = 'DownwardEvaluationPermissionDeniedException';
    }
}
exports.DownwardEvaluationPermissionDeniedException = DownwardEvaluationPermissionDeniedException;
class DownwardEvaluationValidationException extends DownwardEvaluationDomainException {
    constructor(message) {
        super(`하향평가 유효성 검사 실패: ${message}`, 'DOWNWARD_EVALUATION_VALIDATION_ERROR', 400, { message });
        this.name = 'DownwardEvaluationValidationException';
    }
}
exports.DownwardEvaluationValidationException = DownwardEvaluationValidationException;
class DownwardEvaluationDuplicateException extends DownwardEvaluationDomainException {
    constructor(employeeId, evaluatorId, periodId) {
        super(`이미 존재하는 하향평가입니다: 피평가자 ${employeeId}, 평가자 ${evaluatorId}, 기간 ${periodId}`, 'DOWNWARD_EVALUATION_DUPLICATE', 409, { employeeId, evaluatorId, periodId });
        this.name = 'DownwardEvaluationDuplicateException';
    }
}
exports.DownwardEvaluationDuplicateException = DownwardEvaluationDuplicateException;
class DownwardEvaluationEvaluatorMismatchException extends DownwardEvaluationDomainException {
    constructor(evaluationId, expectedEvaluatorId, actualEvaluatorId) {
        super(`하향평가의 평가자가 일치하지 않습니다: 평가 ${evaluationId}, 예상 평가자 ${expectedEvaluatorId}, 실제 평가자 ${actualEvaluatorId}`, 'DOWNWARD_EVALUATION_EVALUATOR_MISMATCH', 400, { evaluationId, expectedEvaluatorId, actualEvaluatorId });
        this.name = 'DownwardEvaluationEvaluatorMismatchException';
    }
}
exports.DownwardEvaluationEvaluatorMismatchException = DownwardEvaluationEvaluatorMismatchException;
class DownwardEvaluationPeriodExpiredException extends DownwardEvaluationDomainException {
    constructor(evaluationId, periodId) {
        super(`하향평가의 평가 기간이 만료되었습니다: 평가 ${evaluationId}, 기간 ${periodId}`, 'DOWNWARD_EVALUATION_PERIOD_EXPIRED', 400, { evaluationId, periodId });
        this.name = 'DownwardEvaluationPeriodExpiredException';
    }
}
exports.DownwardEvaluationPeriodExpiredException = DownwardEvaluationPeriodExpiredException;
class DownwardEvaluationAlreadyCompletedException extends DownwardEvaluationDomainException {
    constructor(evaluationId) {
        super(`이미 완료된 하향평가입니다: ${evaluationId}`, 'DOWNWARD_EVALUATION_ALREADY_COMPLETED', 409, { evaluationId });
        this.name = 'DownwardEvaluationAlreadyCompletedException';
    }
}
exports.DownwardEvaluationAlreadyCompletedException = DownwardEvaluationAlreadyCompletedException;
class DownwardEvaluationNotCompletedException extends DownwardEvaluationDomainException {
    constructor(evaluationId) {
        super(`완료되지 않은 하향평가입니다: ${evaluationId}`, 'DOWNWARD_EVALUATION_NOT_COMPLETED', 400, { evaluationId });
        this.name = 'DownwardEvaluationNotCompletedException';
    }
}
exports.DownwardEvaluationNotCompletedException = DownwardEvaluationNotCompletedException;
//# sourceMappingURL=downward-evaluation.exceptions.js.map