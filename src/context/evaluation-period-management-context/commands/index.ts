// 커맨드 클래스들 export
export * from './evaluation-period.commands';

// 커맨드 핸들러들 export
export * from './evaluation-period.command-handlers';

import {
  CreateEvaluationPeriodCommandHandler,
  StartEvaluationPeriodCommandHandler,
  CompleteEvaluationPeriodCommandHandler,
  DeleteEvaluationPeriodCommandHandler,
  UpdateEvaluationPeriodBasicInfoCommandHandler,
  UpdateEvaluationPeriodScheduleCommandHandler,
  UpdateEvaluationPeriodGradeRangesCommandHandler,
  UpdateCriteriaSettingPermissionCommandHandler,
  UpdateSelfEvaluationSettingPermissionCommandHandler,
  UpdateFinalEvaluationSettingPermissionCommandHandler,
  UpdateManualSettingPermissionsCommandHandler,
  UpdateEvaluationSetupDeadlineCommandHandler,
  UpdatePerformanceDeadlineCommandHandler,
  UpdateSelfEvaluationDeadlineCommandHandler,
  UpdatePeerEvaluationDeadlineCommandHandler,
  UpdateEvaluationPeriodStartDateCommandHandler,
} from './evaluation-period.command-handlers';

// 실제 핸들러 클래스들의 배열
export const COMMAND_HANDLERS = [
  CreateEvaluationPeriodCommandHandler,
  StartEvaluationPeriodCommandHandler,
  CompleteEvaluationPeriodCommandHandler,
  DeleteEvaluationPeriodCommandHandler,
  UpdateEvaluationPeriodBasicInfoCommandHandler,
  UpdateEvaluationPeriodScheduleCommandHandler,
  UpdateEvaluationPeriodGradeRangesCommandHandler,
  UpdateCriteriaSettingPermissionCommandHandler,
  UpdateSelfEvaluationSettingPermissionCommandHandler,
  UpdateFinalEvaluationSettingPermissionCommandHandler,
  UpdateManualSettingPermissionsCommandHandler,
  UpdateEvaluationSetupDeadlineCommandHandler,
  UpdatePerformanceDeadlineCommandHandler,
  UpdateSelfEvaluationDeadlineCommandHandler,
  UpdatePeerEvaluationDeadlineCommandHandler,
  UpdateEvaluationPeriodStartDateCommandHandler,
];
