import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';

/**
 * 평가 질문 삭제 커맨드
 */
export class DeleteEvaluationQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly deletedBy: string,
  ) {}
}

/**
 * 평가 질문 삭제 핸들러
 */
@Injectable()
@CommandHandler(DeleteEvaluationQuestionCommand)
export class DeleteEvaluationQuestionHandler
  implements ICommandHandler<DeleteEvaluationQuestionCommand, void>
{
  private readonly logger = new Logger(DeleteEvaluationQuestionHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(command: DeleteEvaluationQuestionCommand): Promise<void> {
    this.logger.log('평가 질문 삭제 시작', command);

    const { id, deletedBy } = command;
    await this.evaluationQuestionService.삭제한다(id, deletedBy);

    this.logger.log(`평가 질문 삭제 완료 - ID: ${id}`);
  }
}

