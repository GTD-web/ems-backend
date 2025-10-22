import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectDto } from '@domain/common/project/project.types';

/**
 * 하향평가 제출 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/primary/submit (1차 하향평가 제출)
 * - POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/wbs/:wbsId/secondary/submit (2차 하향평가 제출)
 * - POST /admin/performance-evaluation/downward-evaluations/:id/submit (ID로 직접 제출)
 */
describe('POST /admin/performance-evaluation/downward-evaluations - 제출', () => {
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

    console.log('하향평가 제출 테스트 데이터 생성 완료:', {
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

  /**
   * 특정 직원과 다른 직원을 랜덤으로 선택
   */
  function getDifferentEmployee(excludeEmployee: EmployeeDto): EmployeeDto {
    const availableEmployees = testData.employees.filter(
      (emp) => emp.id !== excludeEmployee.id,
    );
    if (availableEmployees.length === 0) {
      throw new Error('다른 직원을 찾을 수 없습니다');
    }
    return availableEmployees[
      Math.floor(Math.random() * availableEmployees.length)
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
   * DB에서 하향평가 조회
   */
  async function getDownwardEvaluationFromDb(id: string): Promise<any> {
    const result = await dataSource.query(
      `SELECT * FROM downward_evaluation WHERE id = $1`,
      [id],
    );
    return result[0];
  }

  // ==================== 1차 하향평가 제출 테스트 ====================

  describe('1차 하향평가 제출 (POST /evaluatee/:evaluateeId/period/:periodId/project/:wbsId/primary/submit)', () => {
    describe('성공 시나리오', () => {
      it('저장된 1차 하향평가를 제출할 수 있어야 한다', async () => {
        // Given - 1차 하향평가 저장
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
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

        // When - 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({
            evaluatorId: evaluatorId,
            submittedBy: evaluator.id,
          })
          .expect(200);

        // Then - DB 검증
        const dbRecord = await getDownwardEvaluationFromDb(evaluationId);
        expect(dbRecord).toBeDefined();
        expect(dbRecord.isCompleted).toBe(true);
      });

      it('제출 시 isCompleted가 true로 변경되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
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

        // 제출 전 확인
        const beforeSubmit = await getDownwardEvaluationFromDb(evaluationId);
        expect(beforeSubmit.isCompleted).toBe(false);

        // When - 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(200);

        // Then
        const afterSubmit = await getDownwardEvaluationFromDb(evaluationId);
        expect(afterSubmit.isCompleted).toBe(true);
      });

      it('submittedBy 없이도 제출 가능해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
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
            downwardEvaluationScore: 3,
          },
        );

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(200);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 평가를 제출하면 404 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);
        const evaluator = getRandomEmployee();

        // When & Then - 저장하지 않고 바로 제출 시도
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({ evaluatorId: evaluator.id })
          .expect(404);
      });

      it('이미 제출된 평가를 재제출하면 409 에러가 발생해야 한다', async () => {
        // Given - 평가 저장
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
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
            downwardEvaluationScore: 3,
          },
        );

        // 첫 번째 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(200);

        // When & Then - 두 번째 제출 시도
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(409);
      });

      it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);
        const invalidEvaluateeId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${invalidEvaluateeId}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({})
          .expect(400);
      });

      it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${invalidPeriodId}/wbs/${wbs.id}/primary/submit`,
          )
          .send({})
          .expect(400);
      });

      it('잘못된 형식의 wbsId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const invalidProjectId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${invalidProjectId}/primary/submit`,
          )
          .send({})
          .expect(400);
      });
    });
  });

  // ==================== 2차 하향평가 제출 테스트 ====================

  describe('2차 하향평가 제출 (POST /evaluatee/:evaluateeId/period/:periodId/project/:wbsId/secondary/submit)', () => {
    describe('성공 시나리오', () => {
      it('저장된 2차 하향평가를 제출할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
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
              downwardEvaluationScore: 4,
            },
          );

        // When
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(200);

        // Then
        const dbRecord = await getDownwardEvaluationFromDb(evaluationId);
        expect(dbRecord.isCompleted).toBe(true);
      });

      it('1차와 2차 하향평가를 독립적으로 제출할 수 있어야 한다', async () => {
        // Given - 동일한 평가자/피평가자에 대해 1차, 2차 평가 저장
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: primaryId, evaluatorId: primaryEvaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'primary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '1차 평가',
              downwardEvaluationScore: 4,
            },
          );

        const { id: secondaryId, evaluatorId: secondaryEvaluatorId } =
          await upsertDownwardEvaluation(
            evaluatee.id,
            period.id,
            wbs.id,
            'secondary',
            {
              evaluatorId: evaluator.id,
              downwardEvaluationContent: '2차 평가',
              downwardEvaluationScore: 3,
            },
          );

        // When - 1차만 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/primary/submit`,
          )
          .send({ evaluatorId: primaryEvaluatorId })
          .expect(200);

        // Then - 1차는 제출됨, 2차는 제출 안됨
        const primaryRecord = await getDownwardEvaluationFromDb(primaryId);
        const secondaryRecord = await getDownwardEvaluationFromDb(secondaryId);

        expect(primaryRecord.isCompleted).toBe(true);
        expect(secondaryRecord.isCompleted).toBe(false);

        // When - 2차 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/submit`,
          )
          .send({ evaluatorId: secondaryEvaluatorId })
          .expect(200);

        // Then - 2차도 제출됨
        const secondaryRecordAfter =
          await getDownwardEvaluationFromDb(secondaryId);
        expect(secondaryRecordAfter.isCompleted).toBe(true);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 2차 평가를 제출하면 404 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);
        const evaluator = getRandomEmployee();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/submit`,
          )
          .send({ evaluatorId: evaluator.id })
          .expect(404);
      });

      it('이미 제출된 2차 평가를 재제출하면 409 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
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
            downwardEvaluationContent: '2차 평가',
            downwardEvaluationScore: 5,
          },
        );

        // 첫 번째 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(200);

        // When & Then - 두 번째 제출 시도
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/wbs/${wbs.id}/secondary/submit`,
          )
          .send({ evaluatorId: evaluatorId })
          .expect(409);
      });
    });
  });

  // ==================== ID로 직접 제출 테스트 ====================

  describe('하향평가 제출 (POST /:id/submit)', () => {
    describe('성공 시나리오', () => {
      it('1차 하향평가 ID로 직접 제출할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId } = await upsertDownwardEvaluation(
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

        // When
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // Then
        const dbRecord = await getDownwardEvaluationFromDb(evaluationId);
        expect(dbRecord.isCompleted).toBe(true);
      });

      it('2차 하향평가 ID로 직접 제출할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId } = await upsertDownwardEvaluation(
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

        // When
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // Then
        const dbRecord = await getDownwardEvaluationFromDb(evaluationId);
        expect(dbRecord.isCompleted).toBe(true);
        expect(dbRecord.evaluationType).toBe('secondary');
      });

      it('평가 타입에 관계없이 ID만으로 제출 가능해야 한다', async () => {
        // Given - 1차, 2차 평가 각각 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: primaryId } = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '1차 내용',
            downwardEvaluationScore: 3,
          },
        );

        const { id: secondaryId } = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          wbs.id,
          'secondary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 내용',
            downwardEvaluationScore: 4,
          },
        );

        // When - ID로 직접 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${primaryId}/submit`,
          )
          .send({})
          .expect(200);

        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${secondaryId}/submit`,
          )
          .send({})
          .expect(200);

        // Then
        const primaryRecord = await getDownwardEvaluationFromDb(primaryId);
        const secondaryRecord = await getDownwardEvaluationFromDb(secondaryId);

        expect(primaryRecord.isCompleted).toBe(true);
        expect(secondaryRecord.isCompleted).toBe(true);
      });
    });

    describe('실패 시나리오', () => {
      it('존재하지 않는 ID로 제출하면 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '550e8400-e29b-41d4-a716-446655440999';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${nonExistentId}/submit`,
          )
          .send({})
          .expect(404);
      });

      it('잘못된 UUID 형식으로 제출하면 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${invalidId}/submit`,
          )
          .send({})
          .expect(400);
      });

      it('이미 제출된 평가를 ID로 재제출하면 409 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getDifferentEmployee(evaluatee);
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const wbs = await getWbsFromProject(project.id);

        const { id: evaluationId } = await upsertDownwardEvaluation(
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

        // 첫 번째 제출
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(200);

        // When & Then - 두 번째 제출 시도
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
          )
          .send({})
          .expect(409);
      });
    });
  });

  // ==================== 데이터 무결성 검증 ====================

  describe('제출 데이터 무결성 시나리오', () => {
    it('제출 후 평가 내용과 점수는 변경되지 않아야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getDifferentEmployee(evaluatee);
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();
      const wbs = await getWbsFromProject(project.id);

      const content = '중요한 평가 내용';
      const score = 5;

      const { id: evaluationId } = await upsertDownwardEvaluation(
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

      // When - 제출
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
        )
        .send({})
        .expect(200);

      // Then - 평가 내용과 점수는 그대로 유지
      const dbRecord = await getDownwardEvaluationFromDb(evaluationId);
      expect(dbRecord.downwardEvaluationContent).toBe(content);
      expect(dbRecord.downwardEvaluationScore).toBe(score);
      expect(dbRecord.isCompleted).toBe(true);
    });

    it('제출 후 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getDifferentEmployee(evaluatee);
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();
      const wbs = await getWbsFromProject(project.id);

      const { id: evaluationId } = await upsertDownwardEvaluation(
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

      const beforeSubmit = await getDownwardEvaluationFromDb(evaluationId);
      const updatedAtBefore = new Date(beforeSubmit.updatedAt);

      // 시간 차이를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When - 제출
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
        )
        .send({})
        .expect(200);

      // Then
      const afterSubmit = await getDownwardEvaluationFromDb(evaluationId);
      const updatedAtAfter = new Date(afterSubmit.updatedAt);

      expect(updatedAtAfter.getTime()).toBeGreaterThan(
        updatedAtBefore.getTime(),
      );
    });

    it('제출 후 createdAt은 변경되지 않아야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getDifferentEmployee(evaluatee);
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();
      const wbs = await getWbsFromProject(project.id);

      const { id: evaluationId } = await upsertDownwardEvaluation(
        evaluatee.id,
        period.id,
        wbs.id,
        'primary',
        {
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '평가 내용',
          downwardEvaluationScore: 3,
        },
      );

      const beforeSubmit = await getDownwardEvaluationFromDb(evaluationId);
      const createdAtBefore = new Date(beforeSubmit.createdAt).getTime();

      // When - 제출
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/${evaluationId}/submit`,
        )
        .send({})
        .expect(200);

      // Then
      const afterSubmit = await getDownwardEvaluationFromDb(evaluationId);
      const createdAtAfter = new Date(afterSubmit.createdAt).getTime();

      // 50ms 이내 오차 허용 (DB 타임스탬프 정밀도 차이)
      expect(Math.abs(createdAtAfter - createdAtBefore)).toBeLessThan(50);
    });
  });
});
