export declare class EvaluationProjectAssignmentDomainException extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export declare class EvaluationProjectAssignmentNotFoundException extends EvaluationProjectAssignmentDomainException {
    constructor(assignmentId: string);
}
export declare class DuplicateEvaluationProjectAssignmentException extends EvaluationProjectAssignmentDomainException {
    constructor(periodId: string, employeeId: string, projectId: string);
}
export declare class EvaluationProjectAssignmentPermissionDeniedException extends EvaluationProjectAssignmentDomainException {
    constructor(action: string, userId: string);
}
export declare class EvaluationProjectAssignmentStatusChangeException extends EvaluationProjectAssignmentDomainException {
    constructor(currentStatus: string, targetStatus: string);
}
export declare class EvaluationPeriodExpiredException extends EvaluationProjectAssignmentDomainException {
    constructor(periodId: string);
}
export declare class EvaluationProjectAssignmentBusinessRuleViolationException extends EvaluationProjectAssignmentDomainException {
    constructor(message: string);
}
export declare class EvaluationProjectAssignmentDuplicateException extends DuplicateEvaluationProjectAssignmentException {
    constructor(periodId: string, employeeId: string, projectId: string);
}
export declare class EvaluationProjectAssignmentRequiredDataMissingException extends EvaluationProjectAssignmentDomainException {
    constructor(message: string);
}
export declare class InvalidEvaluationProjectAssignmentDataFormatException extends EvaluationProjectAssignmentDomainException {
    constructor(fieldName: string, expectedFormat: string, actualValue: any);
}
