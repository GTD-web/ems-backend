import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/:employeeId/status - 직원의 평가기간 현황 조회', () => {
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

    // WBS 할당, 프로젝트 배정, 평가라인 맵핑 등 정리 (각 테스트에서 개별 생성하기 위해)
    await dataSource.manager.query(
      `DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`,
    );
    await dataSource.manager.query(
      `DELETE FROM evaluation_project_assignment WHERE "deletedAt" IS NULL`,
    );
    await dataSource.manager.query(
      `DELETE FROM evaluation_line_mappings WHERE "deletedAt" IS NULL`,
    );

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

    console.log('대시보드 현황 조회 테스트 데이터 생성 완료:', {
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

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getRandomProject(): ProjectDto {
    return testData.projects[
      Math.floor(Math.random() * testData.projects.length)
    ];
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
   * 평가 대상자 등록 헬퍼
   */
  async function addEmployeeToEvaluationPeriod(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<void> {
    await testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .send({
        createdBy: getRandomEmployee().id,
      })
      .expect(201);
  }

  /**
   * 프로젝트 배정 헬퍼
   */
  async function assignProjectToEmployee(
    evaluationPeriodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<void> {
    await testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
        assignedBy: getRandomEmployee().id,
      })
      .expect(201);
  }

  /**
   * WBS 배정 헬퍼
   */
  async function assignWbsToEmployee(
    evaluationPeriodId: string,
    employeeId: string,
    wbsItemId: string,
  ): Promise<void> {
    const wbsItem = testData.wbsItems.find((w) => w.id === wbsItemId);
    await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId: wbsItem?.projectId || testData.projects[0].id,
        periodId: evaluationPeriodId,
        assignedBy: getRandomEmployee().id,
      })
      .expect(201);
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
        actionBy: getRandomEmployee().id,
      })
      .expect(200);
  }

  /**
   * WBS 평가기준 삭제 헬퍼
   */
  async function deleteWbsEvaluationCriteria(wbsItemId: string): Promise<void> {
    await testSuite
      .request()
      .delete(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .expect(200);
  }

  /**
   * PRIMARY 평가라인 설정 헬퍼 (employeeId와 wbsItemId 필요)
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
        createdBy: getRandomEmployee().id,
      })
      .expect(201);
  }

  /**
   * SECONDARY 평가라인 설정 헬퍼 (employeeId와 wbsItemId 필요)
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
        createdBy: getRandomEmployee().id,
      })
      .expect(201);
  }

  /**
   * 평가 대상자 제외 헬퍼
   */
  async function excludeEmployee(
    evaluationPeriodId: string,
    employeeId: string,
    reason: string,
  ): Promise<void> {
    await testSuite
      .request()
      .patch(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/exclude`,
      )
      .send({
        excludeReason: reason,
        excludedBy: getRandomEmployee().id,
      })
      .expect(200);
  }

  // ==================== 성공 시나리오 ====================

  describe('성공 시나리오', () => {
    it('유효한 평가기간ID와 직원ID로 현황을 조회할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.mappingId).toBeDefined();
      expect(response.body.evaluationPeriodId).toBe(
        testData.evaluationPeriodId,
      );
      expect(response.body.employeeId).toBe(employee.id);
    });

    it('응답에 모든 필수 필드가 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then - 최상위 필드
      expect(response.body).toHaveProperty('mappingId');
      expect(response.body).toHaveProperty('evaluationPeriodId');
      expect(response.body).toHaveProperty('employeeId');
      expect(response.body).toHaveProperty('isEvaluationTarget');
      expect(response.body).toHaveProperty('evaluationPeriod');
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('exclusionInfo');
      expect(response.body).toHaveProperty('evaluationCriteria');
      expect(response.body).toHaveProperty('wbsCriteria');
      expect(response.body).toHaveProperty('evaluationLine');
    });

    it('평가기간 정보가 올바르게 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationPeriod).not.toBeNull();
      expect(response.body.evaluationPeriod).toHaveProperty('id');
      expect(response.body.evaluationPeriod).toHaveProperty('name');
      expect(response.body.evaluationPeriod).toHaveProperty('status');
      expect(response.body.evaluationPeriod).toHaveProperty('currentPhase');
      expect(response.body.evaluationPeriod).toHaveProperty('startDate');
      expect(response.body.evaluationPeriod.id).toBe(
        testData.evaluationPeriodId,
      );
    });

    it('직원 정보가 올바르게 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.employee).not.toBeNull();
      expect(response.body.employee).toHaveProperty('id');
      expect(response.body.employee).toHaveProperty('name');
      expect(response.body.employee).toHaveProperty('employeeNumber');
      expect(response.body.employee).toHaveProperty('email');
      expect(response.body.employee.id).toBe(employee.id);
      expect(response.body.employee.name).toBe(employee.name);
    });

    it('제외되지 않은 직원은 isEvaluationTarget이 true여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.isEvaluationTarget).toBe(true);
      expect(response.body.exclusionInfo.isExcluded).toBe(false);
      expect(response.body.exclusionInfo.excludeReason).toBeNull();
      expect(response.body.exclusionInfo.excludedAt).toBeNull();
    });

    it('평가항목 상태가 none이어야 한다 (배정 없음)', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationCriteria.status).toBe('none');
      expect(response.body.evaluationCriteria.assignedProjectCount).toBe(0);
      expect(response.body.evaluationCriteria.assignedWbsCount).toBe(0);
    });

    it('프로젝트만 배정된 경우 평가항목 상태가 in_progress여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const project = getRandomProject();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        project.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationCriteria.status).toBe('in_progress');
      expect(response.body.evaluationCriteria.assignedProjectCount).toBe(1);
      expect(response.body.evaluationCriteria.assignedWbsCount).toBe(0);
    });

    it('WBS만 배정된 경우 평가항목 상태가 in_progress여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationCriteria.status).toBe('in_progress');
      expect(response.body.evaluationCriteria.assignedProjectCount).toBe(0);
      expect(response.body.evaluationCriteria.assignedWbsCount).toBe(1);
    });

    it('프로젝트와 WBS 모두 배정된 경우 평가항목 상태가 complete여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const project = getRandomProject();
      const wbsItem = getRandomWbsItem();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        project.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationCriteria.status).toBe('complete');
      expect(response.body.evaluationCriteria.assignedProjectCount).toBe(1);
      expect(response.body.evaluationCriteria.assignedWbsCount).toBe(1);
    });

    it('WBS 평가기준 상태가 none이어야 한다 (WBS 배정 없음)', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.wbsCriteria.status).toBe('none');
      expect(response.body.wbsCriteria.wbsWithCriteriaCount).toBe(0);
    });

    it('WBS 배정되었지만 평가기준이 삭제된 경우 상태가 none이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem.id,
      );

      // WBS 배정 시 자동으로 생성된 평가기준을 삭제
      await deleteWbsEvaluationCriteria(wbsItem.id);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then - 평가기준이 삭제되어 none 상태
      expect(response.body.wbsCriteria.status).toBe('none');
      expect(response.body.wbsCriteria.wbsWithCriteriaCount).toBe(0);
    });

    it('WBS 여러 개 중 일부만 평가기준이 있는 경우 상태가 in_progress여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];
      const wbsItem3 = testData.wbsItems[2];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // 3개의 WBS 배정 (자동으로 평가기준 생성됨)
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem1.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem2.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem3.id,
      );

      // 1개의 평가기준 삭제 → 3개 중 2개만 평가기준 보유
      await deleteWbsEvaluationCriteria(wbsItem3.id);

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then - 일부만 평가기준이 있어 in_progress 상태
      expect(response.body.wbsCriteria.status).toBe('in_progress');
      expect(response.body.wbsCriteria.wbsWithCriteriaCount).toBe(2);
      expect(response.body.evaluationCriteria.assignedWbsCount).toBe(3);
    });

    it('WBS와 평가기준 모두 있는 경우 상태가 complete여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const wbsItem = getRandomWbsItem();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem.id,
      );
      await createWbsEvaluationCriteria(wbsItem.id, '테스트 평가기준');

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.wbsCriteria.status).toBe('complete');
      expect(response.body.wbsCriteria.wbsWithCriteriaCount).toBe(1);
    });

    it('평가라인 상태가 none이어야 한다 (평가자 미지정)', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationLine.status).toBe('none');
      expect(response.body.evaluationLine.hasPrimaryEvaluator).toBe(false);
      expect(response.body.evaluationLine.hasSecondaryEvaluator).toBe(false);
    });

    it('PRIMARY 평가자만 지정된 경우 상태가 in_progress여야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const wbsItem = getRandomWbsItem();

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
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

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${evaluatee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationLine.status).toBe('in_progress');
      expect(response.body.evaluationLine.hasPrimaryEvaluator).toBe(true);
      expect(response.body.evaluationLine.hasSecondaryEvaluator).toBe(false);
    });

    it('PRIMARY와 SECONDARY 평가자 모두 지정된 경우 상태가 complete여야 한다', async () => {
      // Given
      const primaryEvaluator = testData.employees[0];
      const secondaryEvaluator = testData.employees[1];
      const evaluatee = testData.employees[2];
      const wbsItem = getRandomWbsItem();

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
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

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${evaluatee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationLine.status).toBe('complete');
      expect(response.body.evaluationLine.hasPrimaryEvaluator).toBe(true);
      expect(response.body.evaluationLine.hasSecondaryEvaluator).toBe(true);
    });

    it('제외된 직원은 isEvaluationTarget이 false여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );
      await excludeEmployee(
        testData.evaluationPeriodId,
        employee.id,
        '휴직으로 인한 제외',
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.isEvaluationTarget).toBe(false);
      expect(response.body.exclusionInfo.isExcluded).toBe(true);
      expect(response.body.exclusionInfo.excludeReason).toBe(
        '휴직으로 인한 제외',
      );
      expect(response.body.exclusionInfo.excludedAt).not.toBeNull();
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('실패 시나리오', () => {
    it('등록되지 않은 직원 조회 시 null을 반환해야 한다', async () => {
      // Given
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${nonExistentEmployeeId}/status`,
        )
        .expect(200);

      // Then
      expect(response.body).toEqual({});
    });

    it('존재하지 않는 평가기간 조회 시 null을 반환해야 한다', async () => {
      // Given
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';
      const employee = getRandomEmployee();

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${nonExistentPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body).toEqual({});
    });

    it('잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();

      // When & Then
      await testSuite
        .request()
        .get(`/admin/dashboard/invalid-uuid/employees/${employee.id}/status`)
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });

    it('잘못된 직원 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // When & Then
      await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/invalid-uuid/status`,
        )
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오', () => {
    it('직원 추가 -> 현황 조회 -> 프로젝트 배정 -> 현황 재조회 흐름이 정상 동작해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const project = getRandomProject();

      // 1. 직원 추가
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // 2. 현황 조회 (배정 전)
      const response1 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      expect(response1.body.evaluationCriteria.status).toBe('none');
      expect(response1.body.evaluationCriteria.assignedProjectCount).toBe(0);

      // 3. 프로젝트 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        project.id,
      );

      // 4. 현황 재조회 (배정 후)
      const response2 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      expect(response2.body.evaluationCriteria.status).toBe('in_progress');
      expect(response2.body.evaluationCriteria.assignedProjectCount).toBe(1);
    });

    it('완전한 설정 흐름: 직원 추가 -> 프로젝트/WBS 배정 -> 평가기준 설정 -> 평가자 지정', async () => {
      // Given
      const primaryEvaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const project = getRandomProject();
      const wbsItem = getRandomWbsItem();

      // 1. 직원 추가
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );

      // 2. 프로젝트 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        project.id,
      );

      // 3. WBS 배정
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );

      // 4. WBS 평가기준 설정
      await createWbsEvaluationCriteria(wbsItem.id, '완전한 평가기준');

      // 5. PRIMARY 평가자 지정
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      );

      // When - 최종 현황 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${evaluatee.id}/status`,
        )
        .expect(200);

      // Then - 모든 상태가 완료 또는 진행중이어야 함
      expect(response.body.isEvaluationTarget).toBe(true);
      expect(response.body.evaluationCriteria.status).toBe('complete');
      expect(response.body.wbsCriteria.status).toBe('complete');
      expect(response.body.evaluationLine.status).toBe('in_progress');
    });

    it('직원 제외 -> 현황 조회 -> 제외 복원 -> 현황 재조회 흐름이 정상 동작해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // 1. 제외 전 조회
      const response1 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      expect(response1.body.isEvaluationTarget).toBe(true);
      expect(response1.body.exclusionInfo.isExcluded).toBe(false);

      // 2. 직원 제외
      await excludeEmployee(
        testData.evaluationPeriodId,
        employee.id,
        '제외 테스트',
      );

      // 3. 제외 후 조회
      const response2 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      expect(response2.body.isEvaluationTarget).toBe(false);
      expect(response2.body.exclusionInfo.isExcluded).toBe(true);

      // 4. 제외 복원
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${testData.evaluationPeriodId}/targets/${employee.id}/include`,
        )
        .send({
          updatedBy: getRandomEmployee().id,
        })
        .expect(200);

      // 5. 복원 후 조회
      const response3 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      expect(response3.body.isEvaluationTarget).toBe(true);
      expect(response3.body.exclusionInfo.isExcluded).toBe(false);
    });
  });

  // ==================== 데이터 정합성 ====================

  describe('데이터 정합성', () => {
    it('여러 직원의 현황을 조회해도 각각 올바른 데이터를 반환해야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const employee3 = testData.employees[2];
      const project = getRandomProject();

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee1.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee2.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee3.id,
      );

      // employee1에만 프로젝트 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee1.id,
        project.id,
      );

      // When
      const response1 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee1.id}/status`,
        )
        .expect(200);

      const response2 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee2.id}/status`,
        )
        .expect(200);

      const response3 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee3.id}/status`,
        )
        .expect(200);

      // Then
      expect(response1.body.employeeId).toBe(employee1.id);
      expect(response1.body.evaluationCriteria.assignedProjectCount).toBe(1);

      expect(response2.body.employeeId).toBe(employee2.id);
      expect(response2.body.evaluationCriteria.assignedProjectCount).toBe(0);

      expect(response3.body.employeeId).toBe(employee3.id);
      expect(response3.body.evaluationCriteria.assignedProjectCount).toBe(0);
    });

    it('반환된 카운트가 실제 배정 개수와 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const project1 = testData.projects[0];
      const project2 = testData.projects[1];
      const wbsItem1 = testData.wbsItems[0];
      const wbsItem2 = testData.wbsItems[1];
      const wbsItem3 = testData.wbsItems[2];

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // 프로젝트 2개 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        project1.id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        project2.id,
      );

      // WBS 3개 배정
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem1.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem2.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItem3.id,
      );

      // WBS 배정 시 자동으로 평가기준이 생성되므로 별도 설정 불필요

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(response.body.evaluationCriteria.assignedProjectCount).toBe(2);
      expect(response.body.evaluationCriteria.assignedWbsCount).toBe(3);
      // WBS 배정 시 자동으로 평가기준이 생성되므로 3개 모두 평가기준 보유
      expect(response.body.wbsCriteria.wbsWithCriteriaCount).toBe(3);
    });

    it('상태 값이 예상된 enum 값 중 하나여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/employees/${employee.id}/status`,
        )
        .expect(200);

      // Then
      expect(['complete', 'in_progress', 'none']).toContain(
        response.body.evaluationCriteria.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        response.body.wbsCriteria.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        response.body.evaluationLine.status,
      );
    });
  });
});
