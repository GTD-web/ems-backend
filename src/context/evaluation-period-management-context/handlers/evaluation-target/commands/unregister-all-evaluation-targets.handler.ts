import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { EvaluationPeriodEmployeeMappingService } from '../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service';

/**
 * 평가기간의 모든 대상자 등록 해제 커맨드
 */
export class UnregisterAllEvaluationTargetsCommand {
  constructor(public readonly evaluationPeriodId: string) {}
}

/**
 * 평가기간의 모든 대상자 등록 해제 커맨드 핸들러
 *
 * 평가기간의 모든 평가 대상자를 제거한다 (평가기간 삭제 시 사용)
 */
@CommandHandler(UnregisterAllEvaluationTargetsCommand)
export class UnregisterAllEvaluationTargetsHandler
  implements ICommandHandler<UnregisterAllEvaluationTargetsCommand, number>
{
  private readonly logger = new Logger(
    UnregisterAllEvaluationTargetsHandler.name,
  );

  constructor(
    private readonly evaluationPeriodEmployeeMappingService: EvaluationPeriodEmployeeMappingService,
  ) {}

  async execute(
    command: UnregisterAllEvaluationTargetsCommand,
  ): Promise<number> {
    const { evaluationPeriodId } = command;

    this.logger.log(
      `평가기간 전체 대상자 등록 해제 시작 - 평가기간: ${evaluationPeriodId}`,
    );

    try {
      const deletedCount =
        await this.evaluationPeriodEmployeeMappingService.평가기간의_모든_대상자를_해제한다(
          evaluationPeriodId,
        );

      this.logger.log(
        `평가기간 전체 대상자 등록 해제 완료 - 평가기간: ${evaluationPeriodId}, 삭제 수: ${deletedCount}`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `평가기간 전체 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}`,
        error.stack,
      );
      throw error;
    }
  }
}
