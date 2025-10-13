import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 최종평가 삭제 커맨드
 */
export class DeleteFinalEvaluationCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string = '시스템',
  ) {}
}

/**
 * 최종평가 삭제 핸들러
 */
@Injectable()
@CommandHandler(DeleteFinalEvaluationCommand)
export class DeleteFinalEvaluationHandler
  implements ICommandHandler<DeleteFinalEvaluationCommand>
{
  private readonly logger = new Logger(DeleteFinalEvaluationHandler.name);

  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: DeleteFinalEvaluationCommand): Promise<void> {
    const { id, deletedBy } = command;

    this.logger.log('최종평가 삭제 핸들러 실행', { id });

    await this.transactionManager.executeTransaction(async (manager) => {
      // 최종평가 삭제
      await this.finalEvaluationService.삭제한다(id, deletedBy, manager);

      this.logger.log('최종평가 삭제 완료', { id });
    });
  }
}
