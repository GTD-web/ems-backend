import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 제출 커맨드 (피평가자 → 1차 평가자)
 */
export class SubmitWbsSelfEvaluationToEvaluatorCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 제출 핸들러 (피평가자 → 1차 평가자)
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationToEvaluatorCommand)
export class SubmitWbsSelfEvaluationToEvaluatorHandler
  implements ICommandHandler<SubmitWbsSelfEvaluationToEvaluatorCommand>
{
  private readonly logger = new Logger(
    SubmitWbsSelfEvaluationToEvaluatorHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationToEvaluatorCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, submittedBy } = command;

    this.logger.log(
      'WBS 자기평가 제출 핸들러 실행 (피평가자 → 1차 평가자)',
      { evaluationId },
    );

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 제출 (피평가자 → 1차 평가자)
      const updatedEvaluation =
        await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(
          evaluationId,
          submittedBy,
        );

      this.logger.log('WBS 자기평가 제출 완료 (피평가자 → 1차 평가자)', {
        evaluationId,
      });

      return updatedEvaluation.DTO로_변환한다();
    });
  }
}








