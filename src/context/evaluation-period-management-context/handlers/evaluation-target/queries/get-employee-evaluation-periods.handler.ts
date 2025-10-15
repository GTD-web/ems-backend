import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 직원의 평가기간 맵핑 조회 쿼리
 */
export class GetEmployeeEvaluationPeriodsQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 직원의 평가기간 맵핑 조회 쿼리 핸들러
 *
 * 특정 직원이 속한 평가기간 목록을 조회한다
 */
@QueryHandler(GetEmployeeEvaluationPeriodsQuery)
export class GetEmployeeEvaluationPeriodsHandler
  implements
    IQueryHandler<
      GetEmployeeEvaluationPeriodsQuery,
      EvaluationPeriodEmployeeMappingDto[]
    >
{
  private readonly logger = new Logger(
    GetEmployeeEvaluationPeriodsHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    query: GetEmployeeEvaluationPeriodsQuery,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    const { employeeId } = query;

    this.logger.debug(`직원 평가기간 맵핑 조회 - 직원: ${employeeId}`);

    try {
      const results =
        await this.evaluationPeriodEmployeeMappingService.직원의_평가기간_맵핑을_조회한다(
          employeeId,
        );

      this.logger.debug(
        `직원 평가기간 맵핑 조회 완료 - 직원: ${employeeId}, 평가기간 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `직원 평가기간 맵핑 조회 실패 - 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
