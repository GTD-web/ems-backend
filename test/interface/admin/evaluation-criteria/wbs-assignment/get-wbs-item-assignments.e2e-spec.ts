import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/evaluation-criteria/wbs-assignments/wbs-item/:wbsItemId/period/:periodId', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
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

    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
    };

    console.log('WBS 항목 할당된 직원 조회 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getActiveProject(): ProjectDto {
    return testData.projects.find((p) => p.isActive) || testData.projects[0];
  }

  async function getWbsItemsFromProject(
    projectId: string,
  ): Promise<WbsItemDto[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_item WHERE "projectId" = $1 ORDER BY "wbsCode" ASC`,
      [projectId],
    );
    return result;
  }

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

    const response = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(evaluationPeriodData)
      .expect(201);

    const periodId = response.body.id;

    if (status === 'completed') {
      await dataSource.manager.update(
        'evaluation_period',
        { id: periodId },
        { status: 'completed' },
      );
    }

    return periodId;
  }

  async function createProjectAssignment(
    periodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<any> {
    const assignedBy = testData.employees[0].id;

    const response = await testSuite
      .request()
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

  async function createWbsAssignment(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
  ): Promise<any> {
    const assignedBy = testData.employees[0].id;

    const response = await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        periodId,
        employeeId,
        projectId,
        wbsItemId,
        assignedBy,
      })
      .expect(201);

    return response.body;
  }

  // ==================== 테스트 케이스 ====================

  describe('기본 조회', () => {
    it('특정 WBS 항목의 특정 평가기간 직원 할당을 조회할 수 있어야 한다', async () => {
      // Given: 평가기간, 프로젝트, WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      await createWbsAssignment(periodId, employee1.id, project.id, wbsItem.id);
      await createWbsAssignment(periodId, employee2.id, project.id, wbsItem.id);

      // When: WBS 항목의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${periodId}`,
        )
        .expect(200);

      // Then: 결과 확인
      expect(response.body).toBeDefined();
      expect(response.body.wbsAssignments).toBeInstanceOf(Array);
      expect(response.body.wbsAssignments).toHaveLength(2);

      response.body.wbsAssignments.forEach((assignment: any) => {
        expect(assignment.wbsItemId).toBe(wbsItem.id);
        expect(assignment.periodId).toBe(periodId);
        expect(assignment.projectId).toBe(project.id);
        expect(assignment.id).toBeDefined();
        expect(assignment.employeeId).toBeDefined();
      });
    });

    it('직원 할당이 없는 경우 빈 배열을 반환해야 한다', async () => {
      // Given: 평가기간만 생성 (직원 할당 없음)
      const periodId = await createEvaluationPeriod();
      const wbsItem = testData.wbsItems[0];

      // When: WBS 항목의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${periodId}`,
        )
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body.wbsAssignments).toEqual([]);
    });
  });

  describe('다중 할당', () => {
    it('여러 직원이 할당된 경우 모두 조회되어야 한다', async () => {
      // Given: 한 WBS에 여러 직원 할당
      const periodId = await createEvaluationPeriod();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      const assignmentCount = Math.min(3, testData.employees.length);
      for (let i = 0; i < assignmentCount; i++) {
        const employee = testData.employees[i];
        await createProjectAssignment(periodId, employee.id, project.id);
        await createWbsAssignment(
          periodId,
          employee.id,
          project.id,
          wbsItem.id,
        );
      }

      // When: WBS 항목의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${periodId}`,
        )
        .expect(200);

      // Then: 모든 직원 조회됨
      expect(response.body.wbsAssignments).toHaveLength(assignmentCount);
    });
  });

  describe('취소된 할당', () => {
    it('취소된 할당은 조회 결과에서 제외되어야 한다', async () => {
      // Given: WBS 할당 생성 및 취소
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      const assignment1 = await createWbsAssignment(
        periodId,
        employee1.id,
        project.id,
        wbsItem.id,
      );
      await createWbsAssignment(periodId, employee2.id, project.id, wbsItem.id);

      // 첫 번째 할당 취소
      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment1.id}`)
        .expect(200);

      // When: WBS 항목의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${periodId}`,
        )
        .expect(200);

      // Then: 취소되지 않은 할당만 조회됨
      expect(response.body.wbsAssignments).toHaveLength(1);
      expect(response.body.wbsAssignments[0].employeeId).toBe(employee2.id);
    });
  });

  describe('필터링 검증', () => {
    it('다른 WBS 항목의 할당은 조회되지 않아야 한다', async () => {
      // Given: 두 개의 WBS에 각각 직원 할당
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();
      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      await createWbsAssignment(
        periodId,
        employee1.id,
        project.id,
        wbsItem1.id,
      );
      await createWbsAssignment(
        periodId,
        employee2.id,
        project.id,
        wbsItem2.id,
      );

      // When: wbsItem1의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem1.id}/period/${periodId}`,
        )
        .expect(200);

      // Then: wbsItem1의 할당만 조회됨
      expect(response.body.wbsAssignments).toHaveLength(1);
      expect(response.body.wbsAssignments[0].wbsItemId).toBe(wbsItem1.id);
      expect(response.body.wbsAssignments[0].employeeId).toBe(employee1.id);
    });

    it('다른 평가기간의 할당은 조회되지 않아야 한다', async () => {
      // Given: 두 개의 평가기간에 각각 직원 할당
      const period1Id = await createEvaluationPeriod();
      const period2Id = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(period1Id, employee1.id, project.id);
      await createProjectAssignment(period2Id, employee2.id, project.id);

      await createWbsAssignment(
        period1Id,
        employee1.id,
        project.id,
        wbsItem.id,
      );
      await createWbsAssignment(
        period2Id,
        employee2.id,
        project.id,
        wbsItem.id,
      );

      // When: period1의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${period1Id}`,
        )
        .expect(200);

      // Then: period1의 할당만 조회됨
      expect(response.body.wbsAssignments).toHaveLength(1);
      expect(response.body.wbsAssignments[0].periodId).toBe(period1Id);
      expect(response.body.wbsAssignments[0].employeeId).toBe(employee1.id);
    });
  });

  describe('검증 실패 시나리오', () => {
    it('잘못된 UUID 형식의 wbsItemId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 유효한 평가기간
      const periodId = await createEvaluationPeriod();

      // When & Then: 잘못된 UUID 형식으로 요청
      await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/invalid-uuid/period/${periodId}`,
        )
        .expect(400);
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 유효한 WBS 항목
      const wbsItem = testData.wbsItems[0];

      // When & Then: 잘못된 UUID 형식으로 요청
      await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/invalid-uuid`,
        )
        .expect(400);
    });

    it('존재하지 않는 WBS 항목 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      // Given: 유효한 평가기간
      const periodId = await createEvaluationPeriod();
      const nonExistentWbsItemId = '00000000-0000-0000-0000-000000000000';

      // When: 존재하지 않는 WBS 항목으로 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${nonExistentWbsItemId}/period/${periodId}`,
        )
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body.wbsAssignments).toEqual([]);
    });

    it('존재하지 않는 평가기간 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      // Given: 유효한 WBS 항목
      const wbsItem = testData.wbsItems[0];
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When: 존재하지 않는 평가기간으로 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${nonExistentPeriodId}`,
        )
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body.wbsAssignments).toEqual([]);
    });
  });

  describe('연관 데이터', () => {
    it('조회 결과에 필수 연관 데이터가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 항목의 할당된 직원 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${periodId}`,
        )
        .expect(200);

      // Then: 필수 연관 데이터 포함 확인
      expect(response.body.wbsAssignments).toHaveLength(1);
      const assignment = response.body.wbsAssignments[0];

      expect(assignment).toHaveProperty('id');
      expect(assignment).toHaveProperty('employeeId');
      expect(assignment).toHaveProperty('periodId');
      expect(assignment).toHaveProperty('projectId');
      expect(assignment).toHaveProperty('wbsItemId');
      expect(assignment).toHaveProperty('assignedDate');
      expect(assignment).toHaveProperty('assignedBy');
      expect(assignment).toHaveProperty('createdAt');
      expect(assignment).toHaveProperty('updatedAt');
    });
  });
});
