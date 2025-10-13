import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { FinalEvaluationService } from '@domain/core/final-evaluation/final-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';

/**
 * 최종평가 생성 커맨드
 */
export class CreateFinalEvaluationCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly evaluationGrade: string,
    public readonly jobGrade: JobGrade,
    public readonly jobDetailedGrade: JobDetailedGrade,
    public readonly finalComments?: string,
    public readonly createdBy: string = '시스템',
  ) {}
}

/**
 * 최종평가 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateFinalEvaluationCommand)
export class CreateFinalEvaluationHandler
  implements ICommandHandler<CreateFinalEvaluationCommand>
{
  private readonly logger = new Logger(CreateFinalEvaluationHandler.name);

  constructor(
    private readonly finalEvaluationService: FinalEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: CreateFinalEvaluationCommand): Promise<string> {
    const {
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
      finalComments,
      createdBy,
    } = command;

    this.logger.log('최종평가 생성 핸들러 실행', {
      employeeId,
      periodId,
      evaluationGrade,
      jobGrade,
      jobDetailedGrade,
    });

    return await this.transactionManager.executeTransaction(async (manager) => {
      // 최종평가 생성
      const evaluation = await this.finalEvaluationService.생성한다(
        {
          employeeId,
          periodId,
          evaluationGrade,
          jobGrade,
          jobDetailedGrade,
          finalComments,
          createdBy,
        },
        manager,
      );

      this.logger.log('최종평가 생성 완료', { evaluationId: evaluation.id });
      return evaluation.id;
    });
  }
}
