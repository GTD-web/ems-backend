import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriodEmployeeMappingFilter } from '../../../../../domain/core/evaluation-period-employee-mapping/interfaces/evaluation-period-employee-mapping.interface';

/**
 * 필터로 평가대상자 조회 쿼리
 */
export class GetEvaluationTargetsByFilterQuery {
  constructor(public readonly filter: EvaluationPeriodEmployeeMappingFilter) {}
}

/**
 * 필터로 평가대상자 조회 쿼리 핸들러
 *
 * 필터 조건에 따라 평가 대상자 목록을 조회한다
 */
@QueryHandler(GetEvaluationTargetsByFilterQuery)
export class GetEvaluationTargetsByFilterHandler
  implements
    IQueryHandler<
      GetEvaluationTargetsByFilterQuery,
      EvaluationPeriodEmployeeMappingDto[]
    >
{
  private readonly logger = new Logger(
    GetEvaluationTargetsByFilterHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    query: GetEvaluationTargetsByFilterQuery,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    const { filter } = query;

    this.logger.debug(
      `필터로 평가대상자 조회 - 필터: ${JSON.stringify(filter)}`,
    );

    try {
      const results =
        await this.evaluationPeriodEmployeeMappingService.필터로_평가대상자를_조회한다(
          filter,
        );

      this.logger.debug(
        `필터로 평가대상자 조회 완료 - 대상자 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `필터로 평가대상자 조회 실패 - 필터: ${JSON.stringify(filter)}`,
        error.stack,
      );
      throw error;
    }
  }
}
