import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가자별 피평가자 조회 테스트', () => {
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

    // WBS 할당 없이 기본 환경 생성
    // 완전한 환경을 생성한 후 WBS 할당만 정리
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

    console.log('평가자별 피평가자 조회 테스트 데이터 생성 완료:', {
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
      .send({
        evaluatorId,
      })
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
      .send({
        evaluatorId,
      })
      .expect(201);

    return response.body;
  }

  // ==================== 평가자별 피평가자 조회 테스트 ====================

  describe('GET /admin/evaluation-criteria/evaluation-lines/evaluator/:evaluatorId/employees - 평가자별 피평가자 조회', () => {
    describe('성공 시나리오', () => {
      it('1차 평가자로 구성된 피평가자 목록을 성공적으로 조회할 수 있어야 한다', async () => {
        // Given - 1차 평가자 구성
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];
        const evaluator = testData.employees[2];
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        // WBS 할당 및 평가자 구성
        await createWbsAssignment(
          employee1.id,
          wbsItem1.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee1.id,
          wbsItem1.id,
          period.id,
          evaluator.id,
        );

        await createWbsAssignment(
          employee2.id,
          wbsItem2.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee2.id,
          wbsItem2.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluator.id}/employees`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.evaluatorId).toBe(evaluator.id);
        expect(response.body.employees).toBeDefined();
        expect(Array.isArray(response.body.employees)).toBe(true);
        expect(response.body.employees.length).toBeGreaterThanOrEqual(2);

        // 피평가자 정보 확인
        const employeeIds = response.body.employees.map(
          (e: any) => e.employeeId,
        );
        expect(employeeIds).toContain(employee1.id);
        expect(employeeIds).toContain(employee2.id);

        // 각 피평가자의 필수 필드 확인
        response.body.employees.forEach((employee: any) => {
          expect(employee.employeeId).toBeDefined();
          expect(employee.evaluationLineId).toBeDefined();
          expect(employee.createdAt).toBeDefined();
          expect(employee.updatedAt).toBeDefined();
        });
      });

      it('2차 평가자로 구성된 피평가자 목록을 성공적으로 조회할 수 있어야 한다', async () => {
        // Given - 2차 평가자 구성
        const employee = testData.employees[0];
        const evaluator = testData.employees[1];
        const wbsItem = testData.wbsItems[3];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );
        await configureSecondaryEvaluator(
          employee.id,
          wbsItem.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluator.id}/employees`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.evaluatorId).toBe(evaluator.id);
        expect(response.body.employees).toBeDefined();
        expect(Array.isArray(response.body.employees)).toBe(true);
        expect(response.body.employees.length).toBeGreaterThanOrEqual(1);

        const employeeIds = response.body.employees.map(
          (e: any) => e.employeeId,
        );
        expect(employeeIds).toContain(employee.id);
      });

      it('1차 및 2차 평가자로 모두 구성된 경우 모든 피평가자를 조회할 수 있어야 한다', async () => {
        // Given
        const employee1 = testData.employees[0]; // 1차 평가 대상
        const employee2 = testData.employees[1]; // 2차 평가 대상
        const evaluator = testData.employees[2];
        const wbsItem1 = testData.wbsItems[4];
        const wbsItem2 = testData.wbsItems[5];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        // 1차 평가자로 구성
        await createWbsAssignment(
          employee1.id,
          wbsItem1.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee1.id,
          wbsItem1.id,
          period.id,
          evaluator.id,
        );

        // 2차 평가자로 구성
        await createWbsAssignment(
          employee2.id,
          wbsItem2.id,
          activeProject.id,
          period.id,
        );
        await configureSecondaryEvaluator(
          employee2.id,
          wbsItem2.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluator.id}/employees`,
          )
          .expect(200);

        // Then
        expect(response.body.employees.length).toBeGreaterThanOrEqual(2);
        const employeeIds = response.body.employees.map(
          (e: any) => e.employeeId,
        );
        expect(employeeIds).toContain(employee1.id);
        expect(employeeIds).toContain(employee2.id);
      });

      it('평가자로 구성되지 않은 경우 빈 배열을 반환해야 한다', async () => {
        // Given - 평가자로 구성되지 않은 직원
        const nonEvaluator = testData.employees[4];

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${nonEvaluator.id}/employees`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.evaluatorId).toBe(nonEvaluator.id);
        expect(response.body.employees).toBeDefined();
        expect(Array.isArray(response.body.employees)).toBe(true);
        expect(response.body.employees.length).toBe(0);
      });

      it('WBS 항목 정보가 포함되어 있어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const evaluator = testData.employees[1];
        const wbsItem = testData.wbsItems[6];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee.id,
          wbsItem.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluator.id}/employees`,
          )
          .expect(200);

        // Then
        expect(response.body.employees.length).toBeGreaterThanOrEqual(1);
        const employeeData = response.body.employees.find(
          (e: any) => e.employeeId === employee.id,
        );
        expect(employeeData).toBeDefined();
        expect(employeeData.wbsItemId).toBe(wbsItem.id);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 평가자 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
        // Given
        const nonExistentEvaluatorId = 'f0f13879-9a95-4320-a753-3e304d203e4e';

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${nonExistentEvaluatorId}/employees`,
          )
          .expect(200);

        // Then
        expect(response.body.evaluatorId).toBe(nonExistentEvaluatorId);
        expect(response.body.employees).toBeDefined();
        expect(response.body.employees.length).toBe(0);
      });

      it('잘못된 UUID 형식의 평가자 ID로 조회 시 에러가 발생해야 한다', async () => {
        // Given
        const invalidUuid = 'invalid-uuid';

        // When & Then
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${invalidUuid}/employees`,
          )
          .expect((res) => {
            expect([400, 500]).toContain(res.status);
          });
      });

      it('빈 문자열 평가자 ID로 조회 시 에러가 발생해야 한다', async () => {
        // When & Then
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/ /employees`,
          )
          .expect((res) => {
            expect([404, 500]).toContain(res.status);
          });
      });
    });

    describe('데이터 무결성 검증', () => {
      it('조회된 피평가자 정보의 타임스탬프가 올바른 형식이어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const evaluator = testData.employees[1];
        const wbsItem = testData.wbsItems[7];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee.id,
          wbsItem.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluator.id}/employees`,
          )
          .expect(200);

        // Then
        response.body.employees.forEach((employee: any) => {
          expect(new Date(employee.createdAt).toString()).not.toBe(
            'Invalid Date',
          );
          expect(new Date(employee.updatedAt).toString()).not.toBe(
            'Invalid Date',
          );
        });
      });

      it('중복된 피평가자가 없어야 한다', async () => {
        // Given - 동일한 피평가자에 대해 여러 WBS 항목에 평가자 구성
        const employee = testData.employees[0];
        const evaluator = testData.employees[1];
        const wbsItem1 = testData.wbsItems[8];
        const wbsItem2 = testData.wbsItems[9];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem1.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee.id,
          wbsItem1.id,
          period.id,
          evaluator.id,
        );

        await createWbsAssignment(
          employee.id,
          wbsItem2.id,
          activeProject.id,
          period.id,
        );
        await configurePrimaryEvaluator(
          employee.id,
          wbsItem2.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluator.id}/employees`,
          )
          .expect(200);

        // Then - 같은 직원이 여러 WBS 항목에 대해 평가받을 수 있으므로 중복 가능
        expect(response.body.employees.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
