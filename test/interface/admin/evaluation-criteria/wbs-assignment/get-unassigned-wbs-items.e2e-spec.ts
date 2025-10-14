import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/evaluation-criteria/wbs-assignments/unassigned', () => {
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

    console.log('할당되지 않은 WBS 항목 조회 테스트 데이터 생성 완료:', {
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

    const response = await request(app.getHttpServer())
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

  async function createWbsAssignment(
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
  ): Promise<any> {
    const assignedBy = testData.employees[0].id;

    const response = await request(app.getHttpServer())
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

  describe('전체 미할당 조회', () => {
    it('employeeId 없이 프로젝트의 모든 미할당 WBS를 조회할 수 있어야 한다', async () => {
      // Given: 평가기간과 일부 WBS만 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      // 첫 번째 WBS만 할당
      const wbsItem1 = testData.wbsItems[0];
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem1.id);

      // When: 미할당 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId })
        .expect(200);

      // Then: 할당되지 않은 WBS만 반환
      expect(response.body).toBeDefined();
      expect(response.body.wbsItems).toBeInstanceOf(Array);
      expect(response.body.wbsItems.length).toBe(testData.wbsItems.length - 1);
      const returnedIds = response.body.wbsItems.map((item: any) => item.id);
      expect(returnedIds).not.toContain(wbsItem1.id);

      // WBS 항목 객체 구조 검증
      expect(response.body.wbsItems[0]).toHaveProperty('id');
      expect(response.body.wbsItems[0]).toHaveProperty('wbsCode');
      expect(response.body.wbsItems[0]).toHaveProperty('title');
      expect(response.body.wbsItems[0]).toHaveProperty('projectId');
    });

    it('모두 할당된 경우 빈 배열을 반환해야 한다', async () => {
      // Given: 평가기간과 모든 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      // 모든 WBS 할당
      for (const wbsItem of testData.wbsItems) {
        await createWbsAssignment(
          periodId,
          employee.id,
          project.id,
          wbsItem.id,
        );
      }

      // When: 미할당 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId })
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body.wbsItems).toEqual([]);
    });

    it('할당이 없는 경우 모든 WBS를 반환해야 한다', async () => {
      // Given: 평가기간만 생성 (할당 없음)
      const periodId = await createEvaluationPeriod();
      const project = getActiveProject();

      // When: 미할당 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId })
        .expect(200);

      // Then: 모든 WBS 반환
      expect(response.body.wbsItems).toHaveLength(testData.wbsItems.length);
    });
  });

  describe('직원별 미할당 조회', () => {
    it('특정 직원에게 할당되지 않은 WBS만 조회되어야 한다', async () => {
      // Given: 두 직원이 각각 다른 WBS에 할당
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];

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

      // When: employee1에게 할당되지 않은 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId, employeeId: employee1.id })
        .expect(200);

      // Then: employee1에게 할당되지 않은 WBS만 반환
      const returnedIds = response.body.wbsItems.map((item: any) => item.id);
      expect(returnedIds).toContain(wbsItem2.id);
      expect(returnedIds).not.toContain(wbsItem1.id);
    });

    it('다른 직원에게 할당된 WBS는 미할당으로 간주되어야 한다', async () => {
      // Given: employee2에게만 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee2.id, project.id);

      const wbsItem = testData.wbsItems[0];
      await createWbsAssignment(periodId, employee2.id, project.id, wbsItem.id);

      // When: employee1에게 할당되지 않은 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId, employeeId: employee1.id })
        .expect(200);

      // Then: employee2에게 할당된 WBS도 미할당으로 반환
      const returnedIds = response.body.wbsItems.map((item: any) => item.id);
      expect(returnedIds).toContain(wbsItem.id);
    });
  });

  describe('취소된 할당 처리', () => {
    it('취소된 할당은 미할당으로 간주되어야 한다', async () => {
      // Given: WBS 할당 후 취소
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      const assignment = await createWbsAssignment(
        periodId,
        employee.id,
        project.id,
        wbsItem.id,
      );

      // 할당 취소
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .expect(200);

      // When: 미할당 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId })
        .expect(200);

      // Then: 취소된 WBS가 미할당으로 반환
      const returnedIds = response.body.wbsItems.map((item: any) => item.id);
      expect(returnedIds).toContain(wbsItem.id);
    });
  });

  describe('평가기간 격리', () => {
    it('다른 평가기간의 할당은 고려하지 않아야 한다', async () => {
      // Given: period1에 WBS 할당, period2는 빈 상태
      const period1Id = await createEvaluationPeriod();
      const period2Id = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(period1Id, employee.id, project.id);
      await createWbsAssignment(period1Id, employee.id, project.id, wbsItem.id);

      // When: period2의 미할당 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId: period2Id })
        .expect(200);

      // Then: period1의 할당은 무시되고 모든 WBS가 미할당으로 반환
      expect(response.body.wbsItems).toHaveLength(testData.wbsItems.length);
      const returnedIds = response.body.wbsItems.map((item: any) => item.id);
      expect(returnedIds).toContain(wbsItem.id);
    });
  });

  describe('검증 실패 시나리오', () => {
    it('필수 파라미터 projectId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가기간
      const periodId = await createEvaluationPeriod();

      // When & Then: projectId 없이 요청
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ periodId })
        .expect(400);
    });

    it('필수 파라미터 periodId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given: 프로젝트
      const project = getActiveProject();

      // When & Then: periodId 없이 요청
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id })
        .expect(400);
    });

    it('잘못된 UUID 형식의 projectId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가기간
      const periodId = await createEvaluationPeriod();

      // When & Then: 잘못된 UUID 형식으로 요청
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: 'invalid-uuid', periodId })
        .expect(400);
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 프로젝트
      const project = getActiveProject();

      // When & Then: 잘못된 UUID 형식으로 요청
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId: 'invalid-uuid' })
        .expect(400);
    });

    it('존재하지 않는 프로젝트 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가기간
      const periodId = await createEvaluationPeriod();
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 프로젝트로 조회
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: nonExistentProjectId, periodId })
        .expect(400);
    });

    it('존재하지 않는 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 프로젝트
      const project = getActiveProject();
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 평가기간으로 조회
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId: nonExistentPeriodId })
        .expect(400);
    });

    it('존재하지 않는 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가기간
      const periodId = await createEvaluationPeriod();
      const project = getActiveProject();
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 직원으로 조회
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: project.id,
          periodId,
          employeeId: nonExistentEmployeeId,
        })
        .expect(400);
    });
  });

  describe('일부 할당', () => {
    it('일부만 할당된 경우 미할당 WBS만 반환되어야 한다', async () => {
      // Given: 절반의 WBS만 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      const halfCount = Math.floor(testData.wbsItems.length / 2);
      const assignedWbsIds: string[] = [];

      for (let i = 0; i < halfCount; i++) {
        const wbsItem = testData.wbsItems[i];
        await createWbsAssignment(
          periodId,
          employee.id,
          project.id,
          wbsItem.id,
        );
        assignedWbsIds.push(wbsItem.id);
      }

      // When: 미할당 WBS 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: project.id, periodId })
        .expect(200);

      // Then: 미할당 WBS만 반환
      expect(response.body.wbsItems.length).toBe(
        testData.wbsItems.length - halfCount,
      );

      // 할당된 WBS는 포함되지 않음
      assignedWbsIds.forEach((assignedId) => {
        expect(response.body.wbsItems).not.toContain(assignedId);
      });
    });
  });
});
