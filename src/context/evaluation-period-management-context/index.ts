// ==================== 모듈 및 서비스 ====================
export { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context.module';
export { EvaluationPeriodManagementService } from './evaluation-period-management.service';

// ==================== 인터페이스 ====================
export type { IEvaluationPeriodManagementContext } from './interfaces/evaluation-period-management-context.interface';
export type {
  IEvaluationPeriodCommandService,
  IEvaluationPeriodQueryService,
} from './interfaces/evaluation-period-cqrs.interface';

// ==================== DTO 및 데이터 타입 ====================
export type {
  CreateEvaluationPeriodMinimalDto,
  EvaluationCriteriaItem,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateGradeRangesDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateSelfEvaluationSettingPermissionDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateManualSettingPermissionsDto,
} from './interfaces/evaluation-period-creation.interface';

// ==================== CQRS 커맨드 ====================
export {
  CreateEvaluationPeriodCommand,
  StartEvaluationPeriodCommand,
  CompleteEvaluationPeriodCommand,
  DeleteEvaluationPeriodCommand,
  UpdateEvaluationPeriodBasicInfoCommand,
  UpdateEvaluationPeriodScheduleCommand,
  UpdateEvaluationPeriodGradeRangesCommand,
  UpdateCriteriaSettingPermissionCommand,
  UpdateSelfEvaluationSettingPermissionCommand,
  UpdateFinalEvaluationSettingPermissionCommand,
  UpdateManualSettingPermissionsCommand,
} from './commands';

// ==================== CQRS 쿼리 ====================
export {
  GetActiveEvaluationPeriodsQuery,
  GetEvaluationPeriodDetailQuery,
  GetEvaluationPeriodListQuery,
  type EvaluationPeriodListResult,
} from './queries';

// ==================== CQRS 핸들러 (모듈 등록용) ====================
export { COMMAND_HANDLERS } from './commands';
export { QUERY_HANDLERS } from './queries';
