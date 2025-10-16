import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { WbsSelfEvaluationService } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.service';
import { EvaluationWbsAssignmentService } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';

/**
 * 프로젝트별 WBS 자기평가 초기화 커맨드
 */
export class ResetWbsSelfEvaluationsByProjectCommand {
  constructor(
    public readonly employeeId: string,
    public readonly periodId: string,
    public readonly projectId: string,
    public readonly resetBy: string = '시스템',
  ) {}
}

/**
 * 초기화된 WBS 자기평가 상세 정보
 */
export interface ResetWbsSelfEvaluationByProjectDetail {
  evaluationId: string;
  wbsItemId: string;
  selfEvaluationContent: string;
  selfEvaluationScore: number;
  performanceResult?: string;
  wasCompleted: boolean;
}

/**
 * 초기화 실패한 WBS 자기평가 정보
 */
export interface FailedResetWbsSelfEvaluationByProject {
  evaluationId: string;
  wbsItemId: string;
  reason: string;
}

/**
 * 프로젝트별 WBS 자기평가 초기화 응답
 */
export interface ResetWbsSelfEvaluationsByProjectResponse {
  /** 초기화된 평가 개수 */
  resetCount: number;
  /** 초기화 실패한 평가 개수 */
  failedCount: number;
  /** 총 평가 개수 */
  totalCount: number;
  /** 초기화된 평가 상세 정보 */
  resetEvaluations: ResetWbsSelfEvaluationByProjectDetail[];
  /** 초기화 실패한 평가 정보 */
  failedResets: FailedResetWbsSelfEvaluationByProject[];
}

/**
 * 프로젝트별 WBS 자기평가 초기화 핸들러
 * 특정 직원의 특정 평가기간 + 프로젝트에 대한 모든 완료된 WBS 자기평가를 초기화합니다.
 */
@Injectable()
@CommandHandler(ResetWbsSelfEvaluationsByProjectCommand)
export class ResetWbsSelfEvaluationsByProjectHandler
  implements ICommandHandler<ResetWbsSelfEvaluationsByProjectCommand>
{
  private readonly logger = new Logger(
    ResetWbsSelfEvaluationsByProjectHandler.name,
  );

  constructor(
    private readonly wbsSelfEvaluationService: WbsSelfEvaluationService,
    private readonly evaluationWbsAssignmentService: EvaluationWbsAssignmentService,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  async execute(
    command: ResetWbsSelfEvaluationsByProjectCommand,
  ): Promise<ResetWbsSelfEvaluationsByProjectResponse> {
    const { employeeId, periodId, projectId, resetBy } = command;

    this.logger.log('프로젝트별 WBS 자기평가 초기화 시작', {
      employeeId,
      periodId,
      projectId,
    });

    return await this.transactionManager.executeTransaction(async () => {
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
        throw new BadRequestException('초기화할 자기평가가 존재하지 않습니다.');
      }

      this.logger.debug('프로젝트 자기평가 개수', {
        totalEvaluations: evaluations.length,
        projectEvaluations: projectEvaluations.length,
      });

      const resetEvaluations: ResetWbsSelfEvaluationByProjectDetail[] = [];
      const failedResets: FailedResetWbsSelfEvaluationByProject[] = [];

      // 5. 각 평가를 초기화 처리
      for (const evaluation of projectEvaluations) {
        try {
          const wasCompleted = evaluation.완료되었는가();

          // 이미 미완료 상태면 스킵
          if (!wasCompleted) {
            this.logger.debug(`이미 미완료 상태 스킵 - ID: ${evaluation.id}`);
            continue;
          }

          // 자기평가 완료 상태 초기화
          await this.wbsSelfEvaluationService.수정한다(
            evaluation.id,
            { isCompleted: false },
            resetBy,
          );

          resetEvaluations.push({
            evaluationId: evaluation.id,
            wbsItemId: evaluation.wbsItemId,
            selfEvaluationContent: evaluation.selfEvaluationContent,
            selfEvaluationScore: evaluation.selfEvaluationScore,
            performanceResult: evaluation.performanceResult,
            wasCompleted,
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

      const result: ResetWbsSelfEvaluationsByProjectResponse = {
        resetCount: resetEvaluations.length,
        failedCount: failedResets.length,
        totalCount: projectEvaluations.length,
        resetEvaluations,
        failedResets,
      };

      this.logger.log('프로젝트별 WBS 자기평가 초기화 완료', {
        employeeId,
        periodId,
        projectId,
        resetCount: result.resetCount,
        failedCount: result.failedCount,
      });

      // 초기화된 평가가 없으면 정보 로그
      if (resetEvaluations.length === 0) {
        this.logger.warn('초기화된 평가 없음 (모두 미완료 상태)', {
          totalCount: projectEvaluations.length,
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
