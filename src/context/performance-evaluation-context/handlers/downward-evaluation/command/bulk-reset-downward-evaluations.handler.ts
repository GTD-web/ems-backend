import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { DownwardEvaluationService } from '@domain/core/downward-evaluation/downward-evaluation.service';
import {
  DownwardEvaluationNotFoundException,
  DownwardEvaluationNotCompletedException,
} from '@domain/core/downward-evaluation/downward-evaluation.exceptions';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';

/**
 * 피평가자의 모든 하향평가 일괄 초기화 커맨드
 */
export class BulkResetDownwardEvaluationsCommand {
  constructor(
    public readonly evaluatorId: string,
    public readonly evaluateeId: string,
    public readonly periodId: string,
    public readonly evaluationType: DownwardEvaluationType,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 피평가자의 모든 하향평가 일괄 초기화 핸들러
 */
@Injectable()
@CommandHandler(BulkResetDownwardEvaluationsCommand)
export class BulkResetDownwardEvaluationsHandler
  implements ICommandHandler<BulkResetDownwardEvaluationsCommand>
{
  private readonly logger = new Logger(BulkResetDownwardEvaluationsHandler.name);

  constructor(
    @InjectRepository(DownwardEvaluation)
    private readonly downwardEvaluationRepository: Repository<DownwardEvaluation>,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly downwardEvaluationService: DownwardEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
  ) {}

  async execute(
    command: BulkResetDownwardEvaluationsCommand,
  ): Promise<{
    resetCount: number;
    skippedCount: number;
    failedCount: number;
    resetIds: string[];
    skippedIds: string[];
    failedItems: Array<{ evaluationId: string; error: string }>;
  }> {
    const { evaluatorId, evaluateeId, periodId, evaluationType, resetBy } =
      command;

    this.logger.log('피평가자의 모든 하향평가 일괄 초기화 핸들러 실행', {
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

      const resetIds: string[] = [];
      const skippedIds: string[] = [];
      const failedItems: Array<{ evaluationId: string; error: string }> = [];

      // 각 평가를 순회하며 초기화 처리
      for (const evaluation of evaluations) {
        try {
          // 이미 미제출 상태인 평가는 건너뛰기
          if (!evaluation.완료되었는가()) {
            skippedIds.push(evaluation.id);
            this.logger.debug(
              `이미 미제출 상태인 평가는 건너뜀: ${evaluation.id}`,
            );
            continue;
          }

          // 하향평가 미제출 상태로 변경
          await this.downwardEvaluationService.수정한다(
            evaluation.id,
            { isCompleted: false },
            resetBy,
          );

          resetIds.push(evaluation.id);
          this.logger.debug(`하향평가 초기화 완료: ${evaluation.id}`);
        } catch (error) {
          failedItems.push({
            evaluationId: evaluation.id,
            error: error instanceof Error ? error.message : String(error),
          });
          this.logger.error(
            `하향평가 초기화 실패: ${evaluation.id}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      // 승인 상태는 변경하지 않음 (반려 후 재제출 시 기존 승인 상태 유지)
      if (resetIds.length > 0) {
        this.logger.debug(
          `승인 상태는 유지됨 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가유형: ${evaluationType}`,
        );
      }

      const result = {
        resetCount: resetIds.length,
        skippedCount: skippedIds.length,
        failedCount: failedItems.length,
        resetIds,
        skippedIds,
        failedItems,
      };

      this.logger.log('피평가자의 모든 하향평가 일괄 초기화 완료', {
        totalCount: evaluations.length,
        ...result,
      });

      return result;
    });
  }
}


