export declare class EvaluationPeriodDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class InvalidEvaluationPeriodStatusTransitionException extends EvaluationPeriodDomainException {
    constructor(currentStatus: string, targetStatus: string, message?: string, periodId?: string);
}
export declare class InvalidEvaluationPeriodPhaseTransitionException extends EvaluationPeriodDomainException {
    constructor(currentPhase: string, targetPhase: string, periodId?: string);
}
export declare class EvaluationPeriodBusinessRuleViolationException extends EvaluationPeriodDomainException {
    constructor(rule: string, context?: Record<string, any>);
}
export declare class EvaluationPeriodRequiredDataMissingException extends EvaluationPeriodDomainException {
    constructor(fieldName: string, context?: Record<string, any>);
}
export declare class InvalidEvaluationPeriodDataFormatException extends EvaluationPeriodDomainException {
    constructor(fieldName: string, expectedFormat: string, actualValue?: any);
}
export declare class InvalidEvaluationPeriodDateRangeException extends EvaluationPeriodDomainException {
    constructor(message: string, startDate?: Date, endDate?: Date, periodId?: string);
}
export declare class InvalidEvaluationPeriodDetailScheduleException extends EvaluationPeriodDomainException {
    constructor(scheduleType: string, startDate: Date, endDate: Date, periodId?: string);
}
export declare class EvaluationPeriodExpiredException extends EvaluationPeriodDomainException {
    constructor(periodId: string, endDate: Date);
}
export declare class EvaluationPeriodNotStartedException extends EvaluationPeriodDomainException {
    constructor(periodId: string, startDate: Date);
}
export declare class MultipleActiveEvaluationPeriodsException extends EvaluationPeriodDomainException {
    constructor(activePeriodIds: string[]);
}
export declare class EvaluationPeriodRepositoryException extends Error {
    readonly statusCode: number;
    readonly originalError?: Error | undefined;
    readonly operation?: string | undefined;
    constructor(message: string, statusCode?: number, originalError?: Error | undefined, operation?: string | undefined);
}
export declare class DuplicateEvaluationPeriodException extends EvaluationPeriodRepositoryException {
    constructor(identifier: string, originalError?: Error);
}
export declare class EvaluationPeriodNameDuplicateException extends EvaluationPeriodRepositoryException {
    constructor(name: string, originalError?: Error);
}
export declare class EvaluationPeriodOverlapException extends EvaluationPeriodRepositoryException {
    constructor(startDate: Date, endDate: Date, conflictingPeriodId: string, originalError?: Error);
}
export declare class EvaluationPeriodNotFoundException extends EvaluationPeriodRepositoryException {
    constructor(identifier: string, originalError?: Error);
}
export declare class NoActiveEvaluationPeriodException extends EvaluationPeriodRepositoryException {
    constructor(originalError?: Error);
}
export declare class EvaluationPeriodServiceException extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly originalError?: Error | undefined;
    constructor(message: string, code: string, statusCode?: number, originalError?: Error | undefined);
}
export declare class InsufficientEvaluationPeriodPermissionException extends EvaluationPeriodServiceException {
    constructor(action: string, userId: string, periodId: string);
}
export declare class EvaluationPeriodDeletionNotAllowedException extends EvaluationPeriodServiceException {
    constructor(periodId: string, reason: string);
}
export declare class EvaluationPeriodModificationNotAllowedException extends EvaluationPeriodServiceException {
    constructor(periodId: string, reason: string);
}
export declare class EvaluationPeriodExternalServiceException extends EvaluationPeriodServiceException {
    constructor(serviceName: string, operation: string, originalError?: Error);
}
export declare class InvalidSelfEvaluationRateException extends EvaluationPeriodDomainException {
    constructor(rate: number, minRate?: number, maxRate?: number);
}
export declare class SelfEvaluationRateSettingNotAllowedException extends EvaluationPeriodDomainException {
    constructor(periodId: string, currentStatus: string, reason: string);
}
export declare class DuplicateEvaluationPeriodNameException extends EvaluationPeriodRepositoryException {
    constructor(name: string, originalError?: Error);
}
export declare class EvaluationPeriodDateOverlapException extends EvaluationPeriodRepositoryException {
    constructor(startDate: Date, endDate: Date, originalError?: Error);
}
export declare class ActiveEvaluationPeriodAlreadyExistsException extends EvaluationPeriodServiceException {
    constructor(activePeriodName: string);
}
