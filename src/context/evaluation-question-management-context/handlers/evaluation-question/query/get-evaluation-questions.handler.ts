import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationQuestionService } from '../../../../../domain/sub/evaluation-question/evaluation-question.service';
import type {
  EvaluationQuestionDto,
  EvaluationQuestionFilter,
} from '../../../../../domain/sub/evaluation-question/evaluation-question.types';

/**
 * 평가 질문 목록 조회 쿼리
 */
export class GetEvaluationQuestionsQuery {
  constructor(public readonly filter?: EvaluationQuestionFilter) {}
}

/**
 * 평가 질문 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationQuestionsQuery)
export class GetEvaluationQuestionsHandler
  implements IQueryHandler<GetEvaluationQuestionsQuery, EvaluationQuestionDto[]>
{
  private readonly logger = new Logger(GetEvaluationQuestionsHandler.name);

  constructor(
    private readonly evaluationQuestionService: EvaluationQuestionService,
  ) {}

  async execute(
    query: GetEvaluationQuestionsQuery,
  ): Promise<EvaluationQuestionDto[]> {
    this.logger.log('평가 질문 목록 조회 시작', query);

    const evaluationQuestions = query.filter
      ? await this.evaluationQuestionService.필터조회한다(query.filter)
      : await this.evaluationQuestionService.전체조회한다();

    return evaluationQuestions.map((question) => question.DTO로_변환한다());
  }
}

