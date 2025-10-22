import { Injectable, Logger } from '@nestjs/common';
import { PerformanceEvaluationService } from '@context/performance-evaluation-context/performance-evaluation.service';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EvaluationPeriodManagementContextService } from '@context/evaluation-period-management-context/evaluation-period-management.service';

/**
 * 하향평가 비즈니스 서비스
 *
 * 하향평가 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 평가라인 검증
 * - 평가자 권한 확인
 * - 여러 컨텍스트 간 조율
 * - 알림 서비스 연동 (추후)
 */
@Injectable()
export class DownwardEvaluationBusinessService {
  private readonly logger = new Logger(DownwardEvaluationBusinessService.name);

  constructor(
    private readonly performanceEvaluationService: PerformanceEvaluationService,
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly evaluationPeriodManagementContextService: EvaluationPeriodManagementContextService,
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
}
