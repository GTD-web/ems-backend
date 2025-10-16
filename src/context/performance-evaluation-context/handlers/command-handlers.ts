// 자기평가
import { CreateWbsSelfEvaluationHandler } from './self-evaluation/commands/create-wbs-self-evaluation.handler';
import { UpdateWbsSelfEvaluationHandler } from './self-evaluation/commands/update-wbs-self-evaluation.handler';
import { UpsertWbsSelfEvaluationHandler } from './self-evaluation/commands/upsert-wbs-self-evaluation.handler';
import { SubmitWbsSelfEvaluationHandler } from './self-evaluation/commands/submit-wbs-self-evaluation.handler';
import { SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler } from './self-evaluation/commands/submit-all-wbs-self-evaluations.handler';
import { ResetWbsSelfEvaluationHandler } from './self-evaluation/commands/reset-wbs-self-evaluation.handler';
import { ResetAllWbsSelfEvaluationsByEmployeePeriodHandler } from './self-evaluation/commands/reset-all-wbs-self-evaluations.handler';
import { SubmitWbsSelfEvaluationsByProjectHandler } from './self-evaluation/commands/submit-wbs-self-evaluations-by-project.handler';
import { ResetWbsSelfEvaluationsByProjectHandler } from './self-evaluation/commands/reset-wbs-self-evaluations-by-project.handler';
import { ClearWbsSelfEvaluationHandler } from './self-evaluation/commands/clear-wbs-self-evaluation.handler';
import { ClearAllWbsSelfEvaluationsByEmployeePeriodHandler } from './self-evaluation/commands/clear-all-wbs-self-evaluations.handler';
import { ClearWbsSelfEvaluationsByProjectHandler } from './self-evaluation/commands/clear-wbs-self-evaluations-by-project.handler';

// 동료평가
import {
  CreatePeerEvaluationHandler,
  UpdatePeerEvaluationHandler,
  UpsertPeerEvaluationHandler,
  SubmitPeerEvaluationHandler,
  CancelPeerEvaluationHandler,
  CancelPeerEvaluationsByPeriodHandler,
  AddQuestionGroupToPeerEvaluationHandler,
  AddQuestionToPeerEvaluationHandler,
  RemoveQuestionFromPeerEvaluationHandler,
  UpdatePeerEvaluationQuestionOrderHandler,
} from './peer-evaluation';

// 하향평가
import {
  CreateDownwardEvaluationHandler,
  UpdateDownwardEvaluationHandler,
  UpsertDownwardEvaluationHandler,
  SubmitDownwardEvaluationHandler,
} from './downward-evaluation';

// 최종평가
import {
  CreateFinalEvaluationHandler,
  UpdateFinalEvaluationHandler,
  UpsertFinalEvaluationHandler,
  DeleteFinalEvaluationHandler,
  ConfirmFinalEvaluationHandler,
  CancelConfirmationFinalEvaluationHandler,
} from './final-evaluation';

// 평가 수정 가능 상태
import {
  UpdateEvaluationEditableStatusHandler,
  UpdatePeriodAllEvaluationEditableStatusHandler,
} from './evaluation-editable-status';

export const CommandHandlers = [
  // 자기평가 커맨드 핸들러
  CreateWbsSelfEvaluationHandler,
  UpdateWbsSelfEvaluationHandler,
  UpsertWbsSelfEvaluationHandler,
  SubmitWbsSelfEvaluationHandler,
  SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler,
  ResetWbsSelfEvaluationHandler,
  ResetAllWbsSelfEvaluationsByEmployeePeriodHandler,
  SubmitWbsSelfEvaluationsByProjectHandler,
  ResetWbsSelfEvaluationsByProjectHandler,
  ClearWbsSelfEvaluationHandler,
  ClearAllWbsSelfEvaluationsByEmployeePeriodHandler,
  ClearWbsSelfEvaluationsByProjectHandler,

  // 동료평가 커맨드 핸들러
  CreatePeerEvaluationHandler,
  UpdatePeerEvaluationHandler,
  UpsertPeerEvaluationHandler,
  SubmitPeerEvaluationHandler,
  CancelPeerEvaluationHandler,
  CancelPeerEvaluationsByPeriodHandler,
  AddQuestionGroupToPeerEvaluationHandler,
  AddQuestionToPeerEvaluationHandler,
  RemoveQuestionFromPeerEvaluationHandler,
  UpdatePeerEvaluationQuestionOrderHandler,

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

  // 평가 수정 가능 상태 커맨드 핸들러
  UpdateEvaluationEditableStatusHandler,
  UpdatePeriodAllEvaluationEditableStatusHandler,
];
