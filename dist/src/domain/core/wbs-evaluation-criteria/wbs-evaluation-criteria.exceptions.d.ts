export declare class WbsEvaluationCriteriaDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class WbsEvaluationCriteriaNotFoundException extends WbsEvaluationCriteriaDomainException {
    constructor(identifier: string);
}
export declare class WbsEvaluationCriteriaDuplicateException extends WbsEvaluationCriteriaDomainException {
    constructor(wbsItemId: string, criteria: string);
}
export declare class WbsEvaluationCriteriaRequiredDataMissingException extends WbsEvaluationCriteriaDomainException {
    constructor(message: string);
}
export declare class InvalidWbsEvaluationCriteriaDataFormatException extends WbsEvaluationCriteriaDomainException {
    constructor(message: string);
}
export declare class WbsEvaluationCriteriaBusinessRuleViolationException extends WbsEvaluationCriteriaDomainException {
    constructor(message: string);
}
export declare class InvalidWbsItemReferenceException extends WbsEvaluationCriteriaDomainException {
    constructor(wbsItemId: string);
}
