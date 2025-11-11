import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 제출 커맨드 (피평가자 → 1차 평가자)
 */
export class SubmitWbsSelfEvaluationToEvaluatorCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 제출 핸들러 (피평가자 → 1차 평가자)
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationToEvaluatorCommand)
export class SubmitWbsSelfEvaluationToEvaluatorHandler
  implements ICommandHandler<SubmitWbsSelfEvaluationToEvaluatorCommand>
{
  private readonly logger = new Logger(
    SubmitWbsSelfEvaluationToEvaluatorHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationToEvaluatorCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, submittedBy } = command;

    this.logger.log(
      'WBS 자기평가 제출 핸들러 실행 (피평가자 → 1차 평가자)',
      { evaluationId },
    );

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 조회
      const evaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new NotFoundException(
          `자기평가를 찾을 수 없습니다. (ID: ${evaluationId})`,
        );
      }

      // 평가 내용과 점수 검증
      if (
        !evaluation.selfEvaluationContent ||
        !evaluation.selfEvaluationScore
      ) {
        throw new BadRequestException(
          '평가 내용과 점수는 필수 입력 항목입니다.',
        );
      }

      // 평가기간 조회 및 점수 범위 확인
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(evaluation.periodId);
      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${evaluation.periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 점수 유효성 검증
      if (!evaluation.점수가_유효한가(maxScore)) {
        throw new BadRequestException(
          `평가 점수가 유효하지 않습니다 (0 ~ ${maxScore} 사이여야 함).`,
        );
      }

      // 자기평가 제출 (피평가자 → 1차 평가자)
      await this.wbsSelfEvaluationService.피평가자가_1차평가자에게_제출한다(
        evaluation,
        submittedBy,
      );

      // 저장 후 최신 상태 조회
      const updatedEvaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!updatedEvaluation) {
        throw new NotFoundException(
          `자기평가를 찾을 수 없습니다. (ID: ${evaluationId})`,
        );
      }

      this.logger.log('WBS 자기평가 제출 완료 (피평가자 → 1차 평가자)', {
        evaluationId,
        submittedToEvaluator: updatedEvaluation.submittedToEvaluator,
      });

      return updatedEvaluation.DTO로_변환한다();
    });
  }
}








