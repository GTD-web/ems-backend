export declare class EvaluationPeriodEmployeeMappingDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class EvaluationPeriodEmployeeMappingNotFoundException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(identifier: string);
}
export declare class EvaluationPeriodEmployeeMappingDuplicateException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId: string, employeeId: string);
}
export declare class EvaluationPeriodEmployeeMappingValidationException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(message: string);
}
export declare class EvaluationTargetExclusionException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId: string, employeeId: string, reason: string);
}
export declare class AlreadyExcludedEvaluationTargetException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId: string, employeeId: string);
}
export declare class NotExcludedEvaluationTargetException extends EvaluationPeriodEmployeeMappingDomainException {
    constructor(evaluationPeriodId: string, employeeId: string);
}
