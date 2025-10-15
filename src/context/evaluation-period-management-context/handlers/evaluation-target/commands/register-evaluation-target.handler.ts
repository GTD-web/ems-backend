import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EvaluationPeriodEmployeeMappingService } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '@domain/common/employee/employee.entity';

/**
 * 평가 대상자 등록 커맨드
 */
export class RegisterEvaluationTargetCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly createdBy: string,
  ) {}
}

/**
 * 평가 대상자 등록 커맨드 핸들러
 *
 * 특정 평가기간에 직원을 평가 대상자로 등록한다
 */
@CommandHandler(RegisterEvaluationTargetCommand)
export class RegisterEvaluationTargetHandler
  implements
    ICommandHandler<
      RegisterEvaluationTargetCommand,
      EvaluationPeriodEmployeeMappingDto
    >
{
  private readonly logger = new Logger(RegisterEvaluationTargetHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
    @InjectRepository(EvaluationPeriod)
    private readonly evaluationPeriodRepository: Repository<EvaluationPeriod>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  async execute(
    command: RegisterEvaluationTargetCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const { evaluationPeriodId, employeeId, createdBy } = command;

    this.logger.log(
      `평가 대상자 등록 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
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

      // 직원 존재 여부 검증
      const employee = await this.employeeRepository.findOne({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new NotFoundException(`직원을 찾을 수 없습니다: ${employeeId}`);
      }

      const result =
        await this.evaluationPeriodEmployeeMappingService.평가대상자를_등록한다(
          {
            evaluationPeriodId,
            employeeId,
            createdBy,
          },
        );

      this.logger.log(
        `평가 대상자 등록 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가 대상자 등록 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
