import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * 단일 WBS 자기평가 초기화 커맨드 (1차 평가자 → 관리자 제출 취소)
 */
export class ResetWbsSelfEvaluationCommand {
  constructor(
    public readonly evaluationId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 단일 WBS 자기평가 초기화 핸들러 (1차 평가자 → 관리자 제출 취소)
 * 특정 WBS 자기평가의 관리자 제출 상태를 초기화합니다.
 */
@Injectable()
@CommandHandler(ResetWbsSelfEvaluationCommand)
export class ResetWbsSelfEvaluationHandler
  implements ICommandHandler<ResetWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(ResetWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ResetWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const { evaluationId, resetBy } = command;

    this.logger.log('WBS 자기평가 초기화 시작', { evaluationId });

    return await this.transactionManager.executeTransaction(async () => {
      // 자기평가 조회 검증
      const evaluation =
        await this.wbsSelfEvaluationService.조회한다(evaluationId);
      if (!evaluation) {
        throw new BadRequestException('존재하지 않는 자기평가입니다.');
      }

      // 이미 관리자에게 미제출 상태면 에러
      if (!evaluation.일차평가자가_관리자에게_제출했는가()) {
        throw new BadRequestException(
          '이미 관리자에게 미제출 상태인 자기평가입니다.',
        );
      }

      // 1차 평가자 → 관리자 제출 상태 초기화
      const updatedEvaluation = await this.wbsSelfEvaluationService.수정한다(
        evaluationId,
        { submittedToManager: false },
        resetBy,
      );

      this.logger.log('WBS 자기평가 초기화 완료', { evaluationId });

      return updatedEvaluation.DTO로_변환한다();
    });
  }
}
