import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/dashboard/:evaluationPeriodId/my-evaluation-targets/:evaluatorId/status - 내가 담당하는 평가 대상자 현황 조회', () => {
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

    // WBS 할당, 프로젝트 배정, 평가라인 맵핑 등 정리
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

    console.log('내 평가 대상자 현황 조회 테스트 데이터 생성 완료:', {
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
   * 평가 대상자 등록 헬퍼
   */
  async function addEmployeeToEvaluationPeriod(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<void> {
    await request(app.getHttpServer())
      .post(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}`,
      )
      .send({
        createdBy: testData.employees[0].id,
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
    await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[0].id,
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
    await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId: wbsItem?.projectId || testData.projects[0].id,
        periodId: evaluationPeriodId,
        assignedBy: testData.employees[0].id,
      })
      .expect(201);
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
    await request(app.getHttpServer())
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
    await request(app.getHttpServer())
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
   * 평가 대상자 제외 헬퍼
   */
  async function excludeEmployee(
    evaluationPeriodId: string,
    employeeId: string,
    reason: string,
  ): Promise<void> {
    await request(app.getHttpServer())
      .patch(
        `/admin/evaluation-periods/${evaluationPeriodId}/targets/${employeeId}/exclude`,
      )
      .send({
        excludeReason: reason,
        excludedBy: testData.employees[0].id,
      })
      .expect(200);
  }

  /**
   * 내 평가 대상자 현황 조회 헬퍼
   */
  function getMyEvaluationTargetsStatus(
    evaluationPeriodId: string,
    evaluatorId: string,
  ) {
    return request(app.getHttpServer()).get(
      `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
    );
  }

  // ==================== 성공 시나리오 ====================

  describe('성공 시나리오', () => {
    it('평가자가 담당하는 평가 대상자 현황을 조회할 수 있어야 한다', async () => {
      // Given: 평가자와 피평가자 설정
      const evaluator = testData.employees[0];
      const evaluatee1 = testData.employees[1];
      const evaluatee2 = testData.employees[2];
      const wbsItem = testData.wbsItems[0];

      // 피평가자 등록
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee1.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee2.id,
      );

      // WBS 배정
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee1.id,
        wbsItem.id,
      );

      // 평가자 지정
      await configurePrimaryEvaluator(
        evaluatee1.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 담당하는 피평가자 정보가 반환되어야 함
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      const evaluatee1Status = response.body.find(
        (e: any) => e.employeeId === evaluatee1.id,
      );
      expect(evaluatee1Status).toBeDefined();
      expect(evaluatee1Status.myEvaluatorTypes).toContain('primary');
    });

    it('PRIMARY와 SECONDARY 평가자 구분이 정확해야 한다', async () => {
      // Given: 평가자와 피평가자 설정
      const primaryEvaluator = testData.employees[0];
      const secondaryEvaluator = testData.employees[1];
      const evaluatee = testData.employees[2];
      const wbsItem = testData.wbsItems[0];

      // 피평가자 등록 및 WBS 배정
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );

      // PRIMARY, SECONDARY 평가자 지정
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

      // When: PRIMARY 평가자 현황 조회
      const primaryResponse = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        primaryEvaluator.id,
      ).expect(200);

      // Then: PRIMARY로 표시되어야 함
      const primaryTarget = primaryResponse.body.find(
        (e: any) => e.employeeId === evaluatee.id,
      );
      expect(primaryTarget).toBeDefined();
      expect(primaryTarget.myEvaluatorTypes).toContain('primary');
      expect(primaryTarget.downwardEvaluation.isPrimary).toBe(true);

      // When: SECONDARY 평가자 현황 조회
      const secondaryResponse = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        secondaryEvaluator.id,
      ).expect(200);

      // Then: SECONDARY로 표시되어야 함
      const secondaryTarget = secondaryResponse.body.find(
        (e: any) => e.employeeId === evaluatee.id,
      );
      expect(secondaryTarget).toBeDefined();
      expect(secondaryTarget.myEvaluatorTypes).toContain('secondary');
      expect(secondaryTarget.downwardEvaluation.isSecondary).toBe(true);
    });

    it('제외된 피평가자도 조회되어야 한다', async () => {
      // Given: 평가자와 제외된 피평가자 설정
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      // 피평가자 등록 및 WBS 배정
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );

      // 평가자 지정
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // 피평가자 제외
      await excludeEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        '휴직으로 인한 제외',
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 제외된 피평가자가 조회되어야 함
      const excludedTarget = response.body.find(
        (e: any) => e.employeeId === evaluatee.id,
      );
      expect(excludedTarget).toBeDefined();
      expect(excludedTarget.isEvaluationTarget).toBe(false);
      expect(excludedTarget.exclusionInfo.isExcluded).toBe(true);
      expect(excludedTarget.exclusionInfo.excludeReason).toBe(
        '휴직으로 인한 제외',
      );
    });

    it('응답에 모든 필수 필드가 포함되어야 한다', async () => {
      // Given: 평가자와 피평가자 설정
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      // 피평가자 등록 및 WBS 배정
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );

      // 평가자 지정
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 필수 필드 확인
      expect(response.body.length).toBeGreaterThan(0);
      const target = response.body[0];

      // 최상위 필드
      expect(target).toHaveProperty('employeeId');
      expect(target).toHaveProperty('isEvaluationTarget');
      expect(target).toHaveProperty('exclusionInfo');
      expect(target).toHaveProperty('evaluationCriteria');
      expect(target).toHaveProperty('wbsCriteria');
      expect(target).toHaveProperty('evaluationLine');
      expect(target).toHaveProperty('performanceInput');
      expect(target).toHaveProperty('myEvaluatorTypes');
      expect(target).toHaveProperty('downwardEvaluation');

      // 제외 정보
      expect(target.exclusionInfo).toHaveProperty('isExcluded');
      expect(target.exclusionInfo).toHaveProperty('excludeReason');
      expect(target.exclusionInfo).toHaveProperty('excludedAt');

      // 평가항목 정보
      expect(target.evaluationCriteria).toHaveProperty('status');
      expect(target.evaluationCriteria).toHaveProperty('assignedProjectCount');
      expect(target.evaluationCriteria).toHaveProperty('assignedWbsCount');

      // WBS 평가기준 정보
      expect(target.wbsCriteria).toHaveProperty('status');
      expect(target.wbsCriteria).toHaveProperty('wbsWithCriteriaCount');

      // 평가라인 정보
      expect(target.evaluationLine).toHaveProperty('status');
      expect(target.evaluationLine).toHaveProperty('hasPrimaryEvaluator');
      expect(target.evaluationLine).toHaveProperty('hasSecondaryEvaluator');

      // 성과 입력 정보
      expect(target.performanceInput).toHaveProperty('status');
      expect(target.performanceInput).toHaveProperty('totalWbsCount');
      expect(target.performanceInput).toHaveProperty('inputCompletedCount');

      // 하향평가 정보
      expect(target.downwardEvaluation).toHaveProperty('isPrimary');
      expect(target.downwardEvaluation).toHaveProperty('isSecondary');
      expect(target.downwardEvaluation).toHaveProperty('primaryStatus');
      expect(target.downwardEvaluation).toHaveProperty('secondaryStatus');
    });

    it('담당하는 평가 대상자가 없으면 빈 배열을 반환해야 한다', async () => {
      // Given: 평가자만 존재하고 담당 대상자 없음
      const evaluator = testData.employees[0];

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('여러 피평가자를 담당하는 경우 모두 조회되어야 한다', async () => {
      // Given: 여러 피평가자 설정
      const evaluator = testData.employees[0];
      const evaluatee1 = testData.employees[1];
      const evaluatee2 = testData.employees[2];
      const evaluatee3 = testData.employees[3];
      const wbsItems = testData.wbsItems.slice(0, 3);

      // 피평가자 등록
      for (const evaluatee of [evaluatee1, evaluatee2, evaluatee3]) {
        await addEmployeeToEvaluationPeriod(
          testData.evaluationPeriodId,
          evaluatee.id,
        );
      }

      // WBS 배정 및 평가자 지정
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee1.id,
        wbsItems[0].id,
      );
      await configurePrimaryEvaluator(
        evaluatee1.id,
        wbsItems[0].id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee2.id,
        wbsItems[1].id,
      );
      await configurePrimaryEvaluator(
        evaluatee2.id,
        wbsItems[1].id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee3.id,
        wbsItems[2].id,
      );
      await configurePrimaryEvaluator(
        evaluatee3.id,
        wbsItems[2].id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 3명의 피평가자 모두 조회되어야 함
      expect(response.body.length).toBe(3);
      const employeeIds = response.body.map((e: any) => e.employeeId);
      expect(employeeIds).toContain(evaluatee1.id);
      expect(employeeIds).toContain(evaluatee2.id);
      expect(employeeIds).toContain(evaluatee3.id);
    });

    it('성과 입력 상태가 정확해야 한다', async () => {
      // Given: 평가자와 피평가자, WBS 설정
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      // 피평가자 등록 및 WBS 배정
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );

      // 평가자 지정
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 성과 입력 정보 확인
      const target = response.body.find(
        (e: any) => e.employeeId === evaluatee.id,
      );
      expect(target.performanceInput).toBeDefined();
      expect(target.performanceInput.totalWbsCount).toBeGreaterThanOrEqual(0);
      expect(
        target.performanceInput.inputCompletedCount,
      ).toBeGreaterThanOrEqual(0);
      expect(['complete', 'in_progress', 'none']).toContain(
        target.performanceInput.status,
      );
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('실패 시나리오', () => {
    it('존재하지 않는 평가기간 조회 시 빈 배열을 반환해야 한다', async () => {
      // Given: 존재하지 않는 평가기간 ID
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';
      const evaluator = testData.employees[0];

      // When: 내 평가 대상자 현황 조회
      const response = await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${nonExistentPeriodId}/my-evaluation-targets/${evaluator.id}/status`,
        )
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('존재하지 않는 평가자 조회 시 빈 배열을 반환해야 한다', async () => {
      // Given: 존재하지 않는 평가자 ID
      const nonExistentEvaluatorId = '00000000-0000-0000-0000-000000000000';

      // When: 내 평가 대상자 현황 조회
      const response = await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/my-evaluation-targets/${nonExistentEvaluatorId}/status`,
        )
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';
      const evaluator = testData.employees[0];

      // When & Then: 에러 발생
      await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${invalidUuid}/my-evaluation-targets/${evaluator.id}/status`,
        )
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });

    it('잘못된 평가자 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';

      // When & Then: 에러 발생
      await request(app.getHttpServer())
        .get(
          `/admin/dashboard/${testData.evaluationPeriodId}/my-evaluation-targets/${invalidUuid}/status`,
        )
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  // ==================== 데이터 정합성 ====================

  describe('데이터 정합성', () => {
    it('여러 피평가자의 데이터가 섞이지 않아야 한다', async () => {
      // Given: 여러 피평가자에게 각각 다른 프로젝트 배정
      const evaluator = testData.employees[0];
      const evaluatee1 = testData.employees[1];
      const evaluatee2 = testData.employees[2];
      const projects = testData.projects.slice(0, 2);
      const wbsItems = testData.wbsItems.slice(0, 2);

      // 피평가자 등록
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee1.id,
      );
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee2.id,
      );

      // evaluatee1에게 프로젝트 1개 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        evaluatee1.id,
        projects[0].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee1.id,
        wbsItems[0].id,
      );
      await configurePrimaryEvaluator(
        evaluatee1.id,
        wbsItems[0].id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // evaluatee2에게 프로젝트 2개 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        evaluatee2.id,
        projects[0].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        evaluatee2.id,
        projects[1].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee2.id,
        wbsItems[1].id,
      );
      await configurePrimaryEvaluator(
        evaluatee2.id,
        wbsItems[1].id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 각 피평가자의 데이터가 정확해야 함
      const target1 = response.body.find(
        (e: any) => e.employeeId === evaluatee1.id,
      );
      const target2 = response.body.find(
        (e: any) => e.employeeId === evaluatee2.id,
      );

      expect(target1.evaluationCriteria.assignedProjectCount).toBe(1);
      expect(target2.evaluationCriteria.assignedProjectCount).toBe(2);
    });

    it('상태 값이 예상된 enum 값 중 하나여야 한다', async () => {
      // Given: 평가자와 피평가자 설정
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const wbsItem = testData.wbsItems[0];

      // 피평가자 등록 및 WBS 배정
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        evaluatee.id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        evaluatee.id,
        wbsItem.id,
      );

      // 평가자 지정
      await configurePrimaryEvaluator(
        evaluatee.id,
        wbsItem.id,
        testData.evaluationPeriodId,
        evaluator.id,
      );

      // When: 내 평가 대상자 현황 조회
      const response = await getMyEvaluationTargetsStatus(
        testData.evaluationPeriodId,
        evaluator.id,
      ).expect(200);

      // Then: 상태 값이 유효한 enum 값이어야 함
      const target = response.body[0];

      expect(['complete', 'in_progress', 'none']).toContain(
        target.evaluationCriteria.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        target.wbsCriteria.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        target.evaluationLine.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        target.performanceInput.status,
      );
    });
  });
});
