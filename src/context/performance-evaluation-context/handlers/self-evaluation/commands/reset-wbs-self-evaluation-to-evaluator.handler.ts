import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * 단일 WBS 자기평가 취소 커맨드 (피평가자 → 1차 평가자 제출 취소)
 */
export class ResetWbsSelfEvaluationToEvaluatorCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 단일 WBS 자기평가 취소 핸들러 (피평가자 → 1차 평가자 제출 취소)
 * 특정 WBS 자기평가의 1차 평가자 제출 상태를 취소합니다.
 */
@Injectable()
@CommandHandler(ResetWbsSelfEvaluationToEvaluatorCommand)
export class ResetWbsSelfEvaluationToEvaluatorHandler
  implements ICommandHandler<ResetWbsSelfEvaluationToEvaluatorCommand>
{
  private readonly logger = new Logger(
    ResetWbsSelfEvaluationToEvaluatorHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ResetWbsSelfEvaluationToEvaluatorCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, resetBy } = command;

    this.logger.log(
      'WBS 자기평가 취소 시작 (피평가자 → 1차 평가자 제출 취소)',
      { evaluationId },
    );

    return await this.transactionManager.executeTransaction(async () => {
      // 피평가자가 1차 평가자에게 제출한 것을 취소
      const updatedEvaluation =
        await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한_것을_취소한다(
          evaluationId,
          resetBy,
        );

      this.logger.log(
        'WBS 자기평가 취소 완료 (피평가자 → 1차 평가자 제출 취소)',
        {
          evaluationId,
        },
      );

      return updatedEvaluation.DTO로_변환한다();
    });
  }
}

