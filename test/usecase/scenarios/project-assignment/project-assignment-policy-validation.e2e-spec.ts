import { BaseE2ETest } from '../../../base-e2e.spec';
import { ProjectAssignmentScenario } from './project-assignment.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

describe('프로젝트 할당 정책 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let assignmentId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);

    // 시드 데이터 생성 (프로젝트와 직원)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 3,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];

    if (employeeIds.length === 0 || projectIds.length === 0) {
      throw new Error('시드 데이터 생성 실패: 직원 또는 프로젝트가 생성되지 않았습니다.');
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '프로젝트 할당 정책 검증용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '프로젝트 할당 정책 검증 E2E 테스트용 평가기간',
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
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(200);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );

    // 테스트용 프로젝트 할당 생성 (완료 전에 할당)
    const assignmentResult = await projectAssignmentScenario.프로젝트를_할당한다({
      employeeId: employeeIds[0],
      projectId: projectIds[0],
      periodId: evaluationPeriodId,
    });
    assignmentId = assignmentResult.id;

    console.log(`✅ 테스트 데이터 준비 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeIds.length}명, 프로젝트: ${projectIds.length}개, 할당: ${assignmentId}`);
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        // 평가기간 종료 후 삭제
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(200);
        
        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      } catch (error) {
        console.log('평가기간 정리 중 오류 (이미 정리됨):', error.message);
      }
    }
    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('완료된 평가기간에서 프로젝트 할당 정책 검증', () => {
    it('평가기간을 완료 상태로 변경한다', async () => {
      // 평가기간 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      console.log(`✅ 평가기간 완료 완료 - 평가기간 ID: ${evaluationPeriodId}`);
    });

    it('완료된 평가기간에 프로젝트 할당 생성이 불가능한지 검증한다', async () => {
      // 완료된 평가기간에 프로젝트 할당 시도
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments')
        .send({
          employeeId: employeeIds[1],
          projectId: projectIds[1],
          periodId: evaluationPeriodId,
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간에는 프로젝트 할당을 생성할 수 없습니다.');
        });

      console.log('✅ 완료된 평가기간에서 프로젝트 할당 생성 불가 검증 완료');
    });

    it('완료된 평가기간에 프로젝트 대량 할당이 불가능한지 검증한다', async () => {
      // 완료된 평가기간에 프로젝트 대량 할당 시도
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employeeIds[1],
              projectId: projectIds[1],
              periodId: evaluationPeriodId,
            },
            {
              employeeId: employeeIds[2],
              projectId: projectIds[2],
              periodId: evaluationPeriodId,
            },
          ],
        })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간');
          expect(res.body.message).toContain('프로젝트 할당을 생성할 수 없습니다');
        });

      console.log('✅ 완료된 평가기간에서 프로젝트 대량 할당 불가 검증 완료');
    });

    it('완료된 평가기간에서 조회 기능은 정상 작동하는지 검증한다', async () => {
      // 조회 기능들은 완료된 평가기간에서도 정상 작동해야 함
      
      // 1. 프로젝트 할당 목록 조회
      const listResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ periodId: evaluationPeriodId })
        .expect(200);

      expect(listResponse.body.assignments).toBeDefined();
      expect(Array.isArray(listResponse.body.assignments)).toBe(true);
      expect(listResponse.body.assignments.length).toBeGreaterThan(0);

      // 2. 프로젝트 할당 상세 조회
      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
        .expect(200);

      console.log('프로젝트 할당 상세 조회 응답:', JSON.stringify(detailResponse.body, null, 2));

      expect(detailResponse.body.id).toBe(assignmentId);
      expect(detailResponse.body.employee?.id).toBe(employeeIds[0]);
      expect(detailResponse.body.project?.id).toBe(projectIds[0]);
      console.log('✅ 프로젝트 할당 상세 조회 성공');

      // 3. 직원별 할당 프로젝트 조회
      const employeeProjectsResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/project-assignments/employees/${employeeIds[0]}/periods/${evaluationPeriodId}`)
        .expect(200);

      expect(Array.isArray(employeeProjectsResponse.body.projects)).toBe(true);
      expect(employeeProjectsResponse.body.projects.length).toBeGreaterThan(0);
      console.log('✅ 직원별 할당 프로젝트 조회 성공');

      // 4. 프로젝트별 할당 직원 조회
      const projectEmployeesResponse = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/project-assignments/projects/${projectIds[0]}/periods/${evaluationPeriodId}`)
        .expect(200);

      expect(Array.isArray(projectEmployeesResponse.body.employees)).toBe(true);
      expect(projectEmployeesResponse.body.employees.length).toBeGreaterThan(0);
      console.log('✅ 프로젝트별 할당 직원 조회 성공');

      // 5. 미할당 직원 조회
      const unassignedResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/unassigned-employees')
        .query({ periodId: evaluationPeriodId })
        .expect(200);

      expect(unassignedResponse.body.periodId).toBe(evaluationPeriodId);
      expect(Array.isArray(unassignedResponse.body.employees)).toBe(true);

      // 6. 할당 가능한 프로젝트 조회
      const availableProjectsResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments/available-projects')
        .query({ periodId: evaluationPeriodId })
        .expect(200);

      expect(availableProjectsResponse.body.periodId).toBe(evaluationPeriodId);
      expect(Array.isArray(availableProjectsResponse.body.projects)).toBe(true);

      console.log('✅ 완료된 평가기간에서 조회 기능 정상 작동 검증 완료');
    });

    it('완료된 평가기간에 프로젝트 할당 순서 변경이 불가능한지 검증한다', async () => {
      // 완료된 평가기간에 프로젝트 할당 순서 변경 시도
      await testSuite
        .request()
        .patch(`/admin/evaluation-criteria/project-assignments/${assignmentId}/order`)
        .query({ direction: 'up' })
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간에는 프로젝트 할당 순서를 변경할 수 없습니다.');
        });

      console.log('✅ 완료된 평가기간에서 프로젝트 할당 순서 변경 불가 검증 완료');
    });

    it('완료된 평가기간에 프로젝트 할당 취소가 불가능한지 검증한다', async () => {
      // 완료된 평가기간에 프로젝트 할당 취소 시도
      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
        .expect(422)
        .expect((res) => {
          expect(res.body.message).toContain('완료된 평가기간에는 프로젝트 할당을 취소할 수 없습니다.');
        });

      console.log('✅ 완료된 평가기간에서 프로젝트 할당 취소 불가 검증 완료');
    });
  });
});
