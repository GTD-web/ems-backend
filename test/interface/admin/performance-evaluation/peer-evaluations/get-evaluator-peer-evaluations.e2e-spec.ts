import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

describe('GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId', () => {
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

    console.log('동료평가 목록 조회 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.evaluationPeriods.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    await testSuite.cleanupAfterTest();
  });

  // ==================== Helper Functions ====================

  function getRandomEmployee() {
    const index = Math.floor(Math.random() * testData.employees.length);
    return testData.employees[index];
  }

  function getRandomEvaluationPeriod() {
    const index = Math.floor(Math.random() * testData.evaluationPeriods.length);
    return testData.evaluationPeriods[index];
  }

  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    status?: string;
  }): Promise<string> {
    const result = await dataSource.query(
      `
      INSERT INTO peer_evaluation ("evaluatorId", "evaluateeId", "periodId", "evaluationDate", "status", "isCompleted", "mappedDate", "mappedBy", "isActive", "version", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, NOW(), $4, false, NOW(), $1, true, 1, NOW(), NOW())
      RETURNING id
    `,
      [
        data.evaluatorId,
        data.evaluateeId,
        data.periodId,
        data.status || 'pending',
      ],
    );
    return result[0].id;
  }

  function getPeerEvaluations(
    evaluatorId: string,
    query?: {
      evaluateeId?: string;
      periodId?: string;
      projectId?: string;
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
    let url = `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`;
    const params: string[] = [];

    if (query) {
      if (query.evaluateeId) params.push(`evaluateeId=${query.evaluateeId}`);
      if (query.periodId) params.push(`periodId=${query.periodId}`);
      if (query.projectId) params.push(`projectId=${query.projectId}`);
      if (query.status) params.push(`status=${query.status}`);
      if (query.page) params.push(`page=${query.page}`);
      if (query.limit) params.push(`limit=${query.limit}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return testSuite.request().get(url);
  }

  // ==================== 성공 시나리오 ====================

  describe('평가자의 동료평가 목록 조회 성공 시나리오', () => {
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
      const response = await getPeerEvaluations(evaluator.id).expect(200);

      // Then
      expect(response.body).toHaveProperty('evaluations');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
    });

    it('여러 개의 평가 목록을 조회할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      for (let i = 1; i <= 3; i++) {
        await createPeerEvaluation({
          evaluatorId: evaluator.id,
          evaluateeId: testData.employees[i].id,
          periodId: period.id,
        });
      }

      // When
      const response = await getPeerEvaluations(evaluator.id).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(3);
    });

    it('evaluateeId로 필터링할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: testData.employees[2].id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluations(evaluator.id, {
        evaluateeId: evaluatee.id,
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThan(0);
      response.body.evaluations.forEach((item: any) => {
        expect(item.evaluateeId).toBe(evaluatee.id);
      });
    });

    it('periodId로 필터링할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = testData.evaluationPeriods[0];

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluations(evaluator.id, {
        periodId: period.id,
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThan(0);
      response.body.evaluations.forEach((item: any) => {
        expect(item.periodId).toBe(period.id);
      });
    });

    it('페이지네이션이 작동해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // 5개 생성
      for (let i = 1; i <= 5; i++) {
        await createPeerEvaluation({
          evaluatorId: evaluator.id,
          evaluateeId: testData.employees[i % testData.employees.length].id,
          periodId: period.id,
        });
      }

      // When
      const response = await getPeerEvaluations(evaluator.id, {
        page: 1,
        limit: 2,
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
    });

    it('평가가 없는 평가자의 경우 빈 배열을 반환해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();

      // When
      const response = await getPeerEvaluations(evaluator.id).expect(200);

      // Then
      expect(response.body.evaluations).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('평가자의 동료평가 목록 조회 실패 시나리오', () => {
    it('잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';

      // When & Then
      await getPeerEvaluations(invalidId).expect(400);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('평가자의 동료평가 목록 조회 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
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
      const response = await getPeerEvaluations(evaluator.id).expect(200);

      // Then
      expect(response.body).toHaveProperty('evaluations');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
    });

    it('평가 항목에 필수 필드가 포함되어야 한다', async () => {
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
      const response = await getPeerEvaluations(evaluator.id).expect(200);

      // Then
      const item = response.body.evaluations[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('evaluatorId');
      expect(item).toHaveProperty('evaluateeId');
      expect(item).toHaveProperty('periodId');
      expect(item).toHaveProperty('evaluationDate');
      expect(item).toHaveProperty('status');
      expect(item).toHaveProperty('isCompleted');
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
      const response = await getPeerEvaluations(evaluator.id).expect(200);

      // Then
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const item = response.body.evaluations[0];
      expect(item.id).toMatch(uuidRegex);
      expect(item.evaluatorId).toMatch(uuidRegex);
      expect(item.evaluateeId).toMatch(uuidRegex);
      expect(item.periodId).toMatch(uuidRegex);
    });
  });
});
