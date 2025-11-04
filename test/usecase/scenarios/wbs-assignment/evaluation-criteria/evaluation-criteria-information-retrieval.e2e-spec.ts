import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsAssignmentApiClient } from '../../api-clients/wbs-assignment.api-client';
import { ProjectAssignmentApiClient } from '../../api-clients/project-assignment.api-client';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';

/**
 * 평가기준 정보 조회 검증 시나리오
 *
 * 테스트 목적:
 * - 대시보드 API를 통해 평가기준 정보가 올바르게 조회되는지 검증
 */
describe('평가기준 정보 조회 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // API 클라이언트
  let dashboardApiClient: DashboardApiClient;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);

    // API 클라이언트 인스턴스 생성
    dashboardApiClient = new DashboardApiClient(testSuite);
    wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
    projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 3,
      wbsPerProject: 5,
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
      name: '평가기준 정보 조회 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가기준 정보 조회 검증 E2E 테스트용 평가기간',
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
      .expect(HttpStatus.CREATED);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(HttpStatus.OK);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      if (evaluationPeriodId) {
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(HttpStatus.OK);

        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      }
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  describe('대시보드 API를 통한 평가기준 정보 검증', () => {
    it('직원 할당 데이터 조회 시 평가기준 정보가 포함되어야 한다', async () => {
      const testEmployeeId = employeeIds[1];
      const testProjectId = projectIds[1];
      const testWbsItemId = wbsItemIds[5];

      console.log('\n📍 대시보드 평가기준 정보 검증 시작');

      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 1단계: 프로젝트 할당 완료');

      // 2. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 2단계: WBS 할당 완료');

      // 3. 직원 할당 데이터 조회 검증
      const 할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      console.log(`📊 할당된 프로젝트 수: ${할당데이터.projects?.length || 0}`);

      // projects 배열 존재 확인
      expect(할당데이터.projects).toBeDefined();
      expect(할당데이터.projects.length).toBeGreaterThan(0); // projects 배열 길이가 0보다 큼

      // 프로젝트 정보 검증
      const 프로젝트 = 할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );
      expect(프로젝트).toBeDefined(); // 할당한 projectId에 해당하는 프로젝트 존재 확인
      expect(프로젝트.projectName).toBeDefined(); // projectName 정보 일치 확인
      expect(프로젝트.projectCode).toBeDefined(); // projectCode 정보 일치 확인

      // WBS 목록 검증
      expect(프로젝트.wbsList).toBeDefined(); // 해당 프로젝트의 wbsList 배열 존재 확인
      expect(프로젝트.wbsList.length).toBeGreaterThan(0); // wbsList 배열 길이가 0보다 큼

      const wbs = 프로젝트.wbsList.find((w: any) => w.wbsId === testWbsItemId);
      expect(wbs).toBeDefined(); // 할당한 wbsItemId에 해당하는 WBS 존재 확인
      expect(wbs.wbsId).toBe(testWbsItemId); // wbsId 일치
      expect(wbs.wbsName).toBeDefined(); // wbsName 정보 일치 확인
      expect(wbs.wbsCode).toBeDefined(); // wbsCode 정보 일치 확인

      // 평가기준 정보 검증
      expect(wbs.criteria).toBeDefined(); // WBS의 criteria 배열 존재 확인
      expect(Array.isArray(wbs.criteria)).toBe(true); // criteria가 배열 타입인지 확인
      expect(wbs.criteria.length).toBeGreaterThan(0); // criteria 배열에 요소가 있는지 확인 (자동 생성된 평가기준)

      const 평가기준 = wbs.criteria[0];
      expect(평가기준.criteria).toBeDefined(); // criteria 필드 존재 확인
      expect(평가기준.importance).toBeDefined(); // importance 필드 존재 확인
      expect(평가기준.criterionId).toBeDefined(); // criterionId 필드 존재 확인 (id 대신 criterionId 사용)
      expect(typeof 평가기준.criterionId).toBe('string');
      expect(평가기준.criterionId.length).toBeGreaterThan(0);

      console.log('✅ 직원 할당 데이터 조회 검증 완료');
      console.log(`  - 프로젝트 ID: ${프로젝트.projectId}`);
      console.log(`  - 프로젝트명: ${프로젝트.projectName}`);
      console.log(`  - WBS ID: ${wbs.wbsId}`);
      console.log(`  - WBS명: ${wbs.wbsName}`);
      console.log(`  - 평가기준 개수: ${wbs.criteria.length}`);
      console.log(`  - 평가기준 중요도: ${평가기준.importance}`);
    });

    it('직원 평가기간 현황 조회 시 평가항목 상태 정보가 포함되어야 한다', async () => {
      const testEmployeeId = employeeIds[2];
      const testProjectId = projectIds[2];
      const testWbsItemId = wbsItemIds[10];

      console.log('\n📍 대시보드 평가항목 상태 검증 시작');

      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 1단계: 프로젝트 할당 완료');

      // 2. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 2단계: WBS 할당 완료');

      // 직원 평가기간 현황 조회 검증
      const 직원현황 =
        await dashboardApiClient.getEmployeeEvaluationPeriodStatus({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      console.log(`📊 직원 이름: ${직원현황.employee?.name || '없음'}`);

      // employee 정보 존재 확인
      expect(직원현황.employee).toBeDefined();
      expect(직원현황.employeeId).toBe(testEmployeeId); // employeeId 일치 확인

      // 평가항목 상태 검증
      expect(직원현황.evaluationCriteria).toBeDefined(); // evaluationCriteria 객체 존재 확인
      expect(직원현황.evaluationCriteria.status).toBe('complete'); // evaluationCriteria.status가 'complete'인지 확인 (WBS 할당 완료)
      expect(직원현황.evaluationCriteria.assignedProjectCount).toBeDefined(); // assignedProjectCount 확인
      expect(직원현황.evaluationCriteria.assignedWbsCount).toBeDefined(); // assignedWbsCount 확인

      console.log('✅ 직원 평가기간 현황 조회 검증 완료');
      console.log(`  - 평가항목 상태: ${직원현황.evaluationCriteria.status}`);
      console.log(
        `  - 할당된 프로젝트 수: ${직원현황.evaluationCriteria.assignedProjectCount}`,
      );
      console.log(
        `  - 할당된 WBS 수: ${직원현황.evaluationCriteria.assignedWbsCount}`,
      );
    });
  });
});








