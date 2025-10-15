import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';

/**
 * 평가 대상자 등록 해제 커맨드
 */
export class UnregisterEvaluationTargetCommand {
  constructor(
    public readonly evaluationPeriodId: string,
    public readonly employeeId: string,
  ) {}
}

/**
 * 평가 대상자 등록 해제 커맨드 핸들러
 *
 * 평가기간에서 직원을 완전히 제거한다 (소프트 삭제)
 */
@CommandHandler(UnregisterEvaluationTargetCommand)
export class UnregisterEvaluationTargetHandler
  implements ICommandHandler<UnregisterEvaluationTargetCommand, boolean>
{
  private readonly logger = new Logger(UnregisterEvaluationTargetHandler.name);

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(command: UnregisterEvaluationTargetCommand): Promise<boolean> {
    const { evaluationPeriodId, employeeId } = command;

    this.logger.log(
      `평가 대상자 등록 해제 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
    );

    try {
      const result =
        await this.evaluationPeriodEmployeeMappingService.평가대상자_등록을_해제한다(
          evaluationPeriodId,
          employeeId,
        );

      this.logger.log(
        `평가 대상자 등록 해제 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `평가 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`,
        error.stack,
      );
      throw error;
    }
  }
}
