// 평가 대상자 관리 쿼리 핸들러
export * from './get-evaluation-targets.handler';
export * from './get-excluded-evaluation-targets.handler';
export * from './get-employee-evaluation-periods.handler';
export * from './check-evaluation-target.handler';
export * from './get-evaluation-targets-by-filter.handler';

import { GetEvaluationTargetsHandler } from './get-evaluation-targets.handler';
import { GetExcludedEvaluationTargetsHandler } from './get-excluded-evaluation-targets.handler';
import { GetEmployeeEvaluationPeriodsHandler } from './get-employee-evaluation-periods.handler';
import { CheckEvaluationTargetHandler } from './check-evaluation-target.handler';
import { GetEvaluationTargetsByFilterHandler } from './get-evaluation-targets-by-filter.handler';

export const EVALUATION_TARGET_QUERY_HANDLERS = [
  GetEvaluationTargetsHandler,
  GetExcludedEvaluationTargetsHandler,
  GetEmployeeEvaluationPeriodsHandler,
  CheckEvaluationTargetHandler,
  GetEvaluationTargetsByFilterHandler,
];

