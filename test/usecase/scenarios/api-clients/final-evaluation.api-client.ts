import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 최종평가 관리 API 클라이언트
 *
 * 최종평가 관련 모든 HTTP 요청을 캡슐화합니다.
 */
export class FinalEvaluationApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  // ==================== 최종평가 저장 ====================

  /**
   * 최종평가 저장 (Upsert: 없으면 생성, 있으면 수정)
   */
  async upsertFinalEvaluation(data: {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments?: string;
  }) {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
      )
      .send({
        evaluationGrade: data.evaluationGrade,
        jobGrade: data.jobGrade,
        jobDetailedGrade: data.jobDetailedGrade,
        finalComments: data.finalComments,
      })
      .expect(201);

    return response.body;
  }

  // ==================== 최종평가 확정 관리 ====================

  /**
   * 최종평가 확정
   */
  async confirmFinalEvaluation(id: string) {
    const response = await this.testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${id}/confirm`)
      .expect(200);

    return response.body;
  }

  /**
   * 최종평가 확정 취소
   */
  async cancelConfirmationFinalEvaluation(id: string) {
    const response = await this.testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/${id}/cancel-confirmation`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 최종평가 조회 ====================

  /**
   * 최종평가 단일 조회
   */
  async getFinalEvaluation(id: string) {
    const response = await this.testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${id}`)
      .expect(200);

    return response.body;
  }

  /**
   * 최종평가 목록 조회
   */
  async getFinalEvaluationList(query: {
    employeeId?: string;
    periodId?: string;
    evaluationGrade?: string;
    jobGrade?: string;
    jobDetailedGrade?: string;
    confirmedOnly?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    const response = await this.testSuite
      .request()
      .get('/admin/performance-evaluation/final-evaluations')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 직원-평가기간별 최종평가 조회
   */
  async getFinalEvaluationByEmployeePeriod(
    employeeId: string,
    periodId: string,
  ) {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
      )
      .expect(200);

    return response.body;
  }
}

