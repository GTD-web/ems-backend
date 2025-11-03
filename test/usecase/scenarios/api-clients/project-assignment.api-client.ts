import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 프로젝트 할당 API 클라이언트
 *
 * 프로젝트 할당 관련 HTTP 요청을 캡슐화합니다.
 * - 프로젝트 할당 생성/취소
 * - 프로젝트 대량 할당
 * - 프로젝트 할당 조회 (목록/상세)
 * - 할당 순서 변경
 * - 할당되지 않은 직원 조회
 * - 할당 가능한 프로젝트 조회
 */
export class ProjectAssignmentApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 프로젝트 할당 생성
   */
  async create(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId: config.employeeId,
        projectId: config.projectId,
        periodId: config.periodId,
      });

    // 응답 상태가 201이 아닌 경우 에러 정보 출력
    if (response.status !== 201) {
      console.error(
        `프로젝트 할당 생성 실패 - Status: ${response.status}, Body:`,
        JSON.stringify(response.body, null, 2),
      );
      console.error(
        `요청 데이터 - employeeId: ${config.employeeId}, projectId: ${config.projectId}, periodId: ${config.periodId}`,
      );
    }

    expect(response.status).toBe(201);
    return response.body;
  }

  /**
   * 프로젝트 대량 할당
   */
  async bulkCreate(config: {
    assignments: Array<{
      employeeId: string;
      projectId: string;
      periodId: string;
    }>;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments/bulk')
      .send({
        assignments: config.assignments,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 프로젝트 할당 취소 (Deprecated)
   * @deprecated 프로젝트 ID 기반 메서드를 사용하세요. cancelByProject
   */
  async cancel(assignmentId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
      .expect(200);
  }

  /**
   * 프로젝트 할당 취소 (프로젝트 ID 기반)
   */
  async cancelByProject(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/project-assignments/project/${config.projectId}`,
      )
      .send({
        employeeId: config.employeeId,
        periodId: config.periodId,
      })
      .expect(200);
  }

  /**
   * 프로젝트 할당 목록 조회
   */
  async getList(config?: {
    periodId?: string;
    employeeId?: string;
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
      .get('/admin/evaluation-criteria/project-assignments')
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트 할당 상세 조회
   */
  async getDetail(assignmentId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
      .expect(200);

    return response.body;
  }

  /**
   * 직원에게 할당된 프로젝트 조회
   */
  async getEmployeeProjects(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/project-assignments/employees/${config.employeeId}/periods/${config.periodId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트에 할당된 직원 조회
   */
  async getProjectEmployees(config: {
    projectId: string;
    periodId: string;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/project-assignments/projects/${config.projectId}/periods/${config.periodId}`,
      )
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트가 할당되지 않은 직원 목록 조회
   */
  async getUnassignedEmployees(config: {
    periodId: string;
    projectId?: string;
  }): Promise<any> {
    const queryParams: any = {
      periodId: config.periodId,
    };

    if (config.projectId) {
      queryParams.projectId = config.projectId;
    }

    const response = await this.testSuite
      .request()
      .get(
        '/admin/evaluation-criteria/project-assignments/unassigned-employees',
      )
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 할당 가능한 프로젝트 목록 조회
   */
  async getAvailableProjects(config: {
    periodId: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<any> {
    const queryParams: any = {
      periodId: config.periodId,
    };

    if (config.status) {
      queryParams.status = config.status;
    }
    if (config.search) {
      queryParams.search = config.search;
    }
    if (config.page) {
      queryParams.page = config.page.toString();
    }
    if (config.limit) {
      queryParams.limit = config.limit.toString();
    }
    if (config.sortBy) {
      queryParams.sortBy = config.sortBy;
    }
    if (config.sortOrder) {
      queryParams.sortOrder = config.sortOrder;
    }

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/project-assignments/available-projects')
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트 할당 순서 변경 (Deprecated)
   * @deprecated 프로젝트 ID 기반 메서드를 사용하세요. changeOrderByProject
   */
  async changeOrder(config: {
    assignmentId: string;
    direction: 'up' | 'down';
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-criteria/project-assignments/${config.assignmentId}/order`,
      )
      .query({
        direction: config.direction,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트 할당 순서 변경 (프로젝트 ID 기반)
   */
  async changeOrderByProject(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
    direction: 'up' | 'down';
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-criteria/project-assignments/project/${config.projectId}/order`,
      )
      .send({
        employeeId: config.employeeId,
        periodId: config.periodId,
        direction: config.direction,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트 할당 생성 (에러 예상)
   */
  async createExpectError(
    config: {
      employeeId?: string;
      projectId?: string;
      periodId?: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const requestBody: any = {};

    if (config.employeeId !== undefined) {
      requestBody.employeeId = config.employeeId;
    }
    if (config.projectId !== undefined) {
      requestBody.projectId = config.projectId;
    }
    if (config.periodId !== undefined) {
      requestBody.periodId = config.periodId;
    }

    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments')
      .send(requestBody)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 프로젝트 대량 할당 (에러 예상)
   */
  async bulkCreateExpectError(
    config: {
      assignments?: Array<{
        employeeId?: string;
        projectId?: string;
        periodId?: string;
      }>;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments/bulk')
      .send(config)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 프로젝트 할당 취소 (에러 예상)
   */
  async cancelExpectError(
    assignmentId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 프로젝트 할당 상세 조회 (에러 예상)
   */
  async getDetailExpectError(
    assignmentId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 직원에게 할당된 프로젝트 조회 (에러 예상)
   */
  async getEmployeeProjectsExpectError(
    config: {
      employeeId: string;
      periodId: string;
    },
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/project-assignments/employee/${config.employeeId}/period/${config.periodId}`,
      )
      .expect(expectedStatus);

    return response.body;
  }

  /**
   * 프로젝트 할당 순서 변경 (에러 예상)
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
        `/admin/evaluation-criteria/project-assignments/${config.assignmentId}/order`,
      )
      .query({
        direction: config.direction,
      })
      .expect(expectedStatus);

    return response.body;
  }

}
