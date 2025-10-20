import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId', () => {
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

    console.log('최종평가 저장 테스트 데이터 생성 완료:', {
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

  function upsertFinalEvaluation(
    employeeId: string,
    periodId: string,
    data: {
      evaluationGrade: string;
      jobGrade: JobGrade;
      jobDetailedGrade: JobDetailedGrade;
      finalComments?: string;
      actionBy?: string;
    },
  ) {
    return testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
      )
      .send(data);
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

  async function getFinalEvaluationByEmployeePeriod(
    employeeId: string,
    periodId: string,
  ) {
    const result = await dataSource.query(
      `
      SELECT * FROM final_evaluations
      WHERE "employeeId" = $1 AND "periodId" = $2 AND "deletedAt" IS NULL
    `,
      [employeeId, periodId],
    );
    return result[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('최종평가 저장 성공 시나리오', () => {
    it('기본 최종평가를 저장(생성)할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('저장');

      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.employeeId).toBe(employee.id);
      expect(dbRecord.periodId).toBe(period.id);
      expect(dbRecord.evaluationGrade).toBe(payload.evaluationGrade);
      expect(dbRecord.jobGrade).toBe(payload.jobGrade);
      expect(dbRecord.jobDetailedGrade).toBe(payload.jobDetailedGrade);
    });

    it('최종평가 의견을 포함하여 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
        finalComments: '전반적으로 매우 우수한 성과를 보였습니다.',
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.finalComments).toBe(payload.finalComments);
    });

    it('actionBy를 포함하여 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const testUserId = '00000000-0000-0000-0000-000000000001';
      const payload = {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.U,
        // actionBy는 @CurrentUser()로 자동 설정됨
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.createdBy).toBe(testUserId);
    });

    it('actionBy 없이도 저장할 수 있어야 한다 (기본값 사용)', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'C',
        jobGrade: JobGrade.T1,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.createdBy).toBeDefined(); // UUID가 자동 생성됨
    });

    it('이미 존재하는 평가를 수정(Upsert)할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // 첫 번째 저장
      const firstPayload = {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };
      const firstResponse = await upsertFinalEvaluation(
        employee.id,
        period.id,
        firstPayload,
      ).expect(201);

      const firstEvaluationId = firstResponse.body.id;

      // 두 번째 저장 (수정)
      const secondPayload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
        finalComments: '개선된 평가입니다.',
      };

      // When
      const secondResponse = await upsertFinalEvaluation(
        employee.id,
        period.id,
        secondPayload,
      ).expect(201);

      // Then
      expect(secondResponse.body.id).toBe(firstEvaluationId); // 같은 ID (수정됨)

      const dbRecord = await getFinalEvaluationFromDb(firstEvaluationId);
      expect(dbRecord.evaluationGrade).toBe(secondPayload.evaluationGrade);
      expect(dbRecord.jobGrade).toBe(secondPayload.jobGrade);
      expect(dbRecord.jobDetailedGrade).toBe(secondPayload.jobDetailedGrade);
      expect(dbRecord.finalComments).toBe(secondPayload.finalComments);
    });

    it('다양한 평가등급으로 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const grades = ['S', 'A', 'B', 'C', 'D'];

      for (const grade of grades) {
        // When
        const payload = {
          evaluationGrade: grade,
          jobGrade: JobGrade.T2,
          jobDetailedGrade: JobDetailedGrade.N,
        };

        const response = await upsertFinalEvaluation(
          employee.id,
          period.id,
          payload,
        ).expect(201);

        // Then
        const dbRecord = await getFinalEvaluationFromDb(response.body.id);
        expect(dbRecord.evaluationGrade).toBe(grade);
      }
    });

    it('다양한 직무등급 조합으로 저장할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const combinations = [
        { jobGrade: JobGrade.T1, jobDetailedGrade: JobDetailedGrade.U },
        { jobGrade: JobGrade.T2, jobDetailedGrade: JobDetailedGrade.N },
        { jobGrade: JobGrade.T3, jobDetailedGrade: JobDetailedGrade.A },
      ];

      for (const combo of combinations) {
        // When
        const payload = {
          evaluationGrade: 'A',
          ...combo,
        };

        const response = await upsertFinalEvaluation(
          employee.id,
          period.id,
          payload,
        ).expect(201);

        // Then
        const dbRecord = await getFinalEvaluationFromDb(response.body.id);
        expect(dbRecord.jobGrade).toBe(combo.jobGrade);
        expect(dbRecord.jobDetailedGrade).toBe(combo.jobDetailedGrade);
      }
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('최종평가 저장 실패 시나리오', () => {
    it('잘못된 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidEmployeeId = 'invalid-uuid';
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When & Then
      await upsertFinalEvaluation(invalidEmployeeId, period.id, payload).expect(
        400,
      );
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const invalidPeriodId = 'invalid-uuid';
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When & Then
      await upsertFinalEvaluation(employee.id, invalidPeriodId, payload).expect(
        400,
      );
    });

    it('evaluationGrade 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload: any = {
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When & Then
      await upsertFinalEvaluation(employee.id, period.id, payload).expect(400);
    });

    it('jobGrade 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload: any = {
        evaluationGrade: 'A',
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When & Then
      await upsertFinalEvaluation(employee.id, period.id, payload).expect(400);
    });

    it('jobDetailedGrade 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload: any = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
      };

      // When & Then
      await upsertFinalEvaluation(employee.id, period.id, payload).expect(400);
    });

    it('잘못된 jobGrade 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload: any = {
        evaluationGrade: 'A',
        jobGrade: 'INVALID_GRADE',
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When & Then
      await upsertFinalEvaluation(employee.id, period.id, payload).expect(400);
    });

    it('잘못된 jobDetailedGrade 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload: any = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: 'INVALID_GRADE',
      };

      // When & Then
      await upsertFinalEvaluation(employee.id, period.id, payload).expect(400);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('최종평가 저장 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.message).toBe('string');
    });

    it('평가 ID가 유효한 UUID 형식이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(response.body.id).toMatch(uuidRegex);
    });
  });

  // ==================== 데이터 정합성 검증 ====================

  describe('최종평가 저장 데이터 정합성', () => {
    it('저장된 데이터가 DB의 실제 데이터와 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
        finalComments: '우수한 성과입니다.',
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.employeeId).toBe(employee.id);
      expect(dbRecord.periodId).toBe(period.id);
      expect(dbRecord.evaluationGrade).toBe(payload.evaluationGrade);
      expect(dbRecord.jobGrade).toBe(payload.jobGrade);
      expect(dbRecord.jobDetailedGrade).toBe(payload.jobDetailedGrade);
      expect(dbRecord.finalComments).toBe(payload.finalComments);
    });

    it('초기 생성 시 isConfirmed가 false여야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.isConfirmed).toBe(false);
    });

    it('초기 생성 시 confirmedAt과 confirmedBy가 null이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.confirmedAt).toBeNull();
      expect(dbRecord.confirmedBy).toBeNull();
    });

    it('생성 시 createdAt과 updatedAt이 설정되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const payload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      // When
      const response = await upsertFinalEvaluation(
        employee.id,
        period.id,
        payload,
      ).expect(201);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(response.body.id);
      expect(dbRecord.createdAt).toBeDefined();
      expect(dbRecord.updatedAt).toBeDefined();
      expect(new Date(dbRecord.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(dbRecord.updatedAt).getTime()).toBeGreaterThan(0);
    });

    it('수정 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const firstPayload = {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      const firstResponse = await upsertFinalEvaluation(
        employee.id,
        period.id,
        firstPayload,
      ).expect(201);

      const firstRecord = await getFinalEvaluationFromDb(firstResponse.body.id);
      const firstUpdatedAt = new Date(firstRecord.updatedAt);

      // 약간의 시간 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      const secondPayload = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      };

      // When
      await upsertFinalEvaluation(employee.id, period.id, secondPayload).expect(
        201,
      );

      // Then
      const secondRecord = await getFinalEvaluationFromDb(
        firstResponse.body.id,
      );
      const secondUpdatedAt = new Date(secondRecord.updatedAt);
      expect(secondUpdatedAt.getTime()).toBeGreaterThan(
        firstUpdatedAt.getTime(),
      );
    });

    it('같은 직원-평가기간 조합에 대해 하나의 평가만 존재해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      const payload1 = {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      };

      const payload2 = {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      };

      // When
      await upsertFinalEvaluation(employee.id, period.id, payload1).expect(201);
      await upsertFinalEvaluation(employee.id, period.id, payload2).expect(201);

      // Then
      const records = await dataSource.query(
        `
        SELECT * FROM final_evaluations
        WHERE "employeeId" = $1 AND "periodId" = $2 AND "deletedAt" IS NULL
      `,
        [employee.id, period.id],
      );

      expect(records.length).toBe(1);
      expect(records[0].evaluationGrade).toBe(payload2.evaluationGrade);
    });
  });
});
