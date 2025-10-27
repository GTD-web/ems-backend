import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * 평가 대상자 관리 시나리오
 * - 평가 대상자 등록/해제
 * - 평가 대상자 제외/포함
 * - 제외된 대상자 조회
 * - 대시보드 필터링 검증
 */
export class EvaluationTargetScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 평가 대상자 등록
   */
  async 평가_대상자를_등록한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .expect(201);

    expect(response.body).toBeDefined();
    expect(response.body.evaluationPeriodId).toBe(evaluationPeriodId);
    expect(response.body.employeeId).toBe(employeeId);
    expect(response.body.isExcluded).toBe(false);

    return response.body;
  }

  /**
   * 평가 대상자 대량 등록
   */
  async 평가_대상자를_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
  ): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`)
      .send({ employeeIds })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(employeeIds.length);

    return response.body;
  }

  /**
   * 평가 대상자 조회
   */
  async 평가_대상자를_조회한다(
    evaluationPeriodId: string,
    includeExcluded = false,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
      .query({ includeExcluded: includeExcluded.toString() })
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.evaluationPeriodId).toBe(evaluationPeriodId);
    expect(Array.isArray(response.body.targets)).toBe(true);

    return response.body;
  }

  /**
   * 제외된 평가 대상자 조회
   */
  async 제외된_평가_대상자를_조회한다(
    evaluationPeriodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets/excluded`)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.evaluationPeriodId).toBe(evaluationPeriodId);
    expect(Array.isArray(response.body.targets)).toBe(true);

    // 모든 대상자가 제외 상태여야 함
    if (response.body.targets.length > 0) {
      response.body.targets.forEach((target: any) => {
        expect(target.isExcluded).toBe(true);
        expect(target.excludeReason).toBeDefined();
      });
    }

    return response.body;
  }

  /**
   * 평가 대상에서 제외
   */
  async 평가_대상에서_제외한다(
    evaluationPeriodId: string,
    employeeId: string,
    excludeReason: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/exclude`,
      )
      .send({ excludeReason })
      .expect(200);

    // 제외 응답 검증
    expect(response.body.isExcluded).toBe(true);
    expect(response.body.excludeReason).toBe(excludeReason);
    expect(response.body.excludedBy).toBeDefined();
    expect(response.body.excludedAt).toBeDefined();

    return response.body;
  }

  /**
   * 평가 대상에 포함
   */
  async 평가_대상에_포함한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/include`,
      )
      .expect(200);

    // 포함 응답 검증
    expect(response.body.isExcluded).toBe(false);
    expect(response.body.excludeReason).toBeNull();
    expect(response.body.excludedBy).toBeNull();
    expect(response.body.excludedAt).toBeNull();

    return response.body;
  }

  /**
   * 대시보드에서 직원 상태 조회
   */
  async 대시보드에서_직원_상태를_조회한다(
    evaluationPeriodId: string,
  ): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    return response.body;
  }

  /**
   * 평가 대상 제외/포함 전체 시나리오 테스트
   */
  async 평가_대상_제외_포함_시나리오를_실행한다(
    evaluationPeriodId: string,
  ): Promise<{
    employeeId: string;
    excludedFromDashboard: boolean;
    includedBackInDashboard: boolean;
  }> {
    // 1. 제외 전 - 대시보드에서 전체 직원 조회
    const dashboardBefore =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardBefore.length).toBeGreaterThan(0);

    const testEmployee = dashboardBefore[0];
    const employeeId = testEmployee.employee.id;
    const initialCount = dashboardBefore.length;

    console.log(
      `📝 테스트 대상 직원: ${testEmployee.employee.name} (${employeeId})`,
    );
    console.log(`📊 제외 전 대시보드 직원 수: ${initialCount}명`);

    // 2. 평가 대상에서 제외
    await this.평가_대상에서_제외한다(
      evaluationPeriodId,
      employeeId,
      '테스트용 제외 처리',
    );
    console.log('✅ 평가 대상 제외 완료');

    // 3. 제외된 대상자 조회 API로 확인
    const excludedTargets =
      await this.제외된_평가_대상자를_조회한다(evaluationPeriodId);
    const isInExcludedList = excludedTargets.targets.some(
      (target: any) => target.employee.id === employeeId,
    );
    expect(isInExcludedList).toBe(true);
    console.log('✅ 제외된 대상자 목록에 포함됨 확인');

    // 4. 대시보드에서 제외된 직원이 안 보이는지 확인
    const dashboardAfterExclude =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    const excludedFromDashboard = !dashboardAfterExclude.some(
      (emp: any) => emp.employee.id === employeeId,
    );
    expect(excludedFromDashboard).toBe(true);
    expect(dashboardAfterExclude.length).toBe(initialCount - 1);
    console.log(
      `✅ 대시보드에서 제외 확인 (${initialCount}명 → ${dashboardAfterExclude.length}명)`,
    );

    // 5. 평가 대상에 다시 포함
    await this.평가_대상에_포함한다(evaluationPeriodId, employeeId);
    console.log('✅ 평가 대상 포함 완료');

    // 6. 제외된 대상자 목록에서 사라졌는지 확인
    const excludedTargetsAfterInclude =
      await this.제외된_평가_대상자를_조회한다(evaluationPeriodId);
    const stillInExcludedList = excludedTargetsAfterInclude.targets.some(
      (target: any) => target.employee.id === employeeId,
    );
    expect(stillInExcludedList).toBe(false);
    console.log('✅ 제외된 대상자 목록에서 제거됨 확인');

    // 7. 대시보드에서 다시 보이는지 확인
    const dashboardAfterInclude =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    const includedBackInDashboard = dashboardAfterInclude.some(
      (emp: any) => emp.employee.id === employeeId,
    );
    expect(includedBackInDashboard).toBe(true);
    expect(dashboardAfterInclude.length).toBe(initialCount);
    console.log(
      `✅ 대시보드에서 복원 확인 (${dashboardAfterExclude.length}명 → ${dashboardAfterInclude.length}명)`,
    );

    return {
      employeeId,
      excludedFromDashboard,
      includedBackInDashboard,
    };
  }

  /**
   * 평가 대상 등록 해제 (isEvaluationTarget 검증)
   */
  async 평가_대상_등록을_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<{ success: boolean }> {
    const response = await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    return response.body;
  }

  /**
   * 평가 대상 등록 해제 시나리오 테스트 (isEvaluationTarget 변경 검증)
   */
  async 평가_대상_등록_해제_시나리오를_실행한다(
    evaluationPeriodId: string,
  ): Promise<{
    employeeId: string;
    isEvaluationTargetBefore: boolean;
    isEvaluationTargetAfter: boolean;
  }> {
    console.log('\n📝 평가 대상 등록 해제 시나리오 (isEvaluationTarget 검증)');

    // 1. 대시보드에서 평가 대상 조회
    const dashboardBefore =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardBefore.length).toBeGreaterThan(0);

    const testEmployee = dashboardBefore[0];
    const employeeId = testEmployee.employee.id;

    console.log(
      `📝 테스트 대상 직원: ${testEmployee.employee.name} (${employeeId})`,
    );

    // 2. 등록 해제 전 - isEvaluationTarget 확인
    expect(testEmployee.isEvaluationTarget).toBe(true);
    console.log(
      `✅ 등록 해제 전 isEvaluationTarget: ${testEmployee.isEvaluationTarget}`,
    );

    // 3. 평가 대상 등록 해제
    await this.평가_대상_등록을_해제한다(evaluationPeriodId, employeeId);
    console.log('✅ 평가 대상 등록 해제 완료');

    // 4. 대시보드에서 사라졌는지 확인 (등록 해제 = soft delete)
    const dashboardAfterUnregister =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    const employeeAfterUnregister = dashboardAfterUnregister.find(
      (emp: any) => emp.employee.id === employeeId,
    );

    // 등록 해제된 직원은 대시보드에 나타나지 않아야 함
    expect(employeeAfterUnregister).toBeUndefined();
    console.log('✅ 등록 해제 후 대시보드에서 제거 확인');

    return {
      employeeId,
      isEvaluationTargetBefore: true,
      isEvaluationTargetAfter: false, // 등록 해제 시 대시보드에서 사라짐
    };
  }

  /**
   * 평가 대상 제외/포함 시나리오 (exclusionInfo.isExcluded 검증)
   */
  async 평가_대상_제외_포함_exclusionInfo_검증_시나리오를_실행한다(
    evaluationPeriodId: string,
  ): Promise<{
    employeeId: string;
    isExcludedBefore: boolean;
    isExcludedAfterExclude: boolean;
    isExcludedAfterInclude: boolean;
  }> {
    console.log(
      '\n📝 평가 대상 제외/포함 시나리오 (exclusionInfo.isExcluded 검증)',
    );

    // 1. 대시보드에서 평가 대상 조회
    const dashboardBefore =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardBefore.length).toBeGreaterThan(0);

    const testEmployee = dashboardBefore[0];
    const employeeId = testEmployee.employee.id;

    console.log(
      `📝 테스트 대상 직원: ${testEmployee.employee.name} (${employeeId})`,
    );

    // 2. 제외 전 - exclusionInfo 확인
    expect(testEmployee.exclusionInfo).toBeDefined();
    expect(testEmployee.exclusionInfo.isExcluded).toBe(false);
    expect(testEmployee.isEvaluationTarget).toBe(true);
    console.log(
      `✅ 제외 전 - exclusionInfo.isExcluded: ${testEmployee.exclusionInfo.isExcluded}, isEvaluationTarget: ${testEmployee.isEvaluationTarget}`,
    );

    // 3. 평가 대상에서 제외
    await this.평가_대상에서_제외한다(
      evaluationPeriodId,
      employeeId,
      'exclusionInfo 검증 테스트',
    );
    console.log('✅ 평가 대상 제외 완료');

    // 4. 제외 후 - 대시보드에서 사라짐 (isExcluded=true인 직원은 필터링됨)
    const dashboardAfterExclude =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    const employeeAfterExclude = dashboardAfterExclude.find(
      (emp: any) => emp.employee.id === employeeId,
    );

    // 제외된 직원은 대시보드에서 사라짐 (GetAllEmployeesEvaluationPeriodStatusHandler에서 isExcluded: false만 조회)
    expect(employeeAfterExclude).toBeUndefined();
    console.log(
      `✅ 제외 후 - 대시보드에서 제거 확인 (isExcluded: true → 필터링됨)`,
    );

    // 5. 평가 대상에 다시 포함
    await this.평가_대상에_포함한다(evaluationPeriodId, employeeId);
    console.log('✅ 평가 대상 포함 완료');

    // 6. 포함 후 - exclusionInfo 복원 확인
    const dashboardAfterInclude =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    const employeeAfterInclude = dashboardAfterInclude.find(
      (emp: any) => emp.employee.id === employeeId,
    );

    expect(employeeAfterInclude).toBeDefined();
    expect(employeeAfterInclude.exclusionInfo.isExcluded).toBe(false);
    expect(employeeAfterInclude.isEvaluationTarget).toBe(true);
    console.log(
      `✅ 포함 후 - exclusionInfo.isExcluded: ${employeeAfterInclude.exclusionInfo.isExcluded}, isEvaluationTarget: ${employeeAfterInclude.isEvaluationTarget}`,
    );

    return {
      employeeId,
      isExcludedBefore: false,
      isExcludedAfterExclude: true, // 제외되어 대시보드에서 사라짐
      isExcludedAfterInclude: false, // 포함되어 대시보드에 다시 나타남
    };
  }

  /**
   * 여러 직원 제외/포함 테스트
   */
  async 여러_직원_제외_포함을_테스트한다(
    evaluationPeriodId: string,
    excludeCount = 2,
  ): Promise<void> {
    // 1. 대시보드에서 전체 직원 조회
    const dashboardBefore =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardBefore.length).toBeGreaterThanOrEqual(excludeCount);

    const initialCount = dashboardBefore.length;
    const employeesToExclude = dashboardBefore.slice(0, excludeCount);

    console.log(`\n📝 ${excludeCount}명의 직원을 제외 처리합니다`);

    // 2. 여러 직원 제외
    for (const employee of employeesToExclude) {
      await this.평가_대상에서_제외한다(
        evaluationPeriodId,
        employee.employee.id,
        `다중 제외 테스트 - ${employee.employee.name}`,
      );
      console.log(`  ✅ ${employee.employee.name} 제외 완료`);
    }

    // 3. 제외된 대상자 목록 확인
    const excludedTargets =
      await this.제외된_평가_대상자를_조회한다(evaluationPeriodId);
    expect(excludedTargets.targets.length).toBeGreaterThanOrEqual(excludeCount);
    console.log(`✅ 제외된 대상자 목록: ${excludedTargets.targets.length}명`);

    // 4. 대시보드에서 제외된 직원들이 안 보이는지 확인
    const dashboardAfterExclude =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardAfterExclude.length).toBe(initialCount - excludeCount);

    for (const employee of employeesToExclude) {
      const isInDashboard = dashboardAfterExclude.some(
        (emp: any) => emp.employee.id === employee.employee.id,
      );
      expect(isInDashboard).toBe(false);
    }
    console.log(
      `✅ 대시보드 확인: ${initialCount}명 → ${dashboardAfterExclude.length}명`,
    );

    // 5. 모두 다시 포함
    for (const employee of employeesToExclude) {
      await this.평가_대상에_포함한다(evaluationPeriodId, employee.employee.id);
      console.log(`  ✅ ${employee.employee.name} 포함 완료`);
    }

    // 6. 대시보드에서 다시 모두 보이는지 확인
    const dashboardAfterInclude =
      await this.대시보드에서_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardAfterInclude.length).toBe(initialCount);

    for (const employee of employeesToExclude) {
      const isInDashboard = dashboardAfterInclude.some(
        (emp: any) => emp.employee.id === employee.employee.id,
      );
      expect(isInDashboard).toBe(true);
    }
    console.log(
      `✅ 대시보드 복원: ${dashboardAfterExclude.length}명 → ${dashboardAfterInclude.length}명\n`,
    );
  }
}
