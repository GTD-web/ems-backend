export * from './add-question-to-group.handler';
export * from './remove-question-from-group.handler';
export * from './update-question-display-order.handler';
export * from './move-question-up.handler';
export * from './move-question-down.handler';
export * from './add-multiple-questions-to-group.handler';
export * from './reorder-group-questions.handler';

import { AddQuestionToGroupHandler } from './add-question-to-group.handler';
import { RemoveQuestionFromGroupHandler } from './remove-question-from-group.handler';
import { UpdateQuestionDisplayOrderHandler } from './update-question-display-order.handler';
import { MoveQuestionUpHandler } from './move-question-up.handler';
import { MoveQuestionDownHandler } from './move-question-down.handler';
import { AddMultipleQuestionsToGroupHandler } from './add-multiple-questions-to-group.handler';
import { ReorderGroupQuestionsHandler } from './reorder-group-questions.handler';

export const QUESTION_GROUP_MAPPING_COMMAND_HANDLERS = [
  AddQuestionToGroupHandler,
  RemoveQuestionFromGroupHandler,
  UpdateQuestionDisplayOrderHandler,
  MoveQuestionUpHandler,
  MoveQuestionDownHandler,
  AddMultipleQuestionsToGroupHandler,
  ReorderGroupQuestionsHandler,
];
