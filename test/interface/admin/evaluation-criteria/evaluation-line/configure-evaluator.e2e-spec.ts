import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('평가자 구성 테스트 - 1차/2차 평가자 구성', () => {
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

    // 완전한 테스트 환경 생성
    const { departments, employees, projects, periods } =
      await testContextService.완전한_테스트환경을_생성한다();

    // 평가 관련 할당 데이터 정리 (각 테스트에서 개별 생성하기 위해)
    await dataSource.manager.query(
      `DELETE FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`,
    );
    await dataSource.manager.query(
      `DELETE FROM evaluation_project_assignment WHERE "deletedAt" IS NULL`,
    );
    await dataSource.manager.query(
      `DELETE FROM evaluation_line_mappings WHERE "deletedAt" IS NULL`,
    );

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
      periods,
    };

    console.log('평가자 구성 테스트 데이터 생성 완료:', {
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

  function getRandomWbsItem(): WbsItemDto {
    return testData.wbsItems[
      Math.floor(Math.random() * testData.wbsItems.length)
    ];
  }

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

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
   * WBS 할당 생성 헬퍼
   */
  async function createWbsAssignment(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
    assignedBy?: string,
  ): Promise<any> {
    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        assignedBy: assignedBy || getRandomEmployee().id,
      })
      .expect(201);

    return response.body;
  }

  /**
   * DB에서 평가라인 매핑 조회
   */
  async function getEvaluationLineMappingFromDb(
    mappingId: string,
  ): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_line_mappings WHERE "id" = $1 AND "deletedAt" IS NULL`,
      [mappingId],
    );
    return result[0];
  }

  // ==================== 1차 평가자 구성 테스트 ====================

  describe('POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/wbs/:wbsItemId/period/:periodId/primary-evaluator - 1차 평가자 구성', () => {
    describe('성공 시나리오 - 업데이트', () => {
      it('WBS 할당 시 자동 생성된 1차 평가자를 업데이트할 수 있어야 한다', async () => {
        // Given - WBS 할당 생성 (자동으로 평가라인 생성됨)
        const employee = testData.employees[0];
        const initialEvaluator = testData.employees[1];
        const newEvaluator = testData.employees[2];
        const wbsItem = getRandomWbsItem();
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        // WBS 할당 생성 (자동으로 평가라인 생성됨)
        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When - 1차 평가자를 새로운 평가자로 업데이트
        const response = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/primary-evaluator`,
          )
          .send({
            evaluatorId: newEvaluator.id,
          })
          .expect(201);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.message).toBeDefined();
        expect(response.body.mapping).toBeDefined();
        expect(response.body.mapping.id).toBeDefined();
        expect(response.body.mapping.employeeId).toBe(employee.id);
        expect(response.body.mapping.evaluatorId).toBe(newEvaluator.id);
        expect(response.body.mapping.wbsItemId).toBe(wbsItem.id);
      });

      it('1차 평가자 업데이트 시 매핑 정보가 DB에도 업데이트되어야 한다', async () => {
        // Given - WBS 할당 생성
        const employee = testData.employees[2];
        const newEvaluator = testData.employees[3];
        const wbsItem = getRandomWbsItem();
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When - 1차 평가자 업데이트
        const response = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/primary-evaluator`,
          )
          .send({
            evaluatorId: newEvaluator.id,
          })
          .expect(201);

        // Then - DB에서 업데이트 확인
        const dbMapping = await getEvaluationLineMappingFromDb(
          response.body.mapping.id,
        );
        expect(dbMapping).toBeDefined();
        expect(dbMapping.employeeId).toBe(employee.id);
        expect(dbMapping.evaluatorId).toBe(newEvaluator.id);
        expect(dbMapping.wbsItemId).toBe(wbsItem.id);
      });

      it('여러 직원의 1차 평가자를 각각 업데이트할 수 있어야 한다', async () => {
        // Given - 서로 다른 WBS 항목 사용
        const employee1 = testData.employees[0];
        const employee2 = testData.employees[1];
        const newEvaluator = testData.employees[2];
        const wbsItem1 = testData.wbsItems[0];
        const wbsItem2 = testData.wbsItems[1];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        // WBS 할당 생성 (자동으로 평가라인 생성됨)
        await createWbsAssignment(
          employee1.id,
          wbsItem1.id,
          activeProject.id,
          period.id,
        );
        await createWbsAssignment(
          employee2.id,
          wbsItem2.id,
          activeProject.id,
          period.id,
        );

        // When - 첫 번째 직원 1차 평가자 업데이트
        const response1 = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee1.id}/wbs/${wbsItem1.id}/period/${period.id}/primary-evaluator`,
          )
          .send({
            evaluatorId: newEvaluator.id,
          })
          .expect(201);

        // When - 두 번째 직원 1차 평가자 업데이트
        const response2 = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee2.id}/wbs/${wbsItem2.id}/period/${period.id}/primary-evaluator`,
          )
          .send({
            evaluatorId: newEvaluator.id,
          })
          .expect(201);

        // Then
        expect(response1.body.mapping.employeeId).toBe(employee1.id);
        expect(response1.body.mapping.evaluatorId).toBe(newEvaluator.id);
        expect(response2.body.mapping.employeeId).toBe(employee2.id);
        expect(response2.body.mapping.evaluatorId).toBe(newEvaluator.id);
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 평가자 ID로 요청 시 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const wbsItem = getRandomWbsItem();
        const period = getActivePeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/primary-evaluator`,
          )
          .send({
            evaluatorId: 'invalid-uuid',
          })
          .expect(400);
      });

      it('evaluatorId가 누락된 경우 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const wbsItem = getRandomWbsItem();
        const period = getActivePeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/primary-evaluator`,
          )
          .send({})
          .expect(400);
      });
    });
  });

  // ==================== 2차 평가자 구성 테스트 ====================

  describe('POST /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/wbs/:wbsItemId/period/:periodId/secondary-evaluator - 2차 평가자 구성', () => {
    describe('성공 시나리오 - 업데이트', () => {
      it('WBS 할당 시 자동 생성된 2차 평가자를 업데이트할 수 있어야 한다', async () => {
        // Given - WBS 할당 생성 (자동으로 평가라인 생성됨)
        const employee = testData.employees[0];
        const newEvaluator = testData.employees[1];
        const wbsItem = testData.wbsItems[4];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        // WBS 할당 생성 (자동으로 평가라인 생성됨)
        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When - 2차 평가자를 새로운 평가자로 업데이트
        const response = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/secondary-evaluator`,
          )
          .send({
            evaluatorId: newEvaluator.id,
          })
          .expect(201);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.message).toBeDefined();
        expect(response.body.mapping).toBeDefined();
        expect(response.body.mapping.id).toBeDefined();
        expect(response.body.mapping.employeeId).toBe(employee.id);
        expect(response.body.mapping.evaluatorId).toBe(newEvaluator.id);
        expect(response.body.mapping.wbsItemId).toBe(wbsItem.id);
      });

      it('2차 평가자 업데이트 시 매핑 정보가 DB에도 업데이트되어야 한다', async () => {
        // Given - WBS 할당 생성
        const employee = testData.employees[1];
        const newEvaluator = testData.employees[2];
        const wbsItem = testData.wbsItems[5];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When - 2차 평가자 업데이트
        const response = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/secondary-evaluator`,
          )
          .send({
            evaluatorId: newEvaluator.id,
          })
          .expect(201);

        // Then - 응답 구조 확인
        expect(response.body.mapping).toBeDefined();
        expect(response.body.mapping.employeeId).toBe(employee.id);
        expect(response.body.mapping.evaluatorId).toBe(newEvaluator.id);
        expect(response.body.mapping.wbsItemId).toBe(wbsItem.id);
      });

      it('1차 평가자와 2차 평가자를 함께 업데이트할 수 있어야 한다', async () => {
        // Given - WBS 할당 생성
        const employee = testData.employees[2];
        const primaryEvaluator = testData.employees[3];
        const secondaryEvaluator = testData.employees[4];
        const wbsItem = testData.wbsItems[6];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When - 1차 평가자 업데이트
        const response1 = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/primary-evaluator`,
          )
          .send({
            evaluatorId: primaryEvaluator.id,
          })
          .expect(201);

        // When - 2차 평가자 업데이트
        const response2 = await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/secondary-evaluator`,
          )
          .send({
            evaluatorId: secondaryEvaluator.id,
          })
          .expect(201);

        // Then
        expect(response1.body.mapping.evaluatorId).toBe(primaryEvaluator.id);
        expect(response2.body.mapping.evaluatorId).toBe(secondaryEvaluator.id);
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 UUID 형식의 평가자 ID로 요청 시 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const wbsItem = getRandomWbsItem();
        const period = getActivePeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/secondary-evaluator`,
          )
          .send({
            evaluatorId: 'invalid-uuid',
          })
          .expect(400);
      });

      it('evaluatorId가 누락된 경우 에러가 발생해야 한다', async () => {
        // Given
        const employee = getRandomEmployee();
        const wbsItem = getRandomWbsItem();
        const period = getActivePeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/secondary-evaluator`,
          )
          .send({})
          .expect(400);
      });
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오 - 업데이트', () => {
    it('WBS 할당 생성 -> 1차 평가자 업데이트 -> 2차 평가자 업데이트 흐름이 정상적으로 동작해야 한다', async () => {
      // Given - WBS 할당 생성 (자동으로 평가라인 생성됨)
      const employee = testData.employees[4];
      const primaryEvaluator = testData.employees[0];
      const secondaryEvaluator = testData.employees[1];
      const wbsItem = testData.wbsItems[9];
      const period = getActivePeriod();
      const activeProject = getActiveProject();

      // 1. WBS 할당 생성 (자동으로 평가라인 생성됨)
      await createWbsAssignment(
        employee.id,
        wbsItem.id,
        activeProject.id,
        period.id,
      );

      // 2. 1차 평가자 업데이트
      const response1 = await request(app.getHttpServer())
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/primary-evaluator`,
        )
        .send({
          evaluatorId: primaryEvaluator.id,
        })
        .expect(201);

      // 3. 2차 평가자 업데이트
      const response2 = await request(app.getHttpServer())
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/wbs/${wbsItem.id}/period/${period.id}/secondary-evaluator`,
        )
        .send({
          evaluatorId: secondaryEvaluator.id,
        })
        .expect(201);

      // Then
      expect(response1.body.mapping).toBeDefined();
      expect(response1.body.mapping.evaluatorId).toBe(primaryEvaluator.id);
      expect(response2.body.mapping).toBeDefined();
      expect(response2.body.mapping.evaluatorId).toBe(secondaryEvaluator.id);
    });
  });
});
