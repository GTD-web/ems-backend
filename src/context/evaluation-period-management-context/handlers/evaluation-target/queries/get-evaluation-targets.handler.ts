import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가기간의 평가대상자 조회 쿼리
 */
export class GetEvaluationTargetsQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly includeExcluded: boolean = false,
  ) {}
}

/**
 * 평가기간의 평가대상자 조회 쿼리 핸들러
 *
 * 평가기간의 평가 대상자 목록을 조회한다
 */
@QueryHandler(GetEvaluationTargetsQuery)
export class GetEvaluationTargetsHandler
  implements
    IQueryHandler<
      GetEvaluationTargetsQuery,
      EvaluationPeriodEmployeeMappingDto[]
    >
{
  private readonly logger = new Logger(GetEvaluationTargetsHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    query: GetEvaluationTargetsQuery,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    const { evaluationPeriodId, includeExcluded } = query;

    this.logger.debug(
      `평가기간 평가대상자 조회 - 평가기간: ${evaluationPeriodId}, 제외자 포함: ${includeExcluded}`,
    );

    try {
      const results =
        await this.evaluationPeriodEmployeeMappingService.평가기간의_평가대상자를_조회한다(
          evaluationPeriodId,
          includeExcluded,
        );

      this.logger.debug(
        `평가기간 평가대상자 조회 완료 - 평가기간: ${evaluationPeriodId}, 대상자 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `평가기간 평가대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
