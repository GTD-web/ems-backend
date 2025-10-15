import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationPeriodScheduleDto } from '../../../interfaces/evaluation-period-creation.interface';

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
      startDate: scheduleData.startDate,
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

