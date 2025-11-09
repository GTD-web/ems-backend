export declare class PeerEvaluationDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class InvalidPeerEvaluationScoreException extends PeerEvaluationDomainException {
    constructor(score: number, minScore: number, maxScore: number, evaluationId?: string);
}
export declare class DuplicatePeerEvaluationException extends PeerEvaluationDomainException {
    constructor(evaluateeId: string, evaluatorId: string, periodId: string);
}
export declare class PeerEvaluationNotFoundException extends PeerEvaluationDomainException {
    constructor(identifier: string);
}
export declare class SelfPeerEvaluationException extends PeerEvaluationDomainException {
    constructor(evaluateeId: string);
}
export declare class PeerEvaluationValidationException extends PeerEvaluationDomainException {
    constructor(message: string);
}
export declare class PeerEvaluationDuplicateException extends PeerEvaluationDomainException {
    constructor(evaluatorId: string, evaluateeId: string, periodId: string);
}
export declare class PeerEvaluationPermissionDeniedException extends PeerEvaluationDomainException {
    constructor(userId: string, action: string);
}
export declare class PeerEvaluationPeriodExpiredException extends PeerEvaluationDomainException {
    constructor(evaluationId: string, periodId: string);
}
