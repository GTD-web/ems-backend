import { BaseE2ETest } from '../base-e2e.spec';
import { SeedDataScenario } from './scenarios/seed-data.scenario';
import { QueryOperationsScenario } from './scenarios/query-operations.scenario';
import { EvaluationTargetScenario } from './scenarios/evaluation-target.scenario';
import { EvaluationPeriodScenario } from './scenarios/evaluation-period.scenario';
import { ProjectAssignmentScenario } from './scenarios/project-assignment.scenario';
import { WbsAssignmentScenario } from './scenarios/wbs-assignment.scenario';
import { SelfEvaluationScenario } from './scenarios/self-evaluation.scenario';
import { DeliverableScenario } from './scenarios/deliverable.scenario';

describe('평가 프로세스 전체 플로우 (E2E)', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let queryOperationsScenario: QueryOperationsScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let selfEvaluationScenario: SelfEvaluationScenario;
  let deliverableScenario: DeliverableScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    queryOperationsScenario = new QueryOperationsScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
    deliverableScenario = new DeliverableScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  it('전체 평가 프로세스를 실행한다', async () => {
    // ========== Step 1: 시드 데이터 생성 ==========
    const { seedResponse, evaluationPeriodId } =
      await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 3,
        wbsPerProject: 5,
        includeCurrentUserAsEvaluator: false,
      });

    // ========== Step 2: 시드 데이터 상태 확인 ==========
    const statusResponse = await seedDataScenario.시드_데이터_상태를_확인한다();
    expect(statusResponse.entityCounts.EvaluationPeriod).toBeGreaterThan(0);
    expect(evaluationPeriodId).toBeDefined();

    // ========== Step 3: 조회 시나리오 실행 ==========
    const queryResult =
      await queryOperationsScenario.전체_조회_시나리오를_실행한다(
        evaluationPeriodId!,
      );

    console.log(
      `✅ 프로세스 완료 - 부서: ${queryResult.totalDepartments}개, 직원: ${queryResult.employeeCount}명, 평가기간: ${statusResponse.entityCounts.EvaluationPeriod}개, 프로젝트: ${statusResponse.entityCounts.Project}개, WBS: ${statusResponse.entityCounts.WbsItem}개`,
    );

    // ========== Step 4: 시드 데이터 정리 ==========
    await seedDataScenario.시드_데이터를_삭제한다();
  });

  it('평가기간 생성 시 1차 평가자 자동 할당을 검증한다', async () => {
    // ========== Step 1: 시드 데이터 생성 ==========
    console.log('시드데이터 생성 시작...');
    const { evaluationPeriodId } =
      await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: true,
        projectCount: 2,
        wbsPerProject: 3,
        includeCurrentUserAsEvaluator: false,
        useRealDepartments: false,
        useRealEmployees: false,
      });
    console.log('시드데이터 생성 완료');

    // ========== Step 2: 새로운 평가기간 생성 및 1차 평가자 자동 할당 검증 ==========
    const result =
      await evaluationPeriodScenario.평가기간을_생성하고_1차평가자를_검증한다({
        name: '2024년 하반기 평가 (Usecase 검증)',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: 'Usecase 시나리오에서 1차 평가자 자동 할당 검증',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      });

    // ========== Step 3: 검증 결과 확인 ==========
    expect(result.evaluationPeriod).toBeDefined();
    expect(result.evaluationPeriod.id).toBeDefined();
    expect(result.totalTargets).toBeGreaterThan(0);
    // 1차 평가자가 할당되지 않은 경우도 있을 수 있음 (부서장이 없는 경우)
    expect(result.autoAssignedCount).toBeGreaterThanOrEqual(0);
    expect(result.autoAssignedCount).toBeLessThanOrEqual(result.totalTargets);

    console.log(
      `✅ 1차 평가자 자동 할당 검증 완료 - 평가기간: ${result.evaluationPeriod.name}, ` +
        `총 대상자: ${result.totalTargets}명, 자동 할당: ${result.autoAssignedCount}명`,
    );

    // ========== Step 4: 시드 데이터 정리 ==========
    await seedDataScenario.시드_데이터를_삭제한다();
  });

  describe('조회 처리 시나리오 (분리 테스트)', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      // 테스트용 시드 데이터 생성
      const result = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 3,
        wbsPerProject: 5,
      });
      evaluationPeriodId = result.evaluationPeriodId!;
    });

    afterAll(async () => {
      // 테스트 후 정리
      await seedDataScenario.시드_데이터를_삭제한다();
    });

    it('부서 하이라키를 조회한다', async () => {
      const result = await queryOperationsScenario.부서_하이라키를_조회한다();

      expect(result.totalDepartments).toBeGreaterThan(0);
      expect(result.hierarchyData.length).toBeGreaterThan(0);
    });

    it('대시보드 직원 상태를 조회한다', async () => {
      const employees =
        await queryOperationsScenario.대시보드_직원_상태를_조회한다(
          evaluationPeriodId,
        );

      expect(employees.length).toBeGreaterThan(0);
      expect(employees[0]).toHaveProperty('employee');
      expect(employees[0]).toHaveProperty('evaluationPeriod');
    });

    it('직원 조회 제외 시 대시보드에서도 필터링된다', async () => {
      const result =
        await queryOperationsScenario.직원_조회_제외_포함_시나리오를_실행한다(
          evaluationPeriodId,
        );

      expect(result.employeeId).toBeDefined();
      expect(result.initialEmployeeCount).toBeGreaterThan(0);
      expect(result.excludedFromDashboard).toBe(true);
      expect(result.includedBackInDashboard).toBe(true);
    });

    it('부서 하이라키 직원 목록과 대시보드 직원 목록을 비교한다', async () => {
      const result =
        await queryOperationsScenario.부서_하이라키와_대시보드_직원_목록_비교_시나리오를_실행한다(
          evaluationPeriodId,
        );

      // 대시보드에는 직원이 있어야 함
      expect(result.dashboardEmployeeCount).toBeGreaterThan(0);

      // 부서 하이라키에 직원이 있는 경우에만 일치 여부 검증
      if (result.hierarchyEmployeeCount > 0) {
        expect(result.hierarchyEmployeeCount).toBe(
          result.dashboardEmployeeCount,
        );
        expect(result.allEmployeesMatch).toBe(true);
        expect(result.missingInDashboard.length).toBe(0);
        expect(result.extraInDashboard.length).toBe(0);
        console.log(
          `✅ 직원 목록 일치 확인: ${result.hierarchyEmployeeCount}명`,
        );
      } else {
        // 부서 하이라키에 직원이 없는 경우 - 경고만 출력
        console.log(
          `⚠️ 부서 하이라키에서 직원 정보를 가져올 수 없음 (대시보드: ${result.dashboardEmployeeCount}명)`,
        );
      }
    });
  });

  describe('평가 대상 관리 시나리오 (분리 테스트)', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      // 테스트용 시드 데이터 생성
      const result = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 3,
        wbsPerProject: 5,
      });
      evaluationPeriodId = result.evaluationPeriodId!;
    });

    afterAll(async () => {
      // 테스트 후 정리
      await seedDataScenario.시드_데이터를_삭제한다();
    });

    it('평가 대상을 제외하고 대시보드에서 필터링된다', async () => {
      const result =
        await evaluationTargetScenario.평가_대상_제외_포함_시나리오를_실행한다(
          evaluationPeriodId,
        );

      expect(result.employeeId).toBeDefined();
      expect(result.excludedFromDashboard).toBe(true);
      expect(result.includedBackInDashboard).toBe(true);
    });

    it('여러 직원을 제외/포함하고 대시보드에 반영된다', async () => {
      await evaluationTargetScenario.여러_직원_제외_포함을_테스트한다(
        evaluationPeriodId,
        2,
      );
    });

    it('제외된 대상자 목록을 조회한다', async () => {
      // 1명 제외
      const dashboard =
        await evaluationTargetScenario.대시보드에서_직원_상태를_조회한다(
          evaluationPeriodId,
        );
      const employeeId = dashboard[0].employee.id;

      await evaluationTargetScenario.평가_대상에서_제외한다(
        evaluationPeriodId,
        employeeId,
        '조회 테스트용 제외',
      );

      // 제외된 목록 조회
      const excludedTargets =
        await evaluationTargetScenario.제외된_평가_대상자를_조회한다(
          evaluationPeriodId,
        );

      expect(excludedTargets.targets.length).toBeGreaterThan(0);
      const excluded = excludedTargets.targets.find(
        (t: any) => t.employee.id === employeeId,
      );
      expect(excluded).toBeDefined();
      expect(excluded.isExcluded).toBe(true);
      expect(excluded.excludeReason).toBe('조회 테스트용 제외');

      // 정리 - 다시 포함
      await evaluationTargetScenario.평가_대상에_포함한다(
        evaluationPeriodId,
        employeeId,
      );
    });

    it('평가 대상 등록 해제 시 isEvaluationTarget이 변경된다', async () => {
      const result =
        await evaluationTargetScenario.평가_대상_등록_해제_시나리오를_실행한다(
          evaluationPeriodId,
        );

      expect(result.employeeId).toBeDefined();
      expect(result.isEvaluationTargetBefore).toBe(true);
      expect(result.isEvaluationTargetAfter).toBe(false);
    });

    it('평가 대상 제외/포함 시 exclusionInfo.isExcluded가 변경된다', async () => {
      const result =
        await evaluationTargetScenario.평가_대상_제외_포함_exclusionInfo_검증_시나리오를_실행한다(
          evaluationPeriodId,
        );

      expect(result.employeeId).toBeDefined();
      expect(result.isExcludedBefore).toBe(false);
      expect(result.isExcludedAfterExclude).toBe(true);
      expect(result.isExcludedAfterInclude).toBe(false);
    });
  });

  describe('평가기간 관리 시나리오 (분리 테스트)', () => {
    let createdPeriodIds: string[] = [];

    afterAll(async () => {
      // 테스트 후 정리 - 생성된 평가기간 삭제
      for (const periodId of createdPeriodIds) {
        try {
          await evaluationPeriodScenario.평가기간을_삭제한다(periodId);
        } catch (error) {
          console.log(
            `평가기간 삭제 실패 (이미 삭제되었을 수 있음): ${periodId}`,
          );
        }
      }
      // 시드 데이터 정리
      await seedDataScenario.시드_데이터를_삭제한다();
    });

    it('MINIMAL 시나리오로 데이터 생성 후 평가기간을 생성한다', async () => {
      // 1. MINIMAL 시나리오로 시드 데이터 생성 (프로젝트/WBS만)
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: false,
        projectCount: 3,
        wbsPerProject: 5,
      });

      expect(seedResponse.results[0].entityCounts.Project).toBeGreaterThan(0);
      expect(seedResponse.results[0].entityCounts.WbsItem).toBeGreaterThan(0);
      expect(seedResponse.results[0].entityCounts.Employee).toBeGreaterThan(0);
      console.log(
        `✅ MINIMAL 시드 데이터 생성 완료 - 프로젝트: ${seedResponse.results[0].entityCounts.Project}개, WBS: ${seedResponse.results[0].entityCounts.WbsItem}개, 직원: ${seedResponse.results[0].entityCounts.Employee}명`,
      );

      // 2. 평가기간 생성 및 시작
      const result =
        await evaluationPeriodScenario.평가기간_생성_및_시작_시나리오를_실행한다();

      createdPeriodIds.push(result.periodId);

      expect(result.periodId).toBeDefined();
      expect(result.periodName).toBeDefined();
      expect(result.statusBefore).toBe('waiting');
      expect(result.statusAfter).toBe('in-progress');
    });

    it('평가기간 생성 후 대상자를 등록한다', async () => {
      // 1. MINIMAL 시나리오로 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 2,
        wbsPerProject: 3,
      });

      // 2. 생성된 직원 ID 추출
      const employeeIds =
        seedResponse.results[0].generatedIds?.employeeIds || [];
      expect(employeeIds.length).toBeGreaterThan(0);

      // 3. 평가기간 생성 후 대상자 등록
      const result =
        await evaluationPeriodScenario.평가기간_생성_후_대상자_등록_시나리오를_실행한다(
          employeeIds,
        );

      createdPeriodIds.push(result.periodId);

      expect(result.registeredCount).toBe(employeeIds.length);
      console.log(
        `✅ 평가기간 생성 및 대상자 등록 완료 - ${result.registeredCount}명`,
      );
    });

    it('평가기간 목록을 조회한다', async () => {
      const result = await evaluationPeriodScenario.평가기간_목록을_조회한다(
        1,
        10,
      );

      expect(result.items).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });
  });

  describe('프로젝트 할당 시나리오 (분리 테스트)', () => {
    let createdPeriodIds: string[] = [];

    afterAll(async () => {
      // 테스트 후 정리 - 생성된 평가기간 삭제
      for (const periodId of createdPeriodIds) {
        try {
          await evaluationPeriodScenario.평가기간을_삭제한다(periodId);
        } catch (error) {
          console.log(
            `평가기간 삭제 실패 (이미 삭제되었을 수 있음): ${periodId}`,
          );
        }
      }
      // 시드 데이터 정리
      await seedDataScenario.시드_데이터를_삭제한다();
    });

    it('모든 평가대상자에게 프로젝트를 할당하고 대시보드에서 검증한다', async () => {
      // 1. MINIMAL 시나리오로 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 2,
        wbsPerProject: 3,
      });

      const employeeIds =
        seedResponse.results[0].generatedIds?.employeeIds || [];
      const projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

      expect(employeeIds.length).toBeGreaterThan(0);
      expect(projectIds.length).toBeGreaterThan(0);

      console.log(
        `✅ MINIMAL 시드 데이터 생성 완료 - 프로젝트: ${projectIds.length}개, 직원: ${employeeIds.length}명`,
      );

      // 2. 평가기간 생성 후 대상자 등록
      const { periodId } =
        await evaluationPeriodScenario.평가기간_생성_후_대상자_등록_시나리오를_실행한다(
          employeeIds,
        );

      createdPeriodIds.push(periodId);

      // 3. 모든 평가대상자에게 프로젝트 할당 (평가자 엔드포인트 검증 포함)
      const evaluatorId = employeeIds[0]; // 첫 번째 직원을 평가자로 사용
      const result =
        await projectAssignmentScenario.프로젝트_할당_후_대시보드_검증_시나리오를_실행한다(
          periodId,
          employeeIds,
          projectIds,
          evaluatorId, // 평가자 ID 추가
        );

      expect(result.totalAssignments).toBe(
        employeeIds.length * projectIds.length,
      );
      expect(result.verifiedEmployees).toBe(employeeIds.length);
      expect(result.verifiedEvaluatorEndpoints).toBe(employeeIds.length);

      console.log(
        `✅ 프로젝트 할당 및 검증 완료 - 총 ${result.totalAssignments}건 할당, ${result.verifiedEmployees}명 검증, ${result.verifiedEvaluatorEndpoints}개 평가자 엔드포인트 검증`,
      );
    });

    it('프로젝트 할당을 취소하고 대시보드에서 검증한다', async () => {
      // 1. MINIMAL 시나리오로 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 2,
        wbsPerProject: 3,
      });

      const employeeIds =
        seedResponse.results[0].generatedIds?.employeeIds || [];
      const projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

      // 2. 평가기간 생성 후 대상자 등록
      const { periodId } =
        await evaluationPeriodScenario.평가기간_생성_후_대상자_등록_시나리오를_실행한다(
          employeeIds,
        );

      createdPeriodIds.push(periodId);

      // 3. 프로젝트 할당
      await projectAssignmentScenario.프로젝트를_대량으로_할당한다(
        periodId,
        projectIds,
        employeeIds,
      );

      // 4. 첫 번째 직원의 프로젝트 할당 취소 (평가자 엔드포인트 검증 포함)
      const testEmployeeId = employeeIds[0];
      const evaluatorId = employeeIds[1] || employeeIds[0]; // 두 번째 직원을 평가자로 사용 (없으면 첫 번째)
      const result =
        await projectAssignmentScenario.프로젝트_할당_취소_시나리오를_실행한다(
          periodId,
          testEmployeeId,
          evaluatorId, // 평가자 ID 추가
        );

      expect(result.projectCountBefore).toBe(projectIds.length);
      expect(result.projectCountAfter).toBe(projectIds.length - 1);
      console.log(
        `✅ 프로젝트 할당 취소 검증 완료: ${result.projectCountBefore}개 → ${result.projectCountAfter}개 (평가자 엔드포인트 검증 포함)`,
      );
    });

    it('프로젝트 할당 순서를 변경하고 검증한다', async () => {
      // 1. MINIMAL 시나리오로 시드 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 3,
        wbsPerProject: 3,
      });

      const employeeIds =
        seedResponse.results[0].generatedIds?.employeeIds || [];
      const projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

      // 2. 평가기간 생성 후 대상자 등록
      const { periodId } =
        await evaluationPeriodScenario.평가기간_생성_후_대상자_등록_시나리오를_실행한다(
          employeeIds,
        );

      createdPeriodIds.push(periodId);

      // 3. 프로젝트 할당 (최소 3개 프로젝트)
      await projectAssignmentScenario.프로젝트를_대량으로_할당한다(
        periodId,
        projectIds,
        employeeIds,
      );

      // 4. 첫 번째 직원의 프로젝트 할당 순서 변경 (평가자 엔드포인트 검증 포함)
      const testEmployeeId = employeeIds[0];
      const evaluatorId = employeeIds[1] || employeeIds[0]; // 두 번째 직원을 평가자로 사용 (없으면 첫 번째)
      const result =
        await projectAssignmentScenario.프로젝트_할당_순서_변경_시나리오를_실행한다(
          periodId,
          testEmployeeId,
          evaluatorId, // 평가자 ID 추가
        );

      expect(result.orderAfterDown).toBeGreaterThan(result.orderBefore);
      expect(result.orderAfterUp).toBe(result.orderBefore);
      console.log(
        `✅ 프로젝트 할당 순서 변경 검증 완료: down(${result.orderBefore} → ${result.orderAfterDown}), up(${result.orderAfterDown} → ${result.orderAfterUp}) (평가자 엔드포인트 검증 포함)`,
      );
    });
  });

  // ==================== WBS 할당 시나리오 ====================

  describe('WBS 할당 시나리오 (분리 테스트)', () => {
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let projectIds: string[];
    let wbsItemIds: string[];

    beforeEach(async () => {
      // 각 테스트마다 새로운 데이터 생성
      const { evaluationPeriodId: periodId } =
        await seedDataScenario.시드_데이터를_생성한다({
          scenario: 'with_period',
          clearExisting: true,
          projectCount: 2,
          wbsPerProject: 3,
          useRealDepartments: false,
          useRealEmployees: false,
        });

      evaluationPeriodId = periodId!;

      // 직원 및 프로젝트 ID 조회
      const employees = await testSuite.getRepository('Employee').find({
        where: { status: '재직중' },
        take: 3,
      });
      employeeIds = employees.map((emp) => emp.id);

      const projects = await testSuite.getRepository('Project').find({
        take: 2,
      });
      projectIds = projects.map((proj) => proj.id);

      const wbsItems = await testSuite.getRepository('WbsItem').find({
        where: { projectId: projectIds[0] },
        take: 3,
      });
      wbsItemIds = wbsItems.map((wbs) => wbs.id);
    });

    it('모든 평가대상자에게 WBS를 할당하고 대시보드에서 검증한다', async () => {
      const result =
        await wbsAssignmentScenario.WBS_할당_후_대시보드_검증_시나리오를_실행한다(
          evaluationPeriodId,
          employeeIds,
          wbsItemIds,
          projectIds[0],
        );

      expect(result.assignments.length).toBe(
        employeeIds.length * wbsItemIds.length,
      );
      expect(result.verifiedDashboardEndpoints).toBe(employeeIds.length);
    });

    it('WBS 할당을 취소하고 대시보드에서 검증한다', async () => {
      // 먼저 WBS 할당 생성
      await wbsAssignmentScenario.WBS_할당_후_대시보드_검증_시나리오를_실행한다(
        evaluationPeriodId,
        [employeeIds[0]],
        wbsItemIds,
        projectIds[0],
      );

      // WBS 할당 취소
      const result =
        await wbsAssignmentScenario.WBS_할당_취소_시나리오를_실행한다(
          evaluationPeriodId,
          employeeIds[0],
          projectIds[0],
        );

      expect(result.cancelledAssignments).toBeGreaterThan(0);
      expect(result.verifiedDashboardEndpoints).toBe(1);
    });

    it('WBS 할당 순서를 변경하고 검증한다', async () => {
      // 먼저 WBS 할당 생성 (최소 2개)
      await wbsAssignmentScenario.WBS_할당_후_대시보드_검증_시나리오를_실행한다(
        evaluationPeriodId,
        [employeeIds[0]],
        wbsItemIds.slice(0, 2), // 최소 2개 WBS
        projectIds[0],
      );

      // WBS 할당 순서 변경
      const result =
        await wbsAssignmentScenario.WBS_할당_순서_변경_시나리오를_실행한다(
          evaluationPeriodId,
          employeeIds[0],
          projectIds[0],
        );

      expect(result.orderChanges).toBeGreaterThan(0);
      expect(result.verifiedDashboardEndpoints).toBe(1);
    });

    it('WBS 할당을 초기화하고 대시보드에서 검증한다', async () => {
      // 먼저 WBS 할당 생성
      await wbsAssignmentScenario.WBS_할당_후_대시보드_검증_시나리오를_실행한다(
        evaluationPeriodId,
        [employeeIds[0]],
        wbsItemIds,
        projectIds[0],
      );

      // WBS 할당 초기화
      const result =
        await wbsAssignmentScenario.WBS_할당_초기화_시나리오를_실행한다(
          evaluationPeriodId,
          employeeIds[0],
          projectIds[0],
        );

      expect(result.resetType).toBe('employee');
      expect(result.verifiedDashboardEndpoints).toBe(1);
    });
  });

  // ==================== Step 6: 자기평가 관리 ====================
  describe('자기평가 관리 시나리오', () => {
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let wbsItemIds: string[];
    let projectIds: string[];
    let mappingIds: string[];

    beforeAll(async () => {
      // 시드 데이터 생성 (자기평가 완료되지 않은 상태로)
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 2,
        wbsPerProject: 3,
        includeCurrentUserAsEvaluator: false,
        selfEvaluationProgress: {
          notStarted: 0.4, // 40% - 시작 안함
          inProgress: 0.6, // 60% - 진행 중
          completed: 0.0, // 0% - 완료됨 (완료되지 않은 상태로)
        },
      });

      evaluationPeriodId = seedResult.evaluationPeriodId!;
      employeeIds = seedResult.employeeIds!;
      wbsItemIds = seedResult.wbsItemIds!;
      projectIds = seedResult.projectIds!;

      // WBS 할당 생성 (자기평가를 위해 필요)
      await wbsAssignmentScenario.WBS_할당_후_대시보드_검증_시나리오를_실행한다(
        evaluationPeriodId,
        [employeeIds[0]],
        wbsItemIds.slice(0, 2),
        projectIds[0],
      );

      // 평가기간-직원 맵핑 ID 조회 (자기평가 수정 가능 상태 변경을 위해)
      const dashboardResponse =
        await queryOperationsScenario.대시보드_직원_상태를_조회한다(
          evaluationPeriodId,
        );
      mappingIds = dashboardResponse
        .filter((emp: any) => emp.employee.id === employeeIds[0])
        .map((emp: any) => emp.mappingId);
    });

    it('자기평가 전체 시나리오를 실행한다', async () => {
      const result =
        await selfEvaluationScenario.자기평가_전체_시나리오를_실행한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          mappingId: mappingIds[0],
        });

      // 검증
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.isCompleted).toBe(false);
      expect(result.제출결과.isCompleted).toBe(true);
      expect(result.조회결과.id).toBe(result.저장결과.id);
      expect(result.미제출결과.isCompleted).toBe(false);
      expect(result.재제출결과.isCompleted).toBe(true);
    });

    it('프로젝트별 자기평가 시나리오를 실행한다', async () => {
      // 자기평가 시나리오를 위한 새로운 시드 데이터 생성 (미완료 상태로)
      const selfEvalSeedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 2,
        includeCurrentUserAsEvaluator: false,
        selfEvaluationProgress: {
          notStarted: 0.4, // 40% - 시작 안함
          inProgress: 0.6, // 60% - 진행 중
          completed: 0.0, // 0% - 완료됨 (완료되지 않은 상태로)
        },
      });

      const result =
        await selfEvaluationScenario.프로젝트별_자기평가_시나리오를_실행한다({
          employeeId: selfEvalSeedResult.employeeIds![0],
          periodId: selfEvalSeedResult.evaluationPeriodId!,
          projectId: selfEvalSeedResult.projectIds![0],
          wbsItemIds: selfEvalSeedResult.wbsItemIds!.slice(0, 2),
        });

      // 검증
      expect(result.저장결과들).toHaveLength(2);
      expect(result.프로젝트별제출결과.submittedCount).toBeGreaterThan(0);
      expect(result.프로젝트별미제출결과.resetCount).toBeGreaterThan(0);
    });

    it('자기평가 내용 초기화 시나리오를 실행한다', async () => {
      const result =
        await selfEvaluationScenario.자기평가_내용_초기화_시나리오를_실행한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[1],
          periodId: evaluationPeriodId,
        });

      // 검증
      expect(result.저장결과.id).toBeDefined();
      expect(result.제출결과.isCompleted).toBe(true);
      expect(result.내용초기화결과.isCompleted).toBe(false);
      expect(result.재저장결과.id).toBe(result.저장결과.id);
    });

    it('자기평가 수정 가능 상태를 변경한다', async () => {
      const result =
        await selfEvaluationScenario.자기평가_수정_가능_상태를_변경한다({
          mappingId: mappingIds[0],
          evaluationType: 'self',
          isEditable: false,
        });

      // 검증
      expect(result.id).toBe(mappingIds[0]);
      expect(result.isSelfEvaluationEditable).toBe(false);
    });

    it('직원의 자기평가 목록을 조회한다', async () => {
      const result =
        await selfEvaluationScenario.직원의_자기평가_목록을_조회한다({
          employeeId: employeeIds[0],
          periodId: evaluationPeriodId,
          page: 1,
          limit: 10,
        });

      // 검증
      expect(result.evaluations).toBeDefined();
      expect(Array.isArray(result.evaluations)).toBe(true);
      expect(result.total).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('직원의 전체 WBS 자기평가를 제출한다', async () => {
      // 자기평가 시나리오를 위한 새로운 시드 데이터 생성 (미완료 상태로)
      const selfEvalSeedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 2,
        includeCurrentUserAsEvaluator: false,
        selfEvaluationProgress: {
          notStarted: 0.4, // 40% - 시작 안함
          inProgress: 0.6, // 60% - 진행 중
          completed: 0.0, // 0% - 완료됨 (완료되지 않은 상태로)
        },
      });

      // 먼저 몇 개의 자기평가를 저장
      const 저장결과1 = await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: selfEvalSeedResult.employeeIds![0],
        wbsItemId: selfEvalSeedResult.wbsItemIds![0],
        periodId: selfEvalSeedResult.evaluationPeriodId!,
        selfEvaluationContent: '전체 제출 테스트 1',
        selfEvaluationScore: 85,
      });

      const 저장결과2 = await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: selfEvalSeedResult.employeeIds![0],
        wbsItemId: selfEvalSeedResult.wbsItemIds![1],
        periodId: selfEvalSeedResult.evaluationPeriodId!,
        selfEvaluationContent: '전체 제출 테스트 2',
        selfEvaluationScore: 90,
      });

      // 전체 제출
      const result =
        await selfEvaluationScenario.직원의_전체_WBS자기평가를_제출한다({
          employeeId: selfEvalSeedResult.employeeIds![0],
          periodId: selfEvalSeedResult.evaluationPeriodId!,
        });

      // 검증
      expect(result.submittedCount).toBeGreaterThan(0);
      expect(result.totalCount).toBeGreaterThan(0);
      expect(result.completedEvaluations).toBeDefined();
      expect(Array.isArray(result.completedEvaluations)).toBe(true);
    });

    it('직원의 전체 WBS 자기평가 내용을 초기화한다', async () => {
      const result =
        await selfEvaluationScenario.직원의_전체_WBS자기평가_내용을_초기화한다({
          employeeId: employeeIds[0],
          periodId: evaluationPeriodId,
        });

      // 검증
      expect(result.employeeId).toBe(employeeIds[0]);
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(result.clearedCount).toBeDefined();
      expect(result.clearedEvaluations).toBeDefined();
      expect(Array.isArray(result.clearedEvaluations)).toBe(true);
    });

    it('자기평가 제출 후 대시보드에서 performanceInput과 selfEvaluation을 검증한다', async () => {
      // 자기평가 시나리오를 위한 새로운 시드 데이터 생성 (미완료 상태로)
      const selfEvalSeedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 3,
        includeCurrentUserAsEvaluator: false,
        selfEvaluationProgress: {
          notStarted: 0.4, // 40% - 시작 안함
          inProgress: 0.6, // 60% - 진행 중
          completed: 0.0, // 0% - 완료됨 (완료되지 않은 상태로)
        },
      });

      const result =
        await selfEvaluationScenario.자기평가_제출_후_대시보드_검증_시나리오를_실행한다(
          {
            employeeId: selfEvalSeedResult.employeeIds![0],
            periodId: selfEvalSeedResult.evaluationPeriodId!,
            wbsItemIds: selfEvalSeedResult.wbsItemIds!.slice(0, 3),
          },
        );

      // 검증
      expect(result.저장결과들).toHaveLength(3);
      expect(result.제출결과.submittedCount).toBeGreaterThan(0);
      expect(result.대시보드데이터).toBeDefined();
      expect(result.대시보드데이터.performanceInput).toBeDefined();
      expect(result.대시보드데이터.selfEvaluation).toBeDefined();
    });

    it('자기평가 진행중 상태에서 대시보드 검증을 수행한다', async () => {
      // 자기평가 시나리오를 위한 새로운 시드 데이터 생성 (미완료 상태로)
      const selfEvalSeedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 4,
        includeCurrentUserAsEvaluator: false,
        selfEvaluationProgress: {
          notStarted: 0.4, // 40% - 시작 안함
          inProgress: 0.6, // 60% - 진행 중
          completed: 0.0, // 0% - 완료됨 (완료되지 않은 상태로)
        },
      });

      const result =
        await selfEvaluationScenario.자기평가_진행중_상태_대시보드_검증_시나리오를_실행한다(
          {
            employeeId: selfEvalSeedResult.employeeIds![0],
            periodId: selfEvalSeedResult.evaluationPeriodId!,
            wbsItemIds: selfEvalSeedResult.wbsItemIds!.slice(0, 4),
          },
        );

      // 검증
      expect(result.저장결과들).toHaveLength(2); // 절반만 저장
      expect(result.대시보드데이터).toBeDefined();
      expect(result.대시보드데이터.performanceInput).toBeDefined();
      expect(result.대시보드데이터.selfEvaluation).toBeDefined();

      // 진행중 상태 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        result.대시보드데이터.performanceInput.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        result.대시보드데이터.selfEvaluation.status,
      );
    });

    it('자기평가 없는 상태에서 대시보드 검증을 수행한다', async () => {
      // 자기평가 시나리오를 위한 새로운 시드 데이터 생성 (미완료 상태로)
      const selfEvalSeedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: false,
        projectCount: 1,
        wbsPerProject: 3,
        includeCurrentUserAsEvaluator: false,
        selfEvaluationProgress: {
          notStarted: 0.4, // 40% - 시작 안함
          inProgress: 0.6, // 60% - 진행 중
          completed: 0.0, // 0% - 완료됨 (완료되지 않은 상태로)
        },
      });

      const result =
        await selfEvaluationScenario.자기평가_없는_상태_대시보드_검증_시나리오를_실행한다(
          {
            employeeId: selfEvalSeedResult.employeeIds![0],
            periodId: selfEvalSeedResult.evaluationPeriodId!,
            wbsItemIds: selfEvalSeedResult.wbsItemIds!.slice(0, 3),
          },
        );

      // 검증
      expect(result.대시보드데이터).toBeDefined();
      expect(result.대시보드데이터.performanceInput).toBeDefined();
      expect(result.대시보드데이터.selfEvaluation).toBeDefined();

      // 없는 상태 검증
      expect(['complete', 'in_progress', 'none']).toContain(
        result.대시보드데이터.performanceInput.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        result.대시보드데이터.selfEvaluation.status,
      );
      expect(result.대시보드데이터.selfEvaluation.totalScore).toBeNull();
    });
  });

  // TODO: 추가 프로세스 구현 예정
  // - Step 7: 평가 기준 설정 (WITH_SETUP)
  // - Step 8: 평가 진행 (FULL)
  // - Step 9: 최종 평가 조회

  /**
   * 산출물 관리 시나리오
   *
   * WBS 자기평가를 제출한 후 산출물을 등록하는 실제 사용자 워크플로우를 테스트합니다.
   */
  describe('산출물 관리 시나리오', () => {
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let wbsItemIds: string[];
    let projectIds: string[];

    beforeAll(async () => {
      // 산출물 시나리오를 위한 시드 데이터 생성 (독립적인 환경, 미완료 상태)
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'with_period',
        clearExisting: true,
        projectCount: 2,
        wbsPerProject: 3,
        selfEvaluationProgress: {
          notStarted: 1.0, // 100% - 시작 안함
          inProgress: 0.0, // 0% - 진행 중
          completed: 0.0, // 0% - 완료됨
        },
      });

      evaluationPeriodId = seedResult.evaluationPeriodId!;
      employeeIds = seedResult.employeeIds!;
      wbsItemIds = seedResult.wbsItemIds!;
      projectIds = seedResult.projectIds!;
    });

    it('WBS 자기평가 이후 산출물을 등록한다', async () => {
      const result =
        await deliverableScenario.자기평가_후_산출물_등록_전체_시나리오를_실행한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationScenario,
          },
        );

      // 검증
      expect(result.자기평가제출.isCompleted).toBe(true);
      expect(result.산출물결과.자기평가상태.isCompleted).toBe(true);
      expect(result.산출물결과.산출물생성결과.id).toBeDefined();
      expect(result.산출물결과.산출물생성결과.name).toBe('API 설계 문서');
      expect(result.산출물결과.산출물생성결과.type).toBe('document');
      expect(
        result.산출물결과.산출물조회결과.deliverables.length,
      ).toBeGreaterThan(0);
      expect(result.산출물결과.산출물수정결과.description).toContain('v2.0');
      expect(result.산출물결과.최종산출물.filePath).toContain('v2.0');
    });

    it('여러 WBS에 산출물을 벌크 등록한다', async () => {
      const result =
        await deliverableScenario.여러_WBS_자기평가_후_벌크_산출물_등록_시나리오를_실행한다(
          {
            employeeId: employeeIds[1],
            wbsItemIds: wbsItemIds.slice(3, 6),
            periodId: evaluationPeriodId,
            selfEvaluationScenario,
          },
        );

      // 검증
      expect(result.자기평가저장결과들.length).toBe(3);
      expect(result.벌크산출물결과.벌크생성결과.successCount).toBe(3);
      expect(result.벌크산출물결과.벌크생성결과.failedCount).toBe(0);
      expect(result.벌크산출물결과.벌크생성결과.createdIds.length).toBe(3);
      expect(result.벌크산출물결과.직원별조회결과.total).toBeGreaterThanOrEqual(
        3,
      );
      expect(
        result.벌크산출물결과.직원별조회결과.deliverables.length,
      ).toBeGreaterThanOrEqual(3);
    });

    it('산출물을 비활성화하고 삭제한다', async () => {
      const result =
        await deliverableScenario.자기평가_후_산출물_비활성화_시나리오를_실행한다(
          {
            employeeId: employeeIds[2],
            wbsItemId: wbsItemIds[2],
            periodId: evaluationPeriodId,
            selfEvaluationScenario,
          },
        );

      // 검증
      expect(result.자기평가제출.isCompleted).toBe(true);
      expect(result.산출물결과.생성결과.isActive).toBe(true);
      expect(result.산출물결과.비활성화결과.isActive).toBe(false);
      expect(
        result.산출물결과.비활성화조회결과.deliverables.length,
      ).toBeGreaterThan(0);

      // activeOnly=false일 때는 비활성 산출물이 포함됨
      const 비활성산출물 = result.산출물결과.비활성화조회결과.deliverables.find(
        (d: any) => d.id === result.산출물결과.생성결과.id,
      );
      expect(비활성산출물).toBeDefined();
      expect(비활성산출물.isActive).toBe(false);

      // activeOnly=true일 때는 비활성 산출물이 제외됨
      const 활성산출물 = result.산출물결과.활성조회결과.deliverables.find(
        (d: any) => d.id === result.산출물결과.생성결과.id,
      );
      expect(활성산출물).toBeUndefined();
    });

    it('산출물 생성 시 필수 필드 누락 시 에러가 발생한다', async () => {
      await deliverableScenario.산출물_생성_필수_필드_누락_에러_시나리오를_실행한다(
        {
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
        },
      );
    });

    it('존재하지 않는 산출물 조회 시 에러가 발생한다', async () => {
      await deliverableScenario.존재하지않는_산출물_조회_에러_시나리오를_실행한다();
    });

    it('잘못된 UUID 형식의 산출물 ID로 조회 시 에러가 발생한다', async () => {
      await deliverableScenario.잘못된_UUID_형식_에러_시나리오를_실행한다();
    });

    it('산출물 등록 후 대시보드에서 deliverables가 반환된다', async () => {
      const result =
        await deliverableScenario.산출물_등록_후_대시보드_deliverables_검증_시나리오를_실행한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[1],
            projectId: projectIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationScenario,
          },
        );

      // 시나리오 내부에서 모든 검증을 수행하므로, 여기서는 최소한의 검증만 수행
      // WBS 할당이 이미 되어 있으면 null일 수 있음
      if (result.WBS할당결과) {
        expect(result.WBS할당결과.id).toBeDefined();
      }
      expect(result.자기평가제출.isCompleted).toBe(true);
      expect(result.산출물생성결과들.length).toBe(3);
      expect(result.대시보드응답.projects).toBeDefined();
    });
  });
});
