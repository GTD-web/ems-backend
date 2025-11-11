import { BaseE2ETest } from '../../../base-e2e.spec';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';

/**
 * 동료평가 대시보드 검증 시나리오
 *
 * 동료평가와 관련된 대시보드 상태를 검증합니다.
 * - 동료평가 상태 조회
 * - 동료평가 상태 변경 검증
 * - 동료평가 진행률 확인
 */
export class PeerEvaluationDashboardScenario {
  private dashboardApiClient: DashboardApiClient;
  protected testSuite: BaseE2ETest;

  constructor(testSuite: BaseE2ETest) {
    this.testSuite = testSuite;
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  // ==================== 대시보드 상태 조회 ====================

  /**
   * 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    const result =
      await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus({
        periodId: evaluationPeriodId,
        employeeId: employeeId,
      });

    expect(result.employee).toBeDefined();
    expect(result.evaluationPeriod).toBeDefined();
    expect(result.peerEvaluation).toBeDefined();
    expect(result.peerEvaluation.status).toBeDefined();
    expect(result.peerEvaluation.totalRequestCount).toBeDefined();
    expect(result.peerEvaluation.completedRequestCount).toBeDefined();

    return result;
  }

  /**
   * 직원의 평가 현황 및 할당 데이터를 통합 조회한다
   */
  async 직원의_평가_현황_및_할당_데이터를_통합_조회한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    const result = await this.dashboardApiClient.getEmployeeCompleteStatus({
      periodId: evaluationPeriodId,
      employeeId: employeeId,
    });

    expect(result.employee).toBeDefined();
    expect(result.evaluationPeriod).toBeDefined();
    expect(result.peerEvaluation).toBeDefined();
    expect(result.peerEvaluation.status).toBeDefined();
    expect(result.peerEvaluation.totalRequestCount).toBeDefined();
    expect(result.peerEvaluation.completedRequestCount).toBeDefined();

    return result;
  }

  // ==================== 동료평가 상태 검증 ====================

  /**
   * 동료평가 상태가 none인지 확인한다
   */
  async 동료평가_상태가_none인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.peerEvaluation.status).toBe('none');
    expect(status.peerEvaluation.totalRequestCount).toBe(0);
    expect(status.peerEvaluation.completedRequestCount).toBe(0);
  }

  /**
   * 동료평가 상태가 in_progress인지 확인한다
   */
  async 동료평가_상태가_in_progress인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    expectedTotalCount?: number,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.peerEvaluation.status).toBe('in_progress');
    expect(status.peerEvaluation.totalRequestCount).toBeGreaterThan(0);
    if (expectedTotalCount !== undefined) {
      expect(status.peerEvaluation.totalRequestCount).toBe(expectedTotalCount);
    }
    expect(status.peerEvaluation.completedRequestCount).toBeLessThanOrEqual(
      status.peerEvaluation.totalRequestCount,
    );
  }

  /**
   * 동료평가 상태가 complete인지 확인한다
   */
  async 동료평가_상태가_complete인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    expectedTotalCount?: number,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.peerEvaluation.status).toBe('complete');
    expect(status.peerEvaluation.totalRequestCount).toBeGreaterThan(0);
    if (expectedTotalCount !== undefined) {
      expect(status.peerEvaluation.totalRequestCount).toBe(expectedTotalCount);
    }
    expect(status.peerEvaluation.completedRequestCount).toBe(
      status.peerEvaluation.totalRequestCount,
    );
  }

  /**
   * 동료평가 상태 변경을 검증한다
   */
  async 동료평가_상태_변경을_검증한다(
    evaluationPeriodId: string,
    employeeId: string,
    expectedStatus: 'none' | 'in_progress' | 'complete',
    expectedTotalCount?: number,
    expectedCompletedCount?: number,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.peerEvaluation.status).toBe(expectedStatus);

    if (expectedTotalCount !== undefined) {
      expect(status.peerEvaluation.totalRequestCount).toBe(expectedTotalCount);
    }

    if (expectedCompletedCount !== undefined) {
      expect(status.peerEvaluation.completedRequestCount).toBe(
        expectedCompletedCount,
      );
    }

    // 상태별 추가 검증
    if (expectedStatus === 'none') {
      expect(status.peerEvaluation.totalRequestCount).toBe(0);
      expect(status.peerEvaluation.completedRequestCount).toBe(0);
    } else if (expectedStatus === 'complete') {
      expect(status.peerEvaluation.completedRequestCount).toBe(
        status.peerEvaluation.totalRequestCount,
      );
    } else if (expectedStatus === 'in_progress') {
      expect(status.peerEvaluation.totalRequestCount).toBeGreaterThan(0);
      expect(status.peerEvaluation.completedRequestCount).toBeLessThan(
        status.peerEvaluation.totalRequestCount,
      );
    }
  }

  /**
   * 동료평가 진행률을 계산한다
   */
  async 동료평가_진행률을_계산한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{
    progressRate: number;
    totalRequestCount: number;
    completedRequestCount: number;
  }> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    const totalRequestCount = status.peerEvaluation.totalRequestCount;
    const completedRequestCount = status.peerEvaluation.completedRequestCount;

    const progressRate =
      totalRequestCount > 0
        ? (completedRequestCount / totalRequestCount) * 100
        : 0;

    return {
      progressRate,
      totalRequestCount,
      completedRequestCount,
    };
  }
}
