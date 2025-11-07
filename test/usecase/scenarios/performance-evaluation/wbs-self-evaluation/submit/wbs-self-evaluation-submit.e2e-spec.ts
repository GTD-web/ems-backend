import { BaseE2ETest } from '../../../../../base-e2e.spec';
import { WbsSelfEvaluationScenario } from '../wbs-self-evaluation.scenario';
import { SeedDataScenario } from '../../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../../../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../../../wbs-assignment/wbs-assignment.scenario';

describe('WBS 자기평가 제출 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
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
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: 'WBS 자기평가 제출 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'WBS 자기평가 제출 E2E 테스트용 평가기간',
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

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 프로젝트 할당
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      projectId: projectIds[0],
    });

    // WBS 할당
    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
    });
  });

  describe('시나리오 1: 피평가자 → 1차 평가자 제출', () => {
    describe('1-1. 자기평가 작성 및 저장', () => {
      it('자기평가를 작성하고 저장한 후 대시보드 API로 검증한다', async () => {
        // Given - 자기평가 저장
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용입니다.',
            selfEvaluationScore: 85,
            performanceResult: '성과 결과입니다.',
          },
        );

        // Then - 저장 검증
        expect(저장결과.id).toBeDefined();
        expect(저장결과.selfEvaluationContent).toBe('자기평가 내용입니다.');
        expect(저장결과.selfEvaluationScore).toBe(85);
        expect(저장결과.performanceResult).toBe('성과 결과입니다.');

        // 대시보드 API 저장 후 검증
        const 개별직원현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(개별직원현황).toBeDefined();
        expect(개별직원현황.selfEvaluation).toBeDefined();
        expect(개별직원현황.selfEvaluation.status).toBe('in_progress');
        expect(개별직원현황.selfEvaluation.totalMappingCount).toBeGreaterThan(
          0,
        );
        expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 제출 전
        expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(false); // 미제출 상태
        expect(개별직원현황.selfEvaluation.totalScore).toBeNull(); // 모든 자기평가 제출 전
        expect(개별직원현황.selfEvaluation.grade).toBeNull(); // 모든 자기평가 제출 전

        const 할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(할당데이터).toBeDefined();
        expect(할당데이터.projects).toBeDefined();
        expect(할당데이터.projects.length).toBeGreaterThan(0);

        // wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)

        // summary.selfEvaluation 검증
        expect(할당데이터.summary).toBeDefined();
        expect(할당데이터.summary.completedSelfEvaluations).toBe(0); // 제출 전
        expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1); // 저장된 자기평가 수
        expect(
          할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
        ).toBe(0); // 미제출 상태
        expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
          false,
        ); // 미제출 상태
        expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(
          0,
        ); // 미제출 상태
        expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
          false,
        ); // 미제출 상태
        expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull(); // 모든 자기평가 제출 전
        expect(할당데이터.summary.selfEvaluation.grade).toBeNull(); // 모든 자기평가 제출 전

        // 전체 직원 현황 조회
        const 전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 전체직원현황.find(
          (emp: any) => emp.employeeId === employeeIds[0],
        );
        expect(직원정보).toBeDefined();
        expect(직원정보.selfEvaluation.status).toBe('in_progress');
        expect(직원정보.selfEvaluation.completedMappingCount).toBe(0); // 제출 전
        expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      });
    });

    describe('1-2. 피평가자 → 1차 평가자 제출', () => {
      it('자기평가를 1차 평가자에게 제출하고 대시보드 API를 검증한다', async () => {
        // Given - 자기평가 저장
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용입니다.',
            selfEvaluationScore: 85,
            performanceResult: '성과 결과입니다.',
          },
        );

        // When - 피평가자 → 1차 평가자 제출
        const 제출결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
            저장결과.id,
          );

        // Then - 제출 검증
        expect(제출결과.submittedToEvaluator).toBe(true);
        expect(제출결과.submittedToEvaluatorAt).toBeDefined();
        expect(제출결과.submittedToManager).toBe(false); // 아직 관리자 제출 전
        expect(제출결과.submittedToManagerAt).toBeNull();
        expect(제출결과.selfEvaluationContent).toBe('자기평가 내용입니다.'); // 내용 유지
        expect(제출결과.selfEvaluationScore).toBe(85); // 성과당성률 유지
        expect(제출결과.performanceResult).toBe('성과 결과입니다.'); // 성과 결과 유지

        // 대시보드 API 제출 후 검증
        const 개별직원현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 전체 자기평가가 1개이므로 true
        expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 관리자 제출 전이므로 변경 없음
        expect(개별직원현황.selfEvaluation.status).toBe('in_progress'); // 관리자 제출 전
        expect(개별직원현황.selfEvaluation.totalScore).toBeNull(); // 관리자 제출 전
        expect(개별직원현황.selfEvaluation.grade).toBeNull(); // 관리자 제출 전

        const 할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        // wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)

        // summary.selfEvaluation 검증
        expect(
          할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
        ).toBe(1); // 1 증가
        expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
          true,
        ); // 전체 자기평가가 1개이므로 true
        expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(
          0,
        );
        expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
          false,
        );
        expect(할당데이터.summary.completedSelfEvaluations).toBe(0); // 관리자 제출 전이므로 변경 없음
        expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
        expect(할당데이터.summary.selfEvaluation.grade).toBeNull();

        // 전체 직원 현황 조회
        const 전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 전체직원현황.find(
          (emp: any) => emp.employeeId === employeeIds[0],
        );
        expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(true);
        expect(직원정보.selfEvaluation.completedMappingCount).toBe(0);
      });
    });
  });

  describe('시나리오 2: 1차 평가자 제출 취소 (원복)', () => {
    it('1차 평가자 제출을 취소하고 대시보드 API를 검증한다', async () => {
      // Given - 자기평가 저장 및 1차 평가자에게 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // When - 1차 평가자 제출 취소
      const 취소결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자_제출_취소한다(
          저장결과.id,
        );

      // Then - 취소 검증
      expect(취소결과.submittedToEvaluator).toBe(false);
      expect(취소결과.submittedToEvaluatorAt).toBeDefined(); // Reset 시 제출 일시는 유지
      expect(취소결과.submittedToManager).toBe(false);
      expect(취소결과.submittedToManagerAt).toBeNull();
      expect(취소결과.selfEvaluationContent).toBe('자기평가 내용입니다.'); // 내용 유지
      expect(취소결과.selfEvaluationScore).toBe(85); // 성과당성률 유지
      expect(취소결과.performanceResult).toBe('성과 결과입니다.'); // 성과 결과 유지

      // 대시보드 API 취소 후 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 관리자 제출 상태와 무관
      expect(개별직원현황.selfEvaluation.status).toBe('in_progress');
      expect(개별직원현황.selfEvaluation.totalScore).toBeNull();
      expect(개별직원현황.selfEvaluation.grade).toBeNull();

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)

      // summary.selfEvaluation 검증
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        0,
      ); // 감소
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        false,
      );
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(0);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
        false,
      );
      expect(할당데이터.summary.completedSelfEvaluations).toBe(0); // 변경 없음
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
      expect(할당데이터.summary.selfEvaluation.grade).toBeNull();

      // 전체 직원 현황 조회
      const 전체직원현황 =
        await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
          evaluationPeriodId,
        );

      const 직원정보 = 전체직원현황.find(
        (emp: any) => emp.employeeId === employeeIds[0],
      );
      expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(직원정보.selfEvaluation.completedMappingCount).toBe(0);
    });
  });

  describe('시나리오 3: 1차 평가자 → 관리자 제출', () => {
    it('1차 평가자가 관리자에게 제출하고 대시보드 API를 검증한다 (피평가자가 먼저 제출한 경우)', async () => {
      // Given - 자기평가 저장 및 1차 평가자에게 제출
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // When - 1차 평가자 → 관리자 제출
      const 제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );

      // Then - 제출 검증
      expect(제출결과.submittedToManager).toBe(true);
      expect(제출결과.submittedToManagerAt).toBeDefined();
      expect(제출결과.submittedToEvaluator).toBe(true); // 이미 제출된 상태 유지
      expect(제출결과.submittedToEvaluatorAt).toBeDefined(); // 유지
      expect(제출결과.selfEvaluationContent).toBe('자기평가 내용입니다.'); // 내용 유지
      expect(제출결과.selfEvaluationScore).toBe(85); // 성과당성률 유지
      expect(제출결과.performanceResult).toBe('성과 결과입니다.'); // 성과 결과 유지

      // 대시보드 API 제출 후 검증
      const 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(1); // 1 증가
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 유지
      expect(개별직원현황.selfEvaluation.status).toBe('complete'); // 모든 자기평가 제출 완료
      expect(개별직원현황.selfEvaluation.totalScore).toBeDefined(); // 계산됨
      expect(개별직원현황.selfEvaluation.grade).toBeDefined(); // 계산됨

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)

      // summary.selfEvaluation 검증
      expect(할당데이터.summary.completedSelfEvaluations).toBe(1); // 1 증가 (submittedToManagerCount와 동일)
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(1); // 1 증가
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(true); // 전체 자기평가가 1개이므로 true
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        1,
      ); // 유지
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        true,
      ); // 유지
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeDefined(); // 계산됨
      expect(할당데이터.summary.selfEvaluation.grade).toBeDefined(); // 계산됨

      // 전체 직원 현황 조회
      const 전체직원현황 =
        await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
          evaluationPeriodId,
        );

      const 직원정보 = 전체직원현황.find(
        (emp: any) => emp.employeeId === employeeIds[0],
      );
      expect(직원정보.selfEvaluation.completedMappingCount).toBe(1);
      expect(직원정보.selfEvaluation.status).toBe('complete');
      expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(직원정보.selfEvaluation.totalScore).toBeDefined();
      expect(직원정보.selfEvaluation.grade).toBeDefined();
    });

    it('1차 평가자가 관리자에게 제출할 때 평가자에게 제출하지 않았으면 자동으로 제출한 것으로 처리된다', async () => {
      // Given - 자기평가 저장 (1차 평가자에게 제출하지 않음)
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

      // 저장 후 검증 (아직 제출하지 않음)
      let 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(false);

      // When - 1차 평가자가 관리자에게 직접 제출 (피평가자가 먼저 제출하지 않음)
      const 제출결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );

      // Then - 제출 검증
      expect(제출결과.submittedToManager).toBe(true);
      expect(제출결과.submittedToManagerAt).toBeDefined();
      expect(제출결과.submittedToEvaluator).toBe(true); // 자동으로 true로 설정됨
      expect(제출결과.submittedToEvaluatorAt).toBeDefined(); // 자동으로 설정됨
      expect(제출결과.selfEvaluationContent).toBe('자기평가 내용입니다.');
      expect(제출결과.selfEvaluationScore).toBe(85);

      // 대시보드 API 검증
      개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(1);
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true); // 자동으로 true
      expect(개별직원현황.selfEvaluation.status).toBe('complete');
      expect(개별직원현황.selfEvaluation.totalScore).toBeDefined();
      expect(개별직원현황.selfEvaluation.grade).toBeDefined();

      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // summary.selfEvaluation 검증
      expect(할당데이터.summary.completedSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(true);
      expect(할당데이터.summary.selfEvaluation.submittedToEvaluatorCount).toBe(
        1,
      ); // 자동으로 1 증가
      expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
        true,
      ); // 자동으로 true
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeDefined();
      expect(할당데이터.summary.selfEvaluation.grade).toBeDefined();
    });
  });

  describe('시나리오 4: 전체 제출 프로세스 통합 검증', () => {
    it('자기평가 작성부터 관리자 제출까지 전체 프로세스를 검증한다', async () => {
      // 1. 자기평가 작성
      const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과',
      });

      // 저장 후 검증
      let 개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });
      expect(개별직원현황.selfEvaluation.status).toBe('in_progress');
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(false);

      // 2. 피평가자 → 1차 평가자 제출
      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // 1차 평가자 제출 후 검증
      개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0); // 관리자 제출 전

      // 3. 1차 평가자 제출 취소 (원복)
      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자_제출_취소한다(
        저장결과.id,
      );

      // 취소 후 검증
      개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(false);
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(0);

      // 4. 피평가자 → 1차 평가자 재제출
      await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
        저장결과.id,
      );

      // 재제출 후 검증
      개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true);

      // 5. 1차 평가자 → 관리자 제출
      await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
        저장결과.id,
      );

      // 관리자 제출 후 검증
      개별직원현황 =
        await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });
      expect(개별직원현황.selfEvaluation.completedMappingCount).toBe(1);
      expect(개별직원현황.selfEvaluation.status).toBe('complete');
      expect(개별직원현황.selfEvaluation.isSubmittedToEvaluator).toBe(true);
      expect(개별직원현황.selfEvaluation.totalScore).toBeDefined();
      expect(개별직원현황.selfEvaluation.grade).toBeDefined();

      // 할당 데이터 검증
      const 할당데이터 =
        await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(할당데이터.summary.completedSelfEvaluations).toBe(1);
      expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(1);
      expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(true);
      expect(할당데이터.summary.selfEvaluation.totalScore).toBeDefined();
      expect(할당데이터.summary.selfEvaluation.grade).toBeDefined();

      // wbsList 내 selfEvaluation은 제거됨 (summary.selfEvaluation만 사용)
    });
  });
});
