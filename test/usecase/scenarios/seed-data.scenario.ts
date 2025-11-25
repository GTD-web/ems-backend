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
    departmentCount?: number;
    employeeCount?: number;
    selfEvaluationProgress?: {
      notStarted: number;
      inProgress: number;
      completed: number;
    };
    stateDistribution?: {
      excludedFromList?: number;
      selfEvaluationProgress?: {
        notStarted: number;
        inProgress: number;
        completed: number;
      };
      [key: string]: any;
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
        departmentCount: config.departmentCount ?? 3,
        employeeCount: config.employeeCount ?? 3,
        projectCount: config.projectCount,
        wbsPerProject: config.wbsPerProject,
      },
      includeCurrentUserAsEvaluator:
        config.includeCurrentUserAsEvaluator ?? false,
      useRealDepartments: config.useRealDepartments ?? false,
      useRealEmployees: config.useRealEmployees ?? false,
    };

    console.log(
      `📤 시드 데이터 생성 요청 - useRealDepartments: ${requestBody.useRealDepartments}, useRealEmployees: ${requestBody.useRealEmployees}`,
    );

    // stateDistribution 처리
    if (config.stateDistribution) {
      requestBody.stateDistribution = config.stateDistribution;
    } else if (config.selfEvaluationProgress) {
      // 하위 호환성: selfEvaluationProgress만 제공된 경우
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

  /**
   * 신규 입사자 추가
   */
  async 신규_입사자를_추가한다(count: number): Promise<{
    success: boolean;
    message: string;
    addedCount: number;
    failedCount: number;
    batchNumber: string;
    addedEmployeeIds: string[];
  }> {
    console.log(`📤 신규 입사자 추가 요청 - 직원 수: ${count}명`);

    const response = await this.testSuite
      .request()
      .post('/admin/seed/employees')
      .send({ count })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.addedCount).toBeGreaterThan(0);
    expect(response.body.batchNumber).toBeDefined();
    expect(response.body.batchNumber).toMatch(/^NEW\d{10,13}$/);
    expect(response.body.addedEmployeeIds).toHaveLength(response.body.addedCount);

    console.log(`✅ 신규 입사자 추가 완료 - 배치번호: ${response.body.batchNumber}, 추가: ${response.body.addedCount}명`);

    return response.body;
  }

  /**
   * 모든 신규 입사자 삭제
   */
  async 모든_신규_입사자를_삭제한다(): Promise<{
    success: boolean;
    message: string;
    removedCount: number;
    removedEmployees: string[];
  }> {
    console.log('📤 모든 신규 입사자 삭제 요청');

    const response = await this.testSuite
      .request()
      .delete('/admin/seed/employees/all')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.removedCount).toBeGreaterThan(0);
    expect(response.body.removedEmployees).toHaveLength(response.body.removedCount);

    console.log(`✅ 모든 신규 입사자 삭제 완료 - 삭제: ${response.body.removedCount}명`);

    return response.body;
  }

  /**
   * 신규 입사자 추가 및 삭제 전체 시나리오
   */
  async 신규_입사자_추가_및_삭제_시나리오를_실행한다(count: number): Promise<{
    추가결과: any;
    삭제결과: any;
  }> {
    console.log(`\n🎬 신규 입사자 추가 및 삭제 시나리오 시작 - ${count}명`);

    // 1단계: 신규 입사자 추가
    const 추가결과 = await this.신규_입사자를_추가한다(count);

    // 2단계: 모든 신규 입사자 삭제
    const 삭제결과 = await this.모든_신규_입사자를_삭제한다();

    // 3단계: 추가/삭제 개수 검증 (모든 신규 입사자를 삭제하므로 검증 생략)

    console.log(`✅ 신규 입사자 추가 및 삭제 시나리오 완료\n`);

    return { 추가결과, 삭제결과 };
  }
}
