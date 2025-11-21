import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { 평가활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';
import { GetFinalEvaluationByEmployeePeriodQuery } from '@context/performance-evaluation-context/handlers/final-evaluation';

/**
 * 최종평가 비즈니스 서비스
 *
 * 최종평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 최종평가 저장
 * - 활동 내역 자동 기록
 */
@Injectable()
export class FinalEvaluationBusinessService {
  private readonly logger = new Logger(FinalEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 최종평가를 저장한다 (활동 내역 기록 포함)
   */
  async 최종평가를_저장한다(
    employeeId: string,
    periodId: string,
    evaluationGrade: string,
    jobGrade: any,
    jobDetailedGrade: any,
    finalComments: string | undefined,
    actionBy: string,
  ): Promise<string> {
    this.logger.log('최종평가 저장 시작', {
      employeeId,
      periodId,
      evaluationGrade,
    });

    // 기존 최종평가 확인 (생성/수정 여부 판단)
    const existingEvaluation =
      await this.performanceEvaluationService.직원_평가기간별_최종평가를_조회한다(
        new GetFinalEvaluationByEmployeePeriodQuery(employeeId, periodId),
      );

    const isNewEvaluation = !existingEvaluation;

    // 최종평가 저장
    const evaluationId =
      await this.performanceEvaluationService.최종평가를_저장한다(
        employeeId,
        periodId,
        evaluationGrade,
        jobGrade,
        jobDetailedGrade,
        finalComments,
        actionBy,
      );

    // 활동 내역 기록
    try {
      await this.commandBus.execute(
        new 평가활동내역을생성한다(
          periodId,
          employeeId,
          'final_evaluation',
          isNewEvaluation ? 'created' : 'updated',
          isNewEvaluation ? '최종평가 생성' : '최종평가 수정',
          undefined, // activityDescription
          'final_evaluation',
          evaluationId,
          actionBy,
          undefined, // performedByName
          {
            evaluationGrade,
            jobGrade,
            jobDetailedGrade,
          },
        ),
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 최종평가 저장은 정상 처리
      this.logger.warn('최종평가 저장 활동 내역 기록 실패', {
        evaluationId,
        employeeId,
        periodId,
        error: error.message,
      });
    }

    this.logger.log('최종평가 저장 완료', {
      evaluationId,
      isNewEvaluation,
    });

    return evaluationId;
  }
}
