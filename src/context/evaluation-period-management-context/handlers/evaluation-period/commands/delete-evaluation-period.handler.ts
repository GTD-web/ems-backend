import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';

/**
 * 평가 기간 삭제 커맨드
 */
export class DeleteEvaluationPeriodCommand {
  constructor(
    public readonly periodId: string,
    public readonly deletedBy: string,
  ) {}
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

