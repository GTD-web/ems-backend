import { GetEmployeeSelfEvaluationsHandler } from './self-evaluation/get-employee-self-evaluations.handler';
import { GetWbsSelfEvaluationDetailHandler } from './self-evaluation/get-wbs-self-evaluation-detail.handler';

import { GetPeerEvaluationListHandler } from './peer-evaluation/get-peer-evaluation-list.handler';
import { GetPeerEvaluationDetailHandler } from './peer-evaluation/get-peer-evaluation-detail.handler';

import { GetDownwardEvaluationListHandler } from './downward-evaluation/get-downward-evaluation-list.handler';
import { GetDownwardEvaluationDetailHandler } from './downward-evaluation/get-downward-evaluation-detail.handler';

export const QueryHandlers = [
  // ?�기?��? 쿼리 ?�들??
  GetEmployeeSelfEvaluationsHandler,
  GetWbsSelfEvaluationDetailHandler,

  // ?�료?��? 쿼리 ?�들??
  GetPeerEvaluationListHandler,
  GetPeerEvaluationDetailHandler,

  // ?�향?��? 쿼리 ?�들??
  GetDownwardEvaluationListHandler,
  GetDownwardEvaluationDetailHandler,
];

