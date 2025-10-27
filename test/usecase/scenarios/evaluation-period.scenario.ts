import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * 평가기간 관리 시나리오
 * - 평가기간 생성
 * - 평가기간 조회
 * - 평가기간 시작
 * - 평가기간 완료
 */
export class EvaluationPeriodScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 평가기간 생성
   */
  async 평가기간을_생성한다(createData: {
    name: string;
    startDate: string;
    peerEvaluationDeadline: string;
    description?: string;
    maxSelfEvaluationRate?: number;
    gradeRanges?: Array<{
      grade: string;
      minRange: number;
      maxRange: number;
    }>;
  }): Promise<{
    id: string;
    name: string;
    status: string;
    currentPhase: string;
  }> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe(createData.name);
    expect(response.body.status).toBe('waiting');
    expect(response.body.currentPhase).toBe('waiting');

    console.log(
      `✅ 평가기간 생성 완료: ${response.body.name} (${response.body.id})`,
    );

    return response.body;
  }

  /**
   * 평가기간 상세 조회
   */
  async 평가기간_상세를_조회한다(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${periodId}`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.id).toBe(periodId);

    return response.body;
  }

  /**
   * 활성 평가기간 목록 조회
   */
  async 활성_평가기간을_조회한다(): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-periods/active')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    return response.body;
  }

  /**
   * 평가기간 목록 조회 (페이징)
   */
  async 평가기간_목록을_조회한다(
    page = 1,
    limit = 10,
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-periods')
      .query({ page, limit })
      .expect(200);

    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.items)).toBe(true);

    return response.body;
  }

  /**
   * 평가기간 시작
   */
  async 평가기간을_시작한다(periodId: string): Promise<{ success: boolean }> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/start`)
      .expect(200);

    expect(response.body.success).toBe(true);

    console.log(`✅ 평가기간 시작 완료: ${periodId}`);

    return response.body;
  }

  /**
   * 평가기간 완료
   */
  async 평가기간을_완료한다(periodId: string): Promise<{ success: boolean }> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/complete`)
      .expect(200);

    expect(response.body.success).toBe(true);

    console.log(`✅ 평가기간 완료 처리: ${periodId}`);

    return response.body;
  }

  /**
   * 평가기간 생성 및 시작 시나리오
   */
  async 평가기간_생성_및_시작_시나리오를_실행한다(): Promise<{
    periodId: string;
    periodName: string;
    statusBefore: string;
    statusAfter: string;
  }> {
    console.log('\n📝 평가기간 생성 및 시작 시나리오');

    // 1. 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: `2024년 ${today.getMonth() + 1}월 평가`,
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 90, maxRange: 94 },
        { grade: 'B', minRange: 80, maxRange: 89 },
        { grade: 'C', minRange: 70, maxRange: 79 },
        { grade: 'D', minRange: 0, maxRange: 69 },
      ],
    };

    const createdPeriod = await this.평가기간을_생성한다(createData);
    const periodId = createdPeriod.id;
    const periodName = createdPeriod.name;
    const statusBefore = createdPeriod.status;

    // 2. 생성된 평가기간 상세 조회
    const periodDetail = await this.평가기간_상세를_조회한다(periodId);
    expect(periodDetail.name).toBe(createData.name);
    expect(periodDetail.maxSelfEvaluationRate).toBe(120);
    expect(periodDetail.gradeRanges).toHaveLength(5);
    console.log('✅ 평가기간 상세 조회 확인');

    // 3. 평가기간 시작
    await this.평가기간을_시작한다(periodId);

    // 4. 시작 후 상태 확인
    const periodAfterStart = await this.평가기간_상세를_조회한다(periodId);
    expect(periodAfterStart.status).toBe('in-progress');
    expect(periodAfterStart.currentPhase).toBe('evaluation-setup');
    console.log(
      `✅ 평가기간 상태 변경 확인: ${statusBefore} → ${periodAfterStart.status}`,
    );

    // 5. 활성 평가기간 목록에 포함되는지 확인
    const activePeriods = await this.활성_평가기간을_조회한다();
    const isInActiveList = activePeriods.some((p) => p.id === periodId);
    expect(isInActiveList).toBe(true);
    console.log('✅ 활성 평가기간 목록에 포함됨 확인');

    return {
      periodId,
      periodName,
      statusBefore,
      statusAfter: periodAfterStart.status,
    };
  }

  /**
   * 평가기간 생성 후 대상자 등록 가능 여부 확인
   */
  async 평가기간_생성_후_대상자_등록_시나리오를_실행한다(
    employeeIds: string[],
  ): Promise<{
    periodId: string;
    registeredCount: number;
  }> {
    console.log('\n📝 평가기간 생성 후 대상자 등록 시나리오');

    // 1. 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: `대상자 등록 테스트 평가기간`,
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '대상자 등록 테스트용',
      maxSelfEvaluationRate: 120,
    };

    const createdPeriod = await this.평가기간을_생성한다(createData);
    const periodId = createdPeriod.id;

    console.log(`📝 평가 대상자 ${employeeIds.length}명 등록 시작`);

    // 2. 평가 대상자 대량 등록
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${periodId}/targets/bulk`)
      .send({ employeeIds })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(employeeIds.length);
    console.log(`✅ 평가 대상자 ${response.body.length}명 등록 완료`);

    // 3. 등록된 대상자 조회
    const targetsResponse = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${periodId}/targets`)
      .expect(200);

    expect(targetsResponse.body.targets.length).toBe(employeeIds.length);
    console.log('✅ 등록된 대상자 조회 확인');

    // 4. 대시보드 조회 - evaluationPeriod와 employee 정보 검증
    const dashboardResponse = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/employees/status`)
      .expect(200);

    expect(Array.isArray(dashboardResponse.body)).toBe(true);
    expect(dashboardResponse.body.length).toBe(employeeIds.length);
    console.log(
      `✅ 대시보드 조회 확인: ${dashboardResponse.body.length}명 조회됨`,
    );

    // 5. 각 항목의 evaluationPeriod와 employee 정보 검증
    dashboardResponse.body.forEach((item: any, index: number) => {
      // evaluationPeriod 정보 검증
      expect(item.evaluationPeriod).toBeDefined();
      expect(item.evaluationPeriod.id).toBe(periodId);
      expect(item.evaluationPeriod.name).toBe(createData.name);
      expect(item.evaluationPeriod.status).toBeDefined();
      expect(item.evaluationPeriod.currentPhase).toBeDefined();

      // employee 정보 검증
      expect(item.employee).toBeDefined();
      expect(item.employee.id).toBeDefined();
      expect(item.employee.name).toBeDefined();
      expect(item.employee.email).toBeDefined();

      // 등록한 직원 ID와 일치하는지 확인
      expect(employeeIds).toContain(item.employee.id);

      // isEvaluationTarget 확인 (등록되었으므로 true여야 함)
      expect(item.isEvaluationTarget).toBe(true);

      // exclusionInfo 확인 (제외되지 않았으므로 isExcluded: false여야 함)
      expect(item.exclusionInfo).toBeDefined();
      expect(item.exclusionInfo.isExcluded).toBe(false);
    });

    console.log('✅ 대시보드 항목별 evaluationPeriod/employee 정보 검증 완료');

    return {
      periodId,
      registeredCount: response.body.length,
    };
  }

  /**
   * 평가기간 삭제
   */
  async 평가기간을_삭제한다(periodId: string): Promise<void> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-periods/${periodId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    console.log(`✅ 평가기간 삭제 완료: ${periodId}`);
  }
}
