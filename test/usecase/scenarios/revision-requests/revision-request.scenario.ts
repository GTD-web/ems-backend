import { BaseE2ETest } from '../../../base-e2e.spec';
import { RevisionRequestApiClient } from '../api-clients/revision-request.api-client';
import { StepApprovalScenario } from '../step-approval/step-approval.scenario';
import { WbsSelfEvaluationScenario } from '../performance-evaluation/wbs-self-evaluation/wbs-self-evaluation.scenario';
import { DownwardEvaluationScenario } from '../performance-evaluation/downward-evaluation/downward-evaluation.scenario';

/**
 * 재작성 요청 시나리오
 *
 * 재작성 요청 관련 모든 시나리오를 제공합니다.
 * 재작성 요청은 단계 승인에서 `revision_requested` 상태로 변경할 때 자동 생성됩니다.
 */
export class RevisionRequestScenario {
  private apiClient: RevisionRequestApiClient;
  private stepApprovalScenario: StepApprovalScenario;
  private wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  private downwardEvaluationScenario: DownwardEvaluationScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new RevisionRequestApiClient(testSuite);
    this.stepApprovalScenario = new StepApprovalScenario(testSuite);
    this.wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    this.downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
  }

  // ==================== 재작성 요청 생성 (단계 승인 API를 통해) ====================

  /**
   * 자기평가 재작성 요청을 생성한다
   */
  async 자기평가_재작성요청을_생성한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    revisionComment: string;
  }): Promise<void> {
    await this.stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      status: 'revision_requested',
      revisionComment: config.revisionComment,
    });
  }

  /**
   * 1차 하향평가 재작성 요청을 생성한다
   */
  async 일차하향평가_재작성요청을_생성한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    revisionComment: string;
  }): Promise<void> {
    await this.stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      status: 'revision_requested',
      revisionComment: config.revisionComment,
    });
  }

  /**
   * 2차 하향평가 재작성 요청을 생성한다 (평가자별)
   */
  async 이차하향평가_재작성요청을_생성한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    revisionComment: string;
  }): Promise<void> {
    await this.stepApprovalScenario.이차하향평가_단계승인_상태를_변경한다({
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      evaluatorId: config.evaluatorId,
      status: 'revision_requested',
      revisionComment: config.revisionComment,
    });
  }

  // ==================== 재작성 요청 조회 ====================

  /**
   * 전체 재작성 요청 목록을 조회한다 (관리자용)
   */
  async 전체_재작성요청_목록을_조회한다(filter?: {
    evaluationPeriodId?: string;
    employeeId?: string;
    requestedBy?: string;
    isRead?: boolean;
    isCompleted?: boolean;
    step?: string;
  }): Promise<any> {
    return await this.apiClient.getAllRevisionRequests(filter);
  }

  /**
   * 내 재작성 요청 목록을 조회한다
   */
  async 내_재작성요청_목록을_조회한다(
    recipientId: string,
    filter?: {
      evaluationPeriodId?: string;
      employeeId?: string;
      isRead?: boolean;
      isCompleted?: boolean;
      step?: string;
    },
  ): Promise<any> {
    return await this.apiClient.getMyRevisionRequests(recipientId, filter);
  }

  /**
   * 읽지 않은 재작성 요청 수를 조회한다
   */
  async 읽지않은_재작성요청수를_조회한다(
    recipientId: string,
  ): Promise<number> {
    const result = await this.apiClient.getMyUnreadCount(recipientId);
    return result.unreadCount;
  }

  // ==================== 재작성 요청 읽음 처리 ====================

  /**
   * 재작성 요청을 읽음 처리한다
   */
  async 재작성요청을_읽음처리한다(
    requestId: string,
    recipientId: string,
  ): Promise<void> {
    await this.apiClient.markAsRead(requestId, recipientId);
  }

  // ==================== 재작성 완료 응답 제출 ====================

  /**
   * 재작성 완료 응답을 제출한다
   */
  async 재작성완료_응답을_제출한다(
    requestId: string,
    recipientId: string,
    responseComment: string,
  ): Promise<void> {
    await this.apiClient.completeRevisionRequest(
      requestId,
      recipientId,
      responseComment,
    );
  }

  /**
   * 관리자가 평가자 대신 재작성 완료 응답을 제출한다
   */
  async 관리자가_재작성완료_응답을_제출한다(
    evaluationPeriodId: string,
    employeeId: string,
    evaluatorId: string,
    step: string,
    responseComment: string,
  ): Promise<void> {
    await this.apiClient.completeRevisionRequestByEvaluator(
      evaluationPeriodId,
      employeeId,
      evaluatorId,
      step,
      responseComment,
    );
  }

  // ==================== 선행 조건 (평가 제출) ====================

  /**
   * 자기평가를 제출한다 (재작성 요청 생성을 위한 선행 조건)
   */
  async 자기평가를_제출한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
  }): Promise<{ selfEvaluationId: string }> {
    // 1. 자기평가 저장
    const 저장결과 =
      await this.wbsSelfEvaluationScenario.WBS자기평가를_저장한다(config);

    // 2. 자기평가 제출
    await this.wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
      저장결과.id,
    );

    return { selfEvaluationId: 저장결과.id };
  }

  /**
   * 1차 하향평가를 제출한다 (재작성 요청 생성을 위한 선행 조건)
   */
  async 일차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{ downwardEvaluationId: string }> {
    // 1. 1차 하향평가 저장
    const 저장결과 =
      await this.downwardEvaluationScenario.일차하향평가를_저장한다(config);

    // 2. 1차 하향평가 제출
    await this.downwardEvaluationScenario.일차하향평가를_제출한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: config.evaluatorId,
    });

    return { downwardEvaluationId: 저장결과.id };
  }

  /**
   * 2차 하향평가를 제출한다 (재작성 요청 생성을 위한 선행 조건)
   */
  async 이차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{ downwardEvaluationId: string }> {
    // 1. 2차 하향평가 저장
    const 저장결과 =
      await this.downwardEvaluationScenario.이차하향평가를_저장한다(config);

    // 2. 2차 하향평가 제출
    await this.downwardEvaluationScenario.이차하향평가를_제출한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: config.evaluatorId,
    });

    return { downwardEvaluationId: 저장결과.id };
  }

  // ==================== 복합 시나리오 ====================

  /**
   * 자기평가 재작성 요청 전체 시나리오를 실행한다
   */
  async 자기평가_재작성요청_전체_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    wbsItemId: string;
  }): Promise<{
    재작성요청생성: void;
    읽음처리: void;
    완료응답제출: void;
    requestId: string;
  }> {
    // 1. 자기평가 제출 (선행 조건)
    const { selfEvaluationId } = await this.자기평가를_제출한다({
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      periodId: config.evaluationPeriodId,
      selfEvaluationContent: '자기평가 내용입니다.',
      selfEvaluationScore: 85,
      performanceResult: '성과 결과입니다.',
    });

    // 2. 재작성 요청 생성
    const 재작성요청생성 = await this.자기평가_재작성요청을_생성한다({
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      revisionComment: '자기평가 내용을 보완해주세요.',
    });

    // 3. 재작성 요청 ID 조회
    const 재작성요청목록 = await this.전체_재작성요청_목록을_조회한다({
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      step: 'self',
    });

    const requestId = 재작성요청목록[0]?.requestId;
    if (!requestId) {
      throw new Error('재작성 요청이 생성되지 않았습니다.');
    }

    // 4. 읽음 처리
    const 읽음처리 = await this.재작성요청을_읽음처리한다(
      requestId,
      config.employeeId,
    );

    // 5. 완료 응답 제출
    const 완료응답제출 = await this.재작성완료_응답을_제출한다(
      requestId,
      config.employeeId,
      '자기평가 내용을 수정하여 재제출하였습니다.',
    );

    return {
      재작성요청생성,
      읽음처리,
      완료응답제출,
      requestId,
    };
  }
}

