import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriod } from '../../../../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../../../../domain/common/employee/employee.entity';

/**
 * 평가 대상자 대량 등록 커맨드
 */
export class RegisterBulkEvaluationTargetsCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeIds: string[],
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 대상자 대량 등록 커맨드 핸들러
 *
 * 여러 직원을 한 번에 평가 대상자로 등록한다
 */
@CommandHandler(RegisterBulkEvaluationTargetsCommand)
export class RegisterBulkEvaluationTargetsHandler
  implements
    ICommandHandler<
      RegisterBulkEvaluationTargetsCommand,
      EvaluationPeriodEmployeeMappingDto[]
    >
{
  private readonly logger = new Logger(
    RegisterBulkEvaluationTargetsHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    command: RegisterBulkEvaluationTargetsCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto[]> {
    const { evaluationPeriodId, employeeIds, createdBy } = command;

    this.logger.log(
      `평가 대상자 대량 등록 시작 - 평가기간: ${evaluationPeriodId}, 직원 수: ${employeeIds.length}`,
    );

    try {
      // 평가기간 존재 여부 검증
      const evaluationPeriod = await this.evaluationPeriodRepository.findOne({
        where: { id: evaluationPeriodId },
      });

      if (!evaluationPeriod) {
        throw new NotFoundException(
          `평가기간을 찾을 수 없습니다: ${evaluationPeriodId}`,
        );
      }

      // 직원들 존재 여부 검증
      const uniqueEmployeeIds = Array.from(new Set(employeeIds));
      const employees = await this.employeeRepository.find({
        where: { id: In(uniqueEmployeeIds) },
      });

      if (employees.length !== uniqueEmployeeIds.length) {
        const foundIds = new Set(employees.map((e) => e.id));
        const notFoundIds = uniqueEmployeeIds.filter((id) => !foundIds.has(id));
        throw new NotFoundException(
          `다음 직원을 찾을 수 없습니다: ${notFoundIds.join(', ')}`,
        );
      }

      const results =
        await this.evaluationPeriodEmployeeMappingService.평가대상자를_대량_등록한다(
          evaluationPeriodId,
          employeeIds,
          createdBy,
        );

      this.logger.log(
        `평가 대상자 대량 등록 완료 - 평가기간: ${evaluationPeriodId}, 등록 수: ${results.length}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `평가 대상자 대량 등록 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
