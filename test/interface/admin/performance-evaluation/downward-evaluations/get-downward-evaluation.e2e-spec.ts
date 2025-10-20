import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectDto } from '@domain/common/project/project.types';

/**
 * 하향평가 조회 E2E 테스트
 *
 * 테스트 대상:
 * - GET /admin/performance-evaluation/downward-evaluations/evaluator/:evaluatorId (평가자의 하향평가 목록 조회)
 * - GET /admin/performance-evaluation/downward-evaluations/:id (하향평가 상세정보 조회)
 */
describe('GET /admin/performance-evaluation/downward-evaluations - 조회', () => {
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

  // 헬퍼 함수
  const getRandomEmployee = () =>
    testData.employees[Math.floor(Math.random() * testData.employees.length)];
  const getRandomEvaluationPeriod = () =>
    testData.periods[Math.floor(Math.random() * testData.periods.length)];
  const getRandomProject = () =>
    testData.projects[Math.floor(Math.random() * testData.projects.length)];

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

    console.log('하향평가 조회 테스트 데이터 생성 완료:', {
      departments: testData.departments.length,
      employees: testData.employees.length,
      periods: testData.periods.length,
      projects: testData.projects.length,
    });
  });

  /**
   * 평가자의 하향평가 목록 조회 테스트
   */
  describe('평가자의 하향평가 목록 조회 (GET /evaluator/:evaluatorId)', () => {
    describe('성공 시나리오', () => {
      it('평가자의 모든 하향평가를 조회할 수 있어야 한다', async () => {
        // Given - 1차 및 2차 하향평가 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // 1차 하향평가 저장
        const primaryResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '우수한 업무 수행',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // 2차 하향평가 저장
        const secondaryResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '지속적인 성장',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // When - 평가자의 하향평가 목록 조회
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .expect(200);

        // Then - 응답 구조 검증
        expect(response.body).toHaveProperty('evaluations');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');

        // 목록 데이터 검증
        expect(Array.isArray(response.body.evaluations)).toBe(true);
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(2);
        expect(response.body.total).toBeGreaterThanOrEqual(2);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);

        // 첫 번째 평가 항목의 구조 검증
        const evaluation = response.body.evaluations[0];
        expect(evaluation).toHaveProperty('id');
        expect(evaluation).toHaveProperty('employeeId');
        expect(evaluation).toHaveProperty('evaluatorId');
        expect(evaluation).toHaveProperty('projectId');
        expect(evaluation).toHaveProperty('periodId');
        expect(evaluation).toHaveProperty('evaluationDate');
        expect(evaluation).toHaveProperty('evaluationType');
        expect(evaluation).toHaveProperty('isCompleted');
        expect(evaluation).toHaveProperty('createdAt');
        expect(evaluation).toHaveProperty('updatedAt');
        expect(evaluation).toHaveProperty('version');

        // 평가 타입 검증
        const evaluationTypes = response.body.evaluations.map(
          (e: any) => e.evaluationType,
        );
        expect(evaluationTypes).toContain('primary');
        expect(evaluationTypes).toContain('secondary');
      });

      it('evaluateeId 필터로 특정 피평가자의 평가만 조회할 수 있어야 한다', async () => {
        // Given - 여러 피평가자에 대한 평가 생성
        const evaluatee1 = getRandomEmployee();
        const evaluatee2 = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee1.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가1',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee2.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가2',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // When - evaluateeId로 필터링
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ evaluateeId: evaluatee1.id })
          .expect(200);

        // Then - evaluatee1에 대한 평가만 반환
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.employeeId).toBe(evaluatee1.id);
        });
      });

      it('periodId 필터로 특정 평가기간의 평가만 조회할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '기간별 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When - periodId로 필터링
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ periodId: period.id })
          .expect(200);

        // Then
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.periodId).toBe(period.id);
        });
      });

      it('projectId 필터로 특정 프로젝트의 평가만 조회할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '프로젝트별 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When - projectId로 필터링
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ projectId: project.id })
          .expect(200);

        // Then
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.projectId).toBe(project.id);
        });
      });

      it('evaluationType 필터로 1차 또는 2차 평가만 조회할 수 있어야 한다', async () => {
        // Given - 1차 및 2차 평가 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '1차 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 평가',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // When - primary만 조회
        const primaryResponse = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ evaluationType: 'primary' })
          .expect(200);

        // Then - primary만 반환
        expect(primaryResponse.body.evaluations.length).toBeGreaterThanOrEqual(
          1,
        );
        primaryResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluationType).toBe('primary');
        });

        // When - secondary만 조회
        const secondaryResponse = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ evaluationType: 'secondary' })
          .expect(200);

        // Then - secondary만 반환
        expect(
          secondaryResponse.body.evaluations.length,
        ).toBeGreaterThanOrEqual(1);
        secondaryResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluationType).toBe('secondary');
        });
      });

      it('isCompleted 필터로 완료/미완료 평가를 구분 조회할 수 있어야 한다', async () => {
        // Given - 평가 생성 및 제출
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // 미완료 평가
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '미완료 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // 완료 평가
        const evaluatee2 = getRandomEmployee();
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee2.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '완료 평가',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee2.id}/period/${period.id}/project/${project.id}/secondary/submit`,
          )
          .send({ evaluatorId: evaluator.id })
          .expect(200);

        // When - 미완료 평가만 조회
        const incompleteResponse = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ isCompleted: false })
          .expect(200);

        // Then
        expect(
          incompleteResponse.body.evaluations.length,
        ).toBeGreaterThanOrEqual(1);
        incompleteResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.isCompleted).toBe(false);
        });

        // When - 완료 평가만 조회
        const completedResponse = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ isCompleted: true })
          .expect(200);

        // Then
        expect(
          completedResponse.body.evaluations.length,
        ).toBeGreaterThanOrEqual(1);
        completedResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.isCompleted).toBe(true);
          expect(evaluation.completedAt).toBeDefined();
        });
      });

      it('페이지네이션이 올바르게 동작해야 한다', async () => {
        // Given - 여러 평가 생성
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // evaluator를 제외한 다른 직원들에 대해 평가 생성
        const evaluatees = testData.employees.filter(
          (emp) => emp.id !== evaluator.id,
        );

        for (const employee of evaluatees) {
          // 1차 평가
          await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/downward-evaluations/evaluatee/${employee.id}/period/${period.id}/project/${project.id}/primary`,
            )
            .send({
              evaluatorId: evaluator.id,
              downwardEvaluationContent: `${employee.name} 1차 평가`,
              downwardEvaluationScore: 5,
            })
            .expect(200);

          // 2차 평가
          await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/downward-evaluations/evaluatee/${employee.id}/period/${period.id}/project/${project.id}/secondary`,
            )
            .send({
              evaluatorId: evaluator.id,
              downwardEvaluationContent: `${employee.name} 2차 평가`,
              downwardEvaluationScore: 4,
            })
            .expect(200);
        }

        // When - 첫 페이지 조회 (limit=3)
        const page1Response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ page: 1, limit: 3 })
          .expect(200);

        // Then - 페이지네이션 구조 검증
        expect(page1Response.body).toHaveProperty('evaluations');
        expect(page1Response.body).toHaveProperty('total');
        expect(page1Response.body).toHaveProperty('page');
        expect(page1Response.body).toHaveProperty('limit');

        expect(page1Response.body.page).toBe(1);
        expect(page1Response.body.limit).toBe(3);
        expect(page1Response.body.total).toBeGreaterThanOrEqual(3);
        expect(page1Response.body.evaluations.length).toBeLessThanOrEqual(3);

        // When - 두 번째 페이지 조회
        const page2Response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ page: 2, limit: 3 })
          .expect(200);

        // Then - 페이지 번호와 limit이 올바르게 반환됨
        expect(page2Response.body.page).toBe(2);
        expect(page2Response.body.limit).toBe(3);
        expect(page2Response.body.total).toBe(page1Response.body.total); // total은 동일해야 함
      });

      it('복합 필터를 사용하여 조회할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '복합 필터 테스트',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When - 여러 필터 조합
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({
            evaluateeId: evaluatee.id,
            periodId: period.id,
            projectId: project.id,
            evaluationType: 'primary',
            isCompleted: false,
          })
          .expect(200);

        // Then
        expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.employeeId).toBe(evaluatee.id);
          expect(evaluation.periodId).toBe(period.id);
          expect(evaluation.projectId).toBe(project.id);
          expect(evaluation.evaluationType).toBe('primary');
          expect(evaluation.isCompleted).toBe(false);
        });
      });

      it('조건에 맞는 평가가 없을 때 빈 배열을 반환해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When - 평가가 없는 평가자로 조회
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.evaluations).toEqual([]);
        expect(response.body.total).toBe(0);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(10);
      });
    });

    describe('실패 시나리오', () => {
      it('잘못된 evaluatorId 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .get(
            '/admin/performance-evaluation/downward-evaluations/evaluator/invalid-uuid',
          )
          .expect(400);
      });

      it('잘못된 evaluateeId 필터로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ evaluateeId: 'invalid-uuid' })
          .expect(400);
      });

      it('잘못된 periodId 필터로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ periodId: 'invalid-uuid' })
          .expect(400);
      });

      it('잘못된 projectId 필터로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ projectId: 'invalid-uuid' })
          .expect(400);
      });

      it('잘못된 evaluationType 값으로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ evaluationType: 'invalid' })
          .expect(400);
      });

      it('page가 0 이하일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ page: 0 })
          .expect(400);
      });

      it('limit이 100을 초과할 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ limit: 101 })
          .expect(400);
      });
    });
  });

  /**
   * 하향평가 상세정보 조회 테스트
   */
  describe('하향평가 상세정보 조회 (GET /:id)', () => {
    describe('성공 시나리오', () => {
      it('하향평가 ID로 상세정보를 조회할 수 있어야 한다', async () => {
        // Given - 평가 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '상세 조회 테스트',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        const evaluationId = createResponse.body.id;

        // When - 상세정보 조회
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${evaluationId}`,
          )
          .expect(200);

        // Then - 모든 필드 검증
        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(evaluationId);

        // 관련 엔티티 객체 검증
        expect(response.body).toHaveProperty('employee');
        expect(response.body.employee).not.toBeNull();
        expect(response.body.employee.id).toBe(evaluatee.id);
        expect(response.body.employee.name).toBeDefined();
        expect(response.body.employee.employeeNumber).toBeDefined();
        expect(response.body.employee.email).toBeDefined();
        expect(response.body.employee.departmentId).toBeDefined();
        expect(response.body.employee.status).toBeDefined();

        expect(response.body).toHaveProperty('evaluator');
        expect(response.body.evaluator).not.toBeNull();
        expect(response.body.evaluator.id).toBe(evaluator.id);
        expect(response.body.evaluator.name).toBeDefined();
        expect(response.body.evaluator.employeeNumber).toBeDefined();
        expect(response.body.evaluator.email).toBeDefined();
        expect(response.body.evaluator.departmentId).toBeDefined();
        expect(response.body.evaluator.status).toBeDefined();

        expect(response.body).toHaveProperty('project');
        expect(response.body.project).not.toBeNull();
        expect(response.body.project.id).toBe(project.id);
        expect(response.body.project.name).toBeDefined();
        expect(response.body.project.code).toBeDefined();
        expect(response.body.project.status).toBeDefined();
        expect(response.body.project.startDate).toBeDefined();
        expect(response.body.project.endDate).toBeDefined();

        expect(response.body).toHaveProperty('period');
        expect(response.body.period).not.toBeNull();
        expect(response.body.period.id).toBe(period.id);
        expect(response.body.period.name).toBeDefined();
        expect(response.body.period.startDate).toBeDefined();
        expect(response.body.period.endDate).toBeDefined();
        expect(response.body.period.status).toBeDefined();

        expect(response.body).toHaveProperty('evaluationDate');
        expect(response.body.evaluationDate).toBeDefined();

        expect(response.body).toHaveProperty('downwardEvaluationContent');
        expect(response.body.downwardEvaluationContent).toBe(
          '상세 조회 테스트',
        );

        expect(response.body).toHaveProperty('downwardEvaluationScore');
        expect(response.body.downwardEvaluationScore).toBe(5);

        expect(response.body).toHaveProperty('evaluationType');
        expect(response.body.evaluationType).toBe('primary');

        expect(response.body).toHaveProperty('isCompleted');
        expect(response.body.isCompleted).toBe(false);

        expect(response.body).toHaveProperty('createdAt');
        expect(response.body.createdAt).toBeDefined();

        expect(response.body).toHaveProperty('updatedAt');
        expect(response.body.updatedAt).toBeDefined();

        expect(response.body).toHaveProperty('version');
        expect(typeof response.body.version).toBe('number');
      });

      it('1차 하향평가의 상세정보를 조회할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '1차 평가 상세',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.evaluationType).toBe('primary');
        expect(response.body.downwardEvaluationContent).toBe('1차 평가 상세');
      });

      it('2차 하향평가의 상세정보를 조회할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 평가 상세',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.evaluationType).toBe('secondary');
        expect(response.body.downwardEvaluationContent).toBe('2차 평가 상세');
      });

      it('완료된 평가는 completedAt이 포함되어야 한다', async () => {
        // Given - 평가 생성 및 제출
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '완료 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary/submit`,
          )
          .send({ evaluatorId: evaluator.id })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.isCompleted).toBe(true);
        expect(response.body.completedAt).toBeDefined();
        expect(response.body.completedAt).not.toBeNull();
      });

      it('미완료 평가는 completedAt이 null이어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '미완료 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then
        expect(response.body.isCompleted).toBe(false);
        expect(response.body.completedAt).toBeNull();
      });

      it('selfEvaluationId가 있는 경우 selfEvaluation 객체가 포함되어야 한다', async () => {
        // Given - selfEvaluationId 포함하여 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const selfEvaluationId = '550e8400-e29b-41d4-a716-446655440099';

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            selfEvaluationId: selfEvaluationId,
            downwardEvaluationContent: '자기평가 연결',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then - selfEvaluation 필드 존재 확인
        expect(response.body).toHaveProperty('selfEvaluation');
        // 실제 WbsSelfEvaluation이 없으면 null, 있으면 객체
        if (response.body.selfEvaluation !== null) {
          expect(response.body.selfEvaluation).toHaveProperty('id');
          expect(response.body.selfEvaluation).toHaveProperty('wbsItemId');
          expect(response.body.selfEvaluation).toHaveProperty(
            'performanceResult',
          );
          expect(response.body.selfEvaluation).toHaveProperty(
            'selfEvaluationContent',
          );
          expect(response.body.selfEvaluation).toHaveProperty(
            'selfEvaluationScore',
          );
          expect(response.body.selfEvaluation).toHaveProperty('isCompleted');
          expect(response.body.selfEvaluation).toHaveProperty('completedAt');
          expect(response.body.selfEvaluation).toHaveProperty('evaluationDate');
        }
      });

      it('타임스탬프 필드들이 올바르게 반환되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const createResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '타임스탬프 테스트',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // When
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${createResponse.body.id}`,
          )
          .expect(200);

        // Then - 날짜 형식 검증
        expect(response.body.evaluationDate).toBeDefined();
        expect(new Date(response.body.evaluationDate).toString()).not.toBe(
          'Invalid Date',
        );

        expect(response.body.createdAt).toBeDefined();
        expect(new Date(response.body.createdAt).toString()).not.toBe(
          'Invalid Date',
        );

        expect(response.body.updatedAt).toBeDefined();
        expect(new Date(response.body.updatedAt).toString()).not.toBe(
          'Invalid Date',
        );
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

        // When & Then
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/${nonExistentId}`,
          )
          .expect(404);
      });

      it('잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
        // When & Then
        await testSuite
          .request()
          .get(
            '/admin/performance-evaluation/downward-evaluations/invalid-uuid',
          )
          .expect(400);
      });
    });
  });
});
