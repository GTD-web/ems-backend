// Commands
export {
  ConfigureEmployeeWbsEvaluationLineCommand,
  ConfigureEmployeeWbsEvaluationLineHandler,
  type ConfigureEmployeeWbsEvaluationLineResult,
} from './commands/configure-employee-wbs-evaluation-line.handler';

export {
  ConfigurePrimaryEvaluatorCommand,
  ConfigurePrimaryEvaluatorHandler,
  type ConfigurePrimaryEvaluatorResult,
} from './commands/configure-primary-evaluator.handler';

export {
  ConfigureSecondaryEvaluatorCommand,
  ConfigureSecondaryEvaluatorHandler,
  type ConfigureSecondaryEvaluatorResult,
} from './commands/configure-secondary-evaluator.handler';

// Queries
export {
  GetEmployeeEvaluationLineMappingsQuery,
  GetEmployeeEvaluationLineMappingsHandler,
} from './queries/get-employee-evaluation-line-mappings.handler';

export {
  GetEmployeeEvaluationSettingsQuery,
  GetEmployeeEvaluationSettingsHandler,
  type EmployeeEvaluationSettingsResult,
} from './queries/get-employee-evaluation-settings.handler';

export {
  GetEvaluationLineListQuery,
  GetEvaluationLineListHandler,
} from './queries/get-evaluation-line-list.handler';

export {
  GetEvaluatorEmployeesQuery,
  GetEvaluatorEmployeesHandler,
  type EvaluatorEmployeesResult,
} from './queries/get-evaluator-employees.handler';

export {
  GetUpdaterEvaluationLineMappingsQuery,
  GetUpdaterEvaluationLineMappingsHandler,
} from './queries/get-updater-evaluation-line-mappings.handler';

// Handler 배열 export (Module에서 사용)
import { ConfigureEmployeeWbsEvaluationLineHandler } from './commands/configure-employee-wbs-evaluation-line.handler';
import { ConfigurePrimaryEvaluatorHandler } from './commands/configure-primary-evaluator.handler';
import { ConfigureSecondaryEvaluatorHandler } from './commands/configure-secondary-evaluator.handler';
import { GetEmployeeEvaluationLineMappingsHandler } from './queries/get-employee-evaluation-line-mappings.handler';
import { GetEmployeeEvaluationSettingsHandler } from './queries/get-employee-evaluation-settings.handler';
import { GetEvaluationLineListHandler } from './queries/get-evaluation-line-list.handler';
import { GetEvaluatorEmployeesHandler } from './queries/get-evaluator-employees.handler';
import { GetUpdaterEvaluationLineMappingsHandler } from './queries/get-updater-evaluation-line-mappings.handler';

export const EVALUATION_LINE_COMMAND_HANDLERS = [
  ConfigureEmployeeWbsEvaluationLineHandler,
  ConfigurePrimaryEvaluatorHandler,
  ConfigureSecondaryEvaluatorHandler,
];

export const EVALUATION_LINE_QUERY_HANDLERS = [
  GetEmployeeEvaluationLineMappingsHandler,
  GetEmployeeEvaluationSettingsHandler,
  GetEvaluationLineListHandler,
  GetEvaluatorEmployeesHandler,
  GetUpdaterEvaluationLineMappingsHandler,
];

export const EVALUATION_LINE_HANDLERS = [
  ...EVALUATION_LINE_COMMAND_HANDLERS,
  ...EVALUATION_LINE_QUERY_HANDLERS,
];
