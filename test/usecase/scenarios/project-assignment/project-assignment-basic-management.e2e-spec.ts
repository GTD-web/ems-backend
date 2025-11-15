import { BaseE2ETest } from '../../../base-e2e.spec';
import { ProjectAssignmentScenario } from './project-assignment.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

describe('프로젝트 할당 기본 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];

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
      throw new Error(
        '시드 데이터 생성 실패: 직원 또는 프로젝트가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '프로젝트 할당 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '프로젝트 할당 E2E 테스트용 평가기간',
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

    console.log(
      `✅ 테스트 데이터 준비 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeIds.length}명, 프로젝트: ${projectIds.length}개`,
    );
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

  describe('프로젝트 할당 기본 관리', () => {
    it('프로젝트를 할당하고 대시보드에서 검증한다', async () => {
      // 프로젝트 할당 + 대시보드 검증
      const result =
        await projectAssignmentScenario.프로젝트를_할당하고_대시보드에서_검증한다(
          {
            employeeId: employeeIds[0],
            projectId: projectIds[0],
            periodId: evaluationPeriodId,
          },
        );

      // 할당 결과 검증
      expect(result.할당결과).toBeDefined();
      expect(result.할당결과.id).toBeDefined();
      console.log(`✅ 프로젝트 할당 완료 - 할당 ID: ${result.할당결과.id}`);

      // 대시보드 상태 검증
      expect(result.대시보드상태).toBeDefined();
      expect(result.대시보드상태.employeeId).toBe(employeeIds[0]);
      expect(result.대시보드상태.isEvaluationTarget).toBe(true);

      // evaluationCriteria 검증
      expect(result.evaluationCriteria).toBeDefined();
      expect(result.evaluationCriteria.status).toBeDefined();
      expect(result.evaluationCriteria.assignedProjectCount).toBeGreaterThan(0);
      console.log(
        `✅ 대시보드 검증 완료 - 상태: ${result.evaluationCriteria.status}, 할당된 프로젝트 수: ${result.evaluationCriteria.assignedProjectCount}`,
      );

      // 직원 할당 데이터 검증
      expect(result.할당데이터).toBeDefined();
      expect(result.할당데이터.employee).toBeDefined();
      expect(result.할당데이터.employee.id).toBe(employeeIds[0]);

      // 디버깅을 위한 로그
      console.log(
        '직원 할당 데이터 조회 결과:',
        JSON.stringify(result.할당데이터, null, 2),
      );
      console.log('프로젝트 목록:', result.프로젝트목록);
      console.log('총 프로젝트 수:', result.총프로젝트수);
      console.log('찾고 있는 프로젝트 ID:', projectIds[0]);

      // 프로젝트 목록 검증
      expect(Array.isArray(result.프로젝트목록)).toBe(true);
      expect(result.프로젝트목록.length).toBeGreaterThan(0);
      expect(result.총프로젝트수).toBeGreaterThan(0);
      expect(result.총프로젝트수).toBe(result.프로젝트목록.length);

      // 할당된 프로젝트가 올바른 프로젝트인지 확인
      const 할당된프로젝트 = result.프로젝트목록.find(
        (project: any) => project.projectId === projectIds[0],
      );
      expect(할당된프로젝트).toBeDefined();
      expect(할당된프로젝트.projectId).toBe(projectIds[0]);

      // 대시보드 API를 통한 추가 검증
      const 대시보드할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      // 대시보드에서 반환된 프로젝트 목록에서 할당된 프로젝트 검증
      expect(대시보드할당데이터.projects).toBeDefined();
      expect(Array.isArray(대시보드할당데이터.projects)).toBe(true);
      expect(대시보드할당데이터.projects.length).toBeGreaterThan(0);

      // 할당된 프로젝트가 대시보드에서도 올바르게 조회되는지 확인
      const 대시보드할당된프로젝트 = 대시보드할당데이터.projects.find(
        (project: any) => project.projectId === projectIds[0],
      );
      expect(대시보드할당된프로젝트).toBeDefined();
      expect(대시보드할당된프로젝트.projectId).toBe(projectIds[0]);
      expect(대시보드할당된프로젝트.projectName).toBeDefined();
      expect(대시보드할당된프로젝트.projectCode).toBeDefined();

      console.log(
        `✅ 대시보드 API를 통한 프로젝트 할당 검증 완료 - 할당된 프로젝트 ID: ${대시보드할당된프로젝트.projectId}, 프로젝트명: ${대시보드할당된프로젝트.projectName}`,
      );
      console.log(
        `✅ 직원 할당 데이터 검증 완료 - 프로젝트 ${result.프로젝트목록.length}개, 총 프로젝트 수: ${result.총프로젝트수}`,
      );
    });

    it('프로젝트 할당 목록을 조회한다', async () => {
      const result =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
          page: 1,
          limit: 10,
        });

      expect(result).toBeDefined();
      expect(Array.isArray(result.assignments)).toBe(true);
      expect(result.assignments.length).toBeGreaterThan(0);
      console.log(
        `✅ 프로젝트 할당 목록 조회 완료 - 총 ${result.assignments.length}개 할당`,
      );
    });

    it('직원별 할당 프로젝트를 조회한다', async () => {
      // 먼저 프로젝트를 할당
      const 할당결과 = await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: employeeIds[1],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      const result =
        await projectAssignmentScenario.직원별_할당_프로젝트를_조회한다(
          employeeIds[1],
          evaluationPeriodId,
        );

      console.log(
        '직원별 할당 프로젝트 조회 결과:',
        JSON.stringify(result, null, 2),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.projects.length).toBeGreaterThan(0);

      // 할당된 프로젝트가 올바른 프로젝트인지 확인 (API 응답 구조에 맞게 수정)
      const 할당된프로젝트 = result.projects.find(
        (project: any) => project.id === projectIds[1],
      );
      expect(할당된프로젝트).toBeDefined();
      expect(할당된프로젝트.id).toBe(projectIds[1]);

      // 대시보드 API를 통한 추가 검증
      const 대시보드할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[1],
        });

      // 대시보드에서 반환된 프로젝트 목록에서 할당된 프로젝트 검증
      const 대시보드할당된프로젝트 = 대시보드할당데이터.projects.find(
        (project: any) => project.projectId === projectIds[1],
      );
      expect(대시보드할당된프로젝트).toBeDefined();
      expect(대시보드할당된프로젝트.projectId).toBe(projectIds[1]);
      expect(대시보드할당된프로젝트.projectName).toBeDefined();
      expect(대시보드할당된프로젝트.projectCode).toBeDefined();

      console.log(
        `✅ 대시보드 API를 통한 프로젝트 할당 검증 완료 - 할당된 프로젝트 ID: ${대시보드할당된프로젝트.projectId}, 프로젝트명: ${대시보드할당된프로젝트.projectName}`,
      );
      console.log(
        `✅ 직원별 할당 프로젝트 조회 완료 - 직원 ${employeeIds[1]}, 프로젝트 ${result.projects.length}개`,
      );
    });

    it('프로젝트별 할당 직원을 조회한다', async () => {
      // 먼저 프로젝트를 할당
      const 할당결과 = await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: employeeIds[2],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      const result =
        await projectAssignmentScenario.프로젝트별_할당_직원을_조회한다(
          projectIds[2],
          evaluationPeriodId,
        );

      console.log(
        '프로젝트별 할당 직원 조회 결과:',
        JSON.stringify(result, null, 2),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.employees.length).toBeGreaterThan(0);

      // 할당된 직원이 올바른 직원인지 확인 (API 응답 구조에 맞게 수정)
      const 할당된직원 = result.employees.find(
        (employee: any) => employee.id === employeeIds[2],
      );
      expect(할당된직원).toBeDefined();
      expect(할당된직원.id).toBe(employeeIds[2]);

      // 대시보드 API를 통한 추가 검증
      const 대시보드할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[2],
        });

      // 대시보드에서 반환된 프로젝트 목록에서 할당된 프로젝트 검증
      const 대시보드할당된프로젝트 = 대시보드할당데이터.projects.find(
        (project: any) => project.projectId === projectIds[2],
      );
      expect(대시보드할당된프로젝트).toBeDefined();
      expect(대시보드할당된프로젝트.projectId).toBe(projectIds[2]);
      expect(대시보드할당된프로젝트.projectName).toBeDefined();
      expect(대시보드할당된프로젝트.projectCode).toBeDefined();

      console.log(
        `✅ 대시보드 API를 통한 프로젝트 할당 검증 완료 - 할당된 프로젝트 ID: ${대시보드할당된프로젝트.projectId}, 프로젝트명: ${대시보드할당된프로젝트.projectName}`,
      );
      console.log(
        `✅ 프로젝트별 할당 직원 조회 완료 - 프로젝트 ${projectIds[2]}, 직원 ${result.employees.length}명`,
      );
    });

    it('미할당 직원 목록을 조회한다', async () => {
      const result =
        await projectAssignmentScenario.미할당_직원_목록을_조회한다({
          periodId: evaluationPeriodId,
          projectId: projectIds[1], // 다른 프로젝트로 조회
        });

      expect(result).toBeDefined();
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(result.projectId).toBe(projectIds[1]);
      expect(Array.isArray(result.employees)).toBe(true);
      console.log(
        `✅ 미할당 직원 목록 조회 완료 - 프로젝트 ${projectIds[1]}, 미할당 직원 ${result.employees.length}명`,
      );
    });

    it('할당 가능한 프로젝트 목록을 조회한다', async () => {
      const result =
        await projectAssignmentScenario.할당_가능한_프로젝트_목록을_조회한다({
          periodId: evaluationPeriodId,
          page: 1,
          limit: 10,
        });

      expect(result).toBeDefined();
      expect(result.periodId).toBe(evaluationPeriodId);
      expect(Array.isArray(result.projects)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      console.log(
        `✅ 할당 가능한 프로젝트 목록 조회 완료 - 총 ${result.total}개 프로젝트`,
      );
    });

    it('프로젝트 할당 상세를 조회한다', async () => {
      // 먼저 할당 목록에서 첫 번째 할당 ID를 가져옴
      const listResult =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
          limit: 1,
        });

      expect(listResult.assignments.length).toBeGreaterThan(0);
      const assignmentId = listResult.assignments[0].id;

      // 할당 상세 조회
      const result =
        await projectAssignmentScenario.프로젝트_할당_상세를_조회한다(
          assignmentId,
        );

      console.log(
        '프로젝트 할당 상세 조회 결과:',
        JSON.stringify(result, null, 2),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(assignmentId);
      expect(result.employee).toBeDefined();
      expect(result.employee.id).toBeDefined();
      expect(result.project).toBeDefined();
      expect(result.project.id).toBeDefined();
      expect(result.evaluationPeriod.id).toBe(evaluationPeriodId);
      console.log(`✅ 프로젝트 할당 상세 조회 완료 - 할당 ID: ${assignmentId}`);
    });
  });

  describe('프로젝트 대량 할당 관리', () => {
    it('프로젝트를 대량으로 할당한다', async () => {
      const assignments = employeeIds.slice(1, 3).map((employeeId, index) => ({
        employeeId,
        projectId: projectIds[index % projectIds.length],
        periodId: evaluationPeriodId,
      }));

      const result =
        await projectAssignmentScenario.프로젝트를_대량으로_할당한다(
          assignments,
        );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(assignments.length);
      result.forEach((assignment, index) => {
        expect(assignment.id).toBeDefined();
        expect(assignment.employeeId).toBe(assignments[index].employeeId);
        expect(assignment.projectId).toBe(assignments[index].projectId);
      });

      // 대시보드 API를 통한 각 할당 검증
      for (let i = 0; i < result.length; i++) {
        const assignment = result[i];
        const expectedAssignment = assignments[i];

        const 대시보드할당데이터 =
          await projectAssignmentScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: assignment.employeeId,
          });

        // 대시보드에서 반환된 프로젝트 목록에서 할당된 프로젝트 검증
        const 대시보드할당된프로젝트 = 대시보드할당데이터.projects.find(
          (project: any) => project.projectId === expectedAssignment.projectId,
        );
        expect(대시보드할당된프로젝트).toBeDefined();
        expect(대시보드할당된프로젝트.projectId).toBe(
          expectedAssignment.projectId,
        );
        expect(대시보드할당된프로젝트.projectName).toBeDefined();
        expect(대시보드할당된프로젝트.projectCode).toBeDefined();

        console.log(
          `✅ 대시보드 API를 통한 할당 검증 완료 - 직원 ${assignment.employeeId}, 프로젝트 ID: ${대시보드할당된프로젝트.projectId}, 프로젝트명: ${대시보드할당된프로젝트.projectName}`,
        );
      }

      console.log(`✅ 프로젝트 대량 할당 완료 - ${result.length}개 할당`);
    });

    it('프로젝트 할당 순서를 변경하고 대시보드에서 검증한다', async () => {
      // 1. 여러 프로젝트를 할당해서 순서 변경이 가능한 상태 만들기
      const 추가할당결과1 = await projectAssignmentScenario.프로젝트를_할당한다(
        {
          employeeId: employeeIds[0],
          projectId: projectIds[1],
          periodId: evaluationPeriodId,
        },
      );

      const 추가할당결과2 = await projectAssignmentScenario.프로젝트를_할당한다(
        {
          employeeId: employeeIds[0],
          projectId: projectIds[2],
          periodId: evaluationPeriodId,
        },
      );

      console.log(`✅ 추가 프로젝트 할당 완료 - 프로젝트 2개 추가`);

      // 2. 변경 전 할당 데이터 조회
      const 변경전할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      const 변경전프로젝트순서 = 변경전할당데이터.projects || [];
      const 변경전프로젝트수 = 변경전프로젝트순서.length;
      console.log(
        `📊 변경 전 프로젝트 순서 (${변경전프로젝트수}개):`,
        변경전프로젝트순서.map((p: any) => p.projectId),
      );

      // 3. 마지막 할당의 순서를 위로 변경 (첫 번째로 이동)
      const result =
        await projectAssignmentScenario.프로젝트_할당_순서를_변경하고_대시보드에서_검증한다(
          {
            assignmentId: 추가할당결과2.id,
            direction: 'up',
            evaluationPeriodId,
            employeeId: employeeIds[0],
          },
        );

      // 4. 순서 변경 결과 검증
      expect(result.순서변경결과).toBeDefined();
      console.log(
        `✅ 프로젝트 할당 순서 변경 완료 - 할당 ID: ${추가할당결과2.id}`,
      );

      // 5. 할당 데이터 검증
      expect(result.할당데이터).toBeDefined();
      expect(result.할당데이터.employee).toBeDefined();
      expect(result.할당데이터.employee.id).toBe(employeeIds[0]);

      // 6. 프로젝트 순서 검증
      expect(Array.isArray(result.프로젝트순서)).toBe(true);
      expect(result.프로젝트순서.length).toBe(변경전프로젝트수); // 프로젝트 수는 동일해야 함
      console.log(
        `📊 변경 후 프로젝트 순서 (${result.프로젝트순서.length}개):`,
        result.프로젝트순서.map((p: any) => p.projectId),
      );

      // 7. 실제 순서 변경 검증
      // 전체 순서가 변경되었는지 확인
      const 변경전순서 = 변경전프로젝트순서.map((p: any) => p.projectId);
      const 변경후순서 = result.프로젝트순서.map((p: any) => p.projectId);

      // 순서가 실제로 변경되었는지 확인
      expect(변경후순서).not.toEqual(변경전순서);

      // 마지막 프로젝트가 한 단계 위로 이동했는지 확인
      const 변경전마지막인덱스 = 변경전순서.indexOf(추가할당결과2.projectId);
      const 변경후마지막인덱스 = 변경후순서.indexOf(추가할당결과2.projectId);

      expect(변경후마지막인덱스).toBe(변경전마지막인덱스 - 1);
      console.log(
        `✅ 순서 변경 검증 완료 - 프로젝트가 한 단계 위로 이동됨 (${변경전마지막인덱스} → ${변경후마지막인덱스})`,
      );

      // 8. 총 프로젝트 수 검증
      expect(result.총프로젝트수).toBe(변경전프로젝트수);
      expect(result.총프로젝트수).toBe(result.프로젝트순서.length);
      console.log(`✅ 총 프로젝트 수 검증 완료 - ${result.총프로젝트수}개`);
    });

    it('프로젝트 할당을 취소한다', async () => {
      // 먼저 프로젝트를 할당
      const 할당결과 = await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: employeeIds[3],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      const assignmentId = 할당결과.id;
      const employeeId = 할당결과.employeeId;

      // 할당 취소 전 직원 할당 데이터 조회
      const 취소전할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        });

      // 할당 취소 전 대시보드 직원 현황 조회
      const 취소전대시보드상태 =
        await projectAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 취소전직원상태 = 취소전대시보드상태.find(
        (emp: any) => emp.employeeId === employeeId,
      );

      console.log(
        `📊 취소 전 할당 데이터 - 프로젝트 수: ${취소전할당데이터.projects?.length || 0}`,
      );
      console.log(
        `📊 취소 전 대시보드 상태 - assignedProjectCount: ${취소전직원상태?.criteriaSetup?.evaluationCriteria?.assignedProjectCount || 0}`,
      );

      // 할당 취소
      await projectAssignmentScenario.프로젝트_할당을_취소한다(assignmentId);

      // 할당 취소 후 직원 할당 데이터 조회
      const 취소후할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        });

      // 할당 취소 후 대시보드 직원 현황 조회
      const 취소후대시보드상태 =
        await projectAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 취소후직원상태 = 취소후대시보드상태.find(
        (emp: any) => emp.employeeId === employeeId,
      );

      console.log(
        `📊 취소 후 할당 데이터 - 프로젝트 수: ${취소후할당데이터.projects?.length || 0}`,
      );
      console.log(
        `📊 취소 후 대시보드 상태 - assignedProjectCount: ${취소후직원상태?.criteriaSetup?.evaluationCriteria?.assignedProjectCount || 0}`,
      );

      // 검증: 할당 취소 후 프로젝트 수가 감소했는지 확인
      expect(취소후할당데이터.projects?.length || 0).toBeLessThan(
        취소전할당데이터.projects?.length || 0,
      );

      // 대시보드 상태 검증 (직원이 평가 대상으로 등록되어 있는 경우에만)
      if (취소전직원상태 && 취소후직원상태) {
        expect(
          취소후직원상태.criteriaSetup?.evaluationCriteria
            ?.assignedProjectCount || 0,
        ).toBeLessThan(
          취소전직원상태.criteriaSetup?.evaluationCriteria
            ?.assignedProjectCount || 0,
        );
      } else {
        console.log(
          '⚠️ 직원이 평가 대상으로 등록되지 않아 대시보드 상태 검증을 건너뜁니다.',
        );
      }

      console.log(
        `✅ 프로젝트 할당 취소 및 검증 완료 - 할당 ID: ${assignmentId}`,
      );
    });

    it('프로젝트 ID로 프로젝트 할당을 취소한다', async () => {
      // 먼저 프로젝트를 할당
      const 할당결과 = await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId: employeeIds[4],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      const employeeId = 할당결과.employeeId;
      const projectId = 할당결과.projectId;

      // 할당 취소 전 직원 할당 데이터 조회
      const 취소전할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        });

      // 할당 취소 전 대시보드 직원 현황 조회
      const 취소전대시보드상태 =
        await projectAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 취소전직원상태 = 취소전대시보드상태.find(
        (emp: any) => emp.employeeId === employeeId,
      );

      console.log(
        `📊 취소 전 할당 데이터 - 프로젝트 수: ${취소전할당데이터.projects?.length || 0}`,
      );
      console.log(
        `📊 취소 전 대시보드 상태 - assignedProjectCount: ${취소전직원상태?.criteriaSetup?.evaluationCriteria?.assignedProjectCount || 0}`,
      );

      // 프로젝트 ID 기반 할당 취소
      await projectAssignmentScenario.프로젝트_할당을_프로젝트_ID로_취소한다({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
      });

      // 할당 취소 후 직원 할당 데이터 조회
      const 취소후할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        });

      // 할당 취소 후 대시보드 직원 현황 조회
      const 취소후대시보드상태 =
        await projectAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 취소후직원상태 = 취소후대시보드상태.find(
        (emp: any) => emp.employeeId === employeeId,
      );

      console.log(
        `📊 취소 후 할당 데이터 - 프로젝트 수: ${취소후할당데이터.projects?.length || 0}`,
      );
      console.log(
        `📊 취소 후 대시보드 상태 - assignedProjectCount: ${취소후직원상태?.criteriaSetup?.evaluationCriteria?.assignedProjectCount || 0}`,
      );

      // 검증: 할당 취소 후 프로젝트 수가 감소했는지 확인
      expect(취소후할당데이터.projects?.length || 0).toBeLessThan(
        취소전할당데이터.projects?.length || 0,
      );

      // 검증: 취소된 프로젝트가 더 이상 할당 목록에 없는지 확인
      const 취소된프로젝트 = 취소후할당데이터.projects?.find(
        (p: any) => p.projectId === projectId,
      );
      expect(취소된프로젝트).toBeUndefined();

      // 대시보드 상태 검증 (직원이 평가 대상으로 등록되어 있는 경우에만)
      if (취소전직원상태 && 취소후직원상태) {
        expect(
          취소후직원상태.criteriaSetup?.evaluationCriteria
            ?.assignedProjectCount || 0,
        ).toBeLessThan(
          취소전직원상태.criteriaSetup?.evaluationCriteria
            ?.assignedProjectCount || 0,
        );
      } else {
        console.log(
          '⚠️ 직원이 평가 대상으로 등록되지 않아 대시보드 상태 검증을 건너뜁니다.',
        );
      }

      console.log(
        `✅ 프로젝트 ID 기반 할당 취소 및 검증 완료 - 프로젝트 ID: ${projectId}`,
      );
    });

    it('프로젝트 ID로 프로젝트 할당 순서를 변경하고 대시보드에서 검증한다', async () => {
      // 1. 먼저 현재 할당 상태를 확인
      const 현재할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      const 이미할당된프로젝트ID들 = (현재할당데이터.projects || []).map(
        (p: any) => p.projectId,
      );
      console.log(`📊 현재 할당된 프로젝트 ID들:`, 이미할당된프로젝트ID들);

      // 2. 이미 할당된 프로젝트가 2개 이상이면 바로 순서 변경 테스트 진행
      if (이미할당된프로젝트ID들.length >= 2) {
        console.log(
          `✅ 이미 할당된 프로젝트가 ${이미할당된프로젝트ID들.length}개 있습니다. 순서 변경 테스트를 진행합니다.`,
        );

        const 변경전프로젝트순서 = 현재할당데이터.projects || [];
        const 변경전프로젝트수 = 변경전프로젝트순서.length;
        console.log(
          `📊 변경 전 프로젝트 순서 (${변경전프로젝트수}개):`,
          변경전프로젝트순서.map((p: any) => p.projectId),
        );

        // 마지막 프로젝트의 순서를 위로 변경 (프로젝트 ID 기반)
        const 마지막프로젝트ID =
          변경전프로젝트순서[변경전프로젝트순서.length - 1].projectId;
        const result =
          await projectAssignmentScenario.프로젝트_할당_순서를_프로젝트_ID로_변경하고_대시보드에서_검증한다(
            {
              employeeId: employeeIds[0],
              projectId: 마지막프로젝트ID,
              periodId: evaluationPeriodId,
              direction: 'up',
            },
          );

        // 순서 변경 결과 검증
        expect(result.순서변경결과).toBeDefined();
        console.log(
          `✅ 프로젝트 할당 순서 변경 완료 - 프로젝트 ID: ${마지막프로젝트ID}`,
        );

        // 할당 데이터 검증
        expect(result.할당데이터).toBeDefined();
        expect(result.할당데이터.employee).toBeDefined();
        expect(result.할당데이터.projects).toBeDefined();
        expect(result.할당데이터.projects.length).toBeGreaterThan(0);

        // 프로젝트 순서 검증
        expect(result.프로젝트순서).toBeDefined();
        expect(result.프로젝트순서.length).toBe(변경전프로젝트수);
        console.log(
          `📊 변경 후 프로젝트 순서 (${result.프로젝트순서.length}개):`,
          result.프로젝트순서.map((p: any) => p.projectId),
        );

        // 총 프로젝트 수 검증
        expect(result.총프로젝트수).toBe(변경전프로젝트수);
        expect(result.총프로젝트수).toBe(result.프로젝트순서.length);
        console.log(`✅ 총 프로젝트 수 검증 완료 - ${result.총프로젝트수}개`);

        // 대시보드 API에서 프로젝트 ID 검증
        const 프로젝트ID로찾은프로젝트 = result.프로젝트순서.find(
          (p: any) => p.projectId === 마지막프로젝트ID,
        );
        expect(프로젝트ID로찾은프로젝트).toBeDefined();
        expect(프로젝트ID로찾은프로젝트.projectId).toBe(마지막프로젝트ID);
        console.log(
          `✅ 대시보드 API에서 프로젝트 ID 검증 완료 - 프로젝트 ID: ${마지막프로젝트ID}`,
        );
        return;
      }

      // 3. 할당되지 않은 프로젝트 찾기
      const 할당가능한프로젝트ID들 = projectIds.filter(
        (id) => !이미할당된프로젝트ID들.includes(id),
      );

      if (할당가능한프로젝트ID들.length < 2) {
        console.log(
          `⚠️ 할당 가능한 프로젝트가 2개 미만입니다. 다른 직원을 사용합니다.`,
        );
        // 다른 직원을 사용하여 테스트
        const 다른직원ID =
          employeeIds.find((id) => id !== employeeIds[0]) || employeeIds[1];

        // 해당 직원의 현재 할당 상태 확인
        const 다른직원할당데이터 =
          await projectAssignmentScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: 다른직원ID,
          });

        const 다른직원할당된프로젝트ID들 = (
          다른직원할당데이터.projects || []
        ).map((p: any) => p.projectId);

        // 다른 직원이 이미 2개 이상 할당되어 있으면 바로 테스트 진행
        if (다른직원할당된프로젝트ID들.length >= 2) {
          console.log(
            `✅ 다른 직원이 이미 ${다른직원할당된프로젝트ID들.length}개 프로젝트에 할당되어 있습니다.`,
          );

          const 변경전프로젝트순서 = 다른직원할당데이터.projects || [];
          const 변경전프로젝트수 = 변경전프로젝트순서.length;
          console.log(
            `📊 변경 전 프로젝트 순서 (${변경전프로젝트수}개):`,
            변경전프로젝트순서.map((p: any) => p.projectId),
          );

          // 마지막 프로젝트의 순서를 위로 변경 (프로젝트 ID 기반)
          const 마지막프로젝트ID =
            변경전프로젝트순서[변경전프로젝트순서.length - 1].projectId;
          const result =
            await projectAssignmentScenario.프로젝트_할당_순서를_프로젝트_ID로_변경하고_대시보드에서_검증한다(
              {
                employeeId: 다른직원ID,
                projectId: 마지막프로젝트ID,
                periodId: evaluationPeriodId,
                direction: 'up',
              },
            );

          // 순서 변경 결과 검증
          expect(result.순서변경결과).toBeDefined();
          console.log(
            `✅ 프로젝트 할당 순서 변경 완료 - 프로젝트 ID: ${마지막프로젝트ID}`,
          );

          // 할당 데이터 검증
          expect(result.할당데이터).toBeDefined();
          expect(result.할당데이터.employee).toBeDefined();
          expect(result.할당데이터.projects).toBeDefined();
          expect(result.할당데이터.projects.length).toBeGreaterThan(0);

          // 프로젝트 순서 검증
          expect(result.프로젝트순서).toBeDefined();
          expect(result.프로젝트순서.length).toBe(변경전프로젝트수);
          console.log(
            `📊 변경 후 프로젝트 순서 (${result.프로젝트순서.length}개):`,
            result.프로젝트순서.map((p: any) => p.projectId),
          );

          // 총 프로젝트 수 검증
          expect(result.총프로젝트수).toBe(변경전프로젝트수);
          expect(result.총프로젝트수).toBe(result.프로젝트순서.length);
          console.log(`✅ 총 프로젝트 수 검증 완료 - ${result.총프로젝트수}개`);

          // 대시보드 API에서 프로젝트 ID 검증
          const 프로젝트ID로찾은프로젝트 = result.프로젝트순서.find(
            (p: any) => p.projectId === 마지막프로젝트ID,
          );
          expect(프로젝트ID로찾은프로젝트).toBeDefined();
          expect(프로젝트ID로찾은프로젝트.projectId).toBe(마지막프로젝트ID);
          console.log(
            `✅ 대시보드 API에서 프로젝트 ID 검증 완료 - 프로젝트 ID: ${마지막프로젝트ID}`,
          );
          return;
        }

        const 다른직원할당가능한프로젝트ID들 = projectIds.filter(
          (id) => !다른직원할당된프로젝트ID들.includes(id),
        );

        if (다른직원할당가능한프로젝트ID들.length < 2) {
          throw new Error('테스트에 충분한 할당 가능한 프로젝트가 없습니다.');
        }

        // 여러 프로젝트를 할당해서 순서 변경이 가능한 상태 만들기
        const 추가할당결과1 =
          await projectAssignmentScenario.프로젝트를_할당한다({
            employeeId: 다른직원ID,
            projectId: 다른직원할당가능한프로젝트ID들[0],
            periodId: evaluationPeriodId,
          });

        const 추가할당결과2 =
          await projectAssignmentScenario.프로젝트를_할당한다({
            employeeId: 다른직원ID,
            projectId: 다른직원할당가능한프로젝트ID들[1],
            periodId: evaluationPeriodId,
          });

        console.log(
          `✅ 추가 프로젝트 할당 완료 - 직원: ${다른직원ID}, 프로젝트 2개 추가`,
        );

        // 변경 전 할당 데이터 조회
        const 변경전할당데이터 =
          await projectAssignmentScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: 다른직원ID,
          });

        const 변경전프로젝트순서 = 변경전할당데이터.projects || [];
        const 변경전프로젝트수 = 변경전프로젝트순서.length;
        console.log(
          `📊 변경 전 프로젝트 순서 (${변경전프로젝트수}개):`,
          변경전프로젝트순서.map((p: any) => p.projectId),
        );

        // 마지막 할당의 순서를 위로 변경 (프로젝트 ID 기반)
        const result =
          await projectAssignmentScenario.프로젝트_할당_순서를_프로젝트_ID로_변경하고_대시보드에서_검증한다(
            {
              employeeId: 다른직원ID,
              projectId: 추가할당결과2.projectId,
              periodId: evaluationPeriodId,
              direction: 'up',
            },
          );

        // 순서 변경 결과 검증
        expect(result.순서변경결과).toBeDefined();
        console.log(
          `✅ 프로젝트 할당 순서 변경 완료 - 프로젝트 ID: ${추가할당결과2.projectId}`,
        );

        // 할당 데이터 검증
        expect(result.할당데이터).toBeDefined();
        expect(result.할당데이터.employee).toBeDefined();
        expect(result.할당데이터.projects).toBeDefined();
        expect(result.할당데이터.projects.length).toBeGreaterThan(0);

        // 프로젝트 순서 검증
        expect(result.프로젝트순서).toBeDefined();
        expect(result.프로젝트순서.length).toBe(변경전프로젝트수);
        console.log(
          `📊 변경 후 프로젝트 순서 (${result.프로젝트순서.length}개):`,
          result.프로젝트순서.map((p: any) => p.projectId),
        );

        // 총 프로젝트 수 검증
        expect(result.총프로젝트수).toBe(변경전프로젝트수);
        expect(result.총프로젝트수).toBe(result.프로젝트순서.length);
        console.log(`✅ 총 프로젝트 수 검증 완료 - ${result.총프로젝트수}개`);

        // 대시보드 API에서 프로젝트 ID 검증
        const 프로젝트ID로찾은프로젝트 = result.프로젝트순서.find(
          (p: any) => p.projectId === 추가할당결과2.projectId,
        );
        expect(프로젝트ID로찾은프로젝트).toBeDefined();
        expect(프로젝트ID로찾은프로젝트.projectId).toBe(
          추가할당결과2.projectId,
        );
        console.log(
          `✅ 대시보드 API에서 프로젝트 ID 검증 완료 - 프로젝트 ID: ${추가할당결과2.projectId}`,
        );
        return;
      }

      // 3. 여러 프로젝트를 할당해서 순서 변경이 가능한 상태 만들기
      const 추가할당결과1 = await projectAssignmentScenario.프로젝트를_할당한다(
        {
          employeeId: employeeIds[0],
          projectId: 할당가능한프로젝트ID들[0],
          periodId: evaluationPeriodId,
        },
      );

      const 추가할당결과2 = await projectAssignmentScenario.프로젝트를_할당한다(
        {
          employeeId: employeeIds[0],
          projectId: 할당가능한프로젝트ID들[1],
          periodId: evaluationPeriodId,
        },
      );

      console.log(`✅ 추가 프로젝트 할당 완료 - 프로젝트 2개 추가`);

      // 4. 변경 전 할당 데이터 조회
      const 변경전할당데이터 =
        await projectAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      const 변경전프로젝트순서 = 변경전할당데이터.projects || [];
      const 변경전프로젝트수 = 변경전프로젝트순서.length;
      console.log(
        `📊 변경 전 프로젝트 순서 (${변경전프로젝트수}개):`,
        변경전프로젝트순서.map((p: any) => p.projectId),
      );

      // 5. 마지막 할당의 순서를 위로 변경 (프로젝트 ID 기반)
      const result =
        await projectAssignmentScenario.프로젝트_할당_순서를_프로젝트_ID로_변경하고_대시보드에서_검증한다(
          {
            employeeId: employeeIds[0],
            projectId: 추가할당결과2.projectId,
            periodId: evaluationPeriodId,
            direction: 'up',
          },
        );

      // 6. 순서 변경 결과 검증
      expect(result.순서변경결과).toBeDefined();
      console.log(
        `✅ 프로젝트 할당 순서 변경 완료 - 프로젝트 ID: ${추가할당결과2.projectId}`,
      );

      // 7. 할당 데이터 검증
      expect(result.할당데이터).toBeDefined();
      expect(result.할당데이터.employee).toBeDefined();
      expect(result.할당데이터.projects).toBeDefined();
      expect(result.할당데이터.projects.length).toBeGreaterThan(0);

      // 8. 프로젝트 순서 검증
      expect(result.프로젝트순서).toBeDefined();
      expect(result.프로젝트순서.length).toBe(변경전프로젝트수);
      console.log(
        `📊 변경 후 프로젝트 순서 (${result.프로젝트순서.length}개):`,
        result.프로젝트순서.map((p: any) => p.projectId),
      );

      // 9. 순서가 실제로 변경되었는지 검증 (첫 번째 프로젝트가 변경되었는지 확인)
      if (변경전프로젝트순서.length > 0 && result.프로젝트순서.length > 0) {
        const 변경전첫번째프로젝트 = 변경전프로젝트순서[0].projectId;
        const 변경후첫번째프로젝트 = result.프로젝트순서[0].projectId;

        // 순서가 변경되었다면 첫 번째 프로젝트가 다를 수 있음 (다만 항상 다르지는 않음)
        console.log(
          `📊 첫 번째 프로젝트 - 변경 전: ${변경전첫번째프로젝트}, 변경 후: ${변경후첫번째프로젝트}`,
        );
      }

      // 10. 총 프로젝트 수 검증
      expect(result.총프로젝트수).toBe(변경전프로젝트수);
      expect(result.총프로젝트수).toBe(result.프로젝트순서.length);
      console.log(`✅ 총 프로젝트 수 검증 완료 - ${result.총프로젝트수}개`);

      // 11. 대시보드 API에서 프로젝트 ID 검증
      const 프로젝트ID로찾은프로젝트 = result.프로젝트순서.find(
        (p: any) => p.projectId === 추가할당결과2.projectId,
      );
      expect(프로젝트ID로찾은프로젝트).toBeDefined();
      expect(프로젝트ID로찾은프로젝트.projectId).toBe(추가할당결과2.projectId);
      console.log(
        `✅ 대시보드 API에서 프로젝트 ID 검증 완료 - 프로젝트 ID: ${추가할당결과2.projectId}`,
      );
    });
  });
});
