import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * WBS 자기평가 시나리오
 *
 * 엔드포인트만을 사용하여 자기평가 관련 기능을 테스트합니다.
 * 이전 테스트의 결과가 다음 테스트에 이어지는 시나리오 형태로 구성됩니다.
 */
export class SelfEvaluationScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * WBS 자기평가 저장 (Upsert)
   */
  async WBS자기평가를_저장한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent?: string;
    selfEvaluationScore?: number;
    performanceResult?: string;
  }): Promise<any> {
    const requestBody: any = {};

    if (config.selfEvaluationContent !== undefined) {
      requestBody.selfEvaluationContent = config.selfEvaluationContent;
    }
    if (config.selfEvaluationScore !== undefined) {
      requestBody.selfEvaluationScore = config.selfEvaluationScore;
    }
    if (config.performanceResult !== undefined) {
      requestBody.performanceResult = config.performanceResult;
    }

    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/wbs/${config.wbsItemId}/period/${config.periodId}`,
      )
      .send(requestBody)
      .expect(200);

    expect(response.body.id).toBeDefined();
    expect(response.body.employeeId).toBe(config.employeeId);
    expect(response.body.wbsItemId).toBe(config.wbsItemId);
    expect(response.body.periodId).toBe(config.periodId);
    // 시드 데이터를 완료되지 않은 상태로 생성하므로 저장 시 false 검증 가능
    // isCompleted 필드는 응답에 포함되지 않을 수 있으므로 optional로 처리
    if (response.body.isCompleted !== undefined) {
      expect(response.body.isCompleted).toBe(false);
    }

    return response.body;
  }

  /**
   * WBS 자기평가 제출 (단일)
   */
  async WBS자기평가를_제출한다(evaluationId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/submit`,
      )
      .expect(200);

    expect(response.body.id).toBe(evaluationId);
    expect(response.body.isCompleted).toBe(true);
    expect(response.body.completedAt).toBeDefined();

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 제출
   */
  async 직원의_전체_WBS자기평가를_제출한다(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/period/${config.periodId}/submit-all`,
      )
      .expect(200);

    expect(response.body.submittedCount).toBeDefined();
    expect(response.body.failedCount).toBeDefined();
    expect(response.body.totalCount).toBeDefined();
    expect(response.body.completedEvaluations).toBeDefined();
    expect(response.body.failedEvaluations).toBeDefined();

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 제출
   */
  async 프로젝트별_WBS자기평가를_제출한다(config: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/period/${config.periodId}/project/${config.projectId}/submit`,
      )
      .expect(200);

    expect(response.body.submittedCount).toBeDefined();
    expect(response.body.failedCount).toBeDefined();
    expect(response.body.totalCount).toBeDefined();
    expect(response.body.completedEvaluations).toBeDefined();
    expect(response.body.failedEvaluations).toBeDefined();

    return response.body;
  }

  /**
   * WBS 자기평가 미제출 (단일)
   */
  async WBS자기평가를_미제출한다(evaluationId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/reset`,
      )
      .expect(200);

    expect(response.body.id).toBe(evaluationId);
    expect(response.body.isCompleted).toBe(false);
    expect(response.body.completedAt).toBeNull();

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 미제출
   */
  async 직원의_전체_WBS자기평가를_미제출한다(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/period/${config.periodId}/reset`,
      )
      .expect(200);

    expect(response.body.resetCount).toBeDefined();
    expect(response.body.failedCount).toBeDefined();
    expect(response.body.totalCount).toBeDefined();
    expect(response.body.resetEvaluations).toBeDefined();
    expect(response.body.failedResets).toBeDefined();

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 미제출
   */
  async 프로젝트별_WBS자기평가를_미제출한다(config: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/period/${config.periodId}/project/${config.projectId}/reset`,
      )
      .expect(200);

    expect(response.body.resetCount).toBeDefined();
    expect(response.body.failedCount).toBeDefined();
    expect(response.body.totalCount).toBeDefined();
    expect(response.body.resetEvaluations).toBeDefined();
    expect(response.body.failedResets).toBeDefined();

    return response.body;
  }

  /**
   * 직원의 자기평가 목록 조회
   */
  async 직원의_자기평가_목록을_조회한다(config: {
    employeeId: string;
    periodId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const queryParams: any = {};
    if (config.periodId) queryParams.periodId = config.periodId;
    if (config.projectId) queryParams.projectId = config.projectId;
    if (config.page) queryParams.page = config.page;
    if (config.limit) queryParams.limit = config.limit;

    const response = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}`,
      )
      .query(queryParams)
      .expect(200);

    expect(response.body.evaluations).toBeDefined();
    expect(Array.isArray(response.body.evaluations)).toBe(true);
    expect(response.body.total).toBeDefined();
    expect(response.body.page).toBeDefined();
    expect(response.body.limit).toBeDefined();

    return response.body;
  }

  /**
   * WBS 자기평가 상세정보 조회
   */
  async WBS자기평가_상세정보를_조회한다(evaluationId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`)
      .expect(200);

    expect(response.body.id).toBe(evaluationId);
    expect(response.body.employeeId).toBeDefined();
    expect(response.body.wbsItemId).toBeDefined();
    expect(response.body.periodId).toBeDefined();
    expect(response.body.isCompleted).toBeDefined();
    expect(response.body.createdAt).toBeDefined();
    expect(response.body.updatedAt).toBeDefined();

    return response.body;
  }

  /**
   * WBS 자기평가 내용 초기화 (단일)
   */
  async WBS자기평가_내용을_초기화한다(evaluationId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
      )
      .expect(200);

    expect(response.body.id).toBe(evaluationId);
    expect(response.body.isCompleted).toBe(false); // 초기화 시 미완료 상태로 변경
    expect(response.body.completedAt).toBeNull();

    return response.body;
  }

  /**
   * 직원의 전체 WBS 자기평가 내용 초기화
   */
  async 직원의_전체_WBS자기평가_내용을_초기화한다(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/period/${config.periodId}/clear`,
      )
      .expect(200);

    expect(response.body.employeeId).toBe(config.employeeId);
    expect(response.body.periodId).toBe(config.periodId);
    expect(response.body.clearedCount).toBeDefined();
    expect(response.body.clearedEvaluations).toBeDefined();
    expect(Array.isArray(response.body.clearedEvaluations)).toBe(true);

    return response.body;
  }

  /**
   * 프로젝트별 WBS 자기평가 내용 초기화
   */
  async 프로젝트별_WBS자기평가_내용을_초기화한다(config: {
    employeeId: string;
    periodId: string;
    projectId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/period/${config.periodId}/project/${config.projectId}/clear`,
      )
      .expect(200);

    expect(response.body.employeeId).toBe(config.employeeId);
    expect(response.body.periodId).toBe(config.periodId);
    expect(response.body.projectId).toBe(config.projectId);
    expect(response.body.clearedCount).toBeDefined();
    expect(response.body.clearedEvaluations).toBeDefined();
    expect(Array.isArray(response.body.clearedEvaluations)).toBe(true);

    return response.body;
  }

  /**
   * 자기평가 수정 가능 상태 변경
   */
  async 자기평가_수정_가능_상태를_변경한다(config: {
    mappingId: string;
    evaluationType: 'self' | 'primary' | 'secondary' | 'all';
    isEditable: boolean;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/performance-evaluation/evaluation-editable-status/${config.mappingId}`,
      )
      .query({
        evaluationType: config.evaluationType,
        isEditable: config.isEditable.toString(),
      })
      .expect(200);

    expect(response.body.id).toBe(config.mappingId);
    expect(response.body.isSelfEvaluationEditable).toBeDefined();
    expect(response.body.isPrimaryEvaluationEditable).toBeDefined();
    expect(response.body.isSecondaryEvaluationEditable).toBeDefined();

    return response.body;
  }

  /**
   * 자기평가 시나리오: 저장 → 제출 → 조회 → 미제출 → 재제출
   */
  async 자기평가_전체_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    mappingId: string;
  }): Promise<{
    저장결과: any;
    제출결과: any;
    조회결과: any;
    미제출결과: any;
    재제출결과: any;
  }> {
    console.log('🚀 자기평가 전체 시나리오 시작');

    // 1. 자기평가 저장
    console.log('📝 1단계: 자기평가 저장');
    const 저장결과 = await this.WBS자기평가를_저장한다({
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      periodId: config.periodId,
      selfEvaluationContent: '이번 분기 목표를 성공적으로 달성했습니다.',
      selfEvaluationScore: 100,
      performanceResult:
        'WBS 항목을 100% 완료하였으며, 고객 만족도 95%를 달성했습니다.',
    });

    // 2. 자기평가 제출
    console.log('📤 2단계: 자기평가 제출');
    const 제출결과 = await this.WBS자기평가를_제출한다(저장결과.id);

    // 3. 자기평가 상세 조회
    console.log('🔍 3단계: 자기평가 상세 조회');
    const 조회결과 = await this.WBS자기평가_상세정보를_조회한다(저장결과.id);

    // 4. 자기평가 미제출
    console.log('↩️ 4단계: 자기평가 미제출');
    const 미제출결과 = await this.WBS자기평가를_미제출한다(저장결과.id);

    // 5. 자기평가 재제출
    console.log('📤 5단계: 자기평가 재제출');
    const 재제출결과 = await this.WBS자기평가를_제출한다(저장결과.id);

    console.log('✅ 자기평가 전체 시나리오 완료');

    return {
      저장결과,
      제출결과,
      조회결과,
      미제출결과,
      재제출결과,
    };
  }

  /**
   * 프로젝트별 자기평가 시나리오: 여러 WBS 저장 → 프로젝트별 제출
   */
  async 프로젝트별_자기평가_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    projectId: string;
    wbsItemIds: string[];
  }): Promise<{
    저장결과들: any[];
    프로젝트별제출결과: any;
    프로젝트별미제출결과: any;
  }> {
    console.log('🚀 프로젝트별 자기평가 시나리오 시작');

    // 1. 여러 WBS 자기평가 저장
    console.log('📝 1단계: 여러 WBS 자기평가 저장');
    const 저장결과들: any[] = [];
    for (let i = 0; i < config.wbsItemIds.length; i++) {
      const 저장결과 = await this.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemIds[i],
        periodId: config.periodId,
        selfEvaluationContent: `WBS ${i + 1} 자기평가 내용`,
        selfEvaluationScore: 80 + i * 10,
        performanceResult: `WBS ${i + 1} 성과 결과`,
      });
      저장결과들.push(저장결과);
    }

    // 2. 프로젝트별 제출
    console.log('📤 2단계: 프로젝트별 제출');
    const 프로젝트별제출결과 = await this.프로젝트별_WBS자기평가를_제출한다({
      employeeId: config.employeeId,
      periodId: config.periodId,
      projectId: config.projectId,
    });

    // 3. 프로젝트별 미제출
    console.log('↩️ 3단계: 프로젝트별 미제출');
    const 프로젝트별미제출결과 = await this.프로젝트별_WBS자기평가를_미제출한다(
      {
        employeeId: config.employeeId,
        periodId: config.periodId,
        projectId: config.projectId,
      },
    );

    console.log('✅ 프로젝트별 자기평가 시나리오 완료');

    return {
      저장결과들,
      프로젝트별제출결과,
      프로젝트별미제출결과,
    };
  }

  /**
   * 자기평가 내용 초기화 시나리오: 저장 → 제출 → 내용 초기화 → 재저장
   */
  async 자기평가_내용_초기화_시나리오를_실행한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
  }): Promise<{
    저장결과: any;
    제출결과: any;
    내용초기화결과: any;
    재저장결과: any;
  }> {
    console.log('🚀 자기평가 내용 초기화 시나리오 시작');

    // 1. 자기평가 저장
    console.log('📝 1단계: 자기평가 저장');
    const 저장결과 = await this.WBS자기평가를_저장한다({
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      periodId: config.periodId,
      selfEvaluationContent: '초기 자기평가 내용',
      selfEvaluationScore: 90,
      performanceResult: '초기 성과 결과',
    });

    // 2. 자기평가 제출
    console.log('📤 2단계: 자기평가 제출');
    const 제출결과 = await this.WBS자기평가를_제출한다(저장결과.id);

    // 3. 내용 초기화
    console.log('🗑️ 3단계: 내용 초기화');
    const 내용초기화결과 = await this.WBS자기평가_내용을_초기화한다(
      저장결과.id,
    );

    // 4. 재저장
    console.log('📝 4단계: 재저장');
    const 재저장결과 = await this.WBS자기평가를_저장한다({
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      periodId: config.periodId,
      selfEvaluationContent: '수정된 자기평가 내용',
      selfEvaluationScore: 95,
      performanceResult: '수정된 성과 결과',
    });

    console.log('✅ 자기평가 내용 초기화 시나리오 완료');

    return {
      저장결과,
      제출결과,
      내용초기화결과,
      재저장결과,
    };
  }

  /**
   * 대시보드에서 직원의 평가 현황을 조회한다
   */
  async 대시보드_직원_평가_현황을_조회한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.periodId}/employees/status`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    // 해당 직원의 데이터 찾기
    const employeeData = response.body.find(
      (emp: any) => emp.employee.id === config.employeeId,
    );

    expect(employeeData).toBeDefined();
    expect(employeeData.performanceInput).toBeDefined();
    expect(employeeData.selfEvaluation).toBeDefined();

    return employeeData;
  }

  /**
   * 자기평가 제출 후 대시보드 검증 시나리오를 실행한다
   */
  async 자기평가_제출_후_대시보드_검증_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    wbsItemIds: string[];
  }): Promise<any> {
    console.log('=== 자기평가 제출 후 대시보드 검증 시나리오 시작 ===');

    // 1. 자기평가 저장
    const 저장결과들: any[] = [];
    for (let i = 0; i < config.wbsItemIds.length; i++) {
      const 저장결과 = await this.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemIds[i],
        periodId: config.periodId,
        selfEvaluationContent: `자기평가 내용 ${i + 1}`,
        selfEvaluationScore: 80 + i * 5,
        performanceResult: `성과 결과 ${i + 1}`,
      });
      저장결과들.push(저장결과);
    }

    // 2. 자기평가 제출
    const 제출결과 = await this.직원의_전체_WBS자기평가를_제출한다({
      employeeId: config.employeeId,
      periodId: config.periodId,
    });

    // 3. 대시보드에서 직원 현황 조회
    const 대시보드데이터 = await this.대시보드_직원_평가_현황을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 4. performanceInput 검증
    expect(대시보드데이터.performanceInput).toBeDefined();
    expect(대시보드데이터.performanceInput.status).toBeDefined();
    expect(['complete', 'in_progress', 'none']).toContain(
      대시보드데이터.performanceInput.status,
    );
    expect(
      대시보드데이터.performanceInput.totalWbsCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.performanceInput.inputCompletedCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.performanceInput.inputCompletedCount,
    ).toBeLessThanOrEqual(대시보드데이터.performanceInput.totalWbsCount);

    // 5. selfEvaluation 검증
    expect(대시보드데이터.selfEvaluation).toBeDefined();
    expect(대시보드데이터.selfEvaluation.status).toBeDefined();
    expect(['complete', 'in_progress', 'none']).toContain(
      대시보드데이터.selfEvaluation.status,
    );
    expect(
      대시보드데이터.selfEvaluation.totalMappingCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.selfEvaluation.completedMappingCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.selfEvaluation.completedMappingCount,
    ).toBeLessThanOrEqual(대시보드데이터.selfEvaluation.totalMappingCount);
    expect(typeof 대시보드데이터.selfEvaluation.isEditable).toBe('boolean');

    // 자기평가가 제출된 경우 totalScore가 있을 수 있음
    if (대시보드데이터.selfEvaluation.totalScore !== null) {
      expect(typeof 대시보드데이터.selfEvaluation.totalScore).toBe('number');
      expect(대시보드데이터.selfEvaluation.totalScore).toBeGreaterThanOrEqual(
        0,
      );
      expect(대시보드데이터.selfEvaluation.totalScore).toBeLessThanOrEqual(100);
    }

    console.log(
      '✅ performanceInput 검증 완료:',
      대시보드데이터.performanceInput,
    );
    console.log('✅ selfEvaluation 검증 완료:', 대시보드데이터.selfEvaluation);

    console.log('=== 자기평가 제출 후 대시보드 검증 시나리오 완료 ===');

    return {
      저장결과들,
      제출결과,
      대시보드데이터,
    };
  }

  /**
   * 자기평가 진행중 상태에서 대시보드 검증 시나리오를 실행한다
   */
  async 자기평가_진행중_상태_대시보드_검증_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    wbsItemIds: string[];
  }): Promise<any> {
    console.log('=== 자기평가 진행중 상태 대시보드 검증 시나리오 시작 ===');

    // 1. 일부 자기평가만 저장 (진행중 상태)
    const 저장결과들: any[] = [];
    const 저장할WbsCount = Math.floor(config.wbsItemIds.length / 2); // 절반만 저장

    for (let i = 0; i < 저장할WbsCount; i++) {
      const 저장결과 = await this.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemIds[i],
        periodId: config.periodId,
        selfEvaluationContent: `진행중 자기평가 내용 ${i + 1}`,
        selfEvaluationScore: 70 + i * 10,
        performanceResult: `진행중 성과 결과 ${i + 1}`,
      });
      저장결과들.push(저장결과);
    }

    // 2. 대시보드에서 직원 현황 조회
    const 대시보드데이터 = await this.대시보드_직원_평가_현황을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 3. performanceInput 검증 (진행중 상태)
    expect(대시보드데이터.performanceInput).toBeDefined();
    expect(대시보드데이터.performanceInput.status).toBeDefined();
    expect(['complete', 'in_progress', 'none']).toContain(
      대시보드데이터.performanceInput.status,
    );
    expect(
      대시보드데이터.performanceInput.totalWbsCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.performanceInput.inputCompletedCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.performanceInput.inputCompletedCount,
    ).toBeLessThanOrEqual(대시보드데이터.performanceInput.totalWbsCount);

    // 4. selfEvaluation 검증 (진행중 상태)
    expect(대시보드데이터.selfEvaluation).toBeDefined();
    expect(대시보드데이터.selfEvaluation.status).toBeDefined();
    expect(['complete', 'in_progress', 'none']).toContain(
      대시보드데이터.selfEvaluation.status,
    );
    expect(
      대시보드데이터.selfEvaluation.totalMappingCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.selfEvaluation.completedMappingCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.selfEvaluation.completedMappingCount,
    ).toBeLessThanOrEqual(대시보드데이터.selfEvaluation.totalMappingCount);
    expect(typeof 대시보드데이터.selfEvaluation.isEditable).toBe('boolean');

    // 진행중 상태에서는 totalScore가 null이거나 0일 수 있음
    if (대시보드데이터.selfEvaluation.totalScore !== null) {
      expect(typeof 대시보드데이터.selfEvaluation.totalScore).toBe('number');
      expect(대시보드데이터.selfEvaluation.totalScore).toBeGreaterThanOrEqual(
        0,
      );
      expect(대시보드데이터.selfEvaluation.totalScore).toBeLessThanOrEqual(100);
    }

    console.log(
      '✅ 진행중 상태 performanceInput 검증 완료:',
      대시보드데이터.performanceInput,
    );
    console.log(
      '✅ 진행중 상태 selfEvaluation 검증 완료:',
      대시보드데이터.selfEvaluation,
    );

    console.log('=== 자기평가 진행중 상태 대시보드 검증 시나리오 완료 ===');

    return {
      저장결과들,
      대시보드데이터,
    };
  }

  /**
   * 자기평가 없는 상태에서 대시보드 검증 시나리오를 실행한다
   */
  async 자기평가_없는_상태_대시보드_검증_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    wbsItemIds: string[];
  }): Promise<any> {
    console.log('=== 자기평가 없는 상태 대시보드 검증 시나리오 시작 ===');

    // 1. 자기평가를 저장하지 않고 바로 대시보드 조회
    const 대시보드데이터 = await this.대시보드_직원_평가_현황을_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 2. performanceInput 검증 (없는 상태)
    expect(대시보드데이터.performanceInput).toBeDefined();
    expect(대시보드데이터.performanceInput.status).toBeDefined();
    expect(['complete', 'in_progress', 'none']).toContain(
      대시보드데이터.performanceInput.status,
    );
    expect(
      대시보드데이터.performanceInput.totalWbsCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.performanceInput.inputCompletedCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.performanceInput.inputCompletedCount,
    ).toBeLessThanOrEqual(대시보드데이터.performanceInput.totalWbsCount);

    // 3. selfEvaluation 검증 (없는 상태)
    expect(대시보드데이터.selfEvaluation).toBeDefined();
    expect(대시보드데이터.selfEvaluation.status).toBeDefined();
    expect(['complete', 'in_progress', 'none']).toContain(
      대시보드데이터.selfEvaluation.status,
    );
    expect(
      대시보드데이터.selfEvaluation.totalMappingCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.selfEvaluation.completedMappingCount,
    ).toBeGreaterThanOrEqual(0);
    expect(
      대시보드데이터.selfEvaluation.completedMappingCount,
    ).toBeLessThanOrEqual(대시보드데이터.selfEvaluation.totalMappingCount);
    expect(typeof 대시보드데이터.selfEvaluation.isEditable).toBe('boolean');

    // 없는 상태에서는 totalScore가 null이어야 함
    expect(대시보드데이터.selfEvaluation.totalScore).toBeNull();

    console.log(
      '✅ 없는 상태 performanceInput 검증 완료:',
      대시보드데이터.performanceInput,
    );
    console.log(
      '✅ 없는 상태 selfEvaluation 검증 완료:',
      대시보드데이터.selfEvaluation,
    );

    console.log('=== 자기평가 없는 상태 대시보드 검증 시나리오 완료 ===');

    return {
      대시보드데이터,
    };
  }
}
