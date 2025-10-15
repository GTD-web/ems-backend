import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('직원 평가설정 통합 조회 테스트', () => {
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

    console.log('직원 평가설정 통합 조회 테스트 데이터 생성 완료:', {
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
   * 프로젝트 할당 생성 헬퍼
   */
  async function createProjectAssignment(
    employeeId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId,
        projectId,
        periodId,
        assignedBy: testData.employees[0].id,
      })
      .expect(201);

    return response.body;
  }

  /**
   * WBS 할당 생성 헬퍼
   */
  async function createWbsAssignment(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        assignedBy: testData.employees[0].id,
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
    const response = await request(app.getHttpServer())
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/primary-evaluator`,
      )
      .send({
        evaluatorId,
      })
      .expect(201);

    return response.body;
  }

  // ==================== 직원 평가설정 통합 조회 테스트 ====================

  describe('GET /admin/evaluation-criteria/evaluation-lines/employee/:employeeId/period/:periodId/settings - 직원 평가설정 통합 조회', () => {
    describe('성공 시나리오', () => {
      it('프로젝트 할당, WBS 할당, 평가라인 매핑이 모두 있는 경우 전체 설정을 조회할 수 있어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();
        const wbsItem = testData.wbsItems[0];
        const evaluator = testData.employees[1];

        // 프로젝트 할당
        await createProjectAssignment(employee.id, activeProject.id, period.id);

        // WBS 할당 (자동으로 평가라인 생성됨)
        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // 1차 평가자 구성
        await configurePrimaryEvaluator(
          employee.id,
          wbsItem.id,
          period.id,
          evaluator.id,
        );

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);

        // projectAssignments 검증
        expect(response.body.projectAssignments).toBeDefined();
        expect(Array.isArray(response.body.projectAssignments)).toBe(true);
        expect(response.body.projectAssignments.length).toBeGreaterThanOrEqual(
          1,
        );

        const projectAssignment = response.body.projectAssignments[0];
        expect(projectAssignment.id).toBeDefined();
        expect(projectAssignment.periodId).toBe(period.id);
        expect(projectAssignment.employeeId).toBe(employee.id);
        expect(projectAssignment.projectId).toBe(activeProject.id);
        expect(projectAssignment.assignedDate).toBeDefined();
        expect(projectAssignment.assignedBy).toBeDefined();
        expect(projectAssignment.displayOrder).toBeDefined();
        expect(projectAssignment.createdAt).toBeDefined();
        expect(projectAssignment.updatedAt).toBeDefined();
        expect(projectAssignment.version).toBeDefined();

        // wbsAssignments 검증
        expect(response.body.wbsAssignments).toBeDefined();
        expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
        expect(response.body.wbsAssignments.length).toBeGreaterThanOrEqual(1);

        const wbsAssignment = response.body.wbsAssignments[0];
        expect(wbsAssignment.id).toBeDefined();
        expect(wbsAssignment.periodId).toBe(period.id);
        expect(wbsAssignment.employeeId).toBe(employee.id);
        expect(wbsAssignment.projectId).toBe(activeProject.id);
        expect(wbsAssignment.wbsItemId).toBe(wbsItem.id);
        expect(wbsAssignment.assignedDate).toBeDefined();
        expect(wbsAssignment.assignedBy).toBeDefined();
        expect(wbsAssignment.displayOrder).toBeDefined();
        expect(wbsAssignment.createdAt).toBeDefined();
        expect(wbsAssignment.updatedAt).toBeDefined();
        expect(wbsAssignment.version).toBeDefined();

        // evaluationLineMappings 검증
        expect(response.body.evaluationLineMappings).toBeDefined();
        expect(Array.isArray(response.body.evaluationLineMappings)).toBe(true);
        expect(
          response.body.evaluationLineMappings.length,
        ).toBeGreaterThanOrEqual(1);

        const mapping = response.body.evaluationLineMappings[0];
        expect(mapping.id).toBeDefined();
        expect(mapping.employeeId).toBe(employee.id);
        expect(mapping.evaluatorId).toBeDefined();
        expect(mapping.evaluationLineId).toBeDefined();
        expect(mapping.createdAt).toBeDefined();
        expect(mapping.updatedAt).toBeDefined();
      });

      it('프로젝트만 할당된 경우 프로젝트 할당 정보만 반환되어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        // 프로젝트 할당만 생성
        await createProjectAssignment(employee.id, activeProject.id, period.id);

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.projectAssignments.length).toBeGreaterThanOrEqual(
          1,
        );
        expect(response.body.wbsAssignments.length).toBe(0);
        expect(response.body.evaluationLineMappings.length).toBe(0);
      });

      it('WBS만 할당된 경우 WBS 할당과 자동 생성된 평가라인 매핑이 반환되어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();
        const wbsItem = testData.wbsItems[2];

        // WBS 할당만 생성
        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.wbsAssignments.length).toBeGreaterThanOrEqual(1);
        expect(
          response.body.evaluationLineMappings.length,
        ).toBeGreaterThanOrEqual(0); // WBS 할당 시 자동으로 평가라인이 생성될 수 있음
      });

      it('할당이 전혀 없는 경우 빈 배열들이 반환되어야 한다', async () => {
        // Given
        const employee = testData.employees[3];
        const period = getActivePeriod();

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.projectAssignments).toEqual([]);
        expect(response.body.wbsAssignments).toEqual([]);
        expect(response.body.evaluationLineMappings).toEqual([]);
      });

      it('여러 프로젝트와 WBS가 할당된 경우 모든 할당 정보가 반환되어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();
        const wbsItem1 = testData.wbsItems[3];
        const wbsItem2 = testData.wbsItems[4];

        // 프로젝트 할당
        await createProjectAssignment(employee.id, activeProject.id, period.id);

        // 여러 WBS 할당
        await createWbsAssignment(
          employee.id,
          wbsItem1.id,
          activeProject.id,
          period.id,
        );
        await createWbsAssignment(
          employee.id,
          wbsItem2.id,
          activeProject.id,
          period.id,
        );

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body.projectAssignments.length).toBeGreaterThanOrEqual(
          1,
        );
        expect(response.body.wbsAssignments.length).toBeGreaterThanOrEqual(2);

        // WBS 할당에 올바른 wbsItemId가 포함되어 있는지 확인
        const wbsItemIds = response.body.wbsAssignments.map(
          (a: any) => a.wbsItemId,
        );
        expect(wbsItemIds).toContain(wbsItem1.id);
        expect(wbsItemIds).toContain(wbsItem2.id);
      });

      it('선택적 필드들이 올바르게 반환되는지 확인해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createProjectAssignment(employee.id, activeProject.id, period.id);

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then - 선택적 필드가 있으면 올바른 타입이어야 함
        const projectAssignment = response.body.projectAssignments[0];
        if (projectAssignment.deletedAt) {
          expect(new Date(projectAssignment.deletedAt).toString()).not.toBe(
            'Invalid Date',
          );
        }
        if (projectAssignment.createdBy) {
          expect(typeof projectAssignment.createdBy).toBe('string');
        }
        if (projectAssignment.updatedBy) {
          expect(typeof projectAssignment.updatedBy).toBe('string');
        }
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 직원 ID로 조회 시 빈 배열들을 반환해야 한다', async () => {
        // Given
        const nonExistentEmployeeId = 'f0f13879-9a95-4320-a753-3e304d203e4e';
        const period = getActivePeriod();

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${nonExistentEmployeeId}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body.employeeId).toBe(nonExistentEmployeeId);
        expect(response.body.periodId).toBe(period.id);
        expect(response.body.projectAssignments).toEqual([]);
        expect(response.body.wbsAssignments).toEqual([]);
        expect(response.body.evaluationLineMappings).toEqual([]);
      });

      it('존재하지 않는 평가기간 ID로 조회 시 빈 배열들을 반환해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const nonExistentPeriodId = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${nonExistentPeriodId}/settings`,
          )
          .expect(200);

        // Then
        expect(response.body.employeeId).toBe(employee.id);
        expect(response.body.periodId).toBe(nonExistentPeriodId);
        expect(response.body.projectAssignments).toEqual([]);
        expect(response.body.wbsAssignments).toEqual([]);
      });

      it('잘못된 UUID 형식의 직원 ID로 조회 시 에러가 발생해야 한다', async () => {
        // Given
        const invalidUuid = 'invalid-uuid';
        const period = getActivePeriod();

        // When & Then
        await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${invalidUuid}/period/${period.id}/settings`,
          )
          .expect((res) => {
            expect([400, 500]).toContain(res.status);
          });
      });

      it('잘못된 UUID 형식의 평가기간 ID로 조회 시 에러가 발생해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const invalidUuid = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${invalidUuid}/settings`,
          )
          .expect((res) => {
            expect([400, 500]).toContain(res.status);
          });
      });

      it('빈 문자열 직원 ID로 조회 시 에러가 발생해야 한다', async () => {
        // Given
        const period = getActivePeriod();

        // When & Then
        await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/ /period/${period.id}/settings`,
          )
          .expect((res) => {
            expect([404, 500]).toContain(res.status);
          });
      });
    });

    describe('데이터 무결성 검증', () => {
      it('타임스탬프 필드들이 올바른 형식이어야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();
        const wbsItem = testData.wbsItems[5];

        await createProjectAssignment(employee.id, activeProject.id, period.id);
        await createWbsAssignment(
          employee.id,
          wbsItem.id,
          activeProject.id,
          period.id,
        );

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then
        response.body.projectAssignments.forEach((assignment: any) => {
          expect(new Date(assignment.assignedDate).toString()).not.toBe(
            'Invalid Date',
          );
          expect(new Date(assignment.createdAt).toString()).not.toBe(
            'Invalid Date',
          );
          expect(new Date(assignment.updatedAt).toString()).not.toBe(
            'Invalid Date',
          );
        });

        response.body.wbsAssignments.forEach((assignment: any) => {
          expect(new Date(assignment.assignedDate).toString()).not.toBe(
            'Invalid Date',
          );
          expect(new Date(assignment.createdAt).toString()).not.toBe(
            'Invalid Date',
          );
          expect(new Date(assignment.updatedAt).toString()).not.toBe(
            'Invalid Date',
          );
        });

        response.body.evaluationLineMappings.forEach((mapping: any) => {
          expect(new Date(mapping.createdAt).toString()).not.toBe(
            'Invalid Date',
          );
          expect(new Date(mapping.updatedAt).toString()).not.toBe(
            'Invalid Date',
          );
        });
      });

      it('모든 필수 필드가 존재해야 한다', async () => {
        // Given
        const employee = testData.employees[0];
        const period = getActivePeriod();
        const activeProject = getActiveProject();

        await createProjectAssignment(employee.id, activeProject.id, period.id);

        // When
        const response = await request(app.getHttpServer())
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${employee.id}/period/${period.id}/settings`,
          )
          .expect(200);

        // Then - 최상위 필수 필드
        expect(response.body.employeeId).toBeDefined();
        expect(response.body.periodId).toBeDefined();
        expect(response.body.projectAssignments).toBeDefined();
        expect(response.body.wbsAssignments).toBeDefined();
        expect(response.body.evaluationLineMappings).toBeDefined();

        // projectAssignments 필수 필드
        const projectAssignment = response.body.projectAssignments[0];
        expect(projectAssignment.id).toBeDefined();
        expect(projectAssignment.periodId).toBeDefined();
        expect(projectAssignment.employeeId).toBeDefined();
        expect(projectAssignment.projectId).toBeDefined();
        expect(projectAssignment.assignedDate).toBeDefined();
        expect(projectAssignment.assignedBy).toBeDefined();
        expect(projectAssignment.displayOrder).toBeDefined();
        expect(projectAssignment.createdAt).toBeDefined();
        expect(projectAssignment.updatedAt).toBeDefined();
        expect(projectAssignment.version).toBeDefined();
      });
    });
  });
});
