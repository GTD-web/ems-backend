import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../domain/core/evaluation-period/evaluation-period.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../../../domain/core/evaluation-period/evaluation-period.types';
import {
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
} from './evaluation-period.commands';

// ==================== 평가 기간 생명주기 커맨드 핸들러 ====================

/**
 * 평가 기간 생성 커맨드 핸들러
 */
@Injectable()
@CommandHandler(CreateEvaluationPeriodCommand)
export class CreateEvaluationPeriodCommandHandler
  implements ICommandHandler<CreateEvaluationPeriodCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: CreateEvaluationPeriodCommand,
  ): Promise<EvaluationPeriodDto> {
    const { createData, createdBy } = command;

    // CreateEvaluationPeriodDto 형태로 변환
    const createDto = {
      name: createData.name,
      startDate: createData.startDate,
      endDate: createData.peerEvaluationDeadline, // 하향/동료평가 마감일을 종료일로 사용
      description: createData.description,
      peerEvaluationDeadline: createData.peerEvaluationDeadline,
      maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
      gradeRanges: createData.gradeRanges,
    };

    // 도메인 서비스를 통해 평가 기간 생성
    const createdPeriod = await this.evaluationPeriodService.생성한다(
      createDto,
      createdBy,
    );

    return createdPeriod as EvaluationPeriodDto;
  }
}

/**
 * 평가 기간 시작 커맨드 핸들러
 */
@Injectable()
@CommandHandler(StartEvaluationPeriodCommand)
export class StartEvaluationPeriodCommandHandler
  implements ICommandHandler<StartEvaluationPeriodCommand, boolean>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(command: StartEvaluationPeriodCommand): Promise<boolean> {
    const result = await this.evaluationPeriodService.시작한다(
      command.periodId,
      command.startedBy,
    );

    // 결과가 없으면 false 반환
    if (!result) {
      return false;
    }

    // 결과가 있으면 true 반환
    return true;
  }
}

/**
 * 평가 기간 완료 커맨드 핸들러
 */
@Injectable()
@CommandHandler(CompleteEvaluationPeriodCommand)
export class CompleteEvaluationPeriodCommandHandler
  implements ICommandHandler<CompleteEvaluationPeriodCommand, boolean>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(command: CompleteEvaluationPeriodCommand): Promise<boolean> {
    await this.evaluationPeriodService.완료한다(
      command.periodId,
      command.completedBy,
    );
    return true;
  }
}

/**
 * 평가 기간 삭제 커맨드 핸들러
 */
@Injectable()
@CommandHandler(DeleteEvaluationPeriodCommand)
export class DeleteEvaluationPeriodCommandHandler
  implements ICommandHandler<DeleteEvaluationPeriodCommand, boolean>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(command: DeleteEvaluationPeriodCommand): Promise<boolean> {
    await this.evaluationPeriodService.삭제한다(
      command.periodId,
      command.deletedBy,
    );
    return true;
  }
}

// ==================== 평가 기간 정보 수정 커맨드 핸들러 ====================

/**
 * 평가 기간 기본 정보 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationPeriodBasicInfoCommand)
export class UpdateEvaluationPeriodBasicInfoCommandHandler
  implements
    ICommandHandler<UpdateEvaluationPeriodBasicInfoCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateEvaluationPeriodBasicInfoCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, updateData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      name: updateData.name,
      description: updateData.description,
      maxSelfEvaluationRate: updateData.maxSelfEvaluationRate,
    };

    // 도메인 서비스를 통해 평가 기간 업데이트
    const updatedPeriod = await this.evaluationPeriodService.업데이트한다(
      periodId,
      updateDto,
      updatedBy,
    );

    return updatedPeriod as EvaluationPeriodDto;
  }
}

/**
 * 평가 기간 일정 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationPeriodScheduleCommand)
export class UpdateEvaluationPeriodScheduleCommandHandler
  implements
    ICommandHandler<UpdateEvaluationPeriodScheduleCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateEvaluationPeriodScheduleCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, scheduleData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      endDate: scheduleData.endDate,
      evaluationSetupDeadline: scheduleData.evaluationSetupDeadline,
      performanceDeadline: scheduleData.performanceDeadline,
      selfEvaluationDeadline: scheduleData.selfEvaluationDeadline,
      peerEvaluationDeadline: scheduleData.peerEvaluationDeadline,
    };

    // 도메인 서비스를 통해 평가 기간 업데이트
    const updatedPeriod = await this.evaluationPeriodService.업데이트한다(
      periodId,
      updateDto,
      updatedBy,
    );

    return updatedPeriod as EvaluationPeriodDto;
  }
}

/**
 * 평가 기간 등급 구간 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationPeriodGradeRangesCommand)
export class UpdateEvaluationPeriodGradeRangesCommandHandler
  implements
    ICommandHandler<
      UpdateEvaluationPeriodGradeRangesCommand,
      EvaluationPeriodDto
    >
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateEvaluationPeriodGradeRangesCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod = await this.evaluationPeriodService.등급구간_설정한다(
      command.periodId,
      command.gradeData.gradeRanges,
      command.updatedBy,
    );

    return updatedPeriod as EvaluationPeriodDto;
  }
}

// ==================== 수동 허용 설정 커맨드 핸들러 ====================

/**
 * 평가 기준 설정 수동 허용 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateCriteriaSettingPermissionCommand)
export class UpdateCriteriaSettingPermissionCommandHandler
  implements
    ICommandHandler<UpdateCriteriaSettingPermissionCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateCriteriaSettingPermissionCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        command.permissionData.enabled,
        undefined,
        undefined,
        command.changedBy,
      );

    return updatedPeriod as EvaluationPeriodDto;
  }
}

/**
 * 자기 평가 설정 수동 허용 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateSelfEvaluationSettingPermissionCommand)
export class UpdateSelfEvaluationSettingPermissionCommandHandler
  implements
    ICommandHandler<
      UpdateSelfEvaluationSettingPermissionCommand,
      EvaluationPeriodDto
    >
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateSelfEvaluationSettingPermissionCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        undefined,
        command.permissionData.enabled,
        undefined,
        command.changedBy,
      );

    return updatedPeriod as EvaluationPeriodDto;
  }
}

/**
 * 최종 평가 설정 수동 허용 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateFinalEvaluationSettingPermissionCommand)
export class UpdateFinalEvaluationSettingPermissionCommandHandler
  implements
    ICommandHandler<
      UpdateFinalEvaluationSettingPermissionCommand,
      EvaluationPeriodDto
    >
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateFinalEvaluationSettingPermissionCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        undefined,
        undefined,
        command.permissionData.enabled,
        command.changedBy,
      );

    return updatedPeriod as EvaluationPeriodDto;
  }
}

/**
 * 전체 수동 허용 설정 변경 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateManualSettingPermissionsCommand)
export class UpdateManualSettingPermissionsCommandHandler
  implements
    ICommandHandler<UpdateManualSettingPermissionsCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateManualSettingPermissionsCommand,
  ): Promise<EvaluationPeriodDto> {
    const updatedPeriod =
      await this.evaluationPeriodService.수동허용설정_변경한다(
        command.periodId,
        command.permissionData.criteriaSettingEnabled,
        command.permissionData.selfEvaluationSettingEnabled,
        command.permissionData.finalEvaluationSettingEnabled,
        command.changedBy,
      );

    return updatedPeriod as EvaluationPeriodDto;
  }
}
