import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PeerEvaluationService } from '@/domain/core/peer-evaluation/peer-evaluation.service';
import { PeerEvaluationMappingService } from '@/domain/core/peer-evaluation-mapping/peer-evaluation-mapping.service';

/**
 * 평가기간의 피평가자의 모든 동료평가 취소 커맨드
 */
export class CancelPeerEvaluationsByPeriodCommand {
  constructor(
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 평가기간의 피평가자의 모든 동료평가 취소 커맨드 핸들러
 */
@CommandHandler(CancelPeerEvaluationsByPeriodCommand)
export class CancelPeerEvaluationsByPeriodHandler
  implements ICommandHandler<CancelPeerEvaluationsByPeriodCommand>
{
  private readonly logger = new Logger(
    CancelPeerEvaluationsByPeriodHandler.name,
  );

  constructor(
    private readonly peerEvaluationService: PeerEvaluationService,
    private readonly peerEvaluationMappingService: PeerEvaluationMappingService,
  ) {}

  async execute(
    command: CancelPeerEvaluationsByPeriodCommand,
  ): Promise<{ cancelledCount: number }> {
    this.logger.log(
      `평가기간의 피평가자의 모든 동료평가 취소 핸들러 실행 - 피평가자 ID: ${command.evaluateeId}, 평가기간 ID: ${command.periodId}`,
    );

    // 1. 해당 피평가자의 평가기간 내 모든 매핑 조회
    const mappings = await this.peerEvaluationMappingService.필터_조회한다({
      employeeId: command.evaluateeId,
      periodId: command.periodId,
    });

    this.logger.debug(`조회된 매핑 개수: ${mappings.length}개`);

    if (mappings.length === 0) {
      this.logger.warn(
        `취소할 동료평가 매핑을 찾을 수 없습니다 - 피평가자 ID: ${command.evaluateeId}, 평가기간 ID: ${command.periodId}`,
      );
      return { cancelledCount: 0 };
    }

    // 2. 매핑에서 평가 ID 추출
    const evaluationIds = mappings
      .map((mapping) => mapping.peerEvaluationId)
      .filter((id) => id !== null && id !== undefined);

    this.logger.debug(`추출된 평가 ID 개수: ${evaluationIds.length}개`);

    if (evaluationIds.length === 0) {
      this.logger.warn(
        `취소할 동료평가를 찾을 수 없습니다 - 피평가자 ID: ${command.evaluateeId}`,
      );
      return { cancelledCount: 0 };
    }

    // 3. 일괄 취소 실행
    const cancelledEvaluations = await this.peerEvaluationService.일괄_취소한다(
      evaluationIds,
      command.cancelledBy,
    );

    this.logger.log(
      `평가기간의 피평가자의 모든 동료평가 취소 완료 - 취소된 개수: ${cancelledEvaluations.length}개`,
    );

    return { cancelledCount: cancelledEvaluations.length };
  }
}
