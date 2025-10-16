import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';

/**
 * 동료평가에서 질문 제거 커맨드
 */
export class RemoveQuestionFromPeerEvaluationCommand {
  constructor(
    public readonly mappingId: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 동료평가에서 질문 제거 핸들러
 */
@Injectable()
@CommandHandler(RemoveQuestionFromPeerEvaluationCommand)
export class RemoveQuestionFromPeerEvaluationHandler
  implements ICommandHandler<RemoveQuestionFromPeerEvaluationCommand, void>
{
  private readonly logger = new Logger(
    RemoveQuestionFromPeerEvaluationHandler.name,
  );

  constructor(
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
  ) {}

  async execute(
    command: RemoveQuestionFromPeerEvaluationCommand,
  ): Promise<void> {
    this.logger.log(`동료평가에서 질문 제거 - mappingId: ${command.mappingId}`);

    try {
      await this.peerEvaluationQuestionMappingService.삭제한다(
        command.mappingId,
        command.deletedBy,
      );

      this.logger.log(
        `동료평가에서 질문 제거 완료 - mappingId: ${command.mappingId}`,
      );
    } catch (error) {
      this.logger.error(
        `동료평가에서 질문 제거 실패 - mappingId: ${command.mappingId}`,
        error.stack,
      );
      throw error;
    }
  }
}

