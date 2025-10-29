import { BaseE2ETest } from '../../base-e2e.spec';
import { PeerEvaluationApiClient } from './api-clients/peer-evaluation.api-client';
import { EvaluationQuestionScenario } from './evaluation-question.scenario';

/**
 * 동료평가 관리 시나리오
 * 
 * 엔드포인트만을 사용하여 동료평가 관련 기능을 테스트합니다.
 * 평가 질문 생성, 동료평가 요청, 답변 저장, 제출 등의 전체 워크플로우를 테스트합니다.
 */
export class PeerEvaluationScenario {
  private apiClient: PeerEvaluationApiClient;
  private evaluationQuestionScenario: EvaluationQuestionScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new PeerEvaluationApiClient(testSuite);
    this.evaluationQuestionScenario = new EvaluationQuestionScenario(testSuite);
  }

  // ==================== 평가 질문 준비 ====================

  /**
   * 테스트용 평가 질문들을 생성한다
   */
  async 테스트용_평가질문들을_생성한다(): Promise<{
    질문그룹: any;
    질문들: any[];
  }> {
    // 1. 질문 그룹 생성
    const 질문그룹 = await this.evaluationQuestionScenario.질문그룹을_생성한다({
      name: `동료평가 테스트 그룹 ${Date.now()}`,
      isDefault: false,
    });

    // 2. 평가 질문들 생성
    const 질문들: any[] = [];
    const 질문데이터 = [
      { text: '업무 수행 능력은 어떠한가요?', minScore: 1, maxScore: 5 },
      { text: '팀워크는 어떠한가요?', minScore: 1, maxScore: 5 },
      { text: '의사소통 능력은 어떠한가요?', minScore: 1, maxScore: 5 },
    ];

    for (const data of 질문데이터) {
      const 질문 = await this.evaluationQuestionScenario.평가질문을_생성한다({
        ...data,
        groupId: 질문그룹.id,
        displayOrder: 질문들.length,
      });
      질문들.push(질문);
    }

    return { 질문그룹, 질문들 };
  }

  // ==================== 동료평가 요청 ====================

  /**
   * 동료평가를 요청한다
   */
  async 동료평가를_요청한다(config: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    const result = await this.apiClient.requestPeerEvaluation(config);
    
    expect(result.id).toBeDefined();
    expect(result.message).toContain('성공적으로 요청되었습니다');
    
    return result;
  }

  /**
   * 한 명의 피평가자를 여러 평가자에게 요청한다
   */
  async 한명의_피평가자를_여러평가자에게_요청한다(config: {
    evaluatorIds: string[];
    evaluateeId: string;
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    const result = await this.apiClient.requestPeerEvaluationToMultipleEvaluators(config);
    
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary.total).toBe(config.evaluatorIds.length);
    expect(result.message).toContain('동료평가 요청이');
    
    return result;
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청한다
   */
  async 한명의_평가자가_여러피평가자를_평가하도록_요청한다(config: {
    evaluatorId: string;
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: string;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    const result = await this.apiClient.requestMultiplePeerEvaluations(config);
    
    expect(result.results).toBeDefined();
    expect(Array.isArray(result.results)).toBe(true);
    expect(result.summary).toBeDefined();
    expect(result.summary.total).toBe(config.evaluateeIds.length);
    expect(result.message).toContain('동료평가 요청이');
    
    return result;
  }

  // ==================== 동료평가 제출 ====================

  /**
   * 동료평가를 제출한다
   */
  async 동료평가를_제출한다(id: string, questionIds?: string[]): Promise<void> {
    // 제출 전에 모든 질문에 답변을 저장해야 함
    if (questionIds && questionIds.length > 0) {
      console.log(`답변 저장 시작 - 평가ID: ${id}, 질문수: ${questionIds.length}`);
      const answers = questionIds.map((questionId, index) => ({
        questionId,
        answer: `${index + 1}번 질문 답변 - 좋은 성과입니다.`,
      }));
      
      console.log('저장할 답변들:', answers);
      
      const 답변저장결과 = await this.동료평가_질문답변을_저장한다(id, {
        peerEvaluationId: id,
        answers,
      });
      
      console.log('답변 저장 결과:', 답변저장결과);
    } else {
      console.log('질문 ID가 없어서 답변 저장을 건너뜁니다.');
    }
    
    console.log('동료평가 제출 시작');
    await this.apiClient.submitPeerEvaluation(id);
    console.log('동료평가 제출 완료');
  }

  // ==================== 동료평가 조회 ====================

  /**
   * 평가자의 동료평가 목록을 조회한다
   */
  async 평가자의_동료평가목록을_조회한다(
    evaluatorId: string,
    filter: {
      evaluateeId?: string;
      periodId?: string;
      status?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<any> {
    const result = await this.apiClient.getEvaluatorPeerEvaluations(evaluatorId, filter);
    
    expect(result.evaluations).toBeDefined();
    expect(Array.isArray(result.evaluations)).toBe(true);
    expect(result.page).toBeDefined();
    expect(result.limit).toBeDefined();
    expect(result.total).toBeDefined();
    
    return result;
  }

  /**
   * 모든 평가자의 동료평가 목록을 조회한다
   */
  async 모든평가자의_동료평가목록을_조회한다(filter: {
    evaluateeId?: string;
    periodId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    const result = await this.apiClient.getAllPeerEvaluations(filter);
    
    expect(result.evaluations).toBeDefined();
    expect(Array.isArray(result.evaluations)).toBe(true);
    expect(result.page).toBeDefined();
    expect(result.limit).toBeDefined();
    expect(result.total).toBeDefined();
    
    return result;
  }

  /**
   * 동료평가 상세정보를 조회한다
   */
  async 동료평가_상세정보를_조회한다(id: string): Promise<any> {
    const result = await this.apiClient.getPeerEvaluationDetail(id);
    
    expect(result.id).toBe(id);
    expect(result.evaluator).toBeDefined();
    expect(result.evaluatee).toBeDefined();
    expect(result.period).toBeDefined();
    
    return result;
  }

  /**
   * 평가자에게 할당된 피평가자 목록을 조회한다
   */
  async 평가자에게_할당된_피평가자목록을_조회한다(
    evaluatorId: string,
    query: {
      periodId?: string;
      includeCompleted?: boolean;
    } = {}
  ): Promise<any[]> {
    const result = await this.apiClient.getEvaluatorAssignedEvaluatees(evaluatorId, query);
    
    expect(Array.isArray(result)).toBe(true);
    
    return result;
  }

  // ==================== 동료평가 취소 ====================

  /**
   * 동료평가 요청을 취소한다
   */
  async 동료평가_요청을_취소한다(id: string): Promise<void> {
    await this.apiClient.cancelPeerEvaluation(id);
  }

  /**
   * 평가기간의 피평가자의 모든 동료평가 요청을 취소한다
   */
  async 평가기간의_피평가자의_모든동료평가요청을_취소한다(
    evaluateeId: string,
    periodId: string
  ): Promise<any> {
    const result = await this.apiClient.cancelPeerEvaluationsByPeriod(evaluateeId, periodId);
    
    expect(result.message).toBeDefined();
    expect(result.cancelledCount).toBeDefined();
    expect(typeof result.cancelledCount).toBe('number');
    
    return result;
  }

  // ==================== 동료평가 답변 ====================

  /**
   * 동료평가 질문 답변을 저장한다
   */
  async 동료평가_질문답변을_저장한다(
    id: string,
    data: {
      peerEvaluationId: string;
      answers: Array<{
        questionId: string;
        answer: string;
      }>;
    }
  ): Promise<any> {
    const result = await this.apiClient.upsertPeerEvaluationAnswers(id, data);
    
    expect(result.savedCount).toBeDefined();
    expect(result.message).toContain('성공적으로 저장되었습니다');
    
    return result;
  }

  // ==================== 복합 시나리오 ====================

  /**
   * 동료평가 전체 시나리오를 실행한다
   */
  async 동료평가_전체_시나리오를_실행한다(config: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
  }): Promise<{
    질문생성결과: any;
    동료평가요청결과: any;
    답변저장결과: any;
    제출결과: void;
    상세조회결과: any;
  }> {
    // 1. 평가 질문 생성
    const { 질문들 } = await this.테스트용_평가질문들을_생성한다();
    const 질문Ids = 질문들.map(q => q.id);

    // 2. 동료평가 요청
    const 동료평가요청결과 = await this.동료평가를_요청한다({
      evaluatorId: config.evaluatorId,
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      questionIds: 질문Ids,
    });

    // 3. 답변 저장
    const 답변저장결과 = await this.동료평가_질문답변을_저장한다(
      동료평가요청결과.id,
      {
        peerEvaluationId: 동료평가요청결과.id,
        answers: 질문Ids.map((questionId, index) => ({
          questionId,
          answer: `답변 ${index + 1}`,
        })),
      }
    );

    // 4. 동료평가 제출
    await this.동료평가를_제출한다(동료평가요청결과.id, 질문Ids);

    // 5. 상세 조회
    const 상세조회결과 = await this.동료평가_상세정보를_조회한다(동료평가요청결과.id);

    return {
      질문생성결과: { 질문들 },
      동료평가요청결과,
      답변저장결과,
      제출결과: undefined,
      상세조회결과,
    };
  }

  /**
   * 일괄 동료평가 요청 시나리오를 실행한다
   */
  async 일괄동료평가_요청_시나리오를_실행한다(config: {
    evaluatorIds: string[];
    evaluateeId: string;
    periodId: string;
  }): Promise<{
    질문생성결과: any;
    일괄요청결과: any;
    개별조회결과: any[];
  }> {
    // 1. 평가 질문 생성
    const { 질문들 } = await this.테스트용_평가질문들을_생성한다();
    const 질문Ids = 질문들.map(q => q.id);

    // 2. 일괄 동료평가 요청
    const 일괄요청결과 = await this.한명의_피평가자를_여러평가자에게_요청한다({
      evaluatorIds: config.evaluatorIds,
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      questionIds: 질문Ids,
    });

    // 3. 각 평가자의 목록 조회
    const 개별조회결과: any[] = [];
    for (const evaluatorId of config.evaluatorIds) {
      const 조회결과 = await this.평가자의_동료평가목록을_조회한다(evaluatorId, {
        periodId: config.periodId,
      });
      개별조회결과.push(조회결과);
    }

    return {
      질문생성결과: { 질문들 },
      일괄요청결과,
      개별조회결과,
    };
  }

  /**
   * 동료평가 취소 시나리오를 실행한다
   */
  async 동료평가_취소_시나리오를_실행한다(config: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
  }): Promise<{
    질문생성결과: any;
    동료평가요청결과: any;
    취소결과: void;
    조회결과: any;
  }> {
    // 1. 평가 질문 생성
    const { 질문들 } = await this.테스트용_평가질문들을_생성한다();
    const 질문Ids = 질문들.map(q => q.id);

    // 2. 동료평가 요청
    const 동료평가요청결과 = await this.동료평가를_요청한다({
      evaluatorId: config.evaluatorId,
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      questionIds: 질문Ids,
    });

    // 3. 동료평가 취소
    await this.동료평가_요청을_취소한다(동료평가요청결과.id);

    // 4. 취소 후 조회 - 상태가 cancelled인지 확인
    const 조회결과 = await this.동료평가_상세정보를_조회한다(동료평가요청결과.id);
    expect(조회결과.status).toBe('cancelled');

    return {
      질문생성결과: { 질문들 },
      동료평가요청결과,
      취소결과: undefined,
      조회결과,
    };
  }
}
