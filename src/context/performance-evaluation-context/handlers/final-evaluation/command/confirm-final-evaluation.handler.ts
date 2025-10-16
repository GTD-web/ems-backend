import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 최종평가 확정 커맨드
 */
export class ConfirmFinalEvaluationCommand {
  constructor(
    public readonly id: string,
    public readonly confirmedBy: string,
  ) {}
}

/**
 * 최종평가 확정 핸들러
 */
@Injectable()
@CommandHandler(ConfirmFinalEvaluationCommand)
export class ConfirmFinalEvaluationHandler
  implements ICommandHandler<ConfirmFinalEvaluationCommand>
{
  private readonly logger = new Logger(ConfirmFinalEvaluationHandler.name);

  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: ConfirmFinalEvaluationCommand): Promise<void> {
    const { id, confirmedBy } = command;

    this.logger.log('최종평가 확정 핸들러 실행', { id, confirmedBy });

    await this.transactionManager.executeTransaction(async (manager) => {
      // 최종평가 확정
      await this.finalEvaluationService.확정한다(id, confirmedBy, manager);

      this.logger.log('최종평가 확정 완료', { id });
    });
  }
}
