import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationLineService } from '../../../../../domain/core/evaluation-line/evaluation-line.service';
import type {
  EvaluationLineDto,
  EvaluationLineFilter,
} from '../../../../../domain/core/evaluation-line/evaluation-line.types';

/**
 * 평가라인 목록 조회 쿼리
 */
export class GetEvaluationLineListQuery {
  constructor(public readonly filter: EvaluationLineFilter) {}
}

/**
 * 평가라인 목록 조회 쿼리 핸들러
 */
@QueryHandler(GetEvaluationLineListQuery)
export class GetEvaluationLineListHandler
  implements IQueryHandler<GetEvaluationLineListQuery, EvaluationLineDto[]>
{
  private readonly logger = new Logger(GetEvaluationLineListHandler.name);

  constructor(private readonly evaluationLineService: EvaluationLineService) {}

  async execute(
    query: GetEvaluationLineListQuery,
  ): Promise<EvaluationLineDto[]> {
    const { filter } = query;

    this.logger.debug(
      `평가라인 목록 조회 시작 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      const evaluationLines =
        await this.evaluationLineService.필터_조회한다(filter);
      const result = evaluationLines.map((line) => line.DTO로_변환한다());

      this.logger.debug(
        `평가라인 목록 조회 완료 - 조회된 개수: ${evaluationLines.length}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가라인 목록 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }
}
