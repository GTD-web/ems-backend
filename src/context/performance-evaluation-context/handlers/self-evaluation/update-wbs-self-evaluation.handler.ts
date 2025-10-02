import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from 'src/domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * WBS ?�기?��? ?�정 커맨??
 */
export class UpdateWbsSelfEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly selfEvaluationContent?: string,
    public readonly selfEvaluationScore?: number,
    public readonly additionalComments?: string,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * WBS ?�기?��? ?�정 ?�들??
 */
@Injectable()
@CommandHandler(UpdateWbsSelfEvaluationCommand)
export class UpdateWbsSelfEvaluationHandler
  implements ICommandHandler<UpdateWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(UpdateWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpdateWbsSelfEvaluationCommand): Promise<void> {
    const {
      evaluationId,
      selfEvaluationContent,
      selfEvaluationScore,
      additionalComments,
      updatedBy,
    } = command;

    this.logger.log('WBS 자기평가 수정 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 수정
      await this.wbsSelfEvaluationService.수정한다(
        evaluationId,
        {
          selfEvaluationContent,
          selfEvaluationScore,
          additionalComments,
        },
        updatedBy,
      );

      this.logger.log('WBS 자기평가 수정 완료', { evaluationId });
    });
  }
}

