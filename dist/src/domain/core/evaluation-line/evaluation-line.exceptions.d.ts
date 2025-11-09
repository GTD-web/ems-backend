export declare class EvaluationLineDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class DuplicateEvaluatorAssignmentException extends EvaluationLineDomainException {
    constructor(employeeId: string, evaluatorId: string, evaluatorType: string);
}
export declare class SelfEvaluatorAssignmentException extends EvaluationLineDomainException {
    constructor(employeeId: string);
}
export declare class RequiredEvaluatorMissingException extends EvaluationLineDomainException {
    constructor(employeeId: string, missingEvaluatorTypes: string[]);
}
export declare class EvaluationLineNotFoundException extends EvaluationLineDomainException {
    constructor(identifier: string);
}
export declare class InvalidEvaluatorTypeException extends EvaluationLineDomainException {
    constructor(evaluatorType: string, allowedTypes: string[]);
}
export declare class EvaluationLineModificationNotAllowedException extends EvaluationLineDomainException {
    constructor(lineId: string, reason: string);
}
export declare class EvaluationLineBusinessRuleViolationException extends EvaluationLineDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class EvaluationLineDuplicateException extends EvaluationLineDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class EvaluationLineRequiredDataMissingException extends EvaluationLineDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class InvalidEvaluationLineDataFormatException extends EvaluationLineDomainException {
    constructor(message: string, context?: Record<string, any>);
}
