import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 생성 커맨드
 */
export class CreateDownwardEvaluationCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly selfEvaluationId?: string,
    public readonly evaluationType: string = 'primary',
    public readonly downwardEvaluationContent?: string,
    public readonly downwardEvaluationScore?: number,
    public readonly createdBy: string = '시스템',
  ) {}
}

/**
 * 하향평가 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateDownwardEvaluationCommand)
export class CreateDownwardEvaluationHandler
  implements ICommandHandler<CreateDownwardEvaluationCommand>
{
  private readonly logger = new Logger(CreateDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: CreateDownwardEvaluationCommand): Promise<string> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      selfEvaluationId,
      evaluationType,
      downwardEvaluationContent,
      downwardEvaluationScore,
      createdBy,
    } = command;

    this.logger.log('하향평가 생성 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      evaluationType,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 통합된 하향평가 생성 (매핑 정보 포함)
      const evaluation = await this.downwardEvaluationService.생성한다({
        employeeId: evaluateeId,
        evaluatorId,
        projectId,
        periodId,
        selfEvaluationId,
        downwardEvaluationContent,
        downwardEvaluationScore,
        evaluationDate: new Date(),
        evaluationType: evaluationType as DownwardEvaluationType,
        isCompleted: false,
        createdBy,
      });

      this.logger.log('하향평가 생성 완료', { evaluationId: evaluation.id });
      return evaluation.id;
    });
  }
}
