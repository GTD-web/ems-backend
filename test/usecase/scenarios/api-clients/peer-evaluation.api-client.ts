import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 동료평가 관리 API 클라이언트
 * 
 * 동료평가 관련 모든 HTTP 요청을 캡슐화합니다.
 */
export class PeerEvaluationApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // ==================== 동료평가 요청 ====================

  /**
   * 동료평가 요청(할당)
   */
  async requestPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    requestedBy?: string;
  }) {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 한 명의 피평가자를 여러 평가자에게 요청
   */
  async requestPeerEvaluationToMultipleEvaluators(data: {
    evaluatorIds: string[];
    evaluateeId: string;
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    requestedBy?: string;
  }) {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청
   */
  async requestMultiplePeerEvaluations(data: {
    evaluatorId: string;
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    requestedBy?: string;
  }) {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * 평가자들 간 동료평가 요청 (다대다)
   */
  async requestEvaluatorsPeerEvaluations(data: {
    evaluatorIds: string[];
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    comment?: string;
    requestedBy?: string;
  }) {
    const response = await this.testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators')
      .send(data)
      .expect(201);

    return response.body;
  }

  // ==================== 동료평가 제출 ====================

  /**
   * 동료평가 제출
   */
  async submitPeerEvaluation(id: string) {
    await this.testSuite
      .request()
      .post(`/admin/performance-evaluation/peer-evaluations/${id}/submit`)
      .expect(200);
  }

  // ==================== 동료평가 조회 ====================

  /**
   * 평가자의 동료평가 목록 조회
   */
  async getEvaluatorPeerEvaluations(
    evaluatorId: string,
    query: {
      evaluateeId?: string;
      periodId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`)
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 모든 평가자의 동료평가 목록 조회
   */
  async getAllPeerEvaluations(query: {
    evaluateeId?: string;
    periodId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const response = await this.testSuite
      .request()
      .get('/admin/performance-evaluation/peer-evaluations/evaluator')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 동료평가 상세정보 조회
   */
  async getPeerEvaluationDetail(id: string) {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/peer-evaluations/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가자에게 할당된 피평가자 목록 조회
   */
  async getEvaluatorAssignedEvaluatees(
    evaluatorId: string,
    query: {
      periodId?: string;
      includeCompleted?: boolean;
    } = {}
  ) {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`)
      .query(query)
      .expect(200);

    return response.body;
  }

  // ==================== 동료평가 취소 ====================

  /**
   * 동료평가 요청 취소
   */
  async cancelPeerEvaluation(id: string) {
    await this.testSuite
      .request()
      .delete(`/admin/performance-evaluation/peer-evaluations/${id}`)
      .expect(204);
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가 요청 취소
   */
  async cancelPeerEvaluationsByPeriod(evaluateeId: string, periodId: string) {
    const response = await this.testSuite
      .request()
      .delete(`/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluateeId}/period/${periodId}/cancel-all`)
      .expect(200);

    return response.body;
  }

  // ==================== 동료평가 답변 ====================

  /**
   * 동료평가 질문 답변 저장/업데이트
   */
  async upsertPeerEvaluationAnswers(id: string, data: {
    peerEvaluationId: string;
    answers: Array<{
      questionId: string;
      answer: string;
    }>;
  }) {
    const response = await this.testSuite
      .request()
      .post(`/admin/performance-evaluation/peer-evaluations/${id}/answers`)
      .send(data)
      .expect(201);

    return response.body;
  }
}











