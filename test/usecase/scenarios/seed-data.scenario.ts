import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * 시드 데이터 생성 및 관리 시나리오
 */
export class SeedDataScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 시드 데이터 생성
   */
  async 시드_데이터를_생성한다(config: {
    scenario: string;
    clearExisting: boolean;
    projectCount: number;
    wbsPerProject: number;
    includeCurrentUserAsEvaluator?: boolean;
    useRealDepartments?: boolean;
    useRealEmployees?: boolean;
    selfEvaluationProgress?: {
      notStarted: number;
      inProgress: number;
      completed: number;
    };
  }): Promise<{
    seedResponse: any;
    evaluationPeriodId?: string;
    employeeIds?: string[];
    projectIds?: string[];
    wbsItemIds?: string[];
  }> {
    const requestBody: any = {
      scenario: config.scenario,
      clearExisting: config.clearExisting,
      dataScale: {
        departmentCount: 3,
        employeeCount: 3,
        projectCount: config.projectCount,
        wbsPerProject: config.wbsPerProject,
      },
      includeCurrentUserAsEvaluator: config.includeCurrentUserAsEvaluator,
      useRealDepartments: config.useRealDepartments ?? false,
      useRealEmployees: config.useRealEmployees ?? false,
    };

    // 자기평가 완료률 옵션이 제공된 경우 추가
    if (config.selfEvaluationProgress) {
      requestBody.stateDistribution = {
        selfEvaluationProgress: config.selfEvaluationProgress,
      };
    }

    const response = await this.testSuite
      .request()
      .post('/admin/seed/generate')
      .send(requestBody)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.results).toBeDefined();

    // Phase 1 검증
    const phase1Result = response.body.results.find(
      (r: any) => r.phase === 'Phase1',
    );
    expect(phase1Result).toBeDefined();
    expect(phase1Result.entityCounts.Project).toBeGreaterThan(0);
    expect(phase1Result.entityCounts.WbsItem).toBeGreaterThan(0);

    // 평가기간 ID 추출 (with_period 이상 시나리오인 경우)
    let evaluationPeriodId: string | undefined;
    if (config.scenario !== 'minimal') {
      const phase2Result = response.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );
      if (phase2Result) {
        evaluationPeriodId = phase2Result.generatedIds.periodIds?.[0];
      }
    }

    // 생성된 ID들 추출
    const employeeIds = phase1Result.generatedIds.employeeIds || [];
    const projectIds = phase1Result.generatedIds.projectIds || [];
    const wbsItemIds = phase1Result.generatedIds.wbsIds || [];

    return {
      seedResponse: response.body,
      evaluationPeriodId,
      employeeIds,
      projectIds,
      wbsItemIds,
    };
  }

  /**
   * 시드 데이터 상태 확인
   */
  async 시드_데이터_상태를_확인한다(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/seed/status')
      .expect(200);

    expect(response.body.hasData).toBe(true);
    expect(response.body.entityCounts.Project).toBeGreaterThan(0);
    expect(response.body.entityCounts.WbsItem).toBeGreaterThan(0);

    return response.body;
  }

  /**
   * 시드 데이터 삭제
   */
  async 시드_데이터를_삭제한다(): Promise<void> {
    const deleteResponse = await this.testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect(200);

    expect(deleteResponse.body.message).toContain('삭제');

    // 삭제 확인
    const statusResponse = await this.testSuite
      .request()
      .get('/admin/seed/status')
      .expect(200);

    expect(statusResponse.body.hasData).toBe(false);
  }
}
