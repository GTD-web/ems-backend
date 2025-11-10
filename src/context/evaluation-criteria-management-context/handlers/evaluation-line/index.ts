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

export {
  AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesCommand,
  AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler,
  type AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesResult,
} from './commands/auto-configure-primary-evaluator-by-manager-for-all-employees.handler';

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

export {
  GetEvaluatorsByPeriodQuery,
  GetEvaluatorsByPeriodHandler,
  type EvaluatorsByPeriodResult,
  // Deprecated exports for backward compatibility
  GetPrimaryEvaluatorsByPeriodQuery,
  GetPrimaryEvaluatorsByPeriodHandler,
  type PrimaryEvaluatorsByPeriodResult,
} from './queries/get-evaluators-by-period.handler';

// Handler 배열 export (Module에서 사용)
import { ConfigureEmployeeWbsEvaluationLineHandler } from './commands/configure-employee-wbs-evaluation-line.handler';
import { ConfigurePrimaryEvaluatorHandler } from './commands/configure-primary-evaluator.handler';
import { ConfigureSecondaryEvaluatorHandler } from './commands/configure-secondary-evaluator.handler';
import { AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler } from './commands/auto-configure-primary-evaluator-by-manager-for-all-employees.handler';
import { GetEmployeeEvaluationLineMappingsHandler } from './queries/get-employee-evaluation-line-mappings.handler';
import { GetEmployeeEvaluationSettingsHandler } from './queries/get-employee-evaluation-settings.handler';
import { GetEvaluationLineListHandler } from './queries/get-evaluation-line-list.handler';
import { GetEvaluatorEmployeesHandler } from './queries/get-evaluator-employees.handler';
import { GetUpdaterEvaluationLineMappingsHandler } from './queries/get-updater-evaluation-line-mappings.handler';
import { GetEvaluatorsByPeriodHandler } from './queries/get-evaluators-by-period.handler';

export const EVALUATION_LINE_COMMAND_HANDLERS = [
  ConfigureEmployeeWbsEvaluationLineHandler,
  ConfigurePrimaryEvaluatorHandler,
  ConfigureSecondaryEvaluatorHandler,
  AutoConfigurePrimaryEvaluatorByManagerForAllEmployeesHandler,
];

export const EVALUATION_LINE_QUERY_HANDLERS = [
  GetEmployeeEvaluationLineMappingsHandler,
  GetEmployeeEvaluationSettingsHandler,
  GetEvaluationLineListHandler,
  GetEvaluatorEmployeesHandler,
  GetUpdaterEvaluationLineMappingsHandler,
  GetEvaluatorsByPeriodHandler,
];

export const EVALUATION_LINE_HANDLERS = [
  ...EVALUATION_LINE_COMMAND_HANDLERS,
  ...EVALUATION_LINE_QUERY_HANDLERS,
];
