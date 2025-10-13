import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationService } from '@domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluationMappingService } from '@domain/core/peer-evaluation-mapping/peer-evaluation-mapping.service';
import { PeerEvaluationMapping } from '@domain/core/peer-evaluation-mapping/peer-evaluation-mapping.entity';
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
    public readonly evaluationContent?: string,
    public readonly score?: number,
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
    private readonly peerEvaluationMappingService: PeerEvaluationMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: UpsertPeerEvaluationCommand): Promise<string> {
    const {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
      evaluationContent,
      score,
      actionBy,
    } = command;

    this.logger.log('동료평가 Upsert 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      projectId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 기존 매핑 조회 (evaluateeId, evaluatorId, periodId로 찾기)
      const existingMappings =
        await this.peerEvaluationMappingService.필터_조회한다({
          employeeId: evaluateeId,
          evaluatorId,
          periodId,
        });

      let existingMapping: PeerEvaluationMapping | null = null;
      if (existingMappings.length > 0) {
        existingMapping = existingMappings[0];
      }

      if (existingMapping) {
        // 기존 동료평가 수정
        this.logger.log('기존 동료평가 수정', {
          evaluationId: existingMapping.peerEvaluationId,
        });

        await this.peerEvaluationService.수정한다(
          existingMapping.peerEvaluationId,
          {
            evaluationContent,
            score,
          },
          actionBy,
        );

        return existingMapping.peerEvaluationId;
      } else {
        // 새로운 동료평가 생성
        this.logger.log('새로운 동료평가 생성', {
          evaluatorId,
          evaluateeId,
        });

        const evaluation = await this.peerEvaluationService.생성한다({
          evaluationContent,
          score,
          evaluationDate: new Date(),
          status: PeerEvaluationStatus.PENDING,
          isCompleted: false,
          createdBy: actionBy,
        });

        // 동료평가 매핑 생성
        await this.peerEvaluationMappingService.생성한다({
          employeeId: evaluateeId,
          evaluatorId,
          periodId,
          peerEvaluationId: evaluation.id,
          mappedBy: actionBy,
        });

        this.logger.log('동료평가 생성 완료', { evaluationId: evaluation.id });
        return evaluation.id;
      }
    });
  }
}
