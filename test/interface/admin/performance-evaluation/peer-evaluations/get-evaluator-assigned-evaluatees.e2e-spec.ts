import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

describe('GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId/assigned-evaluatees', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;
  let testContextService: TestContextService;
  let testData: any;

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

    // 직원 및 평가기간 데이터 생성
    const employees =
      await testContextService.직원_데이터를_확인하고_준비한다(5);
    const periods = await testContextService.테스트용_평가기간을_생성한다();

    testData = {
      employees,
      evaluationPeriods: periods,
    };

    console.log('할당된 피평가자 목록 조회 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.evaluationPeriods.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    await testSuite.cleanupAfterTest();
  });

  // ==================== Helper Functions ====================

  function getRandomEvaluationPeriod() {
    const index = Math.floor(Math.random() * testData.evaluationPeriods.length);
    return testData.evaluationPeriods[index];
  }

  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    status?: string;
    isCompleted?: boolean;
  }): Promise<string> {
    const result = await dataSource.query(
      `
      INSERT INTO peer_evaluation ("evaluatorId", "evaluateeId", "periodId", "evaluationDate", "status", "isCompleted", "mappedDate", "mappedBy", "isActive", "version", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), $4, $5, NOW(), $1, true, 1, NOW(), NOW())
      RETURNING id
    `,
      [
        data.evaluatorId,
        data.evaluateeId,
        data.periodId,
        data.status || 'pending',
        data.isCompleted || false,
      ],
    );
    return result[0].id;
  }

  function getAssignedEvaluatees(
    evaluatorId: string,
    query?: {
      periodId?: string;
      includeCompleted?: string;
    },
  ) {
    let url = `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`;
    const params: string[] = [];

    if (query) {
      if (query.periodId) params.push(`periodId=${query.periodId}`);
      if (query.includeCompleted !== undefined)
        params.push(`includeCompleted=${query.includeCompleted}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return request(app.getHttpServer()).get(url);
  }

  // ==================== 성공 시나리오 ====================

  describe('할당된 피평가자 목록 조회 성공 시나리오', () => {
    it('기본 목록을 조회할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('여러 명의 피평가자를 조회할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // 3명의 피평가자 할당
      for (let i = 1; i <= 3; i++) {
        await createPeerEvaluation({
          evaluatorId: evaluator.id,
          evaluateeId: testData.employees[i].id,
          periodId: period.id,
        });
      }

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });

    it('periodId로 필터링할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period1 = testData.evaluationPeriods[0];
      const period2 = testData.evaluationPeriods[1];

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period1.id,
      });

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: testData.employees[2].id,
        periodId: period2.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id, {
        periodId: period1.id,
      }).expect(200);

      // Then
      expect(response.body.length).toBeGreaterThan(0);
      response.body.forEach((item: any) => {
        expect(item.periodId).toBe(period1.id);
      });
    });

    it('완료된 평가를 제외할 수 있어야 한다 (기본 동작)', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // 미완료 평가
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: testData.employees[1].id,
        periodId: period.id,
        isCompleted: false,
      });

      // 완료된 평가
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: testData.employees[2].id,
        periodId: period.id,
        isCompleted: true,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      // 기본적으로 완료되지 않은 평가만 조회됨
      const allIncomplete = response.body.every(
        (item: any) => !item.isCompleted,
      );
      expect(allIncomplete).toBe(true);
    });

    it('완료된 평가를 포함할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // 미완료 평가
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: testData.employees[1].id,
        periodId: period.id,
        isCompleted: false,
      });

      // 완료된 평가
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: testData.employees[2].id,
        periodId: period.id,
        isCompleted: true,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id, {
        includeCompleted: 'true',
      }).expect(200);

      // Then
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      const hasCompleted = response.body.some((item: any) => item.isCompleted);
      expect(hasCompleted).toBe(true);
    });

    it('평가가 없는 평가자의 경우 빈 배열을 반환해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      expect(response.body).toEqual([]);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('할당된 피평가자 목록 조회 실패 시나리오', () => {
    it('잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      await getAssignedEvaluatees(invalidId).expect(400);
    });

    it('잘못된 형식의 periodId로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const invalidPeriodId = 'invalid-uuid';

      // When & Then
      await getAssignedEvaluatees(evaluator.id, {
        periodId: invalidPeriodId,
      }).expect(400);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('할당된 피평가자 목록 조회 응답 구조 검증', () => {
    it('응답이 배열 형태여야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('피평가자 항목에 필수 필드가 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      const item = response.body[0];
      expect(item).toHaveProperty('evaluationId');
      expect(item).toHaveProperty('periodId');
      expect(item).toHaveProperty('evaluatee');
      expect(item).toHaveProperty('evaluateeDepartment');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('isCompleted');
      expect(item).toHaveProperty('requestDeadline');
    });

    it('피평가자 정보에 직원 필드가 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      const evaluateeInfo = response.body[0].evaluatee;
      expect(evaluateeInfo).toHaveProperty('id');
      expect(evaluateeInfo).toHaveProperty('name');
      expect(evaluateeInfo).toHaveProperty('employeeNumber');
      expect(evaluateeInfo).toHaveProperty('email');
    });

    it('피평가자 부서 정보가 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      const departmentInfo = response.body[0].evaluateeDepartment;
      if (departmentInfo) {
        expect(departmentInfo).toHaveProperty('id');
        expect(departmentInfo).toHaveProperty('name');
        expect(departmentInfo).toHaveProperty('code');
      }
    });

    it('UUID 필드가 유효한 UUID 형식이어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getAssignedEvaluatees(evaluator.id).expect(200);

      // Then
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const item = response.body[0];
      expect(item.evaluationId).toMatch(uuidRegex);
      expect(item.periodId).toMatch(uuidRegex);
      expect(item.evaluatee.id).toMatch(uuidRegex);
    });
  });
});
