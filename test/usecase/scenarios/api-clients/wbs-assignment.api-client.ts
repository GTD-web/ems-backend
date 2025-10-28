import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * WBS 할당 API 클라이언트
 *
 * WBS 할당 관련 HTTP 요청을 캡슐화합니다.
 * - WBS 할당 생성/취소
 * - WBS 대량 할당
 * - WBS 할당 조회 (목록/상세)
 * - 할당 순서 변경
 * - 할당되지 않은 WBS 항목 조회
 * - WBS 할당 초기화 (평가기간/프로젝트/직원별)
 */
export class WbsAssignmentApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * WBS 할당 생성
   */
  async create(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        projectId: config.projectId,
        periodId: config.periodId,
      })
      .expect(201);

    return response.body;
  }

  /**
   * WBS 대량 할당
   */
  async bulkCreate(config: {
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
    }>;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments/bulk')
      .send({
        assignments: config.assignments,
      })
      .expect(201);

    return response.body;
  }

  /**
   * WBS 할당 취소
   */
  async cancel(assignmentId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}`)
      .expect(204);
  }

  /**
   * WBS 할당 목록 조회
   */
  async getList(config?: {
    periodId?: string;
    employeeId?: string;
    wbsItemId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<any> {
    const queryParams: any = {};

    if (config?.periodId) {
      queryParams.periodId = config.periodId;
    }
    if (config?.employeeId) {
      queryParams.employeeId = config.employeeId;
    }
    if (config?.wbsItemId) {
      queryParams.wbsItemId = config.wbsItemId;
    }
    if (config?.projectId) {
      queryParams.projectId = config.projectId;
    }
    if (config?.page) {
      queryParams.page = config.page.toString();
    }
    if (config?.limit) {
      queryParams.limit = config.limit.toString();
    }
    if (config?.orderBy) {
      queryParams.orderBy = config.orderBy;
    }
    if (config?.orderDirection) {
      queryParams.orderDirection = config.orderDirection;
    }

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments')
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 직원에게 할당된 WBS 조회
   */
  async getEmployeeWbsAssignments(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/wbs-assignments/employee/${config.employeeId}/period/${config.periodId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트의 WBS 할당 조회
   */
  async getProjectWbsAssignments(config: {
    projectId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/wbs-assignments/project/${config.projectId}/period/${config.periodId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * WBS 항목에 할당된 직원 조회
   */
  async getWbsItemAssignments(config: {
    wbsItemId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/wbs-assignments/wbs-item/${config.wbsItemId}/period/${config.periodId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 할당되지 않은 WBS 항목 목록 조회
   */
  async getUnassignedWbsItems(config: {
    projectId: string;
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments/unassigned-wbs-items')
      .query({
        projectId: config.projectId,
        periodId: config.periodId,
        employeeId: config.employeeId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 상세 조회
   */
  async getDetail(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments/detail')
      .query({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        projectId: config.projectId,
        periodId: config.periodId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 순서 변경
   */
  async changeOrder(config: {
    assignmentId: string;
    direction: 'up' | 'down';
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-criteria/wbs-assignments/${config.assignmentId}/order`,
      )
      .query({
        direction: config.direction,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 평가기간의 WBS 할당 초기화
   */
  async resetPeriodWbsAssignments(periodId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-assignments/period/${periodId}/reset`,
      )
      .expect(204);
  }

  /**
   * 프로젝트의 WBS 할당 초기화
   */
  async resetProjectWbsAssignments(config: {
    projectId: string;
    periodId: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-assignments/project/${config.projectId}/period/${config.periodId}/reset`,
      )
      .expect(204);
  }

  /**
   * 직원의 WBS 할당 초기화
   */
  async resetEmployeeWbsAssignments(config: {
    employeeId: string;
    periodId: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-assignments/employee/${config.employeeId}/period/${config.periodId}/reset`,
      )
      .expect(204);
  }

  /**
   * WBS 할당 생성 (에러 예상)
   */
  async createExpectError(
    config: {
      employeeId?: string;
      wbsItemId?: string;
      projectId?: string;
      periodId?: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};

    if (config.employeeId !== undefined) {
      requestBody.employeeId = config.employeeId;
    }
    if (config.wbsItemId !== undefined) {
      requestBody.wbsItemId = config.wbsItemId;
    }
    if (config.projectId !== undefined) {
      requestBody.projectId = config.projectId;
    }
    if (config.periodId !== undefined) {
      requestBody.periodId = config.periodId;
    }

    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 대량 할당 (에러 예상)
   */
  async bulkCreateExpectError(
    config: {
      assignments?: Array<{
        employeeId?: string;
        wbsItemId?: string;
        projectId?: string;
        periodId?: string;
      }>;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments/bulk')
      .send(config)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 할당 취소 (에러 예상)
   */
  async cancelExpectError(
    assignmentId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}`)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 할당 상세 조회 (에러 예상)
   */
  async getDetailExpectError(
    config: {
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments/detail')
      .query({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        projectId: config.projectId,
        periodId: config.periodId,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 직원에게 할당된 WBS 조회 (에러 예상)
   */
  async getEmployeeWbsAssignmentsExpectError(
    config: {
      employeeId: string;
      periodId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/wbs-assignments/employee/${config.employeeId}/period/${config.periodId}`,
      )
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * WBS 할당 순서 변경 (에러 예상)
   */
  async changeOrderExpectError(
    config: {
      assignmentId: string;
      direction: 'up' | 'down' | string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-criteria/wbs-assignments/${config.assignmentId}/order`,
      )
      .query({
        direction: config.direction,
      })
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 평가기간의 WBS 할당 초기화 (에러 예상)
   */
  async resetPeriodWbsAssignmentsExpectError(
    periodId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-assignments/period/${periodId}/reset`,
      )
      .expect(expectedStatus);

    return response.body;
  }
}
