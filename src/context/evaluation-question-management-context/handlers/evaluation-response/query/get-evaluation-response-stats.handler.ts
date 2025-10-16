import { Injectable, Logger } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationResponseService } from '../../../../../domain/sub/evaluation-response/evaluation-response.service';
import type { EvaluationResponseStats } from '../../../../../domain/sub/evaluation-response/evaluation-response.types';

/**
 * 평가 응답 통계 조회 쿼리
 */
export class GetEvaluationResponseStatsQuery {
  constructor(public readonly evaluationId: string) {}
}

/**
 * 평가 응답 통계 조회 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationResponseStatsQuery)
export class GetEvaluationResponseStatsHandler
  implements
    IQueryHandler<GetEvaluationResponseStatsQuery, EvaluationResponseStats>
{
  private readonly logger = new Logger(GetEvaluationResponseStatsHandler.name);

  constructor(
    private readonly evaluationResponseService: EvaluationResponseService,
  ) {}

  async execute(
    query: GetEvaluationResponseStatsQuery,
  ): Promise<EvaluationResponseStats> {
    this.logger.log('평가 응답 통계 조회 시작', query);

    const stats = await this.evaluationResponseService.평가응답통계조회한다(
      query.evaluationId,
    );

    return stats;
  }
}

