import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 하향평가 수정 커맨드
 */
export class UpdateDownwardEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly downwardEvaluationContent?: string,
    public readonly downwardEvaluationScore?: number,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * 하향평가 수정 핸들러
 */
@Injectable()
@CommandHandler(UpdateDownwardEvaluationCommand)
export class UpdateDownwardEvaluationHandler
  implements ICommandHandler<UpdateDownwardEvaluationCommand>
{
  private readonly logger = new Logger(UpdateDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpdateDownwardEvaluationCommand): Promise<void> {
    const {
      evaluationId,
      downwardEvaluationContent,
      downwardEvaluationScore,
      updatedBy,
    } = command;

    this.logger.log('하향평가 수정 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 하향평가 수정
      await this.downwardEvaluationService.수정한다(
        evaluationId,
        {
          downwardEvaluationContent,
          downwardEvaluationScore,
        },
        updatedBy,
      );

      this.logger.log('하향평가 수정 완료', { evaluationId });
    });
  }
}



