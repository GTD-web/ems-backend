export * from './create-evaluation-question.handler';
export * from './update-evaluation-question.handler';
export * from './delete-evaluation-question.handler';
export * from './copy-evaluation-question.handler';

import { CreateEvaluationQuestionHandler } from './create-evaluation-question.handler';
import { UpdateEvaluationQuestionHandler } from './update-evaluation-question.handler';
import { DeleteEvaluationQuestionHandler } from './delete-evaluation-question.handler';
import { CopyEvaluationQuestionHandler } from './copy-evaluation-question.handler';

export const EVALUATION_QUESTION_COMMAND_HANDLERS = [
  CreateEvaluationQuestionHandler,
  UpdateEvaluationQuestionHandler,
  DeleteEvaluationQuestionHandler,
  CopyEvaluationQuestionHandler,
];

