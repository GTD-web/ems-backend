import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { Employee } from '../../../../../domain/common/employee/employee.entity';
import { EvaluationTargetWithEmployeeDto } from './get-evaluation-targets.handler';

/**
 * 평가기간의 제외된 대상자 조회 쿼리
 */
export class GetExcludedEvaluationTargetsQuery {
  constructor(public readonly evaluationPeriodId: string) {}
}

/**
 * 평가기간의 제외된 대상자 조회 쿼리 핸들러
 *
 * 평가기간에서 제외된 평가 대상자 목록을 조회한다 (직원 정보 포함)
 */
@QueryHandler(GetExcludedEvaluationTargetsQuery)
export class GetExcludedEvaluationTargetsHandler
  implements
    IQueryHandler<
      GetExcludedEvaluationTargetsQuery,
      EvaluationTargetWithEmployeeDto[]
    >
{
  private readonly logger = new Logger(
    GetExcludedEvaluationTargetsHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    query: GetExcludedEvaluationTargetsQuery,
  ): Promise<EvaluationTargetWithEmployeeDto[]> {
    const { evaluationPeriodId } = query;

    this.logger.debug(
      `평가기간 제외 대상자 조회 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      const mappings =
        await this.evaluationPeriodEmployeeMappingService.평가기간의_제외된_대상자를_조회한다(
          evaluationPeriodId,
        );

      // 직원 정보를 함께 조회
      const results: EvaluationTargetWithEmployeeDto[] = await Promise.all(
        mappings.map(async (mapping) => {
          const employee = await this.employeeRepository.findOne({
            where: { id: mapping.employeeId, deletedAt: IsNull() },
          });

          return {
            ...mapping,
            employee: {
              id: employee?.id || mapping.employeeId,
              employeeNumber: employee?.employeeNumber || '',
              name: employee?.name || '알 수 없음',
              email: employee?.email || '',
              departmentName: employee?.departmentName,
              rankName: employee?.rankName,
              status: employee?.status || '',
            },
          };
        }),
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
