import { BaseE2ETest } from '../../../base-e2e.spec';
import { FinalEvaluationApiClient } from '../api-clients/final-evaluation.api-client';

/**
 * 기본 최종평가 시나리오
 *
 * 최종평가의 기본적인 CRUD 기능을 제공합니다.
 * - 최종평가 저장 (Upsert)
 * - 최종평가 조회 (단일, 목록, 직원-평가기간별)
 * - 최종평가 확정
 * - 최종평가 확정 취소
 */
export class BaseFinalEvaluationScenario {
  protected apiClient: FinalEvaluationApiClient;
  protected testSuite: BaseE2ETest;

  constructor(testSuite: BaseE2ETest) {
    this.testSuite = testSuite;
    this.apiClient = new FinalEvaluationApiClient(testSuite);
  }

  // ==================== 최종평가 저장 ====================

  /**
   * 최종평가를 저장한다 (Upsert: 없으면 생성, 있으면 수정)
   */
  async 최종평가를_저장한다(config: {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments?: string;
  }): Promise<any> {
    const result = await this.apiClient.upsertFinalEvaluation(
      config.employeeId,
      config.periodId,
      {
        evaluationGrade: config.evaluationGrade,
        jobGrade: config.jobGrade,
        jobDetailedGrade: config.jobDetailedGrade,
        finalComments: config.finalComments,
      },
    );

    expect(result.id).toBeDefined();
    expect(result.message).toContain('성공적으로 저장되었습니다');

    return result;
  }

  // ==================== 최종평가 확정 관리 ====================

  /**
   * 최종평가를 확정한다
   */
  async 최종평가를_확정한다(id: string): Promise<any> {
    const result = await this.apiClient.confirmFinalEvaluation(id);

    expect(result.message).toContain('성공적으로 확정되었습니다');

    return result;
  }

  /**
   * 최종평가 확정을 취소한다
   */
  async 최종평가_확정을_취소한다(id: string): Promise<any> {
    const result = await this.apiClient.cancelConfirmationFinalEvaluation(id);

    expect(result.message).toContain('성공적으로 취소되었습니다');

    return result;
  }

  // ==================== 최종평가 조회 ====================

  /**
   * 최종평가 상세정보를 조회한다
   */
  async 최종평가_상세정보를_조회한다(id: string): Promise<any> {
    const result = await this.apiClient.getFinalEvaluation(id);

    expect(result.id).toBeDefined();
    expect(result.employee).toBeDefined();
    expect(result.period).toBeDefined();
    expect(result.evaluationGrade).toBeDefined();
    expect(result.jobGrade).toBeDefined();
    expect(result.jobDetailedGrade).toBeDefined();
    expect(result.isConfirmed).toBeDefined();
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.version).toBeDefined();

    return result;
  }

  /**
   * 최종평가 목록을 조회한다
   */
  async 최종평가_목록을_조회한다(
    query: {
      employeeId?: string;
      periodId?: string;
      evaluationGrade?: string;
      jobGrade?: string;
      jobDetailedGrade?: string;
      confirmedOnly?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<any> {
    const result = await this.apiClient.getFinalEvaluationList(query);

    expect(result.evaluations).toBeDefined();
    expect(Array.isArray(result.evaluations)).toBe(true);
    expect(result.total).toBeDefined();
    expect(result.page).toBeDefined();
    expect(result.limit).toBeDefined();

    return result;
  }

  /**
   * 직원-평가기간별 최종평가를 조회한다
   */
  async 직원_평가기간별_최종평가를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    const result = await this.apiClient.getFinalEvaluationByEmployeePeriod(
      employeeId,
      periodId,
    );

    if (result) {
      expect(result.id).toBeDefined();
      expect(result.employee).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.evaluationGrade).toBeDefined();
      expect(result.jobGrade).toBeDefined();
      expect(result.jobDetailedGrade).toBeDefined();
    }

    return result;
  }
}
