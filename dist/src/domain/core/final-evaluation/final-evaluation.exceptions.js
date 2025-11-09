"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidFinalEvaluationDataFormatException = exports.FinalEvaluationRequiredDataMissingException = exports.FinalEvaluationBusinessRuleViolationException = exports.InvalidJobDetailedGradeException = exports.InvalidJobGradeException = exports.InvalidEvaluationGradeException = exports.AlreadyConfirmedEvaluationException = exports.NotConfirmedEvaluationException = exports.ConfirmedEvaluationModificationException = exports.DuplicateFinalEvaluationException = exports.FinalEvaluationNotFoundException = exports.FinalEvaluationDomainException = void 0;
class FinalEvaluationDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'FinalEvaluationDomainException';
    }
}
exports.FinalEvaluationDomainException = FinalEvaluationDomainException;
class FinalEvaluationNotFoundException extends FinalEvaluationDomainException {
    constructor(identifier) {
        super(`최종평가를 찾을 수 없습니다: ${identifier}`, 'FINAL_EVALUATION_NOT_FOUND', 404, { identifier });
        this.name = 'FinalEvaluationNotFoundException';
    }
}
exports.FinalEvaluationNotFoundException = FinalEvaluationNotFoundException;
class DuplicateFinalEvaluationException extends FinalEvaluationDomainException {
    constructor(employeeId, periodId) {
        super(`이미 최종평가가 존재합니다: 직원 ${employeeId}, 평가기간 ${periodId}`, 'DUPLICATE_FINAL_EVALUATION', 409, { employeeId, periodId });
        this.name = 'DuplicateFinalEvaluationException';
    }
}
exports.DuplicateFinalEvaluationException = DuplicateFinalEvaluationException;
class ConfirmedEvaluationModificationException extends FinalEvaluationDomainException {
    constructor(evaluationId) {
        super(`확정된 평가는 수정할 수 없습니다: ${evaluationId}`, 'CONFIRMED_EVALUATION_MODIFICATION', 422, { evaluationId });
        this.name = 'ConfirmedEvaluationModificationException';
    }
}
exports.ConfirmedEvaluationModificationException = ConfirmedEvaluationModificationException;
class NotConfirmedEvaluationException extends FinalEvaluationDomainException {
    constructor(evaluationId, action) {
        super(`확정되지 않은 평가입니다 (${action} 불가): ${evaluationId}`, 'NOT_CONFIRMED_EVALUATION', 422, { evaluationId, action });
        this.name = 'NotConfirmedEvaluationException';
    }
}
exports.NotConfirmedEvaluationException = NotConfirmedEvaluationException;
class AlreadyConfirmedEvaluationException extends FinalEvaluationDomainException {
    constructor(evaluationId) {
        super(`이미 확정된 평가입니다: ${evaluationId}`, 'ALREADY_CONFIRMED_EVALUATION', 409, { evaluationId });
        this.name = 'AlreadyConfirmedEvaluationException';
    }
}
exports.AlreadyConfirmedEvaluationException = AlreadyConfirmedEvaluationException;
class InvalidEvaluationGradeException extends FinalEvaluationDomainException {
    constructor(grade, allowedGrades) {
        const message = allowedGrades
            ? `유효하지 않은 평가등급입니다: ${grade} (허용 등급: ${allowedGrades.join(', ')})`
            : `유효하지 않은 평가등급입니다: ${grade}`;
        super(message, 'INVALID_EVALUATION_GRADE', 400, {
            grade,
            allowedGrades,
        });
        this.name = 'InvalidEvaluationGradeException';
    }
}
exports.InvalidEvaluationGradeException = InvalidEvaluationGradeException;
class InvalidJobGradeException extends FinalEvaluationDomainException {
    constructor(grade, allowedGrades) {
        super(`유효하지 않은 직무등급입니다: ${grade} (허용 등급: ${allowedGrades.join(', ')})`, 'INVALID_JOB_GRADE', 400, { grade, allowedGrades });
        this.name = 'InvalidJobGradeException';
    }
}
exports.InvalidJobGradeException = InvalidJobGradeException;
class InvalidJobDetailedGradeException extends FinalEvaluationDomainException {
    constructor(grade, allowedGrades) {
        super(`유효하지 않은 직무 상세등급입니다: ${grade} (허용 등급: ${allowedGrades.join(', ')})`, 'INVALID_JOB_DETAILED_GRADE', 400, { grade, allowedGrades });
        this.name = 'InvalidJobDetailedGradeException';
    }
}
exports.InvalidJobDetailedGradeException = InvalidJobDetailedGradeException;
class FinalEvaluationBusinessRuleViolationException extends FinalEvaluationDomainException {
    constructor(message, context) {
        super(message, 'FINAL_EVALUATION_BUSINESS_RULE_VIOLATION', 422, context);
        this.name = 'FinalEvaluationBusinessRuleViolationException';
    }
}
exports.FinalEvaluationBusinessRuleViolationException = FinalEvaluationBusinessRuleViolationException;
class FinalEvaluationRequiredDataMissingException extends FinalEvaluationDomainException {
    constructor(message, context) {
        super(message, 'FINAL_EVALUATION_REQUIRED_DATA_MISSING', 400, context);
        this.name = 'FinalEvaluationRequiredDataMissingException';
    }
}
exports.FinalEvaluationRequiredDataMissingException = FinalEvaluationRequiredDataMissingException;
class InvalidFinalEvaluationDataFormatException extends FinalEvaluationDomainException {
    constructor(message, context) {
        super(message, 'INVALID_FINAL_EVALUATION_DATA_FORMAT', 400, context);
        this.name = 'InvalidFinalEvaluationDataFormatException';
    }
}
exports.InvalidFinalEvaluationDataFormatException = InvalidFinalEvaluationDataFormatException;
//# sourceMappingURL=final-evaluation.exceptions.js.map