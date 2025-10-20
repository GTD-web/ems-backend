import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { DepartmentDto } from '@domain/common/department/department.types';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { ProjectDto } from '@domain/common/project/project.types';

/**
 * 하향평가 저장 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:projectId/primary (1차 하향평가 저장)
 * - POST /admin/performance-evaluation/downward-evaluations/evaluatee/:evaluateeId/period/:periodId/project/:projectId/secondary (2차 하향평가 저장)
 */
describe('POST /admin/performance-evaluation/downward-evaluations - 저장', () => {
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

    console.log('하향평가 저장 테스트 데이터 생성 완료:', {
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
    return testData.projects[
      Math.floor(Math.random() * testData.projects.length)
    ];
  }

  /**
   * 하향평가 저장 헬퍼 (Upsert)
   */
  async function upsertDownwardEvaluation(
    evaluateeId: string,
    periodId: string,
    projectId: string,
    evaluationType: 'primary' | 'secondary',
    data: {
      evaluatorId?: string;
      selfEvaluationId?: string;
      downwardEvaluationContent?: string;
      downwardEvaluationScore?: number;
      createdBy?: string;
    },
  ): Promise<any> {
    const response = await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluateeId}/period/${periodId}/project/${projectId}/${evaluationType}`,
      )
      .send(data)
      .expect(200);

    return response.body;
  }

  /**
   * 하향평가 조회 헬퍼 (DB에서 직접)
   */
  async function getDownwardEvaluationFromDb(
    evaluationId: string,
  ): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM downward_evaluation WHERE id = $1`,
      [evaluationId],
    );
    return result[0];
  }

  // ==================== 1차 하향평가 저장 ====================

  describe('1차 하향평가 저장 (POST /evaluatee/:evaluateeId/period/:periodId/project/:projectId/primary)', () => {
    describe('성공 시나리오', () => {
      it('신규 1차 하향평가를 생성할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const createdBy = getRandomEmployee().id;

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent:
              '팀원의 업무 수행 능력이 매우 우수합니다.',
            downwardEvaluationScore: 5,
            createdBy,
          })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.message).toContain('1차 하향평가');
        expect(response.body.message).toContain('저장');

        // DB 검증
        const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
        expect(dbRecord).toBeDefined();
        expect(dbRecord.employeeId).toBe(evaluatee.id);
        expect(dbRecord.evaluatorId).toBe(evaluator.id);
        expect(dbRecord.periodId).toBe(period.id);
        expect(dbRecord.projectId).toBe(project.id);
        expect(dbRecord.evaluationType).toBe('primary');
        expect(dbRecord.downwardEvaluationContent).toBe(
          '팀원의 업무 수행 능력이 매우 우수합니다.',
        );
        expect(dbRecord.downwardEvaluationScore).toBe(5);
        expect(dbRecord.isCompleted).toBe(false);
      });

      it('기존 1차 하향평가를 수정할 수 있어야 한다 (Upsert)', async () => {
        // Given - 먼저 하향평가 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const firstSave = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          project.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '초기 평가 내용',
            downwardEvaluationScore: 3,
          },
        );

        // 약간의 시간 차이를 보장
        await new Promise((resolve) => setTimeout(resolve, 100));

        // When - 동일한 조합으로 다시 저장 (수정)
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '수정된 평가 내용',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // Then
        expect(response.body.id).toBe(firstSave.id); // 동일한 ID

        // DB 검증
        const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
        expect(dbRecord.downwardEvaluationContent).toBe('수정된 평가 내용');
        expect(dbRecord.downwardEvaluationScore).toBe(5);
      });

      it('자기평가 ID를 포함하여 1차 하향평가를 생성할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const selfEvaluationId = '550e8400-e29b-41d4-a716-446655440099';

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            selfEvaluationId,
            downwardEvaluationContent: '자기평가를 참고한 하향평가',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // Then
        const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
        expect(dbRecord.selfEvaluationId).toBe(selfEvaluationId);
      });

      it('평가 내용 없이 1차 하향평가를 생성할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // Then
        expect(response.body.id).toBeDefined();
      });

      it('다양한 평가 점수를 저장할 수 있어야 한다', async () => {
        // Given
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then - 다양한 양의 정수로 테스트
        // 각 점수마다 다른 evaluatee와 evaluator를 사용하여 충돌 방지
        const testScores = [1, 5, 10, 50, 100, 120];
        for (const score of testScores) {
          const evaluatee = getRandomEmployee();
          const evaluator = getRandomEmployee();
          const response = await testSuite
            .request()
            .post(
              `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
            )
            .send({
              evaluatorId: evaluator.id,
              downwardEvaluationContent: `점수 ${score}점 테스트`,
              downwardEvaluationScore: score,
            })
            .expect(200);

          const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
          expect(dbRecord.downwardEvaluationScore).toBe(score);
        }
      });

      it('동일한 1차 하향평가를 여러 번 수정할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When - 여러 번 수정
        const save1 = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          project.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '첫 번째 저장',
            downwardEvaluationScore: 3,
          },
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        const save2 = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          project.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '두 번째 저장',
            downwardEvaluationScore: 4,
          },
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        const save3 = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          project.id,
          'primary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '세 번째 저장',
            downwardEvaluationScore: 5,
          },
        );

        // Then
        expect(save1.id).toBe(save2.id);
        expect(save2.id).toBe(save3.id);

        const dbRecord = await getDownwardEvaluationFromDb(save3.id);
        expect(dbRecord.downwardEvaluationContent).toBe('세 번째 저장');
        expect(dbRecord.downwardEvaluationScore).toBe(5);
      });

      it('모든 필드를 생략하고 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then - DTO 검증 실패로 400 발생
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({})
          .expect(400);
      });
    });

    describe('실패 시나리오', () => {
      it('평가 점수가 숫자가 아닐 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 'invalid',
          })
          .expect(400);
      });

      it('평가 점수가 음수일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: -10,
          })
          .expect(400);
      });

      it('평가 점수가 0일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 0,
          })
          .expect(400);
      });

      it('평가 점수가 소수일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 3.5,
          })
          .expect(400);
      });

      it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const invalidEvaluateeId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${invalidEvaluateeId}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 4,
          })
          .expect(400);
      });

      it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const project = getRandomProject();
        const invalidPeriodId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${invalidPeriodId}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 4,
          })
          .expect(400);
      });

      it('잘못된 형식의 projectId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const invalidProjectId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${invalidProjectId}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 4,
          })
          .expect(400);
      });

      it('잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const invalidEvaluatorId = 'invalid-uuid';

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: invalidEvaluatorId,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 4,
          })
          .expect(400);
      });

      it('평가 내용이 문자열이 아닐 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: 12345, // 숫자
            downwardEvaluationScore: 4,
          })
          .expect(400);
      });
    });

    describe('응답 구조 검증', () => {
      it('응답에 id와 message 필드가 포함되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '응답 구조 검증 테스트',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.message).toBe('string');
      });
    });
  });

  // ==================== 2차 하향평가 저장 ====================

  describe('2차 하향평가 저장 (POST /evaluatee/:evaluateeId/period/:periodId/project/:projectId/secondary)', () => {
    describe('성공 시나리오', () => {
      it('신규 2차 하향평가를 생성할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const createdBy = getRandomEmployee().id;

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 평가에서 추가로 확인한 내용입니다.',
            downwardEvaluationScore: 4,
            createdBy,
          })
          .expect(200);

        // Then
        expect(response.body).toBeDefined();
        expect(response.body.id).toBeDefined();
        expect(response.body.message).toContain('2차 하향평가');
        expect(response.body.message).toContain('저장');

        // DB 검증
        const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
        expect(dbRecord).toBeDefined();
        expect(dbRecord.employeeId).toBe(evaluatee.id);
        expect(dbRecord.evaluatorId).toBe(evaluator.id);
        expect(dbRecord.periodId).toBe(period.id);
        expect(dbRecord.projectId).toBe(project.id);
        expect(dbRecord.evaluationType).toBe('secondary');
        expect(dbRecord.downwardEvaluationContent).toBe(
          '2차 평가에서 추가로 확인한 내용입니다.',
        );
        expect(dbRecord.downwardEvaluationScore).toBe(4);
        expect(dbRecord.isCompleted).toBe(false);
      });

      it('기존 2차 하향평가를 수정할 수 있어야 한다 (Upsert)', async () => {
        // Given - 먼저 하향평가 생성
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        const firstSave = await upsertDownwardEvaluation(
          evaluatee.id,
          period.id,
          project.id,
          'secondary',
          {
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 초기 평가 내용',
            downwardEvaluationScore: 3,
          },
        );

        // 약간의 시간 차이를 보장
        await new Promise((resolve) => setTimeout(resolve, 100));

        // When - 동일한 조합으로 다시 저장 (수정)
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 수정된 평가 내용',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // Then
        expect(response.body.id).toBe(firstSave.id); // 동일한 ID

        // DB 검증
        const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
        expect(dbRecord.downwardEvaluationContent).toBe('2차 수정된 평가 내용');
        expect(dbRecord.downwardEvaluationScore).toBe(5);
      });

      it('1차와 2차 하향평가를 별도로 생성할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When - 1차 평가 생성
        const primaryResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '1차 평가 내용',
            downwardEvaluationScore: 3,
          })
          .expect(200);

        // When - 2차 평가 생성
        const secondaryResponse = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '2차 평가 내용',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // Then - 서로 다른 평가로 생성됨
        expect(primaryResponse.body.id).not.toBe(secondaryResponse.body.id);

        // DB 검증
        const primaryDbRecord = await getDownwardEvaluationFromDb(
          primaryResponse.body.id,
        );
        const secondaryDbRecord = await getDownwardEvaluationFromDb(
          secondaryResponse.body.id,
        );

        expect(primaryDbRecord.evaluationType).toBe('primary');
        expect(secondaryDbRecord.evaluationType).toBe('secondary');
        expect(primaryDbRecord.downwardEvaluationContent).toBe('1차 평가 내용');
        expect(secondaryDbRecord.downwardEvaluationContent).toBe(
          '2차 평가 내용',
        );
      });

      it('자기평가 ID를 포함하여 2차 하향평가를 생성할 수 있어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();
        const selfEvaluationId = '550e8400-e29b-41d4-a716-446655440088';

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            selfEvaluationId,
            downwardEvaluationContent: '자기평가 기반 2차 평가',
            downwardEvaluationScore: 5,
          })
          .expect(200);

        // Then
        const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
        expect(dbRecord.selfEvaluationId).toBe(selfEvaluationId);
      });

      it('모든 필드를 생략하고 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then - DTO 검증 실패로 400 발생
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({})
          .expect(400);
      });
    });

    describe('실패 시나리오', () => {
      it('평가 점수가 숫자가 아닐 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 'invalid',
          })
          .expect(400);
      });

      it('평가 점수가 음수일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: -5,
          })
          .expect(400);
      });

      it('평가 점수가 0일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 0,
          })
          .expect(400);
      });

      it('평가 점수가 소수일 때 400 에러가 발생해야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When & Then
        await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '평가 내용',
            downwardEvaluationScore: 2.7,
          })
          .expect(400);
      });
    });

    describe('응답 구조 검증', () => {
      it('응답에 id와 message 필드가 포함되어야 한다', async () => {
        // Given
        const evaluatee = getRandomEmployee();
        const evaluator = getRandomEmployee();
        const period = getRandomEvaluationPeriod();
        const project = getRandomProject();

        // When
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/secondary`,
          )
          .send({
            evaluatorId: evaluator.id,
            downwardEvaluationContent: '응답 구조 검증 테스트',
            downwardEvaluationScore: 4,
          })
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.message).toBe('string');
      });
    });
  });

  // ==================== 데이터 무결성 검증 ====================

  describe('하향평가 저장 데이터 무결성 시나리오', () => {
    it('신규 생성 시 isCompleted는 false여야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
        )
        .send({
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '신규 평가',
          downwardEvaluationScore: 4,
        })
        .expect(200);

      // Then
      const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
      expect(dbRecord.isCompleted).toBe(false);
      expect(dbRecord.completedAt == null).toBe(true);
    });

    it('하향평가 저장 시 evaluationDate가 설정되어야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
        )
        .send({
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '평가 날짜 테스트',
          downwardEvaluationScore: 4,
        })
        .expect(200);

      // Then
      const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
      expect(dbRecord.evaluationDate).toBeTruthy();
      expect(new Date(dbRecord.evaluationDate).getTime()).toBeGreaterThan(0);
    });

    it('하향평가 저장 시 경로 파라미터 정보가 올바르게 저장되어야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();

      // When
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
        )
        .send({
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '경로 파라미터 검증',
          downwardEvaluationScore: 4,
        })
        .expect(200);

      // Then
      const dbRecord = await getDownwardEvaluationFromDb(response.body.id);
      expect(dbRecord.employeeId).toBe(evaluatee.id);
      expect(dbRecord.evaluatorId).toBe(evaluator.id);
      expect(dbRecord.periodId).toBe(period.id);
      expect(dbRecord.projectId).toBe(project.id);
    });

    it('동일 조건(evaluatorId, evaluateeId, periodId, evaluationType)의 중복 평가는 Upsert 방식으로 처리되어야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const project = getRandomProject();

      // When - 첫 번째 저장
      const firstResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
        )
        .send({
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '첫 번째 평가',
          downwardEvaluationScore: 3,
        })
        .expect(200);

      // When - 동일 조건으로 두 번째 저장 (수정)
      const secondResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/downward-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/project/${project.id}/primary`,
        )
        .send({
          evaluatorId: evaluator.id,
          downwardEvaluationContent: '두 번째 평가 (수정)',
          downwardEvaluationScore: 5,
        })
        .expect(200);

      // Then - 동일한 ID로 수정됨
      expect(firstResponse.body.id).toBe(secondResponse.body.id);

      // DB에서 하나의 레코드만 존재하는지 확인
      const allRecords = await dataSource.manager.query(
        `SELECT * FROM downward_evaluation 
         WHERE "employeeId" = $1 AND "evaluatorId" = $2 AND "periodId" = $3 AND "evaluationType" = $4`,
        [evaluatee.id, evaluator.id, period.id, 'primary'],
      );

      expect(allRecords.length).toBe(1);
      expect(allRecords[0].downwardEvaluationContent).toBe(
        '두 번째 평가 (수정)',
      );
      expect(allRecords[0].downwardEvaluationScore).toBe(5);
    });
  });
});
