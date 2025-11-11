export * from './create-question-group.handler';
export * from './update-question-group.handler';
export * from './delete-question-group.handler';
export * from './set-default-question-group.handler';
import { CreateQuestionGroupHandler } from './create-question-group.handler';
import { UpdateQuestionGroupHandler } from './update-question-group.handler';
import { DeleteQuestionGroupHandler } from './delete-question-group.handler';
import { SetDefaultQuestionGroupHandler } from './set-default-question-group.handler';
export declare const QUESTION_GROUP_COMMAND_HANDLERS: (typeof CreateQuestionGroupHandler | typeof UpdateQuestionGroupHandler | typeof DeleteQuestionGroupHandler | typeof SetDefaultQuestionGroupHandler)[];
