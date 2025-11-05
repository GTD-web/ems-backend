import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationAlreadyCompletedException,
  DownwardEvaluationValidationException,
} from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 피평가자의 모든 하향평가 일괄 제출 커맨드
 */
export class BulkSubmitDownwardEvaluationsCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly evaluationType: DownwardEvaluationType,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 피평가자의 모든 하향평가 일괄 제출 핸들러
 */
@Injectable()
@CommandHandler(BulkSubmitDownwardEvaluationsCommand)
export class BulkSubmitDownwardEvaluationsHandler
  implements ICommandHandler<BulkSubmitDownwardEvaluationsCommand>
{
  private readonly logger = new Logger(BulkSubmitDownwardEvaluationsHandler.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: BulkSubmitDownwardEvaluationsCommand,
  ): Promise<{
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
    submittedIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const { evaluatorId, evaluateeId, periodId, evaluationType, submittedBy } =
      command;

    this.logger.log('피평가자의 모든 하향평가 일괄 제출 핸들러 실행', {
      evaluatorId,
      evaluateeId,
      periodId,
      evaluationType,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 해당 평가자가 담당하는 피평가자의 모든 하향평가 조회
      const evaluations = await this.downwardEvaluationRepository.find({
        where: {
          evaluatorId,
          employeeId: evaluateeId,
          periodId,
          evaluationType,
          deletedAt: null as any,
        },
      });

      if (evaluations.length === 0) {
        throw new DownwardEvaluationNotFoundException(
          `하향평가를 찾을 수 없습니다. (evaluatorId: ${evaluatorId}, evaluateeId: ${evaluateeId}, periodId: ${periodId}, evaluationType: ${evaluationType})`,
        );
      }

      const submittedIds: string[] = [];
      const skippedIds: string[] = [];
      const failedItems: Array<{ evaluationId: string; error: string }> = [];

      // 각 평가를 순회하며 제출 처리
      for (const evaluation of evaluations) {
        try {
          // 이미 완료된 평가는 건너뛰기
          if (evaluation.완료되었는가()) {
            skippedIds.push(evaluation.id);
            this.logger.debug(
              `이미 완료된 평가는 건너뜀: ${evaluation.id}`,
            );
            continue;
          }

          // 필수 항목 검증
          if (
            !evaluation.downwardEvaluationContent ||
            !evaluation.downwardEvaluationScore
          ) {
            failedItems.push({
              evaluationId: evaluation.id,
              error: '평가 내용과 점수는 필수 입력 항목입니다.',
            });
            this.logger.warn(
              `필수 항목 누락으로 제출 실패: ${evaluation.id}`,
            );
            continue;
          }

          // 하향평가 완료 처리
          await this.downwardEvaluationService.수정한다(
            evaluation.id,
            { isCompleted: true },
            submittedBy,
          );

          submittedIds.push(evaluation.id);
          this.logger.debug(`하향평가 제출 완료: ${evaluation.id}`);
        } catch (error) {
          failedItems.push({
            evaluationId: evaluation.id,
            error: error instanceof Error ? error.message : String(error),
          });
          this.logger.error(
            `하향평가 제출 실패: ${evaluation.id}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      const result = {
        submittedCount: submittedIds.length,
        skippedCount: skippedIds.length,
        failedCount: failedItems.length,
        submittedIds,
        skippedIds,
        failedItems,
      };

      this.logger.log('피평가자의 모든 하향평가 일괄 제출 완료', {
        totalCount: evaluations.length,
        ...result,
      });

      return result;
    });
  }
}


