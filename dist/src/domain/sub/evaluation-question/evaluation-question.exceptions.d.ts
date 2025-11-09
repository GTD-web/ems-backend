export declare class EvaluationQuestionDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class EvaluationQuestionNotFoundException extends EvaluationQuestionDomainException {
    constructor(identifier: string);
}
export declare class DuplicateEvaluationQuestionException extends EvaluationQuestionDomainException {
    constructor(text: string);
}
export declare class InvalidScoreRangeException extends EvaluationQuestionDomainException {
    constructor(minScore: number, maxScore: number);
}
export declare class ScoreRangeRequiredException extends EvaluationQuestionDomainException {
    constructor(questionId?: string);
}
export declare class EmptyQuestionTextException extends EvaluationQuestionDomainException {
    constructor();
}
export declare class QuestionWithResponsesException extends EvaluationQuestionDomainException {
    constructor(questionId: string, responseCount: number);
}
