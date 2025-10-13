import { GetEmployeeSelfEvaluationsHandler } from './self-evaluation/get-employee-self-evaluations.handler';
import { GetWbsSelfEvaluationDetailHandler } from './self-evaluation/get-wbs-self-evaluation-detail.handler';

import { GetPeerEvaluationListHandler } from './peer-evaluation/get-peer-evaluation-list.handler';
import { GetPeerEvaluationDetailHandler } from './peer-evaluation/get-peer-evaluation-detail.handler';

import { GetDownwardEvaluationListHandler } from './downward-evaluation/get-downward-evaluation-list.handler';
import { GetDownwardEvaluationDetailHandler } from './downward-evaluation/get-downward-evaluation-detail.handler';

import { GetFinalEvaluationHandler } from './final-evaluation/get-final-evaluation.handler';
import { GetFinalEvaluationListHandler } from './final-evaluation/get-final-evaluation-list.handler';
import { GetFinalEvaluationByEmployeePeriodHandler } from './final-evaluation/get-final-evaluation-by-employee-period.handler';

export const QueryHandlers = [
  // 자기평가 쿼리 핸들러
  GetEmployeeSelfEvaluationsHandler,
  GetWbsSelfEvaluationDetailHandler,

  // 동료평가 쿼리 핸들러
  GetPeerEvaluationListHandler,
  GetPeerEvaluationDetailHandler,

  // 하향평가 쿼리 핸들러
  GetDownwardEvaluationListHandler,
  GetDownwardEvaluationDetailHandler,

  // 최종평가 쿼리 핸들러
  GetFinalEvaluationHandler,
  GetFinalEvaluationListHandler,
  GetFinalEvaluationByEmployeePeriodHandler,
];
