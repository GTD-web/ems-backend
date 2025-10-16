import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * 직원의 전체 WBS 자기평가 제출 커맨드
 */
export class SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 제출된 WBS 자기평가 상세 정보
 */
export interface SubmittedWbsSelfEvaluationDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
  performanceResult?: string;
  completedAt: Date;
}

/**
 * 제출 실패한 WBS 자기평가 정보
 */
export interface FailedWbsSelfEvaluation {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
}

/**
 * 직원의 전체 WBS 자기평가 제출 응답
 */
export interface SubmitAllWbsSelfEvaluationsResponse {
  /** 제출된 평가 개수 */
  submittedCount: number;
  /** 제출 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 완료된 평가 상세 정보 */
  completedEvaluations: SubmittedWbsSelfEvaluationDetail[];
  /** 실패한 평가 상세 정보 */
  failedEvaluations: FailedWbsSelfEvaluation[];
}

/**
 * 직원의 전체 WBS 자기평가 제출 핸들러
 * 특정 직원의 특정 평가기간에 대한 모든 WBS 자기평가를 완료 처리합니다.
 */
@Injectable()
@CommandHandler(SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand)
export class SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler
  implements ICommandHandler<SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand>
{
  private readonly logger = new Logger(
    SubmitAllWbsSelfEvaluationsByEmployeePeriodHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitAllWbsSelfEvaluationsByEmployeePeriodCommand,
  ): Promise<SubmitAllWbsSelfEvaluationsResponse> {
    const { employeeId, periodId, submittedBy } = command;

    this.logger.log('직원의 전체 WBS 자기평가 제출 시작', {
      employeeId,
      periodId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 평가기간 조회 및 점수 범위 확인
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(periodId);

      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 해당 직원의 해당 기간 모든 자기평가 조회
      const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      if (evaluations.length === 0) {
        throw new BadRequestException('제출할 자기평가가 존재하지 않습니다.');
      }

      const completedEvaluations: SubmittedWbsSelfEvaluationDetail[] = [];
      const failedEvaluations: FailedWbsSelfEvaluation[] = [];

      // 각 평가를 완료 처리
      for (const evaluation of evaluations) {
        try {
          // 이미 완료된 평가는 스킵 (정보는 포함)
          if (evaluation.완료되었는가()) {
            this.logger.debug(`이미 완료된 평가 스킵 - ID: ${evaluation.id}`);
            completedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
              performanceResult: evaluation.performanceResult,
              completedAt: evaluation.completedAt || new Date(),
            });
            continue;
          }

          // 평가 내용과 점수 검증
          if (
            !evaluation.selfEvaluationContent ||
            !evaluation.selfEvaluationScore
          ) {
            failedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              reason: '평가 내용과 점수가 입력되지 않았습니다.',
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
            });
            continue;
          }

          // 점수 유효성 검증
          if (!evaluation.점수가_유효한가(maxScore)) {
            failedEvaluations.push({
              evaluationId: evaluation.id,
              wbsItemId: evaluation.wbsItemId,
              reason: `평가 점수가 유효하지 않습니다 (0 ~ ${maxScore} 사이여야 함).`,
              selfEvaluationContent: evaluation.selfEvaluationContent,
              selfEvaluationScore: evaluation.selfEvaluationScore,
            });
            continue;
          }

          // 자기평가 완료 처리
          const updatedEvaluation =
            await this.wbsSelfEvaluationService.수정한다(
              evaluation.id,
              { isCompleted: true },
              submittedBy,
            );

          completedEvaluations.push({
            evaluationId: updatedEvaluation.id,
            wbsItemId: updatedEvaluation.wbsItemId,
            selfEvaluationContent: updatedEvaluation.selfEvaluationContent,
            selfEvaluationScore: updatedEvaluation.selfEvaluationScore,
            performanceResult: updatedEvaluation.performanceResult,
            completedAt: updatedEvaluation.completedAt || new Date(),
          });

          this.logger.debug(`평가 완료 처리 성공 - ID: ${evaluation.id}`);
        } catch (error) {
          this.logger.error(
            `평가 완료 처리 실패 - ID: ${evaluation.id}`,
            error,
          );
          failedEvaluations.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            reason: error.message || '알 수 없는 오류가 발생했습니다.',
            selfEvaluationContent: evaluation.selfEvaluationContent,
            selfEvaluationScore: evaluation.selfEvaluationScore,
          });
        }
      }

      const result: SubmitAllWbsSelfEvaluationsResponse = {
        submittedCount: completedEvaluations.length,
        failedCount: failedEvaluations.length,
        totalCount: evaluations.length,
        completedEvaluations,
        failedEvaluations,
      };

      this.logger.log('직원의 전체 WBS 자기평가 제출 완료', {
        employeeId,
        periodId,
        submittedCount: result.submittedCount,
        failedCount: result.failedCount,
      });

      // 실패한 평가가 있으면 경고 로그
      if (failedEvaluations.length > 0) {
        this.logger.warn('일부 평가 제출 실패', {
          failedCount: failedEvaluations.length,
          failures: failedEvaluations,
        });
      }

      return result;
    });
  }
}
