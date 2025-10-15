import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 생성 커맨드
 */
export class CreateWbsSelfEvaluationCommand {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly selfEvaluationContent: string,
    public readonly selfEvaluationScore: number,
    public readonly additionalComments?: string,
    public readonly createdBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 생성 핸들러
 */
@Injectable()
@CommandHandler(CreateWbsSelfEvaluationCommand)
export class CreateWbsSelfEvaluationHandler
  implements ICommandHandler<CreateWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(CreateWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: CreateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const {
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      additionalComments,
      createdBy,
    } = command;

    this.logger.log('WBS 자기평가 생성 핸들러 실행', {
      periodId,
      employeeId,
      wbsItemId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 자가평가 생성 (모든 필드 포함)
      const evaluation = await this.wbsSelfEvaluationService.생성한다({
        periodId,
        employeeId,
        wbsItemId,
        assignedBy: createdBy,
        selfEvaluationContent,
        selfEvaluationScore,
        additionalComments,
        createdBy,
      });

      this.logger.log('WBS 자기평가 생성 완료', {
        evaluationId: evaluation.id,
      });

      return evaluation.DTO로_변환한다();
    });
  }
}
