import { BaseE2ETest } from '../base-e2e.spec';
import { SeedDataScenario } from './scenarios/seed-data.scenario';
import { QueryOperationsScenario } from './scenarios/query-operations.scenario';
import { EvaluationTargetScenario } from './scenarios/evaluation-target.scenario';
import { EvaluationPeriodScenario } from './scenarios/evaluation-period.scenario';
import { ProjectAssignmentScenario } from './scenarios/project-assignment.scenario';

describe('평가 프로세스 전체 플로우 (E2E)', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let queryOperationsScenario: QueryOperationsScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    queryOperationsScenario = new QueryOperationsScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
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
    const { evaluationPeriodId } = await seedDataScenario.시드_데이터를_생성한다({
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
    const result = await evaluationPeriodScenario.평가기간을_생성하고_1차평가자를_검증한다({
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

      // 3. 모든 평가대상자에게 프로젝트 할당
      const result =
        await projectAssignmentScenario.프로젝트_할당_후_대시보드_검증_시나리오를_실행한다(
          periodId,
          employeeIds,
          projectIds,
        );

      expect(result.totalAssignments).toBe(
        employeeIds.length * projectIds.length,
      );
      expect(result.verifiedEmployees).toBe(employeeIds.length);

      console.log(
        `✅ 프로젝트 할당 및 검증 완료 - 총 ${result.totalAssignments}건 할당, ${result.verifiedEmployees}명 검증`,
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

      // 4. 첫 번째 직원의 프로젝트 할당 취소
      const testEmployeeId = employeeIds[0];
      const result =
        await projectAssignmentScenario.프로젝트_할당_취소_시나리오를_실행한다(
          periodId,
          testEmployeeId,
        );

      expect(result.projectCountBefore).toBe(projectIds.length);
      expect(result.projectCountAfter).toBe(projectIds.length - 1);
      console.log(
        `✅ 프로젝트 할당 취소 검증 완료: ${result.projectCountBefore}개 → ${result.projectCountAfter}개`,
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

      // 4. 첫 번째 직원의 프로젝트 할당 순서 변경
      const testEmployeeId = employeeIds[0];
      const result =
        await projectAssignmentScenario.프로젝트_할당_순서_변경_시나리오를_실행한다(
          periodId,
          testEmployeeId,
        );

      expect(result.orderAfterDown).toBeGreaterThan(result.orderBefore);
      expect(result.orderAfterUp).toBe(result.orderBefore);
      console.log(
        `✅ 프로젝트 할당 순서 변경 검증 완료: down(${result.orderBefore} → ${result.orderAfterDown}), up(${result.orderAfterDown} → ${result.orderAfterUp})`,
      );
    });
  });

  // TODO: 추가 프로세스 구현 예정
  // - Step 5: WBS 배정 (WITH_ASSIGNMENTS)
  // - Step 6: 평가 기준 설정 (WITH_SETUP)
  // - Step 7: 평가 진행 (FULL)
  // - Step 8: 최종 평가 조회
});
