// Commands
export {
  CreateWbsEvaluationCriteriaCommand,
  CreateWbsEvaluationCriteriaHandler,
} from './commands/create-wbs-evaluation-criteria.handler';

export {
  UpdateWbsEvaluationCriteriaCommand,
  UpdateWbsEvaluationCriteriaHandler,
} from './commands/update-wbs-evaluation-criteria.handler';

export {
  DeleteWbsEvaluationCriteriaCommand,
  DeleteWbsEvaluationCriteriaHandler,
} from './commands/delete-wbs-evaluation-criteria.handler';

export {
  DeleteWbsItemEvaluationCriteriaCommand,
  DeleteWbsItemEvaluationCriteriaHandler,
} from './commands/delete-wbs-item-evaluation-criteria.handler';

// Queries
export {
  GetWbsEvaluationCriteriaListQuery,
  GetWbsEvaluationCriteriaListHandler,
} from './queries/get-wbs-evaluation-criteria-list.handler';

export {
  GetWbsEvaluationCriteriaDetailQuery,
  GetWbsEvaluationCriteriaDetailHandler,
} from './queries/get-wbs-evaluation-criteria-detail.handler';

export {
  GetWbsItemEvaluationCriteriaQuery,
  GetWbsItemEvaluationCriteriaHandler,
} from './queries/get-wbs-item-evaluation-criteria.handler';

// Handler 배열 export (Module에서 사용)
import { CreateWbsEvaluationCriteriaHandler } from './commands/create-wbs-evaluation-criteria.handler';
import { UpdateWbsEvaluationCriteriaHandler } from './commands/update-wbs-evaluation-criteria.handler';
import { DeleteWbsEvaluationCriteriaHandler } from './commands/delete-wbs-evaluation-criteria.handler';
import { DeleteWbsItemEvaluationCriteriaHandler } from './commands/delete-wbs-item-evaluation-criteria.handler';
import { GetWbsEvaluationCriteriaListHandler } from './queries/get-wbs-evaluation-criteria-list.handler';
import { GetWbsEvaluationCriteriaDetailHandler } from './queries/get-wbs-evaluation-criteria-detail.handler';
import { GetWbsItemEvaluationCriteriaHandler } from './queries/get-wbs-item-evaluation-criteria.handler';

export const WBS_EVALUATION_CRITERIA_COMMAND_HANDLERS = [
  CreateWbsEvaluationCriteriaHandler,
  UpdateWbsEvaluationCriteriaHandler,
  DeleteWbsEvaluationCriteriaHandler,
  DeleteWbsItemEvaluationCriteriaHandler,
];

export const WBS_EVALUATION_CRITERIA_QUERY_HANDLERS = [
  GetWbsEvaluationCriteriaListHandler,
  GetWbsEvaluationCriteriaDetailHandler,
  GetWbsItemEvaluationCriteriaHandler,
];

export const WBS_EVALUATION_CRITERIA_HANDLERS = [
  ...WBS_EVALUATION_CRITERIA_COMMAND_HANDLERS,
  ...WBS_EVALUATION_CRITERIA_QUERY_HANDLERS,
];
