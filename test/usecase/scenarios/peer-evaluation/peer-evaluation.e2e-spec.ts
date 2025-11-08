import { BaseE2ETest } from '../../../base-e2e.spec';
import { PeerEvaluationScenario } from './peer-evaluation.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';

/**
 * 동료평가 관리 E2E 테스트
 *
 * 동료평가 관련 모든 시나리오를 검증합니다.
 * - 평가 질문 관리 (선행 조건)
 * - 동료평가 요청 (단일, 대량)
 * - 동료평가 조회
 * - 동료평가 답변 저장
 * - 동료평가 제출
 * - 동료평가 취소
 * - 대시보드 상태 검증
 */
describe('동료평가 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let peerEvaluationScenario: PeerEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let evaluatorId: string;
  let evaluateeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    peerEvaluationScenario = new PeerEvaluationScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    evaluatorId = employeeIds[0];
    evaluateeId = employeeIds[1];

    if (employeeIds.length < 2) {
      throw new Error('시드 데이터 생성 실패: 최소 2명의 직원이 필요합니다.');
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '동료평가 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '동료평가 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const evaluationPeriod =
      await evaluationPeriodScenario.평가기간을_생성한다(createData);
    evaluationPeriodId = evaluationPeriod.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);
  });

  // ==================== 동료평가 요청 기본 관리 ====================

  describe('동료평가 요청 기본 관리', () => {
    it('동료평가를 요청한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 동료평가 요청
      const 결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds: 질문Ids,
      });

      expect(결과.id).toBeDefined();
      expect(결과.message).toContain('성공적으로 요청되었습니다');

      // 3. 대시보드 상태 확인
      await peerEvaluationScenario.dashboardScenario.동료평가_상태_변경을_검증한다(
        evaluationPeriodId,
        evaluateeId,
        'in_progress',
        1,
        0,
      );

      // 4. 상세 조회
      const 상세조회결과 =
        await peerEvaluationScenario.동료평가_상세정보를_조회한다(결과.id);

      expect(상세조회결과.id).toBe(결과.id);
      expect(상세조회결과.questions).toBeDefined();
      expect(Array.isArray(상세조회결과.questions)).toBe(true);
      expect(상세조회결과.questions.length).toBe(질문Ids.length);
    });

    it('동료평가 상세정보를 조회한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 동료평가 요청
      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds: 질문Ids,
      });

      // 3. 상세 조회
      const 상세조회결과 =
        await peerEvaluationScenario.동료평가_상세정보를_조회한다(요청결과.id);

      expect(상세조회결과.id).toBe(요청결과.id);
      expect(상세조회결과.evaluator).toBeDefined();
      expect(상세조회결과.evaluatee).toBeDefined();
      expect(상세조회결과.period).toBeDefined();
      expect(상세조회결과.questions).toBeDefined();
      expect(상세조회결과.questions.length).toBe(질문Ids.length);

      // 질문 정보 검증
      상세조회결과.questions.forEach((question: any, index: number) => {
        expect(question.id).toBe(질문Ids[index]);
        expect(question.text).toBeDefined();
        expect(question.displayOrder).toBe(index);
      });
    });
  });

  // ==================== 동료평가 답변 관리 ====================

  describe('동료평가 답변 관리', () => {
    it('동료평가 질문 답변을 저장한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 동료평가 요청
      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds: 질문Ids,
      });

      // 3. 답변 저장
      const 답변저장결과 =
        await peerEvaluationScenario.동료평가_질문답변을_저장한다(요청결과.id, {
          peerEvaluationId: 요청결과.id,
          answers: 질문Ids.map((questionId, index) => ({
            questionId,
            answer: `답변 ${index + 1}`,
            score: 4,
          })),
        });

      expect(답변저장결과.savedCount).toBe(질문Ids.length);
      expect(답변저장결과.message).toContain('성공적으로 저장되었습니다');

      // 4. 상세 조회로 답변 확인
      const 상세조회결과 =
        await peerEvaluationScenario.동료평가_상세정보를_조회한다(요청결과.id);

      상세조회결과.questions.forEach((question: any) => {
        expect(question.answer).toBeDefined();
        expect(question.score).toBe(4);
      });
    });

    it('동료평가를 제출한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 동료평가 요청
      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds: 질문Ids,
      });

      // 3. 동료평가 제출 (내부에서 답변 저장 후 제출)
      await peerEvaluationScenario.동료평가를_제출한다(요청결과.id, 질문Ids);

      // 4. 상세 조회로 제출 상태 확인
      const 상세조회결과 =
        await peerEvaluationScenario.동료평가_상세정보를_조회한다(요청결과.id);

      expect(상세조회결과.isCompleted).toBe(true);
      expect(상세조회결과.completedAt).toBeDefined();

      // 5. 대시보드 상태 확인
      await peerEvaluationScenario.dashboardScenario.동료평가_상태_변경을_검증한다(
        evaluationPeriodId,
        evaluateeId,
        'complete',
        1,
        1,
      );
    });
  });

  // ==================== 동료평가 취소 관리 ====================

  describe('동료평가 취소 관리', () => {
    it('동료평가 요청을 취소한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 동료평가 요청
      const 요청결과 = await peerEvaluationScenario.동료평가를_요청한다({
        evaluatorId,
        evaluateeId,
        periodId: evaluationPeriodId,
        questionIds: 질문Ids,
      });

      // 3. 취소 전 상태 확인
      await peerEvaluationScenario.dashboardScenario.동료평가_상태_변경을_검증한다(
        evaluationPeriodId,
        evaluateeId,
        'in_progress',
        1,
        0,
      );

      // 4. 동료평가 취소
      await peerEvaluationScenario.동료평가_요청을_취소한다(요청결과.id);

      // 5. 취소 후 상태 확인
      await peerEvaluationScenario.dashboardScenario.동료평가_상태_변경을_검증한다(
        evaluationPeriodId,
        evaluateeId,
        'none',
        0,
        0,
      );
    });
  });

  // ==================== 동료평가 전체 시나리오 ====================

  describe('동료평가 전체 시나리오', () => {
    it('동료평가 전체 시나리오를 실행한다', async () => {
      const 결과 =
        await peerEvaluationScenario.동료평가_전체_시나리오를_실행한다({
          evaluatorId,
          evaluateeId,
          periodId: evaluationPeriodId,
        });

      expect(결과.질문생성결과.질문들.length).toBeGreaterThan(0);
      expect(결과.동료평가요청결과.id).toBeDefined();
      expect(결과.답변저장결과.savedCount).toBeGreaterThan(0);
      expect(결과.상세조회결과.isCompleted).toBe(true);
    });
  });
});
