import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';

/**
 * 평가 질문 복사 커맨드
 */
export class CopyEvaluationQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly copiedBy: string,
  ) {}
}

/**
 * 평가 질문 복사 핸들러
 */
@Injectable()
@CommandHandler(CopyEvaluationQuestionCommand)
export class CopyEvaluationQuestionHandler
  implements ICommandHandler<CopyEvaluationQuestionCommand, string>
{
  private readonly logger = new Logger(CopyEvaluationQuestionHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(command: CopyEvaluationQuestionCommand): Promise<string> {
    this.logger.log('평가 질문 복사 시작', command);

    const { id, copiedBy } = command;
    const newQuestion = await this.evaluationQuestionService.복사한다(
      id,
      copiedBy,
    );

    this.logger.log(`평가 질문 복사 완료 - 새 ID: ${newQuestion.id}`);
    return newQuestion.id;
  }
}

