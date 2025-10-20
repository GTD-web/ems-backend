import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('[DELETE] WBS 할당 초기화', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);
  });

  beforeEach(async () => {
    // 완전한 테스트 환경 생성
    const { departments, employees, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    // 활성 프로젝트의 WBS 항목 조회
    const activeProject = projects.find((p) => p.isActive) || projects[0];
    const wbsItems = await getWbsItemsFromProject(activeProject.id);

    testData = {
      departments,
      employees,
      projects,
      wbsItems,
    };
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  /**
   * 프로젝트의 WBS 항목 조회 헬퍼 함수
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
   * 평가기간 생성 헬퍼 함수
   */
  async function createEvaluationPeriod(
    status: 'planned' | 'in_progress' | 'completed' = 'in_progress',
  ): Promise<string> {
    const timestamp = Date.now();
    const uniqueId = Math.floor(Math.random() * 100000);
    // 매우 먼 미래의 연도를 사용하여 겹칠 확률 최소화
    const year = 2100 + Math.floor(uniqueId % 100);
    const month = Math.floor((uniqueId % 12) + 1)
      .toString()
      .padStart(2, '0');
    const day = '01'; // 매월 1일로 고정

    const evaluationPeriodData = {
      name: `테스트 평가기간 ${timestamp}-${uniqueId}`,
      startDate: `${year}-${month}-${day}`,
      peerEvaluationDeadline: `${year}-${month}-20`,
      description: `테스트용 평가기간 ${timestamp}-${uniqueId}`,
      maxSelfEvaluationRate: 120,
    };

    const response = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(evaluationPeriodData);

    // 겹침 오류 시 재시도
    if (response.status === 409) {
      return await createEvaluationPeriod(status);
    }

    expect(response.status).toBe(201);
    const periodId = response.body.id;

    // 상태가 completed인 경우 DB에서 직접 상태 업데이트
    if (status === 'completed') {
      await dataSource.manager.update(
        'evaluation_period',
        { id: periodId },
        { status: 'completed' },
      );
    }

    return periodId;
  }

  /**
   * WBS 할당 생성 헬퍼 함수
   */
  async function createWbsAssignment(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        wbsItemId,
        projectId,
        periodId,
      });

    expect(response.status).toBe(201);
    return response.body;
  }

  /**
   * WBS 할당 개수 조회 헬퍼 함수
   */
  async function getWbsAssignmentCount(
    filters: {
      periodId?: string;
      projectId?: string;
      employeeId?: string;
    } = {},
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL`;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.periodId) {
      query += ` AND "periodId" = $${paramIndex}`;
      params.push(filters.periodId);
      paramIndex++;
    }

    if (filters.projectId) {
      query += ` AND "projectId" = $${paramIndex}`;
      params.push(filters.projectId);
      paramIndex++;
    }

    if (filters.employeeId) {
      query += ` AND "employeeId" = $${paramIndex}`;
      params.push(filters.employeeId);
      paramIndex++;
    }

    const result = await dataSource.manager.query(query, params);
    return parseInt(result[0].count);
  }

  describe('1. 평가기간 WBS 할당 초기화', () => {
    describe('1-1. 성공 시나리오', () => {
      it('평가기간의 모든 WBS 할당을 초기화해야 한다', async () => {
        // Given: 평가기간 생성 및 여러 WBS 할당 생성
        const periodId = await createEvaluationPeriod('in_progress');

        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        );

        await createWbsAssignment(
          testData.employees[2].id,
          testData.wbsItems[1].id,
          testData.projects[0].id,
          periodId,
        );

        await createWbsAssignment(
          testData.employees[3].id,
          testData.wbsItems[2].id,
          testData.projects[0].id,
          periodId,
        );

        const countBefore = await getWbsAssignmentCount({ periodId });
        expect(countBefore).toBe(3);

        // When: 평가기간 WBS 할당 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 모든 할당이 삭제되었는지 확인
        const countAfter = await getWbsAssignmentCount({ periodId });
        expect(countAfter).toBe(0);
      });

      it('여러 프로젝트의 할당이 모두 초기화되어야 한다', async () => {
        // Given: 평가기간 생성 및 여러 프로젝트에 할당
        const periodId = await createEvaluationPeriod('in_progress');
        const project1 = testData.projects[0];

        // 활성 프로젝트가 2개 이상 있는지 확인
        const activeProjects = testData.projects.filter((p) => p.isActive);
        const project2 =
          activeProjects.length > 1
            ? activeProjects[1]
            : testData.projects.find((p) => p.id !== project1.id);

        // 프로젝트 1의 WBS 할당
        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          project1.id,
          periodId,
        );

        // 프로젝트 2의 WBS 할당 (WBS 항목이 있는 경우에만)
        if (project2) {
          const project2WbsItems = await getWbsItemsFromProject(project2.id);
          if (project2WbsItems.length > 0) {
            await createWbsAssignment(
              testData.employees[2].id,
              project2WbsItems[0].id,
              project2.id,
              periodId,
            );
          }
        }

        const countBefore = await getWbsAssignmentCount({ periodId });
        expect(countBefore).toBeGreaterThan(0);

        // When: 평가기간 WBS 할당 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 모든 프로젝트의 할당이 삭제되었는지 확인
        const countAfter = await getWbsAssignmentCount({ periodId });
        expect(countAfter).toBe(0);
      });

      it('다른 평가기간의 할당은 영향받지 않아야 한다', async () => {
        // Given: 두 개의 평가기간 생성
        const periodId1 = await createEvaluationPeriod('in_progress');
        const periodId2 = await createEvaluationPeriod('in_progress');

        // 각 평가기간에 할당 생성
        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId1,
        );

        await createWbsAssignment(
          testData.employees[2].id,
          testData.wbsItems[1].id,
          testData.projects[0].id,
          periodId2,
        );

        // When: 첫 번째 평가기간만 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${periodId1}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 첫 번째 평가기간 할당은 삭제됨
        const count1 = await getWbsAssignmentCount({ periodId: periodId1 });
        expect(count1).toBe(0);

        // 두 번째 평가기간 할당은 유지됨
        const count2 = await getWbsAssignmentCount({ periodId: periodId2 });
        expect(count2).toBe(1);
      });
    });

    describe('1-2. 실패 시나리오', () => {
      it('잘못된 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
        // Given: 잘못된 UUID 형식
        const invalidId = 'invalid-uuid-format';

        // When: 잘못된 UUID로 초기화 시도
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${invalidId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 400 에러
        expect(response.status).toBe(400);
      });
    });

    describe('1-3. 멱등성 검증', () => {
      it('존재하지 않는 평가기간으로 초기화 시도 시 성공 처리되어야 한다', async () => {
        // Given: 존재하지 않는 UUID
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When: 존재하지 않는 평가기간 초기화 시도
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${nonExistentId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 처리 (멱등성 보장)
        expect(response.status).toBe(200);
      });

      it('이미 초기화된 평가기간을 다시 초기화 시도 시 성공 처리되어야 한다', async () => {
        // Given: 평가기간 생성 및 할당 생성 후 초기화
        const periodId = await createEvaluationPeriod('in_progress');
        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        );

        const firstResponse = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });
        expect(firstResponse.status).toBe(200);

        // When: 이미 초기화된 평가기간을 다시 초기화 시도
        const secondResponse = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 처리 (멱등성 보장)
        expect(secondResponse.status).toBe(200);
      });
    });
  });

  describe('2. 프로젝트 WBS 할당 초기화', () => {
    describe('2-1. 성공 시나리오', () => {
      it('특정 프로젝트의 특정 평가기간 WBS 할당을 초기화해야 한다', async () => {
        // Given: 평가기간 생성 및 프로젝트에 여러 할당 생성
        const periodId = await createEvaluationPeriod('in_progress');
        const projectId = testData.projects[0].id;

        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          projectId,
          periodId,
        );

        await createWbsAssignment(
          testData.employees[2].id,
          testData.wbsItems[1].id,
          projectId,
          periodId,
        );

        const countBefore = await getWbsAssignmentCount({
          periodId,
          projectId,
        });
        expect(countBefore).toBe(2);

        // When: 프로젝트 WBS 할당 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/project/${projectId}/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 해당 프로젝트의 할당이 삭제되었는지 확인
        const countAfter = await getWbsAssignmentCount({
          periodId,
          projectId,
        });
        expect(countAfter).toBe(0);
      });

      it('다른 프로젝트의 할당은 영향받지 않아야 한다', async () => {
        // Given: 평가기간 생성 및 여러 프로젝트에 할당
        const periodId = await createEvaluationPeriod('in_progress');
        const project1 = testData.projects[0];

        // 활성 프로젝트가 2개 이상 있는지 확인
        const activeProjects = testData.projects.filter((p) => p.isActive);
        const project2 =
          activeProjects.length > 1
            ? activeProjects[1]
            : testData.projects.find((p) => p.id !== project1.id);

        if (!project2) {
          // 프로젝트가 1개만 있으면 테스트 스킵
          return;
        }

        // 프로젝트 1의 할당
        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          project1.id,
          periodId,
        );

        // 프로젝트 2의 할당
        const project2WbsItems = await getWbsItemsFromProject(project2.id);
        if (project2WbsItems.length === 0) {
          // WBS 항목이 없으면 테스트 스킵
          return;
        }
        await createWbsAssignment(
          testData.employees[2].id,
          project2WbsItems[0].id,
          project2.id,
          periodId,
        );

        // When: 프로젝트 1만 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/project/${project1.id}/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 프로젝트 1의 할당은 삭제됨
        const count1 = await getWbsAssignmentCount({
          periodId,
          projectId: project1.id,
        });
        expect(count1).toBe(0);

        // 프로젝트 2의 할당은 유지됨
        const count2 = await getWbsAssignmentCount({
          periodId,
          projectId: project2.id,
        });
        expect(count2).toBe(1);
      });

      it('다른 평가기간의 동일 프로젝트 할당은 영향받지 않아야 한다', async () => {
        // Given: 두 개의 평가기간에 동일 프로젝트 할당
        const periodId1 = await createEvaluationPeriod('in_progress');
        const periodId2 = await createEvaluationPeriod('in_progress');
        const projectId = testData.projects[0].id;

        await createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          projectId,
          periodId1,
        );

        await createWbsAssignment(
          testData.employees[2].id,
          testData.wbsItems[1].id,
          projectId,
          periodId2,
        );

        // When: 첫 번째 평가기간의 프로젝트만 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/project/${projectId}/period/${periodId1}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 첫 번째 평가기간의 할당은 삭제됨
        const count1 = await getWbsAssignmentCount({
          periodId: periodId1,
          projectId,
        });
        expect(count1).toBe(0);

        // 두 번째 평가기간의 할당은 유지됨
        const count2 = await getWbsAssignmentCount({
          periodId: periodId2,
          projectId,
        });
        expect(count2).toBe(1);
      });
    });

    describe('2-2. 실패 시나리오', () => {
      it('잘못된 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
        // Given: 잘못된 UUID 형식
        const invalidId = 'invalid-uuid-format';
        const periodId = await createEvaluationPeriod('in_progress');

        // When: 잘못된 UUID로 초기화 시도
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/project/${invalidId}/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 400 에러
        expect(response.status).toBe(400);
      });
    });
  });

  describe('3. 직원 WBS 할당 초기화', () => {
    describe('3-1. 성공 시나리오', () => {
      it('특정 직원의 특정 평가기간 WBS 할당을 초기화해야 한다', async () => {
        // Given: 평가기간 생성 및 직원에게 여러 할당 생성
        const periodId = await createEvaluationPeriod('in_progress');
        const employeeId = testData.employees[1].id;

        await createWbsAssignment(
          employeeId,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        );

        await createWbsAssignment(
          employeeId,
          testData.wbsItems[1].id,
          testData.projects[0].id,
          periodId,
        );

        const countBefore = await getWbsAssignmentCount({
          periodId,
          employeeId,
        });
        expect(countBefore).toBe(2);

        // When: 직원 WBS 할당 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 해당 직원의 할당이 삭제되었는지 확인
        const countAfter = await getWbsAssignmentCount({
          periodId,
          employeeId,
        });
        expect(countAfter).toBe(0);
      });

      it('다른 직원의 할당은 영향받지 않아야 한다', async () => {
        // Given: 평가기간 생성 및 여러 직원에게 할당
        const periodId = await createEvaluationPeriod('in_progress');
        const employee1 = testData.employees[1];
        const employee2 = testData.employees[2];

        // 직원 1의 할당
        await createWbsAssignment(
          employee1.id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        );

        // 직원 2의 할당
        await createWbsAssignment(
          employee2.id,
          testData.wbsItems[1].id,
          testData.projects[0].id,
          periodId,
        );

        // When: 직원 1만 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/employee/${employee1.id}/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 직원 1의 할당은 삭제됨
        const count1 = await getWbsAssignmentCount({
          periodId,
          employeeId: employee1.id,
        });
        expect(count1).toBe(0);

        // 직원 2의 할당은 유지됨
        const count2 = await getWbsAssignmentCount({
          periodId,
          employeeId: employee2.id,
        });
        expect(count2).toBe(1);
      });

      it('다른 평가기간의 동일 직원 할당은 영향받지 않아야 한다', async () => {
        // Given: 두 개의 평가기간에 동일 직원 할당
        const periodId1 = await createEvaluationPeriod('in_progress');
        const periodId2 = await createEvaluationPeriod('in_progress');
        const employeeId = testData.employees[1].id;

        await createWbsAssignment(
          employeeId,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId1,
        );

        await createWbsAssignment(
          employeeId,
          testData.wbsItems[1].id,
          testData.projects[0].id,
          periodId2,
        );

        // When: 첫 번째 평가기간의 직원만 초기화
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId1}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 성공 응답
        expect(response.status).toBe(200);

        // 첫 번째 평가기간의 할당은 삭제됨
        const count1 = await getWbsAssignmentCount({
          periodId: periodId1,
          employeeId,
        });
        expect(count1).toBe(0);

        // 두 번째 평가기간의 할당은 유지됨
        const count2 = await getWbsAssignmentCount({
          periodId: periodId2,
          employeeId,
        });
        expect(count2).toBe(1);
      });
    });

    describe('3-2. 실패 시나리오', () => {
      it('잘못된 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
        // Given: 잘못된 UUID 형식
        const invalidId = 'invalid-uuid-format';
        const periodId = await createEvaluationPeriod('in_progress');

        // When: 잘못된 UUID로 초기화 시도
        const response = await testSuite
          .request()
          .delete(
            `/admin/evaluation-criteria/wbs-assignments/employee/${invalidId}/period/${periodId}`,
          )
          .send({ resetBy: uuidv4() });

        // Then: 400 에러
        expect(response.status).toBe(400);
      });
    });
  });

  describe('4. 데이터 정합성 검증', () => {
    it('초기화 후 평가기준도 함께 정리되어야 한다', async () => {
      // Given: 평가기간 생성 및 WBS 할당 (평가기준 자동 생성)
      const periodId = await createEvaluationPeriod('in_progress');
      await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      // 평가기준이 생성되었는지 확인
      const criteriaBeforeReset = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaBeforeReset.length).toBeGreaterThan(0);

      // When: 평가기간 초기화
      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/period/${periodId}`)
        .send({ resetBy: uuidv4() });

      // Then: 성공 응답
      expect(response.status).toBe(200);

      // 평가기준도 삭제되었는지 확인
      const criteriaAfterReset = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaAfterReset.length).toBe(0);
    });

    it('초기화 후 목록 조회 시 결과가 비어있어야 한다', async () => {
      // Given: 평가기간 생성 및 여러 할당
      const periodId = await createEvaluationPeriod('in_progress');
      await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      await createWbsAssignment(
        testData.employees[2].id,
        testData.wbsItems[1].id,
        testData.projects[0].id,
        periodId,
      );

      // When: 평가기간 초기화
      const resetResponse = await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/period/${periodId}`)
        .send({ resetBy: uuidv4() });
      expect(resetResponse.status).toBe(200);

      // Then: 목록 조회 시 빈 결과
      const listResponse = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ periodId });

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.assignments.length).toBe(0);
    });

    it('부분 초기화 후 다른 범위의 데이터는 유지되어야 한다', async () => {
      // Given: 평가기간 생성 및 여러 프로젝트/직원 할당
      const periodId = await createEvaluationPeriod('in_progress');
      const project1 = testData.projects[0];

      // 활성 프로젝트가 2개 이상 있는지 확인
      const activeProjects = testData.projects.filter((p) => p.isActive);
      const project2 =
        activeProjects.length > 1
          ? activeProjects[1]
          : testData.projects.find((p) => p.id !== project1.id);

      if (!project2) {
        // 프로젝트가 1개만 있으면 테스트 스킵
        return;
      }

      // 프로젝트 1에 할당
      await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        project1.id,
        periodId,
      );

      // 프로젝트 2에 할당
      const project2WbsItems = await getWbsItemsFromProject(project2.id);
      if (project2WbsItems.length === 0) {
        // WBS 항목이 없으면 테스트 스킵
        return;
      }
      await createWbsAssignment(
        testData.employees[2].id,
        project2WbsItems[0].id,
        project2.id,
        periodId,
      );

      // When: 프로젝트 1만 초기화
      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/project/${project1.id}/period/${periodId}`,
        )
        .send({ resetBy: uuidv4() });

      // Then: 성공 응답
      expect(response.status).toBe(200);

      // 전체 할당 개수 확인 (프로젝트 2의 할당 1개만 남아야 함)
      const totalCount = await getWbsAssignmentCount({ periodId });
      expect(totalCount).toBe(1);
    });
  });
});
