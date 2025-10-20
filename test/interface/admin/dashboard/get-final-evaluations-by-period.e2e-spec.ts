import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

describe('GET /admin/dashboard/:evaluationPeriodId/final-evaluations', () => {
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

    // test-context를 활용한 완전한 테스트 환경 생성
    const testEnvironment =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      employees: testEnvironment.employees,
      evaluationPeriods: testEnvironment.periods,
      departments: testEnvironment.departments,
      projects: testEnvironment.projects,
      wbsItems: testEnvironment.wbsItems,
    };

    console.log('최종평가 목록 조회 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.evaluationPeriods.length,
      departments: testData.departments.length,
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

  /**
   * 평가기간-직원 매핑을 생성한다
   */
  async function createEvaluationPeriodEmployeeMapping(data: {
    periodId: string;
    employeeId: string;
    isExcluded?: boolean;
  }): Promise<string> {
    const result = await dataSource.query(
      `
      INSERT INTO evaluation_period_employee_mapping ("evaluationPeriodId", "employeeId", "isExcluded", "createdAt", "updatedAt", "version")
      VALUES ($1, $2, $3, NOW(), NOW(), 1)
      RETURNING id
    `,
      [data.periodId, data.employeeId, data.isExcluded || false],
    );
    return result[0].id;
  }

  /**
   * 최종평가를 생성한다
   */
  async function createFinalEvaluation(data: {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments?: string;
    isConfirmed?: boolean;
    confirmedBy?: string;
  }): Promise<string> {
    const confirmedAt = data.isConfirmed ? 'NOW()' : 'NULL';
    const result = await dataSource.query(
      `
      INSERT INTO final_evaluations ("employeeId", "periodId", "evaluationGrade", "jobGrade", "jobDetailedGrade", "finalComments", "isConfirmed", "confirmedAt", "confirmedBy", "createdAt", "updatedAt", "version")
      VALUES ($1, $2, $3, $4, $5, $6, $7, ${confirmedAt}, $8, NOW(), NOW(), 1)
      RETURNING id
    `,
      [
        data.employeeId,
        data.periodId,
        data.evaluationGrade,
        data.jobGrade,
        data.jobDetailedGrade,
        data.finalComments || null,
        data.isConfirmed || false,
        data.confirmedBy || null,
      ],
    );
    return result[0].id;
  }

  function getFinalEvaluations(evaluationPeriodId: string) {
    return testSuite
      .request()
      .get(`/admin/dashboard/${evaluationPeriodId}/final-evaluations`);
  }

  // ==================== Test Cases ====================

  describe('정상 케이스', () => {
    it('평가기간에 등록된 모든 최종평가를 조회할 수 있어야 함', async () => {
      // Given: 평가기간과 직원 생성
      const period = getRandomEvaluationPeriod();
      const employee1 = getRandomEmployee();
      const employee2 = testData.employees.find(
        (e: any) => e.id !== employee1.id,
      );

      // 평가기간-직원 매핑 생성
      await createEvaluationPeriodEmployeeMapping({
        periodId: period.id,
        employeeId: employee1.id,
        isExcluded: false,
      });
      await createEvaluationPeriodEmployeeMapping({
        periodId: period.id,
        employeeId: employee2.id,
        isExcluded: false,
      });

      // 최종평가 생성
      await createFinalEvaluation({
        employeeId: employee1.id,
        periodId: period.id,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        finalComments: '우수한 성과를 보였습니다.',
        isConfirmed: true,
        confirmedBy: employee1.id,
      });
      await createFinalEvaluation({
        employeeId: employee2.id,
        periodId: period.id,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
        finalComments: '양호한 성과를 보였습니다.',
        isConfirmed: false,
      });

      // When: 최종평가 목록 조회
      const response = await getFinalEvaluations(period.id).expect(200);

      // Then: 결과 검증 - 평가기간과 평가 목록을 포함하는 객체
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations).toHaveLength(2);

      // 평가기간 검증
      expect(response.body.period.id).toBe(period.id);
      expect(response.body.period.name).toBe(period.name);

      // 첫 번째 직원 검증
      const item1 = response.body.evaluations.find(
        (e: any) => e.employee.id === employee1.id,
      );
      expect(item1).toBeDefined();
      expect(item1.employee.name).toBe(employee1.name);
      expect(item1.employee.employeeNumber).toBe(employee1.employeeNumber);
      expect(item1.evaluation.evaluationGrade).toBe('A');
      expect(item1.evaluation.jobGrade).toBe('T2');
      expect(item1.evaluation.jobDetailedGrade).toBe('n');
      expect(item1.evaluation.isConfirmed).toBe(true);
      expect(item1.evaluation.confirmedAt).not.toBeNull();

      // 두 번째 직원 검증
      const item2 = response.body.evaluations.find(
        (e: any) => e.employee.id === employee2.id,
      );
      expect(item2).toBeDefined();
      expect(item2.employee.name).toBe(employee2.name);
      expect(item2.evaluation.evaluationGrade).toBe('B');
      expect(item2.evaluation.isConfirmed).toBe(false);
      expect(item2.evaluation.confirmedAt).toBeNull();
    });

    it('빈 결과: 최종평가가 없는 경우 빈 배열 반환', async () => {
      // Given: 평가기간만 있고 최종평가가 없음
      const period = getRandomEvaluationPeriod();

      // When: 최종평가 목록 조회
      const response = await getFinalEvaluations(period.id).expect(200);

      // Then: 빈 평가 목록 반환
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations).toHaveLength(0);
    });

    it('제외된 직원: isExcluded=true인 직원의 최종평가는 조회되지 않음', async () => {
      // Given: 제외된 직원과 제외되지 않은 직원
      const period = getRandomEvaluationPeriod();
      const excludedEmployee = getRandomEmployee();
      const normalEmployee = testData.employees.find(
        (e: any) => e.id !== excludedEmployee.id,
      );

      // 제외된 직원 매핑
      await createEvaluationPeriodEmployeeMapping({
        periodId: period.id,
        employeeId: excludedEmployee.id,
        isExcluded: true,
      });

      // 일반 직원 매핑
      await createEvaluationPeriodEmployeeMapping({
        periodId: period.id,
        employeeId: normalEmployee.id,
        isExcluded: false,
      });

      // 두 직원 모두 최종평가 생성
      await createFinalEvaluation({
        employeeId: excludedEmployee.id,
        periodId: period.id,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });
      await createFinalEvaluation({
        employeeId: normalEmployee.id,
        periodId: period.id,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
      });

      // When: 최종평가 목록 조회
      const response = await getFinalEvaluations(period.id).expect(200);

      // Then: 제외되지 않은 직원의 최종평가만 조회됨
      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations).toHaveLength(1);
      expect(response.body.evaluations[0].employee.id).toBe(normalEmployee.id);
    });

    it('사번 순으로 정렬: 직원 사번 오름차순으로 정렬되어야 함', async () => {
      // Given: 여러 직원의 최종평가 생성
      const period = getRandomEvaluationPeriod();
      const employees = testData.employees.slice(0, 3);

      for (const employee of employees) {
        await createEvaluationPeriodEmployeeMapping({
          periodId: period.id,
          employeeId: employee.id,
          isExcluded: false,
        });

        await createFinalEvaluation({
          employeeId: employee.id,
          periodId: period.id,
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'n',
        });
      }

      // When: 최종평가 목록 조회
      const response = await getFinalEvaluations(period.id).expect(200);

      // Then: 사번 순으로 정렬되어야 함
      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      const employeeNumbers = response.body.evaluations.map(
        (e: any) => e.employee.employeeNumber,
      );
      const sortedNumbers = [...employeeNumbers].sort();
      expect(employeeNumbers).toEqual(sortedNumbers);
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러', async () => {
      // Given: 잘못된 UUID
      const invalidId = 'invalid-uuid';

      // When & Then: 400 에러
      await testSuite
        .request()
        .get(`/admin/dashboard/${invalidId}/final-evaluations`)
        .expect(400);
    });

    it('존재하지 않는 평가기간: 존재하지 않는 평가기간 조회 시 404 에러', async () => {
      // Given: 존재하지 않는 평가기간 ID
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      // When & Then: 404 에러
      await testSuite
        .request()
        .get(`/admin/dashboard/${nonExistentId}/final-evaluations`)
        .expect(404);
    });
  });

  describe('응답 구조 검증', () => {
    it('응답에 필요한 모든 필드가 포함되어야 함', async () => {
      // Given: 최종평가 생성
      const period = getRandomEvaluationPeriod();
      const employee = getRandomEmployee();

      await createEvaluationPeriodEmployeeMapping({
        periodId: period.id,
        employeeId: employee.id,
        isExcluded: false,
      });

      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period.id,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
        finalComments: '매우 우수한 성과를 보였습니다.',
        isConfirmed: true,
        confirmedBy: employee.id,
      });

      // When: 최종평가 목록 조회
      const response = await getFinalEvaluations(period.id).expect(200);

      // Then: 응답 구조 검증
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations).toHaveLength(1);

      // 평가기간 정보 검증
      expect(response.body.period).toHaveProperty('id');
      expect(response.body.period).toHaveProperty('name');
      expect(response.body.period).toHaveProperty('startDate');
      expect(response.body.period).toHaveProperty('endDate');
      expect(response.body.period.id).toBe(period.id);

      const item = response.body.evaluations[0];
      // 직원 정보
      expect(item).toHaveProperty('employee');
      expect(item.employee).toHaveProperty('id');
      expect(item.employee).toHaveProperty('name');
      expect(item.employee).toHaveProperty('employeeNumber');
      expect(item.employee).toHaveProperty('email');
      expect(item.employee).toHaveProperty('departmentName');
      expect(item.employee).toHaveProperty('rankName');
      expect(item.employee.id).toBe(employee.id);
      expect(item.employee.name).toBe(employee.name);

      // 최종평가 정보
      expect(item).toHaveProperty('evaluation');
      expect(item.evaluation).toHaveProperty('id');
      expect(item.evaluation).toHaveProperty('evaluationGrade');
      expect(item.evaluation).toHaveProperty('jobGrade');
      expect(item.evaluation).toHaveProperty('jobDetailedGrade');
      expect(item.evaluation).toHaveProperty('finalComments');
      expect(item.evaluation).toHaveProperty('isConfirmed');
      expect(item.evaluation).toHaveProperty('confirmedAt');
      expect(item.evaluation).toHaveProperty('confirmedBy');
      expect(item.evaluation).toHaveProperty('createdAt');
      expect(item.evaluation).toHaveProperty('updatedAt');
    });
  });
});
