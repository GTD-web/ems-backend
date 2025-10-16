import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { PeerEvaluationQuestionMappingService } from '@domain/core/peer-evaluation-question-mapping/peer-evaluation-question-mapping.service';

/**
 * 동료평가에 여러 질문 일괄 추가 커맨드
 */
export class AddMultipleQuestionsToPeerEvaluationCommand {
  constructor(
    public readonly peerEvaluationId: string,
    public readonly questionIds: string[],
    public readonly startDisplayOrder: number,
    public readonly createdBy: string,
  ) {}
}

/**
 * 동료평가에 여러 질문 일괄 추가 핸들러
 * 동료평가 요청 시 질문 IDs를 받아서 일괄 매핑합니다.
 */
@Injectable()
@CommandHandler(AddMultipleQuestionsToPeerEvaluationCommand)
export class AddMultipleQuestionsToPeerEvaluationHandler
  implements
    ICommandHandler<AddMultipleQuestionsToPeerEvaluationCommand, string[]>
{
  private readonly logger = new Logger(
    AddMultipleQuestionsToPeerEvaluationHandler.name,
  );

  constructor(
    private readonly peerEvaluationQuestionMappingService: PeerEvaluationQuestionMappingService,
  ) {}

  async execute(
    command: AddMultipleQuestionsToPeerEvaluationCommand,
  ): Promise<string[]> {
    this.logger.log(
      `동료평가에 여러 질문 일괄 추가 - peerEvaluationId: ${command.peerEvaluationId}, 질문 수: ${command.questionIds.length}`,
    );

    const mappingIds: string[] = [];

    for (let i = 0; i < command.questionIds.length; i++) {
      const questionId = command.questionIds[i];

      try {
        // 중복 검사
        const exists =
          await this.peerEvaluationQuestionMappingService.매핑중복확인한다(
            command.peerEvaluationId,
            questionId,
          );

        if (exists) {
          this.logger.warn(
            `이미 추가된 질문 건너뛰기 - questionId: ${questionId}`,
          );
          continue;
        }

        // 질문 매핑 생성
        const mapping =
          await this.peerEvaluationQuestionMappingService.생성한다(
            {
              peerEvaluationId: command.peerEvaluationId,
              questionId,
              displayOrder: command.startDisplayOrder + i,
              questionGroupId: undefined, // 개별 질문이므로 그룹 ID 없음
            },
            command.createdBy,
          );

        mappingIds.push(mapping.id);
      } catch (error) {
        // 개별 질문 매핑 실패 시 로그 남기고 계속 진행
        this.logger.error(
          `질문 매핑 실패 - questionId: ${questionId}`,
          error.stack,
        );
      }
    }

    this.logger.log(
      `동료평가에 여러 질문 일괄 추가 완료 - 성공: ${mappingIds.length}/${command.questionIds.length}`,
    );

    return mappingIds;
  }
}
