export declare class EvaluationWbsAssignmentDomainException extends Error {
    readonly code: string;
    constructor(message: string, code?: string);
}
export declare class EvaluationWbsAssignmentNotFoundException extends EvaluationWbsAssignmentDomainException {
    constructor(assignmentId: string);
}
export declare class DuplicateEvaluationWbsAssignmentException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId: string, employeeId: string, projectId: string, wbsItemId: string);
}
export declare class EvaluationWbsAssignmentPermissionDeniedException extends EvaluationWbsAssignmentDomainException {
    constructor(action: string, userId: string);
}
export declare class EvaluationWbsAssignmentStatusChangeException extends EvaluationWbsAssignmentDomainException {
    constructor(currentStatus: string, targetStatus: string);
}
export declare class InvalidWorkHoursException extends EvaluationWbsAssignmentDomainException {
    constructor(hours: number);
}
export declare class WbsItemProjectMismatchException extends EvaluationWbsAssignmentDomainException {
    constructor(wbsItemId: string, expectedProjectId: string, actualProjectId: string);
}
export declare class EvaluationPeriodExpiredException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId: string);
}
export declare class EvaluationWbsAssignmentBusinessRuleViolationException extends EvaluationWbsAssignmentDomainException {
    constructor(message: string);
}
export declare class EvaluationWbsAssignmentDuplicateException extends DuplicateEvaluationWbsAssignmentException {
    constructor(periodId: string, employeeId: string, projectId: string, wbsItemId: string);
}
export declare class EvaluationWbsAssignmentRequiredDataMissingException extends EvaluationWbsAssignmentDomainException {
    constructor(message: string);
}
export declare class InvalidEvaluationWbsAssignmentDataFormatException extends EvaluationWbsAssignmentDomainException {
    constructor(fieldName: string, expectedFormat: string, actualValue: any);
}
export declare class ProjectAssignmentPrerequisiteException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId: string, employeeId: string, projectId: string);
}
export declare class CompletedEvaluationPeriodAssignmentException extends EvaluationWbsAssignmentDomainException {
    constructor(periodId: string, action: string);
}
