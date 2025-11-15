import { BaseE2ETest } from '../../../base-e2e.spec';
import { EvaluationActivityLogApiClient } from './api-clients/evaluation-activity-log.api-client';

/**
 * 평가 활동 내역 검증 시나리오
 *
 * 평가 활동 내역 조회 및 검증 기능을 제공합니다.
 * 시나리오 문서를 기반으로 작성되었습니다.
 */
export class EvaluationActivityLogScenario {
  private apiClient: EvaluationActivityLogApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new EvaluationActivityLogApiClient(testSuite);
  }

  // ==================== 활동 내역 조회 ====================

  /**
   * 평가기간 피평가자 기준 활동 내역을 조회한다
   */
  async 활동_내역을_조회한다(config: {
    periodId: string;
    employeeId: string;
    activityType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.apiClient.getActivityLogs(config);
  }

  /**
   * 특정 활동 유형의 활동 내역을 조회한다
   */
  async 활동_유형별_내역을_조회한다(config: {
    periodId: string;
    employeeId: string;
    activityType: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.apiClient.getActivityLogs({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: config.activityType,
      page: config.page,
      limit: config.limit,
    });
  }

  /**
   * 날짜 범위로 활동 내역을 조회한다
   */
  async 날짜_범위별_내역을_조회한다(config: {
    periodId: string;
    employeeId: string;
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    return await this.apiClient.getActivityLogs({
      periodId: config.periodId,
      employeeId: config.employeeId,
      startDate: config.startDate,
      endDate: config.endDate,
      page: config.page,
      limit: config.limit,
    });
  }

  // ==================== 활동 내역 검증 ====================

  /**
   * WBS 자기평가 제출 활동 내역을 검증한다
   */
  async WBS자기평가_제출_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    activityTitle?: string; // 기본값: "WBS 자기평가 제출"
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'wbs_self_evaluation',
    });

    // 최신 활동 내역 확인
    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('wbs_self_evaluation');
    expect(latestActivity.activityAction).toBe('submitted');
    expect(latestActivity.activityTitle).toBe(
      config.activityTitle || 'WBS 자기평가 제출',
    );
    expect(latestActivity.relatedEntityType).toBe('wbs_self_evaluation');
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }
    expect(latestActivity.periodId).toBe(config.periodId);
    expect(latestActivity.employeeId).toBe(config.employeeId);
    expect(latestActivity.activityDescription).toBeDefined();
    expect(latestActivity.performedByName).toBeDefined();
    expect(latestActivity.activityDate).toBeDefined();

    return latestActivity;
  }

  /**
   * WBS 자기평가 제출 취소 활동 내역을 검증한다
   */
  async WBS자기평가_제출취소_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'wbs_self_evaluation',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('wbs_self_evaluation');
    expect(latestActivity.activityAction).toBe('cancelled');
    expect(latestActivity.activityTitle).toBe(
      'WBS 자기평가 제출 취소 (1차 평가자)',
    );
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }

    return latestActivity;
  }

  /**
   * 하향평가 일괄 제출 활동 내역을 검증한다
   */
  async 하향평가_일괄제출_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    evaluationType: 'primary' | 'secondary';
    submittedCount: number;
    skippedCount: number;
    failedCount: number;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'downward_evaluation',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('downward_evaluation');
    expect(latestActivity.activityAction).toBe('submitted');
    expect(latestActivity.activityTitle).toBe(
      config.evaluationType === 'primary'
        ? '1차 하향평가 일괄 제출'
        : '2차 하향평가 일괄 제출',
    );
    expect(latestActivity.relatedEntityType).toBe('downward_evaluation');
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }
    expect(latestActivity.activityMetadata).toBeDefined();
    expect(latestActivity.activityMetadata.evaluatorId).toBeDefined();
    expect(latestActivity.activityMetadata.evaluationType).toBe(
      config.evaluationType,
    );
    expect(latestActivity.activityMetadata.submittedCount).toBe(
      config.submittedCount,
    );
    expect(latestActivity.activityMetadata.skippedCount).toBe(
      config.skippedCount,
    );
    expect(latestActivity.activityMetadata.failedCount).toBe(
      config.failedCount,
    );
    expect(latestActivity.activityMetadata.bulkOperation).toBe(true);

    return latestActivity;
  }

  /**
   * 산출물 생성 활동 내역을 검증한다
   */
  async 산출물_생성_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    relatedEntityId: string;
    deliverableName: string;
    deliverableType: string;
    wbsItemId: string;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'deliverable',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('deliverable');
    expect(latestActivity.activityAction).toBe('created');
    expect(latestActivity.activityTitle).toBe('산출물 생성');
    expect(latestActivity.relatedEntityType).toBe('deliverable');
    expect(latestActivity.relatedEntityId).toBe(config.relatedEntityId);
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }
    expect(latestActivity.activityMetadata).toBeDefined();
    expect(latestActivity.activityMetadata.deliverableName).toBe(
      config.deliverableName,
    );
    expect(latestActivity.activityMetadata.deliverableType).toBe(
      config.deliverableType,
    );
    expect(latestActivity.activityMetadata.wbsItemId).toBe(config.wbsItemId);

    return latestActivity;
  }

  /**
   * 산출물 수정 활동 내역을 검증한다
   */
  async 산출물_수정_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    relatedEntityId: string;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'deliverable',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('deliverable');
    expect(latestActivity.activityAction).toBe('updated');
    expect(latestActivity.activityTitle).toBe('산출물 수정');
    expect(latestActivity.relatedEntityId).toBe(config.relatedEntityId);
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }

    return latestActivity;
  }

  /**
   * 산출물 삭제 활동 내역을 검증한다
   */
  async 산출물_삭제_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    relatedEntityId: string;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'deliverable',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('deliverable');
    expect(latestActivity.activityAction).toBe('deleted');
    expect(latestActivity.activityTitle).toBe('산출물 삭제');
    expect(latestActivity.relatedEntityId).toBe(config.relatedEntityId);
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }

    return latestActivity;
  }

  /**
   * 단계 승인 활동 내역을 검증한다
   */
  async 단계승인_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    step: 'criteria' | 'self' | 'primary' | 'secondary';
    action: 'approved' | 'revision_requested';
    revisionComment?: string;
    evaluatorId?: string;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'step_approval',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('step_approval');
    expect(latestActivity.activityAction).toBe(config.action);
    expect(latestActivity.relatedEntityType).toBe('step_approval');
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }

    // 단계별 제목 확인
    const expectedTitles: Record<string, Record<string, string>> = {
      criteria: {
        approved: '평가기준 설정 승인',
        revision_requested: '평가기준 설정 재작성 요청',
      },
      self: {
        approved: '자기평가 승인',
        revision_requested: '자기평가 재작성 요청',
      },
      primary: {
        approved: '1차 하향평가 승인',
        revision_requested: '1차 하향평가 재작성 요청',
      },
      secondary: {
        approved: '2차 하향평가 승인',
        revision_requested: '2차 하향평가 재작성 요청',
      },
    };

    expect(latestActivity.activityTitle).toBe(
      expectedTitles[config.step][config.action],
    );

    // 메타데이터 확인
    expect(latestActivity.activityMetadata).toBeDefined();
    expect(latestActivity.activityMetadata.step).toBe(config.step);
    expect(latestActivity.activityMetadata.status).toBeDefined();
    if (config.revisionComment) {
      expect(latestActivity.activityMetadata.revisionComment).toBe(
        config.revisionComment,
      );
    }
    if (config.evaluatorId) {
      expect(latestActivity.activityMetadata.evaluatorId).toBe(
        config.evaluatorId,
      );
    }

    return latestActivity;
  }

  /**
   * 재작성 완료 활동 내역을 검증한다
   */
  async 재작성완료_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
    step: 'criteria' | 'self' | 'primary' | 'secondary';
    requestId: string;
    responseComment: string;
    allCompleted: boolean;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'revision_request',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('revision_request');
    expect(latestActivity.activityAction).toBe('revision_completed');
    expect(latestActivity.relatedEntityType).toBe('revision_request');
    expect(latestActivity.relatedEntityId).toBe(config.requestId);
    expect(latestActivity.performedBy).toBe(config.performedBy);

    // 단계별 제목 확인
    const expectedTitles: Record<string, string> = {
      criteria: '평가기준 설정 재작성 완료',
      self: '자기평가 재작성 완료',
      primary: '1차 하향평가 재작성 완료',
      secondary: '2차 하향평가 재작성 완료',
    };

    expect(latestActivity.activityTitle).toBe(expectedTitles[config.step]);

    // 메타데이터 확인
    expect(latestActivity.activityMetadata).toBeDefined();
    expect(latestActivity.activityMetadata.step).toBe(config.step);
    expect(latestActivity.activityMetadata.responseComment).toBe(
      config.responseComment,
    );
    expect(latestActivity.activityMetadata.allCompleted).toBe(
      config.allCompleted,
    );

    return latestActivity;
  }

  /**
   * 평가기준 제출 활동 내역을 검증한다
   */
  async 평가기준_제출_활동내역을_검증한다(config: {
    periodId: string;
    employeeId: string;
    performedBy: string;
  }): Promise<any> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: 'evaluation_criteria',
    });

    const latestActivity = result.items[0];
    expect(latestActivity).toBeDefined();
    expect(latestActivity.activityType).toBe('evaluation_criteria');
    expect(latestActivity.activityAction).toBe('submitted');
    expect(latestActivity.activityTitle).toBe('평가기준 제출');
    expect(latestActivity.relatedEntityType).toBe('evaluation_criteria');
    // performedBy는 기본값이 아닌지 확인 (실제 사용자 ID가 저장되었는지 확인)
    expect(latestActivity.performedBy).toBeDefined();
    expect(latestActivity.performedBy).not.toBe(
      '00000000-0000-0000-0000-000000000001',
    );
    // config.performedBy가 제공된 경우에만 정확히 일치하는지 확인
    if (config.performedBy) {
      expect(latestActivity.performedBy).toBe(config.performedBy);
    }

    return latestActivity;
  }

  // ==================== 필터링 및 페이지네이션 검증 ====================

  /**
   * 활동 유형별 필터링을 검증한다
   */
  async 활동_유형별_필터링을_검증한다(config: {
    periodId: string;
    employeeId: string;
    activityType: string;
  }): Promise<void> {
    const result = await this.활동_유형별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      activityType: config.activityType,
    });

    // 모든 항목의 activityType이 일치하는지 확인
    result.items.forEach((item) => {
      expect(item.activityType).toBe(config.activityType);
    });
  }

  /**
   * 날짜 범위 필터링을 검증한다
   */
  async 날짜_범위_필터링을_검증한다(config: {
    periodId: string;
    employeeId: string;
    startDate: string;
    endDate: string;
  }): Promise<void> {
    const result = await this.날짜_범위별_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      startDate: config.startDate,
      endDate: config.endDate,
    });

    const startDate = new Date(config.startDate);
    const endDate = new Date(config.endDate);

    // 모든 항목의 activityDate가 범위 내인지 확인
    result.items.forEach((item) => {
      const activityDate = new Date(item.activityDate);
      expect(activityDate.getTime()).toBeGreaterThanOrEqual(
        startDate.getTime(),
      );
      expect(activityDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  }

  /**
   * 페이지네이션을 검증한다
   */
  async 페이지네이션을_검증한다(config: {
    periodId: string;
    employeeId: string;
    page: number;
    limit: number;
  }): Promise<{
    firstPage: any;
    secondPage: any;
  }> {
    // 첫 번째 페이지
    const firstPage = await this.활동_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      page: config.page,
      limit: config.limit,
    });

    expect(firstPage.items.length).toBeLessThanOrEqual(config.limit);
    expect(firstPage.page).toBe(config.page);
    expect(firstPage.limit).toBe(config.limit);
    expect(firstPage.total).toBeGreaterThanOrEqual(firstPage.items.length);

    // 두 번째 페이지
    const secondPage = await this.활동_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      page: config.page + 1,
      limit: config.limit,
    });

    // 두 페이지의 항목이 다른지 확인
    if (firstPage.items.length > 0 && secondPage.items.length > 0) {
      expect(firstPage.items[0].id).not.toBe(secondPage.items[0].id);
    }

    return { firstPage, secondPage };
  }

  /**
   * 정렬을 검증한다 (최신순)
   */
  async 정렬을_검증한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<void> {
    const result = await this.활동_내역을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
      limit: 10,
    });

    // activityDate 기준 내림차순 정렬 확인
    for (let i = 0; i < result.items.length - 1; i++) {
      const current = new Date(result.items[i].activityDate);
      const next = new Date(result.items[i + 1].activityDate);
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  }
}

