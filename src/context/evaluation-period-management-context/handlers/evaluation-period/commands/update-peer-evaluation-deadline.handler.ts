import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';
import {
  EvaluationPeriodDto,
  UpdateEvaluationPeriodDto,
} from '../../../../../domain/core/evaluation-period/evaluation-period.types';
import { UpdatePeerEvaluationDeadlineDto } from '../../../interfaces/evaluation-period-creation.interface';

/**
 * 하향/동료평가 단계 마감일 수정 커맨드
 */
export class UpdatePeerEvaluationDeadlineCommand {
  constructor(
    public readonly periodId: string,
    public readonly deadlineData: UpdatePeerEvaluationDeadlineDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 하향/동료평가 단계 마감일 수정 커맨드 핸들러
 */
@Injectable()
@CommandHandler(UpdatePeerEvaluationDeadlineCommand)
export class UpdatePeerEvaluationDeadlineCommandHandler
  implements
    ICommandHandler<UpdatePeerEvaluationDeadlineCommand, EvaluationPeriodDto>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    command: UpdatePeerEvaluationDeadlineCommand,
  ): Promise<EvaluationPeriodDto> {
    const { periodId, deadlineData, updatedBy } = command;

    // UpdateEvaluationPeriodDto 형태로 변환
    const updateDto: UpdateEvaluationPeriodDto = {
      peerEvaluationDeadline: deadlineData.peerEvaluationDeadline,
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

