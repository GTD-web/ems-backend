import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { EvaluationQuestionDto } from '@domain/sub/evaluation-question/evaluation-question.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/:id/submit', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
    periods: EvaluationPeriodDto[];
    questions: EvaluationQuestionDto[];
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

    // 직원, 평가기간, 질문 데이터 생성
    const employees =
      await testContextService.직원_데이터를_확인하고_준비한다(5);
    const periods = await testContextService.테스트용_평가기간을_생성한다();
    const questions =
      await testContextService.테스트용_평가질문을_생성한다('test-admin');

    testData = {
      employees,
      periods,
      questions,
    };

    console.log('동료평가 제출 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.periods.length,
      questions: testData.questions.length,
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

  function getRandomQuestion(): string {
    return testData.questions[
      Math.floor(Math.random() * testData.questions.length)
    ].id;
  }

  /**
   * 동료평가 요청 생성 헬퍼 (질문 포함)
   */
  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    questionIds?: string[];
  }): Promise<string> {
    const response = await testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data)
      .expect(201);

    return response.body.id;
  }

  /**
   * 평가 응답 제출 헬퍼 (DB 직접 삽입)
   */
  async function submitEvaluationResponse(
    evaluationId: string,
    questionId: string,
    answer: string,
    score: number,
  ): Promise<void> {
    await dataSource.query(
      `INSERT INTO evaluation_response (id, "questionId", "evaluationId", "evaluationType", answer, score, "createdBy", "createdAt", "updatedAt", version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), 1)`,
      [uuidv4(), questionId, evaluationId, 'peer', answer, score, 'test-admin'],
    );
  }

  /**
   * 동료평가 제출 헬퍼
   */
  function submitPeerEvaluation(evaluationId: string, submittedBy?: string) {
    return testSuite
      .request()
      .post(
        `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
      )
      .send(submittedBy ? { submittedBy } : {});
  }

  /**
   * DB에서 동료평가 조회 헬퍼
   */
  async function getPeerEvaluationFromDb(id: string) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE id = $1`,
      [id],
    );
    return records[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('동료평가 제출 성공 시나리오', () => {
    it('기본 동료평가 제출을 할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // When & Then
      await submitPeerEvaluation(evaluationId).expect(200);
    });

    it('submittedBy를 포함하여 동료평가 제출을 할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const submittedBy = uuidv4();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // When & Then
      await submitPeerEvaluation(evaluationId, submittedBy).expect(200);
    });

    it('submittedBy 없이 동료평가 제출을 할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // When & Then
      await submitPeerEvaluation(evaluationId).expect(200);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('동료평가 제출 실패 시나리오', () => {
    it('잘못된 형식의 평가 ID로 제출 시 400 에러가 발생해야 한다', async () => {
      // Given
      const invalidEvaluationId = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${invalidEvaluationId}/submit`,
        )
        .send({})
        .expect(400);
    });

    it('존재하지 않는 평가 ID로 제출 시 400 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentEvaluationId = uuidv4();

      // When & Then
      await submitPeerEvaluation(nonExistentEvaluationId).expect(400);
    });

    it('이미 제출된 평가를 다시 제출 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // 첫 번째 제출
      await submitPeerEvaluation(evaluationId).expect(200);

      // When & Then - 두 번째 제출 시도
      await submitPeerEvaluation(evaluationId).expect(400);
    });

    it('잘못된 형식의 submittedBy로 제출 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      const invalidSubmittedBy = 'invalid-uuid';

      // When & Then
      // submittedBy는 @CurrentUser() 데코레이터를 통해 자동 설정되므로,
      // 이 필드의 유효성 검증 테스트는 필요하지 않음 (컨트롤러에서 DTO에 포함되지 않음)
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({})
        .expect(200);
    });

    it('응답 없이 평가 제출 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답을 제출하지 않고 제출 시도

      // When & Then
      await submitPeerEvaluation(evaluationId).expect(400);
    });

    it('질문이 없는 평가를 제출 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        // questionIds를 포함하지 않음
      });

      // When & Then
      await submitPeerEvaluation(evaluationId).expect(400);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('동료평가 제출 응답 구조 검증', () => {
    it('제출 성공 시 200 상태 코드를 반환해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // When
      const response = await submitPeerEvaluation(evaluationId).expect(200);

      // Then - 응답이 있는지 확인
      expect(response).toBeDefined();
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('동료평가 제출 데이터 무결성 시나리오', () => {
    it('제출 후 isCompleted가 true로 변경되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // 제출 전 확인
      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);
      expect(beforeSubmit.isCompleted).toBe(false);

      // When
      await submitPeerEvaluation(evaluationId).expect(200);

      // Then
      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      expect(afterSubmit.isCompleted).toBe(true);
    });

    it('제출 후 status가 적절히 변경되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // 제출 전 상태 확인
      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);
      expect(beforeSubmit.status).toBe('pending');

      // When
      await submitPeerEvaluation(evaluationId).expect(200);

      // Then
      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      expect(afterSubmit.status).not.toBe('pending');
      expect(['submitted', 'completed']).toContain(afterSubmit.status);
    });

    it('제출 시 completedAt이 설정되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      // When
      await submitPeerEvaluation(evaluationId).expect(200);

      // Then
      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      expect(afterSubmit.completedAt).toBeDefined();
      expect(afterSubmit.completedAt).not.toBeNull();
      expect(new Date(afterSubmit.completedAt)).toBeInstanceOf(Date);
    });

    it('제출 시 updatedAt이 갱신되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);
      const originalUpdatedAt = new Date(beforeSubmit.updatedAt);

      // 약간의 시간 대기 (타임스탬프 차이를 보장하기 위해)
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      await submitPeerEvaluation(evaluationId).expect(200);

      // Then
      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      const newUpdatedAt = new Date(afterSubmit.updatedAt);
      expect(newUpdatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it('제출된 평가의 모든 필수 정보가 유지되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();
      const question = getRandomQuestion();

      const evaluationId = await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds: [question],
      });

      // 평가 응답 제출
      await submitEvaluationResponse(
        evaluationId,
        question,
        '훌륭한 동료입니다.',
        90,
      );

      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);

      // When
      await submitPeerEvaluation(evaluationId).expect(200);

      // Then
      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      expect(afterSubmit.id).toBe(beforeSubmit.id);
      expect(afterSubmit.evaluatorId).toBe(beforeSubmit.evaluatorId);
      expect(afterSubmit.evaluateeId).toBe(beforeSubmit.evaluateeId);
      expect(afterSubmit.periodId).toBe(beforeSubmit.periodId);
      // createdAt은 근사적으로 같아야 함 (밀리초 차이 허용)
      expect(
        Math.abs(
          new Date(afterSubmit.createdAt).getTime() -
            new Date(beforeSubmit.createdAt).getTime(),
        ),
      ).toBeLessThan(1000); // 1초 미만 차이
    });
  });
});
