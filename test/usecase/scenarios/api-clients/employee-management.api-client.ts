import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 직원 관리 API 클라이언트
 *
 * 직원 조회, 부서 하이라키, 직원 제외/포함 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class EmployeeManagementApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 부서 하이라키 구조 조회
   *
   * @returns 부서 계층 구조 데이터
   */
  async getDepartmentHierarchy(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/employees/department-hierarchy')
      .expect(200);

    return response.body;
  }

  /**
   * 직원 목록을 포함한 부서 하이라키 구조 조회
   *
   * @returns 부서 계층 구조와 직원 목록
   */
  async getDepartmentHierarchyWithEmployees(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/employees/department-hierarchy-with-employees')
      .expect(200);

    return response.body;
  }

  /**
   * 전체 직원 목록 조회
   *
   * @param config.includeExcluded - 제외된 직원 포함 여부 (기본값: false)
   * @returns 전체 직원 목록
   */
  async getAllEmployees(config?: { includeExcluded?: boolean }): Promise<any> {
    const queryParams: any = {};
    if (config?.includeExcluded !== undefined) {
      queryParams.includeExcluded = config.includeExcluded.toString();
    }

    const response = await this.testSuite
      .request()
      .get('/admin/employees')
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 조회에서 제외된 직원 목록 조회
   *
   * @returns 제외된 직원 목록
   */
  async getExcludedEmployees(): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/employees/excluded')
      .expect(200);

    return response.body;
  }

  /**
   * 직원을 조회 목록에서 제외
   *
   * @param config.employeeId - 직원 ID
   * @param config.excludeReason - 제외 사유
   * @returns 제외된 직원 정보
   */
  async excludeEmployeeFromList(config: {
    employeeId: string;
    excludeReason: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/employees/${config.employeeId}/exclude`)
      .send({
        excludeReason: config.excludeReason,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 직원을 조회 목록에 포함
   *
   * @param employeeId - 직원 ID
   * @returns 포함된 직원 정보
   */
  async includeEmployeeInList(employeeId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/employees/${employeeId}/include`)
      .expect(200);

    return response.body;
  }

  // ==================== 에러 케이스 테스트용 메서드 ====================

  /**
   * 전체 직원 목록 조회 (에러 예상)
   */
  async getAllEmployeesExpectError(
    config: {
      includeExcluded?: boolean;
    },
    expectedStatus: number,
  ): Promise<any> {
    const queryParams: any = {};
    if (config.includeExcluded !== undefined) {
      queryParams.includeExcluded = config.includeExcluded.toString();
    }

    const response = await this.testSuite
      .request()
      .get('/admin/employees')
      .query(queryParams)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 직원 제외 (에러 예상)
   */
  async excludeEmployeeFromListExpectError(
    config: {
      employeeId: string;
      excludeReason?: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};
    if (config.excludeReason !== undefined) {
      requestBody.excludeReason = config.excludeReason;
    }

    const response = await this.testSuite
      .request()
      .patch(`/admin/employees/${config.employeeId}/exclude`)
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 직원 포함 (에러 예상)
   */
  async includeEmployeeInListExpectError(
    employeeId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(`/admin/employees/${employeeId}/include`)
      .expect(expectedStatus);

    return response.body;
  }
}
