import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { WbsSelfEvaluationDto } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';

/**
 * WBS 자기평가 Upsert 커맨드
 */
export class UpsertWbsSelfEvaluationCommand {
  constructor(
    public readonly periodId: string,
    public readonly employeeId: string,
    public readonly wbsItemId: string,
    public readonly selfEvaluationContent: string,
    public readonly selfEvaluationScore: number,
    public readonly performanceResult?: string,
    public readonly actionBy: string = '시스템',
  ) {}
}

/**
 * WBS 자기평가 Upsert 핸들러
 * 기존 자기평가가 있으면 수정, 없으면 생성합니다.
 */
@Injectable()
@CommandHandler(UpsertWbsSelfEvaluationCommand)
export class UpsertWbsSelfEvaluationHandler
  implements ICommandHandler<UpsertWbsSelfEvaluationCommand>
{
  private readonly logger = new Logger(UpsertWbsSelfEvaluationHandler.name);

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: UpsertWbsSelfEvaluationCommand,
  ): Promise<WbsSelfEvaluationDto> {
    const {
      periodId,
      employeeId,
      wbsItemId,
      selfEvaluationContent,
      selfEvaluationScore,
      performanceResult,
      actionBy,
    } = command;

    this.logger.log('WBS 자기평가 Upsert 핸들러 실행', {
      periodId,
      employeeId,
      wbsItemId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 기존 자기평가 조회
      const existingEvaluations =
        await this.wbsSelfEvaluationService.필터_조회한다({
          periodId,
          employeeId,
          wbsItemId,
        });

      let evaluation;

      if (existingEvaluations.length > 0) {
        // 기존 자기평가 수정
        const existing = existingEvaluations[0];
        this.logger.log('기존 자기평가 수정', {
          evaluationId: existing.id,
        });

        evaluation = await this.wbsSelfEvaluationService.수정한다(
          existing.id,
          {
            selfEvaluationContent,
            selfEvaluationScore,
            performanceResult,
          },
          actionBy,
        );
      } else {
        // 새로운 자기평가 생성
        this.logger.log('새로운 자기평가 생성', {
          employeeId,
          wbsItemId,
        });

        evaluation = await this.wbsSelfEvaluationService.생성한다({
          periodId,
          employeeId,
          wbsItemId,
          assignedBy: actionBy,
          selfEvaluationContent,
          selfEvaluationScore,
          performanceResult,
          createdBy: actionBy,
        });
      }

      this.logger.log('WBS 자기평가 저장 완료', {
        evaluationId: evaluation.id,
      });

      return evaluation.DTO로_변환한다();
    });
  }
}
