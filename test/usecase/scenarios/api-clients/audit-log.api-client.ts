import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 감사로그 API 클라이언트
 *
 * 감사로그 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class AuditLogApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 감사로그 목록 조회 API 호출
   *
   * @param config - 조회 옵션
   * @returns 감사로그 목록
   */
  async getAuditLogs(config?: {
    page?: number;
    limit?: number;
    userId?: string;
    userEmail?: string;
    employeeNumber?: string;
    requestMethod?: string;
    requestUrl?: string;
    responseStatusCode?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    const query: any = {};
    if (config?.page) query.page = config.page;
    if (config?.limit) query.limit = config.limit;
    if (config?.userId) query.userId = config.userId;
    if (config?.userEmail) query.userEmail = config.userEmail;
    if (config?.employeeNumber) query.employeeNumber = config.employeeNumber;
    if (config?.requestMethod) query.requestMethod = config.requestMethod;
    if (config?.requestUrl) query.requestUrl = config.requestUrl;
    if (config?.responseStatusCode)
      query.responseStatusCode = config.responseStatusCode;
    if (config?.startDate) query.startDate = config.startDate;
    if (config?.endDate) query.endDate = config.endDate;

    const response = await this.testSuite
      .request()
      .get('/admin/audit-logs')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 감사로그 상세 조회 API 호출
   *
   * @param id - 감사로그 ID
   * @returns 감사로그 상세 정보
   */
  async getAuditLogDetail(id: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/audit-logs/${id}`)
      .expect(200);

    return response.body;
  }
}

