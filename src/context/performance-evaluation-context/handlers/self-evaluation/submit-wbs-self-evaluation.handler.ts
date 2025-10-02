import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { WbsSelfEvaluationMappingService } from '../../../../domain/core/wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

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
    private readonly wbsSelfEvaluationMappingService: WbsSelfEvaluationMappingService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(command: SubmitWbsSelfEvaluationCommand): Promise<void> {
    const { evaluationId, submittedBy } = command;

    this.logger.log('WBS 자기평가 제출 핸들러 실행', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 조회 검증
      const evaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new Error('존재하지 않는 자기평가입니다.');
      }

      // 점수 검증
      if (
        !evaluation.selfEvaluationContent ||
        !evaluation.selfEvaluationScore
      ) {
        throw new Error('평가 내용과 점수는 필수 입력 항목입니다.');
      }

      // 자기평가 ID로 매핑을 찾아서 완료 처리
      const mapping =
        await this.wbsSelfEvaluationMappingService.자가평가_ID로_조회한다(
          evaluationId,
        );

      if (mapping) {
        await this.wbsSelfEvaluationMappingService.자가평가를_완료한다(
          mapping.id,
          evaluationId,
          submittedBy,
        );
      } else {
        throw new Error('해당 자가평가에 대한 매핑을 찾을 수 없습니다.');
      }

      this.logger.log('WBS 자기평가 제출 완료', { evaluationId });
    });
  }
}
