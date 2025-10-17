import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/final-evaluations/:id/cancel-confirmation', () => {
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

    console.log('최종평가 확정 취소 테스트 데이터 생성 완료:', {
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

  async function createFinalEvaluation(
    employeeId: string,
    periodId: string,
    data: {
      evaluationGrade: string;
      jobGrade: JobGrade;
      jobDetailedGrade: JobDetailedGrade;
      finalComments?: string;
    },
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(
        `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
      )
      .send(data)
      .expect(201);

    return response.body.id;
  }

  async function confirmFinalEvaluation(
    evaluationId: string,
    confirmedBy: string,
  ) {
    return request(app.getHttpServer())
      .post(
        `/admin/performance-evaluation/final-evaluations/${evaluationId}/confirm`,
      )
      .send({ confirmedBy })
      .expect(200);
  }

  function cancelConfirmation(evaluationId: string, updatedBy: string) {
    return request(app.getHttpServer())
      .post(
        `/admin/performance-evaluation/final-evaluations/${evaluationId}/cancel-confirmation`,
      )
      .send({ updatedBy });
  }

  async function getFinalEvaluationFromDb(evaluationId: string) {
    const result = await dataSource.query(
      `
      SELECT * FROM final_evaluations
      WHERE id = $1 AND "deletedAt" IS NULL
    `,
      [evaluationId],
    );
    return result[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('최종평가 확정 취소 성공 시나리오', () => {
    it('확정된 최종평가의 확정을 취소할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When
      const response = await cancelConfirmation(evaluationId, updatedBy).expect(
        200,
      );

      // Then
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('취소');

      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.isConfirmed).toBe(false);
      expect(dbRecord.confirmedBy).toBeNull();
      expect(dbRecord.confirmedAt).toBeNull();
    });

    it('updatedBy를 포함하여 확정 취소할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.updatedBy).toBe(updatedBy);
    });

    it('확정 취소 후 isConfirmed가 false로 변경되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.U,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      const beforeCancel = await getFinalEvaluationFromDb(evaluationId);
      expect(beforeCancel.isConfirmed).toBe(true);

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const afterCancel = await getFinalEvaluationFromDb(evaluationId);
      expect(afterCancel.isConfirmed).toBe(false);
    });

    it('확정 취소 후 confirmedAt과 confirmedBy가 null로 변경되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      const beforeCancel = await getFinalEvaluationFromDb(evaluationId);
      expect(beforeCancel.confirmedAt).not.toBeNull();
      expect(beforeCancel.confirmedBy).not.toBeNull();

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const afterCancel = await getFinalEvaluationFromDb(evaluationId);
      expect(afterCancel.confirmedAt).toBeNull();
      expect(afterCancel.confirmedBy).toBeNull();
    });

    it('확정 취소 후 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      const beforeCancel = await getFinalEvaluationFromDb(evaluationId);
      const beforeUpdatedAt = new Date(beforeCancel.updatedAt);

      // 약간의 시간 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const afterCancel = await getFinalEvaluationFromDb(evaluationId);
      const afterUpdatedAt = new Date(afterCancel.updatedAt);
      expect(afterUpdatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('최종평가 확정 취소 실패 시나리오', () => {
    it('잘못된 형식의 평가 ID로 확정 취소 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';
      const updatedBy = uuidv4();

      // When & Then
      await cancelConfirmation(invalidId, updatedBy).expect(400);
    });

    it('존재하지 않는 평가 ID로 확정 취소 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = uuidv4();
      const updatedBy = uuidv4();

      // When & Then
      await cancelConfirmation(nonExistentId, updatedBy).expect(404);
    });

    it('updatedBy 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When & Then
      await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/final-evaluations/${evaluationId}/cancel-confirmation`,
        )
        .send({})
        .expect(400);
    });

    it('확정되지 않은 평가의 확정 취소 시 422 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // 확정하지 않은 상태

      // When & Then
      await cancelConfirmation(evaluationId, updatedBy).expect(422);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('최종평가 확정 취소 응답 구조 검증', () => {
    it('응답에 message 필드가 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When
      const response = await cancelConfirmation(evaluationId, updatedBy).expect(
        200,
      );

      // Then
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('성공 메시지가 적절해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When
      const response = await cancelConfirmation(evaluationId, updatedBy).expect(
        200,
      );

      // Then
      expect(response.body.message).toContain('취소');
      expect(response.body.message).toContain('성공');
    });
  });

  // ==================== 데이터 정합성 검증 ====================

  describe('최종평가 확정 취소 데이터 정합성', () => {
    it('취소된 데이터가 DB의 실제 데이터와 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.isConfirmed).toBe(false);
      expect(dbRecord.confirmedBy).toBeNull();
      expect(dbRecord.confirmedAt).toBeNull();
      expect(dbRecord.updatedBy).toBe(updatedBy);
    });

    it('확정 취소 후에도 평가 등급 데이터는 유지되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();
      const evaluationData = {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
        finalComments: '매우 우수한 성과입니다.',
      };

      const evaluationId = await createFinalEvaluation(
        employee.id,
        period.id,
        evaluationData,
      );

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.evaluationGrade).toBe(evaluationData.evaluationGrade);
      expect(dbRecord.jobGrade).toBe(evaluationData.jobGrade);
      expect(dbRecord.jobDetailedGrade).toBe(evaluationData.jobDetailedGrade);
      expect(dbRecord.finalComments).toBe(evaluationData.finalComments);
    });

    it('확정 취소 후 createdAt은 변경되지 않아야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      const beforeCancel = await getFinalEvaluationFromDb(evaluationId);
      const beforeCreatedAt = new Date(beforeCancel.createdAt);

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const afterCancel = await getFinalEvaluationFromDb(evaluationId);
      const afterCreatedAt = new Date(afterCancel.createdAt);

      // createdAt은 밀리초 단위의 차이를 허용 (1초 이내)
      const timeDiff = Math.abs(
        afterCreatedAt.getTime() - beforeCreatedAt.getTime(),
      );
      expect(timeDiff).toBeLessThan(1000);
    });

    it('확정 취소 시 version이 증가해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);

      const beforeCancel = await getFinalEvaluationFromDb(evaluationId);
      const beforeVersion = beforeCancel.version;

      // When
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // Then
      const afterCancel = await getFinalEvaluationFromDb(evaluationId);
      expect(afterCancel.version).toBe(beforeVersion + 1);
    });

    it('확정 취소 후 다시 수정이 가능해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
      const updatedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await confirmFinalEvaluation(evaluationId, confirmedBy);
      await cancelConfirmation(evaluationId, updatedBy).expect(200);

      // When - 취소 후 다시 수정 시도
      await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${employee.id}/period/${period.id}`,
        )
        .send({
          evaluationGrade: 'S',
          jobGrade: JobGrade.T3,
          jobDetailedGrade: JobDetailedGrade.A,
          updatedBy,
        })
        .expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.evaluationGrade).toBe('S');
      expect(dbRecord.jobGrade).toBe(JobGrade.T3);
      expect(dbRecord.jobDetailedGrade).toBe(JobDetailedGrade.A);
      expect(dbRecord.isConfirmed).toBe(false);
    });
  });
});
