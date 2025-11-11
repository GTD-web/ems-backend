import { HttpException } from '@nestjs/common';
export declare class DownwardEvaluationDomainException extends HttpException {
    readonly code?: string | undefined;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class InvalidDownwardEvaluationScoreException extends DownwardEvaluationDomainException {
    constructor(score: number, minScore: number, maxScore: number, evaluationId?: string);
}
export declare class DuplicateDownwardEvaluationException extends DownwardEvaluationDomainException {
    constructor(employeeId: string, evaluatorId: string, periodId: string, evaluationType: string);
}
export declare class DownwardEvaluationNotFoundException extends DownwardEvaluationDomainException {
    constructor(identifier: string);
}
export declare class DownwardEvaluationPermissionDeniedException extends DownwardEvaluationDomainException {
    constructor(evaluatorId: string, employeeId: string);
}
export declare class DownwardEvaluationValidationException extends DownwardEvaluationDomainException {
    constructor(message: string);
}
export declare class DownwardEvaluationDuplicateException extends DownwardEvaluationDomainException {
    constructor(employeeId: string, evaluatorId: string, periodId: string);
}
export declare class DownwardEvaluationEvaluatorMismatchException extends DownwardEvaluationDomainException {
    constructor(evaluationId: string, expectedEvaluatorId: string, actualEvaluatorId: string);
}
export declare class DownwardEvaluationPeriodExpiredException extends DownwardEvaluationDomainException {
    constructor(evaluationId: string, periodId: string);
}
export declare class DownwardEvaluationAlreadyCompletedException extends DownwardEvaluationDomainException {
    constructor(evaluationId: string);
}
export declare class DownwardEvaluationNotCompletedException extends DownwardEvaluationDomainException {
    constructor(evaluationId: string);
}
