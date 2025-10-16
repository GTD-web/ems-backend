export * from './add-question-to-group.handler';
export * from './remove-question-from-group.handler';
export * from './update-question-display-order.handler';

import { AddQuestionToGroupHandler } from './add-question-to-group.handler';
import { RemoveQuestionFromGroupHandler } from './remove-question-from-group.handler';
import { UpdateQuestionDisplayOrderHandler } from './update-question-display-order.handler';

export const QUESTION_GROUP_MAPPING_COMMAND_HANDLERS = [
  AddQuestionToGroupHandler,
  RemoveQuestionFromGroupHandler,
  UpdateQuestionDisplayOrderHandler,
];

