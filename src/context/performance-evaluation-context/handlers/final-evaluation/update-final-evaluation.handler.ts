import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * 최종평가 수정 커맨드
 */
export class UpdateFinalEvaluationCommand {
  constructor(
    public readonly id: string,
    public readonly evaluationGrade?: string,
    public readonly jobGrade?: JobGrade,
    public readonly jobDetailedGrade?: JobDetailedGrade,
    public readonly finalComments?: string,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * 최종평가 수정 핸들러
 */
@Injectable()
@CommandHandler(UpdateFinalEvaluationCommand)
export class UpdateFinalEvaluationHandler
  implements ICommandHandler<UpdateFinalEvaluationCommand>
{
  private readonly logger = new Logger(UpdateFinalEvaluationHandler.name);

  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpdateFinalEvaluationCommand): Promise<void> {
    const {
      id,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      updatedBy,
    } = command;

    this.logger.log('최종평가 수정 핸들러 실행', {
      id,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
    });

    await this.transactionManager.executeTransaction(async (manager) => {
      // 최종평가 수정
      await this.finalEvaluationService.수정한다(
        id,
        {
          evaluationGrade,
          jobGrade,
          jobDetailedGrade,
          finalComments,
        },
        updatedBy,
        manager,
      );

      this.logger.log('최종평가 수정 완료', { id });
    });
  }
}
