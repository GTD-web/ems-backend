import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import type { UpdateWbsSelfEvaluationData } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.types';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EmployeeEvaluationStepApprovalService } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.service';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval/employee-evaluation-step-approval.types';

/**
 * 직원의 전체 WBS 자기평가 초기화 커맨드 (1차 평가자 → 관리자 제출 취소)
 */
export class ResetAllWbsSelfEvaluationsByEmployeePeriodCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 초기화된 WBS 자기평가 정보
 */
export interface ResetWbsSelfEvaluationDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
  performanceResult?: string;
  wasSubmittedToManager: boolean;
}

/**
 * 초기화 실패한 WBS 자기평가 정보
 */
export interface FailedResetWbsSelfEvaluation {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
}

/**
 * 직원의 전체 WBS 자기평가 초기화 응답
 */
export interface ResetAllWbsSelfEvaluationsResponse {
  /** 초기화된 평가 개수 */
  resetCount: number;
  /** 초기화 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 초기화된 평가 상세 정보 */
  resetEvaluations: ResetWbsSelfEvaluationDetail[];
  /** 초기화 실패한 평가 정보 */
  failedResets: FailedResetWbsSelfEvaluation[];
}

/**
 * 직원의 전체 WBS 자기평가 초기화 핸들러 (1차 평가자 → 관리자 제출 취소)
 * 특정 직원의 특정 평가기간에 대한 모든 관리자 제출 완료된 WBS 자기평가를 초기화합니다.
 */
@Injectable()
@CommandHandler(ResetAllWbsSelfEvaluationsByEmployeePeriodCommand)
export class ResetAllWbsSelfEvaluationsByEmployeePeriodHandler
  implements ICommandHandler<ResetAllWbsSelfEvaluationsByEmployeePeriodCommand>
{
  private readonly logger = new Logger(
    ResetAllWbsSelfEvaluationsByEmployeePeriodHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly transactionManager: TransactionManagerService,
    @InjectRepository(EvaluationPeriodEmployeeMapping)
    private readonly mappingRepository: Repository<EvaluationPeriodEmployeeMapping>,
    private readonly stepApprovalService: EmployeeEvaluationStepApprovalService,
  ) {}

  async execute(
    command: ResetAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ): Promise<ResetAllWbsSelfEvaluationsResponse> {
    const { employeeId, periodId, resetBy } = command;

    this.logger.log('직원의 전체 WBS 자기평가 초기화 시작', {
      employeeId,
      periodId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 해당 직원의 해당 기간 모든 자기평가 조회
      const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      if (evaluations.length === 0) {
        throw new BadRequestException('초기화할 자기평가가 존재하지 않습니다.');
      }

      const resetEvaluations: ResetWbsSelfEvaluationDetail[] = [];
      const failedResets: FailedResetWbsSelfEvaluation[] = [];

      // 각 평가를 초기화 처리
      for (const evaluation of evaluations) {
        try {
          const wasSubmittedToManager =
            evaluation.일차평가자가_관리자에게_제출했는가();
          const wasSubmittedToEvaluator =
            evaluation.피평가자가_1차평가자에게_제출했는가();

          // 이미 관리자에게 미제출 상태면 스킵
          if (!wasSubmittedToManager) {
            this.logger.debug(
              `이미 관리자에게 미제출 상태 스킵 - ID: ${evaluation.id}`,
            );
            continue;
          }

          // 피평가자 → 1차 평가자, 1차 평가자 → 관리자 제출 상태 초기화 (재작성 요청 생성 시 모든 제출 상태 초기화)
          const updateData: UpdateWbsSelfEvaluationData = {
            submittedToManager: false,
            resetSubmittedToManagerAt: true,
          };

          if (wasSubmittedToEvaluator) {
            updateData.submittedToEvaluator = false;
            updateData.resetSubmittedToEvaluatorAt = true;
          }

          await this.wbsSelfEvaluationService.수정한다(
            evaluation.id,
            updateData,
            resetBy,
          );

          resetEvaluations.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            selfEvaluationContent: evaluation.selfEvaluationContent,
            selfEvaluationScore: evaluation.selfEvaluationScore,
            performanceResult: evaluation.performanceResult,
            wasSubmittedToManager,
          });

          this.logger.debug(`평가 초기화 성공 - ID: ${evaluation.id}`);
        } catch (error) {
          this.logger.error(`평가 초기화 실패 - ID: ${evaluation.id}`, error);
          failedResets.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            reason: error.message || '알 수 없는 오류가 발생했습니다.',
          });
        }
      }

      // 승인 상태는 변경하지 않음 (반려 후 재제출 시 기존 승인 상태 유지)
      if (resetEvaluations.length > 0) {
        this.logger.debug('승인 상태는 유지됨 (변경하지 않음)');
      }

      const result: ResetAllWbsSelfEvaluationsResponse = {
        resetCount: resetEvaluations.length,
        failedCount: failedResets.length,
        totalCount: evaluations.length,
        resetEvaluations,
        failedResets,
      };

      this.logger.log('직원의 전체 WBS 자기평가 초기화 완료', {
        employeeId,
        periodId,
        resetCount: result.resetCount,
        failedCount: result.failedCount,
      });

      // 초기화된 평가가 없으면 정보 로그
      if (resetEvaluations.length === 0) {
        this.logger.warn('초기화된 평가 없음 (모두 미완료 상태)', {
          totalCount: evaluations.length,
        });
      }

      // 실패한 초기화가 있으면 경고 로그
      if (failedResets.length > 0) {
        this.logger.warn('일부 평가 초기화 실패', {
          failedCount: failedResets.length,
          failures: failedResets,
        });
      }

      return result;
    });
  }
}
