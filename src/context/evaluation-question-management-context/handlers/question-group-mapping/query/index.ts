export * from './get-group-questions.handler';
export * from './get-question-groups-by-question.handler';

import { GetGroupQuestionsHandler } from './get-group-questions.handler';
import { GetQuestionGroupsByQuestionHandler } from './get-question-groups-by-question.handler';

export const QUESTION_GROUP_MAPPING_QUERY_HANDLERS = [
  GetGroupQuestionsHandler,
  GetQuestionGroupsByQuestionHandler,
];

