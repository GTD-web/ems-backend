import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 재작성 요청 API 클라이언트
 *
 * 재작성 요청 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class RevisionRequestApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 전체 재작성 요청 목록 조회 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID (선택)
   * @param config.employeeId - 직원 ID (선택)
   * @param config.requestedBy - 요청자 ID (선택)
   * @param config.isRead - 읽음 여부 (선택)
   * @param config.isCompleted - 완료 여부 (선택)
   * @param config.step - 단계 (criteria, self, primary, secondary) (선택)
   * @returns 재작성 요청 목록
   */
  async getRevisionRequests(config?: {
    evaluationPeriodId?: string;
    employeeId?: string;
    requestedBy?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    step?: 'criteria' | 'self' | 'primary' | 'secondary';
  }): Promise<any[]> {
    const query: any = {};
    if (config?.evaluationPeriodId)
      query.evaluationPeriodId = config.evaluationPeriodId;
    if (config?.employeeId) query.employeeId = config.employeeId;
    if (config?.requestedBy) query.requestedBy = config.requestedBy;
    if (config?.isRead !== undefined) query.isRead = config.isRead.toString();
    if (config?.isCompleted !== undefined)
      query.isCompleted = config.isCompleted.toString();
    if (config?.step) query.step = config.step;

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
   * @param config.evaluationPeriodId - 평가기간 ID (선택)
   * @param config.employeeId - 직원 ID (선택)
   * @param config.isRead - 읽음 여부 (선택)
   * @param config.isCompleted - 완료 여부 (선택)
   * @param config.step - 단계 (criteria, self, primary, secondary) (선택)
   * @returns 내 재작성 요청 목록
   */
  async getMyRevisionRequests(config?: {
    evaluationPeriodId?: string;
    employeeId?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    step?: 'criteria' | 'self' | 'primary' | 'secondary';
  }): Promise<any[]> {
    const query: any = {};
    if (config?.evaluationPeriodId)
      query.evaluationPeriodId = config.evaluationPeriodId;
    if (config?.employeeId) query.employeeId = config.employeeId;
    if (config?.isRead !== undefined) query.isRead = config.isRead.toString();
    if (config?.isCompleted !== undefined)
      query.isCompleted = config.isCompleted.toString();
    if (config?.step) query.step = config.step;

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
   * @returns 읽지 않은 재작성 요청 수
   */
  async getMyUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await this.testSuite
      .request()
      .get('/admin/revision-requests/me/unread-count')
      .expect(200);

    return response.body;
  }

  /**
   * 재작성 요청을 읽음 처리 API 호출
   *
   * @param requestId - 재작성 요청 ID
   */
  async markAsRead(requestId: string): Promise<void> {
    await this.testSuite
      .request()
      .patch(`/admin/revision-requests/${requestId}/read`)
      .expect(200);
  }

  /**
   * 재작성 완료 응답 제출 API 호출
   *
   * @param requestId - 재작성 요청 ID
   * @param responseComment - 재작성 완료 응답 코멘트
   */
  async completeRevisionRequest(config: {
    requestId: string;
    responseComment: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .patch(`/admin/revision-requests/${config.requestId}/complete`)
      .send({
        responseComment: config.responseComment,
      })
      .expect(200);
  }

  /**
   * 평가기간, 직원, 평가자 기반으로 재작성 완료 응답 제출 API 호출 (관리자용)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.evaluatorId - 평가자 ID
   * @param config.step - 단계 (criteria, self, primary, secondary)
   * @param config.responseComment - 재작성 완료 응답 코멘트
   */
  async completeRevisionRequestByEvaluator(config: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    step: 'criteria' | 'self' | 'primary' | 'secondary';
    responseComment: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .patch(
        `/admin/revision-requests/${config.evaluationPeriodId}/${config.employeeId}/${config.evaluatorId}/complete`,
      )
      .query({ step: config.step })
      .send({
        responseComment: config.responseComment,
      })
      .expect(200);
  }
}
