"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidWbsItemReferenceException = exports.WbsEvaluationCriteriaBusinessRuleViolationException = exports.InvalidWbsEvaluationCriteriaDataFormatException = exports.WbsEvaluationCriteriaRequiredDataMissingException = exports.WbsEvaluationCriteriaDuplicateException = exports.WbsEvaluationCriteriaNotFoundException = exports.WbsEvaluationCriteriaDomainException = void 0;
class WbsEvaluationCriteriaDomainException extends Error {
    code;
    statusCode;
    context;
    constructor(message, code, statusCode = 400, context) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.name = 'WbsEvaluationCriteriaDomainException';
    }
}
exports.WbsEvaluationCriteriaDomainException = WbsEvaluationCriteriaDomainException;
class WbsEvaluationCriteriaNotFoundException extends WbsEvaluationCriteriaDomainException {
    constructor(identifier) {
        super(`WBS 평가 기준을 찾을 수 없습니다: ${identifier}`, 'WBS_EVALUATION_CRITERIA_NOT_FOUND', 404, { identifier });
        this.name = 'WbsEvaluationCriteriaNotFoundException';
    }
}
exports.WbsEvaluationCriteriaNotFoundException = WbsEvaluationCriteriaNotFoundException;
class WbsEvaluationCriteriaDuplicateException extends WbsEvaluationCriteriaDomainException {
    constructor(wbsItemId, criteria) {
        super(`이미 존재하는 WBS 평가 기준입니다: WBS ${wbsItemId}, 기준 "${criteria}"`, 'DUPLICATE_WBS_EVALUATION_CRITERIA', 409, { wbsItemId, criteria });
        this.name = 'WbsEvaluationCriteriaDuplicateException';
    }
}
exports.WbsEvaluationCriteriaDuplicateException = WbsEvaluationCriteriaDuplicateException;
class WbsEvaluationCriteriaRequiredDataMissingException extends WbsEvaluationCriteriaDomainException {
    constructor(message) {
        super(message, 'WBS_EVALUATION_CRITERIA_REQUIRED_DATA_MISSING', 400);
        this.name = 'WbsEvaluationCriteriaRequiredDataMissingException';
    }
}
exports.WbsEvaluationCriteriaRequiredDataMissingException = WbsEvaluationCriteriaRequiredDataMissingException;
class InvalidWbsEvaluationCriteriaDataFormatException extends WbsEvaluationCriteriaDomainException {
    constructor(message) {
        super(message, 'INVALID_WBS_EVALUATION_CRITERIA_DATA_FORMAT', 400);
        this.name = 'InvalidWbsEvaluationCriteriaDataFormatException';
    }
}
exports.InvalidWbsEvaluationCriteriaDataFormatException = InvalidWbsEvaluationCriteriaDataFormatException;
class WbsEvaluationCriteriaBusinessRuleViolationException extends WbsEvaluationCriteriaDomainException {
    constructor(message) {
        super(message, 'WBS_EVALUATION_CRITERIA_BUSINESS_RULE_VIOLATION', 400);
        this.name = 'WbsEvaluationCriteriaBusinessRuleViolationException';
    }
}
exports.WbsEvaluationCriteriaBusinessRuleViolationException = WbsEvaluationCriteriaBusinessRuleViolationException;
class InvalidWbsItemReferenceException extends WbsEvaluationCriteriaDomainException {
    constructor(wbsItemId) {
        super(`유효하지 않은 WBS 항목 참조입니다: ${wbsItemId}`, 'INVALID_WBS_ITEM_REFERENCE', 400, { wbsItemId });
        this.name = 'InvalidWbsItemReferenceException';
    }
}
exports.InvalidWbsItemReferenceException = InvalidWbsItemReferenceException;
//# sourceMappingURL=wbs-evaluation-criteria.exceptions.js.map