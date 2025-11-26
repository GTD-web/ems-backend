import { BaseE2ETest } from '../../base-e2e.spec';
import { SeedDataScenario } from '../../usecase/scenarios/seed-data.scenario';
import { EvaluationPeriodScenario } from '../../usecase/scenarios/evaluation-period.scenario';
import { WbsAssignmentApiClient } from '../../usecase/scenarios/api-clients/wbs-assignment.api-client';
import { ProjectAssignmentApiClient } from '../../usecase/scenarios/api-clients/project-assignment.api-client';
import { DashboardApiClient } from '../../usecase/scenarios/api-clients/dashboard.api-client';
import { EmployeeManagementApiClient } from '../../usecase/scenarios/api-clients/employee-management.api-client';

/**
 * 프로젝트 PM을 2차 평가자로 설정하는 기능 테스트
 */
describe('WBS 할당 시 프로젝트 PM을 2차 평가자로 설정 테스트', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;
  let dashboardApiClient: DashboardApiClient;
  let employeeApiClient: EmployeeManagementApiClient;

  let evaluationPeriodId: string;
  let employeeId: string; // 피평가자
  let managerId: string; // 1차 평가자 (관리자)
  let pmId: string; // 2차 평가자 (프로젝트 PM)
  let projectId: string;
  let wbsItemId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
    projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
    dashboardApiClient = new DashboardApiClient(testSuite);
    employeeApiClient = new EmployeeManagementApiClient(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('PM이 설정된 프로젝트에 WBS 할당', () => {
    beforeEach(async () => {
      // 시드 데이터 생성
      const seedResult = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        projectCount: 1,
        wbsPerProject: 1,
        departmentCount: 1,
        employeeCount: 3, // 피평가자 1명, 관리자 1명, PM 1명
      });

      const employeeIds = seedResult.employeeIds || [];
      const projectIds = seedResult.projectIds || [];
      const wbsItemIds = seedResult.wbsItemIds || [];

      if (employeeIds.length < 3) {
        throw new Error('테스트를 위해 최소 3명의 직원이 필요합니다.');
      }

      employeeId = employeeIds[0]; // 피평가자
      managerId = employeeIds[1]; // 1차 평가자
      pmId = employeeIds[2]; // 2차 평가자 (PM)
      projectId = projectIds[0];
      wbsItemId = wbsItemIds[0];

      console.log('\n📍 테스트 데이터 설정:');
      console.log(`  - 피평가자 ID: ${employeeId}`);
      console.log(`  - 관리자 ID: ${managerId}`);
      console.log(`  - PM ID: ${pmId}`);
      console.log(`  - 프로젝트 ID: ${projectId}`);
      console.log(`  - WBS ID: ${wbsItemId}`);

      // 평가기간 생성
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const 평가기간 = await evaluationPeriodScenario.평가기간을_생성한다({
        name: `PM 2차 평가자 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: 'PM을 2차 평가자로 설정하는 기능 테스트',
        maxSelfEvaluationRate: 120,
      });

      evaluationPeriodId = 평가기간.id;

      // DB에서 직접 직원 정보 조회
      const { getRepository } = require('typeorm');
      const { Employee } = require('@domain/common/employee/employee.entity');
      const { Project } = require('@domain/common/project/project.entity');

      const employeeRepository = getRepository(Employee);
      const projectRepository = getRepository(Project);

      const 피평가자 = await employeeRepository.findOne({ where: { id: employeeId } });
      const 관리자 = await employeeRepository.findOne({ where: { id: managerId } });
      const PM = await employeeRepository.findOne({ where: { id: pmId } });
      const 프로젝트 = await projectRepository.findOne({ where: { id: projectId } });

      if (!피평가자 || !관리자 || !PM || !프로젝트) {
        throw new Error('필요한 엔티티를 찾을 수 없습니다');
      }

      // 피평가자의 managerId 설정
      피평가자.managerId = 관리자.externalId;
      await employeeRepository.save(피평가자);

      // 프로젝트의 managerId 설정
      프로젝트.managerId = PM.externalId;
      await projectRepository.save(프로젝트);

      console.log('\n✅ PM이 설정된 프로젝트 준비 완료');
      console.log(`  - 관리자 externalId: ${관리자.externalId}`);
      console.log(`  - PM externalId: ${PM.externalId}`);

      // 평가 대상자 등록
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/bulk`)
        .send({
          employeeIds: [employeeId],
        })
        .expect(201);
    });

    it('WBS 할당 시 PM이 2차 평가자로 설정되고 이름이 올바르게 조회되어야 한다', async () => {
      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
      });

      console.log('\n📍 1단계: 프로젝트 할당 완료');

      // 2. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId,
        wbsItemId,
        projectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 2단계: WBS 할당 완료');

      // 3. 직원 할당 정보 조회
      const 할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId,
      });

      console.log('\n📍 3단계: 할당 정보 조회 완료');
      console.log(
        '할당정보:',
        JSON.stringify(할당정보, null, 2).substring(0, 1000),
      );

      // 검증
      expect(할당정보.projects).toBeDefined();
      expect(할당정보.projects.length).toBeGreaterThan(0);

      const 프로젝트 = 할당정보.projects[0];
      expect(프로젝트.projectManager).toBeDefined();
      expect(프로젝트.projectManager).not.toBeNull();
      expect(프로젝트.projectManager.id).toBe(pmId);

      expect(프로젝트.wbsList).toBeDefined();
      expect(프로젝트.wbsList.length).toBeGreaterThan(0);

      const wbs = 프로젝트.wbsList[0];
      expect(wbs.secondaryDownwardEvaluation).toBeDefined();
      expect(wbs.secondaryDownwardEvaluation.evaluatorId).toBe(pmId);
      expect(wbs.secondaryDownwardEvaluation.evaluatorName).toBeDefined();
      expect(wbs.secondaryDownwardEvaluation.evaluatorName).not.toBe('');

      console.log('\n✅ 검증 완료:');
      console.log(`  - PM ID: ${프로젝트.projectManager.id}`);
      console.log(`  - PM 이름: ${프로젝트.projectManager.name}`);
      console.log(
        `  - 2차 평가자 ID: ${wbs.secondaryDownwardEvaluation.evaluatorId}`,
      );
      console.log(
        `  - 2차 평가자 이름: ${wbs.secondaryDownwardEvaluation.evaluatorName}`,
      );
    });

    it('summary에서도 2차 평가자 이름이 올바르게 조회되어야 한다', async () => {
      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
      });

      // 2. WBS 할당
      await wbsAssignmentApiClient.create({
        employeeId,
        wbsItemId,
        projectId,
        periodId: evaluationPeriodId,
      });

      // 3. 직원 할당 정보 조회
      const 할당정보 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId,
      });

      // 검증
      expect(할당정보.summary).toBeDefined();
      expect(할당정보.summary.secondaryDownwardEvaluation).toBeDefined();
      expect(
        할당정보.summary.secondaryDownwardEvaluation.evaluators,
      ).toBeDefined();
      expect(
        할당정보.summary.secondaryDownwardEvaluation.evaluators.length,
      ).toBeGreaterThan(0);

      const 이차평가자 =
        할당정보.summary.secondaryDownwardEvaluation.evaluators[0];
      expect(이차평가자.evaluatorId).toBe(pmId);
      expect(이차평가자.evaluatorName).toBeDefined();
      expect(이차평가자.evaluatorName).not.toBe('알 수 없음');
      expect(이차평가자.evaluatorName).not.toBe('');

      console.log('\n✅ Summary 검증 완료:');
      console.log(`  - 2차 평가자 ID: ${이차평가자.evaluatorId}`);
      console.log(`  - 2차 평가자 이름: ${이차평가자.evaluatorName}`);
      console.log(`  - 사번: ${이차평가자.evaluatorEmployeeNumber}`);
      console.log(`  - 이메일: ${이차평가자.evaluatorEmail}`);
    });
  });
});

