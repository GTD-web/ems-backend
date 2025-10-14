import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

describe('WBS 할당 상세 조회 (GET /admin/evaluation-criteria/wbs-assignments/detail)', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: any;

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

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p: any) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
    };
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  // 헬퍼 함수: WBS 항목 조회
  async function getWbsItemsFromProject(projectId: string): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_item WHERE "projectId" = $1 ORDER BY "wbsCode" ASC`,
      [projectId],
    );
    return result;
  }

  // 헬퍼 함수: 평가기간 생성
  const createEvaluationPeriod = async (): Promise<string> => {
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

    return response.body.id;
  };

  // 헬퍼 함수: 프로젝트 할당 생성
  const createProjectAssignment = async (
    periodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<void> => {
    await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        periodId,
        employeeId,
        projectId,
        assignedBy: testData.employees[0].id,
      })
      .expect(201);
  };

  // 헬퍼 함수: WBS 할당 생성
  const createWbsAssignment = async (
    periodId: string,
    employeeId: string,
    projectId: string,
    wbsItemId: string,
  ): Promise<any> => {
    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        periodId,
        employeeId,
        projectId,
        wbsItemId,
        assignedBy: testData.employees[0].id,
      })
      .expect(201);

    return response.body;
  };

  // 헬퍼 함수: 랜덤 직원 선택
  const getRandomEmployee = () => {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  };

  // 헬퍼 함수: 활성 프로젝트 선택
  const getActiveProject = () => {
    return testData.projects.find((p: any) => p.isActive) || testData.projects[0];
  };

  describe('성공 케이스', () => {
    it('WBS 할당 상세 정보를 성공적으로 조회할 수 있어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: 기본 할당 정보 확인
      expect(response.body).toHaveProperty('id');
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.projectId).toBe(project.id);
      expect(response.body.periodId).toBe(periodId);
      expect(response.body).toHaveProperty('assignedDate');
      expect(response.body).toHaveProperty('assignedBy');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('연관된 직원 정보가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: 직원 정보 확인
      expect(response.body.employee).toBeDefined();
      expect(response.body.employee.id).toBe(employee.id);
      expect(response.body.employee.name).toBe(employee.name);
      expect(response.body.employee).toHaveProperty('employeeNumber');
      expect(response.body.employee).toHaveProperty('email');
      expect(response.body.employee).toHaveProperty('status');
    });

    it('연관된 부서 정보가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: 부서 정보 확인
      if (response.body.department) {
        expect(response.body.department).toHaveProperty('id');
        expect(response.body.department).toHaveProperty('name');
        expect(response.body.department).toHaveProperty('code');
      }
    });

    it('연관된 프로젝트 정보가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: 프로젝트 정보 확인
      expect(response.body.project).toBeDefined();
      expect(response.body.project.id).toBe(project.id);
      expect(response.body.project.name).toBe(project.name);
      expect(response.body.project).toHaveProperty('code');
      expect(response.body.project).toHaveProperty('status');
      expect(response.body.project).toHaveProperty('startDate');
      expect(response.body.project).toHaveProperty('endDate');
    });

    it('연관된 WBS 항목 정보가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: WBS 항목 정보 확인
      expect(response.body.wbsItem).toBeDefined();
      expect(response.body.wbsItem.id).toBe(wbsItem.id);
      expect(response.body.wbsItem).toHaveProperty('wbsCode');
      expect(response.body.wbsItem).toHaveProperty('title');
      expect(response.body.wbsItem).toHaveProperty('status');
      expect(response.body.wbsItem).toHaveProperty('level');
      expect(response.body.wbsItem).toHaveProperty('startDate');
      expect(response.body.wbsItem).toHaveProperty('endDate');
      expect(response.body.wbsItem).toHaveProperty('progressPercentage');
    });

    it('연관된 평가기간 정보가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: 평가기간 정보 확인
      expect(response.body.period).toBeDefined();
      expect(response.body.period.id).toBe(periodId);
      expect(response.body.period).toHaveProperty('name');
      expect(response.body.period).toHaveProperty('startDate');
      expect(response.body.period).toHaveProperty('endDate');
      expect(response.body.period).toHaveProperty('status');
    });

    it('연관된 할당자 정보가 포함되어야 한다', async () => {
      // Given: WBS 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];
      const assignedBy = testData.employees[0];

      await createProjectAssignment(periodId, employee.id, project.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem.id);

      // When: WBS 할당 상세 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(200);

      // Then: 할당자 정보 확인
      expect(response.body.assignedByEmployee).toBeDefined();
      expect(response.body.assignedByEmployee.id).toBe(assignedBy.id);
      expect(response.body.assignedByEmployee).toHaveProperty('name');
      expect(response.body.assignedByEmployee).toHaveProperty('employeeNumber');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 조합으로 조회 시 404 에러를 반환해야 한다', async () => {
      // Given: 존재하지 않는 조합의 UUID
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      // When & Then: 존재하지 않는 조합으로 조회
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(404);
    });

    it('취소된 WBS 할당은 조회되지 않아야 한다', async () => {
      // Given: WBS 할당 생성 후 취소
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

      // WBS 할당 취소
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .expect(200);

      // When & Then: 취소된 할당 조회 시 404
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(404);
    });

    it('employeeId가 누락된 경우 400 에러를 반환해야 한다', async () => {
      // Given: 필수 파라미터 누락
      const periodId = await createEvaluationPeriod();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(400);
    });

    it('wbsItemId가 누락된 경우 400 에러를 반환해야 한다', async () => {
      // Given: 필수 파라미터 누락
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          projectId: project.id,
          periodId,
        })
        .expect(400);
    });

    it('projectId가 누락된 경우 400 에러를 반환해야 한다', async () => {
      // Given: 필수 파라미터 누락
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          periodId,
        })
        .expect(400);
    });

    it('periodId가 누락된 경우 400 에러를 반환해야 한다', async () => {
      // Given: 필수 파라미터 누락
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
        })
        .expect(400);
    });

    it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러를 반환해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const periodId = await createEvaluationPeriod();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: 'invalid-uuid',
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
        })
        .expect(400);
    });

    it('잘못된 UUID 형식의 wbsItemId로 요청 시 400 에러를 반환해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: 'invalid-uuid',
          projectId: project.id,
          periodId,
        })
        .expect(400);
    });

    it('잘못된 UUID 형식의 projectId로 요청 시 400 에러를 반환해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: 'invalid-uuid',
          periodId,
        })
        .expect(400);
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러를 반환해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = testData.wbsItems[0];

      // When & Then
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments/detail')
        .query({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: 'invalid-uuid',
        })
        .expect(400);
    });
  });
});

