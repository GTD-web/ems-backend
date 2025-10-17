import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

describe('GET /admin/dashboard/final-evaluations', () => {
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

    console.log('전체 직원별 최종평가 목록 조회 테스트 데이터 생성 완료:', {
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

  /**
   * 평가기간을 생성한다
   */
  async function createEvaluationPeriod(data: {
    name: string;
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    const result = await dataSource.query(
      `
      INSERT INTO evaluation_period ("name", "startDate", "endDate", "status", "currentPhase", "createdAt", "updatedAt", "version")
      VALUES ($1, $2, $3, 'waiting', 'waiting', NOW(), NOW(), 1)
      RETURNING id
    `,
      [data.name, data.startDate, data.endDate],
    );
    return result[0].id;
  }

  /**
   * 평가기간 직원 매핑을 생성한다
   */
  async function createEvaluationPeriodEmployeeMapping(data: {
    periodId: string;
    employeeId: string;
    isExcluded?: boolean;
  }): Promise<void> {
    await dataSource.query(
      `
      INSERT INTO evaluation_period_employee_mapping ("evaluationPeriodId", "employeeId", "isExcluded", "createdAt", "updatedAt", "version")
      VALUES ($1, $2, $3, NOW(), NOW(), 1)
      ON CONFLICT DO NOTHING
    `,
      [data.periodId, data.employeeId, data.isExcluded || false],
    );
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

  function getAllEmployeesFinalEvaluations(query?: {
    startDate?: string;
    endDate?: string;
  }) {
    let url = `/admin/dashboard/final-evaluations`;
    const params: string[] = [];

    if (query) {
      if (query.startDate) params.push(`startDate=${query.startDate}`);
      if (query.endDate) params.push(`endDate=${query.endDate}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return request(app.getHttpServer()).get(url);
  }

  // ==================== Test Cases ====================

  describe('정상 케이스', () => {
    it('모든 직원의 최종평가를 조회할 수 있어야 함', async () => {
      // Given: 여러 직원의 최종평가
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];
      const employee3 = testData.employees[2];

      const period1 = await createEvaluationPeriod({
        name: '2024년 상반기',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      });
      const period2 = await createEvaluationPeriod({
        name: '2024년 하반기',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
      });

      // 평가기간 직원 매핑 생성
      await createEvaluationPeriodEmployeeMapping({
        periodId: period1,
        employeeId: employee1.id,
      });
      await createEvaluationPeriodEmployeeMapping({
        periodId: period1,
        employeeId: employee2.id,
      });
      await createEvaluationPeriodEmployeeMapping({
        periodId: period2,
        employeeId: employee3.id,
      });

      // 최종평가 생성
      await createFinalEvaluation({
        employeeId: employee1.id,
        periodId: period1,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        isConfirmed: true,
      });
      await createFinalEvaluation({
        employeeId: employee2.id,
        periodId: period1,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
        isConfirmed: true,
      });
      await createFinalEvaluation({
        employeeId: employee3.id,
        periodId: period2,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
        isConfirmed: false,
      });

      // When: 전체 직원별 최종평가 목록 조회
      const response = await getAllEmployeesFinalEvaluations().expect(200);

      // Then: 결과 검증
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      expect(Array.isArray(response.body.evaluationPeriods)).toBe(true);
      expect(Array.isArray(response.body.employees)).toBe(true);
      expect(response.body.employees.length).toBeGreaterThanOrEqual(1);

      // 평가기간 정보 검증
      if (response.body.evaluationPeriods.length > 0) {
        const period = response.body.evaluationPeriods[0];
        expect(period).toHaveProperty('id');
        expect(period).toHaveProperty('name');
        expect(period).toHaveProperty('startDate');
        expect(period).toHaveProperty('endDate');
      }

      // 각 직원이 필요한 필드를 포함하는지 확인
      const employeeData = response.body.employees[0];
      expect(employeeData).toHaveProperty('employee');
      expect(employeeData).toHaveProperty('finalEvaluations');
      expect(Array.isArray(employeeData.finalEvaluations)).toBe(true);

      // 직원 정보 검증
      expect(employeeData.employee).toHaveProperty('id');
      expect(employeeData.employee).toHaveProperty('name');
      expect(employeeData.employee).toHaveProperty('employeeNumber');
      expect(employeeData.employee).toHaveProperty('email');

      // 최종평가 정보 검증 (null이 아닌 경우에만)
      const nonNullEvaluation = employeeData.finalEvaluations.find(
        (e: any) => e !== null,
      );
      if (nonNullEvaluation) {
        expect(nonNullEvaluation).toHaveProperty('id');
        expect(nonNullEvaluation).toHaveProperty('evaluationGrade');
        expect(nonNullEvaluation).toHaveProperty('jobGrade');
        expect(nonNullEvaluation).toHaveProperty('jobDetailedGrade');
      }
    });

    it('날짜 범위 필터링: startDate, endDate로 특정 기간의 평가만 조회', async () => {
      // Given: 여러 평가기간의 최종평가
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];

      const period2023 = await createEvaluationPeriod({
        name: '2023년',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31'),
      });
      const period2024 = await createEvaluationPeriod({
        name: '2024년',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      // 평가기간 직원 매핑 생성
      await createEvaluationPeriodEmployeeMapping({
        periodId: period2023,
        employeeId: employee1.id,
      });
      await createEvaluationPeriodEmployeeMapping({
        periodId: period2024,
        employeeId: employee2.id,
      });

      await createFinalEvaluation({
        employeeId: employee1.id,
        periodId: period2023,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
      });
      await createFinalEvaluation({
        employeeId: employee2.id,
        periodId: period2024,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });

      // When: 2024년 평가만 조회
      const response = await getAllEmployeesFinalEvaluations({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }).expect(200);

      // Then: 2024년 평가만 반환되어야 함
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      expect(Array.isArray(response.body.evaluationPeriods)).toBe(true);
      expect(Array.isArray(response.body.employees)).toBe(true);

      // 모든 평가기간이 2024년에 속하는지 확인
      response.body.evaluationPeriods.forEach((period: any) => {
        const periodStartDate = new Date(period.startDate);
        expect(periodStartDate.getFullYear()).toBe(2024);
      });
    });

    it('빈 결과: 최종평가가 없는 경우 빈 배열 반환', async () => {
      // Given: 최종평가가 없는 상태

      // When: 전체 직원별 최종평가 목록 조회
      const response = await getAllEmployeesFinalEvaluations({
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      }).expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      expect(Array.isArray(response.body.evaluationPeriods)).toBe(true);
      expect(Array.isArray(response.body.employees)).toBe(true);
      expect(response.body.evaluationPeriods).toHaveLength(0);
      expect(response.body.employees).toHaveLength(0);
    });

    it('제외된 직원: isExcluded=true인 직원의 최종평가는 조회되지 않음', async () => {
      // Given: 제외된 직원과 일반 직원
      const employee1 = testData.employees[0];
      const employee2 = testData.employees[1];

      const period = await createEvaluationPeriod({
        name: '2024년 상반기',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      });

      // employee1은 제외, employee2는 포함
      await createEvaluationPeriodEmployeeMapping({
        periodId: period,
        employeeId: employee1.id,
        isExcluded: true,
      });
      await createEvaluationPeriodEmployeeMapping({
        periodId: period,
        employeeId: employee2.id,
        isExcluded: false,
      });

      // 두 직원 모두 최종평가 생성
      await createFinalEvaluation({
        employeeId: employee1.id,
        periodId: period,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });
      await createFinalEvaluation({
        employeeId: employee2.id,
        periodId: period,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
      });

      // When: 전체 직원별 최종평가 목록 조회
      const response = await getAllEmployeesFinalEvaluations().expect(200);

      // Then: 제외된 직원(employee1)의 평가는 조회되지 않음
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      expect(Array.isArray(response.body.evaluationPeriods)).toBe(true);
      expect(Array.isArray(response.body.employees)).toBe(true);

      const excludedEmployeeData = response.body.employees.find(
        (e: any) => e.employee.id === employee1.id,
      );
      expect(excludedEmployeeData).toBeUndefined();

      const includedEmployeeData = response.body.employees.find(
        (e: any) => e.employee.id === employee2.id,
      );
      expect(includedEmployeeData).toBeDefined();
    });

    it('정렬 확인: 평가기간 시작일 내림차순, 직원 사번 오름차순 정렬', async () => {
      // Given: 여러 평가기간의 여러 직원 최종평가
      const employees = testData.employees
        .slice(0, 3)
        .sort((a: any, b: any) =>
          a.employeeNumber.localeCompare(b.employeeNumber),
        );

      const period1 = await createEvaluationPeriod({
        name: '2024년 1분기',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      });
      const period2 = await createEvaluationPeriod({
        name: '2024년 2분기',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-06-30'),
      });

      // 각 직원별로 평가기간 매핑 및 최종평가 생성
      for (const employee of employees) {
        await createEvaluationPeriodEmployeeMapping({
          periodId: period1,
          employeeId: employee.id,
        });
        await createEvaluationPeriodEmployeeMapping({
          periodId: period2,
          employeeId: employee.id,
        });

        await createFinalEvaluation({
          employeeId: employee.id,
          periodId: period1,
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'n',
        });
        await createFinalEvaluation({
          employeeId: employee.id,
          periodId: period2,
          evaluationGrade: 'S',
          jobGrade: 'T3',
          jobDetailedGrade: 'a',
        });
      }

      // When: 전체 직원별 최종평가 목록 조회
      const response = await getAllEmployeesFinalEvaluations({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }).expect(200);

      // Then: 정렬 검증
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      const periodsData = response.body.evaluationPeriods;
      const employeesData = response.body.employees;
      expect(Array.isArray(periodsData)).toBe(true);
      expect(Array.isArray(employeesData)).toBe(true);
      expect(employeesData.length).toBeGreaterThanOrEqual(3);

      // 평가기간 시작일 내림차순 확인
      for (let i = 0; i < periodsData.length - 1; i++) {
        const current = new Date(periodsData[i].startDate);
        const next = new Date(periodsData[i + 1].startDate);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }

      // 직원 사번 오름차순 확인
      for (let i = 0; i < employeesData.length - 1; i++) {
        expect(
          employeesData[i].employee.employeeNumber.localeCompare(
            employeesData[i + 1].employee.employeeNumber,
          ),
        ).toBeLessThanOrEqual(0);
      }

      // 각 직원의 finalEvaluations 배열 길이가 evaluationPeriods 배열 길이와 같은지 확인
      employeesData.forEach((employeeData: any) => {
        expect(employeeData.finalEvaluations.length).toBe(periodsData.length);
      });
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 날짜 형식: 잘못된 날짜 형식으로 요청 시 400 에러', async () => {
      // Given: 잘못된 날짜 형식
      const invalidDate = 'invalid-date';

      // When & Then: 400 에러
      await request(app.getHttpServer())
        .get(`/admin/dashboard/final-evaluations?startDate=${invalidDate}`)
        .expect(400);
    });
  });

  describe('응답 구조 검증', () => {
    it('응답에 필요한 모든 필드가 포함되어야 함', async () => {
      // Given: 최종평가 생성
      const employee = testData.employees[0];
      const period = await createEvaluationPeriod({
        name: '2024년 상반기',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      });

      await createEvaluationPeriodEmployeeMapping({
        periodId: period,
        employeeId: employee.id,
      });

      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period,
        evaluationGrade: 'S',
        jobGrade: 'T3',
        jobDetailedGrade: 'a',
        finalComments: '매우 우수한 성과를 보였습니다.',
        isConfirmed: true,
        confirmedBy: employee.id,
      });

      // When: 전체 직원별 최종평가 목록 조회
      const response = await getAllEmployeesFinalEvaluations().expect(200);

      // Then: 응답 구조 검증
      expect(response.body).toHaveProperty('evaluationPeriods');
      expect(response.body).toHaveProperty('employees');
      expect(Array.isArray(response.body.evaluationPeriods)).toBe(true);
      expect(Array.isArray(response.body.employees)).toBe(true);
      expect(response.body.evaluationPeriods.length).toBeGreaterThan(0);
      expect(response.body.employees.length).toBeGreaterThan(0);

      // 평가기간 정보 필드 검증
      const periodData = response.body.evaluationPeriods[0];
      expect(periodData).toHaveProperty('id');
      expect(periodData).toHaveProperty('name');
      expect(periodData).toHaveProperty('startDate');
      expect(periodData).toHaveProperty('endDate');
      expect(periodData.name).toBe('2024년 상반기');

      // 직원 데이터 찾기
      const employeeData = response.body.employees.find(
        (e: any) => e.employee.id === employee.id,
      );
      expect(employeeData).toBeDefined();

      // 직원 정보 필드 검증
      expect(employeeData.employee).toHaveProperty('id');
      expect(employeeData.employee).toHaveProperty('name');
      expect(employeeData.employee).toHaveProperty('employeeNumber');
      expect(employeeData.employee).toHaveProperty('email');
      expect(employeeData.employee).toHaveProperty('departmentName');
      expect(employeeData.employee).toHaveProperty('rankName');
      expect(employeeData.employee.id).toBe(employee.id);

      // 최종평가 배열 검증
      expect(employeeData).toHaveProperty('finalEvaluations');
      expect(Array.isArray(employeeData.finalEvaluations)).toBe(true);
      expect(employeeData.finalEvaluations.length).toBe(
        response.body.evaluationPeriods.length,
      );

      // 첫 번째 최종평가 정보 필드 검증 (null이 아닌 경우)
      const finalEvaluation = employeeData.finalEvaluations.find(
        (e: any) => e !== null,
      );
      expect(finalEvaluation).toBeDefined();
      expect(finalEvaluation).toHaveProperty('id');
      expect(finalEvaluation).toHaveProperty('evaluationGrade');
      expect(finalEvaluation).toHaveProperty('jobGrade');
      expect(finalEvaluation).toHaveProperty('jobDetailedGrade');
      expect(finalEvaluation).toHaveProperty('finalComments');
      expect(finalEvaluation).toHaveProperty('isConfirmed');
      expect(finalEvaluation).toHaveProperty('confirmedAt');
      expect(finalEvaluation).toHaveProperty('confirmedBy');
      expect(finalEvaluation).toHaveProperty('createdAt');
      expect(finalEvaluation).toHaveProperty('updatedAt');

      // 값 검증
      expect(finalEvaluation.evaluationGrade).toBe('S');
      expect(finalEvaluation.jobGrade).toBe('T3');
      expect(finalEvaluation.jobDetailedGrade).toBe('a');
      expect(finalEvaluation.finalComments).toBe(
        '매우 우수한 성과를 보였습니다.',
      );
      expect(finalEvaluation.isConfirmed).toBe(true);
    });
  });
});
