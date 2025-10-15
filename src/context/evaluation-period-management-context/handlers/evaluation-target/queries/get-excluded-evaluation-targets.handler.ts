import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가기간의 제외된 대상자 조회 쿼리
 */
export class GetExcludedEvaluationTargetsQuery {
  constructor(public readonly evaluationPeriodId: string) {}
}

/**
 * 평가기간의 제외된 대상자 조회 쿼리 핸들러
 *
 * 평가기간에서 제외된 평가 대상자 목록을 조회한다
 */
@QueryHandler(GetExcludedEvaluationTargetsQuery)
export class GetExcludedEvaluationTargetsHandler
  implements
    IQueryHandler<
      GetExcludedEvaluationTargetsQuery,
      EvaluationPeriodEmployeeMappingDto[]
    >
{
  private readonly logger = new Logger(
    GetExcludedEvaluationTargetsHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    query: GetExcludedEvaluationTargetsQuery,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    const { evaluationPeriodId } = query;

    this.logger.debug(
      `평가기간 제외 대상자 조회 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      const results =
        await this.evaluationPeriodEmployeeMappingService.평가기간의_제외된_대상자를_조회한다(
          evaluationPeriodId,
        );

      this.logger.debug(
        `평가기간 제외 대상자 조회 완료 - 평가기간: ${evaluationPeriodId}, 제외 대상자 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `평가기간 제외 대상자 조회 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
