import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type {
  EvaluationResponseDto,
  EvaluationResponseFilter,
} from '../../../../../domain/sub/evaluation-response/evaluation-response.types';

/**
 * 평가 응답 목록 조회 쿼리
 */
export class GetEvaluationResponsesQuery {
  constructor(public readonly filter: EvaluationResponseFilter) {}
}

/**
 * 평가 응답 목록 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationResponsesQuery)
export class GetEvaluationResponsesHandler
  implements IQueryHandler<GetEvaluationResponsesQuery, EvaluationResponseDto[]>
{
  private readonly logger = new Logger(GetEvaluationResponsesHandler.name);

  constructor(
    private readonly evaluationResponseService: EvaluationResponseService,
  ) {}

  async execute(
    query: GetEvaluationResponsesQuery,
  ): Promise<EvaluationResponseDto[]> {
    this.logger.log('평가 응답 목록 조회 시작', query);

    const evaluationResponses =
      await this.evaluationResponseService.필터조회한다(query.filter);

    return evaluationResponses.map((response) => response.DTO로_변환한다());
  }
}

