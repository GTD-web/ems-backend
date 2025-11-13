import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 재작성 요청 API 클라이언트
 *
 * 재작성 요청 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class RevisionRequestApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 전체 재작성 요청 목록 조회 API 호출 (관리자용)
   *
   * @param filter - 필터 옵션 (evaluationPeriodId, employeeId, requestedBy, isRead, isCompleted, step)
   * @returns 재작성 요청 목록
   */
  async getAllRevisionRequests(filter?: {
    evaluationPeriodId?: string;
    employeeId?: string;
    requestedBy?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    step?: string;
  }): Promise<any> {
    const query: any = {};
    if (filter?.evaluationPeriodId)
      query.evaluationPeriodId = filter.evaluationPeriodId;
    if (filter?.employeeId) query.employeeId = filter.employeeId;
    if (filter?.requestedBy) query.requestedBy = filter.requestedBy;
    if (filter?.isRead !== undefined) query.isRead = filter.isRead;
    if (filter?.isCompleted !== undefined)
      query.isCompleted = filter.isCompleted;
    if (filter?.step) query.step = filter.step;

    const response = await this.testSuite
      .request()
      .get('/admin/revision-requests')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 내 재작성 요청 목록 조회 API 호출
   *
   * @param recipientId - 수신자 ID (currentUser)
   * @param filter - 필터 옵션 (evaluationPeriodId, employeeId, isRead, isCompleted, step)
   * @returns 재작성 요청 목록
   */
  async getMyRevisionRequests(
    recipientId: string,
    filter?: {
      evaluationPeriodId?: string;
      employeeId?: string;
      isRead?: boolean;
      isCompleted?: boolean;
      step?: string;
    },
  ): Promise<any> {
    // CurrentUser 데코레이터 시뮬레이션
    this.testSuite.setCurrentUser({
      id: recipientId,
      email: `test-${recipientId}@example.com`,
      name: `Test User ${recipientId}`,
      employeeNumber: `EMP-${recipientId.substring(0, 8)}`,
    });

    const query: any = {};
    if (filter?.evaluationPeriodId)
      query.evaluationPeriodId = filter.evaluationPeriodId;
    if (filter?.employeeId) query.employeeId = filter.employeeId;
    if (filter?.isRead !== undefined) query.isRead = filter.isRead;
    if (filter?.isCompleted !== undefined)
      query.isCompleted = filter.isCompleted;
    if (filter?.step) query.step = filter.step;

    const response = await this.testSuite
      .request()
      .get('/admin/revision-requests/me')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 읽지 않은 재작성 요청 수 조회 API 호출
   *
   * @param recipientId - 수신자 ID (currentUser)
   * @returns 읽지 않은 요청 수
   */
  async getMyUnreadCount(
    recipientId: string,
  ): Promise<{ unreadCount: number }> {
    // CurrentUser 데코레이터 시뮬레이션
    this.testSuite.setCurrentUser({
      id: recipientId,
      email: `test-${recipientId}@example.com`,
      name: `Test User ${recipientId}`,
      employeeNumber: `EMP-${recipientId.substring(0, 8)}`,
    });

    const response = await this.testSuite
      .request()
      .get('/admin/revision-requests/me/unread-count')
      .expect(200);

    return response.body;
  }

  /**
   * 재작성 요청 읽음 처리 API 호출
   *
   * @param requestId - 재작성 요청 ID
   * @param recipientId - 수신자 ID (currentUser)
   */
  async markAsRead(requestId: string, recipientId: string): Promise<void> {
    // CurrentUser 데코레이터 시뮬레이션
    this.testSuite.setCurrentUser({
      id: recipientId,
      email: `test-${recipientId}@example.com`,
      name: `Test User ${recipientId}`,
      employeeNumber: `EMP-${recipientId.substring(0, 8)}`,
    });

    await this.testSuite
      .request()
      .patch(`/admin/revision-requests/${requestId}/read`)
      .expect(200);
  }

  /**
   * 재작성 완료 응답 제출 API 호출
   *
   * @param requestId - 재작성 요청 ID
   * @param recipientId - 수신자 ID (currentUser)
   * @param responseComment - 응답 코멘트
   */
  async completeRevisionRequest(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<void> {
    // CurrentUser 데코레이터 시뮬레이션
    this.testSuite.setCurrentUser({
      id: recipientId,
      email: `test-${recipientId}@example.com`,
      name: `Test User ${recipientId}`,
      employeeNumber: `EMP-${recipientId.substring(0, 8)}`,
    });

    await this.testSuite
      .request()
      .patch(`/admin/revision-requests/${requestId}/complete`)
      .send({ responseComment })
      .expect(200);
  }

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답 제출 API 호출 (관리자용)
   *
   * @param evaluationPeriodId - 평가기간 ID
   * @param employeeId - 직원 ID
   * @param evaluatorId - 평가자 ID
   * @param step - 단계 (criteria, self, primary, secondary)
   * @param responseComment - 응답 코멘트
   */
  async completeRevisionRequestByEvaluator(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    step: string,
    responseComment: string,
  ): Promise<void> {
    await this.testSuite
      .request()
      .patch(
        `/admin/revision-requests/${evaluationPeriodId}/${employeeId}/${evaluatorId}/complete`,
      )
      .query({ step })
      .send({ responseComment })
      .expect(200);
  }
}
