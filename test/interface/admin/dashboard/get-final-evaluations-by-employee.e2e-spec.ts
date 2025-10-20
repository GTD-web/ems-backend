import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';

describe('GET /admin/dashboard/employees/:employeeId/final-evaluations', () => {
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

    console.log('직원별 최종평가 목록 조회 테스트 데이터 생성 완료:', {
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

  function getFinalEvaluations(
    employeeId: string,
    query?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    let url = `/admin/dashboard/employees/${employeeId}/final-evaluations`;
    const params: string[] = [];

    if (query) {
      if (query.startDate) params.push(`startDate=${query.startDate}`);
      if (query.endDate) params.push(`endDate=${query.endDate}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return testSuite.request().get(url);
  }

  // ==================== Test Cases ====================

  describe('정상 케이스', () => {
    it('직원의 모든 최종평가를 조회할 수 있어야 함', async () => {
      // Given: 한 직원의 여러 평가기간에 대한 최종평가
      const employee = getRandomEmployee();

      // 3개 평가기간 생성
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
      const period3 = await createEvaluationPeriod({
        name: '2024년 3분기',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-09-30'),
      });

      // 각 평가기간에 대한 최종평가 생성
      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period1,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
        isConfirmed: true,
      });
      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period2,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
        isConfirmed: true,
      });
      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period3,
        evaluationGrade: 'S',
        jobGrade: 'T2',
        jobDetailedGrade: 'a',
        isConfirmed: false,
      });

      // When: 직원별 최종평가 목록 조회
      const response = await getFinalEvaluations(employee.id).expect(200);

      // Then: 결과 검증
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('finalEvaluations');
      expect(response.body.employee.id).toBe(employee.id);
      expect(response.body.employee.name).toBe(employee.name);
      expect(Array.isArray(response.body.finalEvaluations)).toBe(true);
      expect(response.body.finalEvaluations).toHaveLength(3);

      // 최신순으로 정렬되어야 함 (3분기 -> 2분기 -> 1분기)
      expect(response.body.finalEvaluations[0].period.name).toBe(
        '2024년 3분기',
      );
      expect(response.body.finalEvaluations[0].evaluationGrade).toBe('S');
      expect(response.body.finalEvaluations[1].period.name).toBe(
        '2024년 2분기',
      );
      expect(response.body.finalEvaluations[1].evaluationGrade).toBe('A');
      expect(response.body.finalEvaluations[2].period.name).toBe(
        '2024년 1분기',
      );
      expect(response.body.finalEvaluations[2].evaluationGrade).toBe('B');
    });

    it('날짜 범위 필터링: startDate, endDate로 특정 기간의 평가만 조회', async () => {
      // Given: 여러 평가기간에 대한 최종평가
      const employee = getRandomEmployee();

      const period1 = await createEvaluationPeriod({
        name: '2023년 하반기',
        startDate: new Date('2023-07-01'),
        endDate: new Date('2023-12-31'),
      });
      const period2 = await createEvaluationPeriod({
        name: '2024년 상반기',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
      });
      const period3 = await createEvaluationPeriod({
        name: '2024년 하반기',
        startDate: new Date('2024-07-01'),
        endDate: new Date('2024-12-31'),
      });

      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period1,
        evaluationGrade: 'B',
        jobGrade: 'T1',
        jobDetailedGrade: 'a',
      });
      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period2,
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'n',
      });
      await createFinalEvaluation({
        employeeId: employee.id,
        periodId: period3,
        evaluationGrade: 'S',
        jobGrade: 'T2',
        jobDetailedGrade: 'a',
      });

      // When: 2024년 평가만 조회
      const response = await getFinalEvaluations(employee.id, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      }).expect(200);

      // Then: 2024년 평가만 반환되어야 함
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('finalEvaluations');
      expect(Array.isArray(response.body.finalEvaluations)).toBe(true);
      expect(response.body.finalEvaluations).toHaveLength(2);
      expect(response.body.finalEvaluations[0].period.name).toBe(
        '2024년 하반기',
      );
      expect(response.body.finalEvaluations[1].period.name).toBe(
        '2024년 상반기',
      );
    });

    it('빈 결과: 최종평가가 없는 경우 빈 배열 반환', async () => {
      // Given: 최종평가가 없는 직원
      const employee = getRandomEmployee();

      // When: 직원별 최종평가 목록 조회
      const response = await getFinalEvaluations(employee.id).expect(200);

      // Then: 빈 배열 반환
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('finalEvaluations');
      expect(Array.isArray(response.body.finalEvaluations)).toBe(true);
      expect(response.body.finalEvaluations).toHaveLength(0);
    });

    it('평가기간 시작일 내림차순 정렬: 최신 평가가 먼저 표시되어야 함', async () => {
      // Given: 여러 평가기간의 최종평가
      const employee = getRandomEmployee();

      const periods = [
        {
          name: '2022년',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2022-12-31'),
        },
        {
          name: '2023년',
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-12-31'),
        },
        {
          name: '2024년',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
        },
      ];

      for (const periodData of periods) {
        const periodId = await createEvaluationPeriod(periodData);
        await createFinalEvaluation({
          employeeId: employee.id,
          periodId,
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'n',
        });
      }

      // When: 직원별 최종평가 목록 조회
      const response = await getFinalEvaluations(employee.id).expect(200);

      // Then: 최신순으로 정렬되어야 함
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('finalEvaluations');
      expect(Array.isArray(response.body.finalEvaluations)).toBe(true);
      expect(response.body.finalEvaluations).toHaveLength(3);
      expect(response.body.finalEvaluations[0].period.name).toBe('2024년');
      expect(response.body.finalEvaluations[1].period.name).toBe('2023년');
      expect(response.body.finalEvaluations[2].period.name).toBe('2022년');
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 UUID: 잘못된 UUID 형식으로 요청 시 400 에러', async () => {
      // Given: 잘못된 UUID
      const invalidId = 'invalid-uuid';

      // When & Then: 400 에러
      await testSuite
        .request()
        .get(`/admin/dashboard/employees/${invalidId}/final-evaluations`)
        .expect(400);
    });

    it('존재하지 않는 직원: 존재하지 않는 직원 조회 시 404 에러', async () => {
      // Given: 존재하지 않는 직원 ID
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174999';

      // When & Then: 404 에러
      await testSuite
        .request()
        .get(`/admin/dashboard/employees/${nonExistentId}/final-evaluations`)
        .expect(404);
    });
  });

  describe('응답 구조 검증', () => {
    it('응답에 필요한 모든 필드가 포함되어야 함 (평가기간 정보 포함)', async () => {
      // Given: 최종평가 생성
      const employee = getRandomEmployee();
      const period = await createEvaluationPeriod({
        name: '2024년 상반기',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-06-30'),
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

      // When: 직원별 최종평가 목록 조회
      const response = await getFinalEvaluations(employee.id).expect(200);

      // Then: 응답 구조 검증
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('finalEvaluations');

      // 직원 정보 검증
      const employeeInfo = response.body.employee;
      expect(employeeInfo).toHaveProperty('id');
      expect(employeeInfo).toHaveProperty('name');
      expect(employeeInfo).toHaveProperty('employeeNumber');
      expect(employeeInfo).toHaveProperty('email');
      expect(employeeInfo).toHaveProperty('departmentName');
      expect(employeeInfo).toHaveProperty('rankName');
      expect(employeeInfo.id).toBe(employee.id);
      expect(employeeInfo.name).toBe(employee.name);

      // 최종평가 목록 검증
      expect(Array.isArray(response.body.finalEvaluations)).toBe(true);
      expect(response.body.finalEvaluations).toHaveLength(1);

      const evaluation = response.body.finalEvaluations[0];
      // 기본 필드
      expect(evaluation).toHaveProperty('id');
      expect(evaluation).toHaveProperty('period');
      // 평가기간 정보
      expect(evaluation.period).toHaveProperty('id');
      expect(evaluation.period).toHaveProperty('name');
      expect(evaluation.period).toHaveProperty('startDate');
      expect(evaluation.period).toHaveProperty('endDate');
      expect(evaluation.period.name).toBe('2024년 상반기');
      // 최종평가 정보
      expect(evaluation).toHaveProperty('evaluationGrade');
      expect(evaluation).toHaveProperty('jobGrade');
      expect(evaluation).toHaveProperty('jobDetailedGrade');
      expect(evaluation).toHaveProperty('finalComments');
      expect(evaluation).toHaveProperty('isConfirmed');
      expect(evaluation).toHaveProperty('confirmedAt');
      expect(evaluation).toHaveProperty('confirmedBy');
      expect(evaluation).toHaveProperty('createdAt');
      expect(evaluation).toHaveProperty('updatedAt');
    });
  });
});
