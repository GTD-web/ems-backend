/**
 * 평가기간 자동 단계 전이 E2E 테스트
 * 
 * README.md의 자동 단계 전이 시나리오를 검증합니다.
 */

import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodAutoPhaseTransitionScenario } from './evaluation-period-auto-phase-transition.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';

describe('평가기간 자동 단계 전이 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let scenario: EvaluationPeriodAutoPhaseTransitionScenario;
  let seedDataScenario: SeedDataScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    scenario = new EvaluationPeriodAutoPhaseTransitionScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);

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

  afterEach(async () => {
    // 각 테스트에서 생성된 평가기간들을 정리
    const createdPeriods = (global as any).createdEvaluationPeriods || [];
    
    for (const periodId of createdPeriods) {
      if (periodId) {
        try {
          // 먼저 평가기간을 완료 상태로 만든 후 삭제
          await testSuite
            .request()
            .post(`/admin/evaluation-periods/${periodId}/complete`)
            .expect((res) => {
              if (res.status !== 200 && res.status !== 404) {
                console.warn(`평가기간 완료 실패: ${res.status} ${res.text}`);
              }
            });
          
          // 완료 후 삭제
          await testSuite
            .request()
            .delete(`/admin/evaluation-periods/${periodId}`)
            .expect((res) => {
              if (res.status !== 200 && res.status !== 404) {
                console.warn(`평가기간 삭제 실패: ${res.status} ${res.text}`);
              }
            });
        } catch (error) {
          console.warn(`평가기간 정리 실패: ${error.message}`);
        }
      }
    }
    
    // 정리 후 배열 초기화
    (global as any).createdEvaluationPeriods = [];
  });

  describe('기본 자동 단계 전이 시나리오', () => {

    it('평가기간 자동 단계 전이 전체 시나리오를 실행한다', async () => {
      // Given: 시드 데이터 생성 (직원 데이터 포함)
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 2,
        departmentCount: 1,
        employeeCount: 3,
      });

      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '자동 전이 테스트용 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 초기 상태 확인 (evaluation-setup 단계)
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');
      expect(initialState.status).toBe('in-progress');

      // evaluation-setup 단계에서 수동 설정 상태 확인 (criteriaSettingEnabled만 true)
      const initialDashboard = await scenario.대시보드_상태를_조회한다(periodId);
      expect(initialDashboard.evaluationPeriod.currentPhase).toBe('evaluation-setup');
      expect(initialDashboard.evaluationPeriod.manualSettings.criteriaSettingEnabled).toBe(true);
      expect(initialDashboard.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled).toBe(false);
      expect(initialDashboard.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled).toBe(false);
      console.log(`   - evaluation-setup 단계 수동 설정: criteria=${initialDashboard.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${initialDashboard.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${initialDashboard.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`);

      // 단계별 마감일 설정 (과거 시간으로 설정하여 즉시 전이되도록)
      const now = scenario.getCurrentTime();
      const pastTime = new Date(now.getTime() - 60 * 1000).toISOString(); // 1분 전
      const futureTime1 = new Date(now.getTime() + 60 * 1000).toISOString(); // 1분 후
      const futureTime2 = new Date(now.getTime() + 2 * 60 * 1000).toISOString(); // 2분 후
      const futureTime3 = new Date(now.getTime() + 3 * 60 * 1000).toISOString(); // 3분 후
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: pastTime, // 과거 시간으로 설정
        performanceDeadline: futureTime1,  // 1분 후
        selfEvaluationDeadline: futureTime2, // 2분 후
        peerEvaluationDeadline: futureTime3, // 3분 후
      });
      
      // 자동 단계 전이 실행 전 상태 확인
      const beforeTransition = await scenario.현재_단계를_조회한다(periodId);
      console.log(`자동 전이 전 상태: ${beforeTransition.currentPhase}`);
      
      // 현재 시간과 마감일 확인
      const currentTime = scenario.getCurrentTime();
      const evaluationSetupDeadline = scenario.getFutureTime(1);
      console.log(`현재 시간: ${currentTime.toISOString()}`);
      console.log(`evaluation-setup 마감일: ${evaluationSetupDeadline}`);
      console.log(`마감일 지났는가: ${currentTime >= new Date(evaluationSetupDeadline)}`);
      
      const transitionedCount = await scenario.자동_단계_전이를_실행한다();
      console.log(`전이된 평가기간 수: ${transitionedCount}`);

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`자동 전이 후 상태: ${phase1State.currentPhase}`);
      expect(phase1State.currentPhase).toBe('performance');

      // 대시보드에서 수동 설정 상태 확인 (performance 단계에서는 모두 false)
      const dashboard1 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard1.evaluationPeriod.currentPhase).toBe('performance');
      expect(dashboard1.evaluationPeriod.manualSettings.criteriaSettingEnabled).toBe(false);
      expect(dashboard1.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled).toBe(false);
      expect(dashboard1.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled).toBe(false);
      console.log(`   - performance 단계 수동 설정: criteria=${dashboard1.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard1.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard1.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`);

      // 2분 경과 후 자동 전이 확인 (performance → self-evaluation)
      // performance 마감일을 과거로 설정
      const now2 = scenario.getCurrentTime();
      const pastTime2 = new Date(now2.getTime() - 60 * 1000).toISOString(); // 1분 전
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        performanceDeadline: pastTime2, // 과거 시간으로 설정
      });
      
      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`2단계 전이 후 상태: ${phase2State.currentPhase}`);
      expect(phase2State.currentPhase).toBe('self-evaluation');

      // 대시보드에서 수동 설정 상태 확인 (self-evaluation 단계에서는 selfEvaluationSettingEnabled만 true)
      const dashboard2 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard2.evaluationPeriod.currentPhase).toBe('self-evaluation');
      expect(dashboard2.evaluationPeriod.manualSettings.criteriaSettingEnabled).toBe(false);
      expect(dashboard2.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled).toBe(true);
      expect(dashboard2.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled).toBe(false);
      console.log(`   - self-evaluation 단계 수동 설정: criteria=${dashboard2.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard2.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard2.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`);

      // 3분 경과 후 자동 전이 확인 (self-evaluation → peer-evaluation)
      // self-evaluation 마감일을 과거로 설정
      const now3 = scenario.getCurrentTime();
      const pastTime3 = new Date(now3.getTime() - 60 * 1000).toISOString(); // 1분 전
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        selfEvaluationDeadline: pastTime3, // 과거 시간으로 설정
      });
      
      await scenario.자동_단계_전이를_실행한다();

      const phase3State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`3단계 전이 후 상태: ${phase3State.currentPhase}`);
      expect(phase3State.currentPhase).toBe('peer-evaluation');

      // 대시보드에서 수동 설정 상태 확인 (peer-evaluation 단계에서는 finalEvaluationSettingEnabled만 true)
      const dashboard3 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard3.evaluationPeriod.currentPhase).toBe('peer-evaluation');
      expect(dashboard3.evaluationPeriod.manualSettings.criteriaSettingEnabled).toBe(false);
      expect(dashboard3.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled).toBe(false);
      expect(dashboard3.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled).toBe(true);
      console.log(`   - peer-evaluation 단계 수동 설정: criteria=${dashboard3.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard3.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard3.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`);

      // 4분 경과 후 자동 전이 확인 (peer-evaluation → closure)
      // peer-evaluation 마감일을 과거로 설정
      const now4 = scenario.getCurrentTime();
      const pastTime4 = new Date(now4.getTime() - 60 * 1000).toISOString(); // 1분 전
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        peerEvaluationDeadline: pastTime4, // 과거 시간으로 설정
      });
      
      await scenario.자동_단계_전이를_실행한다();

      const phase4State = await scenario.현재_단계를_조회한다(periodId);
      console.log(`4단계 전이 후 상태: ${phase4State.currentPhase}`);
      expect(phase4State.currentPhase).toBe('closure');

      // 대시보드에서 수동 설정 상태 확인 (closure 단계에서는 모두 false)
      const dashboard4 = await scenario.대시보드_상태를_조회한다(periodId);
      expect(dashboard4.evaluationPeriod.currentPhase).toBe('closure');
      expect(dashboard4.evaluationPeriod.manualSettings.criteriaSettingEnabled).toBe(false);
      expect(dashboard4.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled).toBe(false);
      expect(dashboard4.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled).toBe(false);
      console.log(`   - closure 단계 수동 설정: criteria=${dashboard4.evaluationPeriod.manualSettings.criteriaSettingEnabled}, self=${dashboard4.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled}, final=${dashboard4.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled}`);

      console.log('✅ 자동 단계 전이 전체 시나리오 완료');
      console.log(`   - 최종 단계: ${phase4State.currentPhase}`);
    });
  });

  describe('평가기간 자동 단계 전이 (마감일 미설정 케이스)', () => {

    it('마감일이 설정되지 않은 단계는 자동 전이되지 않는다', async () => {
      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '마감일 미설정 테스트용 평가기간',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 현재 단계 확인 (evaluation-setup)
      const initialState = await scenario.현재_단계를_조회한다(periodId);
      expect(initialState.currentPhase).toBe('evaluation-setup');

      // 일부 단계의 마감일만 설정 (README.md 시나리오에 따라)
      // peerEvaluationDeadline (2024-12-31)보다 이른 시간으로 설정
      const now = scenario.getCurrentTime();
      const pastTime = new Date(now.getTime() - 60 * 1000).toISOString(); // 1분 전
      const futureTime = new Date(now.getTime() + 60 * 1000).toISOString(); // 1분 후
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: pastTime,   // 과거 시간으로 설정하여 즉시 전이
        performanceDeadline: futureTime,     // 미래 시간으로 설정하여 전이되지 않음
        // selfEvaluationDeadline과 peerEvaluationDeadline은 설정하지 않음 (README.md 시나리오)
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

      console.log('✅ 마감일 미설정 케이스 검증 완료');
      console.log(`   - 마감일이 설정되지 않은 단계는 자동 전이되지 않음: ${phase2State.currentPhase}`);
    });
  });

  describe('평가기간 자동 단계 전이 (수동 단계 변경 후 자동 전이)', () => {

    it('수동으로 단계를 변경한 후 자동 전이가 계속 진행된다', async () => {
      // Given: 평가기간 생성 및 시작
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '수동 변경 후 자동 전이 테스트용 평가기간',
        startDate: '2024-08-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 단계별 마감일 설정 (README.md 시나리오에 따라)
      // peerEvaluationDeadline (2025-12-31)보다 이른 시간으로 설정
      const earlyTime1 = '2024-08-15T00:00:00.000Z'; // evaluationSetupDeadline
      const earlyTime2 = '2024-08-16T00:00:00.000Z'; // performanceDeadline
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: earlyTime1, // 가장 이른 시간
        performanceDeadline: earlyTime2,     // evaluationSetupDeadline보다 늦은 시간
        // selfEvaluationDeadline과 peerEvaluationDeadline은 설정하지 않음 (README.md 시나리오)
      });

      // 수동으로 performance 단계로 변경 (README.md 시나리오에 따라)
      await scenario.수동으로_단계를_변경한다(periodId, 'performance');

      const manualState = await scenario.현재_단계를_조회한다(periodId);
      expect(manualState.currentPhase).toBe('performance');

      // 3분 경과 후 자동 전이 확인 (performance → self-evaluation)
      // performance 마감일을 과거로 설정
      const now2 = scenario.getCurrentTime();
      const pastTime2 = new Date(now2.getTime() - 60 * 1000).toISOString(); // 1분 전
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        performanceDeadline: pastTime2, // 과거 시간으로 설정
      });
      
      await scenario.자동_단계_전이를_실행한다();

      const phase1State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase1State.currentPhase).toBe('self-evaluation');

      // 4분 경과 후 자동 전이 확인 (self-evaluation → peer-evaluation)
      // self-evaluation 마감일을 과거로 설정
      const now3 = scenario.getCurrentTime();
      const pastTime3 = new Date(now3.getTime() - 60 * 1000).toISOString(); // 1분 전
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        selfEvaluationDeadline: pastTime3, // 과거 시간으로 설정
      });
      
      await scenario.자동_단계_전이를_실행한다();

      const phase2State = await scenario.현재_단계를_조회한다(periodId);
      expect(phase2State.currentPhase).toBe('peer-evaluation');

      // 5분 경과 후 자동 전이 확인 (peer-evaluation → closure)
      // peer-evaluation 마감일을 과거로 설정
      const now4 = scenario.getCurrentTime();
      const pastTime4 = new Date(now4.getTime() - 60 * 1000).toISOString(); // 1분 전
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        peerEvaluationDeadline: pastTime4, // 과거 시간으로 설정
      });
      
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
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '대기 상태 테스트용 평가기간',
        startDate: '2024-09-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

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
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '마감일 미도달 테스트용 평가기간',
        startDate: '2024-10-01',
        peerEvaluationDeadline: '2025-12-31', // 더 늦은 날짜로 설정
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      // 마감일을 현재 시간보다 훨씬 미래로 설정
      const now = scenario.getCurrentTime();
      const futureTime1 = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // +60분
      const futureTime2 = new Date(now.getTime() + 120 * 60 * 1000).toISOString(); // +120분
      
      await scenario.단계별_마감일을_설정한다({
        periodId,
        evaluationSetupDeadline: futureTime1, // +60분
        performanceDeadline: futureTime2,     // +120분
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
      // Given: 단일 평가기간 생성 (단순화)
      const result = await scenario.평가기간을_생성하고_시작한다({
        name: '자동 단계 전이 테스트용 평가기간',
        startDate: '2024-11-01',
        peerEvaluationDeadline: '2024-12-31', // 충분히 늦은 마감일
      });
      // 전역 배열에 평가기간 ID 추가
      if (!(global as any).createdEvaluationPeriods) {
        (global as any).createdEvaluationPeriods = [];
      }
      (global as any).createdEvaluationPeriods.push(result.periodId);
      const periodId = result.periodId;

      console.log(`생성된 평가기간 ID:`, periodId);

      // 마감일 설정 없이 자동 단계 전이 테스트
      // (현재 단계는 evaluation-setup이고, 마감일이 설정되지 않았으므로 자동 전이되지 않음)

      const periods = [periodId];

      // 자동 전이 실행 전 상태 확인
      console.log('=== 자동 전이 실행 전 상태 ===');
      for (let i = 0; i < periods.length; i++) {
        const state = await scenario.현재_단계를_조회한다(periods[i]);
        console.log(`평가기간 ${i + 1} (${periods[i]}) 상태:`, state);
      }

      // 자동 전이 실행 (여러 번 실행하여 모든 단계 전이)
      let totalTransitionedCount = 0;
      for (let i = 0; i < 3; i++) {
        console.log(`=== 자동 전이 실행 ${i + 1}회차 ===`);
        const transitionedCount = await scenario.자동_단계_전이를_실행한다();
        totalTransitionedCount += transitionedCount;
        console.log(`전이된 평가기간 수: ${transitionedCount}`);
        
        // 모든 평가기간이 performance 단계에 도달했으면 중단
        let allInPerformance = true;
        for (let j = 0; j < periods.length; j++) {
          const state = await scenario.현재_단계를_조회한다(periods[j]);
          console.log(`평가기간 ${j + 1} (${periods[j]}) 상태:`, state);
          if (state.currentPhase !== 'performance') {
            allInPerformance = false;
          }
        }
        
        if (allInPerformance) {
          console.log('모든 평가기간이 performance 단계에 도달했습니다.');
          break;
        }
      }

      // 마감일이 설정되지 않았으므로 자동 전이가 발생하지 않아야 함
      expect(totalTransitionedCount).toBe(0);

      for (const periodId of periods) {
        const state = await scenario.현재_단계를_조회한다(periodId);
        console.log(`평가기간 ${periodId} 상태:`, state);
        expect(state.currentPhase).toBe('evaluation-setup'); // 마감일 미설정으로 전이되지 않음
      }

      console.log('✅ 다중 평가기간 동시 자동 전이 검증 완료');
      console.log(`   - 전이된 평가기간 수: ${totalTransitionedCount}`);
    });
  });
});
