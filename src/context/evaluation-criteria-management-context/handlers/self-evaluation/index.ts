// Commands
export * from './commands/reset-all-self-evaluations.handler';

// Handler 배열 export (Module에서 사용)
import { ResetAllSelfEvaluationsHandler } from './commands/reset-all-self-evaluations.handler';

export const SELF_EVALUATION_COMMAND_HANDLERS = [
  ResetAllSelfEvaluationsHandler,
];

export const SELF_EVALUATION_QUERY_HANDLERS = [];

export const SELF_EVALUATION_HANDLERS = [
  ...SELF_EVALUATION_COMMAND_HANDLERS,
  ...SELF_EVALUATION_QUERY_HANDLERS,
];

