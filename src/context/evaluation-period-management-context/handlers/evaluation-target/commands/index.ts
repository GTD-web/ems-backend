// 평가 대상자 관리 커맨드 핸들러
export * from './register-evaluation-target.handler';
export * from './register-bulk-evaluation-targets.handler';
export * from './exclude-evaluation-target.handler';
export * from './include-evaluation-target.handler';
export * from './unregister-evaluation-target.handler';
export * from './unregister-all-evaluation-targets.handler';

import { RegisterEvaluationTargetHandler } from './register-evaluation-target.handler';
import { RegisterBulkEvaluationTargetsHandler } from './register-bulk-evaluation-targets.handler';
import { ExcludeEvaluationTargetHandler } from './exclude-evaluation-target.handler';
import { IncludeEvaluationTargetHandler } from './include-evaluation-target.handler';
import { UnregisterEvaluationTargetHandler } from './unregister-evaluation-target.handler';
import { UnregisterAllEvaluationTargetsHandler } from './unregister-all-evaluation-targets.handler';

export const EVALUATION_TARGET_COMMAND_HANDLERS = [
  RegisterEvaluationTargetHandler,
  RegisterBulkEvaluationTargetsHandler,
  ExcludeEvaluationTargetHandler,
  IncludeEvaluationTargetHandler,
  UnregisterEvaluationTargetHandler,
  UnregisterAllEvaluationTargetsHandler,
];

