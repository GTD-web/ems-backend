import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 최종평가 확정 취소 커맨드
 */
export class CancelConfirmationFinalEvaluationCommand {
  constructor(
    public readonly id: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 최종평가 확정 취소 핸들러
 */
@Injectable()
@CommandHandler(CancelConfirmationFinalEvaluationCommand)
export class CancelConfirmationFinalEvaluationHandler
  implements ICommandHandler<CancelConfirmationFinalEvaluationCommand>
{
  private readonly logger = new Logger(
    CancelConfirmationFinalEvaluationHandler.name,
  );

  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: CancelConfirmationFinalEvaluationCommand,
  ): Promise<void> {
    const { id, updatedBy } = command;

    this.logger.log('최종평가 확정 취소 핸들러 실행', { id, updatedBy });

    await this.transactionManager.executeTransaction(async (manager) => {
      // 최종평가 확정 취소
      await this.finalEvaluationService.확정_취소한다(id, updatedBy, manager);

      this.logger.log('최종평가 확정 취소 완료', { id });
    });
  }
}
