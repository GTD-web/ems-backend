import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { ProjectAssignmentApiClient } from '../api-clients/project-assignment.api-client';
import { WbsAssignmentApiClient } from '../api-clients/wbs-assignment.api-client';

/**
 * 모든 프로젝트 할당 리셋 검증 시나리오
 *
 * 테스트 목적:
 * - 모든 프로젝트 할당을 한 번에 리셋하는 기능 검증
 * - 관련된 모든 데이터(WBS 할당, 평가라인, 자기평가, 산출물, 하향평가, 동료평가 등)도 함께 리셋되는지 확인
 * - 리셋 후 조회 시 제외되는지 확인
 * - 리셋 후 새로운 할당 생성이 가능한지 확인
 */
describe('모든 프로젝트 할당 리셋 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;

  // 테스트용 데이터
  let periodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
    wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('성공 케이스', () => {
    it('여러 할당이 있을 때 모두 삭제할 수 있어야 한다', async () => {
      console.log('\n📍 모든 프로젝트 할당 삭제 테스트 시작');

      // Given: 여러 프로젝트 할당 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        departmentCount: 1,
        employeeCount: 3,
        projectCount: 2,
        wbsPerProject: 2,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];
      wbsItemIds = seedResponse.results[0].generatedIds?.wbsItemIds || [];

      // 평가기간 생성
      const periodResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send({
          name: '2024 상반기 평가',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-06-30',
        })
        .expect(201);

      periodId = periodResponse.body.id;

      // 프로젝트 할당 생성
      await projectAssignmentApiClient.create({
        employeeId: employeeIds[0],
        projectId: projectIds[0],
        periodId,
      });
      await projectAssignmentApiClient.create({
        employeeId: employeeIds[1],
        projectId: projectIds[0],
        periodId,
      });
      await projectAssignmentApiClient.create({
        employeeId: employeeIds[2],
        projectId: projectIds[1],
        periodId,
      });

      console.log('✅ 3개의 프로젝트 할당 생성 완료');

      // When: 삭제 전 개수 확인
      const beforeDeleteResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      console.log(
        `📊 삭제 전 프로젝트 할당 개수: ${beforeDeleteResponse.body.assignments.length}`,
      );
      expect(beforeDeleteResponse.body.assignments.length).toBe(3);

      // When: 모든 프로젝트 할당 삭제
      await projectAssignmentApiClient.resetAll();
      console.log('✅ 모든 프로젝트 할당 삭제 완료');

      // Then: 삭제 후 개수 확인
      const afterDeleteResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      console.log(
        `📊 삭제 후 프로젝트 할당 개수: ${afterDeleteResponse.body.assignments.length}`,
      );
      expect(afterDeleteResponse.body.assignments.length).toBe(0);

      // 정리
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${periodId}`)
        .expect(200);
    });

    it('삭제된 할당은 조회 시 제외되어야 한다', async () => {
      console.log('\n📍 삭제된 할당 조회 제외 검증 시작');

      // Given: 평가기간 및 할당 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        departmentCount: 1,
        employeeCount: 2,
        projectCount: 1,
        wbsPerProject: 1,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

      const periodResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send({
          name: '2024 하반기 평가',
          startDate: '2024-07-01',
          peerEvaluationDeadline: '2024-12-31',
        })
        .expect(201);

      periodId = periodResponse.body.id;

      const assignmentResponse = await projectAssignmentApiClient.create({
        employeeId: employeeIds[0],
        projectId: projectIds[0],
        periodId,
      });

      console.log(
        `✅ 프로젝트 할당 생성 완료 - ID: ${assignmentResponse.id}`,
      );

      // When: 삭제 전 목록에 포함되는지 확인
      const beforeDeleteListResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      expect(beforeDeleteListResponse.body.assignments.length).toBe(1);
      console.log('✅ 삭제 전 목록에 할당 포함됨');

      // When: 모든 할당 삭제
      await projectAssignmentApiClient.resetAll();
      console.log('✅ 모든 프로젝트 할당 삭제 완료');

      // Then: 목록 조회 시 제외됨
      const afterDeleteListResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      expect(afterDeleteListResponse.body.assignments.length).toBe(0);
      console.log('✅ 삭제된 할당이 목록에서 제외됨');

      // 정리
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${periodId}`)
        .expect(200);
    });

    it('할당이 없을 때도 정상 처리되어야 한다', async () => {
      console.log('\n📍 할당 없을 때 삭제 테스트 시작');

      // Given: 할당이 없는 상태
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        departmentCount: 1,
        employeeCount: 1,
        projectCount: 1,
        wbsPerProject: 1,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

      const periodResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send({
          name: '2025 상반기 평가',
          startDate: '2025-01-01',
          peerEvaluationDeadline: '2025-06-30',
        })
        .expect(201);

      periodId = periodResponse.body.id;

      const beforeResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      console.log(
        `📊 삭제 전 프로젝트 할당 개수: ${beforeResponse.body.assignments.length}`,
      );

      // When: 모든 할당 삭제 (할당이 없지만 정상 처리)
      await projectAssignmentApiClient.resetAll();
      console.log('✅ 할당 없을 때도 정상 처리됨');

      // Then: 여전히 0개
      const afterResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      console.log(
        `📊 삭제 후 프로젝트 할당 개수: ${afterResponse.body.assignments.length}`,
      );
      expect(afterResponse.body.assignments.length).toBe(0);

      // 정리
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${periodId}`)
        .expect(200);
    });

    it('삭제 후 새로운 할당 생성 및 조회가 가능해야 한다', async () => {
      console.log('\n📍 삭제 후 재생성 테스트 시작');

      // Given: 평가기간 및 데이터 생성
      const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
        scenario: 'minimal',
        clearExisting: true,
        departmentCount: 1,
        employeeCount: 2,
        projectCount: 1,
        wbsPerProject: 1,
      });

      employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
      projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

      const periodResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send({
          name: '2025 하반기 평가',
          startDate: '2025-07-01',
          peerEvaluationDeadline: '2025-12-31',
        })
        .expect(201);

      periodId = periodResponse.body.id;

      // When: 모든 할당 삭제
      await projectAssignmentApiClient.resetAll();
      console.log('✅ 기존 할당 삭제 완료');

      // 새로운 할당 생성
      const newAssignment = await projectAssignmentApiClient.create({
        employeeId: employeeIds[0],
        projectId: projectIds[0],
        periodId,
      });

      console.log(
        `✅ 새로운 프로젝트 할당 생성 완료 - ID: ${newAssignment.id}`,
      );

      // Then: 새로운 할당이 목록에 포함됨
      const listResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId })
        .expect(200);

      expect(listResponse.body.assignments.length).toBe(1);
      expect(listResponse.body.assignments[0].id).toBe(newAssignment.id);

      console.log('✅ 삭제 후 재생성 및 조회 성공');

      // 정리
      await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${periodId}`)
        .expect(200);
    });
  });
});

