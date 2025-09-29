import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { EvaluationPeriodService } from '../../../domain/core/evaluation-period/evaluation-period.service';
import { EvaluationPeriodDto } from '../../../domain/core/evaluation-period/evaluation-period.types';
import {
  GetActiveEvaluationPeriodsQuery,
  GetEvaluationPeriodDetailQuery,
  GetEvaluationPeriodListQuery,
  EvaluationPeriodListResult,
} from './evaluation-period.queries';

// ==================== 평가 기간 조회 쿼리 핸들러 ====================

/**
 * 활성 평가 기간 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetActiveEvaluationPeriodsQuery)
export class GetActiveEvaluationPeriodsQueryHandler
  implements
    IQueryHandler<GetActiveEvaluationPeriodsQuery, EvaluationPeriodDto[]>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    query: GetActiveEvaluationPeriodsQuery,
  ): Promise<EvaluationPeriodDto[]> {
    const activePeriods =
      await this.evaluationPeriodService.활성화된_평가기간_조회한다();
    return activePeriods as EvaluationPeriodDto[];
  }
}

/**
 * 평가 기간 상세 정보 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationPeriodDetailQuery)
export class GetEvaluationPeriodDetailQueryHandler
  implements
    IQueryHandler<GetEvaluationPeriodDetailQuery, EvaluationPeriodDto | null>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    query: GetEvaluationPeriodDetailQuery,
  ): Promise<EvaluationPeriodDto | null> {
    const period = await this.evaluationPeriodService.ID로_조회한다(
      query.periodId,
    );
    return period as EvaluationPeriodDto | null;
  }
}

/**
 * 평가 기간 목록 조회 쿼리 핸들러
 */
@Injectable()
@QueryHandler(GetEvaluationPeriodListQuery)
export class GetEvaluationPeriodListQueryHandler
  implements
    IQueryHandler<GetEvaluationPeriodListQuery, EvaluationPeriodListResult>
{
  constructor(
    private readonly evaluationPeriodService: EvaluationPeriodService,
  ) {}

  async execute(
    query: GetEvaluationPeriodListQuery,
  ): Promise<EvaluationPeriodListResult> {
    // TODO: 구현 예정 - 페이징 처리가 포함된 목록 조회
    // 현재는 전체 조회만 가능하므로 임시로 전체 조회 후 페이징 처리
    const allPeriods = await this.evaluationPeriodService.전체_조회한다();

    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const items = allPeriods.slice(startIndex, endIndex);

    return {
      items: items as EvaluationPeriodDto[],
      total: allPeriods.length,
      page: query.page,
      limit: query.limit,
    };
  }
}
