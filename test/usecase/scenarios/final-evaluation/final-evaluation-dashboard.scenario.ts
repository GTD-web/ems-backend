import { BaseE2ETest } from '../../../base-e2e.spec';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';

/**
 * 최종평가 대시보드 검증 시나리오
 *
 * 최종평가와 관련된 대시보드 상태를 검증합니다.
 * - 최종평가 상태 조회
 * - 최종평가 상태 변경 검증
 * - 최종평가 목록 조회
 */
export class FinalEvaluationDashboardScenario {
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
    expect(result.finalEvaluation).toBeDefined();
    expect(result.finalEvaluation.status).toBeDefined();
    expect(result.finalEvaluation.isConfirmed).toBeDefined();

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
    expect(result.finalEvaluation).toBeDefined();
    expect(result.finalEvaluation.status).toBeDefined();
    expect(result.finalEvaluation.isConfirmed).toBeDefined();

    return result;
  }

  // ==================== 최종평가 상태 검증 ====================

  /**
   * 최종평가 상태가 none인지 확인한다
   */
  async 최종평가_상태가_none인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.finalEvaluation.status).toBe('none');
    expect(status.finalEvaluation.isConfirmed).toBe(false);
    expect(status.finalEvaluation.confirmedAt).toBeNull();
  }

  /**
   * 최종평가 상태가 in_progress인지 확인한다
   */
  async 최종평가_상태가_in_progress인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    expectedEvaluationGrade?: string,
    expectedJobGrade?: string,
    expectedJobDetailedGrade?: string,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.finalEvaluation.status).toBe('in_progress');
    expect(status.finalEvaluation.isConfirmed).toBe(false);
    expect(status.finalEvaluation.confirmedAt).toBeNull();

    if (expectedEvaluationGrade) {
      expect(status.finalEvaluation.evaluationGrade).toBe(
        expectedEvaluationGrade,
      );
    }
    if (expectedJobGrade) {
      expect(status.finalEvaluation.jobGrade).toBe(expectedJobGrade);
    }
    if (expectedJobDetailedGrade) {
      expect(status.finalEvaluation.jobDetailedGrade).toBe(
        expectedJobDetailedGrade,
      );
    }
  }

  /**
   * 최종평가 상태가 complete인지 확인한다
   */
  async 최종평가_상태가_complete인지_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
    expectedEvaluationGrade?: string,
    expectedJobGrade?: string,
    expectedJobDetailedGrade?: string,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.finalEvaluation.status).toBe('complete');
    expect(status.finalEvaluation.isConfirmed).toBe(true);
    expect(status.finalEvaluation.confirmedAt).toBeDefined();

    if (expectedEvaluationGrade) {
      expect(status.finalEvaluation.evaluationGrade).toBe(
        expectedEvaluationGrade,
      );
    }
    if (expectedJobGrade) {
      expect(status.finalEvaluation.jobGrade).toBe(expectedJobGrade);
    }
    if (expectedJobDetailedGrade) {
      expect(status.finalEvaluation.jobDetailedGrade).toBe(
        expectedJobDetailedGrade,
      );
    }
  }

  /**
   * 최종평가 상태 변경을 검증한다
   */
  async 최종평가_상태_변경을_검증한다(
    evaluationPeriodId: string,
    employeeId: string,
    expectedStatus: 'none' | 'in_progress' | 'complete',
    expectedIsConfirmed: boolean,
    expectedEvaluationGrade?: string,
    expectedJobGrade?: string,
    expectedJobDetailedGrade?: string,
  ): Promise<void> {
    const status = await this.직원의_평가기간_현황을_조회한다(
      evaluationPeriodId,
      employeeId,
    );

    expect(status.finalEvaluation.status).toBe(expectedStatus);
    expect(status.finalEvaluation.isConfirmed).toBe(expectedIsConfirmed);

    if (expectedIsConfirmed) {
      expect(status.finalEvaluation.confirmedAt).toBeDefined();
    } else {
      expect(status.finalEvaluation.confirmedAt).toBeNull();
    }

    if (expectedEvaluationGrade) {
      expect(status.finalEvaluation.evaluationGrade).toBe(
        expectedEvaluationGrade,
      );
    }
    if (expectedJobGrade) {
      expect(status.finalEvaluation.jobGrade).toBe(expectedJobGrade);
    }
    if (expectedJobDetailedGrade) {
      expect(status.finalEvaluation.jobDetailedGrade).toBe(
        expectedJobDetailedGrade,
      );
    }
  }

  // ==================== 최종평가 목록 조회 ====================

  /**
   * 평가기간별 최종평가 목록을 조회한다
   */
  async 평가기간별_최종평가_목록을_조회한다(
    evaluationPeriodId: string,
  ): Promise<any> {
    const result =
      await this.dashboardApiClient.getFinalEvaluationsByPeriod(
        evaluationPeriodId,
      );

    expect(result.period).toBeDefined();
    expect(result.evaluations).toBeDefined();
    expect(Array.isArray(result.evaluations)).toBe(true);

    return result;
  }

  /**
   * 직원별 최종평가 목록을 조회한다
   */
  async 직원별_최종평가_목록을_조회한다(
    employeeId: string,
    config?: {
      startDate?: string;
      endDate?: string;
    },
  ): Promise<any> {
    const result = await this.dashboardApiClient.getFinalEvaluationsByEmployee({
      employeeId,
      startDate: config?.startDate,
      endDate: config?.endDate,
    });

    expect(result.employee).toBeDefined();
    expect(result.finalEvaluations).toBeDefined();
    expect(Array.isArray(result.finalEvaluations)).toBe(true);

    return result;
  }

  /**
   * 전체 직원별 최종평가 목록을 조회한다
   */
  async 전체_직원별_최종평가_목록을_조회한다(config?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const result =
      await this.dashboardApiClient.getAllEmployeesFinalEvaluations(config);

    expect(result.evaluationPeriods).toBeDefined();
    expect(Array.isArray(result.evaluationPeriods)).toBe(true);
    expect(result.employees).toBeDefined();
    expect(Array.isArray(result.employees)).toBe(true);

    return result;
  }
}
