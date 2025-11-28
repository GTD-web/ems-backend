import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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

      // 재직중 직원만 평가 대상자로 등록 가능
      if (employee.status !== '재직중') {
        throw new BadRequestException(
          `재직중인 직원만 평가 대상자로 등록할 수 있습니다. 현재 상태: ${employee.status}`,
        );
      }

      // 평가 대상자 등록
      let result =
        await this.evaluationPeriodEmployeeMappingService.평가대상자를_등록한다(
          {
            evaluationPeriodId,
            employeeId,
            createdBy,
          },
        );

      // 직원이 조회 제외 목록에 있으면 평가 대상에서도 자동 제외
      if (employee.isExcludedFromList) {
        this.logger.log(
          `직원이 조회 제외 목록에 있어 평가 대상에서도 제외 처리 - 직원: ${employeeId}`,
        );
        
        result = await this.evaluationPeriodEmployeeMappingService.평가대상에서_제외한다(
          evaluationPeriodId,
          employeeId,
          {
            excludeReason: '조회 제외 목록에 있는 직원',
            excludedBy: createdBy,
          },
        );
      }

      this.logger.log(
        `평가 대상자 등록 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}, 제외 여부: ${result.isExcluded}`,
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
