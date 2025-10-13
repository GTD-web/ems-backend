import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationService } from '../../../../domain/core/peer-evaluation/peer-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * ?�료?��? ?�정 커맨??
 */
export class UpdatePeerEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly evaluationContent?: string,
    public readonly score?: number,
    public readonly updatedBy: string = '시스템',
  ) {}
}

/**
 * ?�료?��? ?�정 ?�들??
 */
@Injectable()
@CommandHandler(UpdatePeerEvaluationCommand)
export class UpdatePeerEvaluationHandler
  implements ICommandHandler<UpdatePeerEvaluationCommand>
{
  private readonly logger = new Logger(UpdatePeerEvaluationHandler.name);

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpdatePeerEvaluationCommand): Promise<void> {
    const { evaluationId, evaluationContent, score, updatedBy } = command;

    this.logger.log('동료평가 수정 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 동료평가 수정
      await this.peerEvaluationService.수정한다(
        evaluationId,
        {
          evaluationContent,
          score,
        },
        updatedBy,
      );

      this.logger.log('동료평가 수정 완료', { evaluationId });
    });
  }
}



