import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';
import { RevisionRequestContextService } from '@context/revision-request-context/revision-request-context.service';
import { RecipientType } from '@domain/sub/evaluation-revision-request';

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
}
