export * from './create-evaluation-response.handler';
export * from './update-evaluation-response.handler';
export * from './delete-evaluation-response.handler';

import { CreateEvaluationResponseHandler } from './create-evaluation-response.handler';
import { UpdateEvaluationResponseHandler } from './update-evaluation-response.handler';
import { DeleteEvaluationResponseHandler } from './delete-evaluation-response.handler';

export const EVALUATION_RESPONSE_COMMAND_HANDLERS = [
  CreateEvaluationResponseHandler,
  UpdateEvaluationResponseHandler,
  DeleteEvaluationResponseHandler,
];

