// 쿼리 클래스들 export
export * from './evaluation-period.queries';

// 쿼리 핸들러들 export
export * from './evaluation-period.query-handlers';

import {
  GetActiveEvaluationPeriodsQueryHandler,
  GetEvaluationPeriodDetailQueryHandler,
  GetEvaluationPeriodListQueryHandler,
} from './evaluation-period.query-handlers';

// 실제 핸들러 클래스들의 배열
export const QUERY_HANDLERS = [
  GetActiveEvaluationPeriodsQueryHandler,
  GetEvaluationPeriodDetailQueryHandler,
  GetEvaluationPeriodListQueryHandler,
];
