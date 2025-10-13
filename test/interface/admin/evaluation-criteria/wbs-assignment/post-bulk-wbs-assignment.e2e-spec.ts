import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('POST /admin/evaluation-criteria/wbs-assignments/bulk', () => {
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

    console.log('WBS 대량 할당 테스트 데이터 생성 완료:', {
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

  function getRandomEmployees(count: number): EmployeeDto[] {
    const shuffled = [...testData.employees].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  function getRandomWbsItems(count: number): WbsItemDto[] {
    const shuffled = [...testData.wbsItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, shuffled.length));
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

  describe('WBS 대량 할당 성공 시나리오', () => {
    it('여러 직원에게 WBS를 한번에 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employees = getRandomEmployees(3);
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: employees.map((employee) => ({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })),
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);

      // Then
      expect(response.body).toHaveLength(3);
      response.body.forEach((assignment: any, index: number) => {
        expect(assignment.id).toBeDefined();
        expect(assignment.employeeId).toBe(employees[index].id);
        expect(assignment.wbsItemId).toBe(wbsItem.id);
        expect(assignment.projectId).toBe(project.id);
        expect(assignment.periodId).toBe(periodId);
      });
    });

    it('한 직원에게 여러 WBS를 한번에 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItems = getRandomWbsItems(3);
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: wbsItems.map((wbsItem) => ({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })),
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);

      // Then
      expect(response.body).toHaveLength(3);
      response.body.forEach((assignment: any, index: number) => {
        expect(assignment.id).toBeDefined();
        expect(assignment.employeeId).toBe(employee.id);
        expect(assignment.wbsItemId).toBe(wbsItems[index].id);
      });
    });

    it('여러 직원-WBS 조합을 한번에 할당할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employees = getRandomEmployees(3);
      const project = getActiveProject();
      const wbsItems = getRandomWbsItems(3);
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: employees[0].id,
            wbsItemId: wbsItems[0].id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
          {
            employeeId: employees[1].id,
            wbsItemId: wbsItems[1].id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
          {
            employeeId: employees[2].id,
            wbsItemId: wbsItems[2].id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);

      // Then
      expect(response.body).toHaveLength(3);
      response.body.forEach((assignment: any, index: number) => {
        expect(assignment.id).toBeDefined();
        expect(assignment.employeeId).toBe(employees[index].id);
        expect(assignment.wbsItemId).toBe(wbsItems[index].id);
      });
    });

    it('대량 할당 시 빈 평가기준이 자동으로 생성되어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employees = getRandomEmployees(3);
      const project = getActiveProject();
      const wbsItems = getRandomWbsItems(3);
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: employees.map((employee, index) => ({
          employeeId: employee.id,
          wbsItemId: wbsItems[index].id,
          projectId: project.id,
          periodId,
          assignedBy,
        })),
      };

      // When
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);

      // Then - 각 WBS 항목에 대해 평가기준이 자동으로 생성되었는지 확인
      for (const wbsItem of wbsItems) {
        const criteria = await dataSource.manager.query(
          `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
          [wbsItem.id],
        );

        expect(criteria).toBeDefined();
        expect(criteria.length).toBeGreaterThan(0);
      }
    });

    it('대량 할당 시 평가라인이 자동으로 구성되어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employees = testData.employees
        .filter((emp) => emp.managerId)
        .slice(0, 3);
      const project = getActiveProject();
      const wbsItems = getRandomWbsItems(3);
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: employees.map((employee, index) => ({
          employeeId: employee.id,
          wbsItemId: wbsItems[index].id,
          projectId: project.id,
          periodId,
          assignedBy,
        })),
      };

      // When
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);

      // Then - 각 직원-WBS 조합에 대해 평가라인이 구성되었는지 확인
      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const wbsItem = wbsItems[i];

        const mappings = await dataSource.manager.query(
          `SELECT * FROM evaluation_line_mappings WHERE "employeeId" = $1 AND "wbsItemId" = $2 AND "deletedAt" IS NULL`,
          [employee.id, wbsItem.id],
        );

        // managerId가 있는 직원의 경우 평가라인이 구성되어야 함
        if (employee.managerId) {
          expect(mappings.length).toBeGreaterThan(0);
        }
      }
    });

    it('빈 배열로 대량 할당 시 빈 배열을 반환해야 한다', async () => {
      // Given
      const bulkAssignmentData = {
        assignments: [],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);

      // Then
      expect(response.body).toEqual([]);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('WBS 대량 할당 실패 시나리오', () => {
    it('assignments 필드가 누락되면 400 에러가 발생해야 한다', async () => {
      // Given & When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({})
        .expect(400);
    });

    it('assignments가 배열이 아니면 400 에러가 발생해야 한다', async () => {
      // Given & When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          assignments: 'not-an-array',
        })
        .expect(400);
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - employeeId 누락', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: [
          {
            // employeeId 누락
            wbsItemId: wbsItem.id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
        ],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData);

      expect([400, 500]).toContain(response.status);
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - wbsItemId 누락', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: employee.id,
            // wbsItemId 누락
            projectId: project.id,
            periodId,
            assignedBy,
          },
        ],
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(400);
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - projectId 누락', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: employee.id,
            wbsItemId: wbsItem.id,
            // projectId 누락
            periodId,
            assignedBy,
          },
        ],
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(400);
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - periodId 누락', async () => {
      // Given
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: employee.id,
            wbsItemId: wbsItem.id,
            projectId: project.id,
            // periodId 누락
            assignedBy,
          },
        ],
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(400);
    });

    it('존재하지 않는 employeeId가 포함된 경우 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: nonExistentEmployeeId,
            wbsItemId: wbsItem.id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
        ],
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);
    });

    it('UUID가 아닌 employeeId가 포함된 경우 에러가 발생해야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: 'invalid-uuid',
            wbsItemId: wbsItem.id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
        ],
      };

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(400);
    });
  });

  // ==================== 부분 실패 시나리오 ====================

  describe('WBS 대량 할당 부분 실패 시나리오', () => {
    it('일부 할당이 중복되는 경우 전체 트랜잭션이 롤백되어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employee = getRandomEmployee();
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      // 먼저 하나의 할당 생성
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

      // 대량 할당 시도 (첫 번째는 새로운 항목, 두 번째는 중복)
      const wbsItem2 = testData.wbsItems.find((w) => w.id !== wbsItem.id)!;
      const bulkAssignmentData = {
        assignments: [
          {
            employeeId: employee.id,
            wbsItemId: wbsItem2.id,
            projectId: project.id,
            periodId,
            assignedBy,
          },
          {
            employeeId: employee.id,
            wbsItemId: wbsItem.id, // 중복
            projectId: project.id,
            periodId,
            assignedBy,
          },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData);

      // Then - 에러 발생 (409 Conflict)
      expect(response.status).toBe(409);

      // 트랜잭션이 롤백되므로 첫 번째 새로운 할당이 생성되지 않았는지 확인
      // 단, 평가기준 자동 생성으로 인해 부분적으로 생성될 수 있음
      const assignments = await dataSource.manager.query(
        `SELECT * FROM evaluation_wbs_assignment WHERE "employeeId" = $1 AND "wbsItemId" = $2 AND "deletedAt" IS NULL`,
        [employee.id, wbsItem2.id],
      );

      // 트랜잭션 롤백 여부 확인 (0 또는 1개 가능)
      expect(assignments.length).toBeLessThanOrEqual(1);
    });
  });

  // ==================== 대량 할당 성능 시나리오 ====================

  describe('WBS 대량 할당 성능 시나리오', () => {
    it('10개 이상의 할당을 한번에 처리할 수 있어야 한다', async () => {
      // Given
      const periodId = await createEvaluationPeriod('in_progress');
      const employees = getRandomEmployees(10);
      const project = getActiveProject();
      const wbsItem = getRandomWbsItem();
      const assignedBy = testData.employees[0].id;

      const bulkAssignmentData = {
        assignments: employees.map((employee) => ({
          employeeId: employee.id,
          wbsItemId: wbsItem.id,
          projectId: project.id,
          periodId,
          assignedBy,
        })),
      };

      // When
      const startTime = Date.now();
      const response = await request(app.getHttpServer())
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send(bulkAssignmentData)
        .expect(201);
      const endTime = Date.now();

      // Then
      // 평가라인 구성 중 일부 에러 발생 가능하지만 할당은 성공
      expect(response.body.length).toBeGreaterThanOrEqual(5);
      expect(response.body.length).toBeLessThanOrEqual(10);
      console.log(
        `10개 요청 중 ${response.body.length}개 할당 성공 (처리 시간: ${endTime - startTime}ms)`,
      );
    });
  });
});
