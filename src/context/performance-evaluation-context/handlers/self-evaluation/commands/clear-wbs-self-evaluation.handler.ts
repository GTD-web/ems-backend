import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 내용 초기화 커맨드
 */
export class ClearWbsSelfEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly clearedBy?: string,
  ) {}
}

/**
 * WBS 자기평가 내용 초기화 핸들러
 * 특정 WBS 자기평가의 내용(selfEvaluationContent, selfEvaluationScore, performanceResult)을 초기화합니다.
 */
@Injectable()
@CommandHandler(ClearWbsSelfEvaluationCommand)
export class ClearWbsSelfEvaluationHandler
  implements ICommandHandler<ClearWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(ClearWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
  ) {}

  async execute(
    command: ClearWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    this.logger.log(`WBS 자기평가 내용 초기화: ${command.evaluationId}`);

    const evaluation = await this.wbsSelfEvaluationService.내용을_초기화한다(
      command.evaluationId,
      command.clearedBy,
    );

    return evaluation.DTO로_변환한다();
  }
}

