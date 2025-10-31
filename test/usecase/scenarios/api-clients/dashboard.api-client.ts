import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 대시보드 API 클라이언트
 *
 * 대시보드 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class DashboardApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 직원별 할당 데이터 조회 API 호출
   *
   * @param config.periodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 직원에게 할당된 프로젝트, WBS, 산출물 등의 데이터
   */
  async getEmployeeAssignedData(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.periodId}/employees/${config.employeeId}/assigned-data`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 직원 현황 조회 API 호출
   *
   * @param periodId - 평가기간 ID
   * @param includeUnregistered - 등록 해제된 직원 포함 여부
   * @returns 평가기간의 모든 직원 현황 목록
   */
  async getEmployeesStatus(
    periodId: string,
    includeUnregistered: boolean = false,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/employees/status`)
      .query({ includeUnregistered: includeUnregistered.toString() })
      .expect(200);

    return response.body;
  }

  /**
   * 개별 직원의 평가기간 현황 조회 API 호출
   *
   * @param config.periodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 특정 직원의 평가기간 현황 데이터
   */
  async getEmployeeEvaluationPeriodStatus(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.periodId}/employees/${config.employeeId}/status`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 평가자별 담당 대상자 현황 조회 API 호출
   *
   * @param config.periodId - 평가기간 ID
   * @param config.evaluatorId - 평가자 ID
   * @returns 평가자가 담당하는 피평가자 목록
   */
  async getEvaluatorTargetsStatus(config: {
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.periodId}/my-evaluation-targets/${config.evaluatorId}/status`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 평가자-피평가자 할당 데이터 조회 API 호출
   *
   * @param config.periodId - 평가기간 ID
   * @param config.evaluatorId - 평가자 ID
   * @param config.employeeId - 피평가자 ID
   * @returns 평가자가 볼 수 있는 특정 피평가자의 할당 데이터
   */
  async getEvaluatorEmployeeAssignedData(config: {
    periodId: string;
    evaluatorId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.periodId}/evaluators/${config.evaluatorId}/employees/${config.employeeId}/assigned-data`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 나의 할당 정보 조회 (현재 로그인 사용자)
   *
   * @param periodId - 평가기간 ID
   * @returns 현재 로그인 사용자의 할당 정보 (하향평가 정보 제외)
   */
  async getMyAssignedData(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/my-assigned-data`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간별 최종평가 목록 조회
   *
   * @param periodId - 평가기간 ID
   * @returns 평가기간의 모든 직원 최종평가 목록
   */
  async getFinalEvaluationsByPeriod(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/final-evaluations`)
      .expect(200);

    return response.body;
  }

  /**
   * 직원별 최종평가 목록 조회
   *
   * @param config.employeeId - 직원 ID
   * @param config.startDate - 조회 시작일 (선택)
   * @param config.endDate - 조회 종료일 (선택)
   * @returns 직원의 모든 평가기간 최종평가 목록
   */
  async getFinalEvaluationsByEmployee(config: {
    employeeId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const queryParams: any = {};
    if (config.startDate) queryParams.startDate = config.startDate;
    if (config.endDate) queryParams.endDate = config.endDate;

    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/employees/${config.employeeId}/final-evaluations`)
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 전체 직원별 최종평가 목록 조회
   *
   * @param config.startDate - 조회 시작일 (선택)
   * @param config.endDate - 조회 종료일 (선택)
   * @returns 모든 직원의 최종평가 목록 (평가기간별로 매트릭스 형태)
   */
  async getAllEmployeesFinalEvaluations(config?: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const queryParams: any = {};
    if (config?.startDate) queryParams.startDate = config.startDate;
    if (config?.endDate) queryParams.endDate = config.endDate;

    const response = await this.testSuite
      .request()
      .get('/admin/dashboard/final-evaluations')
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 평가 현황 및 할당 데이터 통합 조회
   *
   * @param config.periodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 직원의 평가 진행 현황과 할당 데이터
   */
  async getEmployeeCompleteStatus(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.periodId}/employees/${config.employeeId}/complete-status`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 아래 메서드들은 컨트롤러에 없음 - 제거 예정 또는 이동 필요 ====================

  /**
   * @deprecated 이 메서드는 Employee Management Controller에 있습니다.
   * 부서 하이라키 조회 API 호출
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
   * @deprecated 이 메서드는 Employee Management Controller에 있습니다.
   * 부서 하이라키 with 직원 목록 조회 API 호출
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
   * @deprecated 컨트롤러에 없는 엔드포인트입니다.
   * 평가 진행 현황 조회 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 평가 진행 현황 통계
   */
  async getEvaluationProgress(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/evaluation-progress`)
      .expect(200);

    return response.body;
  }

  /**
   * @deprecated 컨트롤러에 없는 엔드포인트입니다.
   * 평가 통계 조회 API 호출
   *
   * @param periodId - 평가기간 ID
   * @returns 평가 통계 데이터
   */
  async getEvaluationStatistics(periodId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/statistics`)
      .expect(200);

    return response.body;
  }

  /**
   * @deprecated 컨트롤러에 없는 엔드포인트입니다.
   * 직원별 평가 상세 정보 조회 API 호출
   *
   * @param config.periodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @returns 직원의 평가 상세 정보
   */
  async getEmployeeEvaluationDetail(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.periodId}/employees/${config.employeeId}/evaluation-detail`,
      )
      .expect(200);

    return response.body;
  }
}
