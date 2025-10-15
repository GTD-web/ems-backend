import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';

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

