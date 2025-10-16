import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';
import { QuestionGroupMappingService } from '@domain/sub/question-group-mapping/question-group-mapping.service';

/**
 * 동료평가에 질문 그룹 추가 커맨드
 */
export class AddQuestionGroupToPeerEvaluationCommand {
  constructor(
    public readonly peerEvaluationId: string,
    public readonly questionGroupId: string,
    public readonly startDisplayOrder: number,
    public readonly createdBy: string,
  ) {}
}

/**
 * 동료평가에 질문 그룹 추가 핸들러
 * 질문 그룹에 속한 모든 질문을 동료평가에 일괄 추가합니다.
 */
@Injectable()
@CommandHandler(AddQuestionGroupToPeerEvaluationCommand)
export class AddQuestionGroupToPeerEvaluationHandler
  implements ICommandHandler<AddQuestionGroupToPeerEvaluationCommand, string[]>
{
  private readonly logger = new Logger(
    AddQuestionGroupToPeerEvaluationHandler.name,
  );

  constructor(
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(
    command: AddQuestionGroupToPeerEvaluationCommand,
  ): Promise<string[]> {
    this.logger.log(
      `동료평가에 질문 그룹 추가 - peerEvaluationId: ${command.peerEvaluationId}, questionGroupId: ${command.questionGroupId}`,
    );

    try {
      // 1. 질문 그룹의 질문 목록 조회 (displayOrder 순으로 정렬됨)
      const questionMappings =
        await this.questionGroupMappingService.그룹ID로조회한다(
          command.questionGroupId,
        );

      if (questionMappings.length === 0) {
        this.logger.warn(
          `질문 그룹에 질문이 없습니다 - questionGroupId: ${command.questionGroupId}`,
        );
        return [];
      }

      // 2. 질문 ID 목록 추출
      const questionIds = questionMappings.map((m) => m.questionId);

      // 3. 동료평가에 질문 그룹 일괄 추가
      const savedMappings =
        await this.peerEvaluationQuestionMappingService.질문그룹의_질문들을_일괄추가한다(
          command.peerEvaluationId,
          command.questionGroupId,
          questionIds,
          command.startDisplayOrder,
          command.createdBy,
        );

      const mappingIds = savedMappings.map((m) => m.id);

      this.logger.log(
        `동료평가에 질문 그룹 추가 완료 - 추가된 질문 수: ${mappingIds.length}`,
      );
      return mappingIds;
    } catch (error) {
      this.logger.error(
        `동료평가에 질문 그룹 추가 실패 - peerEvaluationId: ${command.peerEvaluationId}`,
        error.stack,
      );
      throw error;
    }
  }
}
