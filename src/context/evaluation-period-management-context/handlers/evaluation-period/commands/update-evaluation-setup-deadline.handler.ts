import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdateEvaluationSetupDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 평가설정 단계 마감일 수정 커맨드
 */
export class UpdateEvaluationSetupDeadlineCommand {
  constructor(
    public readonly periodId: string,
    public readonly deadlineData: UpdateEvaluationSetupDeadlineDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가설정 단계 마감일 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationSetupDeadlineCommand)
export class UpdateEvaluationSetupDeadlineCommandHandler
  implements
    ICommandHandler<UpdateEvaluationSetupDeadlineCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdateEvaluationSetupDeadlineCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, deadlineData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      evaluationSetupDeadline: deadlineData.evaluationSetupDeadline,
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

