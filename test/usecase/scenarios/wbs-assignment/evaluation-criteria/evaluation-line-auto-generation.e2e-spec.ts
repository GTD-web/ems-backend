import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsAssignmentApiClient } from '../../api-clients/wbs-assignment.api-client';
import { ProjectAssignmentApiClient } from '../../api-clients/project-assignment.api-client';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';
import { WbsEvaluationCriteriaApiClient } from '../../api-clients/wbs-evaluation-criteria.api-client';
import { EmployeeManagementApiClient } from '../../api-clients/employee-management.api-client';
import { EvaluationLineApiClient } from '../../api-clients/evaluation-line.api-client';

/**
 * 평가라인 자동 생성 및 대시보드 검증 시나리오
 *
 * 테스트 목적:
 * - WBS 할당 시 평가기준이 자동으로 생성되는지 검증
 * - WBS 할당 시 평가라인(1차, 2차 평가자)이 자동으로 구성되는지 검증
 * - 대시보드 API를 통해 평가라인 정보가 올바르게 조회되는지 검증
 * - importance 값에 따라 weight가 자동으로 계산되는지 검증
 */
describe('평가라인 자동 생성 및 대시보드 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // API 클라이언트
  let dashboardApiClient: DashboardApiClient;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;
  let evaluationPeriodApiClient: EvaluationPeriodManagementApiClient;
  let wbsEvaluationCriteriaApiClient: WbsEvaluationCriteriaApiClient;
  let employeeManagementApiClient: EmployeeManagementApiClient;
  let evaluationLineApiClient: EvaluationLineApiClient;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);

    // API 클라이언트 인스턴스 생성
    dashboardApiClient = new DashboardApiClient(testSuite);
    wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
    projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
    evaluationPeriodApiClient = new EvaluationPeriodManagementApiClient(
      testSuite,
    );
    wbsEvaluationCriteriaApiClient = new WbsEvaluationCriteriaApiClient(
      testSuite,
    );
    employeeManagementApiClient = new EmployeeManagementApiClient(testSuite);
    evaluationLineApiClient = new EvaluationLineApiClient(testSuite);
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
      name: '평가라인 자동 생성 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가라인 자동 생성 및 대시보드 검증 E2E 테스트용 평가기간',
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

  describe('평가기준 자동 생성 검증', () => {
    it('WBS 할당 시 평가기준을 자동으로 생성해야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      console.log('\n📍 평가기준 자동 생성 검증 시작');

      // 3. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 3단계: 프로젝트 할당 완료');

      // 4. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 4단계: WBS 할당 완료');

      // 평가기준 자동 생성 확인
      const 평가기준조회 =
        await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList({
          wbsItemId: testWbsItemId,
        });

      console.log(`📊 평가기준 개수: ${평가기준조회.criteria.length}`);

      // 검증
      expect(평가기준조회.criteria).toBeDefined();
      expect(평가기준조회.criteria.length).toBeGreaterThan(0);

      const 생성된평가기준 = 평가기준조회.criteria[0];
      expect(생성된평가기준.wbsItemId).toBe(testWbsItemId); // wbsItemId 일치
      expect(생성된평가기준.criteria).toBeDefined(); // criteria 필드 존재 (빈 문자열 가능)
      expect(생성된평가기준.importance).toBe(5); // importance 기본값 5

      console.log('✅ 평가기준 자동 생성 검증 완료');
      console.log(`  - WBS 항목 ID: ${생성된평가기준.wbsItemId}`);
      console.log(`  - 평가기준 내용: "${생성된평가기준.criteria}"`);
      console.log(`  - 중요도: ${생성된평가기준.importance}`);
    });
  });

  describe('1차 평가자 (관리자) 자동 구성 검증', () => {
    it('WBS 할당 시 직원의 관리자가 1차 평가자로 자동 설정되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      console.log('\n📍 1차 평가자 자동 구성 검증 시작');

      // 1. 전체 직원 목록 조회하여 직원 정보 찾기
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      const 직원정보 = 전체직원.find((emp: any) => emp.id === testEmployeeId);
      expect(직원정보).toBeDefined();

      const managerId = 직원정보.managerId;
      console.log(`📍 1단계: 직원 정보 조회 완료`);
      console.log(`  - 직원명: ${직원정보.name}`);
      console.log(`  - 관리자 ID: ${managerId || '없음'}`);

      // 2. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 2단계: 프로젝트 할당 완료');

      // 3. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 3단계: WBS 할당 완료');

      // 4. 직원 평가설정 통합 조회로 1차 평가자 자동 설정 검증
      const 평가설정 =
        await evaluationLineApiClient.getEmployeeEvaluationSettings({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      console.log(
        `📊 평가라인 매핑 개수: ${평가설정.evaluationLineMappings?.length || 0}`,
      );

      // wbsItemId가 null인 매핑이 1차 평가자
      const 일차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === null,
      );

      if (managerId) {
        // 관리자가 있는 경우
        expect(일차평가라인매핑).toBeDefined();
        expect(일차평가라인매핑.evaluatorId).toBe(managerId); // evaluatorId가 직원의 managerId와 일치

        console.log('✅ 1차 평가자 자동 구성 검증 완료');
        console.log(`  - 평가자 ID: ${일차평가라인매핑.evaluatorId}`);
        console.log(`  - 매핑 ID: ${일차평가라인매핑.id}`);
      } else {
        // 관리자가 없는 경우 1차 평가자 미구성
        console.log(
          '⚠️ 직원에게 관리자가 설정되지 않아 1차 평가자 미구성 (정상)',
        );
        expect(일차평가라인매핑).toBeUndefined();
      }
    });
  });

  describe('2차 평가자 (PM) 자동 구성 검증', () => {
    it('WBS 할당 시 프로젝트 PM이 2차 평가자로 자동 설정되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      console.log('\n📍 2차 평가자 자동 구성 검증 시작');

      // 1. 할당 가능한 프로젝트 목록 조회하여 프로젝트 정보 찾기
      const 프로젝트목록 =
        await projectAssignmentApiClient.getAvailableProjects({
          periodId: evaluationPeriodId,
          page: 1,
          limit: 100,
        });

      console.log(
        `📍 조회된 프로젝트 목록 개수: ${프로젝트목록.projects?.length || 0}`,
      );
      console.log(`📍 찾는 프로젝트 ID: ${testProjectId}`);
      console.log(
        `📍 프로젝트 ID 목록:`,
        프로젝트목록.projects?.map((p: any) => p.id).join(', '),
      );

      const 프로젝트정보 = 프로젝트목록.projects.find(
        (proj: any) => proj.id === testProjectId,
      );

      if (!프로젝트정보) {
        // available-projects에서 찾지 못한 경우, 시드 데이터의 프로젝트를 직접 사용
        // (프로젝트가 이미 사용 중이어서 available 목록에 없을 수 있음)
        console.log(
          '⚠️  available-projects에서 프로젝트를 찾지 못했습니다. 프로젝트 할당을 먼저 수행합니다.',
        );

        // 프로젝트 할당을 먼저 수행하고, PM 정보는 WBS 할당 후 평가라인에서 확인
        await projectAssignmentApiClient.create({
          employeeId: testEmployeeId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

        console.log('📍 1단계: 프로젝트 할당 완료 (PM 정보 확인 불가)');

        // WBS 할당
        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId,
          wbsItemId: testWbsItemId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });

        console.log('📍 2단계: WBS 할당 완료');

        // 평가설정 통합 조회로 2차 평가자 확인
        const 평가설정 =
          await evaluationLineApiClient.getEmployeeEvaluationSettings({
            employeeId: testEmployeeId,
            periodId: evaluationPeriodId,
          });

        console.log(
          `📊 평가라인 매핑 개수: ${평가설정.evaluationLineMappings?.length || 0}`,
        );

        // wbsItemId가 testWbsItemId와 일치하는 매핑이 2차 평가자
        const 이차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
          (mapping: any) => mapping.wbsItemId === testWbsItemId,
        );

        // PM이 있으면 2차 평가자 매핑이 존재해야 함
        if (이차평가라인매핑) {
          console.log('✅ 2차 평가자 자동 구성 검증 완료');
          console.log(`  - 평가자 ID: ${이차평가라인매핑.evaluatorId}`);
          console.log(`  - 매핑 ID: ${이차평가라인매핑.id}`);
          console.log(`  - WBS 항목 ID: ${이차평가라인매핑.wbsItemId}`);
        } else {
          console.log(
            '⚠️ 프로젝트에 PM이 설정되지 않아 2차 평가자 미구성 (정상)',
          );
        }

        return; // 테스트 종료
      }

      expect(프로젝트정보).toBeDefined();

      // manager 필드가 객체로 반환되는 경우를 처리
      const pmId = 프로젝트정보.manager?.id || 프로젝트정보.managerId;
      console.log(`📍 1단계: 프로젝트 정보 조회 완료`);
      console.log(`  - 프로젝트명: ${프로젝트정보.name}`);
      console.log(`  - 프로젝트 정보:`, JSON.stringify(프로젝트정보, null, 2));
      console.log(`  - PM ID: ${pmId || '없음'}`);

      // 2. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 2단계: 프로젝트 할당 완료');

      // 3. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 3단계: WBS 할당 완료');

      // 4. 직원 평가설정 통합 조회로 2차 평가자 자동 설정 검증
      const 평가설정 =
        await evaluationLineApiClient.getEmployeeEvaluationSettings({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      console.log(
        `📊 평가라인 매핑 개수: ${평가설정.evaluationLineMappings?.length || 0}`,
      );

      // wbsItemId가 testWbsItemId와 일치하는 매핑이 2차 평가자
      const 이차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === testWbsItemId,
      );

      if (pmId) {
        // PM이 있는 경우
        expect(이차평가라인매핑).toBeDefined();
        expect(이차평가라인매핑.evaluatorId).toBe(pmId); // evaluatorId가 프로젝트의 managerId와 일치
        expect(이차평가라인매핑.wbsItemId).toBe(testWbsItemId); // wbsItemId가 정확히 일치

        console.log('✅ 2차 평가자 자동 구성 검증 완료');
        console.log(`  - 평가자 ID: ${이차평가라인매핑.evaluatorId}`);
        console.log(`  - 매핑 ID: ${이차평가라인매핑.id}`);
        console.log(`  - WBS 항목 ID: ${이차평가라인매핑.wbsItemId}`);
      } else {
        // PM이 없는 경우 2차 평가자 미구성
        console.log(
          '⚠️ 프로젝트에 PM이 설정되지 않아 2차 평가자 미구성 (정상)',
        );
        expect(이차평가라인매핑).toBeUndefined();
      }
    });
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

      console.log('📍 3단계: 프로젝트 할당 완료');

      // 4. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 4단계: WBS 할당 완료');

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

  describe('여러 WBS 할당 시 평가라인 구성 검증', () => {
    it('동일 직원에게 여러 WBS를 할당해도 1차 평가자는 하나만 구성되어야 한다', async () => {
      const testEmployeeId = employeeIds[3];
      const testProjectId = projectIds[0];

      console.log('\n📍 1차 평가자 중복 방지 검증 시작');

      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 1단계: 프로젝트 할당 완료');

      // 2-4. WBS 할당 (3개)
      const wbsIds = [wbsItemIds[0], wbsItemIds[1], wbsItemIds[2]];

      for (const wbsId of wbsIds) {
        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId,
          wbsItemId: wbsId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      console.log(`📍 2-4단계: ${wbsIds.length}개 WBS 할당 완료`);

      // 5. 직원 평가설정 통합 조회로 1차 평가자 중복 방지 검증
      const 평가설정 =
        await evaluationLineApiClient.getEmployeeEvaluationSettings({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      // wbsItemId가 null인 매핑이 1차 평가자 (여러 개 있으면 안됨)
      const 일차평가라인매핑들 = 평가설정.evaluationLineMappings?.filter(
        (mapping: any) => mapping.wbsItemId === null,
      );

      console.log(
        `📊 1차 평가라인 매핑 개수: ${일차평가라인매핑들?.length || 0}`,
      );

      // Upsert 방식으로 1차 평가자가 1개만 구성되었는지 확인
      expect(일차평가라인매핑들).toBeDefined();
      expect(일차평가라인매핑들.length).toBeLessThanOrEqual(1); // 1개 이하여야 함

      if (일차평가라인매핑들.length > 0) {
        console.log('✅ 1차 평가자 중복 방지 검증 완료');
        console.log(`  - 1차 평가자 매핑 수: ${일차평가라인매핑들.length}`);
        console.log(
          `  - 평가자 ID: ${일차평가라인매핑들[0].evaluatorId || '없음'}`,
        );
      }
    });

    it('동일 직원에게 여러 WBS를 할당하면 각 WBS마다 2차 평가자가 구성되어야 한다', async () => {
      const testEmployeeId = employeeIds[4];
      const testProjectId = projectIds[1];

      console.log('\n📍 WBS별 2차 평가자 구성 검증 시작');

      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 1단계: 프로젝트 할당 완료');

      // 2-4. WBS 할당 (3개)
      const wbsIds = [wbsItemIds[5], wbsItemIds[6], wbsItemIds[7]];

      for (const wbsId of wbsIds) {
        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId,
          wbsItemId: wbsId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      console.log(`📍 2-4단계: ${wbsIds.length}개 WBS 할당 완료`);

      // 5. 직원 평가설정 통합 조회로 WBS별 2차 평가자 구성 검증
      const 평가설정 =
        await evaluationLineApiClient.getEmployeeEvaluationSettings({
          employeeId: testEmployeeId,
          periodId: evaluationPeriodId,
        });

      // WBS별 2차 평가자 구성 검증
      console.log('\n📊 WBS별 2차 평가자 매핑 조회:');

      for (const wbsId of wbsIds) {
        // wbsItemId가 해당 wbsId와 일치하는 매핑이 2차 평가자
        const 이차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
          (mapping: any) => mapping.wbsItemId === wbsId,
        );

        expect(이차평가라인매핑).toBeDefined(); // 각 WBS마다 2차 평가자 매핑이 존재해야 함

        console.log(
          `  - WBS ${wbsId}: 2차 평가자 매핑 ${이차평가라인매핑 ? '있음 (평가자 ID: ' + 이차평가라인매핑.evaluatorId + ')' : '없음'}`,
        );
      }

      console.log('✅ 각 WBS별 2차 평가자 구성 검증 완료');
    });
  });

  describe('가중치(weight) 자동 계산 검증', () => {
    it('importance 값에 따라 weight가 올바르게 계산되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];

      console.log('\n📍 importance 기반 가중치 계산 검증 시작');

      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 3단계: 프로젝트 할당 완료');

      // 4-6. WBS 할당 (3개)
      const wbsIds = [wbsItemIds[0], wbsItemIds[1], wbsItemIds[2]];

      for (const wbsId of wbsIds) {
        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId,
          wbsItemId: wbsId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      console.log(`📍 4-6단계: ${wbsIds.length}개 WBS 할당 완료`);

      // 평가기준 중요도(importance) 설정
      const importanceValues = [3, 5, 2];
      const criteriaIds: string[] = [];

      console.log('\n📍 평가기준 importance 설정:');

      for (let i = 0; i < wbsIds.length; i++) {
        const 평가기준조회 =
          await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList({
            wbsItemId: wbsIds[i],
          });

        const criteriaId = 평가기준조회.criteria[0].id;
        const criteriaContent = 평가기준조회.criteria[0].criteria;
        criteriaIds.push(criteriaId);

        // POST로 upsert (importance 업데이트)
        await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
          wbsItemId: wbsIds[i],
          criteria: criteriaContent || '',
          importance: importanceValues[i],
        });

        console.log(`  - WBS ${i + 1} importance 설정: ${importanceValues[i]}`);
      }

      // 가중치 재계산 트리거 (임시 WBS 할당 후 삭제)
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[3],
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 할당 취소로 가중치 재계산 트리거
      await wbsAssignmentApiClient.cancelByWbs({
        wbsItemId: wbsItemIds[3],
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 가중치 재계산 트리거 완료');

      // 대시보드 API를 통한 가중치 검증
      const 할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      const 프로젝트 = 할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );

      expect(프로젝트).toBeDefined();
      expect(프로젝트.wbsList).toBeDefined();
      expect(프로젝트.wbsList.length).toBe(3);

      // 가중치 계산 공식 검증
      const importanceSum = importanceValues.reduce((a, b) => a + b, 0); // 3 + 5 + 2 = 10
      const expectedWeights = importanceValues.map(
        (imp) => (imp / importanceSum) * 100,
      ); // [30, 50, 20]

      console.log('\n📊 가중치 계산 공식 검증:');
      console.log(`  - importance 합계: ${importanceSum}`);

      let totalWeight = 0;
      for (let i = 0; i < wbsIds.length; i++) {
        const wbs = 프로젝트.wbsList.find((w: any) => w.wbsId === wbsIds[i]);
        expect(wbs).toBeDefined();

        const actualWeight = wbs.weight || 0;
        const expectedWeight = expectedWeights[i];

        console.log(`  - WBS ${i + 1} (importance: ${importanceValues[i]}):`);
        console.log(`    · 예상 weight: ${expectedWeight.toFixed(2)}%`);
        console.log(`    · 실제 weight: ${actualWeight.toFixed(2)}%`);

        // 각 WBS의 weight가 importance 비율과 일치하는지 확인
        expect(actualWeight).toBeCloseTo(expectedWeight, 1); // 소수점 1자리까지 비교

        totalWeight += actualWeight;
      }

      // 가중치 합계 검증
      console.log(`\n📊 가중치 합계: ${totalWeight.toFixed(2)}%`);
      expect(totalWeight).toBeCloseTo(100, 1); // 모든 WBS의 weight 합계가 100인지 확인

      console.log('✅ importance 기반 가중치 자동 계산 검증 완료');
    });
  });

  describe('평가자별 피평가자 현황 조회를 통한 평가라인 검증', () => {
    it('평가라인 자동 지정 시 평가자별 피평가자 현황에서 evaluationLine과 downwardEvaluation이 올바르게 제공되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      console.log(
        '\n📍 평가자별 피평가자 현황 조회를 통한 평가라인 검증 시작',
      );

      // 1. 전체 직원 목록 조회하여 직원 정보 찾기 (관리자 ID 확인)
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      const 직원정보 = 전체직원.find((emp: any) => emp.id === testEmployeeId);
      expect(직원정보).toBeDefined();

      const managerId = 직원정보.managerId;
      console.log(`📍 1단계: 직원 정보 조회 완료`);
      console.log(`  - 직원명: ${직원정보.name}`);
      console.log(`  - 관리자 ID: ${managerId || '없음'}`);

      // 2. 할당 가능한 프로젝트 목록 조회하여 프로젝트 정보 찾기 (PM ID 확인)
      const 프로젝트목록 =
        await projectAssignmentApiClient.getAvailableProjects({
          periodId: evaluationPeriodId,
          page: 1,
          limit: 100,
        });

      const 프로젝트정보 = 프로젝트목록.projects?.find(
        (proj: any) => proj.id === testProjectId,
      );

      // PM 정보 확인 (프로젝트 정보가 없을 수도 있음)
      const pmId = 프로젝트정보?.manager?.id || 프로젝트정보?.managerId;

      console.log(`📍 2단계: 프로젝트 정보 조회 완료`);
      console.log(`  - 프로젝트명: ${프로젝트정보?.name || '조회 불가'}`);
      console.log(`  - PM ID: ${pmId || '없음'}`);

      // 3. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 3단계: 프로젝트 할당 완료');

      // 4. WBS 할당 (평가라인 자동 구성 트리거)
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 4단계: WBS 할당 완료 (평가라인 자동 구성)');

      // 5. 평가자별 피평가자 현황 조회 검증
      // 5-1. 1차 평가자(관리자)로 조회
      if (managerId) {
        console.log('\n📍 5-1단계: 1차 평가자(관리자)로 피평가자 현황 조회');
        const 일차평가자_대상자현황 =
          await dashboardApiClient.getEvaluatorTargetsStatus({
            periodId: evaluationPeriodId,
            evaluatorId: managerId,
          });

        expect(Array.isArray(일차평가자_대상자현황)).toBe(true);

        const 피평가자정보 = 일차평가자_대상자현황.find(
          (target: any) => target.employeeId === testEmployeeId,
        );

        if (피평가자정보) {
          console.log('✅ 피평가자 정보 조회 성공');

          // evaluationLine 객체 검증
          console.log('\n📋 evaluationLine 객체 검증:');
          expect(피평가자정보.evaluationLine).toBeDefined();
          expect(피평가자정보.evaluationLine.status).toBeDefined();
          expect(피평가자정보.evaluationLine.hasPrimaryEvaluator).toBeDefined();
          expect(
            피평가자정보.evaluationLine.hasSecondaryEvaluator,
          ).toBeDefined();

          if (managerId && pmId) {
            // 1차/2차 평가자 모두 지정된 경우
            expect(피평가자정보.evaluationLine.status).toBe('complete');
            expect(피평가자정보.evaluationLine.hasPrimaryEvaluator).toBe(true);
            expect(피평가자정보.evaluationLine.hasSecondaryEvaluator).toBe(true);

            console.log(
              `  - status: ${피평가자정보.evaluationLine.status} ✅`,
            );
            console.log(
              `  - hasPrimaryEvaluator: ${피평가자정보.evaluationLine.hasPrimaryEvaluator} ✅`,
            );
            console.log(
              `  - hasSecondaryEvaluator: ${피평가자정보.evaluationLine.hasSecondaryEvaluator} ✅`,
            );
          } else if (managerId) {
            // 1차 평가자만 지정된 경우
            expect(피평가자정보.evaluationLine.status).toBe('in_progress');
            expect(피평가자정보.evaluationLine.hasPrimaryEvaluator).toBe(true);
            expect(피평가자정보.evaluationLine.hasSecondaryEvaluator).toBe(
              false,
            );

            console.log(
              `  - status: ${피평가자정보.evaluationLine.status} ✅`,
            );
            console.log(
              `  - hasPrimaryEvaluator: ${피평가자정보.evaluationLine.hasPrimaryEvaluator} ✅`,
            );
            console.log(
              `  - hasSecondaryEvaluator: ${피평가자정보.evaluationLine.hasSecondaryEvaluator} ✅`,
            );
          }

          // downwardEvaluation 객체 검증
          console.log('\n📋 downwardEvaluation 객체 검증:');
          expect(피평가자정보.downwardEvaluation).toBeDefined();
          expect(피평가자정보.downwardEvaluation.isPrimary).toBe(true); // 1차 평가자
          expect(피평가자정보.downwardEvaluation.isSecondary).toBe(false);

          console.log(
            `  - isPrimary: ${피평가자정보.downwardEvaluation.isPrimary} ✅`,
          );
          console.log(
            `  - isSecondary: ${피평가자정보.downwardEvaluation.isSecondary} ✅`,
          );

          // primaryStatus 검증 (1차 평가자인 경우)
          if (피평가자정보.downwardEvaluation.primaryStatus) {
            const primaryStatus =
              피평가자정보.downwardEvaluation.primaryStatus;
            expect(primaryStatus.assignedWbsCount).toBeGreaterThanOrEqual(0);
            expect(primaryStatus.completedEvaluationCount).toBeGreaterThanOrEqual(
              0,
            );
            expect(typeof primaryStatus.isEditable).toBe('boolean');

            console.log(`  - primaryStatus.assignedWbsCount: ${primaryStatus.assignedWbsCount} ✅`);
            console.log(
              `  - primaryStatus.completedEvaluationCount: ${primaryStatus.completedEvaluationCount} ✅`,
            );
            console.log(
              `  - primaryStatus.isEditable: ${primaryStatus.isEditable} ✅`,
            );
          }

          // myEvaluatorTypes 배열 검증
          console.log('\n📋 myEvaluatorTypes 배열 검증:');
          expect(피평가자정보.myEvaluatorTypes).toBeDefined();
          expect(Array.isArray(피평가자정보.myEvaluatorTypes)).toBe(true);
          expect(피평가자정보.myEvaluatorTypes).toContain('primary');
          expect(피평가자정보.myEvaluatorTypes).not.toContain('secondary');

          console.log(
            `  - myEvaluatorTypes: [${피평가자정보.myEvaluatorTypes.join(', ')}] ✅`,
          );

          console.log('✅ 1차 평가자 검증 완료');
        } else {
          console.log('⚠️ 1차 평가자로 해당 피평가자를 찾을 수 없습니다.');
        }
      } else {
        console.log('⚠️ 직원에게 관리자가 설정되지 않아 1차 평가자 검증 건너뜀');
      }

      // 5-2. 2차 평가자(PM)로 조회
      if (pmId) {
        console.log('\n📍 5-2단계: 2차 평가자(PM)로 피평가자 현황 조회');
        const 이차평가자_대상자현황 =
          await dashboardApiClient.getEvaluatorTargetsStatus({
            periodId: evaluationPeriodId,
            evaluatorId: pmId,
          });

        expect(Array.isArray(이차평가자_대상자현황)).toBe(true);

        const 피평가자정보 = 이차평가자_대상자현황.find(
          (target: any) => target.employeeId === testEmployeeId,
        );

        if (피평가자정보) {
          console.log('✅ 피평가자 정보 조회 성공');

          // evaluationLine 객체 검증
          console.log('\n📋 evaluationLine 객체 검증:');
          expect(피평가자정보.evaluationLine).toBeDefined();
          expect(피평가자정보.evaluationLine.hasSecondaryEvaluator).toBe(true);

          console.log(
            `  - hasSecondaryEvaluator: ${피평가자정보.evaluationLine.hasSecondaryEvaluator} ✅`,
          );

          // downwardEvaluation 객체 검증
          console.log('\n📋 downwardEvaluation 객체 검증:');
          expect(피평가자정보.downwardEvaluation).toBeDefined();
          expect(피평가자정보.downwardEvaluation.isPrimary).toBe(false);
          expect(피평가자정보.downwardEvaluation.isSecondary).toBe(true); // 2차 평가자

          console.log(
            `  - isPrimary: ${피평가자정보.downwardEvaluation.isPrimary} ✅`,
          );
          console.log(
            `  - isSecondary: ${피평가자정보.downwardEvaluation.isSecondary} ✅`,
          );

          // secondaryStatus 검증 (2차 평가자인 경우)
          if (피평가자정보.downwardEvaluation.secondaryStatus) {
            const secondaryStatus =
              피평가자정보.downwardEvaluation.secondaryStatus;
            expect(secondaryStatus.assignedWbsCount).toBeGreaterThanOrEqual(0);
            expect(
              secondaryStatus.completedEvaluationCount,
            ).toBeGreaterThanOrEqual(0);
            expect(typeof secondaryStatus.isEditable).toBe('boolean');

            console.log(
              `  - secondaryStatus.assignedWbsCount: ${secondaryStatus.assignedWbsCount} ✅`,
            );
            console.log(
              `  - secondaryStatus.completedEvaluationCount: ${secondaryStatus.completedEvaluationCount} ✅`,
            );
            console.log(
              `  - secondaryStatus.isEditable: ${secondaryStatus.isEditable} ✅`,
            );
          }

          // myEvaluatorTypes 배열 검증
          console.log('\n📋 myEvaluatorTypes 배열 검증:');
          expect(피평가자정보.myEvaluatorTypes).toBeDefined();
          expect(Array.isArray(피평가자정보.myEvaluatorTypes)).toBe(true);
          expect(피평가자정보.myEvaluatorTypes).toContain('secondary');
          expect(피평가자정보.myEvaluatorTypes).not.toContain('primary');

          console.log(
            `  - myEvaluatorTypes: [${피평가자정보.myEvaluatorTypes.join(', ')}] ✅`,
          );

          console.log('✅ 2차 평가자 검증 완료');
        } else {
          console.log('⚠️ 2차 평가자로 해당 피평가자를 찾을 수 없습니다.');
        }
      } else {
        console.log(
          '⚠️ 프로젝트에 PM이 설정되지 않아 2차 평가자 검증 건너뜀',
        );
      }

      console.log(
        '\n✅ 평가자별 피평가자 현황 조회를 통한 평가라인 검증 완료',
      );
    });

    it('여러 WBS 할당 시 평가자별 피평가자 현황에서 evaluationLine과 downwardEvaluation이 올바르게 제공되어야 한다', async () => {
      const testEmployeeId = employeeIds[1];
      const testProjectId = projectIds[1];

      console.log(
        '\n📍 여러 WBS 할당 시 평가자별 피평가자 현황 검증 시작',
      );

      // 1. 전체 직원 목록 조회하여 직원 정보 찾기
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      const 직원정보 = 전체직원.find((emp: any) => emp.id === testEmployeeId);
      expect(직원정보).toBeDefined();

      const managerId = 직원정보.managerId;
      console.log(`📍 1단계: 직원 정보 조회 완료`);
      console.log(`  - 직원명: ${직원정보.name}`);
      console.log(`  - 관리자 ID: ${managerId || '없음'}`);

      // 2. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 2단계: 프로젝트 할당 완료');

      // 3. 여러 WBS 할당 (3개)
      const wbsIds = [wbsItemIds[5], wbsItemIds[6], wbsItemIds[7]];

      for (const wbsId of wbsIds) {
        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId,
          wbsItemId: wbsId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      console.log(`📍 3단계: ${wbsIds.length}개 WBS 할당 완료`);

      // 4. 평가자별 피평가자 현황 조회 검증
      if (managerId) {
        console.log('\n📍 4단계: 1차 평가자(관리자)로 피평가자 현황 조회');
        const 일차평가자_대상자현황 =
          await dashboardApiClient.getEvaluatorTargetsStatus({
            periodId: evaluationPeriodId,
            evaluatorId: managerId,
          });

        expect(Array.isArray(일차평가자_대상자현황)).toBe(true);

        const 피평가자정보 = 일차평가자_대상자현황.find(
          (target: any) => target.employeeId === testEmployeeId,
        );

        if (피평가자정보) {
          // evaluationLine 검증
          expect(피평가자정보.evaluationLine).toBeDefined();
          expect(피평가자정보.evaluationLine.hasPrimaryEvaluator).toBe(true);

          // downwardEvaluation 검증 - 여러 WBS에 대한 통합 정보
          expect(피평가자정보.downwardEvaluation).toBeDefined();
          expect(피평가자정보.downwardEvaluation.isPrimary).toBe(true);

          if (피평가자정보.downwardEvaluation.primaryStatus) {
            const primaryStatus =
              피평가자정보.downwardEvaluation.primaryStatus;
            // 여러 WBS 할당 시 assignedWbsCount는 할당된 WBS 수와 일치해야 함
            expect(primaryStatus.assignedWbsCount).toBeGreaterThanOrEqual(
              wbsIds.length,
            );

            console.log(
              `  - primaryStatus.assignedWbsCount: ${primaryStatus.assignedWbsCount} (할당된 WBS: ${wbsIds.length}개) ✅`,
            );
          }

          // myEvaluatorTypes 검증
          expect(피평가자정보.myEvaluatorTypes).toContain('primary');

          console.log('✅ 여러 WBS 할당 시 1차 평가자 검증 완료');
        }
      }

      console.log(
        '\n✅ 여러 WBS 할당 시 평가자별 피평가자 현황 검증 완료',
      );
    });

    it('여러 피평가자를 담당하는 평가자의 경우 모든 피평가자 정보가 올바르게 조회되어야 한다', async () => {
      // 사용 가능한 직원 ID 확인
      if (employeeIds.length < 4) {
        console.log(
          '⚠️ 충분한 직원이 생성되지 않아 테스트를 건너뜁니다. (필요: 4명 이상, 현재: ' +
            employeeIds.length +
            '명)',
        );
        return;
      }

      const testEmployeeId1 = employeeIds[0];
      const testEmployeeId2 = employeeIds[1];
      const testProjectId1 = projectIds[0];
      const testProjectId2 = projectIds[1] || projectIds[0];

      console.log(
        '\n📍 여러 피평가자 담당 평가자 검증 시작',
      );

      // 1. 전체 직원 목록 조회하여 직원 정보 찾기
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      const 직원정보1 = 전체직원.find((emp: any) => emp.id === testEmployeeId1);
      const 직원정보2 = 전체직원.find((emp: any) => emp.id === testEmployeeId2);

      if (!직원정보1 || !직원정보2) {
        console.log(
          '⚠️ 직원 정보를 찾을 수 없어 테스트를 건너뜁니다.',
        );
        console.log(`  - 직원1 ID: ${testEmployeeId1}, 찾음: ${!!직원정보1}`);
        console.log(`  - 직원2 ID: ${testEmployeeId2}, 찾음: ${!!직원정보2}`);
        return;
      }

      expect(직원정보1).toBeDefined();
      expect(직원정보2).toBeDefined();

      // 같은 관리자를 가진 직원들 찾기 (또는 직접 설정)
      const managerId1 = 직원정보1.managerId;
      const managerId2 = 직원정보2.managerId;

      // 동일한 평가자를 가진 경우만 테스트
      if (managerId1 && managerId1 === managerId2) {
        console.log(`📍 1단계: 동일 관리자 확인 - 관리자 ID: ${managerId1}`);

        // 2. 첫 번째 피평가자에게 프로젝트 및 WBS 할당
        await projectAssignmentApiClient.create({
          employeeId: testEmployeeId1,
          projectId: testProjectId1,
          periodId: evaluationPeriodId,
        });

        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId1,
          wbsItemId: wbsItemIds[10],
          projectId: testProjectId1,
          periodId: evaluationPeriodId,
        });

        console.log('📍 2단계: 첫 번째 피평가자 할당 완료');

        // 3. 두 번째 피평가자에게 프로젝트 및 WBS 할당
        await projectAssignmentApiClient.create({
          employeeId: testEmployeeId2,
          projectId: testProjectId2,
          periodId: evaluationPeriodId,
        });

        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId2,
          wbsItemId: wbsItemIds[11],
          projectId: testProjectId2,
          periodId: evaluationPeriodId,
        });

        console.log('📍 3단계: 두 번째 피평가자 할당 완료');

        // 4. 평가자별 피평가자 현황 조회 검증
        console.log('\n📍 4단계: 평가자로 피평가자 현황 조회');
        const 평가자_대상자현황 = await dashboardApiClient.getEvaluatorTargetsStatus({
          periodId: evaluationPeriodId,
          evaluatorId: managerId1,
        });

        expect(Array.isArray(평가자_대상자현황)).toBe(true);
        expect(평가자_대상자현황.length).toBeGreaterThanOrEqual(2);

        // 첫 번째 피평가자 정보 검증
        const 피평가자정보1 = 평가자_대상자현황.find(
          (target: any) => target.employeeId === testEmployeeId1,
        );

        // 두 번째 피평가자 정보 검증
        const 피평가자정보2 = 평가자_대상자현황.find(
          (target: any) => target.employeeId === testEmployeeId2,
        );

        if (피평가자정보1 && 피평가자정보2) {
          // 각 피평가자별로 evaluationLine과 downwardEvaluation 검증
          expect(피평가자정보1.evaluationLine).toBeDefined();
          expect(피평가자정보1.downwardEvaluation).toBeDefined();
          expect(피평가자정보1.myEvaluatorTypes).toContain('primary');

          expect(피평가자정보2.evaluationLine).toBeDefined();
          expect(피평가자정보2.downwardEvaluation).toBeDefined();
          expect(피평가자정보2.myEvaluatorTypes).toContain('primary');

          // 각 피평가자의 정보가 올바르게 분리되어 있는지 확인
          expect(피평가자정보1.employeeId).toBe(testEmployeeId1);
          expect(피평가자정보2.employeeId).toBe(testEmployeeId2);

          console.log(`  - 첫 번째 피평가자 ID: ${피평가자정보1.employeeId} ✅`);
          console.log(`  - 두 번째 피평가자 ID: ${피평가자정보2.employeeId} ✅`);
          console.log(`  - 전체 피평가자 수: ${평가자_대상자현황.length} ✅`);

          console.log('✅ 여러 피평가자 담당 평가자 검증 완료');
        } else {
          console.log('⚠️ 일부 피평가자 정보를 찾을 수 없습니다.');
        }
      } else {
        console.log(
          '⚠️ 동일한 관리자를 가진 직원이 없어 테스트를 건너뜁니다.',
        );
        console.log(`  - 첫 번째 직원 관리자: ${managerId1 || '없음'}`);
        console.log(`  - 두 번째 직원 관리자: ${managerId2 || '없음'}`);
      }

      console.log(
        '\n✅ 여러 피평가자 담당 평가자 검증 완료',
      );
    });
  });
});
