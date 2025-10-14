import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';

describe('PATCH /admin/evaluation-criteria/project-assignments/:id/order', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();

    // 완전한 테스트 환경 생성
    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      departments,
      employees,
      projects,
    };

    console.log('프로젝트 할당 순서 변경 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // 테스트 데이터 헬퍼 함수
  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getActiveProject(): ProjectDto {
    return testData.projects.find((p) => p.isActive) || testData.projects[0];
  }

  /**
   * 평가기간 생성 헬퍼
   */
  async function createEvaluationPeriod(
    status: 'planned' | 'in_progress' | 'completed' = 'in_progress',
  ): Promise<string> {
    const timestamp = Date.now();
    const uniqueId = Math.floor(Math.random() * 10000);
    const year = 2030 + Math.floor(uniqueId % 50);
    const month = Math.floor((uniqueId % 12) + 1)
      .toString()
      .padStart(2, '0');
    const day = Math.floor((uniqueId % 28) + 1)
      .toString()
      .padStart(2, '0');

    const evaluationPeriodData = {
      name: `테스트 평가기간 ${timestamp}-${uniqueId}`,
      startDate: `${year}-${month}-${day}`,
      peerEvaluationDeadline: `${year}-${month}-${Math.min(
        parseInt(day) + 20,
        28,
      )
        .toString()
        .padStart(2, '0')}`,
      description: `테스트용 평가기간 ${timestamp}-${uniqueId}`,
      maxSelfEvaluationRate: 120,
    };

    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-periods')
      .send(evaluationPeriodData)
      .expect(201);

    const periodId = response.body.id;

    // 상태가 completed인 경우 DB에서 직접 상태 업데이트
    if (status === 'completed') {
      await dataSource.manager.update(
        'evaluation_period',
        { id: periodId },
        { status: 'completed' },
      );
    }

    return periodId;
  }

  /**
   * 프로젝트 할당 생성 헬퍼
   */
  async function createProjectAssignment(
    periodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<any> {
    // assignedBy는 실제 직원 ID를 사용 (UUID 형식이어야 함)
    const assignedBy = testData.employees[0].id;

    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        periodId,
        employeeId,
        projectId,
        assignedBy,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 직원의 프로젝트 할당 목록 조회 헬퍼
   * 주의: 프로젝트 할당 목록 API를 사용하여 할당 정보(ID, displayOrder 등)를 가져옵니다
   */
  async function getEmployeeProjectAssignments(
    periodId: string,
    employeeId: string,
  ): Promise<any[]> {
    const response = await request(app.getHttpServer())
      .get('/admin/evaluation-criteria/project-assignments')
      .query({ periodId, employeeId })
      .expect(200);

    // API 응답 구조는 { assignments, totalCount, page, limit }
    return response.body.assignments || [];
  }

  describe('순서 변경 성공 시나리오', () => {
    it('프로젝트 할당을 위로 이동할 수 있어야 한다', async () => {
      // Given: 3개의 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 3);

      const assignment1 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[0].id,
      );
      const assignment2 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[1].id,
      );
      const assignment3 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[2].id,
      );

      // When: 두 번째 할당을 위로 이동
      const updatedBy = employee.id; // UUID 형식이어야 함
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment2.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy })
        .expect(200);

      // Then: 순서가 변경되어야 함
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(assignment2.id);

      // 전체 목록 조회하여 순서 확인
      const assignments = await getEmployeeProjectAssignments(
        periodId,
        employee.id,
      );
      expect(assignments).toHaveLength(3);

      // assignment2가 assignment1보다 앞에 있어야 함
      const index1 = assignments.findIndex((a) => a.id === assignment1.id);
      const index2 = assignments.findIndex((a) => a.id === assignment2.id);
      const index3 = assignments.findIndex((a) => a.id === assignment3.id);

      expect(index2).toBeLessThan(index1);
      expect(index3).toBeGreaterThan(index1);
    });

    it('프로젝트 할당을 아래로 이동할 수 있어야 한다', async () => {
      // Given: 3개의 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 3);

      const assignment1 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[0].id,
      );
      const assignment2 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[1].id,
      );
      const assignment3 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[2].id,
      );

      // When: 두 번째 할당을 아래로 이동
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment2.id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // Then: 순서가 변경되어야 함
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(assignment2.id);

      // 전체 목록 조회하여 순서 확인
      const assignments = await getEmployeeProjectAssignments(
        periodId,
        employee.id,
      );
      expect(assignments).toHaveLength(3);

      // assignment2가 assignment3보다 뒤에 있어야 함
      const index1 = assignments.findIndex((a) => a.id === assignment1.id);
      const index2 = assignments.findIndex((a) => a.id === assignment2.id);
      const index3 = assignments.findIndex((a) => a.id === assignment3.id);

      expect(index2).toBeGreaterThan(index3);
      expect(index1).toBeLessThan(index3);
    });

    it('첫 번째 항목을 위로 이동하면 순서가 유지되어야 한다', async () => {
      // Given: 3개의 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 3);

      const assignment1 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[0].id,
      );
      await createProjectAssignment(periodId, employee.id, projects[1].id);
      await createProjectAssignment(periodId, employee.id, projects[2].id);

      // When: 첫 번째 할당을 위로 이동 시도
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment1.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // Then: 성공하지만 순서는 변경되지 않음
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(assignment1.id);

      // 순서 확인
      const assignments = await getEmployeeProjectAssignments(
        periodId,
        employee.id,
      );
      expect(assignments[0].id).toBe(assignment1.id);
    });

    it('마지막 항목을 아래로 이동하면 순서가 유지되어야 한다', async () => {
      // Given: 3개의 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 3);

      await createProjectAssignment(periodId, employee.id, projects[0].id);
      await createProjectAssignment(periodId, employee.id, projects[1].id);
      const assignment3 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[2].id,
      );

      // When: 마지막 할당을 아래로 이동 시도
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment3.id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // Then: 성공하지만 순서는 변경되지 않음
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(assignment3.id);

      // 순서 확인
      const assignments = await getEmployeeProjectAssignments(
        periodId,
        employee.id,
      );
      expect(assignments[assignments.length - 1].id).toBe(assignment3.id);
    });

    it('여러 번 순서를 변경할 수 있어야 한다', async () => {
      // Given: 4개의 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 4);

      const assignment1 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[0].id,
      );
      const assignment2 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[1].id,
      );
      const assignment3 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[2].id,
      );
      const assignment4 = await createProjectAssignment(
        periodId,
        employee.id,
        projects[3].id,
      );

      // When: 여러 번 순서 변경
      // 1. assignment4를 위로 이동 (4->3)
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment4.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // 2. assignment4를 위로 이동 (3->2)
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment4.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // 3. assignment1을 아래로 이동 (1->2)
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment1.id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // Then: 최종 순서 확인
      const assignments = await getEmployeeProjectAssignments(
        periodId,
        employee.id,
      );
      expect(assignments).toHaveLength(4);

      // 최종 순서: assignment4, assignment1, assignment2, assignment3
      expect(assignments[0].id).toBe(assignment4.id);
      expect(assignments[1].id).toBe(assignment1.id);
      expect(assignments[2].id).toBe(assignment2.id);
      expect(assignments[3].id).toBe(assignment3.id);
    });
  });

  describe('검증 실패 시나리오', () => {
    it('존재하지 않는 할당 ID로 순서 변경 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 할당 ID
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';

      // When & Then: 도메인 예외가 NotFoundException(404)로 변환됨
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-criteria/project-assignments/${fakeId}/order`)
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(404);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });

    it('잘못된 direction 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();

      const assignment = await createProjectAssignment(
        periodId,
        employee.id,
        project.id,
      );

      // When & Then: 잘못된 direction 값
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'invalid' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('완료된 평가기간의 할당 순서 변경 시 422 에러가 발생해야 한다', async () => {
      // Given: 진행 중인 평가기간에 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();

      const assignment = await createProjectAssignment(
        periodId,
        employee.id,
        project.id,
      );

      // Given: 평가기간을 완료 상태로 변경
      await dataSource.manager.update(
        'evaluation_period',
        { id: periodId },
        { status: 'completed' },
      );

      // When & Then: 완료된 평가기간의 순서 변경 시도
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(422);

      expect(response.body.message).toContain('완료된 평가기간');
    });

    it('UUID가 아닌 할당 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 형식의 ID
      const invalidId = 'not-a-uuid';

      // When & Then: UUID 검증 실패로 400 에러 발생 (ParseUUIDPipe)
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${invalidId}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(400);
    });

    it('direction 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given: 프로젝트 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();

      const assignment = await createProjectAssignment(
        periodId,
        employee.id,
        project.id,
      );

      // When & Then: direction 필드 누락
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${assignment.id}/order`,
        )
        .send({ updatedBy: testData.employees[0].id })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('다중 직원 시나리오', () => {
    it('서로 다른 직원의 프로젝트 할당 순서는 독립적으로 관리되어야 한다', async () => {
      // Given: 동일한 평가기간에 두 명의 직원이 각각 프로젝트 할당
      const periodId = await createEvaluationPeriod('in_progress');
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const projects = testData.projects.slice(0, 2);

      // 직원1의 프로젝트 할당
      const emp1Assignment1 = await createProjectAssignment(
        periodId,
        employee1.id,
        projects[0].id,
      );
      const emp1Assignment2 = await createProjectAssignment(
        periodId,
        employee1.id,
        projects[1].id,
      );

      // 직원2의 프로젝트 할당
      const emp2Assignment1 = await createProjectAssignment(
        periodId,
        employee2.id,
        projects[0].id,
      );
      const emp2Assignment2 = await createProjectAssignment(
        periodId,
        employee2.id,
        projects[1].id,
      );

      // When: 직원1의 두 번째 할당을 위로 이동
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${emp1Assignment2.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // Then: 직원1의 순서만 변경되고 직원2의 순서는 유지되어야 함
      const emp1Assignments = await getEmployeeProjectAssignments(
        periodId,
        employee1.id,
      );
      const emp2Assignments = await getEmployeeProjectAssignments(
        periodId,
        employee2.id,
      );

      // 직원1: 순서가 바뀜
      expect(emp1Assignments[0].id).toBe(emp1Assignment2.id);
      expect(emp1Assignments[1].id).toBe(emp1Assignment1.id);

      // 직원2: 순서 유지
      expect(emp2Assignments[0].id).toBe(emp2Assignment1.id);
      expect(emp2Assignments[1].id).toBe(emp2Assignment2.id);
    });

    it('서로 다른 평가기간의 프로젝트 할당 순서는 독립적으로 관리되어야 한다', async () => {
      // Given: 두 개의 평가기간에 동일한 직원이 프로젝트 할당
      const period1Id = await createEvaluationPeriod('in_progress');
      const period2Id = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const projects = testData.projects.slice(0, 2);

      // 평가기간1의 프로젝트 할당
      const p1Assignment1 = await createProjectAssignment(
        period1Id,
        employee.id,
        projects[0].id,
      );
      const p1Assignment2 = await createProjectAssignment(
        period1Id,
        employee.id,
        projects[1].id,
      );

      // 평가기간2의 프로젝트 할당
      const p2Assignment1 = await createProjectAssignment(
        period2Id,
        employee.id,
        projects[0].id,
      );
      const p2Assignment2 = await createProjectAssignment(
        period2Id,
        employee.id,
        projects[1].id,
      );

      // When: 평가기간1의 두 번째 할당을 위로 이동
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-criteria/project-assignments/${p1Assignment2.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: testData.employees[0].id })
        .expect(200);

      // Then: 평가기간1의 순서만 변경되고 평가기간2의 순서는 유지되어야 함
      const p1Assignments = await getEmployeeProjectAssignments(
        period1Id,
        employee.id,
      );
      const p2Assignments = await getEmployeeProjectAssignments(
        period2Id,
        employee.id,
      );

      // 평가기간1: 순서가 바뀜
      expect(p1Assignments[0].id).toBe(p1Assignment2.id);
      expect(p1Assignments[1].id).toBe(p1Assignment1.id);

      // 평가기간2: 순서 유지
      expect(p2Assignments[0].id).toBe(p2Assignment1.id);
      expect(p2Assignments[1].id).toBe(p2Assignment2.id);
    });
  });
});
