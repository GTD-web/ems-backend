import { BaseE2ETest } from '../../../base-e2e.spec';
import { BasePeerEvaluationScenario } from './base-peer-evaluation.scenario';
import { PeerEvaluationDashboardScenario } from './peer-evaluation-dashboard.scenario';

/**
 * 동료평가 시나리오 (메인)
 *
 * 엔드포인트만을 사용하여 동료평가 관련 기능을 테스트합니다.
 * 평가 질문 생성, 동료평가 요청, 답변 저장, 제출 등의 전체 워크플로우를 테스트합니다.
 *
 * 이 클래스는 분리된 시나리오 클래스들을 조합하여 사용합니다:
 * - BasePeerEvaluationScenario: 기본 동료평가 기능
 * - PeerEvaluationDashboardScenario: 대시보드 검증 기능
 */
export class PeerEvaluationScenario extends BasePeerEvaluationScenario {
  public dashboardScenario: PeerEvaluationDashboardScenario;

  constructor(testSuite: BaseE2ETest) {
    super(testSuite);
    this.dashboardScenario = new PeerEvaluationDashboardScenario(testSuite);
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
    const 질문Ids = 질문들.map((q) => q.id);

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
          score: 4,
        })),
      },
    );

    // 4. 동료평가 제출
    await this.동료평가를_제출한다(동료평가요청결과.id, 질문Ids);

    // 5. 상세 조회
    const 상세조회결과 = await this.동료평가_상세정보를_조회한다(
      동료평가요청결과.id,
    );

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
    const 질문Ids = 질문들.map((q) => q.id);

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
      const 조회결과 = await this.평가자의_동료평가목록을_조회한다(
        evaluatorId,
        {
          periodId: config.periodId,
        },
      );
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
    const 질문Ids = 질문들.map((q) => q.id);

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
    const 조회결과 = await this.동료평가_상세정보를_조회한다(
      동료평가요청결과.id,
    );
    expect(조회결과.status).toBe('cancelled');

    return {
      질문생성결과: { 질문들 },
      동료평가요청결과,
      취소결과: undefined,
      조회결과,
    };
  }
}
