import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import { QuestionGroupMappingService } from '../../../../../domain/sub/question-group-mapping/question-group-mapping.service';
import type { CreateEvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';

/**
 * 평가 질문 생성 커맨드
 */
export class CreateEvaluationQuestionCommand {
  constructor(
    public readonly data: CreateEvaluationQuestionDto,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 질문 생성 핸들러
 * 질문 생성 후 groupId가 제공되면 자동으로 해당 그룹에 추가합니다.
 */
@Injectable()
@CommandHandler(CreateEvaluationQuestionCommand)
export class CreateEvaluationQuestionHandler
  implements ICommandHandler<CreateEvaluationQuestionCommand, string>
{
  private readonly logger = new Logger(CreateEvaluationQuestionHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
    private readonly questionGroupMappingService: QuestionGroupMappingService,
  ) {}

  async execute(command: CreateEvaluationQuestionCommand): Promise<string> {
    this.logger.log('평가 질문 생성 시작', command);

    const { data, createdBy } = command;
    const { groupId, displayOrder, ...questionData } = data;

    // 1. 평가 질문 생성
    const evaluationQuestion = await this.evaluationQuestionService.생성한다(
      questionData,
      createdBy,
    );

    this.logger.log(
      `평가 질문 생성 완료 - ID: ${evaluationQuestion.id}, 질문: ${evaluationQuestion.text}`,
    );

    // 2. groupId가 제공되면 그룹에 추가
    if (groupId) {
      try {
        await this.questionGroupMappingService.생성한다(
          {
            groupId,
            questionId: evaluationQuestion.id,
            displayOrder: displayOrder ?? 0,
          },
          createdBy,
        );

        this.logger.log(
          `평가 질문이 그룹에 추가됨 - 질문 ID: ${evaluationQuestion.id}, 그룹 ID: ${groupId}`,
        );
      } catch (error) {
        this.logger.warn(
          `평가 질문은 생성되었으나 그룹 추가 실패 - 질문 ID: ${evaluationQuestion.id}, 그룹 ID: ${groupId}`,
          error.message,
        );
        // 질문은 생성되었으므로 그룹 추가 실패는 경고만 처리
      }
    }

    return evaluationQuestion.id;
  }
}
