// Queries
export {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetEmployeeEvaluationPeriodStatusHandler,
} from './get-employee-evaluation-period-status.query';

export {
  GetAllEmployeesEvaluationPeriodStatusQuery,
  GetAllEmployeesEvaluationPeriodStatusHandler,
} from './get-all-employees-evaluation-period-status.query';

export {
  GetMyEvaluationTargetsStatusQuery,
  GetMyEvaluationTargetsStatusHandler,
} from './get-my-evaluation-targets-status.query';

// Handler 배열 export (Module에서 사용)
import { GetEmployeeEvaluationPeriodStatusHandler } from './get-employee-evaluation-period-status.query';
import { GetAllEmployeesEvaluationPeriodStatusHandler } from './get-all-employees-evaluation-period-status.query';
import { GetMyEvaluationTargetsStatusHandler } from './get-my-evaluation-targets-status.query';

export const QUERY_HANDLERS = [
  GetEmployeeEvaluationPeriodStatusHandler,
  GetAllEmployeesEvaluationPeriodStatusHandler,
  GetMyEvaluationTargetsStatusHandler,
];
