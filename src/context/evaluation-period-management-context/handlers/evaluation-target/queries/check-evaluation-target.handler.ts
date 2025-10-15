import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';

/**
 * 평가 대상 여부 확인 쿼리
 */
export class CheckEvaluationTargetQuery {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
  ) {}
}

/**
 * 평가 대상 여부 확인 쿼리 핸들러
 *
 * 특정 평가기간에 특정 직원이 평가 대상인지 확인한다
 */
@QueryHandler(CheckEvaluationTargetQuery)
export class CheckEvaluationTargetHandler
  implements IQueryHandler<CheckEvaluationTargetQuery, boolean>
{
  private readonly logger = new Logger(CheckEvaluationTargetHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(query: CheckEvaluationTargetQuery): Promise<boolean> {
    const { evaluationPeriodId, employeeId } = query;

    this.logger.debug(
      `평가 대상 여부 확인 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      const isTarget =
        await this.evaluationPeriodEmployeeMappingService.평가대상_여부를_확인한다(
          evaluationPeriodId,
          employeeId,
        );

      this.logger.debug(
        `평가 대상 여부 확인 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 결과: ${isTarget}`,
      );

      return isTarget;
    } catch (error) {
      this.logger.error(
        `평가 대상 여부 확인 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
