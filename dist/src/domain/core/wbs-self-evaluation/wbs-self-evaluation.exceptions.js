"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsSelfEvaluationDuplicateException = exports.WbsSelfEvaluationValidationException = exports.WbsSelfEvaluationCannotSubmitException = exports.WbsSelfEvaluationAlreadySubmittedException = exports.WbsSelfEvaluationPeriodExpiredException = exports.WbsSelfEvaluationPermissionDeniedException = exports.WbsSelfEvaluationNotFoundException = exports.DuplicateWbsSelfEvaluationException = exports.InvalidWbsSelfEvaluationScoreException = exports.WbsSelfEvaluationDomainException = void 0;
class WbsSelfEvaluationDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'WbsSelfEvaluationDomainException';
    }
}
exports.WbsSelfEvaluationDomainException = WbsSelfEvaluationDomainException;
class InvalidWbsSelfEvaluationScoreException extends WbsSelfEvaluationDomainException {
    constructor(score, minScore, maxScore, wbsItemId) {
        super(`WBS 자기평가 점수가 유효 범위를 벗어났습니다: ${score} (범위: ${minScore}-${maxScore})`, 'INVALID_WBS_SELF_EVALUATION_SCORE', 400, { score, minScore, maxScore, wbsItemId });
        this.name = 'InvalidWbsSelfEvaluationScoreException';
    }
}
exports.InvalidWbsSelfEvaluationScoreException = InvalidWbsSelfEvaluationScoreException;
class DuplicateWbsSelfEvaluationException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId, employeeId, periodId) {
        super(`이미 존재하는 WBS 자기평가입니다: WBS ${wbsItemId}, 직원 ${employeeId}, 평가기간 ${periodId}`, 'DUPLICATE_WBS_SELF_EVALUATION', 409, { wbsItemId, employeeId, periodId });
        this.name = 'DuplicateWbsSelfEvaluationException';
    }
}
exports.DuplicateWbsSelfEvaluationException = DuplicateWbsSelfEvaluationException;
class WbsSelfEvaluationNotFoundException extends WbsSelfEvaluationDomainException {
    constructor(identifier) {
        super(`WBS 자기평가를 찾을 수 없습니다: ${identifier}`, 'WBS_SELF_EVALUATION_NOT_FOUND', 404, { identifier });
        this.name = 'WbsSelfEvaluationNotFoundException';
    }
}
exports.WbsSelfEvaluationNotFoundException = WbsSelfEvaluationNotFoundException;
class WbsSelfEvaluationPermissionDeniedException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId, employeeId, requesterId) {
        super(`WBS 자기평가 권한이 없습니다. 본인의 평가만 수정할 수 있습니다: WBS ${wbsItemId}, 평가대상 ${employeeId}, 요청자 ${requesterId}`, 'WBS_SELF_EVALUATION_PERMISSION_DENIED', 403, { wbsItemId, employeeId, requesterId });
        this.name = 'WbsSelfEvaluationPermissionDeniedException';
    }
}
exports.WbsSelfEvaluationPermissionDeniedException = WbsSelfEvaluationPermissionDeniedException;
class WbsSelfEvaluationPeriodExpiredException extends WbsSelfEvaluationDomainException {
    constructor(periodId, endDate) {
        super(`WBS 자기평가 기간이 만료되었습니다: ${periodId} (종료일: ${endDate})`, 'WBS_SELF_EVALUATION_PERIOD_EXPIRED', 422, { periodId, endDate });
        this.name = 'WbsSelfEvaluationPeriodExpiredException';
    }
}
exports.WbsSelfEvaluationPeriodExpiredException = WbsSelfEvaluationPeriodExpiredException;
class WbsSelfEvaluationAlreadySubmittedException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId, employeeId, submittedAt) {
        super(`WBS 자기평가가 이미 제출되었습니다: WBS ${wbsItemId}, 직원 ${employeeId} (제출일: ${submittedAt})`, 'WBS_SELF_EVALUATION_ALREADY_SUBMITTED', 422, { wbsItemId, employeeId, submittedAt });
        this.name = 'WbsSelfEvaluationAlreadySubmittedException';
    }
}
exports.WbsSelfEvaluationAlreadySubmittedException = WbsSelfEvaluationAlreadySubmittedException;
class WbsSelfEvaluationCannotSubmitException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId, employeeId, reason) {
        super(`WBS 자기평가를 제출할 수 없습니다: WBS ${wbsItemId}, 직원 ${employeeId} (사유: ${reason})`, 'WBS_SELF_EVALUATION_CANNOT_SUBMIT', 422, { wbsItemId, employeeId, reason });
        this.name = 'WbsSelfEvaluationCannotSubmitException';
    }
}
exports.WbsSelfEvaluationCannotSubmitException = WbsSelfEvaluationCannotSubmitException;
class WbsSelfEvaluationValidationException extends WbsSelfEvaluationDomainException {
    constructor(message) {
        super(`WBS 자가평가 유효성 검사 실패: ${message}`, 'WBS_SELF_EVALUATION_VALIDATION_ERROR', 400, { message });
        this.name = 'WbsSelfEvaluationValidationException';
    }
}
exports.WbsSelfEvaluationValidationException = WbsSelfEvaluationValidationException;
class WbsSelfEvaluationDuplicateException extends WbsSelfEvaluationDomainException {
    constructor(periodId, employeeId, wbsItemId) {
        super(`이미 존재하는 WBS 자가평가입니다: 기간 ${periodId}, 직원 ${employeeId}, WBS ${wbsItemId}`, 'WBS_SELF_EVALUATION_DUPLICATE', 409, { periodId, employeeId, wbsItemId });
        this.name = 'WbsSelfEvaluationDuplicateException';
    }
}
exports.WbsSelfEvaluationDuplicateException = WbsSelfEvaluationDuplicateException;
//# sourceMappingURL=wbs-self-evaluation.exceptions.js.map