import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 산출물 API 클라이언트
 *
 * 산출물 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 * 비즈니스 로직이나 복합 시나리오는 DeliverableScenario에서 처리합니다.
 */
export class DeliverableApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 산출물 생성 API 호출
   */
  async create(config: {
    name: string;
    type: string;
    employeeId: string;
    wbsItemId: string;
    description?: string;
    filePath?: string;
    createdBy?: string;
  }): Promise<any> {
    const requestBody: any = {
      name: config.name,
      type: config.type,
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
    };

    if (config.description !== undefined) {
      requestBody.description = config.description;
    }
    if (config.filePath !== undefined) {
      requestBody.filePath = config.filePath;
    }
    if (config.createdBy !== undefined) {
      requestBody.createdBy = config.createdBy;
    }

    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/deliverables')
      .send(requestBody)
      .expect(201);

    return response.body;
  }

  /**
   * 산출물 수정 API 호출
   */
  async update(config: {
    id: string;
    name?: string;
    type?: string;
    description?: string;
    filePath?: string;
    employeeId?: string;
    wbsItemId?: string;
    isActive?: boolean;
    updatedBy?: string;
  }): Promise<any> {
    const requestBody: any = {};

    if (config.name !== undefined) {
      requestBody.name = config.name;
    }
    if (config.type !== undefined) {
      requestBody.type = config.type;
    }
    if (config.description !== undefined) {
      requestBody.description = config.description;
    }
    if (config.filePath !== undefined) {
      requestBody.filePath = config.filePath;
    }
    if (config.employeeId !== undefined) {
      requestBody.employeeId = config.employeeId;
    }
    if (config.wbsItemId !== undefined) {
      requestBody.wbsItemId = config.wbsItemId;
    }
    if (config.isActive !== undefined) {
      requestBody.isActive = config.isActive;
    }
    if (config.updatedBy !== undefined) {
      requestBody.updatedBy = config.updatedBy;
    }

    const response = await this.testSuite
      .request()
      .put(`/admin/performance-evaluation/deliverables/${config.id}`)
      .send(requestBody)
      .expect(200);

    return response.body;
  }

  /**
   * 산출물 삭제 API 호출
   */
  async delete(deliverableId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/performance-evaluation/deliverables/${deliverableId}`)
      .expect(204);
  }

  /**
   * 벌크 산출물 생성 API 호출
   */
  async bulkCreate(config: {
    deliverables: Array<{
      name: string;
      type: string;
      employeeId: string;
      wbsItemId: string;
      description?: string;
      filePath?: string;
    }>;
  }): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/deliverables/bulk')
      .send({ deliverables: config.deliverables })
      .expect(201);

    return response.body;
  }

  /**
   * 벌크 산출물 삭제 API 호출
   */
  async bulkDelete(deliverableIds: string[]): Promise<any> {
    const response = await this.testSuite
      .request()
      .delete('/admin/performance-evaluation/deliverables/bulk')
      .send({ deliverableIds })
      .expect(200);

    return response.body;
  }

  /**
   * 직원별 산출물 조회 API 호출
   */
  async getByEmployee(config: {
    employeeId: string;
    activeOnly?: boolean;
  }): Promise<any> {
    const queryParams: any = {};
    if (config.activeOnly !== undefined) {
      queryParams.activeOnly = config.activeOnly.toString();
    }

    const response = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/deliverables/employee/${config.employeeId}`,
      )
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 항목별 산출물 조회 API 호출
   */
  async getByWbsItem(config: {
    wbsItemId: string;
    activeOnly?: boolean;
  }): Promise<any> {
    const queryParams: any = {};
    if (config.activeOnly !== undefined) {
      queryParams.activeOnly = config.activeOnly.toString();
    }

    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/deliverables/wbs/${config.wbsItemId}`)
      .query(queryParams)
      .expect(200);

    return response.body;
  }

  /**
   * 산출물 상세 조회 API 호출
   */
  async getDetail(deliverableId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/deliverables/${deliverableId}`)
      .expect(200);

    return response.body;
  }

  /**
   * 산출물 상세 조회 API 호출 (에러 예상)
   */
  async getDetailExpectError(
    deliverableId: string,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/deliverables/${deliverableId}`)
      .expect(expectedStatus);

    return response;
  }

  /**
   * 산출물 생성 API 호출 (에러 예상)
   */
  async createExpectError(
    requestBody: any,
    expectedStatus: number,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/deliverables')
      .send(requestBody)
      .expect(expectedStatus);

    return response;
  }
}
