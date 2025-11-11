import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DownwardEvaluationScenario } from './downward-evaluation.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../../wbs-assignment/wbs-assignment.scenario';

describe('하향평가 시나리오', () => {
  let testSuite: BaseE2ETest;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let evaluateeId: string;
  let selfEvaluationId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
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

    // 평가자 및 피평가자 설정
    evaluateeId = employeeIds[0];
    primaryEvaluatorId = employeeIds[1];
    secondaryEvaluatorId = employeeIds[2];

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '하향평가 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '하향평가 E2E 테스트용 평가기간',
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
      employeeId: evaluateeId,
      projectId: projectIds[0],
    });

    // WBS 할당 (평가라인 매핑 자동 생성)
    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: evaluateeId,
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
    });

    // 평가라인 매핑 명시적 생성 (1차 평가자)
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
      )
      .send({
        evaluatorId: primaryEvaluatorId,
      })
      .expect(201);

    // 평가라인 매핑 명시적 생성 (2차 평가자)
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}/secondary-evaluator`,
      )
      .send({
        evaluatorId: secondaryEvaluatorId,
      })
      .expect(201);

    // 선행 조건: 자기평가 작성 및 제출
    const 자기평가결과 =
      await downwardEvaluationScenario.하향평가를_위한_자기평가_완료({
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });

    selfEvaluationId = 자기평가결과.selfEvaluationId;
  });

  describe('시나리오 1: 1차 하향평가 저장 및 제출', () => {
    describe('1-1. 1차 하향평가 작성 및 저장', () => {
      it('1차 하향평가를 작성하고 저장한 후 대시보드 API로 검증한다', async () => {
        // Given - 1차 하향평가 저장
        const 저장결과 =
          await downwardEvaluationScenario.일차하향평가를_저장한다({
            evaluateeId,
            periodId: evaluationPeriodId,
            wbsId: wbsItemIds[0],
            evaluatorId: primaryEvaluatorId,
            selfEvaluationId,
            downwardEvaluationContent: '1차 하향평가 내용입니다.',
            downwardEvaluationScore: 85,
          });

        // Then - 저장 검증
        expect(저장결과.id).toBeDefined();
        expect(저장결과.evaluatorId).toBe(primaryEvaluatorId);
        expect(저장결과.message).toBeDefined();

        // 대시보드 API 저장 후 검증
        const 개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(개별직원현황).toBeDefined();
        expect(개별직원현황.downwardEvaluation).toBeDefined();
        expect(개별직원현황.downwardEvaluation.primary).toBeDefined();
        expect(개별직원현황.downwardEvaluation.primary.status).toBe(
          'in_progress',
        );
        expect(
          개별직원현황.downwardEvaluation.primary.assignedWbsCount,
        ).toBeGreaterThan(0);
        expect(
          개별직원현황.downwardEvaluation.primary.completedEvaluationCount,
        ).toBe(0); // 제출 전이므로 변경 없음
        expect(개별직원현황.downwardEvaluation.primary.isSubmitted).toBe(false); // 미제출 상태
        expect(개별직원현황.downwardEvaluation.primary.totalScore).toBeNull(); // 모든 하향평가 제출 전
        expect(개별직원현황.downwardEvaluation.primary.grade).toBeNull(); // 모든 하향평가 제출 전

        const 할당데이터 =
          await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(할당데이터).toBeDefined();
        expect(할당데이터.projects).toBeDefined();
        expect(할당데이터.projects.length).toBeGreaterThan(0);

        // wbsList 내 primaryDownwardEvaluation 검증
        const wbsItem = 할당데이터.projects[0]?.wbsList?.[0];
        expect(wbsItem).toBeDefined();
        expect(wbsItem.primaryDownwardEvaluation).toBeDefined();
        expect(wbsItem.primaryDownwardEvaluation.downwardEvaluationId).toBe(
          저장결과.id,
        );
        expect(wbsItem.primaryDownwardEvaluation.evaluationContent).toBe(
          '1차 하향평가 내용입니다.',
        );
        expect(wbsItem.primaryDownwardEvaluation.score).toBe(85);
        expect(wbsItem.primaryDownwardEvaluation.isCompleted).toBe(false); // 미제출 상태

        // summary.primaryDownwardEvaluation 검증
        expect(할당데이터.summary).toBeDefined();
        expect(할당데이터.summary.primaryDownwardEvaluation).toBeDefined();
        expect(
          할당데이터.summary.primaryDownwardEvaluation.totalScore,
        ).toBeNull(); // 모든 하향평가 제출 전
        expect(할당데이터.summary.primaryDownwardEvaluation.grade).toBeNull(); // 모든 하향평가 제출 전

        // 평가자 관점 할당 데이터 조회
        const 평가자관점할당데이터 =
          await downwardEvaluationScenario.평가자_관점_피평가자_할당_데이터를_조회한다(
            {
              periodId: evaluationPeriodId,
              evaluatorId: primaryEvaluatorId,
              employeeId: evaluateeId,
            },
          );

        expect(평가자관점할당데이터).toBeDefined();
        expect(평가자관점할당데이터.evaluatee).toBeDefined();
        expect(평가자관점할당데이터.evaluatee.projects).toBeDefined();

        // 전체 직원 현황 조회
        const 전체직원현황 =
          await downwardEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 전체직원현황.find(
          (emp: any) => emp.employeeId === evaluateeId,
        );
        expect(직원정보).toBeDefined();
        expect(직원정보.downwardEvaluation.primary.status).toBe('in_progress');
        expect(
          직원정보.downwardEvaluation.primary.completedEvaluationCount,
        ).toBe(0); // 제출 전
        expect(직원정보.downwardEvaluation.primary.isSubmitted).toBe(false);
      });
    });

    describe('1-2. 1차 하향평가 제출', () => {
      it('1차 하향평가를 제출하고 대시보드 API를 검증한다', async () => {
        // Given - 1차 하향평가 저장
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId,
          downwardEvaluationContent: '1차 하향평가 내용입니다.',
          downwardEvaluationScore: 85,
        });

        // 제출 전 상태 확인
        const 제출전개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        const 제출전할당데이터 =
          await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        const 제출전완료수 =
          제출전개별직원현황.downwardEvaluation.primary
            .completedEvaluationCount;
        const 제출전할당수 =
          제출전개별직원현황.downwardEvaluation.primary.assignedWbsCount;

        expect(제출전개별직원현황.downwardEvaluation.primary.isSubmitted).toBe(
          false,
        );
        expect(제출전완료수).toBe(0);

        const 제출전wbsItem = 제출전할당데이터.projects[0]?.wbsList?.[0];
        expect(제출전wbsItem.primaryDownwardEvaluation.isCompleted).toBe(false);

        // When - 1차 하향평가 제출
        await downwardEvaluationScenario.일차하향평가를_제출한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
        });

        // Then - 대시보드 API 제출 후 검증
        const 개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // 제출 전후 비교 검증
        expect(개별직원현황.downwardEvaluation.primary.isSubmitted).toBe(true); // false → true
        expect(
          개별직원현황.downwardEvaluation.primary.completedEvaluationCount,
        ).toBe(제출전완료수 + 1); // 1 증가
        // 모든 하향평가 제출 완료 시: 'complete' (승인 상태에 따라 'pending', 'approved' 등으로 변경 가능)
        // 일부만 제출된 경우: 'in_progress'
        expect(['in_progress', 'complete', 'pending', 'approved']).toContain(
          개별직원현황.downwardEvaluation.primary.status,
        );

        // 모든 하향평가 제출 완료 시 점수/등급 계산, 일부만 제출된 경우 null
        if (
          개별직원현황.downwardEvaluation.primary.completedEvaluationCount ===
          개별직원현황.downwardEvaluation.primary.assignedWbsCount
        ) {
          expect(
            개별직원현황.downwardEvaluation.primary.totalScore,
          ).not.toBeNull();
          expect(개별직원현황.downwardEvaluation.primary.grade).not.toBeNull();
        } else {
          expect(개별직원현황.downwardEvaluation.primary.totalScore).toBeNull();
          expect(개별직원현황.downwardEvaluation.primary.grade).toBeNull();
        }

        const 할당데이터 =
          await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // wbsList 내 primaryDownwardEvaluation 검증 (제출 전후 비교)
        const wbsItem = 할당데이터.projects[0]?.wbsList?.[0];
        expect(제출전wbsItem.primaryDownwardEvaluation.isCompleted).toBe(false); // 제출 전
        expect(wbsItem.primaryDownwardEvaluation.isCompleted).toBe(true); // 제출 후: false → true

        // summary.primaryDownwardEvaluation 검증
        // 모든 하향평가 제출 완료 시 점수/등급 계산, 일부만 제출된 경우 null
        const 모든하향평가제출완료 =
          개별직원현황.downwardEvaluation.primary.completedEvaluationCount ===
            개별직원현황.downwardEvaluation.primary.assignedWbsCount &&
          개별직원현황.downwardEvaluation.primary.assignedWbsCount > 0;

        if (모든하향평가제출완료) {
          expect(
            할당데이터.summary.primaryDownwardEvaluation.totalScore,
          ).not.toBeNull();
          expect(
            할당데이터.summary.primaryDownwardEvaluation.grade,
          ).not.toBeNull();
        } else {
          expect(
            할당데이터.summary.primaryDownwardEvaluation.totalScore,
          ).toBeNull();
          expect(할당데이터.summary.primaryDownwardEvaluation.grade).toBeNull();
        }

        // 전체 직원 현황 조회
        const 전체직원현황 =
          await downwardEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 전체직원현황.find(
          (emp: any) => emp.employeeId === evaluateeId,
        );
        expect(직원정보.downwardEvaluation.primary.isSubmitted).toBe(true);
        expect(
          직원정보.downwardEvaluation.primary.completedEvaluationCount,
        ).toBe(1);
      });
    });
  });

  describe('시나리오 2: 1차 하향평가 초기화 (원복)', () => {
    it('1차 하향평가를 초기화하고 대시보드 API를 검증한다', async () => {
      // Given - 1차 하향평가 저장 및 제출
      await downwardEvaluationScenario.일차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
        selfEvaluationId,
        downwardEvaluationContent: '1차 하향평가 내용입니다.',
        downwardEvaluationScore: 85,
      });

      await downwardEvaluationScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
      });

      // 초기화 전 상태 확인
      const 초기화전개별직원현황 =
        await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      const 초기화전할당데이터 =
        await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      const 초기화전완료수 =
        초기화전개별직원현황.downwardEvaluation.primary
          .completedEvaluationCount;

      expect(초기화전개별직원현황.downwardEvaluation.primary.isSubmitted).toBe(
        true,
      );
      expect(초기화전완료수).toBeGreaterThan(0);

      const 초기화전wbsItem = 초기화전할당데이터.projects[0]?.wbsList?.[0];
      expect(초기화전wbsItem.primaryDownwardEvaluation.isCompleted).toBe(true);

      // When - 1차 하향평가 초기화
      await downwardEvaluationScenario.일차하향평가를_초기화한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
      });

      // Then - 대시보드 API 초기화 후 검증
      const 개별직원현황 =
        await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      // 초기화 전후 비교 검증
      expect(초기화전개별직원현황.downwardEvaluation.primary.isSubmitted).toBe(
        true,
      ); // 초기화 전
      expect(개별직원현황.downwardEvaluation.primary.isSubmitted).toBe(false); // 초기화 후: true → false
      expect(
        개별직원현황.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(초기화전완료수 - 1); // 1 감소
      expect(개별직원현황.downwardEvaluation.primary.status).toBe(
        'in_progress',
      );
      expect(개별직원현황.downwardEvaluation.primary.totalScore).toBeNull(); // 모든 하향평가 완료되지 않으면
      expect(개별직원현황.downwardEvaluation.primary.grade).toBeNull(); // 모든 하향평가 완료되지 않으면

      const 할당데이터 =
        await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      // wbsList 내 primaryDownwardEvaluation 검증
      const wbsItem = 할당데이터.projects[0]?.wbsList?.[0];
      expect(wbsItem.primaryDownwardEvaluation.isCompleted).toBe(false);

      // summary.primaryDownwardEvaluation 검증
      expect(
        할당데이터.summary.primaryDownwardEvaluation.totalScore,
      ).toBeNull();
      expect(할당데이터.summary.primaryDownwardEvaluation.grade).toBeNull();

      // 전체 직원 현황 조회
      const 전체직원현황 =
        await downwardEvaluationScenario.전체_직원_현황을_조회한다(
          evaluationPeriodId,
        );

      const 직원정보 = 전체직원현황.find(
        (emp: any) => emp.employeeId === evaluateeId,
      );
      expect(직원정보.downwardEvaluation.primary.isSubmitted).toBe(false);
      expect(직원정보.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      expect(직원정보.downwardEvaluation.primary.status).toBe('in_progress');
    });
  });

  describe('시나리오 3: 2차 하향평가 저장 및 제출', () => {
    describe('3-1. 2차 하향평가 작성 및 저장', () => {
      it('2차 하향평가를 작성하고 저장한 후 대시보드 API로 검증한다', async () => {
        // Given - 2차 하향평가 저장
        const 저장결과 =
          await downwardEvaluationScenario.이차하향평가를_저장한다({
            evaluateeId,
            periodId: evaluationPeriodId,
            wbsId: wbsItemIds[0],
            evaluatorId: secondaryEvaluatorId,
            selfEvaluationId,
            downwardEvaluationContent: '2차 하향평가 내용입니다.',
            downwardEvaluationScore: 90,
          });

        // Then - 저장 검증
        expect(저장결과.id).toBeDefined();
        expect(저장결과.evaluatorId).toBe(secondaryEvaluatorId);
        expect(저장결과.message).toBeDefined();

        // 대시보드 API 저장 후 검증
        const 개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(개별직원현황.downwardEvaluation.secondary).toBeDefined();
        expect(개별직원현황.downwardEvaluation.secondary.status).toBe(
          'in_progress',
        );
        expect(
          개별직원현황.downwardEvaluation.secondary.evaluators,
        ).toBeDefined();
        expect(
          Array.isArray(개별직원현황.downwardEvaluation.secondary.evaluators),
        ).toBe(true);
        expect(개별직원현황.downwardEvaluation.secondary.isSubmitted).toBe(
          false,
        ); // 모든 평가자 제출 전
        expect(개별직원현황.downwardEvaluation.secondary.totalScore).toBeNull(); // 모든 하향평가 제출 전
        expect(개별직원현황.downwardEvaluation.secondary.grade).toBeNull(); // 모든 하향평가 제출 전

        const 할당데이터 =
          await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // wbsList 내 secondaryDownwardEvaluation 검증
        const wbsItem = 할당데이터.projects[0]?.wbsList?.[0];
        expect(wbsItem.secondaryDownwardEvaluation).toBeDefined();
        expect(wbsItem.secondaryDownwardEvaluation.downwardEvaluationId).toBe(
          저장결과.id,
        );
        expect(wbsItem.secondaryDownwardEvaluation.evaluationContent).toBe(
          '2차 하향평가 내용입니다.',
        );
        expect(wbsItem.secondaryDownwardEvaluation.score).toBe(90);
        expect(wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(false); // 미제출 상태

        // summary.secondaryDownwardEvaluation 검증
        expect(할당데이터.summary.secondaryDownwardEvaluation).toBeDefined();
        expect(
          할당데이터.summary.secondaryDownwardEvaluation.totalScore,
        ).toBeNull(); // 모든 하향평가 제출 전
        expect(할당데이터.summary.secondaryDownwardEvaluation.grade).toBeNull(); // 모든 하향평가 제출 전
      });
    });

    describe('3-2. 2차 하향평가 제출', () => {
      it('2차 하향평가를 제출하고 대시보드 API를 검증한다', async () => {
        // Given - 2차 하향평가 저장
        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId,
          downwardEvaluationContent: '2차 하향평가 내용입니다.',
          downwardEvaluationScore: 90,
        });

        // 제출 전 상태 확인
        const 제출전개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        const 제출전할당데이터 =
          await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        const 제출전평가자정보 =
          제출전개별직원현황.downwardEvaluation.secondary.evaluators?.find(
            (e: any) => e.evaluatorId === secondaryEvaluatorId,
          );

        expect(
          제출전개별직원현황.downwardEvaluation.secondary.isSubmitted,
        ).toBe(false);
        if (제출전평가자정보) {
          expect(제출전평가자정보.isSubmitted).toBe(false);
          expect(제출전평가자정보.completedEvaluationCount).toBe(0);
        }

        const 제출전wbsItem = 제출전할당데이터.projects[0]?.wbsList?.[0];
        expect(제출전wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(
          false,
        );

        // When - 2차 하향평가 제출
        await downwardEvaluationScenario.이차하향평가를_제출한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
        });

        // Then - 대시보드 API 제출 후 검증
        const 개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // 해당 평가자의 isSubmitted 확인 (제출 전후 비교)
        const 평가자정보 =
          개별직원현황.downwardEvaluation.secondary.evaluators?.find(
            (e: any) => e.evaluatorId === secondaryEvaluatorId,
          );
        if (평가자정보 && 제출전평가자정보) {
          expect(제출전평가자정보.isSubmitted).toBe(false); // 제출 전
          expect(평가자정보.isSubmitted).toBe(true); // 제출 후: false → true
          expect(제출전평가자정보.completedEvaluationCount).toBe(0); // 제출 전
          expect(평가자정보.completedEvaluationCount).toBeGreaterThan(0); // 제출 후: 증가
        }

        // 모든 평가자가 모든 하향평가 제출 완료 시: true, 일부만 제출된 경우: false
        // 모든 평가자가 모든 하향평가 제출 완료 시: 'complete', 일부만 제출된 경우: 'in_progress'
        expect(['in_progress', 'complete', 'pending', 'approved']).toContain(
          개별직원현황.downwardEvaluation.secondary.status,
        );

        // 모든 평가자가 모든 하향평가 제출 완료 시 점수/등급 계산, 일부만 제출된 경우 null
        if (개별직원현황.downwardEvaluation.secondary.isSubmitted) {
          expect(
            개별직원현황.downwardEvaluation.secondary.totalScore,
          ).not.toBeNull();
          expect(
            개별직원현황.downwardEvaluation.secondary.grade,
          ).not.toBeNull();
        } else {
          expect(
            개별직원현황.downwardEvaluation.secondary.totalScore,
          ).toBeNull();
          expect(개별직원현황.downwardEvaluation.secondary.grade).toBeNull();
        }

        const 할당데이터 =
          await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // wbsList 내 secondaryDownwardEvaluation 검증 (제출 전후 비교)
        const wbsItem = 할당데이터.projects[0]?.wbsList?.[0];
        expect(제출전wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(
          false,
        ); // 제출 전
        expect(wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(true); // 제출 후: false → true

        // summary.secondaryDownwardEvaluation 검증
        if (개별직원현황.downwardEvaluation.secondary.isSubmitted) {
          expect(
            할당데이터.summary.secondaryDownwardEvaluation.totalScore,
          ).not.toBeNull();
          expect(
            할당데이터.summary.secondaryDownwardEvaluation.grade,
          ).not.toBeNull();
        } else {
          expect(
            할당데이터.summary.secondaryDownwardEvaluation.totalScore,
          ).toBeNull();
          expect(
            할당데이터.summary.secondaryDownwardEvaluation.grade,
          ).toBeNull();
        }
      });
    });
  });

  describe('시나리오 4: 2차 하향평가 초기화 (원복)', () => {
    it('2차 하향평가를 초기화하고 대시보드 API를 검증한다', async () => {
      // Given - 2차 하향평가 저장 및 제출
      await downwardEvaluationScenario.이차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: secondaryEvaluatorId,
        selfEvaluationId,
        downwardEvaluationContent: '2차 하향평가 내용입니다.',
        downwardEvaluationScore: 90,
      });

      await downwardEvaluationScenario.이차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: secondaryEvaluatorId,
      });

      // 초기화 전 상태 확인
      const 초기화전개별직원현황 =
        await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      const 초기화전할당데이터 =
        await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      const 초기화전평가자정보 =
        초기화전개별직원현황.downwardEvaluation.secondary.evaluators?.find(
          (e: any) => e.evaluatorId === secondaryEvaluatorId,
        );

      if (초기화전평가자정보) {
        expect(초기화전평가자정보.isSubmitted).toBe(true);
        expect(초기화전평가자정보.completedEvaluationCount).toBeGreaterThan(0);
      }

      const 초기화전wbsItem = 초기화전할당데이터.projects[0]?.wbsList?.[0];
      expect(초기화전wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(
        true,
      );

      // When - 2차 하향평가 초기화
      await downwardEvaluationScenario.이차하향평가를_초기화한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: secondaryEvaluatorId,
      });

      // Then - 대시보드 API 초기화 후 검증
      const 개별직원현황 =
        await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      // 해당 평가자의 isSubmitted 확인 (초기화 전후 비교)
      const 평가자정보 =
        개별직원현황.downwardEvaluation.secondary.evaluators?.find(
          (e: any) => e.evaluatorId === secondaryEvaluatorId,
        );
      if (평가자정보 && 초기화전평가자정보) {
        expect(초기화전평가자정보.isSubmitted).toBe(true); // 초기화 전
        expect(평가자정보.isSubmitted).toBe(false); // 초기화 후: true → false
        expect(초기화전평가자정보.completedEvaluationCount).toBeGreaterThan(0); // 초기화 전
        expect(평가자정보.completedEvaluationCount).toBe(0); // 초기화 후: 감소
      }

      expect(
        초기화전개별직원현황.downwardEvaluation.secondary.isSubmitted,
      ).toBe(true); // 초기화 전 (모든 평가자 제출 완료 시)
      expect(개별직원현황.downwardEvaluation.secondary.isSubmitted).toBe(false); // 초기화 후: true → false
      expect(개별직원현황.downwardEvaluation.secondary.status).toBe(
        'in_progress',
      );
      expect(개별직원현황.downwardEvaluation.secondary.totalScore).toBeNull(); // 모든 하향평가 완료되지 않으면
      expect(개별직원현황.downwardEvaluation.secondary.grade).toBeNull(); // 모든 하향평가 완료되지 않으면

      const 할당데이터 =
        await downwardEvaluationScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

      // wbsList 내 secondaryDownwardEvaluation 검증 (초기화 전후 비교)
      const wbsItem = 할당데이터.projects[0]?.wbsList?.[0];
      expect(초기화전wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(
        true,
      ); // 초기화 전
      expect(wbsItem.secondaryDownwardEvaluation.isCompleted).toBe(false); // 초기화 후: true → false

      // summary.secondaryDownwardEvaluation 검증
      expect(
        할당데이터.summary.secondaryDownwardEvaluation.totalScore,
      ).toBeNull();
      expect(할당데이터.summary.secondaryDownwardEvaluation.grade).toBeNull();
    });
  });

  describe('시나리오 5: 하향평가 일괄 제출 및 초기화', () => {
    describe('5-1. 피평가자의 모든 하향평가 일괄 제출', () => {
      it('피평가자의 모든 하향평가를 일괄 제출하고 대시보드 API를 검증한다', async () => {
        // Given - 여러 하향평가 저장
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId,
          downwardEvaluationContent: '1차 하향평가 내용입니다.',
          downwardEvaluationScore: 85,
        });

        // When - 일괄 제출
        const 일괄제출결과 =
          await downwardEvaluationScenario.피평가자의_모든_하향평가를_일괄_제출한다(
            {
              evaluateeId,
              periodId: evaluationPeriodId,
              evaluatorId: primaryEvaluatorId,
              evaluationType: 'primary',
            },
          );

        // Then - 제출 검증
        expect(일괄제출결과.submittedCount).toBeGreaterThanOrEqual(0);
        expect(일괄제출결과.skippedCount).toBeGreaterThanOrEqual(0);
        expect(일괄제출결과.failedCount).toBeGreaterThanOrEqual(0);
        expect(일괄제출결과.submittedIds).toBeDefined();
        expect(일괄제출결과.skippedIds).toBeDefined();
        expect(일괄제출결과.failedItems).toBeDefined();

        // 대시보드 API 제출 후 검증
        const 개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        if (일괄제출결과.submittedCount > 0) {
          expect(
            개별직원현황.downwardEvaluation.primary.completedEvaluationCount,
          ).toBeGreaterThan(0);
        }
      });
    });

    describe('5-2. 피평가자의 모든 하향평가 일괄 초기화', () => {
      it('피평가자의 모든 하향평가를 일괄 초기화하고 대시보드 API를 검증한다', async () => {
        // Given - 하향평가 저장 및 제출
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId,
          downwardEvaluationContent: '1차 하향평가 내용입니다.',
          downwardEvaluationScore: 85,
        });

        await downwardEvaluationScenario.일차하향평가를_제출한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
        });

        // When - 일괄 초기화
        const 일괄초기화결과 =
          await downwardEvaluationScenario.피평가자의_모든_하향평가를_일괄_초기화한다(
            {
              evaluateeId,
              periodId: evaluationPeriodId,
              evaluatorId: primaryEvaluatorId,
              evaluationType: 'primary',
            },
          );

        // Then - 초기화 검증
        expect(일괄초기화결과.resetCount).toBeGreaterThanOrEqual(0);
        expect(일괄초기화결과.skippedCount).toBeGreaterThanOrEqual(0);
        expect(일괄초기화결과.failedCount).toBeGreaterThanOrEqual(0);
        expect(일괄초기화결과.resetIds).toBeDefined();
        expect(일괄초기화결과.skippedIds).toBeDefined();
        expect(일괄초기화결과.failedItems).toBeDefined();

        // 대시보드 API 초기화 후 검증
        const 개별직원현황 =
          await downwardEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId: evaluateeId,
          });

        if (일괄초기화결과.resetCount > 0) {
          expect(개별직원현황.downwardEvaluation.primary.status).toBe(
            'in_progress',
          );
          expect(개별직원현황.downwardEvaluation.primary.totalScore).toBeNull();
          expect(개별직원현황.downwardEvaluation.primary.grade).toBeNull();
        }
      });
    });
  });
});
