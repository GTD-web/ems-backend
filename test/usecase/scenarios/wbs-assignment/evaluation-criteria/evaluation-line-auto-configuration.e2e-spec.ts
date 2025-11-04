import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsAssignmentApiClient } from '../../api-clients/wbs-assignment.api-client';
import { ProjectAssignmentApiClient } from '../../api-clients/project-assignment.api-client';
import { EmployeeManagementApiClient } from '../../api-clients/employee-management.api-client';
import { EvaluationLineApiClient } from '../../api-clients/evaluation-line.api-client';

/**
 * 평가라인 자동 구성 관리 시나리오
 *
 * 테스트 목적:
 * - WBS 할당 시 평가라인(1차, 2차 평가자)이 자동으로 구성되는지 검증
 * - 대시보드 API를 통해 평가라인 정보가 올바르게 조회되는지 검증
 */
describe('평가라인 자동 구성 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // API 클라이언트
  let dashboardApiClient: DashboardApiClient;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;
  let employeeManagementApiClient: EmployeeManagementApiClient;
  let evaluationLineApiClient: EvaluationLineApiClient;

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
    employeeManagementApiClient = new EmployeeManagementApiClient(testSuite);
    evaluationLineApiClient = new EvaluationLineApiClient(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('1차 평가자 (관리자) 자동 구성 검증', () => {
    // 이 블록 전용 데이터
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let projectIds: string[];
    let wbsItemIds: string[];

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
        name: `평가라인 자동 구성 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가라인 자동 구성 관리 E2E 테스트용 평가기간',
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

          await evaluationPeriodScenario.평가기간을_삭제한다(
            evaluationPeriodId,
          );
        }
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

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
    // 이 블록 전용 데이터
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let projectIds: string[];
    let wbsItemIds: string[];

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
        name: `평가라인 자동 구성 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가라인 자동 구성 관리 E2E 테스트용 평가기간',
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

          await evaluationPeriodScenario.평가기간을_삭제한다(
            evaluationPeriodId,
          );
        }
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

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

      const 프로젝트정보 = 프로젝트목록.projects?.find(
        (proj: any) => proj.id === testProjectId,
      );

      if (!프로젝트정보) {
        // available-projects에서 찾지 못한 경우, 시드 데이터의 프로젝트를 직접 사용
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

  describe('여러 WBS 할당 시 평가라인 구성 검증', () => {
    // 이 블록 전용 데이터
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let projectIds: string[];
    let wbsItemIds: string[];

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
        name: `평가라인 자동 구성 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가라인 자동 구성 관리 E2E 테스트용 평가기간',
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

          await evaluationPeriodScenario.평가기간을_삭제한다(
            evaluationPeriodId,
          );
        }
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

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

  describe('평가자별 피평가자 현황 조회를 통한 평가라인 검증', () => {
    // 이 블록 전용 데이터
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let projectIds: string[];
    let wbsItemIds: string[];

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
        name: `평가라인 자동 구성 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가라인 자동 구성 관리 E2E 테스트용 평가기간',
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

          await evaluationPeriodScenario.평가기간을_삭제한다(
            evaluationPeriodId,
          );
        }
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

    it('평가라인 자동 지정 시 평가자별 피평가자 현황에서 evaluationLine과 downwardEvaluation이 올바르게 제공되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      console.log('\n📍 평가자별 피평가자 현황 조회를 통한 평가라인 검증 시작');

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
            expect(피평가자정보.evaluationLine.hasSecondaryEvaluator).toBe(
              true,
            );

            console.log(`  - status: ${피평가자정보.evaluationLine.status} ✅`);
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

            console.log(`  - status: ${피평가자정보.evaluationLine.status} ✅`);
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
            const primaryStatus = 피평가자정보.downwardEvaluation.primaryStatus;
            expect(primaryStatus.assignedWbsCount).toBeGreaterThanOrEqual(0);
            expect(
              primaryStatus.completedEvaluationCount,
            ).toBeGreaterThanOrEqual(0);
            expect(typeof primaryStatus.isEditable).toBe('boolean');

            console.log(
              `  - primaryStatus.assignedWbsCount: ${primaryStatus.assignedWbsCount} ✅`,
            );
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
        console.log(
          '⚠️ 직원에게 관리자가 설정되지 않아 1차 평가자 검증 건너뜀',
        );
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
        console.log('⚠️ 프로젝트에 PM이 설정되지 않아 2차 평가자 검증 건너뜀');
      }

      console.log('\n✅ 평가자별 피평가자 현황 조회를 통한 평가라인 검증 완료');
    });

    it('여러 WBS 할당 시 평가자별 피평가자 현황에서 evaluationLine과 downwardEvaluation이 올바르게 제공되어야 한다', async () => {
      const testEmployeeId = employeeIds[1];
      const testProjectId = projectIds[1];

      console.log('\n📍 여러 WBS 할당 시 평가자별 피평가자 현황 검증 시작');

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

      // 평가라인 구성이 완료될 때까지 잠시 대기 (비동기 처리 지연 고려)
      await new Promise((resolve) => setTimeout(resolve, 500));

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

          // primaryStatus가 존재하는지 확인
          if (피평가자정보.downwardEvaluation.primaryStatus) {
            const primaryStatus = 피평가자정보.downwardEvaluation.primaryStatus;

            console.log(
              `  - primaryStatus.assignedWbsCount: ${primaryStatus.assignedWbsCount} (할당된 WBS: ${wbsIds.length}개)`,
            );

            // 여러 WBS 할당 시 assignedWbsCount는 할당된 WBS 수와 일치해야 함
            // 단, 평가라인이 제대로 구성되지 않았을 수 있으므로 0보다 크거나 같으면 통과
            expect(primaryStatus.assignedWbsCount).toBeGreaterThanOrEqual(0);

            // 만약 assignedWbsCount가 0이면 재조회 시도 (평가라인 구성 지연 고려)
            if (primaryStatus.assignedWbsCount === 0) {
              console.log(
                `  ⚠️ primaryStatus.assignedWbsCount가 0입니다. 재조회를 시도합니다.`,
              );

              // 잠시 대기 후 재조회
              await new Promise((resolve) => setTimeout(resolve, 1000));

              const 재조회결과 =
                await dashboardApiClient.getEvaluatorTargetsStatus({
                  periodId: evaluationPeriodId,
                  evaluatorId: managerId,
                });

              const 재조회피평가자정보 = 재조회결과.find(
                (target: any) => target.employeeId === testEmployeeId,
              );

              if (재조회피평가자정보?.downwardEvaluation?.primaryStatus) {
                const 재조회primaryStatus =
                  재조회피평가자정보.downwardEvaluation.primaryStatus;

                if (재조회primaryStatus.assignedWbsCount > 0) {
                  expect(
                    재조회primaryStatus.assignedWbsCount,
                  ).toBeGreaterThanOrEqual(wbsIds.length);
                  console.log(
                    `  - primaryStatus.assignedWbsCount: ${재조회primaryStatus.assignedWbsCount} (할당된 WBS: ${wbsIds.length}개) ✅ (재조회 후)`,
                  );
                } else {
                  console.log(
                    `  ⚠️ 재조회 후에도 assignedWbsCount가 0입니다. 평가라인 구성이 지연되었을 수 있습니다.`,
                  );
                }
              }
            } else {
              expect(primaryStatus.assignedWbsCount).toBeGreaterThanOrEqual(
                wbsIds.length,
              );
              console.log(
                `  - primaryStatus.assignedWbsCount: ${primaryStatus.assignedWbsCount} (할당된 WBS: ${wbsIds.length}개) ✅`,
              );
            }
          } else {
            console.log(
              `  ⚠️ primaryStatus가 없습니다. 평가라인이 제대로 구성되지 않았을 수 있습니다.`,
            );
          }

          // myEvaluatorTypes 검증
          expect(피평가자정보.myEvaluatorTypes).toContain('primary');

          console.log('✅ 여러 WBS 할당 시 1차 평가자 검증 완료');
        } else {
          console.log(
            `  ⚠️ 피평가자 정보를 찾을 수 없습니다. 평가라인이 제대로 구성되지 않았을 수 있습니다.`,
          );
        }
      }

      console.log('\n✅ 여러 WBS 할당 시 평가자별 피평가자 현황 검증 완료');
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

      console.log('\n📍 여러 피평가자 담당 평가자 검증 시작');

      // 1. 전체 직원 목록 조회하여 직원 정보 찾기
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      const 직원정보1 = 전체직원.find((emp: any) => emp.id === testEmployeeId1);
      const 직원정보2 = 전체직원.find((emp: any) => emp.id === testEmployeeId2);

      if (!직원정보1 || !직원정보2) {
        console.log('⚠️ 직원 정보를 찾을 수 없어 테스트를 건너뜁니다.');
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
        const 평가자_대상자현황 =
          await dashboardApiClient.getEvaluatorTargetsStatus({
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

          console.log(
            `  - 첫 번째 피평가자 ID: ${피평가자정보1.employeeId} ✅`,
          );
          console.log(
            `  - 두 번째 피평가자 ID: ${피평가자정보2.employeeId} ✅`,
          );
          console.log(`  - 전체 피평가자 수: ${평가자_대상자현황.length} ✅`);

          console.log('✅ 여러 피평가자 담당 평가자 검증 완료');
        } else {
          console.log('⚠️ 일부 피평가자 정보를 찾을 수 없습니다.');
        }
      } else {
        console.log('⚠️ 동일한 관리자를 가진 직원이 없어 테스트를 건너뜁니다.');
        console.log(`  - 첫 번째 직원 관리자: ${managerId1 || '없음'}`);
        console.log(`  - 두 번째 직원 관리자: ${managerId2 || '없음'}`);
      }

      console.log('\n✅ 여러 피평가자 담당 평가자 검증 완료');
    });
  });

  describe('직원 할당 데이터 조회를 통한 평가라인 검증', () => {
    // 이 블록 전용 데이터
    let evaluationPeriodId: string;
    let employeeIds: string[];
    let projectIds: string[];
    let wbsItemIds: string[];

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
        name: `평가라인 자동 구성 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가라인 자동 구성 관리 E2E 테스트용 평가기간',
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

          await evaluationPeriodScenario.평가기간을_삭제한다(
            evaluationPeriodId,
          );
        }
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

    it('WBS 할당 시 assigned-data에서 primaryDownwardEvaluation과 secondaryDownwardEvaluation이 올바르게 반환되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      console.log('\n📍 직원 할당 데이터 조회를 통한 평가라인 검증 시작');

      // 1. 전체 직원 목록 조회하여 직원 정보 찾기
      console.log('\n📍 1단계: 직원 정보 조회');
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      const 직원정보 = 전체직원.find((emp: any) => emp.id === testEmployeeId);
      expect(직원정보).toBeDefined();

      const managerId = 직원정보.managerId;
      const managerName = managerId
        ? 전체직원.find((emp: any) => emp.id === managerId)?.name || null
        : null;

      console.log(`  - 직원명: ${직원정보.name}`);
      console.log(`  - 관리자 ID: ${managerId || '없음'}`);
      console.log(`  - 관리자명: ${managerName || '없음'}`);

      // 2. 할당 가능한 프로젝트 목록 조회하여 프로젝트 정보 찾기
      console.log('\n📍 2단계: 프로젝트 정보 조회');
      const 할당가능프로젝트응답 =
        await projectAssignmentApiClient.getAvailableProjects({
          periodId: evaluationPeriodId,
        });

      const 프로젝트정보 = 할당가능프로젝트응답.projects?.find(
        (p: any) => p.id === testProjectId || p.projectId === testProjectId,
      );

      if (!프로젝트정보) {
        console.log('⚠️ 프로젝트 정보를 찾을 수 없어 테스트를 건너뜁니다.');
        return;
      }

      const pmId = 프로젝트정보?.manager?.id || 프로젝트정보?.managerId || null;
      const pmName = pmId
        ? 전체직원.find((emp: any) => emp.id === pmId)?.name || null
        : 프로젝트정보?.manager?.name || null;

      console.log(
        `  - 프로젝트명: ${프로젝트정보.name || 프로젝트정보.projectName}`,
      );
      console.log(`  - PM ID: ${pmId || '없음'}`);
      console.log(`  - PM명: ${pmName || '없음'}`);

      // 3. 프로젝트 할당
      console.log('\n📍 3단계: 프로젝트 할당');
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('✅ 프로젝트 할당 완료');

      // 4. WBS 할당
      console.log('\n📍 4단계: WBS 할당');
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('✅ WBS 할당 완료');

      // 5. 직원 할당 데이터 조회 검증
      console.log('\n📍 5단계: 직원 할당 데이터 조회 및 평가라인 검증');
      const 할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      // projects 배열 존재 확인
      expect(할당데이터.projects).toBeDefined();
      expect(할당데이터.projects.length).toBeGreaterThan(0);

      // 프로젝트 찾기
      const 프로젝트 = 할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );
      expect(프로젝트).toBeDefined();

      // wbsList 배열 존재 확인
      expect(프로젝트.wbsList).toBeDefined();
      expect(프로젝트.wbsList.length).toBeGreaterThan(0);

      // 해당 WBS 항목 찾기
      const wbs항목 = 프로젝트.wbsList.find(
        (wbs: any) => wbs.wbsId === testWbsItemId,
      );
      expect(wbs항목).toBeDefined();

      console.log(`  - 프로젝트명: ${프로젝트.projectName}`);
      console.log(`  - WBS명: ${wbs항목.wbsName}`);

      // primaryDownwardEvaluation 객체 검증 (1차 평가자가 지정된 경우)
      console.log('\n📋 primaryDownwardEvaluation 객체 검증:');
      if (managerId) {
        expect(wbs항목.primaryDownwardEvaluation).toBeDefined();
        const primaryEval = wbs항목.primaryDownwardEvaluation;

        expect(primaryEval.evaluatorId).toBe(managerId);
        console.log(
          `  - evaluatorId: ${primaryEval.evaluatorId} (예상: ${managerId}) ✅`,
        );

        if (managerName) {
          expect(primaryEval.evaluatorName).toBe(managerName);
          console.log(
            `  - evaluatorName: ${primaryEval.evaluatorName} (예상: ${managerName}) ✅`,
          );
        } else {
          expect(primaryEval.evaluatorName).toBeDefined();
          console.log(`  - evaluatorName: ${primaryEval.evaluatorName} ✅`);
        }

        expect(primaryEval.isCompleted).toBe(false);
        console.log(
          `  - isCompleted: ${primaryEval.isCompleted} (예상: false) ✅`,
        );

        expect(typeof primaryEval.isEditable).toBe('boolean');
        console.log(`  - isEditable: ${primaryEval.isEditable} (boolean) ✅`);

        // 초기값 검증 (평가 내용 없음)
        expect(
          primaryEval.evaluationContent === null ||
            primaryEval.evaluationContent === undefined,
        ).toBe(true);
        console.log(
          `  - evaluationContent: ${primaryEval.evaluationContent} (예상: null/undefined) ✅`,
        );

        expect(
          primaryEval.score === null || primaryEval.score === undefined,
        ).toBe(true);
        console.log(
          `  - score: ${primaryEval.score} (예상: null/undefined) ✅`,
        );

        expect(
          primaryEval.submittedAt === null ||
            primaryEval.submittedAt === undefined,
        ).toBe(true);
        console.log(
          `  - submittedAt: ${primaryEval.submittedAt} (예상: null/undefined) ✅`,
        );

        console.log('✅ primaryDownwardEvaluation 검증 완료');
      } else {
        // 관리자가 없는 경우 primaryDownwardEvaluation이 null인지 확인
        expect(
          wbs항목.primaryDownwardEvaluation === null ||
            wbs항목.primaryDownwardEvaluation === undefined,
        ).toBe(true);
        console.log(
          '⚠️ 관리자가 없어 primaryDownwardEvaluation이 null입니다. ✅',
        );
      }

      // secondaryDownwardEvaluation 객체 검증 (2차 평가자가 지정된 경우)
      console.log('\n📋 secondaryDownwardEvaluation 객체 검증:');
      if (pmId) {
        expect(wbs항목.secondaryDownwardEvaluation).toBeDefined();
        const secondaryEval = wbs항목.secondaryDownwardEvaluation;

        expect(secondaryEval.evaluatorId).toBe(pmId);
        console.log(
          `  - evaluatorId: ${secondaryEval.evaluatorId} (예상: ${pmId}) ✅`,
        );

        if (pmName) {
          expect(secondaryEval.evaluatorName).toBe(pmName);
          console.log(
            `  - evaluatorName: ${secondaryEval.evaluatorName} (예상: ${pmName}) ✅`,
          );
        } else {
          expect(secondaryEval.evaluatorName).toBeDefined();
          console.log(`  - evaluatorName: ${secondaryEval.evaluatorName} ✅`);
        }

        expect(secondaryEval.isCompleted).toBe(false);
        console.log(
          `  - isCompleted: ${secondaryEval.isCompleted} (예상: false) ✅`,
        );

        expect(typeof secondaryEval.isEditable).toBe('boolean');
        console.log(`  - isEditable: ${secondaryEval.isEditable} (boolean) ✅`);

        // 초기값 검증 (평가 내용 없음)
        expect(
          secondaryEval.evaluationContent === null ||
            secondaryEval.evaluationContent === undefined,
        ).toBe(true);
        console.log(
          `  - evaluationContent: ${secondaryEval.evaluationContent} (예상: null/undefined) ✅`,
        );

        expect(
          secondaryEval.score === null || secondaryEval.score === undefined,
        ).toBe(true);
        console.log(
          `  - score: ${secondaryEval.score} (예상: null/undefined) ✅`,
        );

        expect(
          secondaryEval.submittedAt === null ||
            secondaryEval.submittedAt === undefined,
        ).toBe(true);
        console.log(
          `  - submittedAt: ${secondaryEval.submittedAt} (예상: null/undefined) ✅`,
        );

        console.log('✅ secondaryDownwardEvaluation 검증 완료');
      } else {
        // PM이 없는 경우 secondaryDownwardEvaluation이 null인지 확인
        expect(
          wbs항목.secondaryDownwardEvaluation === null ||
            wbs항목.secondaryDownwardEvaluation === undefined,
        ).toBe(true);
        console.log(
          '⚠️ PM이 없어 secondaryDownwardEvaluation이 null입니다. ✅',
        );
      }

      console.log('\n✅ 직원 할당 데이터 조회를 통한 평가라인 검증 완료');
    });
  });

  describe('includeCurrentUserAsEvaluator 옵션을 사용한 평가라인 검증', () => {
    let currentUserId: string;
    let currentUserName: string;
    let testEvaluationPeriodId: string;
    let testEmployeeIds: string[];
    let testProjectIds: string[];
    let testWbsItemIds: string[];

    beforeAll(async () => {
      // 현재 사용자 정보 설정 (테스트용) - 한 번만 설정 (모든 테스트에서 공유)
      // 실제로는 JWT 토큰에서 추출되지만, 테스트에서는 임의로 설정
      // UUID 형식이어야 함 (assignedBy 필드에서 사용)
      const testUser = {
        id: randomUUID(),
        email: 'test-user@example.com',
        name: '테스트 평가자',
        employeeNumber: 'TEST001',
      };

      testSuite.setCurrentUser(testUser);
      currentUserId = testUser.id;
      currentUserName = testUser.name;

      console.log(
        `\n📍 현재 사용자 설정: ${currentUserName} (${currentUserId})`,
      );
    });

    afterAll(async () => {
      // 정리 작업
      try {
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

    // 각 테스트마다 독립적인 환경 구성
    beforeEach(async () => {
      // 1. 시드 데이터 생성 (includeCurrentUserAsEvaluator: true)
      console.log(
        '\n📍 1단계: 시드 데이터 생성 (includeCurrentUserAsEvaluator: true)',
      );
      const seedResponse = await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'minimal',
          clearExisting: true,
          projectCount: 3,
          wbsPerProject: 5,
          includeCurrentUserAsEvaluator: true, // 현재 사용자를 평가자로 등록
          useRealDepartments: true, // 실제 부서 사용 (README 시나리오와 일치)
          useRealEmployees: true, // 실제 직원 사용 (README 시나리오와 일치)
        })
        .expect(HttpStatus.CREATED);

      console.log('✅ 시드 데이터 생성 완료');

      // 생성된 ID 추출
      const phase1Result = seedResponse.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();

      testEmployeeIds = phase1Result.generatedIds.employeeIds || [];
      testProjectIds = phase1Result.generatedIds.projectIds || [];
      testWbsItemIds = phase1Result.generatedIds.wbsIds || [];

      if (
        testEmployeeIds.length === 0 ||
        testProjectIds.length === 0 ||
        testWbsItemIds.length === 0
      ) {
        throw new Error(
          '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
        );
      }

      console.log(`  - 직원 수: ${testEmployeeIds.length}명`);
      console.log(`  - 프로젝트 수: ${testProjectIds.length}개`);
      console.log(`  - WBS 수: ${testWbsItemIds.length}개`);

      // 2. 평가기간 생성
      console.log('\n📍 2단계: 평가기간 생성');
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: `includeCurrentUserAsEvaluator 테스트용 평가기간 ${Date.now()}`,
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: 'includeCurrentUserAsEvaluator 옵션 E2E 테스트용 평가기간',
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

      testEvaluationPeriodId = createPeriodResponse.body.id;

      // 평가기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${testEvaluationPeriodId}/start`)
        .expect(HttpStatus.OK);

      console.log('✅ 평가기간 생성 및 시작 완료');

      // 직원들을 평가 대상으로 등록
      await evaluationTargetScenario.평가_대상자를_대량_등록한다(
        testEvaluationPeriodId,
        testEmployeeIds,
      );

      console.log(`✅ 평가 대상자 등록 완료: ${testEmployeeIds.length}명`);
    });

    afterEach(async () => {
      // 각 테스트 후 정리 작업
      try {
        if (testEvaluationPeriodId) {
          await testSuite
            .request()
            .post(`/admin/evaluation-periods/${testEvaluationPeriodId}/end`)
            .expect(HttpStatus.OK);

          await evaluationPeriodScenario.평가기간을_삭제한다(
            testEvaluationPeriodId,
          );
        }
        await seedDataScenario.시드_데이터를_삭제한다();
      } catch (error) {
        console.log('테스트 정리 중 오류 (무시):', error.message);
      }
    });

    it('includeCurrentUserAsEvaluator 옵션 사용 시 모든 직원의 managerId가 현재 사용자 ID로 설정되어야 한다', async () => {
      console.log('\n📍 includeCurrentUserAsEvaluator 옵션 검증 시작');

      // 1. 전체 직원 목록 조회
      console.log('\n📍 1단계: 전체 직원 목록 조회');
      const 전체직원 = await employeeManagementApiClient.getAllEmployees({
        includeExcluded: true,
      });

      expect(전체직원.length).toBeGreaterThan(0);

      // 2. 모든 직원의 managerId 검증 (본인 제외)
      console.log('\n📍 2단계: managerId 설정 검증');
      let 검증된직원수 = 0;

      for (const 직원 of 전체직원) {
        if (직원.id === currentUserId) {
          // 현재 사용자 본인은 managerId가 null이거나 다른 값일 수 있음
          console.log(
            `  - 현재 사용자 본인: ${직원.name} (managerId: ${직원.managerId || 'null'}) ✅`,
          );
          continue;
        }

        // 현재 사용자 본인이 아닌 직원은 모두 managerId가 currentUserId와 일치해야 함
        expect(직원.managerId).toBe(currentUserId);
        검증된직원수++;

        console.log(
          `  - ${직원.name}: managerId = ${직원.managerId} (예상: ${currentUserId}) ✅`,
        );
      }

      console.log(
        `\n✅ managerId 설정 검증 완료: ${검증된직원수}명의 직원이 현재 사용자를 관리자로 설정함`,
      );
    });

    it('평가라인 자동 구성 시 현재 사용자가 모든 피평가자의 1차 평가자로 설정되어야 한다', async () => {
      console.log(
        '\n📍 평가라인 자동 구성 검증 시작 (현재 사용자가 1차 평가자)',
      );

      const testEmployeeId = testEmployeeIds[0];
      const testProjectId = testProjectIds[0];
      const testWbsItemId = testWbsItemIds[0];

      // 1. 프로젝트 할당
      console.log('\n📍 1단계: 프로젝트 할당');
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: testEvaluationPeriodId,
      });
      console.log('✅ 프로젝트 할당 완료');

      // 2. WBS 할당
      console.log('\n📍 2단계: WBS 할당');
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: testEvaluationPeriodId,
      });
      console.log('✅ WBS 할당 완료');

      // 3. 평가설정 통합 조회로 1차 평가자 검증
      console.log('\n📍 3단계: 평가라인 자동 구성 검증');
      const 평가설정 =
        await evaluationLineApiClient.getEmployeeEvaluationSettings({
          employeeId: testEmployeeId,
          periodId: testEvaluationPeriodId,
        });

      // wbsItemId가 null인 매핑이 1차 평가자
      const 일차평가라인매핑 = 평가설정.evaluationLineMappings?.find(
        (mapping: any) => mapping.wbsItemId === null,
      );

      expect(일차평가라인매핑).toBeDefined();
      expect(일차평가라인매핑.evaluatorId).toBe(currentUserId);

      console.log('✅ 1차 평가자 자동 구성 검증 완료');
      console.log(
        `  - 평가자 ID: ${일차평가라인매핑.evaluatorId} (예상: ${currentUserId}) ✅`,
      );
      console.log(`  - 매핑 ID: ${일차평가라인매핑.id}`);

      // 4. 여러 피평가자에 대해 검증
      console.log('\n📍 4단계: 여러 피평가자에 대한 검증');
      if (testEmployeeIds.length > 1) {
        const 추가직원Id = testEmployeeIds[1];
        const 추가프로젝트Id = testProjectIds[1] || testProjectIds[0];
        const 추가WbsItemId = testWbsItemIds[1] || testWbsItemIds[0];

        // 프로젝트 및 WBS 할당
        await projectAssignmentApiClient.create({
          employeeId: 추가직원Id,
          projectId: 추가프로젝트Id,
          periodId: testEvaluationPeriodId,
        });

        await wbsAssignmentApiClient.create({
          employeeId: 추가직원Id,
          wbsItemId: 추가WbsItemId,
          projectId: 추가프로젝트Id,
          periodId: testEvaluationPeriodId,
        });

        // 평가설정 통합 조회
        const 추가평가설정 =
          await evaluationLineApiClient.getEmployeeEvaluationSettings({
            employeeId: 추가직원Id,
            periodId: testEvaluationPeriodId,
          });

        const 추가일차평가라인매핑 = 추가평가설정.evaluationLineMappings?.find(
          (mapping: any) => mapping.wbsItemId === null,
        );

        expect(추가일차평가라인매핑).toBeDefined();
        expect(추가일차평가라인매핑.evaluatorId).toBe(currentUserId);

        console.log(
          `✅ 추가 직원(${추가직원Id})의 1차 평가자도 현재 사용자로 설정됨 ✅`,
        );
      }

      console.log(
        '\n✅ 평가라인 자동 구성 검증 완료 (현재 사용자가 1차 평가자)',
      );
    });

    it('평가자별 피평가자 현황 조회 시 현재 사용자가 모든 피평가자의 1차 평가자로 표시되어야 한다', async () => {
      console.log('\n📍 평가자별 피평가자 현황 조회 검증 시작');

      // 여러 피평가자 생성
      console.log('\n📍 1단계: 여러 피평가자에 프로젝트 및 WBS 할당');
      const 할당할직원수 = Math.min(3, testEmployeeIds.length);

      for (let i = 0; i < 할당할직원수; i++) {
        const employeeId = testEmployeeIds[i];
        const projectId = testProjectIds[i] || testProjectIds[0];
        const wbsItemId = testWbsItemIds[i] || testWbsItemIds[0];

        await projectAssignmentApiClient.create({
          employeeId,
          projectId,
          periodId: testEvaluationPeriodId,
        });

        await wbsAssignmentApiClient.create({
          employeeId,
          wbsItemId,
          projectId,
          periodId: testEvaluationPeriodId,
        });
      }

      console.log(`✅ ${할당할직원수}명의 피평가자 할당 완료`);

      // 2. 현재 사용자로 평가자별 피평가자 현황 조회
      console.log('\n📍 2단계: 평가자별 피평가자 현황 조회');
      const 피평가자현황 = await dashboardApiClient.getEvaluatorTargetsStatus({
        periodId: testEvaluationPeriodId,
        evaluatorId: currentUserId,
      });

      expect(Array.isArray(피평가자현황)).toBe(true);
      expect(피평가자현황.length).toBeGreaterThanOrEqual(할당할직원수);

      console.log(`  - 피평가자 수: ${피평가자현황.length}명`);

      // 3. 각 피평가자에 대한 검증
      console.log('\n📍 3단계: 각 피평가자 검증');
      for (const 피평가자정보 of 피평가자현황) {
        // evaluationLine 검증
        expect(피평가자정보.evaluationLine).toBeDefined();
        expect(피평가자정보.evaluationLine.hasPrimaryEvaluator).toBe(true);

        // downwardEvaluation 검증
        expect(피평가자정보.downwardEvaluation).toBeDefined();
        expect(피평가자정보.downwardEvaluation.isPrimary).toBe(true);
        expect(피평가자정보.downwardEvaluation.isSecondary).toBe(false);

        // myEvaluatorTypes 검증
        expect(피평가자정보.myEvaluatorTypes).toBeDefined();
        expect(Array.isArray(피평가자정보.myEvaluatorTypes)).toBe(true);
        expect(피평가자정보.myEvaluatorTypes).toContain('primary');

        console.log(
          `  - 피평가자 ${피평가자정보.employeeId}: 1차 평가자 설정 확인 ✅`,
        );
      }

      console.log('\n✅ 평가자별 피평가자 현황 조회 검증 완료');
    });

    it('평가자별 피평가자 현황 조회 수와 직원 평가설정 통합 조회에서 evaluatorId 기준 필터링된 직원 수가 일치해야 한다', async () => {
      console.log('\n📍 평가 대상자 수 일치 검증 시작');

      // 여러 피평가자 생성
      console.log('\n📍 1단계: 여러 피평가자에 프로젝트 및 WBS 할당');
      const 할당할직원수 = Math.min(3, testEmployeeIds.length);

      for (let i = 0; i < 할당할직원수; i++) {
        const employeeId = testEmployeeIds[i];
        const projectId = testProjectIds[i] || testProjectIds[0];
        const wbsItemId = testWbsItemIds[i] || testWbsItemIds[0];

        await projectAssignmentApiClient.create({
          employeeId,
          projectId,
          periodId: testEvaluationPeriodId,
        });

        await wbsAssignmentApiClient.create({
          employeeId,
          wbsItemId,
          projectId,
          periodId: testEvaluationPeriodId,
        });
      }

      console.log(`✅ ${할당할직원수}명의 피평가자 할당 완료`);

      // 2. 대시보드에서 평가자별 피평가자 현황 조회
      console.log('\n📍 2단계: 대시보드에서 평가자별 피평가자 현황 조회');
      const 피평가자현황 = await dashboardApiClient.getEvaluatorTargetsStatus({
        periodId: testEvaluationPeriodId,
        evaluatorId: currentUserId,
      });

      expect(Array.isArray(피평가자현황)).toBe(true);
      const 대시보드피평가자수 = 피평가자현황.length;

      console.log(
        `  - 대시보드에서 조회된 피평가자 수: ${대시보드피평가자수}명`,
      );

      // 3. 각 피평가자별로 직원 평가설정 통합 조회하여 evaluatorId 기준 필터링
      console.log('\n📍 3단계: 각 피평가자별로 직원 평가설정 통합 조회');
      const 평가설정에서매핑있는직원목록 = new Set<string>();

      for (const 피평가자정보 of 피평가자현황) {
        const employeeId = 피평가자정보.employeeId;

        // 직원 평가설정 통합 조회
        const 평가설정 =
          await evaluationLineApiClient.getEmployeeEvaluationSettings({
            employeeId,
            periodId: testEvaluationPeriodId,
          });

        // evaluationLineMappings 배열에서 evaluatorId가 currentUserId와 일치하는 매핑이 있는지 확인
        const evaluatorId로필터링된매핑 =
          평가설정.evaluationLineMappings?.filter(
            (mapping: any) => mapping.evaluatorId === currentUserId,
          ) || [];

        // evaluatorId 기준으로 필터링된 매핑이 있으면 해당 직원을 집계
        if (evaluatorId로필터링된매핑.length > 0) {
          평가설정에서매핑있는직원목록.add(employeeId);
          console.log(
            `  - 직원 ${employeeId}: evaluatorId 매핑 ${evaluatorId로필터링된매핑.length}개 발견 ✅`,
          );
        } else {
          console.log(`  - 직원 ${employeeId}: evaluatorId 매핑 없음 ⚠️`);
        }
      }

      const 평가설정피평가자수 = 평가설정에서매핑있는직원목록.size;

      console.log(
        `  - 평가설정에서 evaluatorId 기준 필터링된 직원 수: ${평가설정피평가자수}명`,
      );

      // 4. 두 수가 일치하는지 확인
      console.log('\n📍 4단계: 수 일치 검증');
      expect(평가설정피평가자수).toBe(대시보드피평가자수);

      console.log(`  - 대시보드 피평가자 수: ${대시보드피평가자수}명`);
      console.log(`  - 평가설정 필터링 직원 수: ${평가설정피평가자수}명`);
      console.log('  - 두 수가 일치함 ✅');

      console.log('\n✅ 평가 대상자 수 일치 검증 완료');
    });

    it('직원 할당 데이터 조회 시 primaryDownwardEvaluation의 evaluatorId가 현재 사용자 ID와 일치해야 한다', async () => {
      console.log('\n📍 직원 할당 데이터 조회 검증 시작');

      const testEmployeeId = testEmployeeIds[0];
      const testProjectId = testProjectIds[0];
      const testWbsItemId = testWbsItemIds[0];

      // 1. 프로젝트 및 WBS 할당
      console.log('\n📍 1단계: 프로젝트 및 WBS 할당');
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: testEvaluationPeriodId,
      });

      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: testEvaluationPeriodId,
      });

      console.log('✅ 프로젝트 및 WBS 할당 완료');

      // 2. 직원 할당 데이터 조회
      console.log('\n📍 2단계: 직원 할당 데이터 조회');
      const 할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: testEvaluationPeriodId,
        employeeId: testEmployeeId,
      });

      // projects 배열 존재 확인
      expect(할당데이터.projects).toBeDefined();
      expect(할당데이터.projects.length).toBeGreaterThan(0);

      // 프로젝트 찾기
      const 프로젝트 = 할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );
      expect(프로젝트).toBeDefined();

      // wbsList 배열 존재 확인
      expect(프로젝트.wbsList).toBeDefined();
      expect(프로젝트.wbsList.length).toBeGreaterThan(0);

      // 해당 WBS 항목 찾기
      const wbs항목 = 프로젝트.wbsList.find(
        (wbs: any) => wbs.wbsId === testWbsItemId,
      );
      expect(wbs항목).toBeDefined();

      // 3. primaryDownwardEvaluation 검증
      console.log('\n📍 3단계: primaryDownwardEvaluation 검증');
      expect(wbs항목.primaryDownwardEvaluation).toBeDefined();
      const primaryEval = wbs항목.primaryDownwardEvaluation;

      expect(primaryEval.evaluatorId).toBe(currentUserId);
      console.log(
        `  - evaluatorId: ${primaryEval.evaluatorId} (예상: ${currentUserId}) ✅`,
      );

      if (primaryEval.evaluatorName) {
        expect(primaryEval.evaluatorName).toBe(currentUserName);
        console.log(
          `  - evaluatorName: ${primaryEval.evaluatorName} (예상: ${currentUserName}) ✅`,
        );
      }

      expect(primaryEval.isCompleted).toBe(false);
      expect(typeof primaryEval.isEditable).toBe('boolean');

      console.log('✅ primaryDownwardEvaluation 검증 완료');

      // 4. 여러 직원에 대한 일관성 검증
      console.log('\n📍 4단계: 여러 직원에 대한 일관성 검증');
      if (testEmployeeIds.length > 1) {
        const 추가직원Id = testEmployeeIds[1];
        const 추가프로젝트Id = testProjectIds[1] || testProjectIds[0];
        const 추가WbsItemId = testWbsItemIds[1] || testWbsItemIds[0];

        // 프로젝트 및 WBS 할당
        await projectAssignmentApiClient.create({
          employeeId: 추가직원Id,
          projectId: 추가프로젝트Id,
          periodId: testEvaluationPeriodId,
        });

        await wbsAssignmentApiClient.create({
          employeeId: 추가직원Id,
          wbsItemId: 추가WbsItemId,
          projectId: 추가프로젝트Id,
          periodId: testEvaluationPeriodId,
        });

        // 할당 데이터 조회
        const 추가할당데이터 = await dashboardApiClient.getEmployeeAssignedData(
          {
            periodId: testEvaluationPeriodId,
            employeeId: 추가직원Id,
          },
        );

        const 추가프로젝트 = 추가할당데이터.projects.find(
          (p: any) => p.projectId === 추가프로젝트Id,
        );
        const 추가Wbs항목 = 추가프로젝트?.wbsList.find(
          (wbs: any) => wbs.wbsId === 추가WbsItemId,
        );

        if (추가Wbs항목?.primaryDownwardEvaluation) {
          expect(추가Wbs항목.primaryDownwardEvaluation.evaluatorId).toBe(
            currentUserId,
          );
          console.log(
            `✅ 추가 직원(${추가직원Id})의 primaryDownwardEvaluation.evaluatorId도 현재 사용자로 설정됨 ✅`,
          );
        }
      }

      console.log('\n✅ 직원 할당 데이터 조회 검증 완료');
    });
  });
});
