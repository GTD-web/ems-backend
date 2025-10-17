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

describe('GET /admin/performance-evaluation/final-evaluations', () => {
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

    console.log('최종평가 목록 조회 테스트 데이터 생성 완료:', {
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

  function getFinalEvaluationList(params: any = {}) {
    return request(app.getHttpServer())
      .get('/admin/performance-evaluation/final-evaluations')
      .query(params);
  }

  // ==================== 성공 시나리오 ====================

  describe('최종평가 목록 조회 성공 시나리오', () => {
    it('기본 목록을 조회할 수 있어야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee1.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await createFinalEvaluation(employee2.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When
      const response = await getFinalEvaluationList().expect(200);

      // Then
      expect(response.body.evaluations).toBeDefined();
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(2);
      expect(response.body.total).toBeGreaterThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
    });

    it('직원 정보가 객체로 반환되어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationList({
        employeeId: employee.id,
      }).expect(200);

      // Then
      expect(response.body.evaluations[0].employee).toEqual({
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
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // When
      const response = await getFinalEvaluationList({
        periodId: period.id,
      }).expect(200);

      // Then
      const firstItem = response.body.evaluations[0];
      expect(firstItem.period.id).toBe(period.id);
      expect(firstItem.period.name).toBe(period.name);
      expect(firstItem.period.status).toBe(period.status);
    });

    it('페이지네이션이 작동해야 한다', async () => {
      // Given
      const period = getRandomEvaluationPeriod();

      for (let i = 0; i < 3; i++) {
        const employee = testData.employees[i];
        await createFinalEvaluation(employee.id, period.id, {
          evaluationGrade: 'A',
          jobGrade: JobGrade.T2,
          jobDetailedGrade: JobDetailedGrade.N,
        });
      }

      // When
      const page1 = await getFinalEvaluationList({ page: 1, limit: 2 }).expect(
        200,
      );
      const page2 = await getFinalEvaluationList({ page: 2, limit: 2 }).expect(
        200,
      );

      // Then
      expect(page1.body.evaluations.length).toBe(2);
      expect(page1.body.page).toBe(1);
      expect(page1.body.limit).toBe(2);
      expect(page1.body.total).toBeGreaterThanOrEqual(3);

      expect(page2.body.evaluations.length).toBeGreaterThanOrEqual(1);
      expect(page2.body.page).toBe(2);

      // 다른 항목이어야 함
      expect(page1.body.evaluations[0].id).not.toBe(
        page2.body.evaluations[0].id,
      );
    });

    it('employeeId로 필터링할 수 있어야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee1.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await createFinalEvaluation(employee2.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When
      const response = await getFinalEvaluationList({
        employeeId: employee1.id,
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBe(1);
      expect(response.body.evaluations[0].employee.id).toBe(employee1.id);
    });

    it('periodId로 필터링할 수 있어야 한다', async () => {
      // Given
      const employee = getRandomEmployee();
      const period1 = testData.evaluationPeriods[0];
      const period2 = testData.evaluationPeriods[1];

      await createFinalEvaluation(employee.id, period1.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await createFinalEvaluation(employee.id, period2.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When
      const response = await getFinalEvaluationList({
        periodId: period1.id,
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
      response.body.evaluations.forEach((evaluation: any) => {
        expect(evaluation.period.id).toBe(period1.id);
      });
    });

    it('evaluationGrade로 필터링할 수 있어야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      await createFinalEvaluation(employee1.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await createFinalEvaluation(employee2.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When
      const response = await getFinalEvaluationList({
        evaluationGrade: 'A',
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
      response.body.evaluations.forEach((evaluation: any) => {
        expect(evaluation.evaluationGrade).toBe('A');
      });
    });

    it('confirmedOnly로 필터링할 수 있어야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const confirmedBy = uuidv4();

      const eval1Id = await createFinalEvaluation(employee1.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      await createFinalEvaluation(employee2.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // 첫 번째 평가만 확정
      await request(app.getHttpServer())
        .post(
          `/admin/performance-evaluation/final-evaluations/${eval1Id}/confirm`,
        )
        .send({ confirmedBy })
        .expect(200);

      // When
      const response = await getFinalEvaluationList({
        confirmedOnly: true,
      }).expect(200);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
      response.body.evaluations.forEach((evaluation: any) => {
        expect(evaluation.isConfirmed).toBe(true);
      });
    });

    it('createdAt 역순으로 정렬되어야 한다', async () => {
      // Given
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const eval1Id = await createFinalEvaluation(employee1.id, period.id, {
        evaluationGrade: 'A',
        jobGrade: JobGrade.T2,
        jobDetailedGrade: JobDetailedGrade.N,
      });

      // 약간의 시간 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      const eval2Id = await createFinalEvaluation(employee2.id, period.id, {
        evaluationGrade: 'S',
        jobGrade: JobGrade.T3,
        jobDetailedGrade: JobDetailedGrade.A,
      });

      // When
      const response = await getFinalEvaluationList().expect(200);

      // Then
      const eval1 = response.body.evaluations.find(
        (e: any) => e.id === eval1Id,
      );
      const eval2 = response.body.evaluations.find(
        (e: any) => e.id === eval2Id,
      );

      if (eval1 && eval2) {
        const eval1Index = response.body.evaluations.indexOf(eval1);
        const eval2Index = response.body.evaluations.indexOf(eval2);

        // eval2가 나중에 생성되었으므로 더 앞에 있어야 함 (DESC 정렬)
        expect(eval2Index).toBeLessThan(eval1Index);
      }
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('최종평가 목록 조회 응답 구조 검증', () => {
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
      const response = await getFinalEvaluationList().expect(200);

      // Then
      expect(response.body).toHaveProperty('evaluations');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBeGreaterThan(0);

      const firstItem = response.body.evaluations[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('employee');
      expect(firstItem).toHaveProperty('period');
      expect(firstItem).toHaveProperty('evaluationGrade');
      expect(firstItem).toHaveProperty('jobGrade');
      expect(firstItem).toHaveProperty('jobDetailedGrade');
      expect(firstItem).toHaveProperty('isConfirmed');
      expect(firstItem).toHaveProperty('createdAt');
      expect(firstItem).toHaveProperty('updatedAt');
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
      const response = await getFinalEvaluationList({
        employeeId: employee.id,
      }).expect(200);

      // Then
      const firstItem = response.body.evaluations[0];
      expect(firstItem.employee).toHaveProperty('id');
      expect(firstItem.employee).toHaveProperty('name');
      expect(firstItem.employee).toHaveProperty('employeeNumber');
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
      const response = await getFinalEvaluationList().expect(200);

      // Then
      const firstItem = response.body.evaluations[0];
      expect(firstItem.period).toHaveProperty('id');
      expect(firstItem.period).toHaveProperty('name');
      expect(firstItem.period).toHaveProperty('startDate');
      expect(firstItem.period).toHaveProperty('endDate');
      expect(firstItem.period).toHaveProperty('status');
    });

    it('빈 목록도 정상적으로 반환되어야 한다', async () => {
      // Given - 데이터 없음

      // When
      const response = await getFinalEvaluationList({
        employeeId: uuidv4(),
      }).expect(200);

      // Then
      expect(response.body.evaluations).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });
});
