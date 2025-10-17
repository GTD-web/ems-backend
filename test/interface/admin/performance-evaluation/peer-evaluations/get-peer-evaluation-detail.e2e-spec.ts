import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { v4 as uuidv4 } from 'uuid';

describe('GET /admin/performance-evaluation/peer-evaluations/:id', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
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

    // 직원 및 평가기간 데이터 생성
    const employees =
      await testContextService.직원_데이터를_확인하고_준비한다(5);
    const periods = await testContextService.테스트용_평가기간을_생성한다();

    testData = {
      employees,
      periods,
    };

    console.log('동료평가 상세 조회 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.periods.length,
    });
  });

  afterEach(async () => {
    await testContextService.테스트_데이터를_정리한다();
    jest.restoreAllMocks();
  });

  // ==================== 헬퍼 함수 ====================

  function getRandomEmployee(): EmployeeDto {
    return testData.employees[
      Math.floor(Math.random() * testData.employees.length)
    ];
  }

  function getRandomEvaluationPeriod(): EvaluationPeriodDto {
    return testData.periods[
      Math.floor(Math.random() * testData.periods.length)
    ];
  }

  /**
   * 동료평가 요청 생성 헬퍼
   */
  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
  }): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data)
      .expect(201);

    return response.body.id;
  }

  /**
   * 동료평가 상세 조회 헬퍼
   */
  function getPeerEvaluationDetail(evaluationId: string) {
    return request(app.getHttpServer()).get(
      `/admin/performance-evaluation/peer-evaluations/${evaluationId}`,
    );
  }

  // ==================== 성공 시나리오 ====================

  describe('동료평가 상세 조회 성공 시나리오', () => {
    it('기본 동료평가 상세 정보를 조회할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(evaluationId);
    });

    it('생성된 동료평가의 모든 필드가 조회되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      expect(response.body.id).toBe(evaluationId);
      expect(response.body.evaluator?.id).toBe(evaluator.id);
      expect(response.body.evaluatee?.id).toBe(evaluatee.id);
      expect(response.body.period?.id).toBe(period.id);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('evaluationDate');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('questions');
    });

    it('평가자와 피평가자의 정보가 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      expect(response.body.evaluator).toBeDefined();
      expect(response.body.evaluator.id).toBe(evaluator.id);
      expect(response.body.evaluator.name).toBe(evaluator.name);

      expect(response.body.evaluatee).toBeDefined();
      expect(response.body.evaluatee.id).toBe(evaluatee.id);
      expect(response.body.evaluatee.name).toBe(evaluatee.name);
    });

    it('부서 정보가 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      // 평가자 부서
      if (response.body.evaluatorDepartment) {
        expect(response.body.evaluatorDepartment).toHaveProperty('id');
        expect(response.body.evaluatorDepartment).toHaveProperty('name');
        expect(response.body.evaluatorDepartment).toHaveProperty('code');
      }

      // 피평가자 부서
      if (response.body.evaluateeDepartment) {
        expect(response.body.evaluateeDepartment).toHaveProperty('id');
        expect(response.body.evaluateeDepartment).toHaveProperty('name');
        expect(response.body.evaluateeDepartment).toHaveProperty('code');
      }
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('동료평가 상세 조회 실패 시나리오', () => {
    it('잘못된 형식의 평가 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidEvaluationId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .get(
          `/admin/performance-evaluation/peer-evaluations/${invalidEvaluationId}`,
        )
        .expect(400);
    });

    it('존재하지 않는 평가 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentEvaluationId = uuidv4();

      // When & Then
      await getPeerEvaluationDetail(nonExistentEvaluationId).expect(404);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('동료평가 상세 조회 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then - 필수 필드 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('evaluationDate');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('evaluator');
      expect(response.body).toHaveProperty('evaluatee');
      expect(response.body).toHaveProperty('evaluatorDepartment');
      expect(response.body).toHaveProperty('evaluateeDepartment');
      expect(response.body).toHaveProperty('questions');
    });

    it('UUID 필드가 유효한 UUID 형식이어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(response.body.id).toMatch(uuidRegex);
      expect(response.body.evaluator?.id).toMatch(uuidRegex);
      expect(response.body.evaluatee?.id).toMatch(uuidRegex);
      expect(response.body.period?.id).toMatch(uuidRegex);
    });

    it('날짜 필드가 유효한 날짜 형식이어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      expect(new Date(response.body.evaluationDate)).toBeInstanceOf(Date);
      expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
      expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
    });
  });

  // ==================== 데이터 정합성 ====================

  describe('동료평가 상세 조회 데이터 정합성', () => {
    it('조회된 데이터가 DB의 실제 데이터와 일치해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then - DB에서 직접 조회하여 비교
      const dbRecord = await dataSource.query(
        `SELECT * FROM peer_evaluation WHERE id = $1`,
        [evaluationId],
      );

      expect(dbRecord.length).toBe(1);
      expect(response.body.id).toBe(dbRecord[0].id);
      expect(response.body.evaluator?.id).toBe(dbRecord[0].evaluatorId);
      expect(response.body.evaluatee?.id).toBe(dbRecord[0].evaluateeId);
      expect(response.body.period?.id).toBe(dbRecord[0].periodId);
    });

    it('초기 생성 시 isCompleted가 false여야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      expect(response.body.isCompleted).toBe(false);
    });

    it('초기 생성 시 status가 pending이어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await getPeerEvaluationDetail(evaluationId).expect(200);

      // Then
      expect(response.body.status).toBe('pending');
    });
  });
});
