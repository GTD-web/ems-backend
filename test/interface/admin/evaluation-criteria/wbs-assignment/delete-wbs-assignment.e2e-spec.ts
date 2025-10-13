import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

describe('[DELETE] /admin/evaluation-criteria/wbs-assignments/:id - WBS 할당 취소', () => {
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
    const uniqueId = Math.floor(Math.random() * 10000);
    const year = 2030 + Math.floor(uniqueId % 50);
    const month = Math.floor((uniqueId % 12) + 1)
      .toString()
      .padStart(2, '0');
    const day = Math.floor((uniqueId % 28) + 1)
      .toString()
      .padStart(2, '0');

    const evaluationPeriodData = {
      name: `테스트 평가기간 ${timestamp}-${uniqueId}`,
      startDate: `${year}-${month}-${day}`,
      peerEvaluationDeadline: `${year}-${month}-${Math.min(
        parseInt(day) + 20,
        28,
      )
        .toString()
        .padStart(2, '0')}`,
      description: `테스트용 평가기간 ${timestamp}-${uniqueId}`,
      maxSelfEvaluationRate: 120,
    };

    const response = await request(app.getHttpServer())
      .post('/admin/evaluation-periods')
      .send(evaluationPeriodData)
      .expect(201);

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
    const response = await request(app.getHttpServer())
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

  describe('1. 성공 시나리오', () => {
    it('1-1. 기본 할당 취소가 성공해야 한다', async () => {
      // Given: 평가기간 생성 및 WBS 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const assignment = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      // When: 할당 취소
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .send();

      // Then: 성공 응답
      expect(response.status).toBe(200);

      // 할당이 정상적으로 취소되었는지 확인
      // 취소 API가 200을 반환했으므로 성공적으로 처리됨
    });

    it('1-2. 마지막 할당 취소 시 평가기준이 자동으로 삭제되어야 한다', async () => {
      // Given: 평가기간 생성 및 단일 WBS 할당
      const periodId = await createEvaluationPeriod('in_progress');
      const assignment = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      // 평가기준이 생성되었는지 확인
      const criteriaBeforeDelete = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaBeforeDelete.length).toBeGreaterThan(0);

      // When: 할당 취소 (마지막 할당)
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .send();

      // Then: 성공 응답
      expect(response.status).toBe(200);

      // 평가기준이 삭제되었는지 확인
      const criteriaAfterDelete = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaAfterDelete.length).toBe(0);
    });

    it('1-3. 다른 할당이 남아있는 경우 평가기준은 유지되어야 한다', async () => {
      // Given: 평가기간 생성 및 동일 WBS에 여러 직원 할당
      const periodId = await createEvaluationPeriod('in_progress');
      const assignment1 = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      const assignment2 = await createWbsAssignment(
        testData.employees[2].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      // 평가기준 확인
      const criteriaBeforeDelete = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaBeforeDelete.length).toBeGreaterThan(0);

      // When: 첫 번째 할당만 취소
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment1.id}`)
        .send();

      // Then: 성공 응답
      expect(response.status).toBe(200);

      // 평가기준은 여전히 존재해야 함
      const criteriaAfterDelete = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaAfterDelete.length).toBeGreaterThan(0);

      // 두 번째 할당은 여전히 활성 상태
      const remainingAssignments = await dataSource.manager.query(
        `SELECT * FROM evaluation_wbs_assignment 
         WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(remainingAssignments.length).toBe(1);
      expect(remainingAssignments[0].id).toBe(assignment2.id);
    });

    it('1-4. 여러 할당을 순차적으로 취소할 수 있어야 한다', async () => {
      // Given: 평가기간 생성 및 여러 WBS 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const assignment1 = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      const assignment2 = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[1].id,
        testData.projects[0].id,
        periodId,
      );

      // When & Then: 각 할당을 순차적으로 취소
      const response1 = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment1.id}`)
        .send();
      expect(response1.status).toBe(200);

      const response2 = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment2.id}`)
        .send();
      expect(response2.status).toBe(200);

      // 모든 할당이 삭제되었는지 확인
      const remainingAssignments = await dataSource.manager.query(
        `SELECT * FROM evaluation_wbs_assignment 
         WHERE "employeeId" = $1 AND "deletedAt" IS NULL`,
        [testData.employees[1].id],
      );
      expect(remainingAssignments.length).toBe(0);
    });
  });

  describe('2. 실패 시나리오', () => {
    it('2-1. 잘못된 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid-format';

      // When: 잘못된 UUID로 취소 시도
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${invalidId}`)
        .send();

      // Then: 400 에러 (ParseUUIDPipe가 검증)
      expect(response.status).toBe(400);
    });
  });

  describe('3. 멱등성 검증', () => {
    it('3-1. 존재하지 않는 할당 ID로 취소 시도 시 성공 처리되어야 한다 (멱등성)', async () => {
      // Given: 존재하지 않는 UUID
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When: 존재하지 않는 할당 취소 시도
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${nonExistentId}`)
        .send();

      // Then: 성공 처리 (멱등성 보장 - 이미 삭제된 것으로 간주)
      expect(response.status).toBe(200);
    });

    it('3-2. 이미 취소된 할당을 다시 취소 시도 시 성공 처리되어야 한다 (멱등성)', async () => {
      // Given: 평가기간 생성, 할당 생성 후 취소
      const periodId = await createEvaluationPeriod('in_progress');
      const assignment = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      const firstResponse = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .send();
      expect(firstResponse.status).toBe(200);

      // When: 이미 취소된 할당을 다시 취소 시도
      const secondResponse = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .send();

      // Then: 성공 처리 (멱등성 보장 - 이미 삭제된 것으로 간주)
      expect(secondResponse.status).toBe(200);
    });
  });

  describe('4. 데이터 정합성 검증', () => {
    it('4-1. 할당 취소 후 목록 조회에서 제외되어야 한다', async () => {
      // Given: 평가기간 생성 및 여러 WBS 할당 생성
      const periodId = await createEvaluationPeriod('in_progress');
      const assignment1 = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[0].id,
        testData.projects[0].id,
        periodId,
      );

      const assignment2 = await createWbsAssignment(
        testData.employees[1].id,
        testData.wbsItems[1].id,
        testData.projects[0].id,
        periodId,
      );

      // When: 첫 번째 할당 취소
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment1.id}`)
        .send();
      expect(deleteResponse.status).toBe(200);

      // Then: 목록 조회 시 취소된 할당은 제외
      const listResponse = await request(app.getHttpServer())
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({
          periodId: periodId,
        });

      expect(listResponse.status).toBe(200);
      const assignmentIds = listResponse.body.assignments.map((a: any) => a.id);
      expect(assignmentIds).not.toContain(assignment1.id);
      expect(assignmentIds).toContain(assignment2.id);
    });

    it('4-2. 대량 할당 후 모든 할당을 취소하면 평가기준도 모두 삭제되어야 한다', async () => {
      // Given: 평가기간 생성 및 여러 직원에게 동일 WBS 대량 할당
      const periodId = await createEvaluationPeriod('in_progress');
      const assignments = await Promise.all([
        createWbsAssignment(
          testData.employees[1].id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        ),
        createWbsAssignment(
          testData.employees[2].id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        ),
        createWbsAssignment(
          testData.employees[3].id,
          testData.wbsItems[0].id,
          testData.projects[0].id,
          periodId,
        ),
      ]);

      // 평가기준 확인
      const criteriaBeforeDelete = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaBeforeDelete.length).toBeGreaterThan(0);

      // When: 모든 할당을 순차적으로 취소
      for (const assignment of assignments) {
        const response = await request(app.getHttpServer())
          .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
          .send();
        expect(response.status).toBe(200);
      }

      // Then: 평가기준이 삭제되어야 함 (마지막 할당 취소 시)
      const criteriaAfterDelete = await dataSource.manager.query(
        `SELECT * FROM wbs_evaluation_criteria WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
        [testData.wbsItems[0].id],
      );
      expect(criteriaAfterDelete.length).toBe(0);
    });
  });
});
