// 평가 기간 생명주기 커맨드 핸들러
export * from './create-evaluation-period.handler';
export * from './start-evaluation-period.handler';
export * from './complete-evaluation-period.handler';
export * from './delete-evaluation-period.handler';

// 평가 기간 정보 수정 커맨드 핸들러
export * from './update-evaluation-period-basic-info.handler';
export * from './update-evaluation-period-schedule.handler';
export * from './update-evaluation-setup-deadline.handler';
export * from './update-performance-deadline.handler';
export * from './update-self-evaluation-deadline.handler';
export * from './update-peer-evaluation-deadline.handler';
export * from './update-evaluation-period-start-date.handler';
export * from './update-evaluation-period-grade-ranges.handler';

// 수동 허용 설정 커맨드 핸들러
export * from './update-criteria-setting-permission.handler';
export * from './update-self-evaluation-setting-permission.handler';
export * from './update-final-evaluation-setting-permission.handler';
export * from './update-manual-setting-permissions.handler';

import { CreateEvaluationPeriodCommandHandler } from './create-evaluation-period.handler';
import { StartEvaluationPeriodCommandHandler } from './start-evaluation-period.handler';
import { CompleteEvaluationPeriodCommandHandler } from './complete-evaluation-period.handler';
import { DeleteEvaluationPeriodCommandHandler } from './delete-evaluation-period.handler';
import { UpdateEvaluationPeriodBasicInfoCommandHandler } from './update-evaluation-period-basic-info.handler';
import { UpdateEvaluationPeriodScheduleCommandHandler } from './update-evaluation-period-schedule.handler';
import { UpdateEvaluationSetupDeadlineCommandHandler } from './update-evaluation-setup-deadline.handler';
import { UpdatePerformanceDeadlineCommandHandler } from './update-performance-deadline.handler';
import { UpdateSelfEvaluationDeadlineCommandHandler } from './update-self-evaluation-deadline.handler';
import { UpdatePeerEvaluationDeadlineCommandHandler } from './update-peer-evaluation-deadline.handler';
import { UpdateEvaluationPeriodStartDateCommandHandler } from './update-evaluation-period-start-date.handler';
import { UpdateEvaluationPeriodGradeRangesCommandHandler } from './update-evaluation-period-grade-ranges.handler';
import { UpdateCriteriaSettingPermissionCommandHandler } from './update-criteria-setting-permission.handler';
import { UpdateSelfEvaluationSettingPermissionCommandHandler } from './update-self-evaluation-setting-permission.handler';
import { UpdateFinalEvaluationSettingPermissionCommandHandler } from './update-final-evaluation-setting-permission.handler';
import { UpdateManualSettingPermissionsCommandHandler } from './update-manual-setting-permissions.handler';

export const EVALUATION_PERIOD_COMMAND_HANDLERS = [
  // 평가 기간 생명주기
  CreateEvaluationPeriodCommandHandler,
  StartEvaluationPeriodCommandHandler,
  CompleteEvaluationPeriodCommandHandler,
  DeleteEvaluationPeriodCommandHandler,
  // 평가 기간 정보 수정
  UpdateEvaluationPeriodBasicInfoCommandHandler,
  UpdateEvaluationPeriodScheduleCommandHandler,
  UpdateEvaluationSetupDeadlineCommandHandler,
  UpdatePerformanceDeadlineCommandHandler,
  UpdateSelfEvaluationDeadlineCommandHandler,
  UpdatePeerEvaluationDeadlineCommandHandler,
  UpdateEvaluationPeriodStartDateCommandHandler,
  UpdateEvaluationPeriodGradeRangesCommandHandler,
  // 수동 허용 설정
  UpdateCriteriaSettingPermissionCommandHandler,
  UpdateSelfEvaluationSettingPermissionCommandHandler,
  UpdateFinalEvaluationSettingPermissionCommandHandler,
  UpdateManualSettingPermissionsCommandHandler,
];

