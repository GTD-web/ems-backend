import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/dashboard/:evaluationPeriodId/employees/status - 평가기간의 모든 직원 현황 조회', () => {
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

    console.log('전체 직원 현황 조회 테스트 데이터 생성 완료:', {
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
   * 전체 직원 현황 조회 헬퍼
   */
  function getAllEmployeesStatus(evaluationPeriodId: string) {
    return request(app.getHttpServer()).get(
      `/admin/dashboard/${evaluationPeriodId}/employees/status`,
    );
  }

  // ==================== 성공 시나리오 ====================

  describe('성공 시나리오', () => {
    it('등록된 모든 직원의 현황을 조회할 수 있어야 한다', async () => {
      // Given: 3명의 직원을 평가기간에 등록
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const employee3 = testData.employees[2];

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

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 3명의 직원 현황이 반환되어야 함
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);

      // 각 직원의 기본 정보 확인
      const employee1Status = response.body.find(
        (e: any) => e.employeeId === employee1.id,
      );
      expect(employee1Status).toBeDefined();
      expect(employee1Status.employee.name).toBe(employee1.name);
    });

    it('실제처럼 다양한 설정 상태를 가진 직원들을 조회할 수 있어야 한다', async () => {
      // Given: 5명의 직원에게 각각 다른 설정 적용
      const employees = testData.employees.slice(0, 5);
      const projects = testData.projects.slice(0, 2);
      const wbsItems = testData.wbsItems.slice(0, 3);

      // 직원 1: 아무것도 설정 안 함 (none 상태)
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employees[0].id,
      );

      // 직원 2: 프로젝트만 배정 (in_progress 상태)
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employees[1].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employees[1].id,
        projects[0].id,
      );

      // 직원 3: 프로젝트 + WBS 배정 (complete 상태)
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employees[2].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employees[2].id,
        projects[0].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employees[2].id,
        wbsItems[0].id,
      );

      // 직원 4: 프로젝트 + WBS + PRIMARY 평가자 지정
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employees[3].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employees[3].id,
        projects[1].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employees[3].id,
        wbsItems[1].id,
      );
      await configurePrimaryEvaluator(
        employees[3].id,
        wbsItems[1].id,
        testData.evaluationPeriodId,
        employees[0].id,
      );

      // 직원 5: 모든 설정 완료 (프로젝트 + WBS + PRIMARY + SECONDARY)
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employees[4].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employees[4].id,
        projects[1].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employees[4].id,
        wbsItems[2].id,
      );
      await configurePrimaryEvaluator(
        employees[4].id,
        wbsItems[2].id,
        testData.evaluationPeriodId,
        employees[0].id,
      );
      await configureSecondaryEvaluator(
        employees[4].id,
        wbsItems[2].id,
        testData.evaluationPeriodId,
        employees[1].id,
      );

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 5명의 직원 현황이 각각 다른 상태로 반환
      expect(response.body.length).toBe(5);

      const emp1Status = response.body.find(
        (e: any) => e.employeeId === employees[0].id,
      );
      expect(emp1Status.evaluationCriteria.status).toBe('none');
      expect(emp1Status.wbsCriteria.status).toBe('none');
      expect(emp1Status.evaluationLine.status).toBe('none');

      const emp2Status = response.body.find(
        (e: any) => e.employeeId === employees[1].id,
      );
      expect(emp2Status.evaluationCriteria.status).toBe('in_progress');
      expect(emp2Status.evaluationCriteria.assignedProjectCount).toBe(1);
      expect(emp2Status.evaluationCriteria.assignedWbsCount).toBe(0);

      const emp3Status = response.body.find(
        (e: any) => e.employeeId === employees[2].id,
      );
      expect(emp3Status.evaluationCriteria.status).toBe('complete');
      expect(emp3Status.evaluationCriteria.assignedProjectCount).toBe(1);
      expect(emp3Status.evaluationCriteria.assignedWbsCount).toBe(1);
      expect(emp3Status.wbsCriteria.status).toBe('complete');

      const emp4Status = response.body.find(
        (e: any) => e.employeeId === employees[3].id,
      );
      expect(emp4Status.evaluationCriteria.status).toBe('complete');
      // WBS 배정 시 자동으로 평가라인이 구성될 수 있음
      expect(['complete', 'in_progress']).toContain(
        emp4Status.evaluationLine.status,
      );
      expect(emp4Status.evaluationLine.hasPrimaryEvaluator).toBe(true);

      const emp5Status = response.body.find(
        (e: any) => e.employeeId === employees[4].id,
      );
      expect(emp5Status.evaluationCriteria.status).toBe('complete');
      expect(emp5Status.evaluationLine.status).toBe('complete');
      expect(emp5Status.evaluationLine.hasPrimaryEvaluator).toBe(true);
      expect(emp5Status.evaluationLine.hasSecondaryEvaluator).toBe(true);
    });

    it('제외된 직원은 결과에 포함되지 않아야 한다', async () => {
      // Given: 3명의 직원 중 1명은 제외 처리
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const excludedEmployee = testData.employees[2];

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
        excludedEmployee.id,
      );

      // 1명 제외 처리
      await excludeEmployee(
        testData.evaluationPeriodId,
        excludedEmployee.id,
        '휴직으로 인한 제외',
      );

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 제외된 직원을 제외한 2명만 반환
      expect(response.body.length).toBe(2);
      const employeeIds = response.body.map((e: any) => e.employeeId);
      expect(employeeIds).toContain(employee1.id);
      expect(employeeIds).toContain(employee2.id);
      expect(employeeIds).not.toContain(excludedEmployee.id);
    });

    it('응답에 모든 필수 필드가 포함되어야 한다', async () => {
      // Given: 1명의 직원 등록
      const employee = testData.employees[0];
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 필수 필드 확인
      expect(response.body.length).toBe(1);
      const status = response.body[0];

      // 최상위 필드
      expect(status).toHaveProperty('mappingId');
      expect(status).toHaveProperty('evaluationPeriodId');
      expect(status).toHaveProperty('employeeId');
      expect(status).toHaveProperty('isEvaluationTarget');
      expect(status).toHaveProperty('evaluationPeriod');
      expect(status).toHaveProperty('employee');
      expect(status).toHaveProperty('exclusionInfo');
      expect(status).toHaveProperty('evaluationCriteria');
      expect(status).toHaveProperty('wbsCriteria');
      expect(status).toHaveProperty('evaluationLine');

      // 평가기간 정보
      expect(status.evaluationPeriod).toHaveProperty('id');
      expect(status.evaluationPeriod).toHaveProperty('name');
      expect(status.evaluationPeriod).toHaveProperty('status');

      // 직원 정보
      expect(status.employee).toHaveProperty('id');
      expect(status.employee).toHaveProperty('name');
      expect(status.employee).toHaveProperty('employeeNumber');
      expect(status.employee).toHaveProperty('email');

      // 평가항목 상태
      expect(status.evaluationCriteria).toHaveProperty('status');
      expect(status.evaluationCriteria).toHaveProperty('assignedProjectCount');
      expect(status.evaluationCriteria).toHaveProperty('assignedWbsCount');

      // WBS 평가기준 상태
      expect(status.wbsCriteria).toHaveProperty('status');
      expect(status.wbsCriteria).toHaveProperty('wbsWithCriteriaCount');

      // 평가라인 상태
      expect(status.evaluationLine).toHaveProperty('status');
      expect(status.evaluationLine).toHaveProperty('hasPrimaryEvaluator');
      expect(status.evaluationLine).toHaveProperty('hasSecondaryEvaluator');

      // 제외 정보
      expect(status.exclusionInfo).toHaveProperty('isExcluded');
      expect(status.exclusionInfo).toHaveProperty('excludeReason');
      expect(status.exclusionInfo).toHaveProperty('excludedAt');
    });

    it('등록된 직원이 없으면 빈 배열을 반환해야 한다', async () => {
      // Given: 평가기간에 등록된 직원 없음

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('여러 프로젝트와 WBS가 배정된 직원의 현황이 정확해야 한다', async () => {
      // Given: 직원에게 여러 프로젝트와 WBS 배정
      const employee = testData.employees[0];
      const projects = testData.projects.slice(0, 2);
      const wbsItems = testData.wbsItems.slice(0, 3);

      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // 2개의 프로젝트 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        projects[0].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        projects[1].id,
      );

      // 3개의 WBS 배정
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItems[0].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItems[1].id,
      );
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employee.id,
        wbsItems[2].id,
      );

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 카운트가 정확해야 함
      expect(response.body.length).toBe(1);
      const status = response.body[0];
      expect(status.evaluationCriteria.assignedProjectCount).toBe(2);
      expect(status.evaluationCriteria.assignedWbsCount).toBe(3);
      expect(status.evaluationCriteria.status).toBe('complete');
      expect(status.wbsCriteria.wbsWithCriteriaCount).toBe(3);
      expect(status.wbsCriteria.status).toBe('complete');
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('실패 시나리오', () => {
    it('존재하지 않는 평가기간 조회 시 빈 배열을 반환해야 한다', async () => {
      // Given: 존재하지 않는 평가기간 ID
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When: 전체 직원 현황 조회
      const response = await request(app.getHttpServer())
        .get(`/admin/dashboard/${nonExistentPeriodId}/employees/status`)
        .expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('잘못된 평가기간 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidUuid = 'invalid-uuid';

      // When & Then: 에러 발생
      await request(app.getHttpServer())
        .get(`/admin/dashboard/${invalidUuid}/employees/status`)
        .expect((res) => {
          expect([400, 500]).toContain(res.status);
        });
    });
  });

  // ==================== 성능 및 정합성 ====================

  describe('성능 및 정합성', () => {
    it('여러 직원을 조회해도 각 직원의 데이터가 섞이지 않아야 한다', async () => {
      // Given: 3명의 직원에게 각각 다른 설정
      const employees = testData.employees.slice(0, 3);
      const projects = testData.projects.slice(0, 3);

      for (let i = 0; i < 3; i++) {
        await addEmployeeToEvaluationPeriod(
          testData.evaluationPeriodId,
          employees[i].id,
        );
        // 각 직원마다 i+1개의 프로젝트 배정
        for (let j = 0; j <= i; j++) {
          await assignProjectToEmployee(
            testData.evaluationPeriodId,
            employees[i].id,
            projects[j].id,
          );
        }
      }

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 각 직원의 프로젝트 수가 정확해야 함
      expect(response.body.length).toBe(3);

      const emp0Status = response.body.find(
        (e: any) => e.employeeId === employees[0].id,
      );
      expect(emp0Status.evaluationCriteria.assignedProjectCount).toBe(1);

      const emp1Status = response.body.find(
        (e: any) => e.employeeId === employees[1].id,
      );
      expect(emp1Status.evaluationCriteria.assignedProjectCount).toBe(2);

      const emp2Status = response.body.find(
        (e: any) => e.employeeId === employees[2].id,
      );
      expect(emp2Status.evaluationCriteria.assignedProjectCount).toBe(3);
    });

    it('상태 값이 예상된 enum 값 중 하나여야 한다', async () => {
      // Given: 직원 등록
      const employee = testData.employees[0];
      await addEmployeeToEvaluationPeriod(
        testData.evaluationPeriodId,
        employee.id,
      );

      // When: 전체 직원 현황 조회
      const response = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 상태 값이 유효한 enum 값이어야 함
      expect(response.body.length).toBe(1);
      const status = response.body[0];

      expect(['complete', 'in_progress', 'none']).toContain(
        status.evaluationCriteria.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        status.wbsCriteria.status,
      );
      expect(['complete', 'in_progress', 'none']).toContain(
        status.evaluationLine.status,
      );
    });
  });

  // ==================== 통합 시나리오 ====================

  describe('통합 시나리오 - 실제 관리자 대시보드 사용 사례', () => {
    it('시나리오: 평가기간 시작 후 직원들의 설정 진행 상황을 확인', async () => {
      // Given: 실제 평가 진행 시나리오 구성
      const employees = testData.employees.slice(0, 5);
      const projects = testData.projects.slice(0, 2);
      const wbsItems = testData.wbsItems.slice(0, 2);

      // 모든 직원을 평가기간에 등록
      for (const emp of employees) {
        await addEmployeeToEvaluationPeriod(
          testData.evaluationPeriodId,
          emp.id,
        );
      }

      // 1단계: 초기 상태 확인 (모두 none 상태)
      const response1 = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);
      expect(response1.body.length).toBe(5);
      response1.body.forEach((status: any) => {
        expect(status.evaluationCriteria.status).toBe('none');
      });

      // 2단계: 일부 직원에게 프로젝트 배정
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employees[0].id,
        projects[0].id,
      );
      await assignProjectToEmployee(
        testData.evaluationPeriodId,
        employees[1].id,
        projects[0].id,
      );

      const response2 = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);
      const emp0After = response2.body.find(
        (e: any) => e.employeeId === employees[0].id,
      );
      const emp1After = response2.body.find(
        (e: any) => e.employeeId === employees[1].id,
      );
      expect(emp0After.evaluationCriteria.status).toBe('in_progress');
      expect(emp1After.evaluationCriteria.status).toBe('in_progress');

      // 3단계: WBS 추가 배정하여 complete 상태 만들기
      await assignWbsToEmployee(
        testData.evaluationPeriodId,
        employees[0].id,
        wbsItems[0].id,
      );

      const response3 = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);
      const emp0Final = response3.body.find(
        (e: any) => e.employeeId === employees[0].id,
      );
      expect(emp0Final.evaluationCriteria.status).toBe('complete');

      // When: 최종 현황 확인
      const finalResponse = await getAllEmployeesStatus(
        testData.evaluationPeriodId,
      ).expect(200);

      // Then: 진행 상황이 명확히 구분되어야 함
      const completedCount = finalResponse.body.filter(
        (s: any) => s.evaluationCriteria.status === 'complete',
      ).length;
      const inProgressCount = finalResponse.body.filter(
        (s: any) => s.evaluationCriteria.status === 'in_progress',
      ).length;
      const noneCount = finalResponse.body.filter(
        (s: any) => s.evaluationCriteria.status === 'none',
      ).length;

      expect(completedCount).toBe(1); // employees[0]
      expect(inProgressCount).toBe(1); // employees[1]
      expect(noneCount).toBe(3); // 나머지 직원들
    });
  });
});
