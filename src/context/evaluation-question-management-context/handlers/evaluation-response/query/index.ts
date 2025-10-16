export * from './get-evaluation-responses.handler';
export * from './get-evaluation-response-stats.handler';

import { GetEvaluationResponsesHandler } from './get-evaluation-responses.handler';
import { GetEvaluationResponseStatsHandler } from './get-evaluation-response-stats.handler';

export const EVALUATION_RESPONSE_QUERY_HANDLERS = [
  GetEvaluationResponsesHandler,
  GetEvaluationResponseStatsHandler,
];

