export declare class QuestionGroupDomainException extends Error {
    readonly code?: string | undefined;
    readonly statusCode: number;
    readonly context?: Record<string, any> | undefined;
    constructor(message: string, code?: string | undefined, statusCode?: number, context?: Record<string, any> | undefined);
}
export declare class QuestionGroupNotFoundException extends QuestionGroupDomainException {
    constructor(identifier: string);
}
export declare class DuplicateQuestionGroupException extends QuestionGroupDomainException {
    constructor(name: string);
}
export declare class DefaultGroupDeletionException extends QuestionGroupDomainException {
    constructor(groupId: string);
}
export declare class UndeletableGroupException extends QuestionGroupDomainException {
    constructor(groupId: string);
}
export declare class GroupWithQuestionsException extends QuestionGroupDomainException {
    constructor(groupId: string, questionCount: number);
}
export declare class EmptyGroupNameException extends QuestionGroupDomainException {
    constructor();
}
