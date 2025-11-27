import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationNotCompletedException,
} from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 하향평가 초기화 커맨드
 */
export class ResetDownwardEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 하향평가 초기화 핸들러
 * 제출된 하향평가를 미제출 상태로 되돌립니다.
 */
@Injectable()
@CommandHandler(ResetDownwardEvaluationCommand)
export class ResetDownwardEvaluationHandler
  implements ICommandHandler<ResetDownwardEvaluationCommand>
{
  private readonly logger = new Logger(ResetDownwardEvaluationHandler.name);

  constructor(
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: ResetDownwardEvaluationCommand): Promise<void> {
    const { evaluationId, resetBy } = command;

    this.logger.log('하향평가 초기화 핸들러 실행', { evaluationId });

    try {
      await this.transactionManager.executeTransaction(async () => {
        // 하향평가 조회 검증
        this.logger.debug(`하향평가 조회 시작 - ID: ${evaluationId}`);
        const evaluation =
          await this.downwardEvaluationService.조회한다(evaluationId);

        if (!evaluation) {
          this.logger.error(`하향평가를 찾을 수 없음 - ID: ${evaluationId}`);
          throw new DownwardEvaluationNotFoundException(evaluationId);
        }

        this.logger.debug(
          `하향평가 조회 성공 - ID: ${evaluationId}, isCompleted: ${evaluation.isCompleted}`,
        );

        // 완료되지 않은 평가인지 확인
        if (!evaluation.완료되었는가()) {
          this.logger.error(
            `이미 미제출 상태인 하향평가 - ID: ${evaluationId}, isCompleted: ${evaluation.isCompleted}`,
          );
          throw new DownwardEvaluationNotCompletedException(evaluationId);
        }

        // 하향평가 미제출 상태로 변경
        this.logger.debug(
          `하향평가 미제출 상태로 변경 시작 - ID: ${evaluationId}`,
        );
        await this.downwardEvaluationService.수정한다(
          evaluationId,
          { isCompleted: false },
          resetBy,
        );

        this.logger.log('하향평가 초기화 완료', {
          evaluationId,
          resetBy,
          previousState: 'completed',
          newState: 'not_completed',
        });
      });
    } catch (error) {
      this.logger.error(
        `하향평가 초기화 실패 - ID: ${evaluationId}`,
        error.stack,
        {
          evaluationId,
          resetBy,
          errorName: error.name,
          errorMessage: error.message,
        },
      );
      throw error;
    }
  }
}
