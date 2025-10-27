import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * 조회 처리 시나리오
 * - 부서 하이라키 조회
 * - 대시보드 직원 상태 조회
 * - 평가 대상 제외/포함 및 필터링 확인
 */
export class QueryOperationsScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 부서 하이라키 조회 및 검증
   */
  async 부서_하이라키를_조회한다(): Promise<{
    totalDepartments: number;
    hierarchyData: any[];
  }> {
    const response = await this.testSuite
      .request()
      .get('/admin/employees/departments/hierarchy-with-employees')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    // 첫 번째 부서 구조 검증
    const firstDept = response.body[0];
    expect(firstDept).toHaveProperty('id');
    expect(firstDept).toHaveProperty('name');
    expect(firstDept).toHaveProperty('employees');
    expect(firstDept).toHaveProperty('employeeCount');
    expect(firstDept).toHaveProperty('subDepartments');
    expect(Array.isArray(firstDept.employees)).toBe(true);
    expect(firstDept.employeeCount).toBe(firstDept.employees.length);

    // 계층 구조 재귀 검증
    const validateHierarchy = (dept: any) => {
      if (dept.subDepartments?.length > 0) {
        dept.subDepartments.forEach((subDept: any) => {
          expect(subDept).toHaveProperty('employees');
          expect(subDept).toHaveProperty('employeeCount');
          expect(subDept.employeeCount).toBe(subDept.employees.length);
          validateHierarchy(subDept);
        });
      }
    };

    response.body.forEach(validateHierarchy);

    // 전체 부서 수 계산
    const countDepartments = (depts: any[]): number => {
      return depts.reduce((count, dept) => {
        return (
          count +
          1 +
          (dept.subDepartments ? countDepartments(dept.subDepartments) : 0)
        );
      }, 0);
    };

    const totalDepartments = countDepartments(response.body);

    return {
      totalDepartments,
      hierarchyData: response.body,
    };
  }

  /**
   * 대시보드 직원 상태 조회
   */
  async 대시보드_직원_상태를_조회한다(
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
   * 직원 조회 제외 (Employee.isExcludedFromList)
   */
  async 직원_조회에서_제외한다(
    employeeId: string,
    excludeReason: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/employees/${employeeId}/exclude`)
      .send({ excludeReason })
      .expect(200);

    expect(response.body.isExcludedFromList).toBe(true);
    expect(response.body.excludeReason).toBe(excludeReason);
    return response.body;
  }

  /**
   * 직원 조회에 포함 (Employee.isExcludedFromList)
   */
  async 직원_조회에_포함한다(employeeId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/employees/${employeeId}/include`)
      .expect(200);

    expect(response.body.isExcludedFromList).toBe(false);
    expect(response.body.excludeReason).toBeNull();
    return response.body;
  }

  /**
   * 직원 조회 제외/포함 시 대시보드 필터링 검증
   */
  async 직원_조회_제외_포함_시나리오를_실행한다(
    evaluationPeriodId: string,
  ): Promise<{
    employeeId: string;
    initialEmployeeCount: number;
    excludedFromDashboard: boolean;
    includedBackInDashboard: boolean;
  }> {
    console.log('\n📝 직원 조회 제외/포함 시나리오 (isExcludedFromList 검증)');

    // 1. 제외 전 대시보드 조회
    const dashboardBefore =
      await this.대시보드_직원_상태를_조회한다(evaluationPeriodId);
    expect(dashboardBefore.length).toBeGreaterThan(0);

    const testEmployee = dashboardBefore[0];
    const employeeId = testEmployee.employee.id;
    const initialEmployeeCount = dashboardBefore.length;

    console.log(
      `📝 테스트 대상 직원: ${testEmployee.employee.name} (${employeeId})`,
    );
    console.log(`📊 제외 전 대시보드 직원 수: ${initialEmployeeCount}명`);

    // 2. 직원 조회에서 제외
    await this.직원_조회에서_제외한다(employeeId, '직원 조회 제외 테스트');
    console.log('✅ 직원 조회 제외 완료');

    // 3. 제외 후 대시보드 조회 - 직원이 사라져야 함
    const dashboardAfterExclude =
      await this.대시보드_직원_상태를_조회한다(evaluationPeriodId);
    const excludedFromDashboard = !dashboardAfterExclude.some(
      (emp: any) => emp.employee.id === employeeId,
    );

    expect(excludedFromDashboard).toBe(true);
    expect(dashboardAfterExclude.length).toBe(initialEmployeeCount - 1);
    console.log(
      `✅ 대시보드에서 제외 확인 (${initialEmployeeCount}명 → ${dashboardAfterExclude.length}명)`,
    );

    // 4. 직원 조회에 다시 포함
    await this.직원_조회에_포함한다(employeeId);
    console.log('✅ 직원 조회 포함 완료');

    // 5. 포함 후 대시보드 조회 - 직원이 다시 나타나야 함
    const dashboardAfterInclude =
      await this.대시보드_직원_상태를_조회한다(evaluationPeriodId);
    const includedBackInDashboard = dashboardAfterInclude.some(
      (emp: any) => emp.employee.id === employeeId,
    );

    expect(includedBackInDashboard).toBe(true);
    expect(dashboardAfterInclude.length).toBe(initialEmployeeCount);
    console.log(
      `✅ 대시보드에서 복원 확인 (${dashboardAfterExclude.length}명 → ${dashboardAfterInclude.length}명)`,
    );

    return {
      employeeId,
      initialEmployeeCount,
      excludedFromDashboard,
      includedBackInDashboard,
    };
  }

  /**
   * 전체 조회 시나리오 실행
   */
  async 전체_조회_시나리오를_실행한다(evaluationPeriodId: string): Promise<{
    totalDepartments: number;
    employeeCount: number;
  }> {
    // 1. 부서 하이라키 조회
    const { totalDepartments } = await this.부서_하이라키를_조회한다();

    // 2. 대시보드 직원 상태 조회
    const employees =
      await this.대시보드_직원_상태를_조회한다(evaluationPeriodId);

    return {
      totalDepartments,
      employeeCount: employees.length,
    };
  }
}
