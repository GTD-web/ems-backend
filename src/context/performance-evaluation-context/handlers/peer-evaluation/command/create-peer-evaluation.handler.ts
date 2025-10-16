import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { PeerEvaluationStatus } from '@domain/core/peer-evaluation/peer-evaluation.types';

/**
 * 동료평가 생성 커맨드
 */
export class CreatePeerEvaluationCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly requestDeadline?: Date,
    public readonly createdBy: string = '시스템',
  ) {}
}

/**
 * 동료평가 생성 핸들러
 */
@Injectable()
@CommandHandler(CreatePeerEvaluationCommand)
export class CreatePeerEvaluationHandler
  implements ICommandHandler<CreatePeerEvaluationCommand>
{
  private readonly logger = new Logger(CreatePeerEvaluationHandler.name);

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: CreatePeerEvaluationCommand): Promise<string> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      requestDeadline,
      createdBy,
    } = command;

    this.logger.log('동료평가 생성 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      requestDeadline,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 동료평가 생성 (매핑 정보 포함)
      const evaluation = await this.peerEvaluationService.생성한다({
        employeeId: evaluateeId,
        evaluatorId,
        periodId,
        evaluationDate: new Date(),
        requestDeadline,
        status: PeerEvaluationStatus.PENDING,
        isCompleted: false,
        mappedBy: createdBy,
        createdBy,
      });

      this.logger.log('동료평가 생성 완료', { evaluationId: evaluation.id });
      return evaluation.id;
    });
  }
}
