import { CreateWbsSelfEvaluationHandler } from './self-evaluation/create-wbs-self-evaluation.handler';
import { UpdateWbsSelfEvaluationHandler } from './self-evaluation/update-wbs-self-evaluation.handler';
import { UpsertWbsSelfEvaluationHandler } from './self-evaluation/upsert-wbs-self-evaluation.handler';
import { SubmitWbsSelfEvaluationHandler } from './self-evaluation/submit-wbs-self-evaluation.handler';

import { CreatePeerEvaluationHandler } from './peer-evaluation/create-peer-evaluation.handler';
import { UpdatePeerEvaluationHandler } from './peer-evaluation/update-peer-evaluation.handler';
import { UpsertPeerEvaluationHandler } from './peer-evaluation/upsert-peer-evaluation.handler';
import { SubmitPeerEvaluationHandler } from './peer-evaluation/submit-peer-evaluation.handler';
import { CancelPeerEvaluationHandler } from './peer-evaluation/cancel-peer-evaluation.handler';
import { CancelPeerEvaluationsByPeriodHandler } from './peer-evaluation/cancel-peer-evaluations-by-period.handler';

import { CreateDownwardEvaluationHandler } from './downward-evaluation/create-downward-evaluation.handler';
import { UpdateDownwardEvaluationHandler } from './downward-evaluation/update-downward-evaluation.handler';
import { UpsertDownwardEvaluationHandler } from './downward-evaluation/upsert-downward-evaluation.handler';
import { SubmitDownwardEvaluationHandler } from './downward-evaluation/submit-downward-evaluation.handler';

export const CommandHandlers = [
  // ?�기?��? 커맨???�들??
  CreateWbsSelfEvaluationHandler,
  UpdateWbsSelfEvaluationHandler,
  UpsertWbsSelfEvaluationHandler,
  SubmitWbsSelfEvaluationHandler,

  // ?�료?��? 커맨???�들??
  CreatePeerEvaluationHandler,
  UpdatePeerEvaluationHandler,
  UpsertPeerEvaluationHandler,
  SubmitPeerEvaluationHandler,
  CancelPeerEvaluationHandler,
  CancelPeerEvaluationsByPeriodHandler,

  // ?�향?��? 커맨???�들??
  CreateDownwardEvaluationHandler,
  UpdateDownwardEvaluationHandler,
  UpsertDownwardEvaluationHandler,
  SubmitDownwardEvaluationHandler,
];
