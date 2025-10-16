// 자기평가
import { GetEmployeeSelfEvaluationsHandler } from './self-evaluation/queries/get-employee-self-evaluations.handler';
import { GetWbsSelfEvaluationDetailHandler } from './self-evaluation/queries/get-wbs-self-evaluation-detail.handler';

// 동료평가
import {
  GetPeerEvaluationListHandler,
  GetPeerEvaluationDetailHandler,
  GetEvaluatorAssignedEvaluateesHandler,
} from './peer-evaluation';

// 하향평가
import {
  GetDownwardEvaluationListHandler,
  GetDownwardEvaluationDetailHandler,
} from './downward-evaluation';

// 최종평가
import {
  GetFinalEvaluationHandler,
  GetFinalEvaluationListHandler,
  GetFinalEvaluationByEmployeePeriodHandler,
} from './final-evaluation';

export const QueryHandlers = [
  // 자기평가 쿼리 핸들러
  GetEmployeeSelfEvaluationsHandler,
  GetWbsSelfEvaluationDetailHandler,

  // 동료평가 쿼리 핸들러
  GetPeerEvaluationListHandler,
  GetPeerEvaluationDetailHandler,
  GetEvaluatorAssignedEvaluateesHandler,

  // 하향평가 쿼리 핸들러
  GetDownwardEvaluationListHandler,
  GetDownwardEvaluationDetailHandler,

  // 최종평가 쿼리 핸들러
  GetFinalEvaluationHandler,
  GetFinalEvaluationListHandler,
  GetFinalEvaluationByEmployeePeriodHandler,
];
