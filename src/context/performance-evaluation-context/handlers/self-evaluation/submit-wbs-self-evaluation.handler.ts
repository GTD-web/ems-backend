import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 제출 커맨드
 */
export class SubmitWbsSelfEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 제출 핸들러
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationCommand)
export class SubmitWbsSelfEvaluationHandler
  implements ICommandHandler<SubmitWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(SubmitWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('WBS 자기평가 제출 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 조회 검증
      const evaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new BadRequestException('존재하지 않는 자기평가입니다.');
      }

      // 점수 검증
      if (
        !evaluation.selfEvaluationContent ||
        !evaluation.selfEvaluationScore
      ) {
        throw new BadRequestException(
          '평가 내용과 점수는 필수 입력 항목입니다.',
        );
      }

      // 자기평가 완료 처리
      const updatedEvaluation = await this.wbsSelfEvaluationService.수정한다(
        evaluationId,
        { isCompleted: true },
        submittedBy,
      );

      this.logger.log('WBS 자기평가 제출 완료', { evaluationId });

      return updatedEvaluation.DTO로_변환한다();
    });
  }
}
