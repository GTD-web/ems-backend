import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/evaluation-criteria/wbs-assignments', () => {
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

    // 완전한 테스트 환경 생성
    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
    };

    console.log('WBS 할당 목록 조회 테스트 데이터 생성 완료:', {
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

  function getRandomWbsItem(): WbsItemDto {
    return testData.wbsItems[
      Math.floor(Math.random() * testData.wbsItems.length)
    ];
  }

  /**
   * 프로젝트의 WBS 항목 조회
   */
  async function getWbsItemsFromProject(
    projectId: string,
  ): Promise<WbsItemDto[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_item WHERE "projectId" = $1 ORDER BY "wbsCode" ASC`,
      [projectId],
    );
    return result;
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
   * WBS 할당 생성 헬퍼
   */
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

  describe('기본 목록 조회', () => {
    it('모든 WBS 할당 목록을 조회할 수 있어야 한다', async () => {
      // Given: 평가기간, 프로젝트, WBS 항목, 할당 생성
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];

      await createWbsAssignment(periodId, employee.id, project.id, wbsItem1.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem2.id);

      // When: 목록 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .expect(200);

      // Then: 결과 확인
      expect(response.body).toBeDefined();
      expect(response.body.assignments).toBeInstanceOf(Array);
      expect(response.body.assignments.length).toBeGreaterThanOrEqual(2);
      expect(response.body.totalCount).toBeGreaterThanOrEqual(2);
    });

    it('빈 목록을 조회할 수 있어야 한다', async () => {
      // Given: 할당이 하나도 없는 상태

      // When: 목록 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body.assignments).toEqual([]);
      expect(response.body.totalCount).toBe(0);
    });
  });

  describe('필터링', () => {
    it('평가기간 ID로 필터링할 수 있어야 한다', async () => {
      // Given: 두 개의 평가기간에 각각 WBS 할당
      const period1Id = await createEvaluationPeriod();
      const period2Id = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(period1Id, employee.id, project.id);
      await createProjectAssignment(period2Id, employee.id, project.id);

      const wbsItem = testData.wbsItems[0];

      await createWbsAssignment(period1Id, employee.id, project.id, wbsItem.id);
      await createWbsAssignment(period2Id, employee.id, project.id, wbsItem.id);

      // When: period1Id로 필터링
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ periodId: period1Id })
        .expect(200);

      // Then: period1Id의 할당만 조회됨
      expect(response.body.assignments).toHaveLength(1);
      expect(response.body.assignments[0].periodId).toBe(period1Id);
    });

    it('직원 ID로 필터링할 수 있어야 한다', async () => {
      // Given: 두 명의 직원에게 각각 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      const wbsItem = testData.wbsItems[0];

      await createWbsAssignment(periodId, employee1.id, project.id, wbsItem.id);
      await createWbsAssignment(periodId, employee2.id, project.id, wbsItem.id);

      // When: employee1Id로 필터링
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ employeeId: employee1.id })
        .expect(200);

      // Then: employee1의 할당만 조회됨
      expect(response.body.assignments).toHaveLength(1);
      expect(response.body.assignments[0].employeeId).toBe(employee1.id);
    });

    it('프로젝트 ID로 필터링할 수 있어야 한다', async () => {
      // Given: 하나의 프로젝트에 여러 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      // 동일 프로젝트의 WBS 항목 사용
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

      // When: projectId로 필터링
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ projectId: project.id })
        .expect(200);

      // Then: 해당 프로젝트의 할당만 조회됨 (2개)
      expect(response.body.assignments).toHaveLength(2);
      expect(response.body.assignments[0].projectId).toBe(project.id);
      expect(response.body.assignments[1].projectId).toBe(project.id);
    });

    it('WBS 항목 ID로 필터링할 수 있어야 한다', async () => {
      // Given: 동일 프로젝트의 두 개의 WBS 항목에 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];

      await createWbsAssignment(periodId, employee.id, project.id, wbsItem1.id);
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem2.id);

      // When: wbsItem1Id로 필터링
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ wbsItemId: wbsItem1.id })
        .expect(200);

      // Then: wbsItem1의 할당만 조회됨
      expect(response.body.assignments).toHaveLength(1);
      expect(response.body.assignments[0].wbsItemId).toBe(wbsItem1.id);
    });

    it('여러 필터를 조합하여 조회할 수 있어야 한다', async () => {
      // Given: 여러 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee1.id, project.id);
      await createProjectAssignment(periodId, employee2.id, project.id);

      const wbsItem = testData.wbsItems[0];

      await createWbsAssignment(periodId, employee1.id, project.id, wbsItem.id);
      await createWbsAssignment(periodId, employee2.id, project.id, wbsItem.id);

      // When: periodId + employeeId + projectId로 필터링
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({
          periodId,
          employeeId: employee1.id,
          projectId: project.id,
        })
        .expect(200);

      // Then: 조건에 맞는 할당만 조회됨
      expect(response.body.assignments).toHaveLength(1);
      expect(response.body.assignments[0].periodId).toBe(periodId);
      expect(response.body.assignments[0].employeeId).toBe(employee1.id);
      expect(response.body.assignments[0].projectId).toBe(project.id);
    });
  });

  describe('페이징', () => {
    it('페이지 크기를 지정하여 조회할 수 있어야 한다', async () => {
      // Given: 5개의 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      for (let i = 0; i < 5 && i < testData.wbsItems.length; i++) {
        const wbsItem = testData.wbsItems[i];
        await createWbsAssignment(
          periodId,
          employee.id,
          project.id,
          wbsItem.id,
        );
      }

      // When: limit=3으로 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ limit: 3 })
        .expect(200);

      // Then: 3개만 조회됨
      expect(response.body.assignments).toHaveLength(3);
      expect(response.body.totalCount).toBe(5);
      expect(response.body.limit).toBe(3);
    });

    it('특정 페이지를 조회할 수 있어야 한다', async () => {
      // Given: 5개의 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      for (let i = 0; i < 5 && i < testData.wbsItems.length; i++) {
        const wbsItem = testData.wbsItems[i];
        await createWbsAssignment(
          periodId,
          employee.id,
          project.id,
          wbsItem.id,
        );
      }

      // When: page=2, limit=2로 조회
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ page: 2, limit: 2 })
        .expect(200);

      // Then: 2페이지 데이터 조회됨
      expect(response.body.assignments).toHaveLength(2);
      expect(response.body.page).toBe(2);
      expect(response.body.totalCount).toBe(5);
    });
  });

  describe('정렬', () => {
    it('할당일 기준으로 정렬할 수 있어야 한다', async () => {
      // Given: 시간 차이를 두고 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];

      const assignment1 = await createWbsAssignment(
        periodId,
        employee.id,
        project.id,
        wbsItem1.id,
      );
      await new Promise((resolve) => setTimeout(resolve, 100)); // 시간 차이
      const assignment2 = await createWbsAssignment(
        periodId,
        employee.id,
        project.id,
        wbsItem2.id,
      );

      // When: assignedDate 기준 오름차순 정렬
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ orderBy: 'assignedDate', orderDirection: 'ASC' })
        .expect(200);

      // Then: 할당일 순서대로 정렬됨
      expect(response.body.assignments.length).toBeGreaterThanOrEqual(2);
      const firstAssignment = response.body.assignments[0];
      const secondAssignment = response.body.assignments[1];
      expect(
        new Date(firstAssignment.assignedDate).getTime(),
      ).toBeLessThanOrEqual(new Date(secondAssignment.assignedDate).getTime());
    });

    it('내림차순으로 정렬할 수 있어야 한다', async () => {
      // Given: WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee = getRandomEmployee();
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];

      await createWbsAssignment(periodId, employee.id, project.id, wbsItem1.id);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await createWbsAssignment(periodId, employee.id, project.id, wbsItem2.id);

      // When: assignedDate 기준 내림차순 정렬
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ orderBy: 'assignedDate', orderDirection: 'DESC' })
        .expect(200);

      // Then: 최신 할당이 먼저 조회됨
      expect(response.body.assignments.length).toBeGreaterThanOrEqual(2);
      const firstAssignment = response.body.assignments[0];
      const secondAssignment = response.body.assignments[1];
      expect(
        new Date(firstAssignment.assignedDate).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(secondAssignment.assignedDate).getTime(),
      );
    });
  });

  describe('검증 실패 시나리오', () => {
    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid';

      // When & Then: 400 에러 발생
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ periodId: invalidId })
        .expect(400);
    });

    it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'not-a-uuid';

      // When & Then: 400 에러 발생
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ employeeId: invalidId })
        .expect(400);
    });

    it('잘못된 page 값으로 요청 시 적절히 처리되어야 한다', async () => {
      // When & Then: 유효하지 않은 페이지 번호
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ page: 0 })
        .expect(200);

      // 빈 결과 또는 첫 페이지 반환
      expect(response.body.assignments).toBeInstanceOf(Array);
    });

    it('잘못된 orderDirection 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 정렬 방향
      const invalidDirection = 'INVALID';

      // When & Then: 400 에러 발생
      await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ orderDirection: invalidDirection })
        .expect(400);
    });
  });

  describe('복합 시나리오', () => {
    it('필터링, 페이징, 정렬을 동시에 적용할 수 있어야 한다', async () => {
      // Given: 여러 WBS 할당
      const periodId = await createEvaluationPeriod();
      const employee = testData.employees[0];
      const project = getActiveProject();

      await createProjectAssignment(periodId, employee.id, project.id);

      for (let i = 0; i < 5 && i < testData.wbsItems.length; i++) {
        const wbsItem = testData.wbsItems[i];
        await createWbsAssignment(
          periodId,
          employee.id,
          project.id,
          wbsItem.id,
        );
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // When: periodId 필터 + page=1 + limit=2 + 내림차순 정렬
      const response = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({
          periodId,
          page: 1,
          limit: 2,
          orderBy: 'assignedDate',
          orderDirection: 'DESC',
        })
        .expect(200);

      // Then: 조건에 맞게 조회됨
      expect(response.body.assignments).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalCount).toBe(5);

      // 내림차순 확인
      const firstDate = new Date(
        response.body.assignments[0].assignedDate,
      ).getTime();
      const secondDate = new Date(
        response.body.assignments[1].assignedDate,
      ).getTime();
      expect(firstDate).toBeGreaterThanOrEqual(secondDate);
    });
  });
});
