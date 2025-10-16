import { Injectable, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
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
 */
@Injectable()
@CommandHandler(CreateEvaluationQuestionCommand)
export class CreateEvaluationQuestionHandler
  implements ICommandHandler<CreateEvaluationQuestionCommand, string>
{
  private readonly logger = new Logger(CreateEvaluationQuestionHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(command: CreateEvaluationQuestionCommand): Promise<string> {
    this.logger.log('평가 질문 생성 시작', command);

    const { data, createdBy } = command;
    const evaluationQuestion = await this.evaluationQuestionService.생성한다(
      data,
      createdBy,
    );

    this.logger.log(
      `평가 질문 생성 완료 - ID: ${evaluationQuestion.id}, 질문: ${evaluationQuestion.text}`,
    );
    return evaluationQuestion.id;
  }
}

