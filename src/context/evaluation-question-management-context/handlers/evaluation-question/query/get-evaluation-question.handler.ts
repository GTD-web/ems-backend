import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type { EvaluationQuestionDto } from '../../../../../domain/sub/evaluation-question/evaluation-question.types';

/**
 * 평가 질문 조회 쿼리
 */
export class GetEvaluationQuestionQuery {
  constructor(public readonly id: string) {}
}

/**
 * 평가 질문 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationQuestionQuery)
export class GetEvaluationQuestionHandler
  implements IQueryHandler<GetEvaluationQuestionQuery, EvaluationQuestionDto>
{
  private readonly logger = new Logger(GetEvaluationQuestionHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(
    query: GetEvaluationQuestionQuery,
  ): Promise<EvaluationQuestionDto> {
    this.logger.log('평가 질문 조회 시작', query);

    const evaluationQuestion =
      await this.evaluationQuestionService.ID로조회한다(query.id);

    if (!evaluationQuestion) {
      throw new NotFoundException(
        `평가 질문을 찾을 수 없습니다. (id: ${query.id})`,
      );
    }

    return evaluationQuestion.DTO로_변환한다();
  }
}

