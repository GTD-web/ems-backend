// 평가 기간 조회 쿼리 핸들러
export * from './get-active-evaluation-periods.handler';
export * from './get-evaluation-period-detail.handler';
export * from './get-evaluation-period-list.handler';

import { GetActiveEvaluationPeriodsQueryHandler } from './get-active-evaluation-periods.handler';
import { GetEvaluationPeriodDetailQueryHandler } from './get-evaluation-period-detail.handler';
import { GetEvaluationPeriodListQueryHandler } from './get-evaluation-period-list.handler';

export const EVALUATION_PERIOD_QUERY_HANDLERS = [
  GetActiveEvaluationPeriodsQueryHandler,
  GetEvaluationPeriodDetailQueryHandler,
  GetEvaluationPeriodListQueryHandler,
];

