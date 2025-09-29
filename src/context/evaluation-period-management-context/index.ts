// ==================== 모듈 및 서비스 ====================
export { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context.module';
export { EvaluationPeriodManagementService } from './evaluation-period-management.service';

// ==================== 인터페이스 ====================
export type {
  IEvaluationPeriodCommandService,
  IEvaluationPeriodQueryService,
} from './interfaces/evaluation-period-cqrs.interface';
export type { IEvaluationPeriodManagementContext } from './interfaces/evaluation-period-management-context.interface';

// ==================== DTO 및 데이터 타입 ====================
export type {
  CreateEvaluationPeriodMinimalDto,
  EvaluationCriteriaItem,
  UpdateCriteriaSettingPermissionDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateGradeRangesDto,
  UpdateManualSettingPermissionsDto,
  UpdateSelfEvaluationSettingPermissionDto,
} from './interfaces/evaluation-period-creation.interface';

// ==================== CQRS 커맨드 ====================
export {
  CompleteEvaluationPeriodCommand,
  CreateEvaluationPeriodCommand,
  DeleteEvaluationPeriodCommand,
  StartEvaluationPeriodCommand,
  UpdateCriteriaSettingPermissionCommand,
  UpdateEvaluationPeriodBasicInfoCommand,
  UpdateEvaluationPeriodGradeRangesCommand,
  UpdateEvaluationPeriodScheduleCommand,
  UpdateFinalEvaluationSettingPermissionCommand,
  UpdateManualSettingPermissionsCommand,
  UpdateSelfEvaluationSettingPermissionCommand,
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
