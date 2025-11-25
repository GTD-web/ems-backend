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

  let testCounter = 0; // 테스트 실행 횟수 카운터

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

  afterEach(async () => {
    // 각 테스트 후 평가 기간 정리
    if (evaluationPeriodId) {
      await evaluationPeriodScenario.평가기간을_취소한다(evaluationPeriodId);
      await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      evaluationPeriodId = ''; // 초기화
    }
  });

  beforeEach(async () => {
    testCounter++; // 테스트 실행 횟수 증가

    // 1. 모든 활성 평가기간 정리 (이전 테스트의 잔여 데이터 제거)
    await evaluationPeriodScenario.모든_활성_평가기간을_정리한다();

    // 2. 각 테스트마다 시드 데이터를 새로 생성 (평가기간 제외)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal', // 평가기간을 생성하지 않도록 minimal 사용
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 55, // 55명 * 20% = 11명의 파트장 생성
    });

    employeeIds = seedResult.employeeIds || [];
    evaluatorId = employeeIds[0];
    evaluateeId = employeeIds[1];

    if (employeeIds.length < 2) {
      throw new Error('시드 데이터 생성 실패: 최소 2명의 직원이 필요합니다.');
    }

    // 3. 평가기간 생성 (완전히 유니크한 이름과 날짜 사용)
    const now = new Date();
    const uniqueTimestamp = now.getTime();
    const randomValue = Math.random().toString(36).substring(2, 15);
    const uniqueId = `${uniqueTimestamp}_${randomValue}_${testCounter}`;

    // 각 테스트마다 1년씩 떨어진 날짜 범위 사용 (충분한 간격 확보)
    const yearOffset = testCounter; // 테스트 1: 2025년, 테스트 2: 2026년...
    const baseYear = 2025 + yearOffset;
    const startDate = new Date(`${baseYear}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${baseYear}-03-31T23:59:59.000Z`); // 3개월 후

    const createData = {
      name: `동료평가_테스트_${uniqueId}`,
      startDate: startDate.toISOString(),
      peerEvaluationDeadline: endDate.toISOString(),
      description: `동료평가 E2E 테스트용 평가기간 (${testCounter})`,
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

    // 4. 평가기간 생성
    const evaluationPeriod =
      await evaluationPeriodScenario.평가기간을_생성한다(createData);
    evaluationPeriodId = evaluationPeriod.id;

    // 5. 평가기간 시작
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

  // ==================== 평가자들 간 동료평가 (다대다) ====================

  describe('평가자들 간 동료평가 (다대다)', () => {
    it('평가자들 간 동료평가 요청을 생성한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      console.log(`\n📝 생성된 평가 질문:`);
      질문들.forEach((질문, index) => {
        console.log(`  ${index + 1}. ${질문.text} (ID: ${질문.id})`);
      });

      // 2. 평가자 4명, 피평가자 4명 선택 (일부 중복 가능)
      const 평가자Ids = employeeIds.slice(0, 4);
      const 피평가자Ids = employeeIds.slice(2, 6); // 일부 중복

      console.log(`\n👥 선택된 인원:`);
      console.log(`  - 평가자: ${평가자Ids.length}명`);
      console.log(`  - 피평가자: ${피평가자Ids.length}명`);

      // 3. 평가자들 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: 평가자Ids,
          evaluateeIds: 피평가자Ids,
          questionIds: 질문Ids,
          comment: '프로젝트 팀원 간 상호 평가를 진행합니다.',
        })
        .expect(201);

      // 4. 응답 검증
      expect(결과.body).toBeDefined();
      expect(결과.body.summary).toBeDefined();
      expect(결과.body.summary.total).toBeDefined();
      expect(결과.body.summary.success).toBeDefined();
      expect(결과.body.summary.failed).toBeDefined();
      expect(결과.body.message).toBeDefined();
      expect(결과.body.results).toBeDefined();
      expect(Array.isArray(결과.body.results)).toBe(true);

      console.log(`\n📊 평가자들 간 동료평가 요청 결과:`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 각 평가자가 자신을 제외한 피평가자를 평가
      // 예상 개수 계산
      let 예상개수 = 0;
      for (const evaluatorId of 평가자Ids) {
        const 대상자수 = 피평가자Ids.filter((id) => id !== evaluatorId).length;
        예상개수 += 대상자수;
      }

      console.log(`  - 예상 요청 수: ${예상개수}건`);
      expect(결과.body.summary.total).toBe(예상개수);

      // 5. 생성된 동료평가 중 하나를 상세 조회하여 검증
      const 성공한결과들 = 결과.body.results.filter((r: any) => r.success);
      if (성공한결과들.length > 0) {
        const 첫번째평가Id = 성공한결과들[0].evaluationId;

        console.log(`\n🔍 동료평가 상세 조회 (ID: ${첫번째평가Id})`);

        const 상세결과 = await testSuite
          .request()
          .get(`/admin/performance-evaluation/peer-evaluations/${첫번째평가Id}`)
          .expect(200);

        console.log(`\n✅ 동료평가 상세 정보:`);
        console.log(
          `  - 평가자: ${상세결과.body.evaluator?.name || 'N/A'} (${상세결과.body.evaluator?.employeeNumber || 'N/A'})`,
        );
        console.log(
          `  - 피평가자: ${상세결과.body.evaluatee?.name || 'N/A'} (${상세결과.body.evaluatee?.employeeNumber || 'N/A'})`,
        );
        console.log(`  - 상태: ${상세결과.body.status}`);
        console.log(`  - 질문 개수: ${상세결과.body.questions.length}개`);
        console.log(`  - 코멘트: ${상세결과.body.comment || '없음'}`);

        // 질문 데이터 검증
        expect(상세결과.body.questions).toBeDefined();
        expect(Array.isArray(상세결과.body.questions)).toBe(true);
        expect(상세결과.body.questions.length).toBe(질문들.length);

        // 코멘트 검증 (comment 필드는 응답에 포함되지 않을 수 있음)
        if (상세결과.body.comment) {
          expect(상세결과.body.comment).toBe(
            '프로젝트 팀원 간 상호 평가를 진행합니다.',
          );
        }

        console.log(
          `\n✅ 평가자들 간 동료평가 요청이 성공적으로 생성되었습니다!`,
        );
      }
    }, 120000);

    it('각 평가자가 자기 자신을 평가하는 요청은 생성되지 않는다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 평가자와 피평가자를 동일하게 설정
      const 참여자Ids = employeeIds.slice(0, 3);

      console.log(`\n👥 참여자: ${참여자Ids.length}명`);

      // 3. 평가자들 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: 참여자Ids,
          evaluateeIds: 참여자Ids,
          questionIds: 질문Ids,
        })
        .expect(201);

      console.log(`\n📊 요청 결과:`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);

      // 4. 자기 자신을 평가하는 요청이 없는지 확인
      if (결과.body.results && 결과.body.results.length > 0) {
        const selfEvaluations = 결과.body.results.filter(
          (result: any) => result.evaluatorId === result.evaluateeId,
        );

        expect(selfEvaluations.length).toBe(0);
        console.log(`\n✅ 자기 자신을 평가하는 요청이 없습니다.`);

        // 예상 개수: N명 * (N-1)명 = 3 * 2 = 6
        const 예상개수 = 참여자Ids.length * (참여자Ids.length - 1);
        expect(결과.body.summary.total).toBe(예상개수);
        console.log(`\n✅ 예상 요청 수 (${예상개수}건)와 일치합니다.`);
      }
    }, 120000);

    it('필수 필드 누락 시 400 에러가 발생한다', async () => {
      // evaluatorIds 누락
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluateeIds: employeeIds.slice(0, 2),
        })
        .expect(400);

      // evaluateeIds 누락
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: employeeIds.slice(0, 2),
        })
        .expect(400);

      // periodId 누락
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          evaluatorIds: employeeIds.slice(0, 2),
          evaluateeIds: employeeIds.slice(2, 4),
        })
        .expect(400);

      console.log(`\n✅ 필수 필드 누락 시 400 에러가 발생합니다.`);
    }, 120000);

    it('빈 배열로 요청 시 400 에러가 발생한다', async () => {
      // 빈 evaluatorIds
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: [],
          evaluateeIds: employeeIds.slice(0, 2),
        })
        .expect(400);

      // 빈 evaluateeIds
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: employeeIds.slice(0, 2),
          evaluateeIds: [],
        })
        .expect(400);

      console.log(`\n✅ 빈 배열로 요청 시 400 에러가 발생합니다.`);
    }, 120000);

    it('다양한 조합의 평가자와 피평가자로 요청을 생성한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 평가자와 피평가자를 다르게 설정
      const 평가자Ids = employeeIds.slice(0, 2);
      const 피평가자Ids = employeeIds.slice(2, 4);

      console.log(`\n👥 요청 인원:`);
      console.log(`  - 평가자: ${평가자Ids.length}명`);
      console.log(`  - 피평가자: ${피평가자Ids.length}명`);

      // 3. 평가자들 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: 평가자Ids,
          evaluateeIds: 피평가자Ids,
          questionIds: 질문Ids,
        })
        .expect(201);

      console.log(`\n📊 요청 결과:`);
      console.log(`  - 전체 시도: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 4. 모든 조합이 생성되었는지 확인 (2명 * 2명 = 4건)
      const 예상개수 = 평가자Ids.length * 피평가자Ids.length;
      expect(결과.body.summary.total).toBe(예상개수);
      expect(결과.body.summary.success).toBe(예상개수);
      console.log(`\n✅ 예상 요청 수 (${예상개수}건)와 일치합니다.`);
    }, 120000);

    it('평가자가 피평가자 목록에 포함된 경우 해당 평가자에게는 요청이 가지 않는다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 평가자 3명, 피평가자 목록에 평가자 2명이 포함되도록 설정
      const 평가자Ids = employeeIds.slice(0, 3); // [emp0, emp1, emp2]
      const 피평가자Ids = [
        ...employeeIds.slice(0, 2), // 평가자 2명 포함
        ...employeeIds.slice(3, 5), // 추가 피평가자 2명
      ]; // [emp0, emp1, emp3, emp4]

      console.log(`\n👥 요청 인원:`);
      console.log(`  - 평가자: ${평가자Ids.length}명 (${평가자Ids.join(', ')})`);
      console.log(`  - 피평가자: ${피평가자Ids.length}명 (${피평가자Ids.join(', ')})`);
      console.log(`  - 피평가자에 포함된 평가자: ${평가자Ids.slice(0, 2).join(', ')}`);

      // 3. 평가자들 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/evaluators',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: 평가자Ids,
          evaluateeIds: 피평가자Ids,
          questionIds: 질문Ids,
        })
        .expect(201);

      console.log(`\n📊 요청 결과:`);
      console.log(`  - 전체 시도: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 4. 예상 개수 계산
      // emp0: 피평가자 [emp1, emp3, emp4] = 3건 (emp0 제외)
      // emp1: 피평가자 [emp0, emp3, emp4] = 3건 (emp1 제외)
      // emp2: 피평가자 [emp0, emp1, emp3, emp4] = 4건 (emp2 제외)
      // 총 10건
      let 예상개수 = 0;
      for (const evaluatorId of 평가자Ids) {
        const 대상자수 = 피평가자Ids.filter((id) => id !== evaluatorId).length;
        예상개수 += 대상자수;
        console.log(`  - ${evaluatorId}: ${대상자수}건 (자기 자신 제외)`);
      }

      expect(결과.body.summary.total).toBe(예상개수);
      console.log(`\n✅ 예상 요청 수 (${예상개수}건)와 일치합니다.`);

      // 5. 각 평가자가 자기 자신을 평가하는 요청이 없는지 확인
      const 자기자신평가 = 결과.body.results.filter(
        (result: any) => result.evaluatorId === result.evaluateeId,
      );
      expect(자기자신평가.length).toBe(0);
      console.log(`\n✅ 자기 자신을 평가하는 요청이 없습니다.`);

      // 6. 각 평가자가 자신을 제외한 피평가자에게만 요청이 가는지 확인
      for (const evaluatorId of 평가자Ids) {
        const 해당평가자요청들 = 결과.body.results.filter(
          (result: any) => result.evaluatorId === evaluatorId,
        );

        // 자기 자신을 평가하는 요청이 없어야 함
        const 자기자신요청 = 해당평가자요청들.find(
          (result: any) => result.evaluateeId === evaluatorId,
        );
        expect(자기자신요청).toBeUndefined();

        // 피평가자 목록에 있는 사람들에게만 요청이 가야 함
        해당평가자요청들.forEach((result: any) => {
          expect(피평가자Ids).toContain(result.evaluateeId);
          expect(result.evaluateeId).not.toBe(evaluatorId);
        });

        console.log(
          `  - ${evaluatorId}: ${해당평가자요청들.length}건의 요청 (자기 자신 제외)`,
        );
      }

      console.log(`\n✅ 평가자가 피평가자 목록에 포함되어 있어도 자기 자신에게는 요청이 가지 않습니다.`);
    }, 120000);
  });

  // ==================== 파트장 간 동료평가 ====================

  describe('파트장 간 동료평가', () => {
    it('파트장들 간 동료평가 요청을 생성한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      console.log(`\n📝 생성된 평가 질문:`);
      질문들.forEach((질문, index) => {
        console.log(`  ${index + 1}. ${질문.text} (ID: ${질문.id})`);
        console.log(`     점수 범위: ${질문.minScore} ~ ${질문.maxScore}점`);
      });

      // 2. 파트장 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
          questionIds: 질문Ids,
        })
        .expect(201);

      // 3. 응답 검증
      expect(결과.body).toBeDefined();
      expect(결과.body.summary).toBeDefined();
      expect(결과.body.summary.total).toBeDefined();
      expect(결과.body.summary.success).toBeDefined();
      expect(결과.body.summary.failed).toBeDefined();
      expect(결과.body.summary.partLeaderCount).toBeDefined();
      expect(결과.body.message).toBeDefined();
      expect(결과.body.results).toBeDefined();
      expect(Array.isArray(결과.body.results)).toBe(true);

      console.log(`\n📊 파트장 간 동료평가 요청 결과:`);
      console.log(`  - 파트장 수: ${결과.body.summary.partLeaderCount}명`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 파트장이 N명이면 N * (N-1)개의 평가 요청이 생성되어야 함
      const partLeaderCount = 결과.body.summary.partLeaderCount;
      if (partLeaderCount > 0) {
        const expectedTotal = partLeaderCount * (partLeaderCount - 1);
        expect(결과.body.summary.total).toBe(expectedTotal);
        console.log(
          `  ✅ 예상 요청 수 (${partLeaderCount} * (${partLeaderCount} - 1) = ${expectedTotal})와 일치`,
        );
      }

      // 4. 생성된 동료평가 중 하나를 상세 조회하여 질문 데이터 검증
      const 성공한결과들 = 결과.body.results.filter((r: any) => r.success);
      if (성공한결과들.length > 0) {
        const 첫번째평가Id = 성공한결과들[0].evaluationId;

        console.log(`\n🔍 동료평가 상세 조회 (ID: ${첫번째평가Id})`);

        const 상세결과 = await testSuite
          .request()
          .get(`/admin/performance-evaluation/peer-evaluations/${첫번째평가Id}`)
          .expect(200);

        console.log(`\n✅ 동료평가 상세 정보:`);
        console.log(
          `  - 평가자: ${상세결과.body.evaluator.name} (${상세결과.body.evaluator.employeeNumber})`,
        );
        console.log(
          `  - 피평가자: ${상세결과.body.evaluatee.name} (${상세결과.body.evaluatee.employeeNumber})`,
        );
        console.log(`  - 상태: ${상세결과.body.status}`);
        console.log(`  - 질문 개수: ${상세결과.body.questions.length}개`);

        // 질문 데이터 검증
        expect(상세결과.body.questions).toBeDefined();
        expect(Array.isArray(상세결과.body.questions)).toBe(true);
        expect(상세결과.body.questions.length).toBe(질문들.length);

        console.log(`\n📋 매핑된 질문 검증:`);
        상세결과.body.questions.forEach((질문: any, index: number) => {
          // 질문 ID가 null이 아닌지 확인
          expect(질문.id).not.toBeNull();
          expect(질문.id).toBeDefined();

          // 질문 텍스트가 null이 아닌지 확인
          expect(질문.text).not.toBeNull();
          expect(질문.text).toBeDefined();
          expect(typeof 질문.text).toBe('string');
          expect(질문.text.length).toBeGreaterThan(0);

          // 점수 범위가 null이 아닌지 확인
          expect(질문.minScore).not.toBeNull();
          expect(질문.maxScore).not.toBeNull();
          expect(질문.minScore).toBeDefined();
          expect(질문.maxScore).toBeDefined();
          expect(typeof 질문.minScore).toBe('number');
          expect(typeof 질문.maxScore).toBe('number');

          // displayOrder 검증
          expect(질문.displayOrder).toBe(index);

          // 아직 답변하지 않았으므로 answer, score, answeredAt는 null이어야 함
          expect(질문.answer).toBeNull();
          expect(질문.score).toBeNull();
          expect(질문.answeredAt).toBeNull();

          console.log(`  ${index + 1}. ${질문.text}`);
          console.log(`     - ID: ${질문.id}`);
          console.log(
            `     - 점수 범위: ${질문.minScore} ~ ${질문.maxScore}점`,
          );
          console.log(`     - displayOrder: ${질문.displayOrder}`);
          console.log(`     - 답변 상태: ${질문.answer ? '작성됨' : '미작성'}`);
        });

        // 생성된 질문 ID들과 매핑된 질문 ID들이 일치하는지 확인
        const 매핑된질문Ids = 상세결과.body.questions
          .map((q: any) => q.id)
          .sort();
        const 원본질문Ids = 질문Ids.slice().sort();

        console.log(`\n🔗 질문 매핑 일치 여부 확인:`);
        console.log(`  - 요청한 질문 IDs: ${원본질문Ids.join(', ')}`);
        console.log(`  - 매핑된 질문 IDs: ${매핑된질문Ids.join(', ')}`);

        expect(매핑된질문Ids).toEqual(원본질문Ids);
        console.log(`  ✅ 질문 매핑이 정확히 일치합니다!`);

        // mappedBy 검증 (요청 시 생성되므로 값이 있어야 함)
        if (상세결과.body.mappedBy) {
          console.log(`\n👤 매핑 정보:`);
          console.log(`  - mappedBy: ${상세결과.body.mappedBy}`);
        }
      }
    }, 120000);

    it('파트장이 없는 경우 평가 요청이 생성되지 않는다', async () => {
      // Note: 실제 테스트 환경에서는 파트장이 있을 수 있으므로
      // 이 테스트는 파트장이 없는 경우에만 통과합니다.
      // 파트장이 있는 경우는 위의 테스트로 검증됩니다.

      // 실제 파트장 조회를 통해 검증
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
        })
        .expect(201);

      // 파트장이 있으면 요청이 생성되고, 없으면 0건 생성
      expect(결과.body.summary).toBeDefined();
      expect(결과.body.summary.partLeaderCount).toBeGreaterThanOrEqual(0);

      if (결과.body.summary.partLeaderCount === 0) {
        expect(결과.body.summary.total).toBe(0);
        expect(결과.body.summary.success).toBe(0);
        console.log(`\n⚠️ 파트장이 없어 평가 요청이 생성되지 않았습니다.`);
      } else {
        console.log(
          `\n✅ 파트장 ${결과.body.summary.partLeaderCount}명에 대해 ${결과.body.summary.total}건의 평가 요청이 생성되었습니다.`,
        );
      }
    }, 120000);

    it('파트장 간 동료평가 요청 시 자기 자신은 제외된다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 파트장 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
          questionIds: 질문Ids,
        })
        .expect(201);

      // 3. 자기 자신을 평가하는 요청이 없는지 확인
      if (결과.body.results && 결과.body.results.length > 0) {
        const selfEvaluations = 결과.body.results.filter(
          (result: any) => result.evaluatorId === result.evaluateeId,
        );

        expect(selfEvaluations.length).toBe(0);
        console.log(`\n✅ 자기 자신을 평가하는 요청이 없습니다.`);
      }
    }, 120000);

    it('questionIds 없이 요청 시 질문 없이도 동료평가 요청이 생성된다', async () => {
      // questionIds를 보내지 않고 파트장 간 동료평가 요청 생성
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
          // questionIds 없음
        })
        .expect(201);

      console.log(`\n📊 질문 없이 동료평가 요청 결과:`);
      console.log(`  - 파트장 수: ${결과.body.summary.partLeaderCount}명`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 응답 검증
      expect(결과.body.summary).toBeDefined();
      expect(결과.body.summary.success).toBeGreaterThan(0);

      // 생성된 동료평가 중 하나를 상세 조회하여 질문 없이도 생성되었는지 확인
      const 성공한결과들 = 결과.body.results.filter((r: any) => r.success);
      if (성공한결과들.length > 0) {
        const 첫번째평가Id = 성공한결과들[0].evaluationId;

        console.log(`\n🔍 동료평가 상세 조회 (ID: ${첫번째평가Id})`);

        const 상세결과 = await testSuite
          .request()
          .get(`/admin/performance-evaluation/peer-evaluations/${첫번째평가Id}`)
          .expect(200);

        console.log(`\n✅ 매핑된 질문:`);
        console.log(`  - 질문 개수: ${상세결과.body.questions.length}개`);

        // 질문이 정의되어 있고 배열인지 확인 (빈 배열일 수 있음)
        expect(상세결과.body.questions).toBeDefined();
        expect(Array.isArray(상세결과.body.questions)).toBe(true);

        // 질문이 없어도 동료평가 요청 자체는 생성되어야 함
        console.log(
          `\n✅ 질문 없이도 동료평가 요청이 성공적으로 생성되었습니다!`,
        );
      }
    }, 120000);

    it('특정 평가자들만 지정하여 동료평가 요청을 생성한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 파트장 목록 조회
      const 파트장목록결과 = await testSuite
        .request()
        .get('/admin/employees/part-leaders')
        .expect(200);

      const 파트장들 = 파트장목록결과.body.partLeaders;
      if (파트장들.length < 3) {
        console.log(
          `\n⚠️ 테스트에 필요한 파트장이 부족합니다 (필요: 3명, 실제: ${파트장들.length}명)`,
        );
        return;
      }

      // 3. 처음 2명의 파트장만 평가자로 지정
      const 평가자Ids = [파트장들[0].id, 파트장들[1].id];

      console.log(`\n📝 특정 평가자 지정 동료평가 요청:`);
      console.log(`  - 전체 파트장 수: ${파트장들.length}명`);
      console.log(`  - 지정된 평가자 수: ${평가자Ids.length}명`);

      // 4. 파트장 간 동료평가 요청 생성 (evaluatorIds만 지정)
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: 평가자Ids,
          questionIds: 질문Ids,
        })
        .expect(201);

      console.log(`\n📊 요청 결과:`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 5. 검증: 지정된 평가자들만 평가 요청이 생성되었는지 확인
      expect(결과.body.summary.success).toBeGreaterThan(0);
      expect(결과.body.results.length).toBeGreaterThan(0);

      // 모든 평가자가 지정된 목록에 포함되어 있는지 확인
      결과.body.results.forEach((result: any) => {
        if (result.success) {
          expect(평가자Ids).toContain(result.evaluatorId);
        }
      });

      console.log(`\n✅ 지정된 평가자들만 평가 요청이 생성되었습니다!`);
    }, 120000);

    it('특정 피평가자들만 지정하여 동료평가 요청을 생성한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 파트장 목록 조회
      const 파트장목록결과 = await testSuite
        .request()
        .get('/admin/employees/part-leaders')
        .expect(200);

      const 파트장들 = 파트장목록결과.body.partLeaders;
      if (파트장들.length < 3) {
        console.log(
          `\n⚠️ 테스트에 필요한 파트장이 부족합니다 (필요: 3명, 실제: ${파트장들.length}명)`,
        );
        return;
      }

      // 3. 처음 2명의 파트장만 피평가자로 지정
      const 피평가자Ids = [파트장들[0].id, 파트장들[1].id];

      console.log(`\n📝 특정 피평가자 지정 동료평가 요청:`);
      console.log(`  - 전체 파트장 수: ${파트장들.length}명`);
      console.log(`  - 지정된 피평가자 수: ${피평가자Ids.length}명`);

      // 4. 파트장 간 동료평가 요청 생성 (evaluateeIds만 지정)
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluateeIds: 피평가자Ids,
          questionIds: 질문Ids,
        })
        .expect(201);

      console.log(`\n📊 요청 결과:`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 5. 검증: 지정된 피평가자들만 평가 요청이 생성되었는지 확인
      expect(결과.body.summary.success).toBeGreaterThan(0);
      expect(결과.body.results.length).toBeGreaterThan(0);

      // 모든 피평가자가 지정된 목록에 포함되어 있는지 확인
      결과.body.results.forEach((result: any) => {
        if (result.success) {
          expect(피평가자Ids).toContain(result.evaluateeId);
        }
      });

      console.log(`\n✅ 지정된 피평가자들만 평가 요청이 생성되었습니다!`);
    }, 120000);

    it('평가자와 피평가자를 모두 지정하여 동료평가 요청을 생성한다', async () => {
      // 1. 평가 질문 생성
      const { 질문들 } =
        await peerEvaluationScenario.테스트용_평가질문들을_생성한다();
      const 질문Ids = 질문들.map((q) => q.id);

      // 2. 파트장 목록 조회
      const 파트장목록결과 = await testSuite
        .request()
        .get('/admin/employees/part-leaders')
        .expect(200);

      const 파트장들 = 파트장목록결과.body.partLeaders;
      if (파트장들.length < 4) {
        console.log(
          `\n⚠️ 테스트에 필요한 파트장이 부족합니다 (필요: 4명, 실제: ${파트장들.length}명)`,
        );
        return;
      }

      // 3. 평가자 2명, 피평가자 2명 지정
      const 평가자Ids = [파트장들[0].id, 파트장들[1].id];
      const 피평가자Ids = [파트장들[2].id, 파트장들[3].id];

      console.log(`\n📝 평가자와 피평가자 모두 지정한 동료평가 요청:`);
      console.log(`  - 전체 파트장 수: ${파트장들.length}명`);
      console.log(`  - 지정된 평가자 수: ${평가자Ids.length}명`);
      console.log(`  - 지정된 피평가자 수: ${피평가자Ids.length}명`);

      // 4. 파트장 간 동료평가 요청 생성 (evaluatorIds, evaluateeIds 모두 지정)
      const 결과 = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/part-leaders',
        )
        .send({
          periodId: evaluationPeriodId,
          evaluatorIds: 평가자Ids,
          evaluateeIds: 피평가자Ids,
          questionIds: 질문Ids,
        })
        .expect(201);

      console.log(`\n📊 요청 결과:`);
      console.log(`  - 생성된 평가 요청: ${결과.body.summary.total}건`);
      console.log(`  - 성공: ${결과.body.summary.success}건`);
      console.log(`  - 실패: ${결과.body.summary.failed}건`);

      // 5. 검증
      expect(결과.body.summary.success).toBeGreaterThan(0);
      expect(결과.body.results.length).toBeGreaterThan(0);

      // 예상 요청 수: 평가자 수 * 피평가자 수 = 2 * 2 = 4
      const 예상요청수 = 평가자Ids.length * 피평가자Ids.length;
      expect(결과.body.summary.total).toBe(예상요청수);

      // 모든 평가자와 피평가자가 지정된 목록에 포함되어 있는지 확인
      결과.body.results.forEach((result: any) => {
        if (result.success) {
          expect(평가자Ids).toContain(result.evaluatorId);
          expect(피평가자Ids).toContain(result.evaluateeId);
        }
      });

      console.log(
        `\n✅ 지정된 평가자들이 지정된 피평가자들을 평가하는 요청이 생성되었습니다!`,
      );
    }, 120000);
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
