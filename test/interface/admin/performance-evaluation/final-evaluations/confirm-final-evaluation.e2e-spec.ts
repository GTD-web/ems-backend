import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/final-evaluations/:id/confirm', () => {
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

    // 테스트용 인증 사용자 확인 및 생성
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const existingUser = await dataSource.manager.query(
      `SELECT id FROM employee WHERE id = $1`,
      [testUserId],
    );

    if (existingUser.length === 0) {
      const departments = await dataSource.manager.query(
        `SELECT id FROM department LIMIT 1`,
      );
      await dataSource.manager.query(
        `INSERT INTO employee (id, "employeeNumber", name, email, "departmentId", status, "externalId", "externalCreatedAt", "externalUpdatedAt", version, "createdAt", "updatedAt")
         VALUES ($1, 'TEST-USER', '테스트 관리자', 'test@example.com', $2, '재직중', 'test-user-001', NOW(), NOW(), 1, NOW(), NOW())`,
        [testUserId, departments[0]?.id || employees[0].departmentId],
      );
    }

    testData = {
      employees,
      evaluationPeriods: periods,
    };

    console.log('최종평가 확정 테스트 데이터 생성 완료:', {
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
    const response = await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
      )
      .send(data)
      .expect(201);

    return response.body.id;
  }

  function confirmFinalEvaluation(evaluationId: string, confirmedBy: string) {
    return testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/${evaluationId}/confirm`,
      )
      .send({ confirmedBy });
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

  describe('최종평가 확정 성공 시나리오', () => {
    it('기본 최종평가를 확정할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When (confirmedBy는 @CurrentUser()로 자동 설정됨)
      const response = await confirmFinalEvaluation(
        evaluationId,
        testUserId,
      ).expect(200);

      // Then
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('확정');

      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.isConfirmed).toBe(true);
      expect(dbRecord.confirmedBy).toBe(testUserId);
      expect(dbRecord.confirmedAt).toBeDefined();
    });

    it('confirmedBy를 포함하여 확정할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When (confirmedBy는 @CurrentUser()로 자동 설정됨)
      await confirmFinalEvaluation(evaluationId, testUserId).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.confirmedBy).toBe(testUserId);
    });

    it('확정 후 isConfirmed가 true로 변경되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.U,
      });

      const beforeConfirm = await getFinalEvaluationFromDb(evaluationId);
      expect(beforeConfirm.isConfirmed).toBe(false);

      // When
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // Then
      const afterConfirm = await getFinalEvaluationFromDb(evaluationId);
      expect(afterConfirm.isConfirmed).toBe(true);
    });

    it('확정 후 confirmedAt이 설정되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      const beforeConfirm = await getFinalEvaluationFromDb(evaluationId);
      expect(beforeConfirm.confirmedAt).toBeNull();

      // When
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // Then
      const afterConfirm = await getFinalEvaluationFromDb(evaluationId);
      expect(afterConfirm.confirmedAt).toBeDefined();
      expect(new Date(afterConfirm.confirmedAt).getTime()).toBeGreaterThan(0);
    });

    it('확정 후 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      const beforeConfirm = await getFinalEvaluationFromDb(evaluationId);
      const beforeUpdatedAt = new Date(beforeConfirm.updatedAt);

      // 약간의 시간 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // Then
      const afterConfirm = await getFinalEvaluationFromDb(evaluationId);
      const afterUpdatedAt = new Date(afterConfirm.updatedAt);
      expect(afterUpdatedAt.getTime()).toBeGreaterThan(
        beforeUpdatedAt.getTime(),
      );
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('최종평가 확정 실패 시나리오', () => {
    it('잘못된 형식의 평가 ID로 확정 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidId = 'invalid-uuid';
      const confirmedBy = uuidv4();

      // When & Then
      await confirmFinalEvaluation(invalidId, confirmedBy).expect(400);
    });

    it('존재하지 않는 평가 ID로 확정 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = uuidv4();
      const confirmedBy = uuidv4();

      // When & Then
      await confirmFinalEvaluation(nonExistentId, confirmedBy).expect(404);
    });

    // confirmedBy는 @CurrentUser() 데코레이터를 통해 자동 설정되므로,
    // 이 필드의 누락 검증 테스트는 필요하지 않음
    // it('confirmedBy 누락 시 400 에러가 발생해야 한다', async () => {
    //   // Given
    //   const employee = getRandomEmployee();
    //   const period = getRandomEvaluationPeriod();

    //   const evaluationId = await createFinalEvaluation(employee.id, period.id, {
    //     evaluationGrade: 'A',
    //     jobGrade: JobGrade.T2,
    //     jobDetailedGrade: JobDetailedGrade.N,
    //   });

    //   // When & Then
    //   await testSuite.request()
    //     .post(
    //       `/admin/performance-evaluation/final-evaluations/${evaluationId}/confirm`,
    //     )
    //     .send({})
    //     .expect(400);
    // });

    it('이미 확정된 평가를 다시 확정 시 409 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // 첫 번째 확정
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // When & Then - 두 번째 확정 시도
      await confirmFinalEvaluation(evaluationId, uuidv4()).expect(409);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('최종평가 확정 응답 구조 검증', () => {
    it('응답에 message 필드가 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await confirmFinalEvaluation(
        evaluationId,
        confirmedBy,
      ).expect(200);

      // Then
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('성공 메시지가 적절해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await confirmFinalEvaluation(
        evaluationId,
        confirmedBy,
      ).expect(200);

      // Then
      expect(response.body.message).toContain('확정');
      expect(response.body.message).toContain('성공');
    });
  });

  // ==================== 데이터 정합성 검증 ====================

  describe('최종평가 확정 데이터 정합성', () => {
    it('확정된 데이터가 DB의 실제 데이터와 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When (confirmedBy는 @CurrentUser()로 자동 설정됨)
      await confirmFinalEvaluation(evaluationId, testUserId).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.isConfirmed).toBe(true);
      expect(dbRecord.confirmedBy).toBe(testUserId);
      expect(dbRecord.confirmedAt).toBeDefined();
    });

    it('확정 후에도 평가 등급 데이터는 유지되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();
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

      // When
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(dbRecord.evaluationGrade).toBe(evaluationData.evaluationGrade);
      expect(dbRecord.jobGrade).toBe(evaluationData.jobGrade);
      expect(dbRecord.jobDetailedGrade).toBe(evaluationData.jobDetailedGrade);
      expect(dbRecord.finalComments).toBe(evaluationData.finalComments);
    });

    it('확정 후 createdAt은 변경되지 않아야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      const beforeConfirm = await getFinalEvaluationFromDb(evaluationId);
      const beforeCreatedAt = new Date(beforeConfirm.createdAt);

      // When
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // Then
      const afterConfirm = await getFinalEvaluationFromDb(evaluationId);
      const afterCreatedAt = new Date(afterConfirm.createdAt);

      // createdAt은 밀리초 단위의 차이를 허용 (1초 이내)
      const timeDiff = Math.abs(
        afterCreatedAt.getTime() - beforeCreatedAt.getTime(),
      );
      expect(timeDiff).toBeLessThan(1000);
    });

    it('확정 시 version이 증가해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      const beforeConfirm = await getFinalEvaluationFromDb(evaluationId);
      const beforeVersion = beforeConfirm.version;

      // When
      await confirmFinalEvaluation(evaluationId, confirmedBy).expect(200);

      // Then
      const afterConfirm = await getFinalEvaluationFromDb(evaluationId);
      expect(afterConfirm.version).toBe(beforeVersion + 1);
    });
  });
});
