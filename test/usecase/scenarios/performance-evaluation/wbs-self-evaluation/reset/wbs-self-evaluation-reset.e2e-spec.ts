import { BaseE2ETest } from '../../../../../base-e2e.spec';
import { WbsSelfEvaluationScenario } from '../wbs-self-evaluation.scenario';
import { SeedDataScenario } from '../../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../../../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../../../wbs-assignment/wbs-assignment.scenario';
import { EvaluationTargetScenario } from '../../../evaluation-target.scenario';

/**
 * WBS 자기평가 초기화 (Reset) E2E 테스트
 *
 * 직원의 전체 WBS 자기평가를 미제출 상태로 변경하는 기능을 테스트합니다.
 * (1차 평가자 → 관리자 제출 초기화)
 */
describe('WBS 자기평가 초기화 (Reset) 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

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
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
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

    console.log('📊 시드 데이터 생성 결과:', {
      employeeCount: employeeIds.length,
      projectCount: projectIds.length,
      wbsCount: wbsItemIds.length,
      projectIds,
    });

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
      name: 'WBS 자기평가 초기화 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'WBS 자기평가 초기화 E2E 테스트용 평가기간',
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

    // WBS 할당 (첫 번째 프로젝트의 WBS 3개)
    for (let i = 0; i < 3; i++) {
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[i],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });
    }
  });

  describe('직원의 전체 WBS 자기평가 초기화', () => {
    it('관리자에게 제출된 평가들을 미제출 상태로 변경한다', async () => {
      // Given: 3개의 자기평가를 작성하고 1차 평가자와 관리자에게 모두 제출
      const evaluationIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[i],
            periodId: evaluationPeriodId,
            selfEvaluationContent: `자기평가 내용 ${i + 1}`,
            selfEvaluationScore: 100,
            performanceResult: `성과 결과 ${i + 1}`,
          },
        );
        evaluationIds.push(저장결과.id);

        // 1차 평가자에게 제출
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );

        // 관리자에게 제출
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );
      }

      // When: 직원의 전체 WBS 자기평가를 초기화
      const 초기화결과 =
        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_미제출_상태로_변경한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

      // Then: 응답 구조 검증
      expect(초기화결과).toBeDefined();
      expect(초기화결과.resetCount).toBe(3);
      expect(초기화결과.failedCount).toBe(0);
      expect(초기화결과.totalCount).toBe(3);
      expect(초기화결과.resetEvaluations).toHaveLength(3);
      expect(초기화결과.failedResets).toHaveLength(0);

      // Then: resetEvaluations 필드 검증
      초기화결과.resetEvaluations.forEach((evaluation: any, index: number) => {
        expect(evaluation.evaluationId).toBe(evaluationIds[index]);
        expect(evaluation.wbsItemId).toBe(wbsItemIds[index]);
        expect(evaluation.selfEvaluationContent).toBe(
          `자기평가 내용 ${index + 1}`,
        );
        expect(evaluation.selfEvaluationScore).toBe(100);
        expect(evaluation.performanceResult).toBe(`성과 결과 ${index + 1}`);
        expect(evaluation.wasSubmittedToManager).toBe(true);
      });

      // Then: 각 평가의 제출 상태 확인
      for (const evaluationId of evaluationIds) {
        const 상세정보 =
          await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
            evaluationId,
          );

        expect(상세정보.submittedToManager).toBe(false);
        expect(상세정보.submittedToManagerAt).toBeNull();
        expect(상세정보.submittedToEvaluator).toBe(false);
        expect(상세정보.submittedToEvaluatorAt).toBeNull();
      }
    });

    it('이미 미제출 상태인 평가는 스킵하고 결과에 포함하지 않는다', async () => {
      // Given: 3개의 자기평가를 작성하되, 제출하지 않음 (미제출 상태 유지)
      for (let i = 0; i < 3; i++) {
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[i],
          periodId: evaluationPeriodId,
          selfEvaluationContent: `자기평가 내용 ${i + 1}`,
          selfEvaluationScore: 100,
          performanceResult: `성과 결과 ${i + 1}`,
        });
      }

      // When: 직원의 전체 WBS 자기평가를 초기화 시도
      const 초기화결과 =
        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_미제출_상태로_변경한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

      // Then: 이미 미제출 상태이므로 resetCount는 0
      expect(초기화결과).toBeDefined();
      expect(초기화결과.resetCount).toBe(0);
      expect(초기화결과.failedCount).toBe(0);
      expect(초기화결과.totalCount).toBe(3);
      expect(초기화결과.resetEvaluations).toHaveLength(0);
      expect(초기화결과.failedResets).toHaveLength(0);
    });

    it('일부만 제출된 경우 제출된 평가만 초기화한다', async () => {
      // Given: 3개의 자기평가 작성
      const evaluationIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[i],
            periodId: evaluationPeriodId,
            selfEvaluationContent: `자기평가 내용 ${i + 1}`,
            selfEvaluationScore: 100,
            performanceResult: `성과 결과 ${i + 1}`,
          },
        );
        evaluationIds.push(저장결과.id);
      }

      // Given: 첫 2개만 1차 평가자와 관리자에게 제출
      for (let i = 0; i < 2; i++) {
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          evaluationIds[i],
        );
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          evaluationIds[i],
        );
      }

      // When: 직원의 전체 WBS 자기평가를 초기화
      const 초기화결과 =
        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_미제출_상태로_변경한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

      // Then: 제출된 2개만 초기화됨
      expect(초기화결과).toBeDefined();
      expect(초기화결과.resetCount).toBe(2);
      expect(초기화결과.failedCount).toBe(0);
      expect(초기화결과.totalCount).toBe(3);
      expect(초기화결과.resetEvaluations).toHaveLength(2);
      expect(초기화결과.failedResets).toHaveLength(0);

      // Then: 초기화된 평가의 ID 확인
      const 초기화된평가IDs = 초기화결과.resetEvaluations.map(
        (e: any) => e.evaluationId,
      );
      expect(초기화된평가IDs).toContain(evaluationIds[0]);
      expect(초기화된평가IDs).toContain(evaluationIds[1]);
      expect(초기화된평가IDs).not.toContain(evaluationIds[2]);

      // Then: 초기화된 평가는 미제출 상태
      for (let i = 0; i < 2; i++) {
        const 상세정보 =
          await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
            evaluationIds[i],
          );
        expect(상세정보.submittedToManager).toBe(false);
        expect(상세정보.submittedToEvaluator).toBe(false);
      }

      // Then: 제출하지 않은 평가는 그대로 미제출 상태
      const 미제출평가 =
        await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
          evaluationIds[2],
        );
      expect(미제출평가.submittedToManager).toBe(false);
      expect(미제출평가.submittedToEvaluator).toBe(false);
    });

    it('초기화할 자기평가가 없으면 에러를 반환한다', async () => {
      // Given: 자기평가를 작성하지 않음

      // When & Then: 초기화 시도 시 에러 발생
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeIds[0]}/period/${evaluationPeriodId}/reset`,
        )
        .expect(400);
    });

    it('1차 평가자에게만 제출된 평가는 초기화하지 않는다', async () => {
      // Given: 3개의 자기평가를 작성하고 1차 평가자에게만 제출 (관리자에게는 미제출)
      const evaluationIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[i],
            periodId: evaluationPeriodId,
            selfEvaluationContent: `자기평가 내용 ${i + 1}`,
            selfEvaluationScore: 100,
            performanceResult: `성과 결과 ${i + 1}`,
          },
        );
        evaluationIds.push(저장결과.id);

        // 1차 평가자에게만 제출 (관리자에게는 제출하지 않음)
        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );
      }

      // When: 직원의 전체 WBS 자기평가를 초기화 시도
      const 초기화결과 =
        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_미제출_상태로_변경한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

      // Then: 관리자에게 미제출 상태이므로 초기화되지 않음
      expect(초기화결과).toBeDefined();
      expect(초기화결과.resetCount).toBe(0);
      expect(초기화결과.failedCount).toBe(0);
      expect(초기화결과.totalCount).toBe(3);
      expect(초기화결과.resetEvaluations).toHaveLength(0);
      expect(초기화결과.failedResets).toHaveLength(0);

      // Then: 평가는 여전히 1차 평가자에게 제출된 상태로 유지
      for (const evaluationId of evaluationIds) {
        const 상세정보 =
          await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
            evaluationId,
          );

        expect(상세정보.submittedToManager).toBe(false);
        expect(상세정보.submittedToEvaluator).toBe(true);
        expect(상세정보.submittedToEvaluatorAt).toBeDefined();
      }
    });
  });

  describe('프로젝트별 WBS 자기평가 초기화', () => {
    it('특정 프로젝트의 자기평가만 초기화한다', async () => {
      // Given: 두 번째 프로젝트도 할당
      await projectAssignmentScenario.프로젝트를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employeeIds[0],
        projectId: projectIds[1],
      });

      // Given: 두 번째 프로젝트의 WBS도 할당
      for (let i = 3; i < 5; i++) {
        await wbsAssignmentScenario.WBS를_할당한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[i],
          projectId: projectIds[1],
          periodId: evaluationPeriodId,
        });
      }

      // Given: 첫 번째 프로젝트의 자기평가 작성 및 제출
      const project1EvaluationIds: string[] = [];
      for (let i = 0; i < 3; i++) {
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[i],
            periodId: evaluationPeriodId,
            selfEvaluationContent: `프로젝트1 자기평가 ${i + 1}`,
            selfEvaluationScore: 100,
            performanceResult: `프로젝트1 성과 ${i + 1}`,
          },
        );
        project1EvaluationIds.push(저장결과.id);

        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );
      }

      // Given: 두 번째 프로젝트의 자기평가 작성 및 제출
      const project2EvaluationIds: string[] = [];
      for (let i = 3; i < 5; i++) {
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[i],
            periodId: evaluationPeriodId,
            selfEvaluationContent: `프로젝트2 자기평가 ${i - 2}`,
            selfEvaluationScore: 100,
            performanceResult: `프로젝트2 성과 ${i - 2}`,
          },
        );
        project2EvaluationIds.push(저장결과.id);

        await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
          저장결과.id,
        );
        await wbsSelfEvaluationScenario.WBS자기평가를_관리자에게_제출한다(
          저장결과.id,
        );
      }

      // When: 첫 번째 프로젝트의 자기평가만 초기화
      const 초기화결과 =
        await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_미제출_상태로_변경한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
            projectId: projectIds[0],
          },
        );

      // Then: 첫 번째 프로젝트의 평가만 초기화됨
      expect(초기화결과).toBeDefined();
      expect(초기화결과.resetCount).toBe(3);
      expect(초기화결과.failedCount).toBe(0);
      expect(초기화결과.totalCount).toBe(3);
      expect(초기화결과.resetEvaluations).toHaveLength(3);

      // Then: 첫 번째 프로젝트 평가는 미제출 상태
      for (const evaluationId of project1EvaluationIds) {
        const 상세정보 =
          await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
            evaluationId,
          );
        expect(상세정보.submittedToManager).toBe(false);
      }

      // Then: 두 번째 프로젝트 평가는 여전히 제출 상태
      for (const evaluationId of project2EvaluationIds) {
        const 상세정보 =
          await wbsSelfEvaluationScenario.WBS자기평가_상세정보를_조회한다(
            evaluationId,
          );
        expect(상세정보.submittedToManager).toBe(true);
      }
    });
  });
});

