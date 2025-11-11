import { BaseE2ETest } from '../../../base-e2e.spec';
import { AuditLogApiClient } from '../api-clients/audit-log.api-client';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';
import { WbsSelfEvaluationApiClient } from '../api-clients/wbs-self-evaluation.api-client';
import { EvaluationPeriodManagementApiClient } from '../api-clients/evaluation-period-management.api-client';

/**
 * 감사로그 자동 저장 시나리오
 *
 * 감사로그 자동 저장 및 조회 관련 모든 시나리오를 제공합니다.
 */
export class AuditLogScenario {
  private auditLogApiClient: AuditLogApiClient;
  private dashboardApiClient: DashboardApiClient;
  private wbsSelfEvaluationApiClient: WbsSelfEvaluationApiClient;
  private evaluationPeriodApiClient: EvaluationPeriodManagementApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.auditLogApiClient = new AuditLogApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.wbsSelfEvaluationApiClient = new WbsSelfEvaluationApiClient(testSuite);
    this.evaluationPeriodApiClient = new EvaluationPeriodManagementApiClient(
      testSuite,
    );
  }

  // ==================== 감사로그 조회 ====================

  /**
   * 감사로그 목록을 조회한다
   */
  async 감사로그목록을_조회한다(config?: {
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
  }) {
    return await this.auditLogApiClient.getAuditLogs(config);
  }

  /**
   * 감사로그 상세 정보를 조회한다
   */
  async 감사로그상세를_조회한다(id: string) {
    return await this.auditLogApiClient.getAuditLogDetail(id);
  }

  // ==================== API 요청 전송 및 감사로그 검증 ====================

  /**
   * API 요청을 전송하고 감사로그가 자동으로 저장되었는지 검증한다
   */
  async API요청을_전송하고_감사로그를_검증한다(config: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    url: string;
    body?: any;
    expectedStatusCode?: number;
    expectedRequestMethod?: string;
    expectedRequestUrl?: string;
    expectedRequestPath?: string;
    expectedRequestBody?: any;
    expectedResponseBody?: any;
    expectedUserId?: string;
    expectedUserEmail?: string;
    expectedEmployeeNumber?: string;
  }) {
    // API 요청 전송
    let response: any;
    const request = this.testSuite.request();

    switch (config.method) {
      case 'GET':
        response = await request.get(config.url).expect(config.expectedStatusCode || 200);
        break;
      case 'POST':
        response = await request
          .post(config.url)
          .send(config.body || {})
          .expect(config.expectedStatusCode || 201);
        break;
      case 'PATCH':
        response = await request
          .patch(config.url)
          .send(config.body || {})
          .expect(config.expectedStatusCode || 200);
        break;
      case 'DELETE':
        response = await request
          .delete(config.url)
          .expect(config.expectedStatusCode || 200);
        break;
    }

    // 감사로그 조회 (최신 항목) - 시간 기반으로 정렬된 최신 항목 찾기
    // 요청 전 시간 기록
    const beforeRequestTime = new Date();
    beforeRequestTime.setSeconds(beforeRequestTime.getSeconds() - 1);

    // 잠시 대기 (감사로그 저장 완료 대기)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 감사로그 조회 (최신 항목)
    const auditLogs = await this.감사로그목록을_조회한다({
      page: 1,
      limit: 20,
      requestMethod: config.expectedRequestMethod || config.method,
    });

    // 요청 후 생성된 감사로그 찾기
    const urlWithoutQuery = config.url.split('?')[0];
    const latestAuditLog = auditLogs.items.find(
      (log: any) =>
        new Date(log.requestStartTime).getTime() >=
        beforeRequestTime.getTime() &&
        log.requestUrl.includes(urlWithoutQuery),
    );

    if (!latestAuditLog) {
      // 디버깅을 위한 로그
      console.log('감사로그를 찾을 수 없습니다.');
      console.log('요청 URL:', config.url);
      console.log('요청 전 시간:', beforeRequestTime);
      console.log('조회된 감사로그:', auditLogs.items.map((log: any) => ({
        url: log.requestUrl,
        method: log.requestMethod,
        time: log.requestStartTime,
      })));
    }

    expect(latestAuditLog).toBeDefined();

    // 감사로그 검증
    expect(latestAuditLog.requestMethod).toBe(
      config.expectedRequestMethod || config.method,
    );
    if (config.expectedRequestUrl) {
      expect(latestAuditLog.requestUrl).toContain(config.expectedRequestUrl);
    }
    if (config.expectedRequestPath) {
      expect(latestAuditLog.requestPath).toBe(config.expectedRequestPath);
    }
    if (config.expectedStatusCode) {
      expect(latestAuditLog.responseStatusCode).toBe(
        config.expectedStatusCode,
      );
    }
    if (config.expectedUserId) {
      expect(latestAuditLog.userId).toBe(config.expectedUserId);
    }
    if (config.expectedUserEmail) {
      expect(latestAuditLog.userEmail).toBe(config.expectedUserEmail);
    }
    if (config.expectedEmployeeNumber) {
      expect(latestAuditLog.employeeNumber).toBe(
        config.expectedEmployeeNumber,
      );
    }
    if (config.expectedRequestBody !== undefined) {
      if (config.expectedRequestBody === null) {
        expect(latestAuditLog.requestBody).toBeNull();
      } else {
        expect(latestAuditLog.requestBody).toEqual(config.expectedRequestBody);
      }
    }
    if (config.expectedResponseBody !== undefined) {
      expect(latestAuditLog.responseBody).toMatchObject(
        config.expectedResponseBody,
      );
    }

    // 메타데이터 검증
    expect(latestAuditLog.requestId).toBeDefined();
    expect(latestAuditLog.requestIp).toBeDefined();
    expect(latestAuditLog.requestStartTime).toBeDefined();
    expect(latestAuditLog.requestEndTime).toBeDefined();
    expect(latestAuditLog.duration).toBeGreaterThanOrEqual(0);
    expect(latestAuditLog.createdAt).toBeDefined();

    return {
      response: response.body,
      auditLog: latestAuditLog,
    };
  }

  /**
   * 대시보드 API를 호출하고 감사로그를 검증한다
   */
  async 대시보드API를_호출하고_감사로그를_검증한다(config: {
    periodId: string;
    employeeId: string;
    apiType: 'employee-status' | 'assigned-data' | 'employees-status';
  }) {
    let url: string;
    let expectedRequestPath: string;

    switch (config.apiType) {
      case 'employee-status':
        url = `/admin/dashboard/${config.periodId}/employees/${config.employeeId}/status`;
        expectedRequestPath = `/admin/dashboard/:evaluationPeriodId/employees/:employeeId/status`;
        break;
      case 'assigned-data':
        url = `/admin/dashboard/${config.periodId}/employees/${config.employeeId}/assigned-data`;
        expectedRequestPath = `/admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data`;
        break;
      case 'employees-status':
        url = `/admin/dashboard/${config.periodId}/employees/status`;
        expectedRequestPath = `/admin/dashboard/:evaluationPeriodId/employees/status`;
        break;
    }

    return await this.API요청을_전송하고_감사로그를_검증한다({
      method: 'GET',
      url,
      expectedRequestMethod: 'GET',
      expectedRequestUrl: url,
      expectedRequestPath,
      expectedStatusCode: 200,
    });
  }

  /**
   * WBS 자기평가 API를 호출하고 감사로그를 검증한다
   */
  async WBS자기평가API를_호출하고_감사로그를_검증한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult?: string;
  }) {
    const url = `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}/wbs/${config.wbsItemId}/period/${config.periodId}`;
    const body = {
      selfEvaluationContent: config.selfEvaluationContent,
      selfEvaluationScore: config.selfEvaluationScore,
      performanceResult: config.performanceResult,
    };

    return await this.API요청을_전송하고_감사로그를_검증한다({
      method: 'POST',
      url,
      body,
      expectedRequestMethod: 'POST',
      expectedRequestUrl: url,
      expectedRequestPath: `/admin/performance-evaluation/wbs-self-evaluations/employee/:employeeId/wbs/:wbsItemId/period/:periodId`,
      expectedStatusCode: 200,
      expectedRequestBody: body,
    });
  }

  /**
   * 평가기간 API를 호출하고 감사로그를 검증한다
   */
  async 평가기간API를_호출하고_감사로그를_검증한다(config: {
    method: 'POST' | 'PATCH' | 'DELETE';
    url: string;
    body?: any;
    expectedStatusCode?: number;
  }) {
    return await this.API요청을_전송하고_감사로그를_검증한다({
      method: config.method,
      url: config.url,
      body: config.body,
      expectedRequestMethod: config.method,
      expectedRequestUrl: config.url,
      expectedStatusCode: config.expectedStatusCode,
    });
  }

  /**
   * 에러 응답 API를 호출하고 감사로그를 검증한다
   */
  async 에러응답API를_호출하고_감사로그를_검증한다(config: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    url: string;
    body?: any;
    expectedStatusCode: number;
    expectedErrorMessage?: string;
  }) {
    // 요청 전 시간 기록
    const beforeRequestTime = new Date();
    beforeRequestTime.setSeconds(beforeRequestTime.getSeconds() - 1);

    // API 요청 전송 (에러 응답 예상)
    let response: any;
    const request = this.testSuite.request();

    try {
      switch (config.method) {
        case 'GET':
          response = await request.get(config.url);
          break;
        case 'POST':
          response = await request
            .post(config.url)
            .send(config.body || {});
          break;
        case 'PATCH':
          response = await request
            .patch(config.url)
            .send(config.body || {});
          break;
        case 'DELETE':
          response = await request.delete(config.url);
          break;
      }
      // 응답 상태 코드 검증
      expect(response.status).toBe(config.expectedStatusCode);
    } catch (error: any) {
      // 에러 응답도 정상적으로 처리
      if (error.response) {
        response = error.response;
        expect(response.status).toBe(config.expectedStatusCode);
      } else if (error.status) {
        // supertest의 expect 실패도 처리
        response = { status: error.status, body: error.body || {} };
        expect(response.status).toBe(config.expectedStatusCode);
      } else {
        throw error;
      }
    }

    // 잠시 대기 (감사로그 저장 완료 대기)
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 감사로그 조회 (최신 항목)
    const auditLogs = await this.감사로그목록을_조회한다({
      page: 1,
      limit: 20,
      requestMethod: config.method,
    });

    // 요청 후 생성된 감사로그 찾기
    const urlWithoutQuery = config.url.split('?')[0];
    const latestAuditLog = auditLogs.items.find(
      (log: any) =>
        new Date(log.requestStartTime).getTime() >=
        beforeRequestTime.getTime() &&
        log.requestUrl.includes(urlWithoutQuery) &&
        log.responseStatusCode === config.expectedStatusCode,
    );

    if (!latestAuditLog) {
      // 디버깅을 위한 로그
      console.log('에러 응답 감사로그를 찾을 수 없습니다.');
      console.log('요청 URL:', config.url);
      console.log('예상 상태 코드:', config.expectedStatusCode);
      console.log('조회된 감사로그:', auditLogs.items.map((log: any) => ({
        url: log.requestUrl,
        method: log.requestMethod,
        statusCode: log.responseStatusCode,
        time: log.requestStartTime,
      })));
    }

    expect(latestAuditLog).toBeDefined();

    // 에러 응답도 감사로그에 저장되었는지 확인
    expect(latestAuditLog.responseStatusCode).toBe(
      config.expectedStatusCode,
    );
    if (config.expectedErrorMessage) {
      expect(latestAuditLog.responseBody.message).toContain(
        config.expectedErrorMessage,
      );
    }

    return {
      response: response.body,
      auditLog: latestAuditLog,
    };
  }
}

