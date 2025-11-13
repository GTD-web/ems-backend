import { BaseE2ETest } from '../../../../base-e2e.spec';
import { PeerEvaluationApiClient } from '../../api-clients/peer-evaluation.api-client';

/**
 * 동료평가 시나리오
 *
 * 동료평가 관련 모든 시나리오를 제공합니다.
 * 시나리오 문서를 기반으로 작성되었습니다.
 */
export class PeerEvaluationScenario {
  private apiClient: PeerEvaluationApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new PeerEvaluationApiClient(testSuite);
  }

  // ==================== 동료평가 요청 ====================

  /**
   * 동료평가 요청(할당) - 단일
   */
  async 동료평가를_요청한다(config: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    return await this.apiClient.requestPeerEvaluation({
      evaluatorId: config.evaluatorId,
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      requestDeadline: config.requestDeadline?.toISOString(),
      questionIds: config.questionIds,
      requestedBy: config.requestedBy,
    });
  }

  /**
   * 한 명의 피평가자를 여러 평가자에게 요청
   */
  async 한_피평가자를_여러_평가자에게_요청한다(config: {
    evaluatorIds: string[];
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    return await this.apiClient.requestPeerEvaluationToMultipleEvaluators({
      evaluatorIds: config.evaluatorIds,
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      requestDeadline: config.requestDeadline?.toISOString(),
      questionIds: config.questionIds,
      requestedBy: config.requestedBy,
    });
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청
   */
  async 한_평가자가_여러_피평가자를_평가하도록_요청한다(config: {
    evaluatorId: string;
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    return await this.apiClient.requestMultiplePeerEvaluations({
      evaluatorId: config.evaluatorId,
      evaluateeIds: config.evaluateeIds,
      periodId: config.periodId,
      requestDeadline: config.requestDeadline?.toISOString(),
      questionIds: config.questionIds,
      requestedBy: config.requestedBy,
    });
  }

  // ==================== 동료평가 제출 ====================

  /**
   * 동료평가 제출
   */
  async 동료평가를_제출한다(id: string): Promise<void> {
    await this.apiClient.submitPeerEvaluation(id);
  }

  // ==================== 동료평가 조회 ====================

  /**
   * 평가자의 동료평가 목록 조회
   */
  async 평가자의_동료평가_목록을_조회한다(
    evaluatorId: string,
    query?: {
      evaluateeId?: string;
      periodId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<any> {
    return await this.apiClient.getEvaluatorPeerEvaluations(
      evaluatorId,
      query,
    );
  }

  /**
   * 모든 평가자의 동료평가 목록 조회
   */
  async 모든_평가자의_동료평가_목록을_조회한다(query?: {
    evaluateeId?: string;
    periodId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    return await this.apiClient.getAllPeerEvaluations(query);
  }

  /**
   * 동료평가 상세정보 조회
   */
  async 동료평가_상세정보를_조회한다(id: string): Promise<any> {
    return await this.apiClient.getPeerEvaluationDetail(id);
  }

  /**
   * 평가자에게 할당된 피평가자 목록 조회
   */
  async 평가자에게_할당된_피평가자_목록을_조회한다(
    evaluatorId: string,
    query?: {
      periodId?: string;
      includeCompleted?: boolean;
    },
  ): Promise<any> {
    return await this.apiClient.getEvaluatorAssignedEvaluatees(
      evaluatorId,
      query,
    );
  }

  // ==================== 동료평가 취소 ====================

  /**
   * 동료평가 요청 취소
   */
  async 동료평가_요청을_취소한다(id: string): Promise<void> {
    await this.apiClient.cancelPeerEvaluation(id);
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가 요청 취소
   */
  async 피평가자의_모든_동료평가_요청을_취소한다(
    evaluateeId: string,
    periodId: string,
  ): Promise<{ message: string; cancelledCount: number }> {
    return await this.apiClient.cancelPeerEvaluationsByPeriod(
      evaluateeId,
      periodId,
    );
  }

  // ==================== 동료평가 답변 ====================

  /**
   * 동료평가 질문 답변 저장/업데이트
   */
  async 동료평가_답변을_저장한다(
    id: string,
    data: {
      peerEvaluationId: string;
      answers: Array<{
        questionId: string;
        answer: string;
        score?: number;
      }>;
    },
  ): Promise<any> {
    return await this.apiClient.upsertPeerEvaluationAnswers(id, data);
  }
}

