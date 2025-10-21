import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가기간별 평가자 목록 조회 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    periods: EvaluationPeriodDto[];
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

    // 완전한 환경 생성
    const {
      departments,
      employees,
      projects,
      wbsItems: allWbsItems,
      periods,
    } = await testContextService.완전한_테스트환경을_생성한다();

    // WBS 할당만 정리 (각 테스트에서 개별 생성하기 위해)
    await dataSource.manager.query(
      `DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`,
    );

    // 활성 프로젝트의 WBS 항목만 사용
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = allWbsItems.filter(
      (wbs) => wbs.projectId === activeProject.id,
    );

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
      periods,
    };

    console.log('평가기간별 평가자 목록 조회 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
      periods: testData.periods.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

  function getActiveProject(): ProjectDto {
    return testData.projects.find((p) => p.isActive) || testData.projects[0];
  }

  function getActivePeriod(): EvaluationPeriodDto {
    return (
      testData.periods.find((p) => p.status === 'in-progress') ||
      testData.periods[0]
    );
  }

  /**
   * WBS 할당 생성 헬퍼
   */
  async function createWbsAssignment(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
    assignedBy?: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        assignedBy: assignedBy || testData.employees[0].id,
      })
      .expect(201);

    return response.body;
  }

  /**
   * 1차 평가자 구성 헬퍼
   */
  async function configurePrimaryEvaluator(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/primary-evaluator`,
      )
      .send({ evaluatorId })
      .expect(201);

    return response.body;
  }

  /**
   * 2차 평가자 구성 헬퍼
   */
  async function configureSecondaryEvaluator(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/secondary-evaluator`,
      )
      .send({ evaluatorId })
      .expect(201);

    return response.body;
  }

  // ==================== 테스트 케이스 ====================

  describe('기본 조회 (type=all)', () => {
    it('평가기간의 모든 평가자 목록을 조회해야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, employee3, employee4] = testData.employees;
      const [wbs1, wbs2] = testData.wbsItems;

      // WBS 할당
      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);

      // 1차 평가자 구성
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        employee3.id,
      );
      // 2차 평가자 구성
      await configureSecondaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        employee4.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('periodId', period.id);
      expect(response.body).toHaveProperty('type', 'all');
      expect(response.body).toHaveProperty('evaluators');
      expect(Array.isArray(response.body.evaluators)).toBe(true);
      expect(response.body.evaluators.length).toBeGreaterThan(0);

      // 1차 평가자 확인
      const primaryEvaluator = response.body.evaluators.find(
        (e: any) =>
          e.evaluatorId === employee3.id && e.evaluatorType === 'primary',
      );
      expect(primaryEvaluator).toBeDefined();
      expect(primaryEvaluator.evaluatorName).toBe(employee3.name);
      expect(primaryEvaluator.evaluateeCount).toBeGreaterThan(0);

      // 2차 평가자 확인
      const secondaryEvaluator = response.body.evaluators.find(
        (e: any) =>
          e.evaluatorId === employee4.id && e.evaluatorType === 'secondary',
      );
      expect(secondaryEvaluator).toBeDefined();
      expect(secondaryEvaluator.evaluatorName).toBe(employee4.name);
      expect(secondaryEvaluator.evaluateeCount).toBeGreaterThan(0);
    });

    it('type 파라미터 없이 조회 시 기본값(all)로 동작해야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2] = testData.employees;
      const [wbs1] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        employee2.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      expect(response.body.type).toBe('all');
    });
  });

  describe('1차 평가자만 조회 (type=primary)', () => {
    it('1차 평가자만 반환되어야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, employee3, employee4] = testData.employees;
      const [wbs1, wbs2] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);

      // 1차 평가자 구성
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        employee3.id,
      );
      // 2차 평가자 구성
      await configureSecondaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        employee4.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators?type=primary`,
        )
        .expect(200);

      // Then
      expect(response.body.type).toBe('primary');
      expect(response.body.evaluators).toBeDefined();
      expect(Array.isArray(response.body.evaluators)).toBe(true);

      // 모든 평가자가 primary 타입이어야 함
      response.body.evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluatorType).toBe('primary');
      });

      // 1차 평가자가 포함되어야 함
      const primaryEvaluator = response.body.evaluators.find(
        (e: any) => e.evaluatorId === employee3.id,
      );
      expect(primaryEvaluator).toBeDefined();

      // 2차 평가자는 포함되지 않아야 함
      const secondaryEvaluator = response.body.evaluators.find(
        (e: any) => e.evaluatorId === employee4.id,
      );
      expect(secondaryEvaluator).toBeUndefined();
    });
  });

  describe('2차 평가자만 조회 (type=secondary)', () => {
    it('2차 평가자만 반환되어야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, employee3, employee4] = testData.employees;
      const [wbs1, wbs2] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);

      // 1차 평가자 구성
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        employee3.id,
      );
      // 2차 평가자 구성
      await configureSecondaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        employee4.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators?type=secondary`,
        )
        .expect(200);

      // Then
      expect(response.body.type).toBe('secondary');
      expect(response.body.evaluators).toBeDefined();
      expect(Array.isArray(response.body.evaluators)).toBe(true);

      // 모든 평가자가 secondary 타입이어야 함
      response.body.evaluators.forEach((evaluator: any) => {
        expect(evaluator.evaluatorType).toBe('secondary');
      });

      // 2차 평가자가 포함되어야 함
      const secondaryEvaluator = response.body.evaluators.find(
        (e: any) => e.evaluatorId === employee4.id,
      );
      expect(secondaryEvaluator).toBeDefined();

      // 1차 평가자는 포함되지 않아야 함
      const primaryEvaluator = response.body.evaluators.find(
        (e: any) => e.evaluatorId === employee3.id,
      );
      expect(primaryEvaluator).toBeUndefined();
    });
  });

  describe('응답 데이터 검증', () => {
    it('피평가자 수가 정확히 포함되어야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, employee3, evaluator] = testData.employees;
      const [wbs1, wbs2, wbs3] = testData.wbsItems;

      // 동일한 평가자에게 3명의 피평가자 할당
      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);
      await createWbsAssignment(employee3.id, wbs3.id, project.id, period.id);

      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        evaluator.id,
      );
      await configurePrimaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        evaluator.id,
      );
      await configurePrimaryEvaluator(
        employee3.id,
        wbs3.id,
        period.id,
        evaluator.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators?type=primary`,
        )
        .expect(200);

      // Then
      const targetEvaluator = response.body.evaluators.find(
        (e: any) => e.evaluatorId === evaluator.id,
      );
      expect(targetEvaluator).toBeDefined();
      expect(targetEvaluator.evaluateeCount).toBe(3);
    });

    it('직원 정보(이름, 부서)가 포함되어야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, evaluator] = testData.employees;
      const [wbs1] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        evaluator.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      const targetEvaluator = response.body.evaluators.find(
        (e: any) => e.evaluatorId === evaluator.id,
      );
      expect(targetEvaluator).toBeDefined();
      expect(targetEvaluator.evaluatorName).toBe(evaluator.name);
      expect(targetEvaluator.departmentName).toBeDefined();
      expect(typeof targetEvaluator.departmentName).toBe('string');
    });

    it('평가자 유형이 포함되어야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, evaluator] = testData.employees;
      const [wbs1] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        evaluator.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      response.body.evaluators.forEach((evaluator: any) => {
        expect(evaluator).toHaveProperty('evaluatorType');
        expect(['primary', 'secondary']).toContain(evaluator.evaluatorType);
      });
    });

    it('동일한 직원이 1차와 2차 평가자 역할을 모두 하는 경우 각각 별도로 반환되어야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, dualRoleEvaluator] = testData.employees;
      const [wbs1, wbs2] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);

      // 동일한 직원을 1차 평가자로 구성
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        dualRoleEvaluator.id,
      );
      // 동일한 직원을 2차 평가자로 구성
      await configureSecondaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        dualRoleEvaluator.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      const dualRoleEvaluators = response.body.evaluators.filter(
        (e: any) => e.evaluatorId === dualRoleEvaluator.id,
      );

      expect(dualRoleEvaluators.length).toBe(2);

      const primaryEntry = dualRoleEvaluators.find(
        (e: any) => e.evaluatorType === 'primary',
      );
      const secondaryEntry = dualRoleEvaluators.find(
        (e: any) => e.evaluatorType === 'secondary',
      );

      expect(primaryEntry).toBeDefined();
      expect(secondaryEntry).toBeDefined();
      expect(primaryEntry.evaluateeCount).toBeGreaterThan(0);
      expect(secondaryEntry.evaluateeCount).toBeGreaterThan(0);
    });
  });

  describe('엣지 케이스', () => {
    it('평가자가 없는 경우 빈 배열을 반환해야 함', async () => {
      // Given
      const period = getActivePeriod();

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      expect(response.body.periodId).toBe(period.id);
      expect(response.body.evaluators).toEqual([]);
    });

    it('존재하지 않는 평가기간 ID로 조회 시 빈 배열을 반환해야 함', async () => {
      // Given
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${nonExistentPeriodId}/evaluators`,
        )
        .expect(200);

      // Then
      expect(response.body.periodId).toBe(nonExistentPeriodId);
      expect(response.body.evaluators).toEqual([]);
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러를 반환해야 함', async () => {
      // Given
      const invalidUuid = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${invalidUuid}/evaluators`,
        )
        .expect(400);
    });

    it('잘못된 type 값으로 조회 시 400 에러를 반환해야 함', async () => {
      // Given
      const period = getActivePeriod();
      const invalidType = 'invalid-type';

      // When & Then
      await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators?type=${invalidType}`,
        )
        .expect(400);
    });
  });

  describe('필터링 정확도 검증', () => {
    it('type=primary일 때 secondary 평가자가 절대 포함되지 않아야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, primaryEval, secondaryEval] =
        testData.employees;
      const [wbs1, wbs2] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);

      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        primaryEval.id,
      );
      await configureSecondaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        secondaryEval.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators?type=primary`,
        )
        .expect(200);

      // Then
      const hasSecondary = response.body.evaluators.some(
        (e: any) => e.evaluatorType === 'secondary',
      );
      expect(hasSecondary).toBe(false);
    });

    it('type=secondary일 때 primary 평가자가 절대 포함되지 않아야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, employee2, primaryEval, secondaryEval] =
        testData.employees;
      const [wbs1, wbs2] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await createWbsAssignment(employee2.id, wbs2.id, project.id, period.id);

      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        primaryEval.id,
      );
      await configureSecondaryEvaluator(
        employee2.id,
        wbs2.id,
        period.id,
        secondaryEval.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators?type=secondary`,
        )
        .expect(200);

      // Then
      const hasPrimary = response.body.evaluators.some(
        (e: any) => e.evaluatorType === 'primary',
      );
      expect(hasPrimary).toBe(false);
    });
  });

  describe('타임스탬프 검증', () => {
    it('응답의 모든 필수 필드가 존재해야 함', async () => {
      // Given
      const period = getActivePeriod();
      const project = getActiveProject();
      const [employee1, evaluator] = testData.employees;
      const [wbs1] = testData.wbsItems;

      await createWbsAssignment(employee1.id, wbs1.id, project.id, period.id);
      await configurePrimaryEvaluator(
        employee1.id,
        wbs1.id,
        period.id,
        evaluator.id,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/evaluation-lines/period/${period.id}/evaluators`,
        )
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('periodId');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('evaluators');

      response.body.evaluators.forEach((evaluator: any) => {
        expect(evaluator).toHaveProperty('evaluatorId');
        expect(evaluator).toHaveProperty('evaluatorName');
        expect(evaluator).toHaveProperty('departmentName');
        expect(evaluator).toHaveProperty('evaluatorType');
        expect(evaluator).toHaveProperty('evaluateeCount');
      });
    });
  });
});
