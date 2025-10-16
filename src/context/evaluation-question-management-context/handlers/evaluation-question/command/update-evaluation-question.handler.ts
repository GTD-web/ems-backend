import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type { UpdateEvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';

/**
 * 평가 질문 수정 커맨드
 */
export class UpdateEvaluationQuestionCommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateEvaluationQuestionDto,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 질문 수정 핸들러
 */
@Injectable()
@CommandHandler(UpdateEvaluationQuestionCommand)
export class UpdateEvaluationQuestionHandler
  implements ICommandHandler<UpdateEvaluationQuestionCommand, void>
{
  private readonly logger = new Logger(UpdateEvaluationQuestionHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(command: UpdateEvaluationQuestionCommand): Promise<void> {
    this.logger.log('평가 질문 수정 시작', command);

    const { id, data, updatedBy } = command;
    await this.evaluationQuestionService.업데이트한다(id, data, updatedBy);

    this.logger.log(`평가 질문 수정 완료 - ID: ${id}`);
  }
}

