export declare class EvaluationResponseDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class EvaluationResponseNotFoundException extends EvaluationResponseDomainException {
    constructor(identifier: string);
}
export declare class DuplicateEvaluationResponseException extends EvaluationResponseDomainException {
    constructor(questionId: string, evaluationId: string);
}
export declare class InvalidQuestionReferenceException extends EvaluationResponseDomainException {
    constructor(questionId: string);
}
export declare class InvalidEvaluationReferenceException extends EvaluationResponseDomainException {
    constructor(evaluationId: string);
}
export declare class InvalidResponseScoreException extends EvaluationResponseDomainException {
    constructor(score: number, minScore: number, maxScore: number);
}
export declare class MissingResponseContentException extends EvaluationResponseDomainException {
    constructor(questionType: string);
}
export declare class MissingResponseScoreException extends EvaluationResponseDomainException {
    constructor(questionType: string);
}
export declare class EvaluationPeriodEndedException extends EvaluationResponseDomainException {
    constructor(evaluationId: string, endDate: Date);
}
export declare class UnauthorizedResponseException extends EvaluationResponseDomainException {
    constructor(evaluationId: string, userId: string);
}
