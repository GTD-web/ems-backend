export * from './get-evaluation-question.handler';
export * from './get-evaluation-questions.handler';

import { GetEvaluationQuestionHandler } from './get-evaluation-question.handler';
import { GetEvaluationQuestionsHandler } from './get-evaluation-questions.handler';

export const EVALUATION_QUESTION_QUERY_HANDLERS = [
  GetEvaluationQuestionHandler,
  GetEvaluationQuestionsHandler,
];

