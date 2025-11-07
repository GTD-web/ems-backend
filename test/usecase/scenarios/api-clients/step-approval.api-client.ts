import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * 단계 승인 API 클라이언트
 *
 * 단계 승인 관련 HTTP 엔드포인트에 대한 순수한 요청/응답 처리를 담당합니다.
 */
export class StepApprovalApiClient {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 단계 승인 Enum 목록 조회 API 호출
   *
   * @returns 단계 승인 Enum 목록 (steps, statuses)
   */
  async getStepApprovalEnums(): Promise<{
    steps: string[];
    statuses: string[];
  }> {
    const response = await this.testSuite
      .request()
      .get('/admin/step-approvals/enums')
      .expect(200);

    return response.body;
  }

  /**
   * 평가기준 설정 단계 승인 상태 변경 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.status - 승인 상태 (pending, approved, revision_requested)
   * @param config.revisionComment - 재작성 요청 코멘트 (revision_requested일 때 필수)
   */
  async updateCriteriaStepApproval(config: {
    evaluationPeriodId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .patch(
        `/admin/step-approvals/${config.evaluationPeriodId}/employees/${config.employeeId}/criteria`,
      )
      .send({
        status: config.status,
        revisionComment: config.revisionComment,
      })
      .expect(200);
  }

  /**
   * 자기평가 단계 승인 상태 변경 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.status - 승인 상태 (pending, approved, revision_requested)
   * @param config.revisionComment - 재작성 요청 코멘트 (revision_requested일 때 필수)
   */
  async updateSelfStepApproval(config: {
    evaluationPeriodId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .patch(
        `/admin/step-approvals/${config.evaluationPeriodId}/employees/${config.employeeId}/self`,
      )
      .send({
        status: config.status,
        revisionComment: config.revisionComment,
      })
      .expect(200);
  }

  /**
   * 1차 하향평가 단계 승인 상태 변경 API 호출
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.status - 승인 상태 (pending, approved, revision_requested)
   * @param config.revisionComment - 재작성 요청 코멘트 (revision_requested일 때 필수)
   */
  async updatePrimaryStepApproval(config: {
    evaluationPeriodId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .patch(
        `/admin/step-approvals/${config.evaluationPeriodId}/employees/${config.employeeId}/primary`,
      )
      .send({
        status: config.status,
        revisionComment: config.revisionComment,
      })
      .expect(200);
  }

  /**
   * 2차 하향평가 단계 승인 상태 변경 API 호출 (평가자별)
   *
   * @param config.evaluationPeriodId - 평가기간 ID
   * @param config.employeeId - 직원 ID
   * @param config.evaluatorId - 평가자 ID
   * @param config.status - 승인 상태 (pending, approved, revision_requested)
   * @param config.revisionComment - 재작성 요청 코멘트 (revision_requested일 때 필수)
   */
  async updateSecondaryStepApproval(config: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
  }): Promise<void> {
    await this.testSuite
      .request()
      .patch(
        `/admin/step-approvals/${config.evaluationPeriodId}/employees/${config.employeeId}/secondary/${config.evaluatorId}`,
      )
      .send({
        status: config.status,
        revisionComment: config.revisionComment,
      })
      .expect(200);
  }
}
