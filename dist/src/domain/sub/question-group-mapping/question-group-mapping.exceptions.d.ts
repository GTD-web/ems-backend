export declare class QuestionGroupMappingDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class QuestionGroupMappingNotFoundException extends QuestionGroupMappingDomainException {
    constructor(identifier: string);
}
export declare class DuplicateQuestionGroupMappingException extends QuestionGroupMappingDomainException {
    constructor(groupId: string, questionId: string);
}
export declare class InvalidQuestionGroupMappingReferenceException extends QuestionGroupMappingDomainException {
    constructor(groupId: string, questionId: string);
}
