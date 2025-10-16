import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';

/**
 * 동료평가에 개별 질문 추가 커맨드
 */
export class AddQuestionToPeerEvaluationCommand {
  constructor(
    public readonly peerEvaluationId: string,
    public readonly questionId: string,
    public readonly displayOrder: number,
    public readonly questionGroupId: string | undefined,
    public readonly createdBy: string,
  ) {}
}

/**
 * 동료평가에 개별 질문 추가 핸들러
 * 단일 질문을 동료평가에 추가합니다.
 */
@Injectable()
@CommandHandler(AddQuestionToPeerEvaluationCommand)
export class AddQuestionToPeerEvaluationHandler
  implements ICommandHandler<AddQuestionToPeerEvaluationCommand, string>
{
  private readonly logger = new Logger(AddQuestionToPeerEvaluationHandler.name);

  constructor(
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
  ) {}

  async execute(command: AddQuestionToPeerEvaluationCommand): Promise<string> {
    this.logger.log(
      `동료평가에 질문 추가 - peerEvaluationId: ${command.peerEvaluationId}, questionId: ${command.questionId}`,
    );

    try {
      const mapping = await this.peerEvaluationQuestionMappingService.생성한다(
        {
          peerEvaluationId: command.peerEvaluationId,
          questionId: command.questionId,
          questionGroupId: command.questionGroupId,
          displayOrder: command.displayOrder,
        },
        command.createdBy,
      );

      this.logger.log(`동료평가에 질문 추가 완료 - mappingId: ${mapping.id}`);
      return mapping.id;
    } catch (error) {
      this.logger.error(
        `동료평가에 질문 추가 실패 - peerEvaluationId: ${command.peerEvaluationId}, questionId: ${command.questionId}`,
        error.stack,
      );
      throw error;
    }
  }
}

