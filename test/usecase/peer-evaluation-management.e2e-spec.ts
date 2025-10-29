import { BaseE2ETest } from '../base-e2e.spec';
import { SeedDataScenario } from './scenarios/seed-data.scenario';
import { PeerEvaluationScenario } from './scenarios/peer-evaluation.scenario';

describe('동료평가 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let peerEvaluationScenario: PeerEvaluationScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let evaluatorId: string;
  let evaluateeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    
    seedDataScenario = new SeedDataScenario(testSuite);
    peerEvaluationScenario = new PeerEvaluationScenario(testSuite);

    // 시드데이터 생성 (MINIMAL 시나리오)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.seedResponse.results[0].generatedIds?.employeeIds || [];
    evaluatorId = employeeIds[0];
    evaluateeId = employeeIds[1];

    // 평가기간 생성
    const periodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send({
        name: '동료평가 테스트 기간',
        startDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
        peerEvaluationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // YYYY-MM-DD 형식
        description: '동료평가 테스트를 위한 평가기간',
      })
      .expect(201);

    evaluationPeriodId = periodResponse.body.id;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('동료평가 요청', () => {
    it('기본 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);

      const result = await peerEvaluationScenario.동료평가를_요청한다({
          evaluatorId,
          evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 요청되었습니다');
    });

    it('요청 마감일을 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);
      const requestDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const result = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
        requestDeadline,
      });

      expect(result.id).toBeDefined();
      expect(result.message).toContain('성공적으로 요청되었습니다');
    });

    it('한 명의 피평가자를 여러 평가자에게 요청할 수 있어야 한다', async () => {
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);
      // evaluateeId를 제외한 다른 직원들을 평가자로 사용
      const evaluatorIds = employeeIds.filter(id => id !== evaluateeId).slice(0, 3);

      const result = await peerEvaluationScenario.한명의_피평가자를_여러평가자에게_요청한다({
        evaluatorIds,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(evaluatorIds.length);
      expect(result.summary.total).toBe(evaluatorIds.length);
      expect(result.summary.success).toBeGreaterThan(0);
    });

    it('한 명의 평가자가 여러 피평가자를 평가하도록 요청할 수 있어야 한다', async () => {
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);
      // evaluatorId를 제외한 다른 직원들을 피평가자로 사용
      const evaluateeIds = employeeIds.filter(id => id !== evaluatorId).slice(0, 3);

      const result = await peerEvaluationScenario.한명의_평가자가_여러피평가자를_평가하도록_요청한다({
        evaluatorId,
        evaluateeIds,
        periodId: evaluationPeriodId,
        questionIds,
      });

      expect(result.results).toBeDefined();
      expect(result.results.length).toBe(evaluateeIds.length);
      expect(result.summary.total).toBe(evaluateeIds.length);
      expect(result.summary.success).toBeGreaterThan(0);
    });
  });

  describe('동료평가 조회', () => {
    it('평가자의 동료평가 목록을 조회할 수 있어야 한다', async () => {
      // 먼저 동료평가 요청 생성
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);

      await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      const result = await peerEvaluationScenario.평가자의_동료평가목록을_조회한다(evaluatorId, {
        periodId: evaluationPeriodId,
      });

      expect(result.evaluations).toBeDefined();
      expect(Array.isArray(result.evaluations)).toBe(true);
      expect(result.evaluations.length).toBeGreaterThan(0);
    });

    it('모든 평가자의 동료평가 목록을 조회할 수 있어야 한다', async () => {
      const result = await peerEvaluationScenario.모든평가자의_동료평가목록을_조회한다({
        periodId: evaluationPeriodId,
      });

      expect(result.evaluations).toBeDefined();
      expect(Array.isArray(result.evaluations)).toBe(true);
    });

    it('동료평가 상세정보를 조회할 수 있어야 한다', async () => {
      // 먼저 동료평가 요청 생성
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);

      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      const result = await peerEvaluationScenario.동료평가_상세정보를_조회한다(요청결과.id);

      expect(result.id).toBe(요청결과.id);
      expect(result.evaluator).toBeDefined();
      expect(result.evaluatee).toBeDefined();
      expect(result.period).toBeDefined();
    });

    it('평가자에게 할당된 피평가자 목록을 조회할 수 있어야 한다', async () => {
      const result = await peerEvaluationScenario.평가자에게_할당된_피평가자목록을_조회한다(evaluatorId, {
        periodId: evaluationPeriodId,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('동료평가 답변 및 제출', () => {
    it('동료평가 질문 답변을 저장할 수 있어야 한다', async () => {
      // 먼저 동료평가 요청 생성
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);

      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      const result = await peerEvaluationScenario.동료평가_질문답변을_저장한다(
        요청결과.id,
        {
          peerEvaluationId: 요청결과.id,
          answers: questionIds.map((questionId, index) => ({
            questionId,
            answer: `답변 ${index + 1}`,
          })),
        }
      );

      expect(result.savedCount).toBeDefined();
      expect(result.message).toContain('성공적으로 저장되었습니다');
    });

    it('동료평가를 제출할 수 있어야 한다', async () => {
      // 먼저 동료평가 요청 생성
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);

      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      // 답변 저장
      await peerEvaluationScenario.동료평가_질문답변을_저장한다(요청결과.id, {
        peerEvaluationId: 요청결과.id,
        answers: questionIds.map((questionId, index) => ({
          questionId,
          answer: `답변 ${index + 1}`,
        })),
      });

      // 제출
      await peerEvaluationScenario.동료평가를_제출한다(요청결과.id, questionIds);

      // 제출 후 상세 조회로 상태 확인
      const 상세조회결과 = await peerEvaluationScenario.동료평가_상세정보를_조회한다(요청결과.id);
      expect(상세조회결과.id).toBe(요청결과.id);
    });
  });

  describe('동료평가 취소', () => {
    it('동료평가 요청을 취소할 수 있어야 한다', async () => {
      // 먼저 동료평가 요청 생성
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);

      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      // 취소
      await peerEvaluationScenario.동료평가_요청을_취소한다(요청결과.id);

      // 취소 후 조회 - 상태가 cancelled인지 확인
      const 취소후조회결과 = await peerEvaluationScenario.동료평가_상세정보를_조회한다(요청결과.id);
      console.log('취소 후 조회 결과:', 취소후조회결과);
      expect(취소후조회결과.status).toBe('cancelled');
    });

    it('평가기간의 피평가자의 모든 동료평가 요청을 취소할 수 있어야 한다', async () => {
      // 먼저 여러 동료평가 요청 생성
      const { 질문들 } = await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const questionIds = 질문들.map(q => q.id);
      // evaluateeId를 제외한 다른 직원들을 평가자로 사용
      const evaluatorIds = employeeIds.filter(id => id !== evaluateeId).slice(0, 3);

      await peerEvaluationScenario.한명의_피평가자를_여러평가자에게_요청한다({
        evaluatorIds,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds,
      });

      // 일괄 취소
      const result = await peerEvaluationScenario.평가기간의_피평가자의_모든동료평가요청을_취소한다(
        evaluateeId,
        evaluationPeriodId
      );

      expect(result.message).toBeDefined();
      expect(result.cancelledCount).toBeGreaterThan(0);
    });
  });

  describe('복합 시나리오', () => {
    it('동료평가 전체 시나리오를 실행할 수 있어야 한다', async () => {
      const result = await peerEvaluationScenario.동료평가_전체_시나리오를_실행한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
      });

      expect(result.질문생성결과.질문들).toBeDefined();
      expect(result.질문생성결과.질문들.length).toBeGreaterThan(0);
      expect(result.동료평가요청결과.id).toBeDefined();
      expect(result.답변저장결과.savedCount).toBeDefined();
      expect(result.상세조회결과.id).toBe(result.동료평가요청결과.id);
    });

    it('일괄 동료평가 요청 시나리오를 실행할 수 있어야 한다', async () => {
      // evaluateeId를 제외한 다른 직원들을 평가자로 사용
      const evaluatorIds = employeeIds.filter(id => id !== evaluateeId).slice(0, 3);

      const result = await peerEvaluationScenario.일괄동료평가_요청_시나리오를_실행한다({
        evaluatorIds,
        evaluateeId,
        periodId: evaluationPeriodId,
      });

      expect(result.질문생성결과.질문들).toBeDefined();
      expect(result.일괄요청결과.results).toBeDefined();
      expect(result.일괄요청결과.results.length).toBe(evaluatorIds.length);
      expect(result.개별조회결과).toBeDefined();
      expect(result.개별조회결과.length).toBe(evaluatorIds.length);
    });

    it('동료평가 취소 시나리오를 실행할 수 있어야 한다', async () => {
      const result = await peerEvaluationScenario.동료평가_취소_시나리오를_실행한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
      });

      expect(result.질문생성결과.질문들).toBeDefined();
      expect(result.동료평가요청결과.id).toBeDefined();
      expect(result.조회결과.status).toBe('cancelled');
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다', async () => {
      try {
        await peerEvaluationScenario.동료평가를_요청한다({
          evaluatorId: 'invalid-uuid',
          evaluateeId,
          periodId: evaluationPeriodId,
        });
        fail('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(400);
      }
    });

    it('존재하지 않는 evaluatorId로 요청 시 404 에러가 발생해야 한다', async () => {
      try {
        await peerEvaluationScenario.동료평가를_요청한다({
          evaluatorId: '00000000-0000-0000-0000-000000000000',
        evaluateeId,
        periodId: evaluationPeriodId,
        });
        fail('존재하지 않는 evaluatorId로 요청 시 404 에러가 발생해야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(404);
      }
    });

    it('필수 필드가 누락된 요청 시 400 에러가 발생해야 한다', async () => {
      try {
        await peerEvaluationScenario.동료평가를_요청한다({
          evaluatorId,
          // evaluateeId 누락
          periodId: evaluationPeriodId,
        } as any);
        fail('필수 필드 누락 시 400 에러가 발생해야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(400);
      }
    });

    it('존재하지 않는 동료평가 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      try {
        await peerEvaluationScenario.동료평가_상세정보를_조회한다('00000000-0000-0000-0000-000000000000');
        fail('존재하지 않는 ID로 조회 시 404 에러가 발생해야 합니다');
      } catch (error) {
        const statusMatch = error.message.match(/got (\d+)/);
        const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
        expect(statusCode).toBe(404);
      }
    });
  });
});
