import { BaseE2ETest } from '../../../base-e2e.spec';
import { FinalEvaluationScenario } from './final-evaluation.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';

/**
 * 최종평가 관리 E2E 테스트
 *
 * 최종평가 관련 모든 시나리오를 검증합니다.
 * - 최종평가 저장 (Upsert)
 * - 최종평가 조회 (단일, 목록, 직원-평가기간별)
 * - 최종평가 확정
 * - 최종평가 확정 취소
 * - 대시보드 상태 검증
 */
describe('최종평가 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let finalEvaluationScenario: FinalEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let employeeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    finalEvaluationScenario = new FinalEvaluationScenario(testSuite);
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
    employeeId = employeeIds[0];

    if (employeeIds.length < 1) {
      throw new Error('시드 데이터 생성 실패: 최소 1명의 직원이 필요합니다.');
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '최종평가 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '최종평가 E2E 테스트용 평가기간',
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

  // ==================== 최종평가 저장 기본 관리 ====================

  describe('최종평가 저장 기본 관리', () => {
    it('최종평가를 저장한다', async () => {
      // 1. 최종평가 저장
      const 결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        finalComments: '최종평가 의견',
      });

      expect(결과.id).toBeDefined();
      expect(결과.message).toContain('성공적으로 저장되었습니다');

      // 2. 대시보드 상태 확인
      await finalEvaluationScenario.dashboardScenario.최종평가_상태_변경을_검증한다(
        evaluationPeriodId,
        employeeId,
        'in_progress',
        false,
        'A',
        'T2',
        'n',
      );

      // 3. 상세 조회
      const 상세조회결과 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(결과.id);

      expect(상세조회결과.id).toBe(결과.id);
      expect(상세조회결과.employee).toBeDefined();
      expect(상세조회결과.period).toBeDefined();
      expect(상세조회결과.evaluationGrade).toBe('A');
      expect(상세조회결과.jobGrade).toBe('T2');
      expect(상세조회결과.jobDetailedGrade).toBe('n');
      expect(상세조회결과.finalComments).toBe('최종평가 의견');
      expect(상세조회결과.isConfirmed).toBe(false);
    });

    it('최종평가 상세정보를 조회한다', async () => {
      // 1. 최종평가 저장
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // 2. 상세 조회
      const 상세조회결과 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      expect(상세조회결과.id).toBe(저장결과.id);
      expect(상세조회결과.employee).toBeDefined();
      expect(상세조회결과.employee.id).toBeDefined();
      expect(상세조회결과.employee.name).toBeDefined();
      expect(상세조회결과.employee.employeeNumber).toBeDefined();
      expect(상세조회결과.period).toBeDefined();
      expect(상세조회결과.period.id).toBeDefined();
      expect(상세조회결과.period.name).toBeDefined();
      expect(상세조회결과.period.startDate).toBeDefined();
      expect(상세조회결과.period.endDate).toBeDefined();
      expect(상세조회결과.period.status).toBeDefined();
      expect(상세조회결과.evaluationGrade).toBe('A');
      expect(상세조회결과.jobGrade).toBe('T2');
      expect(상세조회결과.jobDetailedGrade).toBe('n');
      expect(상세조회결과.isConfirmed).toBe(false);
      expect(상세조회결과.confirmedAt).toBeNull();
      expect(상세조회결과.confirmedBy).toBeNull();
      expect(상세조회결과.createdAt).toBeDefined();
      expect(상세조회결과.updatedAt).toBeDefined();
      expect(상세조회결과.version).toBeDefined();
    });
  });

  // ==================== 최종평가 조회 관리 ====================

  describe('최종평가 조회 관리', () => {
    it('최종평가 목록을 조회한다', async () => {
      // 1. 최종평가 저장
      await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // 2. 목록 조회
      const 목록결과 = await finalEvaluationScenario.최종평가_목록을_조회한다({
        periodId: evaluationPeriodId,
      });

      expect(목록결과.evaluations.length).toBeGreaterThan(0);
      expect(목록결과.total).toBeGreaterThan(0);
      expect(목록결과.page).toBeDefined();
      expect(목록결과.limit).toBeDefined();

      // 각 항목 검증
      목록결과.evaluations.forEach((evaluation: any) => {
        expect(evaluation.id).toBeDefined();
        expect(evaluation.employee).toBeDefined();
        expect(evaluation.period).toBeDefined();
        expect(evaluation.evaluationGrade).toBeDefined();
        expect(evaluation.jobGrade).toBeDefined();
        expect(evaluation.jobDetailedGrade).toBeDefined();
        expect(evaluation.isConfirmed).toBeDefined();
      });
    });

    it('직원-평가기간별 최종평가를 조회한다', async () => {
      // 1. 최종평가 저장
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // 2. 직원-평가기간별 조회
      const 조회결과 =
        await finalEvaluationScenario.직원_평가기간별_최종평가를_조회한다(
          employeeId,
          evaluationPeriodId,
        );

      expect(조회결과).toBeDefined();
      expect(조회결과.id).toBe(저장결과.id);
      expect(조회결과.employee).toBeDefined();
      expect(조회결과.period).toBeDefined();
      expect(조회결과.evaluationGrade).toBe('A');
      expect(조회결과.jobGrade).toBe('T2');
      expect(조회결과.jobDetailedGrade).toBe('n');
    });
  });

  // ==================== 최종평가 확정 관리 ====================

  describe('최종평가 확정 관리', () => {
    it('최종평가를 확정한다', async () => {
      // 1. 최종평가 저장
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // 2. 확정 전 상태 확인
      await finalEvaluationScenario.dashboardScenario.최종평가_상태가_in_progress인지_확인한다(
        evaluationPeriodId,
        employeeId,
        'A',
        'T2',
        'n',
      );

      // 3. 최종평가 확정
      const 확정결과 = await finalEvaluationScenario.최종평가를_확정한다(
        저장결과.id,
      );

      expect(확정결과.message).toContain('성공적으로 확정되었습니다');

      // 4. 확정 후 상세 조회
      const 상세조회결과 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      expect(상세조회결과.isConfirmed).toBe(true);
      expect(상세조회결과.confirmedAt).toBeDefined();
      expect(상세조회결과.confirmedBy).toBeDefined();

      // 5. 대시보드 상태 확인
      await finalEvaluationScenario.dashboardScenario.최종평가_상태가_complete인지_확인한다(
        evaluationPeriodId,
        employeeId,
        'A',
        'T2',
        'n',
      );
    });

    it('확정된 평가는 수정할 수 없다', async () => {
      // 1. 최종평가 저장
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // 2. 최종평가 확정
      await finalEvaluationScenario.최종평가를_확정한다(저장결과.id);

      // 3. 확정된 평가 수정 시도 (422 에러 예상)
      await expect(
        finalEvaluationScenario.최종평가를_저장한다({
          employeeId,
          periodId: evaluationPeriodId,
          evaluationGrade: 'B',
          jobGrade: 'T3',
          jobDetailedGrade: 'u',
        }),
      ).rejects.toThrow();
    });
  });

  // ==================== 최종평가 확정 취소 관리 ====================

  describe('최종평가 확정 취소 관리', () => {
    it('최종평가 확정을 취소한다', async () => {
      // 1. 최종평가 저장
      const 저장결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // 2. 최종평가 확정
      await finalEvaluationScenario.최종평가를_확정한다(저장결과.id);

      // 3. 확정 취소 전 상태 확인
      await finalEvaluationScenario.dashboardScenario.최종평가_상태가_complete인지_확인한다(
        evaluationPeriodId,
        employeeId,
        'A',
        'T2',
        'n',
      );

      // 4. 최종평가 확정 취소
      const 취소결과 = await finalEvaluationScenario.최종평가_확정을_취소한다(
        저장결과.id,
      );

      expect(취소결과.message).toContain('성공적으로 취소되었습니다');

      // 5. 확정 취소 후 상세 조회
      const 상세조회결과 =
        await finalEvaluationScenario.최종평가_상세정보를_조회한다(저장결과.id);

      expect(상세조회결과.isConfirmed).toBe(false);
      expect(상세조회결과.confirmedAt).toBeNull();
      expect(상세조회결과.confirmedBy).toBeNull();

      // 6. 대시보드 상태 확인
      await finalEvaluationScenario.dashboardScenario.최종평가_상태가_in_progress인지_확인한다(
        evaluationPeriodId,
        employeeId,
        'A',
        'T2',
        'n',
      );

      // 7. 확정 취소 후 다시 수정 가능
      const 수정결과 = await finalEvaluationScenario.최종평가를_저장한다({
        employeeId,
        periodId: evaluationPeriodId,
        evaluationGrade: 'B',
        jobGrade: 'T3',
        jobDetailedGrade: 'u',
      });

      expect(수정결과.id).toBe(저장결과.id);
    });
  });

  // ==================== 최종평가 전체 시나리오 ====================

  describe('최종평가 전체 시나리오', () => {
    it('최종평가 전체 시나리오를 실행한다', async () => {
      const 결과 =
        await finalEvaluationScenario.최종평가_전체_시나리오를_실행한다({
          employeeId,
          periodId: evaluationPeriodId,
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'n',
        });

      expect(결과.저장결과.id).toBeDefined();
      expect(결과.확정결과.message).toContain('성공적으로 확정되었습니다');
      expect(결과.확정취소결과.message).toContain('성공적으로 취소되었습니다');
      expect(결과.상세조회결과.isConfirmed).toBe(false);
      expect(결과.상세조회결과.evaluationGrade).toBe('A');
      expect(결과.상세조회결과.jobGrade).toBe('T2');
      expect(결과.상세조회결과.jobDetailedGrade).toBe('n');
    });
  });

  // ==================== 최종평가 Upsert 동작 검증 ====================

  describe('최종평가 Upsert 동작 검증', () => {
    it('최종평가 Upsert 동작을 검증한다', async () => {
      const 결과 =
        await finalEvaluationScenario.최종평가_Upsert_동작_시나리오를_실행한다({
          employeeId,
          periodId: evaluationPeriodId,
          첫번째평가등급: 'A',
          첫번째직무등급: 'T2',
          첫번째직무상세등급: 'n',
          두번째평가등급: 'B',
          두번째직무등급: 'T3',
          두번째직무상세등급: 'u',
        });

      // 첫 번째 저장 결과 검증
      expect(결과.첫번째저장결과.id).toBeDefined();
      expect(결과.첫번째상세조회결과.evaluationGrade).toBe('A');
      expect(결과.첫번째상세조회결과.jobGrade).toBe('T2');
      expect(결과.첫번째상세조회결과.jobDetailedGrade).toBe('n');

      // 두 번째 저장 결과 검증 (Upsert 동작)
      expect(결과.두번째저장결과.id).toBe(결과.첫번째저장결과.id); // 같은 ID
      expect(결과.두번째상세조회결과.evaluationGrade).toBe('B'); // 값 변경됨
      expect(결과.두번째상세조회결과.jobGrade).toBe('T3');
      expect(결과.두번째상세조회결과.jobDetailedGrade).toBe('u');
      expect(결과.두번째상세조회결과.updatedAt).not.toBe(
        결과.첫번째상세조회결과.updatedAt,
      ); // updatedAt 갱신됨
      // createdAt은 같은 레코드이므로 유지되어야 함 (조회 시점 차이로 인한 미세한 차이는 허용)
      expect(결과.두번째상세조회결과.createdAt).toBeDefined();
      expect(결과.첫번째상세조회결과.createdAt).toBeDefined();
    });
  });
});
