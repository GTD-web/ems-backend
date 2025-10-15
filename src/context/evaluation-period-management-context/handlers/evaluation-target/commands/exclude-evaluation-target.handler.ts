import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';
import { EvaluationPeriodEmployeeMappingDto } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.types';

/**
 * 평가 대상에서 제외 커맨드
 */
export class ExcludeEvaluationTargetCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
    public readonly excludeReason: string,
    public readonly excludedBy: string,
  ) {}
}

/**
 * 평가 대상에서 제외 커맨드 핸들러
 *
 * 특정 직원을 평가 대상에서 제외한다
 */
@CommandHandler(ExcludeEvaluationTargetCommand)
export class ExcludeEvaluationTargetHandler
  implements
    ICommandHandler<
      ExcludeEvaluationTargetCommand,
      EvaluationPeriodEmployeeMappingDto
    >
{
  private readonly logger = new Logger(ExcludeEvaluationTargetHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    command: ExcludeEvaluationTargetCommand,
  ): Promise<EvaluationPeriodEmployeeMappingDto> {
    const { evaluationPeriodId, employeeId, excludeReason, excludedBy } =
      command;

    this.logger.log(
      `평가 대상 제외 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      const result =
        await this.evaluationPeriodEmployeeMappingService.평가대상에서_제외한다(
          evaluationPeriodId,
          employeeId,
          { excludeReason, excludedBy },
        );

      this.logger.log(
        `평가 대상 제외 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가 대상 제외 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
