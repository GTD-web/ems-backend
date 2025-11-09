"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEvaluationLineDataFormatException = exports.EvaluationLineRequiredDataMissingException = exports.EvaluationLineDuplicateException = exports.EvaluationLineBusinessRuleViolationException = exports.EvaluationLineModificationNotAllowedException = exports.InvalidEvaluatorTypeException = exports.EvaluationLineNotFoundException = exports.RequiredEvaluatorMissingException = exports.SelfEvaluatorAssignmentException = exports.DuplicateEvaluatorAssignmentException = exports.EvaluationLineDomainException = void 0;
class EvaluationLineDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'EvaluationLineDomainException';
    }
}
exports.EvaluationLineDomainException = EvaluationLineDomainException;
class DuplicateEvaluatorAssignmentException extends EvaluationLineDomainException {
    constructor(employeeId, evaluatorId, evaluatorType) {
        super(`이미 지정된 평가자입니다: 직원 ${employeeId}, 평가자 ${evaluatorId} (유형: ${evaluatorType})`, 'DUPLICATE_EVALUATOR_ASSIGNMENT', 409, { employeeId, evaluatorId, evaluatorType });
        this.name = 'DuplicateEvaluatorAssignmentException';
    }
}
exports.DuplicateEvaluatorAssignmentException = DuplicateEvaluatorAssignmentException;
class SelfEvaluatorAssignmentException extends EvaluationLineDomainException {
    constructor(employeeId) {
        super(`자기 자신을 평가자로 지정할 수 없습니다: ${employeeId}`, 'SELF_EVALUATOR_ASSIGNMENT', 400, { employeeId });
        this.name = 'SelfEvaluatorAssignmentException';
    }
}
exports.SelfEvaluatorAssignmentException = SelfEvaluatorAssignmentException;
class RequiredEvaluatorMissingException extends EvaluationLineDomainException {
    constructor(employeeId, missingEvaluatorTypes) {
        super(`필수 평가자가 누락되었습니다: 직원 ${employeeId} (누락 유형: ${missingEvaluatorTypes.join(', ')})`, 'REQUIRED_EVALUATOR_MISSING', 422, { employeeId, missingEvaluatorTypes });
        this.name = 'RequiredEvaluatorMissingException';
    }
}
exports.RequiredEvaluatorMissingException = RequiredEvaluatorMissingException;
class EvaluationLineNotFoundException extends EvaluationLineDomainException {
    constructor(identifier) {
        super(`평가 라인을 찾을 수 없습니다: ${identifier}`, 'EVALUATION_LINE_NOT_FOUND', 404, { identifier });
        this.name = 'EvaluationLineNotFoundException';
    }
}
exports.EvaluationLineNotFoundException = EvaluationLineNotFoundException;
class InvalidEvaluatorTypeException extends EvaluationLineDomainException {
    constructor(evaluatorType, allowedTypes) {
        super(`잘못된 평가자 유형입니다: ${evaluatorType} (허용 유형: ${allowedTypes.join(', ')})`, 'INVALID_EVALUATOR_TYPE', 400, { evaluatorType, allowedTypes });
        this.name = 'InvalidEvaluatorTypeException';
    }
}
exports.InvalidEvaluatorTypeException = InvalidEvaluatorTypeException;
class EvaluationLineModificationNotAllowedException extends EvaluationLineDomainException {
    constructor(lineId, reason) {
        super(`평가 라인을 수정할 수 없습니다: ${reason}`, 'EVALUATION_LINE_MODIFICATION_NOT_ALLOWED', 422, { lineId, reason });
        this.name = 'EvaluationLineModificationNotAllowedException';
    }
}
exports.EvaluationLineModificationNotAllowedException = EvaluationLineModificationNotAllowedException;
class EvaluationLineBusinessRuleViolationException extends EvaluationLineDomainException {
    constructor(message, context) {
        super(message, 'EVALUATION_LINE_BUSINESS_RULE_VIOLATION', 422, context);
        this.name = 'EvaluationLineBusinessRuleViolationException';
    }
}
exports.EvaluationLineBusinessRuleViolationException = EvaluationLineBusinessRuleViolationException;
class EvaluationLineDuplicateException extends EvaluationLineDomainException {
    constructor(message, context) {
        super(message, 'EVALUATION_LINE_DUPLICATE', 409, context);
        this.name = 'EvaluationLineDuplicateException';
    }
}
exports.EvaluationLineDuplicateException = EvaluationLineDuplicateException;
class EvaluationLineRequiredDataMissingException extends EvaluationLineDomainException {
    constructor(message, context) {
        super(message, 'EVALUATION_LINE_REQUIRED_DATA_MISSING', 400, context);
        this.name = 'EvaluationLineRequiredDataMissingException';
    }
}
exports.EvaluationLineRequiredDataMissingException = EvaluationLineRequiredDataMissingException;
class InvalidEvaluationLineDataFormatException extends EvaluationLineDomainException {
    constructor(message, context) {
        super(message, 'INVALID_EVALUATION_LINE_DATA_FORMAT', 400, context);
        this.name = 'InvalidEvaluationLineDataFormatException';
    }
}
exports.InvalidEvaluationLineDataFormatException = InvalidEvaluationLineDataFormatException;
//# sourceMappingURL=evaluation-line.exceptions.js.map