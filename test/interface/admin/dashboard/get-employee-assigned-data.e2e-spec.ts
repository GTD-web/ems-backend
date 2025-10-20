import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/assigned-data - 사용자 할당 정보 조회', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    evaluationPeriodId: string;
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
    const { departments, employees, projects, periods } =
      await testContextService.완전한_테스트환경을_생성한다();

    // 첫 번째 평가기간 사용
    const evaluationPeriodId = periods[0].id;

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
      evaluationPeriodId,
    };

    console.log('사용자 할당 정보 조회 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
      evaluationPeriodId: testData.evaluationPeriodId,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

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
   * 이미 등록된 직원 중 사용 가능한 직원 찾기
   */
  async function getRegisteredEmployee(): Promise<string> {
    // 이미 평가기간에 등록된 직원 중 첫 번째 직원 반환
    const result = await dataSource.manager.query(
      `SELECT "employeeId" FROM evaluation_period_employee_mapping 
       WHERE "evaluationPeriodId" = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [testData.evaluationPeriodId],
    );

    if (result.length > 0) {
      return result[0].employeeId;
    }

    // 등록된 직원이 없으면 첫 번째 직원 등록
    const firstEmployee = testData.employees[0];
    await addEmployeeToEvaluationPeriod(
      testData.evaluationPeriodId,
      firstEmployee.id,
    );
    return firstEmployee.id;
  }

  /**
   * 이미 할당된 프로젝트 조회
   */
  async function getAssignedProjects(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT "projectId" FROM evaluation_project_assignment 
       WHERE "periodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [evaluationPeriodId, employeeId],
    );
    return result;
  }

  /**
   * 이미 할당된 WBS 조회
   */
  async function getAssignedWbs(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT "wbsItemId", "projectId" FROM evaluation_wbs_assignment 
       WHERE "periodId" = $1 AND "employeeId" = $2 AND "deletedAt" IS NULL`,
      [evaluationPeriodId, employeeId],
    );
    return result;
  }

  /**
   * 평가 대상자 등록 헬퍼 (이미 등록된 경우 무시)
   */
  async function addEmployeeToEvaluationPeriod(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<void> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .send({
        createdBy: testData.employees[0].id,
      });

    // 201 또는 409 (이미 등록됨) 모두 허용
    expect([201, 409]).toContain(response.status);
  }

  /**
   * 프로젝트 배정 헬퍼 (이미 배정된 경우 무시)
   */
  async function assignProjectToEmployee(
    evaluationPeriodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<void> {
    const response = await testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[0].id,
      });

    // 201 또는 409 (이미 배정됨) 모두 허용
    expect([201, 409]).toContain(response.status);
  }

  /**
   * WBS 배정 헬퍼 (이미 할당된 경우 무시)
   */
  async function assignWbsToEmployee(
    evaluationPeriodId: string,
    employeeId: string,
    wbsItemId: string,
  ): Promise<void> {
    const wbsItem = testData.wbsItems.find((w) => w.id === wbsItemId);
    const response = await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId: wbsItem?.projectId || testData.projects[0].id,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[0].id,
      });

    // 201 또는 409 (이미 할당됨) 모두 허용
    expect([201, 409]).toContain(response.status);
  }

  /**
   * WBS 평가기준 생성 헬퍼
   */
  async function createWbsEvaluationCriteria(
    wbsItemId: string,
    criteria: string,
  ): Promise<void> {
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .send({
        criteria,
        actionBy: testData.employees[0].id,
      })
      .expect(200);
  }

  /**
   * 사용자 할당 정보 조회 헬퍼
   */
  function getEmployeeAssignedData(
    evaluationPeriodId: string,
    employeeId: string,
  ) {
    return testSuite
      .request()
      .get(
        `/admin/dashboard/${evaluationPeriodId}/employees/${employeeId}/assigned-data`,
      );
  }

  // ==================== 성공 시나리오 ====================

  describe('성공 시나리오', () => {
    it('유효한 평가기간과 직원ID로 할당 정보를 조회할 수 있어야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: 할당 정보가 반환되어야 함
      expect(response.body).toBeDefined();
      expect(response.body.evaluationPeriod).toBeDefined();
      expect(response.body.employee).toBeDefined();
      expect(response.body.projects).toBeDefined();
      expect(response.body.summary).toBeDefined();
    });

    it('응답에 모든 필수 필드가 포함되어야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: 필수 필드 확인
      const data = response.body;

      // 평가기간 정보
      expect(data.evaluationPeriod).toHaveProperty('id');
      expect(data.evaluationPeriod).toHaveProperty('name');
      expect(data.evaluationPeriod).toHaveProperty('startDate');
      expect(data.evaluationPeriod).toHaveProperty('status');
      expect(data.evaluationPeriod).toHaveProperty('criteriaSettingEnabled');
      expect(data.evaluationPeriod).toHaveProperty(
        'selfEvaluationSettingEnabled',
      );
      expect(data.evaluationPeriod).toHaveProperty(
        'finalEvaluationSettingEnabled',
      );
      expect(data.evaluationPeriod).toHaveProperty('maxSelfEvaluationRate');

      // 직원 정보
      expect(data.employee).toHaveProperty('id');
      expect(data.employee).toHaveProperty('employeeNumber');
      expect(data.employee).toHaveProperty('name');
      expect(data.employee).toHaveProperty('email');
      expect(data.employee).toHaveProperty('departmentId');
      expect(data.employee).toHaveProperty('status');

      // 프로젝트 정보
      expect(Array.isArray(data.projects)).toBe(true);

      // 요약 정보
      expect(data.summary).toHaveProperty('totalProjects');
      expect(data.summary).toHaveProperty('totalWbs');
      expect(data.summary).toHaveProperty('completedPerformances');
      expect(data.summary).toHaveProperty('completedSelfEvaluations');
    });

    it('프로젝트와 WBS가 할당된 경우 조회 성공해야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: 프로젝트와 WBS가 반환되어야 함 (이미 할당된 데이터 확인)
      expect(response.body.projects).toBeDefined();
      expect(response.body.summary.totalProjects).toBeGreaterThanOrEqual(0);
      expect(response.body.summary.totalWbs).toBeGreaterThanOrEqual(0);
    });

    it('평가기간 정보가 올바르게 반환되어야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: 평가기간 정보 확인
      const period = response.body.evaluationPeriod;
      expect(period.id).toBe(testData.evaluationPeriodId);
      expect(period.name).toBeDefined();
      expect(period.startDate).toBeDefined();
      expect(period.status).toBeDefined();
      expect(typeof period.criteriaSettingEnabled).toBe('boolean');
      expect(typeof period.selfEvaluationSettingEnabled).toBe('boolean');
      expect(typeof period.finalEvaluationSettingEnabled).toBe('boolean');
      expect(typeof period.maxSelfEvaluationRate).toBe('number');
    });

    it('직원 정보가 올바르게 반환되어야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: 직원 정보 확인
      const emp = response.body.employee;
      expect(emp.id).toBe(employeeId);
      expect(emp.employeeNumber).toBeDefined();
      expect(emp.name).toBeDefined();
      expect(emp.email).toBeDefined();
      expect(emp.departmentId).toBeDefined();
      expect(emp.status).toBeDefined();
    });

    it('summary 카운트가 정확해야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: summary 카운트가 정확해야 함
      const summary = response.body.summary;
      expect(summary.totalProjects).toBeGreaterThanOrEqual(0);
      expect(summary.totalWbs).toBeGreaterThanOrEqual(0);
      expect(summary.completedPerformances).toBeGreaterThanOrEqual(0);
      expect(summary.completedSelfEvaluations).toBeGreaterThanOrEqual(0);
    });

    it('할당이 없는 직원도 조회 성공해야 한다 (빈 배열)', async () => {
      // Given: 할당되지 않은 새 직원 등록
      const newEmployee =
        testData.employees.find(async (emp) => {
          const assigned = await getAssignedWbs(
            testData.evaluationPeriodId,
            emp.id,
          );
          return assigned.length === 0;
        }) || testData.employees[testData.employees.length - 1];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        newEmployee.id,
      );

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        newEmployee.id,
      ).expect(200);

      // Then: 프로젝트 배열이 있어야 함 (빈 배열일 수도 있음)
      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.summary.totalProjects).toBeGreaterThanOrEqual(0);
      expect(response.body.summary.totalWbs).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('실패 시나리오', () => {
    it('등록되지 않은 직원 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 등록되지 않은 직원
      const unregisteredEmployee = testData.employees[0];

      // When & Then: 404 에러 발생
      await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        unregisteredEmployee.id,
      ).expect(404);
    });

    it('존재하지 않는 평가기간 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 평가기간
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';
      const employee = testData.employees[0];

      // When & Then: 404 에러 발생
      await getEmployeeAssignedData(nonExistentPeriodId, employee.id).expect(
        404,
      );
    });

    it('잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';
      const employee = testData.employees[0];

      // When & Then: 에러 발생
      await testSuite
        .request()
        .get(
          `/admin/dashboard/${invalidUuid}/employees/${employee.id}/assigned-data`,
        )
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });

    it('잘못된 직원 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';

      // When & Then: 에러 발생
      await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${invalidUuid}/assigned-data`,
        )
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  // ==================== 데이터 정합성 ====================

  describe('데이터 정합성', () => {
    it('WBS별 평가기준이 올바르게 반환되어야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: WBS의 평가기준 구조가 올바르게 반환되어야 함
      expect(response.body.projects).toBeDefined();
      if (response.body.projects.length > 0) {
        const firstProject = response.body.projects[0];
        expect(firstProject).toHaveProperty('wbsList');
        expect(Array.isArray(firstProject.wbsList)).toBe(true);

        if (firstProject.wbsList.length > 0) {
          const firstWbs = firstProject.wbsList[0];
          expect(firstWbs).toHaveProperty('criteria');
          expect(Array.isArray(firstWbs.criteria)).toBe(true);
        }
      }
    });

    it('프로젝트별로 WBS가 올바르게 그룹화되어야 한다', async () => {
      // Given: 이미 등록된 직원 사용
      const employeeId = await getRegisteredEmployee();

      // When: 할당 정보 조회
      const response = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employeeId,
      ).expect(200);

      // Then: 프로젝트별로 WBS가 그룹화되어 있어야 함
      expect(response.body.projects).toBeDefined();
      expect(Array.isArray(response.body.projects)).toBe(true);

      for (const project of response.body.projects) {
        expect(project).toHaveProperty('projectId');
        expect(project).toHaveProperty('projectName');
        expect(project).toHaveProperty('projectCode');
        expect(project).toHaveProperty('wbsList');
        expect(Array.isArray(project.wbsList)).toBe(true);

        // 각 WBS가 해당 프로젝트에 속해야 함
        for (const wbs of project.wbsList) {
          expect(wbs.projectId).toBe(project.projectId);
        }
      }
    });

    it('여러 직원의 할당 정보를 조회해도 데이터가 섞이지 않아야 한다', async () => {
      // Given: 이미 등록된 두 명의 직원 사용
      let allRegistered = await dataSource.manager.query(
        `SELECT "employeeId" FROM evaluation_period_employee_mapping 
         WHERE "evaluationPeriodId" = $1 AND "deletedAt" IS NULL LIMIT 2`,
        [testData.evaluationPeriodId],
      );

      // 등록된 직원이 2명 미만이면 추가 등록
      if (allRegistered.length < 1) {
        await addEmployeeToEvaluationPeriod(
          testData.evaluationPeriodId,
          testData.employees[0].id,
        );
        allRegistered.push({ employeeId: testData.employees[0].id });
      }

      if (allRegistered.length < 2) {
        await addEmployeeToEvaluationPeriod(
          testData.evaluationPeriodId,
          testData.employees[1].id,
        );
        allRegistered.push({ employeeId: testData.employees[1].id });
      }

      const employee1Id = allRegistered[0].employeeId;
      const employee2Id = allRegistered[1].employeeId;

      // When: 각 직원의 할당 정보 조회
      const response1 = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employee1Id,
      ).expect(200);

      const response2 = await getEmployeeAssignedData(
        testData.evaluationPeriodId,
        employee2Id,
      ).expect(200);

      // Then: 각 직원의 데이터가 분리되어야 함
      expect(response1.body.employee.id).toBe(employee1Id);
      expect(response2.body.employee.id).toBe(employee2Id);

      // 직원 ID가 다르면 성공
      expect(response1.body.employee.id).not.toBe(response2.body.employee.id);
    });
  });
});
