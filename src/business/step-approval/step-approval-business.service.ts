import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { EvaluationActivityLogContextService } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';
import { StepApprovalStatus } from '@domain/sub/employee-evaluation-step-approval';

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
    private readonly activityLogContextService: EvaluationActivityLogContextService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
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

    // 해당 피평가자의 모든 1차 하향평가를 일괄 제출 처리
    const result =
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        primaryEvaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.PRIMARY,
        approvedBy,
      );

    // 하향평가가 없는 경우는 정상적인 상황일 수 있음 (아직 하향평가가 생성되지 않았을 수 있음)
    if (result.submittedCount === 0 && result.skippedCount === 0) {
      this.logger.debug(
        `1차 하향평가가 없어 제출 상태 변경을 건너뜀 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
      );
      return;
    }

    this.logger.log(
      `1차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}, 제출: ${result.submittedCount}, 건너뜀: ${result.skippedCount}`,
    );
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

    // 해당 평가자의 모든 2차 하향평가를 제출 처리
    // BulkSubmitDownwardEvaluationsCommand를 활용하여 처리
    const result =
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_제출한다(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        approvedBy,
      );

    // 하향평가가 없는 경우는 정상적인 상황일 수 있음 (아직 하향평가가 생성되지 않았을 수 있음)
    if (result.submittedCount === 0 && result.skippedCount === 0) {
      this.logger.debug(
        `2차 하향평가가 없어 제출 상태 변경을 건너뜀 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
      );
      return;
    }

    this.logger.log(
      `2차 하향평가 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}, 제출: ${result.submittedCount}, 건너뜀: ${result.skippedCount}`,
    );
  }

  /**
   * 평가기준 설정 재작성 요청 생성 및 제출 상태 초기화
   * 평가기준 설정 단계에서 재작성 요청(REVISION_REQUESTED) 생성 시 제출 상태를 초기화합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param updatedBy 처리자 ID
   */
  async 평가기준설정_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    revisionComment: string,
    updatedBy: string,
  ): Promise<void> {
    this.logger.log(
      `평가기준 설정 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1. 평가기준 제출 상태 초기화
    try {
      await this.evaluationCriteriaManagementService.평가기준_제출을_초기화한다(
        evaluationPeriodId,
        employeeId,
        updatedBy,
      );

      this.logger.log(
        `평가기준 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 초기화된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `평가기준 제출 상태 초기화 실패 (이미 초기화되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    // 2. 단계 승인 상태를 재작성 요청으로 변경
    await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: 'revision_requested' as StepApprovalStatus,
      revisionComment,
      updatedBy,
    });

    // 3. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId,
          employeeId,
          step: 'criteria',
          status: 'revision_requested' as StepApprovalStatus,
          revisionComment,
          updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }

    this.logger.log(
      `평가기준 설정 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 평가기준 설정 승인 시 제출 상태 변경
   * 평가기준 설정 단계에서 승인(APPROVED) 처리 시 제출 상태를 자동으로 변경합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param approvedBy 승인자 ID
   */
  async 평가기준설정_승인_시_제출상태_변경(
    evaluationPeriodId: string,
    employeeId: string,
    approvedBy: string,
  ): Promise<void> {
    this.logger.log(
      `평가기준 설정 승인 시 제출 상태 변경 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    try {
      await this.evaluationCriteriaManagementService.평가기준을_제출한다(
        evaluationPeriodId,
        employeeId,
        approvedBy,
      );

      this.logger.log(
        `평가기준 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
    } catch (error) {
      // 이미 제출된 상태일 수 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `평가기준 제출 상태 변경 실패 (이미 제출되었을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
        error,
      );
    }

    this.logger.log(
      `평가기준 설정 승인 시 제출 상태 변경 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 평가기준설정_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.평가기준설정_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'criteria',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }

  /**
   * 자기평가 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 자기평가_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.자기평가_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'self',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 일차하향평가_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'primary',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }

  /**
   * 2차 하향평가 단계 승인 상태를 변경한다 (활동 내역 기록 포함)
   */
  async 이차하향평가_확인상태를_변경한다(params: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    status: StepApprovalStatus;
    revisionComment?: string;
    updatedBy: string;
  }): Promise<void> {
    // 1. 단계 승인 상태 변경
    await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
      evaluationPeriodId: params.evaluationPeriodId,
      employeeId: params.employeeId,
      evaluatorId: params.evaluatorId,
      status: params.status,
      revisionComment: params.revisionComment,
      updatedBy: params.updatedBy,
    });

    // 2. 활동 내역 기록
    try {
      await this.activityLogContextService.단계승인_상태변경_활동내역을_기록한다(
        {
          evaluationPeriodId: params.evaluationPeriodId,
          employeeId: params.employeeId,
          step: 'secondary',
          status: params.status,
          revisionComment: params.revisionComment,
          updatedBy: params.updatedBy,
          evaluatorId: params.evaluatorId,
        },
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 단계 승인은 정상 처리
      this.logger.warn('단계 승인 상태 변경 활동 내역 기록 실패', {
        error: error.message,
      });
    }
  }
}
