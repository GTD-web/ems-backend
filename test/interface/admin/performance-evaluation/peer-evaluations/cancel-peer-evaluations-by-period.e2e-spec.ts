import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { v4 as uuidv4 } from 'uuid';

describe('DELETE /admin/performance-evaluation/peer-evaluations/evaluatee/:evaluateeId/period/:periodId/cancel-all', () => {
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

    console.log('동료평가 일괄 취소 테스트 데이터 생성 완료:', {
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
   * 일괄 취소 헬퍼
   */
  function cancelPeerEvaluationsByPeriod(
    evaluateeId: string,
    periodId: string,
  ) {
    return request(app.getHttpServer()).delete(
      `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluateeId}/period/${periodId}/cancel-all`,
    );
  }

  /**
   * DB에서 동료평가 조회 헬퍼
   */
  async function getPeerEvaluationsFromDb(
    evaluateeId: string,
    periodId: string,
  ) {
    return await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE "evaluateeId" = $1 AND "periodId" = $2`,
      [evaluateeId, periodId],
    );
  }

  // ==================== 성공 시나리오 ====================

  describe('동료평가 일괄 취소 성공 시나리오', () => {
    it('기본 일괄 취소를 수행할 수 있어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator1 = testData.employees[1];
      const evaluator2 = testData.employees[2];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator1.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });
      await createPeerEvaluation({
        evaluatorId: evaluator2.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.cancelledCount).toBe(2);
      expect(response.body.message).toBeDefined();
    });

    it('여러 평가자의 평가를 한 번에 취소할 수 있어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluators = [
        testData.employees[1],
        testData.employees[2],
        testData.employees[3],
      ];
      const period = getRandomEvaluationPeriod();

      for (const evaluator of evaluators) {
        await createPeerEvaluation({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
        });
      }

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.cancelledCount).toBe(evaluators.length);
    });

    it('특정 평가기간의 평가만 취소되어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period1 = testData.periods[0];
      const period2 = testData.periods[1];

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period1.id,
      });
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period2.id,
      });

      // When - period1만 취소
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period1.id,
      ).expect(200);

      // Then - period1만 취소되고 period2는 유지
      expect(response.body.cancelledCount).toBe(1);

      const period2Evaluations = await getPeerEvaluationsFromDb(
        evaluatee.id,
        period2.id,
      );
      expect(period2Evaluations.length).toBe(1);
      expect(period2Evaluations[0].isActive).toBe(true);
    });

    it('취소할 평가가 없으면 0을 반환해야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // When - 평가가 없는 상태에서 취소 시도
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.cancelledCount).toBe(0);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('동료평가 일괄 취소 실패 시나리오', () => {
    it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidEvaluateeId = 'invalid-uuid';
      const period = getRandomEvaluationPeriod();

      // When & Then
      await request(app.getHttpServer())
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${invalidEvaluateeId}/period/${period.id}/cancel-all`,
        )
        .expect(400);
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const invalidPeriodId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluatee.id}/period/${invalidPeriodId}/cancel-all`,
        )
        .expect(400);
    });

    it('존재하지 않는 evaluateeId로 요청 시 200을 반환하고 cancelledCount는 0이어야 한다', async () => {
      // Given
      const nonExistentEvaluateeId = uuidv4();
      const period = getRandomEvaluationPeriod();

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        nonExistentEvaluateeId,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.cancelledCount).toBe(0);
    });

    it('존재하지 않는 periodId로 요청 시 200을 반환하고 cancelledCount는 0이어야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const nonExistentPeriodId = uuidv4();

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        nonExistentPeriodId,
      ).expect(200);

      // Then
      expect(response.body.cancelledCount).toBe(0);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('일괄 취소 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('cancelledCount');
    });

    it('cancelledCount가 숫자 형식이어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then
      expect(typeof response.body.cancelledCount).toBe('number');
      expect(response.body.cancelledCount).toBeGreaterThanOrEqual(0);
    });

    it('message가 문자열 형식이어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('일괄 취소 데이터 무결성 시나리오', () => {
    it('취소된 평가의 상태가 변경되어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      await cancelPeerEvaluationsByPeriod(evaluatee.id, period.id).expect(200);

      // Then
      const dbRecords = await getPeerEvaluationsFromDb(evaluatee.id, period.id);
      expect(dbRecords.length).toBeGreaterThan(0);
      dbRecords.forEach((record: any) => {
        expect(record.status).toBe('cancelled');
      });
    });

    it('취소된 평가의 status가 변경되어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When
      await cancelPeerEvaluationsByPeriod(evaluatee.id, period.id).expect(200);

      // Then
      const dbRecords = await getPeerEvaluationsFromDb(evaluatee.id, period.id);
      dbRecords.forEach((record: any) => {
        expect(record.status).toBe('cancelled');
      });
    });

    it('취소된 평가의 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      const beforeRecords = await dataSource.query(
        `SELECT "updatedAt" FROM peer_evaluation WHERE id = $1`,
        [evaluationId],
      );
      const originalUpdatedAt = new Date(beforeRecords[0].updatedAt);

      // 약간의 시간 대기
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      await cancelPeerEvaluationsByPeriod(evaluatee.id, period.id).expect(200);

      // Then
      const afterRecords = await dataSource.query(
        `SELECT "updatedAt" FROM peer_evaluation WHERE id = $1`,
        [evaluationId],
      );
      const newUpdatedAt = new Date(afterRecords[0].updatedAt);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it('다른 피평가자의 평가는 영향받지 않아야 한다', async () => {
      // Given
      const evaluatee1 = testData.employees[0];
      const evaluatee2 = testData.employees[1];
      const evaluator = testData.employees[2];
      const period = getRandomEvaluationPeriod();

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee1.id,
        periodId: period.id,
      });
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee2.id,
        periodId: period.id,
      });

      // When - evaluatee1만 취소
      await cancelPeerEvaluationsByPeriod(evaluatee1.id, period.id).expect(200);

      // Then - evaluatee2는 유지
      const evaluatee2Records = await getPeerEvaluationsFromDb(
        evaluatee2.id,
        period.id,
      );
      expect(evaluatee2Records.length).toBe(1);
      expect(evaluatee2Records[0].isActive).toBe(true);
      expect(evaluatee2Records[0].status).toBe('pending');
    });

    it('완료된 평가도 취소할 수 있어야 한다', async () => {
      // Given
      const evaluatee = testData.employees[0];
      const evaluator = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // 평가를 완료 상태로 변경
      await dataSource.query(
        `UPDATE peer_evaluation SET "isCompleted" = true, status = 'completed' WHERE id = $1`,
        [evaluationId],
      );

      // When
      const response = await cancelPeerEvaluationsByPeriod(
        evaluatee.id,
        period.id,
      ).expect(200);

      // Then - 완료된 평가도 취소됨
      expect(response.body.cancelledCount).toBe(1);

      const dbRecords = await dataSource.query(
        `SELECT * FROM peer_evaluation WHERE id = $1`,
        [evaluationId],
      );
      expect(dbRecords[0].status).toBe('cancelled');
    });
  });
});
