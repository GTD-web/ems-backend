import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectDto } from '@domain/common/project/project.types';

/**
 * 하향평가 초기화(미제출 상태 변경) E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:wbsId/primary/reset (1차 하향평가 미제출 상태 변경)
 * - POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:wbsId/secondary/reset (2차 하향평가 미제출 상태 변경)
 */
describe('POST /admin/performance-evaluation/downward-evaluations - 미제출 상태 변경', () => {
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

    console.log('하향평가 초기화 테스트 데이터 생성 완료:', {
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

  function getRandomProject(): ProjectDto {
    // WBS는 첫 번째 프로젝트에만 생성되므로 첫 번째 프로젝트 반환
    return testData.projects[0];
  }

  /**
   * 프로젝트에서 WBS를 가져오는 헬퍼 함수
   */
  async function getWbsFromProject(projectId: string): Promise<any> {
    const result = await dataSource.query(
      `SELECT * FROM wbs_item WHERE "projectId" = $1 AND "deletedAt" IS NULL LIMIT 1`,
      [projectId],
    );
    return result[0];
  }

  /**
   * 하향평가 저장 헬퍼 (Upsert)
   */
  async function upsertDownwardEvaluation(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluationType: 'primary' | 'secondary',
    data: {
      evaluatorId?: string;
      selfEvaluationId?: string;
      downwardEvaluationContent?: string;
      downwardEvaluationScore?: number;
      createdBy?: string;
    } = {},
  ): Promise<{ id: string; evaluatorId: string }> {
    const response = await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/wbs/${wbsId}/${evaluationType}`,
      )
      .send(data)
      .expect(200);

    return {
      id: response.body.id,
      evaluatorId: response.body.evaluatorId,
    };
  }

  /**
   * 하향평가 제출 헬퍼
   */
  async function submitDownwardEvaluation(
    evaluateeId: string,
    periodId: string,
    wbsId: string,
    evaluationType: 'primary' | 'secondary',
    evaluatorId: string,
  ): Promise<void> {
    await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/wbs/${wbsId}/${evaluationType}/submit`,
      )
      .send({
        evaluatorId: evaluatorId,
      })
      .expect(200);
  }

  /**
   * DB에서 하향평가 조회
   */
  async function getDownwardEvaluationFromDb(id: string): Promise<any> {
    const result = await dataSource.query(
      `SELECT * FROM downward_evaluation WHERE id = $1`,
      [id],
    );
    return result[0];
  }

  // ==================== 1차 하향평가 미제출 상태 변경 테스트 ====================

  describe('1차 하향평가 미제출 상태 변경 (POST /evaluatee/:evaluateeId/period/:periodId/project/:wbsId/primary/reset)', () => {
    describe('성공 시나리오', () => {
      it('제출된 1차 하향평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
        // Given - 1차 하향평가 저장 및 제출
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '우수한 성과입니다.',
              downwardEvaluationScore: 5,
            },
          );

        // 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        // 제출 상태 확인
        const beforeReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(beforeReset.isCompleted).toBe(true);

        // When - 미제출 상태로 변경
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        // Then - DB 검증
        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterReset).toBeDefined();
        expect(afterReset.isCompleted).toBe(false);
      });

      it('초기화 시 isCompleted가 false로 변경되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '평가 내용',
              downwardEvaluationScore: 4,
            },
          );

        // 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        // When - 초기화
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        // Then
        const dbRecord = await getDownwardEvaluationFromDb(evaluationId);
        expect(dbRecord.isCompleted).toBe(false);
      });

      it('초기화 후에도 평가 내용과 점수는 유지되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const content = '우수한 업무 수행 능력';
        const score = 5;

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: content,
              downwardEvaluationScore: score,
            },
          );

        // 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        const beforeReset = await getDownwardEvaluationFromDb(evaluationId);

        // When - 초기화
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        // Then - 평가 내용 및 점수 유지 확인
        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterReset.downwardEvaluationContent).toBe(content);
        expect(afterReset.downwardEvaluationScore).toBe(score);
        expect(afterReset.evaluatorId).toBe(beforeReset.evaluatorId);
        expect(afterReset.employeeId).toBe(beforeReset.employeeId);
      });

      it('초기화 후 다시 제출할 수 있어야 한다', async () => {
        // Given - 저장, 제출, 초기화
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '평가 내용',
              downwardEvaluationScore: 4,
            },
          );

        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterReset.isCompleted).toBe(false);

        // When - 다시 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        // Then
        const afterResubmit = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterResubmit.isCompleted).toBe(true);
      });

      it('초기화 시 updatedAt이 갱신되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '평가 내용',
              downwardEvaluationScore: 4,
            },
          );

        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        const beforeReset = await getDownwardEvaluationFromDb(evaluationId);

        // 약간의 시간 경과를 보장
        await new Promise((resolve) => setTimeout(resolve, 100));

        // When
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        // Then
        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(new Date(afterReset.updatedAt).getTime()).toBeGreaterThan(
          new Date(beforeReset.updatedAt).getTime(),
        );
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 평가를 초기화하려고 하면 404 에러를 반환해야 한다', async () => {
        // Given - 존재하지 않는 ID들
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        // When & Then
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluator.id,
          })
          .expect(404);

        expect(response.body.message).toContain('찾을 수 없습니다');
      });

      it('미제출 상태인 평가를 초기화하려고 하면 400 에러를 반환해야 한다', async () => {
        // Given - 저장만 하고 제출하지 않음
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { evaluatorId } = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 4,
          },
        );

        // When & Then - 제출하지 않은 평가를 초기화하려고 시도
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(400);

        expect(response.body.message).toContain('완료되지 않은');
      });

      it('잘못된 evaluateeId UUID 형식이면 400 에러를 반환해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/invalid-uuid/period/${period.id}/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluator.id,
          })
          .expect(400);
      });

      it('잘못된 periodId UUID 형식이면 400 에러를 반환해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/invalid-uuid/wbs/${wbs.id}/primary/reset`,
          )
          .send({
            evaluatorId: evaluator.id,
          })
          .expect(400);
      });

      it('잘못된 wbsId UUID 형식이면 400 에러를 반환해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/invalid-uuid/primary/reset`,
          )
          .send({
            evaluatorId: evaluator.id,
          })
          .expect(400);
      });
    });
  });

  // ==================== 2차 하향평가 미제출 상태 변경 테스트 ====================

  describe('2차 하향평가 미제출 상태 변경 (POST /evaluatee/:evaluateeId/period/:periodId/project/:wbsId/secondary/reset)', () => {
    describe('성공 시나리오', () => {
      it('제출된 2차 하향평가를 미제출 상태로 변경할 수 있어야 한다', async () => {
        // Given - 2차 하향평가 저장 및 제출
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'secondary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '우수한 성과입니다.',
              downwardEvaluationScore: 5,
            },
          );

        // 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          evaluatorId,
        );

        // 제출 상태 확인
        const beforeReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(beforeReset.isCompleted).toBe(true);

        // When - 미제출 상태로 변경
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        // Then - DB 검증
        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterReset).toBeDefined();
        expect(afterReset.isCompleted).toBe(false);
      });

      it('2차 하향평가 초기화 후에도 평가 내용과 점수는 유지되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const content = '2차 평가 내용';
        const score = 4;

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'secondary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: content,
              downwardEvaluationScore: score,
            },
          );

        // 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          evaluatorId,
        );

        const beforeReset = await getDownwardEvaluationFromDb(evaluationId);

        // When - 초기화
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        // Then - 평가 내용 및 점수 유지 확인
        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterReset.downwardEvaluationContent).toBe(content);
        expect(afterReset.downwardEvaluationScore).toBe(score);
        expect(afterReset.evaluationType).toBe('secondary');
      });

      it('1차와 2차 하향평가를 독립적으로 초기화할 수 있어야 한다', async () => {
        // Given - 같은 조건으로 1차와 2차 평가 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        // 1차 평가 저장 및 제출
        const { id: primaryId, evaluatorId: primaryEvaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '1차 평가',
              downwardEvaluationScore: 5,
            },
          );
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          primaryEvaluatorId,
        );

        // 2차 평가 저장 및 제출
        const { id: secondaryId, evaluatorId: secondaryEvaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'secondary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '2차 평가',
              downwardEvaluationScore: 4,
            },
          );
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          secondaryEvaluatorId,
        );

        // When - 2차만 초기화
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: secondaryEvaluatorId,
          })
          .expect(200);

        // Then - 1차는 제출 상태 유지, 2차는 미제출 상태
        const primaryAfter = await getDownwardEvaluationFromDb(primaryId);
        const secondaryAfter = await getDownwardEvaluationFromDb(secondaryId);

        expect(primaryAfter.isCompleted).toBe(true); // 1차는 제출 상태 유지
        expect(secondaryAfter.isCompleted).toBe(false); // 2차는 미제출 상태
      });

      it('2차 하향평가 초기화 후 다시 제출할 수 있어야 한다', async () => {
        // Given - 저장, 제출, 초기화
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId, evaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'secondary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '2차 평가 내용',
              downwardEvaluationScore: 3,
            },
          );

        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          evaluatorId,
        );

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(200);

        const afterReset = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterReset.isCompleted).toBe(false);

        // When - 다시 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          evaluatorId,
        );

        // Then
        const afterResubmit = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterResubmit.isCompleted).toBe(true);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 2차 평가를 초기화하려고 하면 404 에러를 반환해야 한다', async () => {
        // Given - 존재하지 않는 ID들
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        // When & Then
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: evaluator.id,
          })
          .expect(404);

        expect(response.body.message).toContain('찾을 수 없습니다');
      });

      it('미제출 상태인 2차 평가를 초기화하려고 하면 400 에러를 반환해야 한다', async () => {
        // Given - 저장만 하고 제출하지 않음
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { evaluatorId } = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 평가 내용',
            downwardEvaluationScore: 4,
          },
        );

        // When & Then - 제출하지 않은 평가를 초기화하려고 시도
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: evaluatorId,
          })
          .expect(400);

        expect(response.body.message).toContain('완료되지 않은');
      });

      it('잘못된 UUID 형식으로 요청하면 400 에러를 반환해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/invalid-uuid/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
          )
          .send({
            evaluatorId: evaluator.id,
          })
          .expect(400);
      });
    });
  });

  // ==================== 통합 시나리오 테스트 ====================

  describe('통합 시나리오', () => {
    it('1차와 2차를 각각 초기화하고 다시 제출하는 전체 플로우가 정상 동작해야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();
      const wbs = await getWbsFromProject(project.id);

      // 1차 평가 저장 및 제출
      const { id: primaryId, evaluatorId: primaryEvaluatorId } =
        await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '1차 평가',
            downwardEvaluationScore: 5,
          },
        );
      await submitDownwardEvaluation(
        evaluatee.id,
        period.id,
        wbs.id,
        'primary',
        primaryEvaluatorId,
      );

      // 2차 평가 저장 및 제출
      const { id: secondaryId, evaluatorId: secondaryEvaluatorId } =
        await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 평가',
            downwardEvaluationScore: 4,
          },
        );
      await submitDownwardEvaluation(
        evaluatee.id,
        period.id,
        wbs.id,
        'secondary',
        secondaryEvaluatorId,
      );

      // When - 1차 초기화
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        })
        .expect(200);

      // Then - 1차는 미제출, 2차는 제출 상태
      let primaryState = await getDownwardEvaluationFromDb(primaryId);
      let secondaryState = await getDownwardEvaluationFromDb(secondaryId);
      expect(primaryState.isCompleted).toBe(false);
      expect(secondaryState.isCompleted).toBe(true);

      // When - 2차 초기화
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/reset`,
        )
        .send({
          evaluatorId: secondaryEvaluatorId,
        })
        .expect(200);

      // Then - 둘 다 미제출 상태
      primaryState = await getDownwardEvaluationFromDb(primaryId);
      secondaryState = await getDownwardEvaluationFromDb(secondaryId);
      expect(primaryState.isCompleted).toBe(false);
      expect(secondaryState.isCompleted).toBe(false);

      // When - 1차 다시 제출
      await submitDownwardEvaluation(
        evaluatee.id,
        period.id,
        wbs.id,
        'primary',
        primaryEvaluatorId,
      );

      // When - 2차 다시 제출
      await submitDownwardEvaluation(
        evaluatee.id,
        period.id,
        wbs.id,
        'secondary',
        secondaryEvaluatorId,
      );

      // Then - 둘 다 제출 상태
      primaryState = await getDownwardEvaluationFromDb(primaryId);
      secondaryState = await getDownwardEvaluationFromDb(secondaryId);
      expect(primaryState.isCompleted).toBe(true);
      expect(secondaryState.isCompleted).toBe(true);
    });

    it('여러 번 초기화와 제출을 반복해도 정상 동작해야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();
      const wbs = await getWbsFromProject(project.id);

      const { id: evaluationId, evaluatorId } = await upsertDownwardEvaluation(
        evaluatee.id,
        period.id,
        wbs.id,
        'primary',
        {
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '평가 내용',
          downwardEvaluationScore: 5,
        },
      );

      // 3번 반복: 제출 -> 초기화 -> 제출 -> 초기화 -> 제출
      for (let i = 0; i < 3; i++) {
        // 제출
        await submitDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          evaluatorId,
        );

        let state = await getDownwardEvaluationFromDb(evaluationId);
        expect(state.isCompleted).toBe(true);

        // 마지막 반복이 아니면 초기화
        if (i < 2) {
          await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/reset`,
            )
            .send({
              evaluatorId: evaluatorId,
            })
            .expect(200);

          state = await getDownwardEvaluationFromDb(evaluationId);
          expect(state.isCompleted).toBe(false);
        }
      }

      // Then - 최종적으로 제출 상태
      const finalState = await getDownwardEvaluationFromDb(evaluationId);
      expect(finalState.isCompleted).toBe(true);
    });
  });
});
