export * from './get-question-group.handler';
export * from './get-question-groups.handler';
export * from './get-default-question-group.handler';
import { GetQuestionGroupHandler } from './get-question-group.handler';
import { GetQuestionGroupsHandler } from './get-question-groups.handler';
import { GetDefaultQuestionGroupHandler } from './get-default-question-group.handler';
export declare const QUESTION_GROUP_QUERY_HANDLERS: (typeof GetQuestionGroupHandler | typeof GetQuestionGroupsHandler | typeof GetDefaultQuestionGroupHandler)[];
