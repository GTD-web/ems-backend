import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';

/**
 * WBS 자기평가 수정 커맨드
 */
export class UpdateWbsSelfEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly selfEvaluationContent?: string,
    public readonly selfEvaluationScore?: number,
    public readonly performanceResult?: string,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 수정 핸들러
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

  async execute(
    command: UpdateWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const {
      evaluationId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      updatedBy,
    } = command;

    this.logger.log('WBS 자기평가 수정 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 수정
      const evaluation = await this.wbsSelfEvaluationService.수정한다(
        evaluationId,
        {
          selfEvaluationContent,
          selfEvaluationScore,
          performanceResult,
        },
        updatedBy,
      );

      this.logger.log('WBS 자기평가 수정 완료', { evaluationId });
      return evaluation.DTO로_변환한다();
    });
  }
}
