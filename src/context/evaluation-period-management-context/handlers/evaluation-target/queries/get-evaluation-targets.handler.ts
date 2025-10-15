import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { Employee } from '../../../../../domain/common/employee/employee.entity';

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
 * 평가 대상자 맵핑 + 직원 정보 DTO
 */
export interface EvaluationTargetWithEmployeeDto
  extends EvaluationPeriodEmployeeMappingDto {
  employee: {
    id: string;
    employeeNumber: string;
    name: string;
    email: string;
    departmentName?: string;
    rankName?: string;
    status: string;
  };
}

/**
 * 평가기간의 평가대상자 조회 쿼리 핸들러
 *
 * 평가기간의 평가 대상자 목록을 조회한다 (직원 정보 포함)
 */
@QueryHandler(GetEvaluationTargetsQuery)
export class GetEvaluationTargetsHandler
  implements
    IQueryHandler<GetEvaluationTargetsQuery, EvaluationTargetWithEmployeeDto[]>
{
  private readonly logger = new Logger(GetEvaluationTargetsHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    query: GetEvaluationTargetsQuery,
  ): Promise<EvaluationTargetWithEmployeeDto[]> {
    const { evaluationPeriodId, includeExcluded } = query;

    this.logger.debug(
      `평가기간 평가대상자 조회 - 평가기간: ${evaluationPeriodId}, 제외자 포함: ${includeExcluded}`,
    );

    try {
      const mappings =
        await this.evaluationPeriodEmployeeMappingService.평가기간의_평가대상자를_조회한다(
          evaluationPeriodId,
          includeExcluded,
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
