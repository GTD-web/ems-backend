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

import { CreateFinalEvaluationHandler } from './final-evaluation/create-final-evaluation.handler';
import { UpdateFinalEvaluationHandler } from './final-evaluation/update-final-evaluation.handler';
import { UpsertFinalEvaluationHandler } from './final-evaluation/upsert-final-evaluation.handler';
import { DeleteFinalEvaluationHandler } from './final-evaluation/delete-final-evaluation.handler';
import { ConfirmFinalEvaluationHandler } from './final-evaluation/confirm-final-evaluation.handler';
import { CancelConfirmationFinalEvaluationHandler } from './final-evaluation/cancel-confirmation-final-evaluation.handler';

export const CommandHandlers = [
  // 자기평가 커맨드 핸들러
  CreateWbsSelfEvaluationHandler,
  UpdateWbsSelfEvaluationHandler,
  UpsertWbsSelfEvaluationHandler,
  SubmitWbsSelfEvaluationHandler,

  // 동료평가 커맨드 핸들러
  CreatePeerEvaluationHandler,
  UpdatePeerEvaluationHandler,
  UpsertPeerEvaluationHandler,
  SubmitPeerEvaluationHandler,
  CancelPeerEvaluationHandler,
  CancelPeerEvaluationsByPeriodHandler,

  // 하향평가 커맨드 핸들러
  CreateDownwardEvaluationHandler,
  UpdateDownwardEvaluationHandler,
  UpsertDownwardEvaluationHandler,
  SubmitDownwardEvaluationHandler,

  // 최종평가 커맨드 핸들러
  CreateFinalEvaluationHandler,
  UpdateFinalEvaluationHandler,
  UpsertFinalEvaluationHandler,
  DeleteFinalEvaluationHandler,
  ConfirmFinalEvaluationHandler,
  CancelConfirmationFinalEvaluationHandler,
];
