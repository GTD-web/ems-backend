import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import {
  JobGrade,
  JobDetailedGrade,
} from '@domain/core/final-evaluation/final-evaluation.types';
import { v4 as uuidv4 } from 'uuid';

describe('GET /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId', () => {
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

    console.log('직원-평가기간별 최종평가 조회 테스트 데이터 생성 완료:', {
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

  function getFinalEvaluationByEmployeePeriod(
    employeeId: string,
    periodId: string,
  ) {
    return testSuite
      .request()
      .get(
        `/admin/performance-evaluation/final-evaluations/employee/${employeeId}/period/${periodId}`,
      );
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

  describe('직원-평가기간별 최종평가 조회 성공 시나리오', () => {
    it('기본 최종평가를 조회할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.id).toBe(evaluationId);
      expect(response.body.employee).toBeDefined();
      expect(response.body.period).toBeDefined();
    });

    it('직원 정보가 객체로 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.employee).toEqual({
        id: employee.id,
        name: employee.name,
        employeeNumber: employee.employeeNumber,
        email: employee.email,
      });
    });

    it('평가기간 정보가 객체로 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'B',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.U,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.period.id).toBe(period.id);
      expect(response.body.period.name).toBe(period.name);
      expect(response.body.period.status).toBe(period.status);
      expect(new Date(response.body.period.startDate).toISOString()).toBe(
        new Date(period.startDate).toISOString(),
      );
      expect(new Date(response.body.period.endDate).toISOString()).toBe(
        new Date(period.endDate).toISOString(),
      );
    });

    it('평가 등급 정보가 정확히 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const evaluationData = {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
        finalComments: '매우 우수한 성과입니다.',
      };

      await createFinalEvaluation(employee.id, period.id, evaluationData);

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.evaluationGrade).toBe(
        evaluationData.evaluationGrade,
      );
      expect(response.body.jobGrade).toBe(evaluationData.jobGrade);
      expect(response.body.jobDetailedGrade).toBe(
        evaluationData.jobDetailedGrade,
      );
      expect(response.body.finalComments).toBe(evaluationData.finalComments);
    });

    it('확정 정보가 정확히 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const testUserId = '00000000-0000-0000-0000-000000000001';

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // 확정 처리 (confirmedBy는 @CurrentUser()로 자동 설정됨)
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/${evaluationId}/confirm`,
        )
        .send({})
        .expect(200);

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.isConfirmed).toBe(true);
      expect(response.body.confirmedBy).toBe(testUserId);
      expect(response.body.confirmedAt).toBeDefined();
    });

    it('미확정 평가는 확정 정보가 null이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.isConfirmed).toBe(false);
      expect(response.body.confirmedBy).toBeNull();
      expect(response.body.confirmedAt).toBeNull();
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('직원-평가기간별 최종평가 조회 실패 시나리오', () => {
    it('잘못된 형식의 직원 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidEmployeeId = 'invalid-uuid';
      const period = getRandomEvaluationPeriod();

      // When & Then
      await getFinalEvaluationByEmployeePeriod(
        invalidEmployeeId,
        period.id,
      ).expect(400);
    });

    it('잘못된 형식의 평가기간 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const invalidPeriodId = 'invalid-uuid';

      // When & Then
      await getFinalEvaluationByEmployeePeriod(
        employee.id,
        invalidPeriodId,
      ).expect(400);
    });

    it('존재하지 않는 직원-평가기간 조합으로 조회 시 204 응답이 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // 평가를 생성하지 않음

      // When & Then
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      expect(response.body).toEqual({});
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('직원-평가기간별 최종평가 조회 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('evaluationGrade');
      expect(response.body).toHaveProperty('jobGrade');
      expect(response.body).toHaveProperty('jobDetailedGrade');
      expect(response.body).toHaveProperty('isConfirmed');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).toHaveProperty('version');
    });

    it('직원 객체에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.employee).toHaveProperty('id');
      expect(response.body.employee).toHaveProperty('name');
      expect(response.body.employee).toHaveProperty('employeeNumber');
    });

    it('평가기간 객체에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.period).toHaveProperty('id');
      expect(response.body.period).toHaveProperty('name');
      expect(response.body.period).toHaveProperty('startDate');
      expect(response.body.period).toHaveProperty('endDate');
      expect(response.body.period).toHaveProperty('status');
    });

    it('ID가 유효한 UUID 형식이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(response.body.id).toMatch(uuidRegex);
      expect(response.body.employee.id).toMatch(uuidRegex);
      expect(response.body.period.id).toMatch(uuidRegex);
    });

    it('날짜가 유효한 ISO 8601 형식이어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      // 날짜가 유효한 ISO 형식인지 검증
      expect(() =>
        new Date(response.body.createdAt).toISOString(),
      ).not.toThrow();
      expect(() =>
        new Date(response.body.updatedAt).toISOString(),
      ).not.toThrow();
      expect(() =>
        new Date(response.body.period.startDate).toISOString(),
      ).not.toThrow();

      // 날짜 문자열이 유효한지 검증
      expect(new Date(response.body.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(0);
      expect(
        new Date(response.body.period.startDate).getTime(),
      ).toBeGreaterThan(0);

      // endDate가 있는 경우에만 검증
      if (response.body.period.endDate) {
        expect(() =>
          new Date(response.body.period.endDate).toISOString(),
        ).not.toThrow();
        expect(
          new Date(response.body.period.endDate).getTime(),
        ).toBeGreaterThan(0);
      }
    });
  });

  // ==================== 데이터 정합성 검증 ====================

  describe('직원-평가기간별 최종평가 조회 데이터 정합성', () => {
    it('조회된 데이터가 DB의 실제 데이터와 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
        finalComments: '우수한 성과입니다.',
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      const dbRecord = await getFinalEvaluationFromDb(evaluationId);
      expect(response.body.id).toBe(dbRecord.id);
      expect(response.body.evaluationGrade).toBe(dbRecord.evaluationGrade);
      expect(response.body.jobGrade).toBe(dbRecord.jobGrade);
      expect(response.body.jobDetailedGrade).toBe(dbRecord.jobDetailedGrade);
      expect(response.body.finalComments).toBe(dbRecord.finalComments);
      expect(response.body.isConfirmed).toBe(dbRecord.isConfirmed);
      expect(response.body.version).toBe(dbRecord.version);
    });

    it('확정 상태가 DB와 일치해야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationByEmployeePeriod(
        employee.id,
        period.id,
      ).expect(200);

      // Then
      expect(response.body.isConfirmed).toBe(false);
    });
  });
});
