import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationService } from '../../../../../domain/core/peer-evaluation/peer-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * ?�료?��? ?�출 커맨??
 */
export class SubmitPeerEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * ?�료?��? ?�출 ?�들??
 */
@Injectable()
@CommandHandler(SubmitPeerEvaluationCommand)
export class SubmitPeerEvaluationHandler
  implements ICommandHandler<SubmitPeerEvaluationCommand>
{
  private readonly logger = new Logger(SubmitPeerEvaluationHandler.name);

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: SubmitPeerEvaluationCommand): Promise<void> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('동료평가 제출 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 동료평가 조회 검증
      const evaluation =
        await this.peerEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new Error('존재하지 않는 동료평가입니다.');
      }

      // 이미 완료된 평가인지 확인
      if (evaluation.완료되었는가()) {
        throw new Error('이미 완료된 동료평가입니다.');
      }

      // 필수 항목 검증
      if (!evaluation.evaluationContent || !evaluation.score) {
        throw new Error('평가 내용과 점수는 필수 입력 항목입니다.');
      }

      // 동료평가 완료 처리
      await this.peerEvaluationService.수정한다(
        evaluationId,
        { isCompleted: true },
        submittedBy,
      );

      this.logger.log('?�료?��? ?�출 ?�료', { evaluationId });
    });
  }
}
