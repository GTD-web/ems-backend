// Queries
export {
  GetEmployeeEvaluationPeriodStatusQuery,
  GetEmployeeEvaluationPeriodStatusHandler,
} from './get-employee-evaluation-period-status';

export {
  GetAllEmployeesEvaluationPeriodStatusQuery,
  GetAllEmployeesEvaluationPeriodStatusHandler,
} from './get-all-employees-evaluation-period-status.query';

export {
  GetMyEvaluationTargetsStatusQuery,
  GetMyEvaluationTargetsStatusHandler,
} from './get-my-evaluation-targets-status.query';

export {
  GetEmployeeAssignedDataQuery,
  GetEmployeeAssignedDataHandler,
  type EmployeeAssignedDataResult,
  type EvaluationPeriodInfo,
  type EmployeeInfo,
} from './get-employee-assigned-data.query';

export {
  GetEvaluatorAssignedEmployeesDataQuery,
  GetEvaluatorAssignedEmployeesDataHandler,
  type EvaluatorAssignedEmployeesDataResult,
} from './get-evaluator-assigned-employees-data.query';

export {
  GetFinalEvaluationsByPeriodQuery,
  GetFinalEvaluationsByPeriodHandler,
  type FinalEvaluationByPeriodResult,
} from './get-final-evaluations-by-period.query';

export {
  GetFinalEvaluationsByEmployeeQuery,
  GetFinalEvaluationsByEmployeeHandler,
  type FinalEvaluationByEmployeeResult,
} from './get-final-evaluations-by-employee.query';

export {
  GetAllEmployeesFinalEvaluationsQuery,
  GetAllEmployeesFinalEvaluationsHandler,
  type AllEmployeesFinalEvaluationResult,
} from './get-all-employees-final-evaluations.query';

// Handler 배열 export (Module에서 사용)
import { GetEmployeeEvaluationPeriodStatusHandler } from './get-employee-evaluation-period-status';
import { GetAllEmployeesEvaluationPeriodStatusHandler } from './get-all-employees-evaluation-period-status.query';
import { GetMyEvaluationTargetsStatusHandler } from './get-my-evaluation-targets-status.query';
import { GetEmployeeAssignedDataHandler } from './get-employee-assigned-data.query';
import { GetEvaluatorAssignedEmployeesDataHandler } from './get-evaluator-assigned-employees-data.query';
import { GetFinalEvaluationsByPeriodHandler } from './get-final-evaluations-by-period.query';
import { GetFinalEvaluationsByEmployeeHandler } from './get-final-evaluations-by-employee.query';
import { GetAllEmployeesFinalEvaluationsHandler } from './get-all-employees-final-evaluations.query';

export const QUERY_HANDLERS = [
  GetEmployeeEvaluationPeriodStatusHandler,
  GetAllEmployeesEvaluationPeriodStatusHandler,
  GetMyEvaluationTargetsStatusHandler,
  GetEmployeeAssignedDataHandler,
  GetEvaluatorAssignedEmployeesDataHandler,
  GetFinalEvaluationsByPeriodHandler,
  GetFinalEvaluationsByEmployeeHandler,
  GetAllEmployeesFinalEvaluationsHandler,
];
