import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { PeerEvaluationService } from '@/domain/core/peer-evaluation/peer-evaluation.service';

/**
 * 동료평가 취소 커맨드
 */
export class CancelPeerEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly cancelledBy: string,
  ) {}
}

/**
 * 동료평가 취소 커맨드 핸들러
 */
@CommandHandler(CancelPeerEvaluationCommand)
export class CancelPeerEvaluationHandler
  implements ICommandHandler<CancelPeerEvaluationCommand>
{
  private readonly logger = new Logger(CancelPeerEvaluationHandler.name);

  constructor(private readonly peerEvaluationService: PeerEvaluationService) {}

  async execute(command: CancelPeerEvaluationCommand): Promise<void> {
    this.logger.log(
      `동료평가 취소 핸들러 실행 - 평가 ID: ${command.evaluationId}`,
    );

    await this.peerEvaluationService.취소한다(
      command.evaluationId,
      command.cancelledBy,
    );

    this.logger.log(
      `동료평가 취소 핸들러 완료 - 평가 ID: ${command.evaluationId}`,
    );
  }
}
