import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';

/**
 * 동료평가 질문 순서 변경 커맨드
 */
export class UpdatePeerEvaluationQuestionOrderCommand {
  constructor(
    public readonly mappingId: string,
    public readonly newDisplayOrder: number,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 동료평가 질문 순서 변경 핸들러
 */
@Injectable()
@CommandHandler(UpdatePeerEvaluationQuestionOrderCommand)
export class UpdatePeerEvaluationQuestionOrderHandler
  implements ICommandHandler<UpdatePeerEvaluationQuestionOrderCommand, void>
{
  private readonly logger = new Logger(
    UpdatePeerEvaluationQuestionOrderHandler.name,
  );

  constructor(
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
  ) {}

  async execute(
    command: UpdatePeerEvaluationQuestionOrderCommand,
  ): Promise<void> {
    this.logger.log(
      `동료평가 질문 순서 변경 - mappingId: ${command.mappingId}, newOrder: ${command.newDisplayOrder}`,
    );

    try {
      await this.peerEvaluationQuestionMappingService.업데이트한다(
        command.mappingId,
        { displayOrder: command.newDisplayOrder },
        command.updatedBy,
      );

      this.logger.log(
        `동료평가 질문 순서 변경 완료 - mappingId: ${command.mappingId}`,
      );
    } catch (error) {
      this.logger.error(
        `동료평가 질문 순서 변경 실패 - mappingId: ${command.mappingId}`,
        error.stack,
      );
      throw error;
    }
  }
}

