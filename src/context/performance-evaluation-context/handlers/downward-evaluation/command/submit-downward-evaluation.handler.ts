import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationAlreadyCompletedException,
  DownwardEvaluationValidationException,
} from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * ?�향?��? ?�출 커맨??
 */
export class SubmitDownwardEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * ?�향?��? ?�출 ?�들??
 */
@Injectable()
@CommandHandler(SubmitDownwardEvaluationCommand)
export class SubmitDownwardEvaluationHandler
  implements ICommandHandler<SubmitDownwardEvaluationCommand>
{
  private readonly logger = new Logger(SubmitDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: SubmitDownwardEvaluationCommand): Promise<void> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('하향평가 제출 핸들러 실행', { evaluationId });

    await this.transactionManager.executeTransaction(async () => {
      // 하향평가 조회 검증
      const evaluation =
        await this.downwardEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new DownwardEvaluationNotFoundException(evaluationId);
      }

      // 이미 완료된 평가인지 확인
      if (evaluation.완료되었는가()) {
        throw new DownwardEvaluationAlreadyCompletedException(evaluationId);
      }

      // 필수 항목 검증
      if (
        !evaluation.downwardEvaluationContent ||
        !evaluation.downwardEvaluationScore
      ) {
        throw new DownwardEvaluationValidationException(
          '평가 내용과 점수는 필수 입력 항목입니다.',
        );
      }

      // 하향평가 완료 처리
      await this.downwardEvaluationService.수정한다(
        evaluationId,
        { isCompleted: true },
        submittedBy,
      );

      this.logger.log('하향평가 제출 완료', { evaluationId });
    });
  }
}
