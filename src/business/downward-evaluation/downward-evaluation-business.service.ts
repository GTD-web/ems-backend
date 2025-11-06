import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { StepApprovalContextService } from '@context/step-approval-context/step-approval-context.service';
import { RecipientType } from '@domain/sub/evaluation-revision-request';
import { DownwardEvaluationType } from '@domain/core/downward-evaluation/downward-evaluation.types';

/**
 * 하향평가 비즈니스 서비스
 *
 * 하향평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 평가라인 검증
 * - 평가자 권한 확인
 * - 여러 컨텍스트 간 조율
 * - 재작성 요청 자동 완료 처리
 * - 알림 서비스 연동 (추후)
 */
@Injectable()
export class DownwardEvaluationBusinessService {
  private readonly logger = new Logger(DownwardEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationPeriodManagementContextService: EvaluationPeriodManagementContextService,
    private readonly revisionRequestContextService: RevisionRequestContextService,
    private readonly stepApprovalContextService: StepApprovalContextService,
    // private readonly notificationService: NotificationService, // TODO: 알림 서비스 추가 시 주입
  ) {}

  /**
   * 1차 하향평가를 저장한다 (평가라인 검증 포함)
   */
  async 일차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    this.logger.log('1차 하향평가 저장 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
      wbsId: params.wbsId,
    });

    // 1. 평가라인 검증: 1차 평가자 권한 확인
    await this.evaluationCriteriaManagementService.평가라인을_검증한다(
      params.evaluateeId,
      params.evaluatorId,
      params.wbsId,
      'primary',
    );

    // 2. 평가 점수 범위 검증 (점수가 있는 경우에만)
    if (
      params.downwardEvaluationScore !== undefined &&
      params.downwardEvaluationScore !== null
    ) {
      await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(
        params.periodId,
        params.downwardEvaluationScore,
      );
    }

    // 3. 하향평가 저장 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.wbsId,
        params.selfEvaluationId,
        'primary',
        params.downwardEvaluationContent,
        params.downwardEvaluationScore,
        params.actionBy,
      );

    // 4. 알림 발송 (추후 구현)
    // TODO: 1차 하향평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'PRIMARY_DOWNWARD_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //     wbsId: params.wbsId,
    //   },
    // });

    this.logger.log('1차 하향평가 저장 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 2차 하향평가를 저장한다 (평가라인 검증 포함)
   */
  async 이차_하향평가를_저장한다(params: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
    actionBy: string;
  }): Promise<string> {
    this.logger.log('2차 하향평가 저장 비즈니스 로직 시작', {
      evaluatorId: params.evaluatorId,
      evaluateeId: params.evaluateeId,
      wbsId: params.wbsId,
    });

    // 1. 평가라인 검증: 2차 평가자 권한 확인
    await this.evaluationCriteriaManagementService.평가라인을_검증한다(
      params.evaluateeId,
      params.evaluatorId,
      params.wbsId,
      'secondary',
    );

    // 2. 평가 점수 범위 검증 (점수가 있는 경우에만)
    if (
      params.downwardEvaluationScore !== undefined &&
      params.downwardEvaluationScore !== null
    ) {
      await this.evaluationPeriodManagementContextService.평가_점수를_검증한다(
        params.periodId,
        params.downwardEvaluationScore,
      );
    }

    // 3. 하향평가 저장 (컨텍스트 호출)
    const evaluationId =
      await this.performanceEvaluationService.하향평가를_저장한다(
        params.evaluatorId,
        params.evaluateeId,
        params.periodId,
        params.wbsId,
        params.selfEvaluationId,
        'secondary',
        params.downwardEvaluationContent,
        params.downwardEvaluationScore,
        params.actionBy,
      );

    // 4. 알림 발송 (추후 구현)
    // TODO: 2차 하향평가 저장 알림 발송
    // await this.notificationService.send({
    //   type: 'SECONDARY_DOWNWARD_EVALUATION_SAVED',
    //   recipientId: params.evaluateeId,
    //   data: {
    //     evaluationId,
    //     evaluatorId: params.evaluatorId,
    //     wbsId: params.wbsId,
    //   },
    // });

    this.logger.log('2차 하향평가 저장 완료', { evaluationId });

    return evaluationId;
  }

  /**
   * 1차 하향평가를 제출하고 재작성 요청을 자동 완료 처리한다
   * 특정 피평가자에 대한 1차 하향평가를 제출하고,
   * 해당 평가기간에 발생한 1차 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  async 일차_하향평가를_제출하고_재작성요청을_완료한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 제출 및 재작성 요청 완료 처리 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );

    // 1. 1차 하향평가 제출
    await this.performanceEvaluationService.일차_하향평가를_제출한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      submittedBy,
    );

    // 2. 해당 평가기간에 발생한 1차 하향평가에 대한 재작성 요청 자동 완료 처리
    // 1차평가자에게 요청된 재작성 요청 완료 처리
    await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
      periodId,
      evaluateeId,
      'primary',
      evaluatorId,
      RecipientType.PRIMARY_EVALUATOR,
      '1차 하향평가 제출로 인한 재작성 완료 처리',
    );

    this.logger.log(
      `1차 하향평가 제출 및 재작성 요청 완료 처리 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );
  }

  /**
   * 2차 하향평가를 제출하고 재작성 요청을 자동 완료 처리한다
   * 특정 피평가자에 대한 2차 하향평가를 제출하고,
   * 해당 평가기간에 발생한 2차 하향평가에 대한 재작성 요청이 존재하면 자동 완료 처리합니다.
   */
  async 이차_하향평가를_제출하고_재작성요청을_완료한다(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluatorId: string,
    submittedBy: string,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 제출 및 재작성 요청 완료 처리 시작 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );

    // 1. 2차 하향평가 제출
    await this.performanceEvaluationService.이차_하향평가를_제출한다(
      evaluateeId,
      periodId,
      wbsId,
      evaluatorId,
      submittedBy,
    );

    // 2. 해당 평가기간에 발생한 2차 하향평가에 대한 재작성 요청 자동 완료 처리
    // 2차평가자에게 요청된 재작성 요청 완료 처리
    await this.revisionRequestContextService.제출자에게_요청된_재작성요청을_완료처리한다(
      periodId,
      evaluateeId,
      'secondary',
      evaluatorId,
      RecipientType.SECONDARY_EVALUATOR,
      '2차 하향평가 제출로 인한 재작성 완료 처리',
    );

    this.logger.log(
      `2차 하향평가 제출 및 재작성 요청 완료 처리 완료 - 피평가자: ${evaluateeId}, 평가기간: ${periodId}, 평가자: ${evaluatorId}`,
    );
  }

  /**
   * 1차 하향평가 재작성 요청 생성 및 제출 상태 초기화
   * 1차 하향평가 단계에서 재작성 요청이 생성될 때, 해당 평가기간의 1차 하향평가 제출 상태를 초기화합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param requestedBy 요청자 ID
   */
  async 일차_하향평가_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    revisionComment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `1차 하향평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );

    // 1. 1차 평가자 조회
    const primaryEvaluatorId =
      await this.stepApprovalContextService.일차평가자를_조회한다(
        evaluationPeriodId,
        employeeId,
      );

    if (!primaryEvaluatorId) {
      this.logger.warn(
        `1차 평가자를 찾을 수 없습니다 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
      );
      // 평가자가 없어도 재작성 요청은 생성할 수 있으므로 계속 진행
    } else {
      // 2. 해당 평가기간의 1차 하향평가 제출 상태 초기화 (isCompleted, completedAt)
      try {
        await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(
          primaryEvaluatorId,
          employeeId,
          evaluationPeriodId,
          DownwardEvaluationType.PRIMARY,
          requestedBy,
        );
      } catch (error) {
        // 하향평가가 없을 수도 있으므로 에러를 무시하고 계속 진행
        this.logger.warn(
          `1차 하향평가 초기화 실패 (하향평가가 없을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${primaryEvaluatorId}`,
          error,
        );
      }
    }

    // 3. 재작성 요청 생성
    await this.stepApprovalContextService.일차하향평가_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      status: 'revision_requested' as any,
      revisionComment,
      updatedBy: requestedBy,
    });

    this.logger.log(
      `1차 하향평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}`,
    );
  }

  /**
   * 2차 하향평가 재작성 요청 생성 및 제출 상태 초기화
   * 2차 하향평가 단계에서 재작성 요청이 생성될 때, 해당 평가기간의 특정 평가자의 2차 하향평가 제출 상태를 초기화합니다.
   *
   * @param evaluationPeriodId 평가기간 ID
   * @param employeeId 피평가자 ID
   * @param evaluatorId 평가자 ID
   * @param revisionComment 재작성 요청 코멘트
   * @param requestedBy 요청자 ID
   */
  async 이차_하향평가_재작성요청_생성_및_제출상태_초기화(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    revisionComment: string,
    requestedBy: string,
  ): Promise<void> {
    this.logger.log(
      `2차 하향평가 재작성 요청 생성 및 제출 상태 초기화 시작 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );

    // 1. 해당 평가기간의 특정 평가자의 2차 하향평가 제출 상태 초기화 (isCompleted, completedAt)
    try {
      await this.performanceEvaluationService.피평가자의_모든_하향평가를_일괄_초기화한다(
        evaluatorId,
        employeeId,
        evaluationPeriodId,
        DownwardEvaluationType.SECONDARY,
        requestedBy,
      );
    } catch (error) {
      // 하향평가가 없을 수도 있으므로 에러를 무시하고 계속 진행
      this.logger.warn(
        `2차 하향평가 초기화 실패 (하향평가가 없을 수 있음) - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
        error,
      );
    }

    // 2. 재작성 요청 생성
    await this.stepApprovalContextService.이차하향평가_확인상태를_변경한다({
      evaluationPeriodId,
      employeeId,
      evaluatorId,
      status: 'revision_requested' as any,
      revisionComment,
      updatedBy: requestedBy,
    });

    this.logger.log(
      `2차 하향평가 재작성 요청 생성 및 제출 상태 초기화 완료 - 직원: ${employeeId}, 평가기간: ${evaluationPeriodId}, 평가자: ${evaluatorId}`,
    );
  }
}
