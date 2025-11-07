import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 단계 승인 비즈니스 서비스
 *
 * 단계 승인 처리 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 단계 승인 상태 변경
 * - 승인 시 제출 상태 자동 변경
 * - 여러 컨텍스트 간 조율
 */
@Injectable()
export class StepApprovalBusinessService {
  private readonly logger = new Logger(StepApprovalBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly stepApprovalContextService: StepApprovalContextService,
  ) {}

  /**
   * 자기평가 승인 시 제출 상태 변경
   * 자기평가 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   * submittedToEvaluator와 submittedToManager 모두 true로 설정합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 자기평가_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `자기평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      // 1. 피평가자 → 1차 평가자 제출 상태 변경
      await this.performanceEvaluationService.직원의_전체_자기평가를_1차평가자에게_제출한다(
        employeeId,
        evaluationPeriodId,
        approvedBy,
      );

      this.logger.log(
        `피평가자 → 1차 평가자 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `피평가자 → 1차 평가자 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    try {
      // 2. 1차 평가자 → 관리자 제출 상태 변경
      await this.performanceEvaluationService.직원의_전체_WBS자기평가를_제출한다(
        employeeId,
        evaluationPeriodId,
        approvedBy,
      );

      this.logger.log(
        `1차 평가자 → 관리자 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `1차 평가자 → 관리자 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    this.logger.log(
      `자기평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 1차 하향평가 승인 시 제출 상태 변경
   * 1차 하향평가 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   * 해당 평가의 isCompleted를 true로 설정합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 일차_하향평가_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1차 평가자 조회
    const primaryEvaluatorId =
      await this.stepApprovalContextService.일차평가자를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

    if (!primaryEvaluatorId) {
      this.logger.warn(
        `1차 평가자를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
      return;
    }

    try {
      // 해당 피평가자의 모든 1차 하향평가를 일괄 제출 처리
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        approvedBy,
      );

      this.logger.log(
        `1차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `1차 하향평가 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
        error,
      );
    }
  }

  /**
   * 2차 하향평가 승인 시 제출 상태 변경
   * 2차 하향평가 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   * 해당 평가의 isCompleted를 true로 설정합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param evaluatorId 평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 이차_하향평가_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    try {
      // 해당 평가자의 모든 2차 하향평가를 제출 처리
      // BulkSubmitDownwardEvaluationsCommand를 활용하여 처리
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        approvedBy,
      );

      this.logger.log(
        `2차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `2차 하향평가 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
        error,
      );
    }
  }
}
