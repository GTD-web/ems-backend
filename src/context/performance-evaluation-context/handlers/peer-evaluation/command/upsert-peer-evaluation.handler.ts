import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { PeerEvaluationStatus } from '@domain/core/peer-evaluation/peer-evaluation.types';

/**
 * 동료평가 Upsert 커맨드
 */
export class UpsertPeerEvaluationCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * 동료평가 Upsert 핸들러
 * 기존 동료평가가 있으면 수정, 없으면 생성합니다.
 */
@Injectable()
@CommandHandler(UpsertPeerEvaluationCommand)
export class UpsertPeerEvaluationHandler
  implements ICommandHandler<UpsertPeerEvaluationCommand>
{
  private readonly logger = new Logger(UpsertPeerEvaluationHandler.name);

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpsertPeerEvaluationCommand): Promise<string> {
    const { evaluatorId, evaluateeId, periodId, projectId, actionBy } = command;

    this.logger.log('동료평가 Upsert 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 기존 동료평가 조회 (evaluateeId, evaluatorId, periodId로 찾기)
      const existingEvaluations =
        await this.peerEvaluationService.필터_조회한다({
          employeeId: evaluateeId,
          evaluatorId,
          periodId,
        });

      let existingEvaluation: PeerEvaluation | null = null;
      if (existingEvaluations.length > 0) {
        existingEvaluation = existingEvaluations[0];
      }

      if (existingEvaluation) {
        // 기존 동료평가 수정
        this.logger.log('기존 동료평가 수정', {
          evaluationId: existingEvaluation.id,
        });

        await this.peerEvaluationService.수정한다(
          existingEvaluation.id,
          {},
          actionBy,
        );

        return existingEvaluation.id;
      } else {
        // 새로운 동료평가 생성
        this.logger.log('새로운 동료평가 생성', {
          evaluatorId,
          evaluateeId,
        });

        const evaluation = await this.peerEvaluationService.생성한다({
          employeeId: evaluateeId,
          evaluatorId,
          periodId,
          evaluationDate: new Date(),
          status: PeerEvaluationStatus.PENDING,
          isCompleted: false,
          mappedBy: actionBy,
          createdBy: actionBy,
        });

        this.logger.log('동료평가 생성 완료', { evaluationId: evaluation.id });
        return evaluation.id;
      }
    });
  }
}
