import {
  CreateEvaluationPeriodMinimalDto,
  UpdateEvaluationPeriodBasicDto,
  UpdateEvaluationPeriodScheduleDto,
  UpdateGradeRangesDto,
  UpdateCriteriaSettingPermissionDto,
  UpdateSelfEvaluationSettingPermissionDto,
  UpdateFinalEvaluationSettingPermissionDto,
  UpdateManualSettingPermissionsDto,
} from '../interfaces/evaluation-period-creation.interface';

// ==================== 평가 기간 생명주기 커맨드 ====================

/**
 * 평가 기간 생성 커맨드
 */
export class CreateEvaluationPeriodCommand {
  constructor(
    public readonly createData: CreateEvaluationPeriodMinimalDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 기간 시작 커맨드
 */
export class StartEvaluationPeriodCommand {
  constructor(
    public readonly periodId: string,
    public readonly startedBy: string,
  ) {}
}

/**
 * 평가 기간 완료 커맨드
 */
export class CompleteEvaluationPeriodCommand {
  constructor(
    public readonly periodId: string,
    public readonly completedBy: string,
  ) {}
}

/**
 * 평가 기간 삭제 커맨드
 */
export class DeleteEvaluationPeriodCommand {
  constructor(
    public readonly periodId: string,
    public readonly deletedBy: string,
  ) {}
}

// ==================== 평가 기간 정보 수정 커맨드 ====================

/**
 * 평가 기간 기본 정보 수정 커맨드
 */
export class UpdateEvaluationPeriodBasicInfoCommand {
  constructor(
    public readonly periodId: string,
    public readonly updateData: UpdateEvaluationPeriodBasicDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 기간 일정 수정 커맨드
 */
export class UpdateEvaluationPeriodScheduleCommand {
  constructor(
    public readonly periodId: string,
    public readonly scheduleData: UpdateEvaluationPeriodScheduleDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 기간 등급 구간 수정 커맨드
 */
export class UpdateEvaluationPeriodGradeRangesCommand {
  constructor(
    public readonly periodId: string,
    public readonly gradeData: UpdateGradeRangesDto,
    public readonly updatedBy: string,
  ) {}
}

// ==================== 수동 허용 설정 커맨드 ====================

/**
 * 평가 기준 설정 수동 허용 변경 커맨드
 */
export class UpdateCriteriaSettingPermissionCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateCriteriaSettingPermissionDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 자기 평가 설정 수동 허용 변경 커맨드
 */
export class UpdateSelfEvaluationSettingPermissionCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateSelfEvaluationSettingPermissionDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 최종 평가 설정 수동 허용 변경 커맨드
 */
export class UpdateFinalEvaluationSettingPermissionCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateFinalEvaluationSettingPermissionDto,
    public readonly changedBy: string,
  ) {}
}

/**
 * 전체 수동 허용 설정 변경 커맨드
 */
export class UpdateManualSettingPermissionsCommand {
  constructor(
    public readonly periodId: string,
    public readonly permissionData: UpdateManualSettingPermissionsDto,
    public readonly changedBy: string,
  ) {}
}
