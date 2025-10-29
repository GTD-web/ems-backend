/**
 * 평가기간 자동 단계 전이 E2E 테스트
 * 
 * README.md의 자동 단계 전이 시나리오를 검증합니다.
 */

import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodAutoPhaseTransitionScenario } from './evaluation-period-auto-phase-transition.scenario';

describe('평가기간 자동 단계 전이 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let scenario: EvaluationPeriodAutoPhaseTransitionScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    scenario = new EvaluationPeriodAutoPhaseTransitionScenario(testSuite);

    // 기존 데이터 정리
    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('기본 자동 단계 전이 시나리오', () => {
    it('평가기간 자동 단계 전이 전체 시나리오를 실행한다', async () => {
      // Given: 평가기간 생성 및 시작
      const { periodId } = await scenario.평가기간을_생성하고_시작한다({
        name: '자동 전이 테스트용 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
      });

      // 초기 상태 확인
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');
      expect(initialState.status).toBe('in-progress');

      // 단계별 마감일 설정 (1분 간격, 올바른 순서로)
      const now = scenario.getCurrentTime();
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: scenario.getFutureTime(1), // +1분
        performanceDeadline: scenario.getFutureTime(2),     // +2분
        selfEvaluationDeadline: scenario.getFutureTime(3),  // +3분
        peerEvaluationDeadline: scenario.getFutureTime(4),  // +4분
      });

      // 1분 경과 후 자동 전이 확인 (evaluation-setup → performance)
      await scenario.시간을_조작한다(1 * 60 * 1000); // 1분
      await scenario.자동_단계_전이를_실행한다();

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase1State.currentPhase).toBe('performance');

      // 대시보드에서도 동일한 단계 확인
      const dashboard1 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard1.evaluationPeriod.currentPhase).toBe('performance');

      // 2분 경과 후 자동 전이 확인 (performance → self-evaluation)
      await scenario.시간을_조작한다(1 * 60 * 1000); // 추가 1분
      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase2State.currentPhase).toBe('self-evaluation');

      // 대시보드에서도 동일한 단계 확인
      const dashboard2 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard2.evaluationPeriod.currentPhase).toBe('self-evaluation');

      // 3분 경과 후 자동 전이 확인 (self-evaluation → peer-evaluation)
      await scenario.시간을_조작한다(1 * 60 * 1000); // 추가 1분
      await scenario.자동_단계_전이를_실행한다();

      const phase3State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase3State.currentPhase).toBe('peer-evaluation');

      // 대시보드에서도 동일한 단계 확인
      const dashboard3 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard3.evaluationPeriod.currentPhase).toBe('peer-evaluation');

      // 4분 경과 후 자동 전이 확인 (peer-evaluation → closure)
      await scenario.시간을_조작한다(1 * 60 * 1000); // 추가 1분
      await scenario.자동_단계_전이를_실행한다();

      const phase4State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase4State.currentPhase).toBe('closure');

      // 대시보드에서도 동일한 단계 확인
      const dashboard4 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard4.evaluationPeriod.currentPhase).toBe('closure');

      console.log('✅ 자동 단계 전이 전체 시나리오 완료');
      console.log(`   - 최종 단계: ${phase4State.currentPhase}`);
    });
  });

  describe('마감일 미설정 케이스', () => {
    it('마감일이 설정되지 않은 단계는 자동 전이되지 않는다', async () => {
      // Given: 평가기간 생성 및 시작
      const { periodId } = await scenario.평가기간을_생성하고_시작한다({
        name: '마감일 미설정 테스트용 평가기간',
        startDate: '2024-02-01',
        peerEvaluationDeadline: '2024-07-30',
      });

      // 일부 단계의 마감일만 설정
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: scenario.getFutureTime(1), // +1분
        performanceDeadline: scenario.getFutureTime(2),     // +2분
        // selfEvaluationDeadline과 peerEvaluationDeadline은 설정하지 않음
      });

      // 1분 경과 후 자동 전이 확인 (evaluation-setup → performance)
      await scenario.시간을_조작한다(1 * 60 * 1000);
      await scenario.자동_단계_전이를_실행한다();

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase1State.currentPhase).toBe('performance');

      // 2분 경과 후 자동 전이 확인 (performance에서 멈춤)
      await scenario.시간을_조작한다(1 * 60 * 1000);
      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase2State.currentPhase).toBe('performance'); // 전이되지 않음

      // 3분 경과 후에도 여전히 performance 단계
      await scenario.시간을_조작한다(1 * 60 * 1000);
      await scenario.자동_단계_전이를_실행한다();

      const phase3State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase3State.currentPhase).toBe('performance'); // 여전히 전이되지 않음

      console.log('✅ 마감일 미설정 케이스 검증 완료');
      console.log(`   - 마감일이 설정되지 않은 단계는 자동 전이되지 않음: ${phase3State.currentPhase}`);
    });
  });

  describe('수동 단계 변경 후 자동 전이', () => {
    it('수동으로 단계를 변경한 후 자동 전이가 계속 진행된다', async () => {
      // Given: 평가기간 생성 및 시작
      const { periodId } = await scenario.평가기간을_생성하고_시작한다({
        name: '수동 변경 후 자동 전이 테스트용 평가기간',
        startDate: '2024-03-01',
        peerEvaluationDeadline: '2024-08-30',
      });

      // 단계별 마감일 설정
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: scenario.getFutureTime(1), // +1분
        performanceDeadline: scenario.getFutureTime(2),     // +2분
        selfEvaluationDeadline: scenario.getFutureTime(3),  // +3분
        peerEvaluationDeadline: scenario.getFutureTime(4),  // +4분
      });

      // 수동으로 performance 단계로 변경
      await scenario.수동으로_단계를_변경한다(periodId, 'performance');

      const manualState = await scenario.현재_단계를_조회한다(periodId);
      expect(manualState.currentPhase).toBe('performance');

      // 3분 경과 후 자동 전이 확인 (performance → self-evaluation)
      await scenario.시간을_조작한다(3 * 60 * 1000); // 3분
      await scenario.자동_단계_전이를_실행한다();

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase1State.currentPhase).toBe('self-evaluation');

      // 4분 경과 후 자동 전이 확인 (self-evaluation → peer-evaluation)
      await scenario.시간을_조작한다(1 * 60 * 1000); // 추가 1분
      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase2State.currentPhase).toBe('peer-evaluation');

      // 5분 경과 후 자동 전이 확인 (peer-evaluation → closure)
      await scenario.시간을_조작한다(1 * 60 * 1000); // 추가 1분
      await scenario.자동_단계_전이를_실행한다();

      const phase3State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase3State.currentPhase).toBe('closure');

      console.log('✅ 수동 변경 후 자동 전이 검증 완료');
      console.log(`   - 수동 변경 후 자동 전이가 정상적으로 계속 진행됨: ${phase3State.currentPhase}`);
    });
  });

  describe('자동 단계 전이 에러 케이스', () => {
    it('대기 중인 평가기간은 자동 전이되지 않는다', async () => {
      // Given: 대기 중인 평가기간 생성
      const { periodId } = await scenario.평가기간을_생성하고_시작한다({
        name: '대기 상태 테스트용 평가기간',
        startDate: '2024-04-01',
        peerEvaluationDeadline: '2024-09-30',
      });

      // 평가기간을 완료하여 대기 상태로 만들기
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${periodId}/complete`)
        .expect(200);

      const completedState = await scenario.현재_단계를_조회한다(periodId);
      expect(completedState.status).toBe('completed');

      // 자동 단계 전이 실행
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      expect(transitionedCount).toBe(0); // 전이되지 않음

      console.log('✅ 대기/완료 상태 평가기간 자동 전이 제외 검증 완료');
    });

    it('마감일이 지나지 않은 단계는 자동 전이되지 않는다', async () => {
      // Given: 평가기간 생성 및 시작
      const { periodId } = await scenario.평가기간을_생성하고_시작한다({
        name: '마감일 미도달 테스트용 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
      });

      // 마감일을 현재 시간보다 훨씬 미래로 설정
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: scenario.getFutureTime(60), // +60분
        performanceDeadline: scenario.getFutureTime(120),    // +120분
      });

      // 자동 단계 전이 실행
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      expect(transitionedCount).toBe(0); // 전이되지 않음

      const currentState = await scenario.현재_단계를_조회한다(periodId);
      expect(currentState.currentPhase).toBe('evaluation-setup'); // 변경되지 않음

      console.log('✅ 마감일 미도달 시 자동 전이 제외 검증 완료');
    });
  });

  describe('자동 단계 전이 성능 테스트', () => {
    it('여러 평가기간의 자동 단계 전이가 동시에 처리된다', async () => {
      // Given: 여러 평가기간 생성
      const periods = [];
      for (let i = 0; i < 3; i++) {
        const { periodId } = await scenario.평가기간을_생성하고_시작한다({
          name: `동시 처리 테스트용 평가기간 ${i + 1}`,
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-06-30',
        });

        await scenario.단계별_마감일을_설정한다({
          periodId,
          evaluationSetupDeadline: scenario.getFutureTime(1), // +1분
          performanceDeadline: scenario.getFutureTime(2),     // +2분
        });

        periods.push(periodId);
      }

      // 1분 경과 후 자동 전이 실행
      await scenario.시간을_조작한다(1 * 60 * 1000);
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();

      // 모든 평가기간이 전이되었는지 확인
      expect(transitionedCount).toBe(3);

      for (const periodId of periods) {
        const state = await scenario.현재_단계를_조회한다(periodId);
        expect(state.currentPhase).toBe('performance');
      }

      console.log('✅ 다중 평가기간 동시 자동 전이 검증 완료');
      console.log(`   - 전이된 평가기간 수: ${transitionedCount}`);
    });
  });
});
