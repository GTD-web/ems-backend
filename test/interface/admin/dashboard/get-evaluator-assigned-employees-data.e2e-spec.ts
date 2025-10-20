import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/dashboard/:evaluationPeriodId/evaluators/:evaluatorId/employees/:employeeId/assigned-data - 담당자의 피평가자 할당 정보 조회', () => {
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

    console.log('담당자의 피평가자 할당 정보 조회 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
      evaluationPeriodId: testData.evaluationPeriodId,
    });
  });

  /**
   * 프로젝트의 WBS 항목 조회
   */
  async function getWbsItemsFromProject(projectId: string): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_item WHERE "projectId" = $1 AND "deletedAt" IS NULL`,
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
   * PRIMARY 평가라인 설정 헬퍼
   */
  async function configurePrimaryEvaluator(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
  ): Promise<void> {
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/primary-evaluator`,
      )
      .send({
        evaluatorId,
        createdBy: testData.employees[0].id,
      })
      .expect(201);
  }

  /**
   * SECONDARY 평가라인 설정 헬퍼
   */
  async function configureSecondaryEvaluator(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
  ): Promise<void> {
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/secondary-evaluator`,
      )
      .send({
        evaluatorId,
        createdBy: testData.employees[0].id,
      })
      .expect(201);
  }

  /**
   * 엔드포인트 호출 헬퍼
   */
  function getEvaluatorAssignedEmployeesData(
    evaluationPeriodId: string,
    evaluatorId: string,
    employeeId: string,
  ) {
    return testSuite
      .request()
      .get(
        `/admin/dashboard/${evaluationPeriodId}/evaluators/${evaluatorId}/employees/${employeeId}/assigned-data`,
      );
  }

  // ==================== 성공 시나리오 ====================

  describe('성공 시나리오', () => {
    it('유효한 평가기간, 평가자, 피평가자 ID로 할당 정보를 조회할 수 있어야 한다', async () => {
      // Given: 피평가자 등록 및 평가자 지정
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 할당 정보 조회
      const response = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        evaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 할당 정보가 반환되어야 함
      expect(response.body).toBeDefined();
      expect(response.body.evaluationPeriod).toBeDefined();
      expect(response.body.evaluator).toBeDefined();
      expect(response.body.evaluatee).toBeDefined();
    });

    it('응답에 모든 필수 필드가 포함되어야 한다', async () => {
      // Given: 피평가자 등록 및 평가자 지정
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 할당 정보 조회
      const response = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        evaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 필수 필드 확인
      const data = response.body;

      // 평가기간 정보
      expect(data.evaluationPeriod).toHaveProperty('id');
      expect(data.evaluationPeriod).toHaveProperty('name');
      expect(data.evaluationPeriod).toHaveProperty('startDate');
      expect(data.evaluationPeriod).toHaveProperty('status');
      expect(data.evaluationPeriod).toHaveProperty('criteriaSettingEnabled');

      // 평가자 정보
      expect(data.evaluator).toHaveProperty('id');
      expect(data.evaluator).toHaveProperty('name');
      expect(data.evaluator).toHaveProperty('employeeNumber');
      expect(data.evaluator).toHaveProperty('email');
      expect(data.evaluator.id).toBe(evaluator.id);

      // 피평가자 정보
      expect(data.evaluatee).toHaveProperty('employee');
      expect(data.evaluatee).toHaveProperty('projects');
      expect(data.evaluatee).toHaveProperty('summary');
      expect(data.evaluatee.employee.id).toBe(evaluatee.id);
    });

    it('평가자가 PRIMARY 평가자로 지정된 경우 조회 성공해야 한다', async () => {
      // Given: PRIMARY 평가자 지정
      const evaluatee = testData.employees[0];
      const primaryEvaluator = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );

      // When: 할당 정보 조회
      const response = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        primaryEvaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 정상 응답
      expect(response.body.evaluator.id).toBe(primaryEvaluator.id);
      expect(response.body.evaluatee.employee.id).toBe(evaluatee.id);
    });

    it('평가자가 SECONDARY 평가자로 지정된 경우 조회 성공해야 한다', async () => {
      // Given: SECONDARY 평가자 지정
      const evaluatee = testData.employees[0];
      const primaryEvaluator = testData.employees[1];
      const secondaryEvaluator = testData.employees[2];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );
      await configureSecondaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
      );

      // When: 할당 정보 조회
      const response = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 정상 응답
      expect(response.body.evaluator.id).toBe(secondaryEvaluator.id);
      expect(response.body.evaluatee.employee.id).toBe(evaluatee.id);
    });

    it('피평가자의 프로젝트와 WBS 정보가 포함되어야 한다', async () => {
      // Given: 피평가자 등록 및 평가자 지정
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 할당 정보 조회
      const response = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        evaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 프로젝트와 WBS 구조 확인
      expect(Array.isArray(response.body.evaluatee.projects)).toBe(true);
      expect(response.body.evaluatee.summary).toHaveProperty('totalProjects');
      expect(response.body.evaluatee.summary).toHaveProperty('totalWbs');
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('실패 시나리오', () => {
    it('평가자로 지정되지 않은 직원이 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 피평가자만 등록하고 평가자 미지정
      const evaluatee = testData.employees[0];
      const notEvaluator = testData.employees[1];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        notEvaluator.id,
      );

      // When & Then: 404 에러 발생
      await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        notEvaluator.id,
        evaluatee.id,
      ).expect(404);
    });

    it('존재하지 않는 평가기간 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 유효하지 않은 평가기간 ID
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 404 에러 발생
      await getEvaluatorAssignedEmployeesData(
        nonExistentPeriodId,
        evaluator.id,
        evaluatee.id,
      ).expect(404);
    });

    it('존재하지 않는 평가자 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 유효하지 않은 평가자 ID
      const evaluatee = await getRegisteredEmployee();
      const nonExistentEvaluatorId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 404 에러 발생
      await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        nonExistentEvaluatorId,
        evaluatee,
      ).expect(404);
    });

    it('존재하지 않는 피평가자 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 유효하지 않은 피평가자 ID
      const evaluator = testData.employees[1];
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When & Then: 404 에러 발생
      await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        evaluator.id,
        nonExistentEmployeeId,
      ).expect(404);
    });

    it('잘못된 평가기간 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];

      // When & Then: 400 에러 발생
      await getEvaluatorAssignedEmployeesData(
        invalidUuid,
        evaluator.id,
        evaluatee.id,
      ).expect(400);
    });

    it('잘못된 평가자 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';
      const evaluatee = testData.employees[0];

      // When & Then: 400 에러 발생
      await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        invalidUuid,
        evaluatee.id,
      ).expect(400);
    });

    it('잘못된 피평가자 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';
      const evaluator = testData.employees[1];

      // When & Then: 400 에러 발생
      await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        evaluator.id,
        invalidUuid,
      ).expect(400);
    });
  });

  // ==================== 데이터 정합성 ====================

  describe('데이터 정합성', () => {
    it('평가자와 피평가자 정보가 올바르게 분리되어야 한다', async () => {
      // Given: 피평가자 등록 및 평가자 지정
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 할당 정보 조회
      const response = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        evaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 평가자와 피평가자가 다른 사람이어야 함
      expect(response.body.evaluator.id).toBe(evaluator.id);
      expect(response.body.evaluatee.employee.id).toBe(evaluatee.id);
      expect(response.body.evaluator.id).not.toBe(
        response.body.evaluatee.employee.id,
      );
    });

    it('여러 평가자가 동일한 피평가자를 조회해도 데이터가 일관되어야 한다', async () => {
      // Given: 하나의 피평가자에 두 명의 평가자 지정
      const evaluatee = testData.employees[0];
      const primaryEvaluator = testData.employees[1];
      const secondaryEvaluator = testData.employees[2];
      const wbsItem = testData.wbsItems[0];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );
      await configureSecondaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
      );

      // When: 각 평가자가 피평가자 정보 조회
      const response1 = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        primaryEvaluator.id,
        evaluatee.id,
      ).expect(200);

      const response2 = await getEvaluatorAssignedEmployeesData(
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
        evaluatee.id,
      ).expect(200);

      // Then: 피평가자 정보는 동일해야 함
      expect(response1.body.evaluatee.employee.id).toBe(evaluatee.id);
      expect(response2.body.evaluatee.employee.id).toBe(evaluatee.id);
      expect(response1.body.evaluatee.employee.id).toBe(
        response2.body.evaluatee.employee.id,
      );

      // 평가자 정보는 달라야 함
      expect(response1.body.evaluator.id).toBe(primaryEvaluator.id);
      expect(response2.body.evaluator.id).toBe(secondaryEvaluator.id);
      expect(response1.body.evaluator.id).not.toBe(response2.body.evaluator.id);
    });
  });
});
