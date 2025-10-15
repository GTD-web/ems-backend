import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가 대상에 포함 커맨드 (제외 취소)
 */
export class IncludeEvaluationTargetCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly updatedBy: string,
  ) {}
}

/**
 * 평가 대상에 포함 커맨드 핸들러
 *
 * 제외되었던 직원을 다시 평가 대상에 포함한다
 */
@CommandHandler(IncludeEvaluationTargetCommand)
export class IncludeEvaluationTargetHandler
  implements
    ICommandHandler<
      IncludeEvaluationTargetCommand,
      EvaluationPeriodEmployeeMappingDto
    >
{
  private readonly logger = new Logger(IncludeEvaluationTargetHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    command: IncludeEvaluationTargetCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const { evaluationPeriodId, employeeId, updatedBy } = command;

    this.logger.log(
      `평가 대상 포함 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      const result =
        await this.evaluationPeriodEmployeeMappingService.평가대상에_포함한다(
          evaluationPeriodId,
          employeeId,
          { updatedBy },
        );

      this.logger.log(
        `평가 대상 포함 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가 대상 포함 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
