import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationPeriodService } from '@domain/core/evaluation-period/evaluation-period.service';

/**
 * 프로젝트별 WBS 자기평가 제출 커맨드
 */
export class SubmitWbsSelfEvaluationsByProjectCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly submittedBy: string = '시스템',
  ) {}
}

/**
 * 제출된 WBS 자기평가 상세 정보
 */
export interface SubmittedWbsSelfEvaluationByProjectDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent: string;
  selfEvaluationScore: number;
  performanceResult?: string;
  completedAt: Date;
}

/**
 * 제출 실패한 WBS 자기평가 정보
 */
export interface FailedWbsSelfEvaluationByProject {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
  selfEvaluationContent?: string;
  selfEvaluationScore?: number;
}

/**
 * 프로젝트별 WBS 자기평가 제출 응답
 */
export interface SubmitWbsSelfEvaluationsByProjectResponse {
  /** 제출된 평가 개수 */
  submittedCount: number;
  /** 제출 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 제출된 평가 상세 정보 */
  completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetail[];
  /** 제출 실패한 평가 정보 */
  failedEvaluations: FailedWbsSelfEvaluationByProject[];
}

/**
 * 프로젝트별 WBS 자기평가 제출 핸들러
 * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 WBS 자기평가를 제출합니다.
 */
@Injectable()
@CommandHandler(SubmitWbsSelfEvaluationsByProjectCommand)
export class SubmitWbsSelfEvaluationsByProjectHandler
  implements ICommandHandler<SubmitWbsSelfEvaluationsByProjectCommand>
{
  private readonly logger = new Logger(
    SubmitWbsSelfEvaluationsByProjectHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly evaluationPeriodService: EvaluationPeriodService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: SubmitWbsSelfEvaluationsByProjectCommand,
  ): Promise<SubmitWbsSelfEvaluationsByProjectResponse> {
    const { employeeId, periodId, projectId, submittedBy } = command;

    this.logger.log('프로젝트별 WBS 자기평가 제출 시작', {
      employeeId,
      periodId,
      projectId,
    });

    return await this.transactionManager.executeTransaction(async () => {
      // 0. 평가기간 조회 및 점수 범위 확인
      const evaluationPeriod =
        await this.evaluationPeriodService.ID로_조회한다(periodId);

      if (!evaluationPeriod) {
        throw new BadRequestException(
          `평가기간을 찾을 수 없습니다. (periodId: ${periodId})`,
        );
      }

      const maxScore = evaluationPeriod.자기평가_달성률_최대값();

      // 1. 해당 프로젝트에 할당된 WBS 항목 조회
      const assignments =
        await this.evaluationWbsAssignmentService.필터_조회한다({
          employeeId,
          periodId,
          projectId,
        });

      if (assignments.length === 0) {
        throw new BadRequestException(
          '해당 프로젝트에 할당된 WBS가 존재하지 않습니다.',
        );
      }

      // 2. WBS 항목 ID 목록 추출
      const wbsItemIds = assignments.map((assignment) => assignment.wbsItemId);

      this.logger.debug('할당된 WBS 항목 개수', {
        count: wbsItemIds.length,
        wbsItemIds,
      });

      // 3. 해당 WBS 항목들의 자기평가 조회
      const evaluations = await this.wbsSelfEvaluationService.필터_조회한다({
        employeeId,
        periodId,
      });

      // 4. 프로젝트에 속한 WBS 항목의 평가만 필터링
      const projectEvaluations = evaluations.filter((evaluation) =>
        wbsItemIds.includes(evaluation.wbsItemId),
      );

      if (projectEvaluations.length === 0) {
        throw new BadRequestException('제출할 자기평가가 존재하지 않습니다.');
      }

      this.logger.debug('프로젝트 자기평가 개수', {
        totalEvaluations: evaluations.length,
        projectEvaluations: projectEvaluations.length,
      });

      const completedEvaluations: SubmittedWbsSelfEvaluationByProjectDetail[] =
        [];
      const failedEvaluations: FailedWbsSelfEvaluationByProject[] = [];

      // 5. 각 평가를 완료 처리
      for (const evaluation of projectEvaluations) {
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

          // 평가 완료 처리
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

      const result: SubmitWbsSelfEvaluationsByProjectResponse = {
        submittedCount: completedEvaluations.length,
        failedCount: failedEvaluations.length,
        totalCount: projectEvaluations.length,
        completedEvaluations,
        failedEvaluations,
      };

      this.logger.log('프로젝트별 WBS 자기평가 제출 완료', {
        employeeId,
        periodId,
        projectId,
        submittedCount: result.submittedCount,
        failedCount: result.failedCount,
      });

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
