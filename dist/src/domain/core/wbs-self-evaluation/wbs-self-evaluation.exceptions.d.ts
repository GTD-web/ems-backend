export declare class WbsSelfEvaluationDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class InvalidWbsSelfEvaluationScoreException extends WbsSelfEvaluationDomainException {
    constructor(score: number, minScore: number, maxScore: number, wbsItemId?: string);
}
export declare class DuplicateWbsSelfEvaluationException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId: string, employeeId: string, periodId: string);
}
export declare class WbsSelfEvaluationNotFoundException extends WbsSelfEvaluationDomainException {
    constructor(identifier: string);
}
export declare class WbsSelfEvaluationPermissionDeniedException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId: string, employeeId: string, requesterId: string);
}
export declare class WbsSelfEvaluationPeriodExpiredException extends WbsSelfEvaluationDomainException {
    constructor(periodId: string, endDate: Date);
}
export declare class WbsSelfEvaluationAlreadySubmittedException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId: string, employeeId: string, submittedAt: Date);
}
export declare class WbsSelfEvaluationCannotSubmitException extends WbsSelfEvaluationDomainException {
    constructor(wbsItemId: string, employeeId: string, reason: string);
}
export declare class WbsSelfEvaluationValidationException extends WbsSelfEvaluationDomainException {
    constructor(message: string);
}
export declare class WbsSelfEvaluationDuplicateException extends WbsSelfEvaluationDomainException {
    constructor(periodId: string, employeeId: string, wbsItemId: string);
}
