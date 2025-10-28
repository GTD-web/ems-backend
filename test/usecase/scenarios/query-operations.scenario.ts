import { BaseE2ETest } from '../../base-e2e.spec';
import { DashboardApiClient } from './api-clients/dashboard.api-client';

/**
 * 조회 처리 시나리오
 * - 부서 하이라키 조회
 * - 대시보드 직원 상태 조회
 * - 평가 대상 제외/포함 및 필터링 확인
 */
export class QueryOperationsScenario {
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

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
    const result =
      await this.dashboardApiClient.getEmployeesStatus(evaluationPeriodId);

    expect(Array.isArray(result)).toBe(true);

    return result;
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
   * 부서 하이라키에서 모든 직원 ID를 추출합니다 (재귀).
   */
  private 부서_하이라키에서_직원_추출(hierarchy: any[]): string[] {
    const employeeIds: string[] = [];

    const extractFromDept = (dept: any) => {
      // 현재 부서의 직원들 추가
      if (dept.employees && Array.isArray(dept.employees)) {
        dept.employees.forEach((emp: any) => {
          if (emp.id) {
            employeeIds.push(emp.id);
          }
        });
      }

      // 하위 부서 재귀 처리
      if (dept.subDepartments && Array.isArray(dept.subDepartments)) {
        dept.subDepartments.forEach((subDept: any) => {
          extractFromDept(subDept);
        });
      }
    };

    hierarchy.forEach(extractFromDept);
    return employeeIds;
  }

  /**
   * 부서 하이라키 직원 목록과 대시보드 직원 목록을 비교합니다.
   */
  async 부서_하이라키와_대시보드_직원_목록_비교_시나리오를_실행한다(
    evaluationPeriodId: string,
  ): Promise<{
    hierarchyEmployeeCount: number;
    dashboardEmployeeCount: number;
    hierarchyEmployeeIds: string[];
    dashboardEmployeeIds: string[];
    allEmployeesMatch: boolean;
    missingInDashboard: string[];
    extraInDashboard: string[];
  }> {
    console.log('\n📝 부서 하이라키 vs 대시보드 직원 목록 비교 시나리오');

    // 1. 부서 하이라키 조회 및 직원 추출
    const { hierarchyData } = await this.부서_하이라키를_조회한다();
    const hierarchyEmployeeIds =
      this.부서_하이라키에서_직원_추출(hierarchyData);

    console.log(`📊 부서 하이라키 직원 수: ${hierarchyEmployeeIds.length}명`);

    // 2. 대시보드 직원 상태 조회
    const dashboardEmployees =
      await this.대시보드_직원_상태를_조회한다(evaluationPeriodId);
    const dashboardEmployeeIds = dashboardEmployees.map(
      (emp: any) => emp.employee.id,
    );

    console.log(`📊 대시보드 직원 수: ${dashboardEmployeeIds.length}명`);

    // 3. 직원 목록 비교
    const hierarchySet = new Set(hierarchyEmployeeIds);
    const dashboardSet = new Set(dashboardEmployeeIds);

    // 대시보드에 없는 직원 (하이라키에만 있음)
    const missingInDashboard = hierarchyEmployeeIds.filter(
      (id) => !dashboardSet.has(id),
    );

    // 대시보드에만 있는 직원 (하이라키에 없음)
    const extraInDashboard = dashboardEmployeeIds.filter(
      (id) => !hierarchySet.has(id),
    );

    // 부서 하이라키에 직원이 없는 경우 (API 제한 등)
    if (hierarchyEmployeeIds.length === 0) {
      console.log(
        '⚠️ 부서 하이라키에서 직원 정보를 가져올 수 없습니다 (API 제한 또는 데이터 구조 문제)',
      );
      console.log(
        `   대시보드에는 ${dashboardEmployeeIds.length}명의 직원이 있습니다`,
      );
    }

    const allEmployeesMatch =
      hierarchyEmployeeIds.length > 0 &&
      missingInDashboard.length === 0 &&
      extraInDashboard.length === 0;

    if (hierarchyEmployeeIds.length > 0) {
      if (allEmployeesMatch) {
        console.log(
          '✅ 부서 하이라키와 대시보드 직원 목록이 완전히 일치합니다',
        );
      } else {
        console.log(
          `⚠️ 직원 목록 불일치 발견 - 대시보드 누락: ${missingInDashboard.length}명, 대시보드 추가: ${extraInDashboard.length}명`,
        );
        if (missingInDashboard.length > 0) {
          console.log(
            `   - 대시보드에 없는 직원: ${missingInDashboard.join(', ')}`,
          );
        }
        if (extraInDashboard.length > 0) {
          console.log(
            `   - 대시보드에만 있는 직원: ${extraInDashboard.join(', ')}`,
          );
        }
      }
    }

    return {
      hierarchyEmployeeCount: hierarchyEmployeeIds.length,
      dashboardEmployeeCount: dashboardEmployeeIds.length,
      hierarchyEmployeeIds,
      dashboardEmployeeIds,
      allEmployeesMatch,
      missingInDashboard,
      extraInDashboard,
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
