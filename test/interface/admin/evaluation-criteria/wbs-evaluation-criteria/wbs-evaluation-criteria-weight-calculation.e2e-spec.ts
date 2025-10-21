import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { ProjectDto } from '@domain/common/project/project.types';
import { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';

describe('WBS 평가기준 가중치 자동 계산 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    projects: ProjectDto[];
    wbsItems: WbsItemDto[];
    evaluationPeriod: EvaluationPeriodDto;
  };

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
    testContextService = app.get(TestContextService);
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
      evaluationPeriod: periods[0],
    };

    console.log('WBS 평가기준 가중치 계산 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      projects: testData.projects.length,
      wbsItems: testData.wbsItems.length,
      evaluationPeriod: testData.evaluationPeriod.id,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testSuite.closeApp();
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
   * WBS 평가기준 생성 (중요도 포함)
   */
  async function createWbsEvaluationCriteria(
    wbsItemId: string,
    criteria: string,
    importance: number,
    actionBy?: string,
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .send({
        criteria,
        importance,
        // actionBy는 @CurrentUser에서 처리하므로 제거
      })
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 생성
   */
  async function createWbsAssignment(
    employeeId: string,
    periodId: string,
    wbsItemId: string,
    projectId?: string,
  ): Promise<any> {
    const wbs = testData.wbsItems.find((w) => w.id === wbsItemId);
    const response = await testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId,
        periodId,
        wbsItemId,
        projectId: projectId || wbs?.projectId || testData.projects[0].id,
        assignedBy: testData.employees[0].id,
      })
      .expect(201);

    return response.body;
  }

  /**
   * WBS 할당 조회
   */
  async function getWbsAssignments(
    employeeId: string,
    periodId: string,
  ): Promise<any[]> {
    const result = await dataSource.manager.query(
      `SELECT * FROM evaluation_wbs_assignment 
       WHERE "employeeId" = $1 AND "periodId" = $2 AND "deletedAt" IS NULL
       ORDER BY "createdAt" ASC`,
      [employeeId, periodId],
    );
    return result;
  }

  /**
   * WBS 평가기준 수정 (wbsItemId로 upsert)
   */
  async function updateWbsEvaluationCriteria(
    id: string,
    updateData: { criteria?: string; importance?: number },
    actionBy?: string,
  ): Promise<any> {
    // DB에서 직접 조회하여 wbsItemId와 기존 데이터 가져오기
    const existingCriteria = await dataSource.manager.query(
      `SELECT "wbsItemId", criteria, importance FROM wbs_evaluation_criteria WHERE id = $1 AND "deletedAt" IS NULL`,
      [id],
    );

    if (!existingCriteria || existingCriteria.length === 0) {
      throw new Error(`Criteria not found: ${id}`);
    }

    const wbsItemId = existingCriteria[0].wbsItemId;
    const currentCriteria = existingCriteria[0].criteria;
    const currentImportance = existingCriteria[0].importance;

    // wbsItemId로 upsert (기존 값 유지하면서 변경된 값만 업데이트)
    const response = await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/wbs-evaluation-criteria/wbs-item/${wbsItemId}`,
      )
      .send({
        criteria:
          updateData.criteria !== undefined
            ? updateData.criteria
            : currentCriteria,
        importance:
          updateData.importance !== undefined
            ? updateData.importance
            : currentImportance,
      })
      .expect(200); // Upsert는 200 반환

    return response.body;
  }

  /**
   * WBS 평가기준 삭제
   */
  async function deleteWbsEvaluationCriteria(
    id: string,
    actionBy?: string,
  ): Promise<void> {
    await testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-evaluation-criteria/${id}`)
      .send({
        actionBy: actionBy || testData.employees[0].id,
      })
      .expect(200);
  }

  /**
   * WBS 평가기준 조회
   */
  async function getWbsEvaluationCriteria(wbsItemId: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM wbs_evaluation_criteria 
       WHERE "wbsItemId" = $1 AND "deletedAt" IS NULL`,
      [wbsItemId],
    );
    return result[0];
  }

  // ==================== 가중치 계산 기본 시나리오 ====================

  describe('가중치 계산 기본 시나리오', () => {
    it('WBS 평가기준 생성 후 해당 WBS가 할당된 직원의 가중치가 자동 계산되어야 한다', async () => {
      // Given: 직원에게 3개의 WBS 할당
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];
      const wbs3 = testData.wbsItems[2];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsAssignment(employee.id, periodId, wbs2.id);
      await createWbsAssignment(employee.id, periodId, wbs3.id);

      // When: 각 WBS에 평가기준 생성 (중요도: 5, 3, 2)
      await createWbsEvaluationCriteria(wbs1.id, '기준1', 5);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 3);
      await createWbsEvaluationCriteria(wbs3.id, '기준3', 2);

      // Then: 가중치 확인 (총 중요도 10, 비율: 50%, 30%, 20%)
      const assignments = await getWbsAssignments(employee.id, periodId);
      expect(assignments).toHaveLength(3);

      const wbs1Assignment = assignments.find((a) => a.wbsItemId === wbs1.id);
      const wbs2Assignment = assignments.find((a) => a.wbsItemId === wbs2.id);
      const wbs3Assignment = assignments.find((a) => a.wbsItemId === wbs3.id);

      expect(parseFloat(wbs1Assignment.weight)).toBe(50);
      expect(parseFloat(wbs2Assignment.weight)).toBe(30);
      expect(parseFloat(wbs3Assignment.weight)).toBe(20);

      // 가중치 합계가 100인지 확인
      const totalWeight =
        parseFloat(wbs1Assignment.weight) +
        parseFloat(wbs2Assignment.weight) +
        parseFloat(wbs3Assignment.weight);
      expect(totalWeight).toBe(100);
    });

    it('중요도 수정 시 가중치가 자동으로 재계산되어야 한다', async () => {
      // Given: 직원에게 2개의 WBS 할당 및 평가기준 생성
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsAssignment(employee.id, periodId, wbs2.id);

      const criteria1 = await createWbsEvaluationCriteria(wbs1.id, '기준1', 5);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 5);

      // 초기 가중치 확인 (50%, 50%)
      let assignments = await getWbsAssignments(employee.id, periodId);
      expect(parseFloat(assignments[0].weight)).toBe(50);
      expect(parseFloat(assignments[1].weight)).toBe(50);

      // When: WBS1의 중요도를 9로 변경
      await updateWbsEvaluationCriteria(criteria1.id, { importance: 9 });

      // Then: 가중치 재계산 확인 (총 중요도 14, 비율: 64.29%, 35.71%)
      assignments = await getWbsAssignments(employee.id, periodId);
      const wbs1Assignment = assignments.find((a) => a.wbsItemId === wbs1.id);
      const wbs2Assignment = assignments.find((a) => a.wbsItemId === wbs2.id);

      // 반올림으로 인한 오차 허용 (소수점 2자리)
      expect(parseFloat(wbs1Assignment.weight)).toBeCloseTo(64.29, 1);
      expect(parseFloat(wbs2Assignment.weight)).toBeCloseTo(35.71, 1);

      // 가중치 합계가 100인지 확인
      const totalWeight =
        parseFloat(wbs1Assignment.weight) + parseFloat(wbs2Assignment.weight);
      expect(totalWeight).toBeCloseTo(100, 2);
    });

    it('평가기준 삭제 시 가중치가 자동으로 재계산되어야 한다', async () => {
      // Given: 직원에게 3개의 WBS 할당 및 평가기준 생성
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];
      const wbs3 = testData.wbsItems[2];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsAssignment(employee.id, periodId, wbs2.id);
      await createWbsAssignment(employee.id, periodId, wbs3.id);

      const criteria1 = await createWbsEvaluationCriteria(wbs1.id, '기준1', 3);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 3);
      await createWbsEvaluationCriteria(wbs3.id, '기준3', 4);

      // 초기 가중치 확인 (총 10: 30%, 30%, 40%)
      let assignments = await getWbsAssignments(employee.id, periodId);
      expect(parseFloat(assignments[0].weight)).toBe(30);
      expect(parseFloat(assignments[1].weight)).toBe(30);
      expect(parseFloat(assignments[2].weight)).toBe(40);

      // When: WBS3의 평가기준 삭제
      await deleteWbsEvaluationCriteria(criteria1.id);

      // Then: 나머지 WBS의 가중치 재계산 (WBS1 중요도 0이 되어 제외, 총 7: WBS2 42.86%, WBS3 57.14%)
      assignments = await getWbsAssignments(employee.id, periodId);
      const wbs1Assignment = assignments.find((a) => a.wbsItemId === wbs1.id);
      const wbs2Assignment = assignments.find((a) => a.wbsItemId === wbs2.id);
      const wbs3Assignment = assignments.find((a) => a.wbsItemId === wbs3.id);

      expect(parseFloat(wbs1Assignment.weight)).toBe(0); // 평가기준이 없어서 0
      expect(parseFloat(wbs2Assignment.weight)).toBeCloseTo(42.86, 1);
      expect(parseFloat(wbs3Assignment.weight)).toBeCloseTo(57.14, 1);
    });
  });

  // ==================== 엣지 케이스 ====================

  describe('가중치 계산 엣지 케이스', () => {
    it('중요도가 하나만 있는 경우 해당 WBS의 가중치가 100이어야 한다', async () => {
      // Given: 직원에게 1개의 WBS만 할당 및 평가기준 생성
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsEvaluationCriteria(wbs1.id, '기준1', 7);

      // When & Then
      const assignments = await getWbsAssignments(employee.id, periodId);
      expect(assignments).toHaveLength(1);
      expect(parseFloat(assignments[0].weight)).toBe(100);
    });

    it('반올림으로 인한 가중치 합계 오차가 조정되어야 한다', async () => {
      // Given: 직원에게 3개의 WBS 할당 (중요도 합이 3으로 나누어지지 않음)
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];
      const wbs3 = testData.wbsItems[2];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsAssignment(employee.id, periodId, wbs2.id);
      await createWbsAssignment(employee.id, periodId, wbs3.id);

      // 총 중요도 7 (3으로 나누어지지 않음)
      await createWbsEvaluationCriteria(wbs1.id, '기준1', 3);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 2);
      await createWbsEvaluationCriteria(wbs3.id, '기준3', 2);

      // When & Then: 가중치 합계가 100이어야 함
      const assignments = await getWbsAssignments(employee.id, periodId);
      const totalWeight = assignments.reduce(
        (sum, a) => sum + parseFloat(a.weight),
        0,
      );

      expect(totalWeight).toBeCloseTo(100, 2);

      // 각 가중치 개별 확인
      const wbs1Assignment = assignments.find((a) => a.wbsItemId === wbs1.id);
      const wbs2Assignment = assignments.find((a) => a.wbsItemId === wbs2.id);
      const wbs3Assignment = assignments.find((a) => a.wbsItemId === wbs3.id);

      // 3/7 ≈ 42.86%, 2/7 ≈ 28.57%, 2/7 ≈ 28.57%
      expect(parseFloat(wbs1Assignment.weight)).toBeCloseTo(42.86, 1);
      expect(parseFloat(wbs2Assignment.weight)).toBeCloseTo(28.57, 1);
      expect(parseFloat(wbs3Assignment.weight)).toBeCloseTo(28.57, 1);
    });

    it('동일 WBS가 여러 직원에게 할당된 경우 각각 독립적으로 가중치가 계산되어야 한다', async () => {
      // Given: 동일한 WBS를 2명의 직원에게 할당
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const periodId = testData.evaluationPeriod.id;
      const sharedWbs = testData.wbsItems[0];
      const wbs2ForEmployee1 = testData.wbsItems[1];
      const wbs2ForEmployee2 = testData.wbsItems[2];

      // 직원1: sharedWbs (중요도 5) + wbs2 (중요도 5)
      await createWbsAssignment(employee1.id, periodId, sharedWbs.id);
      await createWbsAssignment(employee1.id, periodId, wbs2ForEmployee1.id);

      // 직원2: sharedWbs (중요도 5) + wbs3 (중요도 10)
      await createWbsAssignment(employee2.id, periodId, sharedWbs.id);
      await createWbsAssignment(employee2.id, periodId, wbs2ForEmployee2.id);

      // When: 평가기준 생성
      await createWbsEvaluationCriteria(sharedWbs.id, '공통 기준', 5);
      await createWbsEvaluationCriteria(wbs2ForEmployee1.id, '기준2-1', 5);
      await createWbsEvaluationCriteria(wbs2ForEmployee2.id, '기준2-2', 10);

      // Then: 각 직원별로 독립적인 가중치 계산
      const employee1Assignments = await getWbsAssignments(
        employee1.id,
        periodId,
      );
      const employee2Assignments = await getWbsAssignments(
        employee2.id,
        periodId,
      );

      // 직원1: 총 중요도 10 (sharedWbs 50%, wbs2 50%)
      const emp1SharedWbs = employee1Assignments.find(
        (a) => a.wbsItemId === sharedWbs.id,
      );
      const emp1Wbs2 = employee1Assignments.find(
        (a) => a.wbsItemId === wbs2ForEmployee1.id,
      );
      expect(parseFloat(emp1SharedWbs.weight)).toBe(50);
      expect(parseFloat(emp1Wbs2.weight)).toBe(50);

      // 직원2: 총 중요도 15 (sharedWbs 33.33%, wbs3 66.67%)
      const emp2SharedWbs = employee2Assignments.find(
        (a) => a.wbsItemId === sharedWbs.id,
      );
      const emp2Wbs3 = employee2Assignments.find(
        (a) => a.wbsItemId === wbs2ForEmployee2.id,
      );
      expect(parseFloat(emp2SharedWbs.weight)).toBeCloseTo(33.33, 1);
      expect(parseFloat(emp2Wbs3.weight)).toBeCloseTo(66.67, 1);
    });

    it('새로운 WBS 할당 시 기존 WBS들의 가중치가 재계산되어야 한다', async () => {
      // Given: 직원에게 2개의 WBS 할당 및 평가기준 생성
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];
      const wbs3 = testData.wbsItems[2];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsAssignment(employee.id, periodId, wbs2.id);

      await createWbsEvaluationCriteria(wbs1.id, '기준1', 5);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 5);

      // 초기 가중치 확인 (50%, 50%)
      let assignments = await getWbsAssignments(employee.id, periodId);
      expect(parseFloat(assignments[0].weight)).toBe(50);
      expect(parseFloat(assignments[1].weight)).toBe(50);

      // When: 새로운 WBS 할당 추가 및 평가기준 생성
      await createWbsEvaluationCriteria(wbs3.id, '기준3', 10);
      await createWbsAssignment(employee.id, periodId, wbs3.id);

      // Then: 모든 WBS의 가중치 재계산 (총 20: 25%, 25%, 50%)
      assignments = await getWbsAssignments(employee.id, periodId);
      const wbs1Assignment = assignments.find((a) => a.wbsItemId === wbs1.id);
      const wbs2Assignment = assignments.find((a) => a.wbsItemId === wbs2.id);
      const wbs3Assignment = assignments.find((a) => a.wbsItemId === wbs3.id);

      expect(parseFloat(wbs1Assignment.weight)).toBe(25);
      expect(parseFloat(wbs2Assignment.weight)).toBe(25);
      expect(parseFloat(wbs3Assignment.weight)).toBe(50);

      const totalWeight =
        parseFloat(wbs1Assignment.weight) +
        parseFloat(wbs2Assignment.weight) +
        parseFloat(wbs3Assignment.weight);
      expect(totalWeight).toBe(100);
    });

    it('여러 평가기간에 동일 직원-WBS 조합이 있을 때 각 기간별로 독립적으로 가중치가 계산되어야 한다', async () => {
      // Given: 2개의 평가기간 생성
      const employee = testData.employees[0];
      const periodId1 = testData.evaluationPeriod.id;

      // 두 번째 평가기간 생성
      const period2Result = await dataSource.manager.query(
        `INSERT INTO evaluation_period 
         ("name", "startDate", "endDate", "status", "currentPhase", "version", "createdBy")
         VALUES ('2024년 하반기', NOW(), NOW() + INTERVAL '6 months', 'waiting', 'waiting', 1, $1)
         RETURNING *`,
        [testData.employees[0].id],
      );
      const periodId2 = period2Result[0].id;

      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];

      // 평가기간1: WBS1 (중요도 5) + WBS2 (중요도 5)
      await createWbsAssignment(employee.id, periodId1, wbs1.id);
      await createWbsAssignment(employee.id, periodId1, wbs2.id);

      // 평가기간2: WBS1 (중요도 5) + WBS2 (중요도 10)
      await createWbsAssignment(employee.id, periodId2, wbs1.id);
      await createWbsAssignment(employee.id, periodId2, wbs2.id);

      // When: 평가기준 생성 (중요도는 WBS에 속하므로 동일)
      await createWbsEvaluationCriteria(wbs1.id, '기준1', 5);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 5);

      // Then: 두 평가기간 모두 동일한 가중치 (50%, 50%)
      const period1Assignments = await getWbsAssignments(
        employee.id,
        periodId1,
      );
      const period2Assignments = await getWbsAssignments(
        employee.id,
        periodId2,
      );

      // 평가기간1
      expect(parseFloat(period1Assignments[0].weight)).toBe(50);
      expect(parseFloat(period1Assignments[1].weight)).toBe(50);

      // 평가기간2
      expect(parseFloat(period2Assignments[0].weight)).toBe(50);
      expect(parseFloat(period2Assignments[1].weight)).toBe(50);
    });

    it('극단적인 중요도 차이가 있을 때 가중치가 올바르게 계산되어야 한다', async () => {
      // Given: 직원에게 3개의 WBS 할당 (중요도: 1, 1, 10)
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbs1 = testData.wbsItems[0];
      const wbs2 = testData.wbsItems[1];
      const wbs3 = testData.wbsItems[2];

      await createWbsAssignment(employee.id, periodId, wbs1.id);
      await createWbsAssignment(employee.id, periodId, wbs2.id);
      await createWbsAssignment(employee.id, periodId, wbs3.id);

      // When: 극단적인 중요도 설정
      await createWbsEvaluationCriteria(wbs1.id, '기준1', 1);
      await createWbsEvaluationCriteria(wbs2.id, '기준2', 1);
      await createWbsEvaluationCriteria(wbs3.id, '기준3', 10);

      // Then: 가중치 확인 (총 12: 8.33%, 8.33%, 83.33%)
      const assignments = await getWbsAssignments(employee.id, periodId);
      const wbs1Assignment = assignments.find((a) => a.wbsItemId === wbs1.id);
      const wbs2Assignment = assignments.find((a) => a.wbsItemId === wbs2.id);
      const wbs3Assignment = assignments.find((a) => a.wbsItemId === wbs3.id);

      expect(parseFloat(wbs1Assignment.weight)).toBeCloseTo(8.33, 1);
      expect(parseFloat(wbs2Assignment.weight)).toBeCloseTo(8.33, 1);
      expect(parseFloat(wbs3Assignment.weight)).toBeCloseTo(83.33, 1);

      // 가중치 합계 확인
      const totalWeight =
        parseFloat(wbs1Assignment.weight) +
        parseFloat(wbs2Assignment.weight) +
        parseFloat(wbs3Assignment.weight);
      expect(totalWeight).toBeCloseTo(100, 2);
    });

    it('5개 이상의 WBS에 대한 가중치 계산이 정확해야 한다', async () => {
      // Given: 직원에게 5개의 WBS 할당
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbsList = testData.wbsItems.slice(0, 5);
      const importances = [3, 2, 4, 1, 5]; // 총 15

      for (let i = 0; i < wbsList.length; i++) {
        await createWbsAssignment(employee.id, periodId, wbsList[i].id);
        await createWbsEvaluationCriteria(
          wbsList[i].id,
          `기준${i + 1}`,
          importances[i],
        );
      }

      // When & Then
      const assignments = await getWbsAssignments(employee.id, periodId);
      expect(assignments).toHaveLength(5);

      const expectedWeights = [20, 13.33, 26.67, 6.67, 33.33]; // 3/15, 2/15, 4/15, 1/15, 5/15
      let totalWeight = 0;

      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments.find(
          (a) => a.wbsItemId === wbsList[i].id,
        );
        const weight = parseFloat(assignment.weight);
        expect(weight).toBeCloseTo(expectedWeights[i], 1);
        totalWeight += weight;
      }

      expect(totalWeight).toBeCloseTo(100, 2);
    });
  });

  // ==================== 가중치 계산 성능 테스트 ====================

  describe('가중치 계산 성능 테스트', () => {
    it('대량의 WBS 할당에 대해서도 가중치 계산이 정상적으로 동작해야 한다', async () => {
      // Given: 직원에게 10개의 WBS 할당 (테스트 데이터에 WBS가 충분히 있다고 가정)
      const employee = testData.employees[0];
      const periodId = testData.evaluationPeriod.id;
      const wbsCount = Math.min(10, testData.wbsItems.length);
      const wbsList = testData.wbsItems.slice(0, wbsCount);

      // When: WBS 할당 및 평가기준 생성
      let totalImportance = 0;
      for (let i = 0; i < wbsList.length; i++) {
        const importance = (i % 10) + 1; // 1~10 순환
        totalImportance += importance;
        await createWbsAssignment(employee.id, periodId, wbsList[i].id);
        await createWbsEvaluationCriteria(
          wbsList[i].id,
          `기준${i + 1}`,
          importance,
        );
      }

      // Then: 가중치 합계 확인
      const assignments = await getWbsAssignments(employee.id, periodId);
      expect(assignments).toHaveLength(wbsCount);

      const totalWeight = assignments.reduce(
        (sum, a) => sum + parseFloat(a.weight),
        0,
      );
      expect(totalWeight).toBeCloseTo(100, 2);

      // 각 가중치가 올바른 비율인지 확인
      for (let i = 0; i < wbsList.length; i++) {
        const importance = (i % 10) + 1;
        const expectedWeight = (importance / totalImportance) * 100;
        const assignment = assignments.find(
          (a) => a.wbsItemId === wbsList[i].id,
        );
        expect(parseFloat(assignment.weight)).toBeCloseTo(expectedWeight, 1);
      }
    });
  });
});
