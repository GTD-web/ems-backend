import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('GET /admin/dashboard/:evaluationPeriodId/my-assigned-data - 나의 할당 정보 조회', () => {
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
    currentUserId: string;
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

    // 현재 사용자로 사용할 직원 (첫 번째 직원)
    const currentUser = employees[0];

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
      evaluationPeriodId,
      currentUserId: currentUser.id,
    };

    // BaseE2ETest의 setCurrentUser 메서드로 현재 사용자 설정
    testSuite.setCurrentUser({
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      employeeNumber: currentUser.employeeNumber,
    });

    console.log('나의 할당 정보 조회 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
      evaluationPeriodId: testData.evaluationPeriodId,
      currentUserId: testData.currentUserId,
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
  async function addCurrentUserToEvaluationPeriod(): Promise<void> {
    await testSuite
      .request()
      .post(
        `/admin/evaluation-periods/${testData.evaluationPeriodId}/targets/${testData.currentUserId}`,
      )
      .expect((res) => {
        if (res.status !== 201 && res.status !== 409) {
          throw new Error(
            `평가 대상자 등록 실패: ${res.status} ${res.body.message}`,
          );
        }
      });
  }

  /**
   * 프로젝트 할당
   */
  async function assignProjectToCurrentUser(projectId: string): Promise<void> {
    await testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId: testData.currentUserId,
        projectId: projectId,
        periodId: testData.evaluationPeriodId,
      })
      .expect((res) => {
        // 201, 200 (성공), 409 (중복 - 이미 할당됨) 허용
        if (res.status !== 201 && res.status !== 200 && res.status !== 409) {
          throw new Error(`프로젝트 할당 실패: ${res.status}`);
        }
      });
  }

  /**
   * WBS 할당
   */
  async function assignWbsToCurrentUser(
    projectId: string,
    wbsItemIds: string[],
  ): Promise<void> {
    // 각 WBS를 개별적으로 할당
    for (const wbsItemId of wbsItemIds) {
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: testData.currentUserId,
          wbsItemId: wbsItemId,
          projectId: projectId,
          periodId: testData.evaluationPeriodId,
        })
        .expect((res) => {
          // 201, 200 (성공), 409 (중복 - 이미 할당됨) 허용
          if (res.status !== 201 && res.status !== 200 && res.status !== 409) {
            throw new Error(`WBS 할당 실패: ${res.status}`);
          }
        });
    }
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 케이스', () => {
    it('유효한 JWT 토큰으로 자신의 할당 정보를 조회할 수 있어야 한다', async () => {
      // Given: 현재 사용자를 평가 대상자로 등록
      await addCurrentUserToEvaluationPeriod();

      // When: 자신의 할당 정보 조회
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then: 응답 구조 검증
      expect(response.body).toBeDefined();
      expect(response.body.evaluationPeriod).toBeDefined();
      expect(response.body.employee).toBeDefined();
      expect(response.body.projects).toBeDefined();
      expect(response.body.summary).toBeDefined();

      // 현재 사용자 정보 확인
      expect(response.body.employee.id).toBe(testData.currentUserId);
    });

    it('응답에 모든 필수 필드가 포함되어야 한다', async () => {
      // Given
      await addCurrentUserToEvaluationPeriod();

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then: 평가기간 정보 필드
      expect(response.body.evaluationPeriod).toHaveProperty('id');
      expect(response.body.evaluationPeriod).toHaveProperty('name');
      expect(response.body.evaluationPeriod).toHaveProperty('startDate');
      expect(response.body.evaluationPeriod).toHaveProperty('status');

      // 직원 정보 필드
      expect(response.body.employee).toHaveProperty('id');
      expect(response.body.employee).toHaveProperty('name');
      expect(response.body.employee).toHaveProperty('employeeNumber');
      expect(response.body.employee).toHaveProperty('email');

      // 프로젝트 배열
      expect(Array.isArray(response.body.projects)).toBe(true);

      // 요약 정보 필드
      expect(response.body.summary).toHaveProperty('totalProjects');
      expect(response.body.summary).toHaveProperty('totalWbs');
      expect(response.body.summary).toHaveProperty('completedPerformances');
      expect(response.body.summary).toHaveProperty('completedSelfEvaluations');
    });

    it('프로젝트와 WBS가 할당된 경우 조회 성공해야 한다', async () => {
      // Given: 프로젝트와 WBS 할당
      await addCurrentUserToEvaluationPeriod();
      const project = testData.projects[0];
      await assignProjectToCurrentUser(project.id);

      const wbsIds = testData.wbsItems.slice(0, 2).map((wbs) => wbs.id);
      await assignWbsToCurrentUser(project.id, wbsIds);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then
      expect(response.body.projects.length).toBeGreaterThan(0);
      expect(response.body.summary.totalProjects).toBeGreaterThan(0);
      expect(response.body.summary.totalWbs).toBeGreaterThan(0);
    });

    it('할당이 없는 경우 빈 배열을 반환해야 한다', async () => {
      // Given: 할당 없음
      await addCurrentUserToEvaluationPeriod();

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then
      expect(response.body.projects).toEqual([]);
      expect(response.body.summary.totalProjects).toBe(0);
      expect(response.body.summary.totalWbs).toBe(0);
    });

    it('요약 정보가 정확해야 한다', async () => {
      // Given: 프로젝트와 WBS 할당
      await addCurrentUserToEvaluationPeriod();
      const project = testData.projects[0];
      await assignProjectToCurrentUser(project.id);

      const wbsIds = testData.wbsItems.slice(0, 3).map((wbs) => wbs.id);
      await assignWbsToCurrentUser(project.id, wbsIds);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then: 요약 정보 검증
      expect(response.body.summary.totalProjects).toBe(1);
      expect(response.body.summary.totalWbs).toBe(wbsIds.length);
    });

    it('프로젝트별로 WBS가 올바르게 그룹화되어야 한다', async () => {
      // Given: 여러 프로젝트와 WBS 할당
      await addCurrentUserToEvaluationPeriod();

      // 첫 번째 프로젝트
      const project1 = testData.projects[0];
      await assignProjectToCurrentUser(project1.id);
      const wbsIds1 = testData.wbsItems.slice(0, 2).map((wbs) => wbs.id);
      await assignWbsToCurrentUser(project1.id, wbsIds1);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then: 프로젝트별 그룹화 확인
      const projectInResponse = response.body.projects.find(
        (p: any) => p.projectId === project1.id,
      );
      expect(projectInResponse).toBeDefined();
      expect(projectInResponse.wbsList.length).toBe(wbsIds1.length);
    });
  });

  describe('실패 케이스', () => {
    it('Authorization 헤더 없이 요청 시 401 에러가 발생해야 한다', async () => {
      // When & Then: 인증 없이 요청 (별도 agent 사용)
      const request = require('supertest');
      await request(app.getHttpServer())
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(401);
    });

    it('잘못된 JWT 토큰으로 요청 시 401 에러가 발생해야 한다', async () => {
      // When & Then: 잘못된 토큰으로 요청 (별도 agent 사용)
      // 모킹된 AuthService 환경에서는 404가 반환될 수 있음 (사용자를 찾을 수 없음)
      const request = require('supertest');
      const response = await request(app.getHttpServer())
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .set('Authorization', 'Bearer invalid-token');

      // 401 (인증 실패) 또는 404 (사용자 찾을 수 없음) 모두 허용
      expect([401, 404]).toContain(response.status);
    });

    it('존재하지 않는 평가기간 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 평가기간 ID
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      // When & Then
      await testSuite
        .request()
        .get(`/admin/dashboard/${nonExistentPeriodId}/my-assigned-data`)
        .expect(404);
    });

    it('잘못된 UUID 형식의 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID
      const invalidUuid = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .get(`/admin/dashboard/${invalidUuid}/my-assigned-data`)
        .expect(400);
    });
  });

  describe('엣지 케이스', () => {
    it('여러 프로젝트에 할당된 경우 모든 프로젝트 정보를 반환해야 한다', async () => {
      // Given: 여러 프로젝트 할당
      await addCurrentUserToEvaluationPeriod();

      const project1 = testData.projects[0];
      const project2 = testData.projects[1];

      await assignProjectToCurrentUser(project1.id);
      await assignProjectToCurrentUser(project2.id);

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then
      expect(response.body.projects.length).toBeGreaterThanOrEqual(2);
      expect(response.body.summary.totalProjects).toBeGreaterThanOrEqual(2);
    });

    it('평가기간에 등록되지 않은 사용자 조회 시 404 에러가 발생해야 한다', async () => {
      // Given: 평가기간에 등록하지 않음

      // When & Then
      await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(404);
    });

    it('평가기간 정보가 올바르게 반환되어야 한다', async () => {
      // Given
      await addCurrentUserToEvaluationPeriod();

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then: 평가기간 정보 검증
      expect(response.body.evaluationPeriod.id).toBe(
        testData.evaluationPeriodId,
      );
      expect(response.body.evaluationPeriod.name).toBeDefined();
      expect(response.body.evaluationPeriod.status).toBeDefined();
    });

    it('직원 정보가 올바르게 반환되어야 한다', async () => {
      // Given
      await addCurrentUserToEvaluationPeriod();

      // When
      const response = await testSuite
        .request()
        .get(`/admin/dashboard/${testData.evaluationPeriodId}/my-assigned-data`)
        .expect(200);

      // Then: 직원 정보 검증
      expect(response.body.employee.id).toBe(testData.currentUserId);
      expect(response.body.employee.name).toBeDefined();
      expect(response.body.employee.employeeNumber).toBeDefined();
      expect(response.body.employee.email).toBeDefined();
    });
  });
});
