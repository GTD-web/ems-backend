import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectDto } from '@domain/common/project/project.types';

/**
 * 동료평가 요청 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/peer-evaluations (단일 동료평가 요청)
 * - POST /admin/performance-evaluation/peer-evaluations/request/multiple-evaluators (한 명의 피평가자를 여러 평가자에게 요청)
 * - POST /admin/performance-evaluation/peer-evaluations/request/multiple-evaluatees (한 명의 평가자가 여러 피평가자를 평가하도록 요청)
 */
describe('POST /admin/performance-evaluation/peer-evaluations - 동료평가 요청', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    departments: DepartmentDto[];
    employees: EmployeeDto[];
    periods: EvaluationPeriodDto[];
    projects: ProjectDto[];
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

    // 완전한 테스트 환경 생성
    const { departments, employees, periods, projects } =
      await testContextService.완전한_테스트환경을_생성한다();

    testData = {
      departments,
      employees,
      periods,
      projects,
    };

    console.log('동료평가 요청 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      periods: testData.periods.length,
      projects: testData.projects.length,
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

  // ==================== 단일 동료평가 요청 테스트 ====================

  describe('단일 동료평가 요청 (POST /requests)', () => {
    describe('성공 케이스', () => {
      it('동료평가를 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('성공적으로 요청');
      });

      it('requestedBy를 포함하여 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const requestedBy = getRandomEmployee().id;

        // When
        const response = await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id,
            periodId: period.id,
            requestedBy,
          })
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body.message).toContain('성공적으로 요청');
      });

      it('requestedBy 없이도 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
      });

      it('동일한 조건으로 여러 번 요청하면 중복이 생성되지 않아야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When - 첫 번째 요청
        const response1 = await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // When - 두 번째 요청 (동일 조건)
        const response2 = await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // Then - 같은 ID 반환 (중복 생성 없음)
        expect(response1.body.id).toBe(response2.body.id);
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 evaluatorId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: 'invalid-uuid',
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(400);
      });

      it('잘못된 evaluateeId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: 'invalid-uuid',
            periodId: period.id,
          })
          .expect(400);
      });

      it('잘못된 periodId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatee = getRandomEmployee();

        // When & Then
        await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: evaluator.id,
            evaluateeId: evaluatee.id,
            periodId: 'invalid-uuid',
          })
          .expect(400);
      });

      it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();

        // When & Then - evaluatorId 누락
        await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluateeId: getRandomEmployee().id,
            periodId: period.id,
          })
          .expect(400);

        // When & Then - evaluateeId 누락
        await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: getRandomEmployee().id,
            periodId: period.id,
          })
          .expect(400);

        // When & Then - periodId 누락
        await request(app.getHttpServer())
          .post('/admin/performance-evaluation/peer-evaluations/requests')
          .send({
            evaluatorId: getRandomEmployee().id,
            evaluateeId: getRandomEmployee().id,
          })
          .expect(400);
      });
    });
  });

  // ==================== 여러 평가자에게 요청 테스트 ====================

  describe('한 명의 피평가자를 여러 평가자에게 요청 (POST /requests/bulk/one-evaluatee-to-many-evaluators)', () => {
    describe('성공 케이스', () => {
      it('한 명의 피평가자를 여러 평가자에게 요청할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluators = [
          testData.employees[0].id,
          testData.employees[1].id,
          testData.employees[2].id,
        ];
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: evaluators,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('ids');
        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('message');
        expect(response.body.count).toBe(3);
        expect(response.body.ids).toHaveLength(3);
        expect(response.body.message).toContain('3건');
      });

      it('requestedBy를 포함하여 요청할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluators = [testData.employees[0].id, testData.employees[1].id];
        const period = getRandomEvaluationPeriod();
        const requestedBy = getRandomEmployee().id;

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: evaluators,
            evaluateeId: evaluatee.id,
            periodId: period.id,
            requestedBy,
          })
          .expect(201);

        // Then
        expect(response.body.count).toBe(2);
      });

      it('단일 평가자만 포함하여 요청할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluators = [testData.employees[0].id];
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: evaluators,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body.count).toBe(1);
        expect(response.body.ids).toHaveLength(1);
      });

      it('많은 수의 평가자에게 요청할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluators = testData.employees.map((emp) => emp.id);
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: evaluators,
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body.count).toBe(testData.employees.length);
      });
    });

    describe('실패 케이스', () => {
      it('evaluatorIds가 빈 배열이면 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: [],
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(400);
      });

      it('evaluatorIds에 잘못된 UUID가 포함되면 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: ['invalid-uuid', testData.employees[0].id],
            evaluateeId: evaluatee.id,
            periodId: period.id,
          })
          .expect(400);
      });

      it('잘못된 evaluateeId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: [testData.employees[0].id],
            evaluateeId: 'invalid-uuid',
            periodId: period.id,
          })
          .expect(400);
      });

      it('잘못된 periodId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
          )
          .send({
            evaluatorIds: [testData.employees[0].id],
            evaluateeId: evaluatee.id,
            periodId: 'invalid-uuid',
          })
          .expect(400);
      });
    });
  });

  // ==================== 여러 피평가자에게 요청 테스트 ====================

  describe('한 명의 평가자가 여러 피평가자를 평가하도록 요청 (POST /requests/bulk/one-evaluator-to-many-evaluatees)', () => {
    describe('성공 케이스', () => {
      it('한 명의 평가자가 여러 피평가자를 평가하도록 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatees = [
          testData.employees[0].id,
          testData.employees[1].id,
          testData.employees[2].id,
        ];
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: evaluatees,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('ids');
        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('message');
        expect(response.body.count).toBe(3);
        expect(response.body.ids).toHaveLength(3);
        expect(response.body.message).toContain('3건');
      });

      it('requestedBy를 포함하여 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatees = [testData.employees[0].id, testData.employees[1].id];
        const period = getRandomEvaluationPeriod();
        const requestedBy = getRandomEmployee().id;

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: evaluatees,
            periodId: period.id,
            requestedBy,
          })
          .expect(201);

        // Then
        expect(response.body.count).toBe(2);
      });

      it('단일 피평가자만 포함하여 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatees = [testData.employees[0].id];
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: evaluatees,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body.count).toBe(1);
        expect(response.body.ids).toHaveLength(1);
      });

      it('많은 수의 피평가자를 요청할 수 있어야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const evaluatees = testData.employees.map((emp) => emp.id);
        const period = getRandomEvaluationPeriod();

        // When
        const response = await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: evaluatees,
            periodId: period.id,
          })
          .expect(201);

        // Then
        expect(response.body.count).toBe(testData.employees.length);
      });
    });

    describe('실패 케이스', () => {
      it('evaluateeIds가 빈 배열이면 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: [],
            periodId: period.id,
          })
          .expect(400);
      });

      it('evaluateeIds에 잘못된 UUID가 포함되면 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: ['invalid-uuid', testData.employees[0].id],
            periodId: period.id,
          })
          .expect(400);
      });

      it('잘못된 evaluatorId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: 'invalid-uuid',
            evaluateeIds: [testData.employees[0].id],
            periodId: period.id,
          })
          .expect(400);
      });

      it('잘못된 periodId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await request(app.getHttpServer())
          .post(
            '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
          )
          .send({
            evaluatorId: evaluator.id,
            evaluateeIds: [testData.employees[0].id],
            periodId: 'invalid-uuid',
          })
          .expect(400);
      });
    });
  });
});
