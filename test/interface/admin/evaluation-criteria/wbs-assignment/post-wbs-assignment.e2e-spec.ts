import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('POST /admin/evaluation-criteria/wbs-assignments', () => {
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

    // WBS 할당 및 관련 데이터 정리 (각 테스트에서 개별 생성하기 위해)
    // soft delete와 hard delete 모두 처리
    await dataSource.manager.query(`DELETE FROM wbs_evaluation_criteria`);
    await dataSource.manager.query(`DELETE FROM evaluation_line_mappings`);
    await dataSource.manager.query(`DELETE FROM evaluation_wbs_assignment`);

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
    };

    console.log('WBS 할당 생성 테스트 데이터 생성 완료:', {
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

  // ==================== 성공 시나리오 ====================

  describe('WBS 할당 생성 성공 시나리오', () => {
    it('직원에게 WBS를 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const wbsAssignmentData = {
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
        projectId: project.id,
        periodId,
        assignedBy,
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send(wbsAssignmentData)
        .expect(201);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.employeeId).toBe(employee.id);
      expect(response.body.wbsItemId).toBe(wbsItem.id);
      expect(response.body.projectId).toBe(project.id);
      expect(response.body.periodId).toBe(periodId);
      expect(response.body.assignedDate).toBeDefined();
    });

    it('여러 직원에게 같은 WBS를 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employees = [
        testData.employees[0],
        testData.employees[1],
        testData.employees[2],
      ];
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When
      const responses = await Promise.all(
        employees.map((employee) =>
          request(app.getHttpServer())
            .post('/admin/evaluation-criteria/wbs-assignments')
            .send({
              employeeId: employee.id,
              wbsItemId: wbsItem.id,
              projectId: project.id,
              periodId,
              assignedBy,
            })
            .expect(201),
        ),
      );

      // Then
      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.body.employeeId).toBe(employees[index].id);
        expect(response.body.wbsItemId).toBe(wbsItem.id);
      });
    });

    it('한 직원에게 여러 WBS를 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItems = [
        testData.wbsItems[0],
        testData.wbsItems[1],
        testData.wbsItems[2],
      ];
      const assignedBy = testData.employees[0].id;

      // When
      const responses = await Promise.all(
        wbsItems.map((wbsItem) =>
          request(app.getHttpServer())
            .post('/admin/evaluation-criteria/wbs-assignments')
            .send({
              employeeId: employee.id,
              wbsItemId: wbsItem.id,
              projectId: project.id,
              periodId,
              assignedBy,
            })
            .expect(201),
        ),
      );

      // Then
      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.wbsItemId).toBe(wbsItems[index].id);
      });
    });

    it('WBS 할당 시 빈 평가기준이 자동으로 생성되어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(201);

      // Then - 평가기준이 자동으로 생성되었는지 확인
      const criteria = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [wbsItem.id],
      );

      expect(criteria).toBeDefined();
      expect(criteria.length).toBeGreaterThan(0);
    });

    it('WBS 할당 시 평가라인이 자동으로 구성되어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = testData.employees.find((emp) => emp.managerId);
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee!.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(201);

      // Then - 평가라인 매핑이 생성되었는지 확인
      const mappings = await dataSource.manager.query(
        `SELECT * FROM evaluation_line_mappings WHERE "employeeId" = $1 AND "wbsItemId" = $2 AND "deletedAt" IS NULL`,
        [employee!.id, wbsItem.id],
      );

      // managerId가 있는 직원의 경우 평가라인이 구성되어야 함
      if (employee!.managerId) {
        expect(mappings.length).toBeGreaterThan(0);
      }
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('WBS 할당 생성 실패 시나리오', () => {
    it('필수 필드 누락 시 400 에러가 발생해야 한다 - employeeId 누락', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          // employeeId 누락
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(400);
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다 - wbsItemId 누락', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          // wbsItemId 누락
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(400);
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다 - projectId 누락', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          // projectId 누락
          periodId,
          assignedBy,
        })
        .expect(400);
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다 - periodId 누락', async () => {
      // Given
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          // periodId 누락
          assignedBy,
        })
        .expect(400);
    });

    it('존재하지 않는 employeeId로 요청 시 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: nonExistentEmployeeId,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(201);
    });

    it('존재하지 않는 wbsItemId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const assignedBy = testData.employees[0].id;
      const nonExistentWbsItemId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: nonExistentWbsItemId,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(400);
    });

    it('존재하지 않는 projectId로 요청 시 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: nonExistentProjectId,
          periodId,
          assignedBy,
        })
        .expect(201);
    });

    it('존재하지 않는 periodId로 요청 시 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      // Given
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId: nonExistentPeriodId,
          assignedBy,
        })
        .expect(201);
    });

    it('UUID가 아닌 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: 'invalid-uuid',
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(400);
    });
  });

  // ==================== 중복 할당 시나리오 ====================

  describe('중복 WBS 할당 시나리오', () => {
    it('동일한 직원-WBS-프로젝트-기간 조합으로 중복 할당 시 에러가 발생해야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const wbsAssignmentData = {
        employeeId: employee.id,
        wbsItemId: wbsItem.id,
        projectId: project.id,
        periodId,
        assignedBy,
      };

      // 첫 번째 할당 성공
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send(wbsAssignmentData)
        .expect(201);

      // When & Then - 동일한 조합으로 두 번째 할당 시도
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send(wbsAssignmentData)
        .expect(409);
    });
  });

  // ==================== 다양한 평가기간 상태 시나리오 ====================

  describe('평가기간 상태별 WBS 할당 시나리오', () => {
    it('진행중(in_progress) 평가기간에 WBS를 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(201);
    });

    it('계획됨(planned) 평가기간에 WBS를 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('planned');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })
        .expect(201);
    });
  });
});
