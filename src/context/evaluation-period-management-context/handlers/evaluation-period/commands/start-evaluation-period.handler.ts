import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../../../domain/core/evaluation-period/evaluation-period.service';

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

