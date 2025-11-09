export declare class EvaluationLineMappingDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class DuplicateEvaluationLineMappingException extends EvaluationLineMappingDomainException {
    constructor(employeeId: string, evaluatorId: string, projectId?: string);
}
export declare class EvaluationLineMappingNotFoundException extends EvaluationLineMappingDomainException {
    constructor(identifier: string);
}
export declare class EvaluationLineMappingPermissionDeniedException extends EvaluationLineMappingDomainException {
    constructor(userId: string, action: string);
}
export declare class EvaluationLineMappingSelfEvaluationException extends EvaluationLineMappingDomainException {
    constructor(employeeId: string);
}
export declare class EvaluationLineMappingProjectMismatchException extends EvaluationLineMappingDomainException {
    constructor(mappingId: string, mappingProjectId: string, lineProjectId: string);
}
export declare class EvaluationLineMappingBusinessRuleViolationException extends EvaluationLineMappingDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class EvaluationLineMappingDuplicateException extends EvaluationLineMappingDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class EvaluationLineMappingRequiredDataMissingException extends EvaluationLineMappingDomainException {
    constructor(message: string, context?: Record<string, any>);
}
export declare class InvalidEvaluationLineMappingDataFormatException extends EvaluationLineMappingDomainException {
    constructor(message: string, context?: Record<string, any>);
}
