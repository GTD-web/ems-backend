export declare class FinalEvaluationDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class FinalEvaluationNotFoundException extends FinalEvaluationDomainException {
    constructor(identifier: string);
}
export declare class DuplicateFinalEvaluationException extends FinalEvaluationDomainException {
    constructor(employeeId: string, periodId: string);
}
export declare class ConfirmedEvaluationModificationException extends FinalEvaluationDomainException {
    constructor(evaluationId: string);
}
export declare class NotConfirmedEvaluationException extends FinalEvaluationDomainException {
    constructor(evaluationId: string, action: string);
}
export declare class AlreadyConfirmedEvaluationException extends FinalEvaluationDomainException {
    constructor(evaluationId: string);
}
export declare class InvalidEvaluationGradeException extends FinalEvaluationDomainException {
    constructor(grade: string, allowedGrades?: string[]);
}
export declare class InvalidJobGradeException extends FinalEvaluationDomainException {
    constructor(grade: string, allowedGrades: string[]);
}
export declare class InvalidJobDetailedGradeException extends FinalEvaluationDomainException {
    constructor(grade: string, allowedGrades: string[]);
}
export declare class FinalEvaluationBusinessRuleViolationException extends FinalEvaluationDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class FinalEvaluationRequiredDataMissingException extends FinalEvaluationDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class InvalidFinalEvaluationDataFormatException extends FinalEvaluationDomainException {
    constructor(message: string, context?: Record<string, any>);
}
