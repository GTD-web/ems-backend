import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { Employee } from '../../../../../domain/common/employee/employee.entity';

/**
 * 직원의 평가기간 맵핑 조회 쿼리
 */
export class GetEmployeeEvaluationPeriodsQuery {
  constructor(public readonly employeeId: string) {}
}

/**
 * 직원의 평가기간 맵핑 + 직원 정보 DTO
 */
export interface EmployeeEvaluationPeriodMappingWithEmployeeDto
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
 * 직원의 평가기간 맵핑 조회 쿼리 핸들러
 *
 * 특정 직원이 속한 평가기간 목록을 조회한다 (직원 정보 포함)
 */
@QueryHandler(GetEmployeeEvaluationPeriodsQuery)
export class GetEmployeeEvaluationPeriodsHandler
  implements
    IQueryHandler<
      GetEmployeeEvaluationPeriodsQuery,
      EmployeeEvaluationPeriodMappingWithEmployeeDto[]
    >
{
  private readonly logger = new Logger(
    GetEmployeeEvaluationPeriodsHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    query: GetEmployeeEvaluationPeriodsQuery,
  ): Promise<EmployeeEvaluationPeriodMappingWithEmployeeDto[]> {
    const { employeeId } = query;

    this.logger.debug(`직원 평가기간 맵핑 조회 - 직원: ${employeeId}`);

    try {
      const mappings =
        await this.evaluationPeriodEmployeeMappingService.직원의_평가기간_맵핑을_조회한다(
          employeeId,
        );

      // 직원 정보를 함께 조회
      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId, deletedAt: IsNull() },
      });

      const results: EmployeeEvaluationPeriodMappingWithEmployeeDto[] =
        mappings.map((mapping) => ({
          ...mapping,
          employee: {
            id: employee?.id || employeeId,
            employeeNumber: employee?.employeeNumber || '',
            name: employee?.name || '알 수 없음',
            email: employee?.email || '',
            departmentName: employee?.departmentName,
            rankName: employee?.rankName,
            status: employee?.status || '',
          },
        }));

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
