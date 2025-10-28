export * from './evaluation-period';
export * from './evaluation-target';
export * from './evaluation-target/commands/register-evaluation-target-with-auto-evaluator.handler';

import {
  EVALUATION_PERIOD_COMMAND_HANDLERS,
  EVALUATION_PERIOD_QUERY_HANDLERS,
} from './evaluation-period';
import {
  EVALUATION_TARGET_COMMAND_HANDLERS,
  EVALUATION_TARGET_QUERY_HANDLERS,
} from './evaluation-target';

export const COMMAND_HANDLERS = [
  ...EVALUATION_PERIOD_COMMAND_HANDLERS,
  ...EVALUATION_TARGET_COMMAND_HANDLERS,
];

export const QUERY_HANDLERS = [
  ...EVALUATION_PERIOD_QUERY_HANDLERS,
  ...EVALUATION_TARGET_QUERY_HANDLERS,
];

