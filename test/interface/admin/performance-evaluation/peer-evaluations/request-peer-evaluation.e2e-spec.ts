import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { QuestionGroupDto } from '@domain/sub/question-group/question-group.types';
import { EvaluationQuestionDto } from '@domain/sub/evaluation-question/evaluation-question.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/requests', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let testContextService: TestContextService;
  let testData: {
    employees: EmployeeDto[];
    periods: EvaluationPeriodDto[];
    questionGroups: QuestionGroupDto[];
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

    // 직원 및 평가기간 데이터 생성
    const employees =
      await testContextService.직원_데이터를_확인하고_준비한다(5);
    const periods = await testContextService.테스트용_평가기간을_생성한다();

    // 질문 그룹 및 평가 질문 생성
    const createdBy = employees[0].id;
    const questionGroups =
      await testContextService.테스트용_질문그룹을_생성한다(createdBy);
    const questions =
      await testContextService.테스트용_평가질문을_생성한다(createdBy);

    // 기본 그룹에 질문 매핑
    const defaultGroup = questionGroups.find((g) => g.isDefault);
    if (defaultGroup) {
      await testContextService.질문그룹에_질문을_매핑한다(
        defaultGroup.id,
        questions.map((q) => q.id),
        createdBy,
      );
    }

    testData = {
      employees,
      periods,
      questionGroups,
      questions,
    };

    console.log('동료평가 요청 테스트 데이터 생성 완료:', {
      employees: testData.employees.length,
      periods: testData.periods.length,
      questionGroups: testData.questionGroups.length,
      questions: testData.questions.length,
    });
  });

  afterEach(async () => {
    await testContextService.평가질문_테스트데이터를_정리한다();
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

  /**
   * 동료평가 요청 헬퍼
   */
  async function requestPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy?: string;
  }): Promise<any> {
    const response = await request(app.getHttpServer())
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data)
      .expect(201);

    return response.body;
  }

  /**
   * DB에서 동료평가 조회 헬퍼
   */
  async function getPeerEvaluationFromDb(id: string): Promise<any> {
    const result = await dataSource.manager.query(
      `SELECT * FROM peer_evaluation WHERE id = $1`,
      [id],
    );
    return result[0];
  }

  // ==================== 성공 시나리오 ====================

  describe('동료평가 요청 성공 시나리오', () => {
    it('기본 동료평가 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
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
      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.message).toBe(
        '동료평가가 성공적으로 요청되었습니다.',
      );

      // DB 검증
      const dbRecord = await getPeerEvaluationFromDb(response.body.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.evaluatorId).toBe(evaluator.id);
      expect(dbRecord.evaluateeId).toBe(evaluatee.id); // evaluateeId가 피평가자입니다
      expect(dbRecord.periodId).toBe(period.id);
    });

    it('요청 마감일을 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
      const period = getRandomEvaluationPeriod();
      const requestDeadline = new Date('2024-12-31T23:59:59Z');

      // When
      const response = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        requestDeadline,
      });

      // Then
      expect(response.id).toBeDefined();
      expect(response.message).toBe('동료평가가 성공적으로 요청되었습니다.');

      // DB 검증
      const dbRecord = await getPeerEvaluationFromDb(response.id);
      expect(dbRecord).toBeDefined();
      expect(new Date(dbRecord.requestDeadline).toISOString()).toBe(
        requestDeadline.toISOString(),
      );
    });

    it('질문 ID 목록을 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
      const period = getRandomEvaluationPeriod();
      const questionIds = testData.questions.slice(0, 3).map((q) => q.id);

      // When
      const response = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        questionIds,
      });

      // Then
      expect(response.id).toBeDefined();
      expect(response.message).toBe('동료평가가 성공적으로 요청되었습니다.');

      // DB 검증 - peer_evaluation_question_mapping 테이블 확인
      const mappings = await dataSource.manager.query(
        `SELECT * FROM peer_evaluation_question_mapping WHERE "peerEvaluationId" = $1`,
        [response.id],
      );
      expect(mappings.length).toBe(questionIds.length);
    });

    it('requestedBy를 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
      const period = getRandomEvaluationPeriod();
      const requestedBy = testData.employees[2].id;

      // When
      const response = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
        requestedBy,
      });

      // Then
      expect(response.id).toBeDefined();
      expect(response.message).toBe('동료평가가 성공적으로 요청되었습니다.');
    });

    it('requestedBy 없이 동료평가 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // Then
      expect(response.id).toBeDefined();
      expect(response.message).toBe('동료평가가 성공적으로 요청되었습니다.');
    });

    it('동일한 평가자가 여러 피평가자에게 평가 요청을 받을 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee1 = testData.employees[1]; // 평가자와 다른 직원
      const evaluatee2 = testData.employees[2]; // 평가자와 다른 직원
      const period = getRandomEvaluationPeriod();

      // When - 첫 번째 요청
      const response1 = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee1.id,
        periodId: period.id,
      });

      // When - 두 번째 요청
      const response2 = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee2.id,
        periodId: period.id,
      });

      // Then
      expect(response1.id).toBeDefined();
      expect(response2.id).toBeDefined();
      expect(response1.id).not.toBe(response2.id);

      // DB 검증
      const evaluations = await dataSource.manager.query(
        `SELECT * FROM peer_evaluation WHERE "evaluatorId" = $1 AND "periodId" = $2`,
        [evaluator.id, period.id],
      );
      expect(evaluations.length).toBeGreaterThanOrEqual(2);
    });

    it('한 피평가자를 여러 평가자가 평가하도록 요청할 수 있어야 한다', async () => {
      // Given
      const evaluator1 = testData.employees[0];
      const evaluator2 = testData.employees[1];
      const evaluatee = testData.employees[2]; // 평가자들과 다른 직원
      const period = getRandomEvaluationPeriod();

      // When - 첫 번째 평가자에게 요청
      const response1 = await requestPeerEvaluation({
        evaluatorId: evaluator1.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // When - 두 번째 평가자에게 요청
      const response2 = await requestPeerEvaluation({
        evaluatorId: evaluator2.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // Then
      expect(response1.id).toBeDefined();
      expect(response2.id).toBeDefined();
      expect(response1.id).not.toBe(response2.id);

      // DB 검증
      const evaluations = await dataSource.manager.query(
        `SELECT * FROM peer_evaluation WHERE "evaluateeId" = $1 AND "periodId" = $2`,
        [evaluatee.id, period.id],
      );
      expect(evaluations.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('동료평가 요청 실패 시나리오', () => {
    it('잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const invalidEvaluatorId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: invalidEvaluatorId,
          evaluateeId: evaluatee.id,
          periodId: period.id,
        })
        .expect(400);
    });

    it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const invalidEvaluateeId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: invalidEvaluateeId,
          periodId: period.id,
        })
        .expect(400);
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const evaluatee = getRandomEmployee();
      const invalidPeriodId = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: invalidPeriodId,
        })
        .expect(400);
    });

    it('evaluatorId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluatee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluateeId: evaluatee.id,
          periodId: period.id,
        })
        .expect(400);
    });

    it('evaluateeId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          periodId: period.id,
        })
        .expect(400);
    });

    it('periodId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const evaluatee = getRandomEmployee();

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
        })
        .expect(400);
    });

    it('잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const evaluatee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const invalidRequestedBy = 'invalid-uuid';

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          requestedBy: invalidRequestedBy,
        })
        .expect(400);
    });

    it('잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const evaluatee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();
      const invalidQuestionIds = ['invalid-uuid-1', 'invalid-uuid-2'];

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
          questionIds: invalidQuestionIds,
        })
        .expect(400);
    });

    it('존재하지 않는 evaluatorId로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentEvaluatorId = uuidv4();
      const evaluatee = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: nonExistentEvaluatorId,
          evaluateeId: evaluatee.id,
          periodId: period.id,
        })
        .expect(404);
    });

    it('존재하지 않는 evaluateeId로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const nonExistentEvaluateeId = uuidv4();
      const period = getRandomEvaluationPeriod();

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: nonExistentEvaluateeId,
          periodId: period.id,
        })
        .expect(404);
    });

    it('존재하지 않는 periodId로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const evaluatee = getRandomEmployee();
      const nonExistentPeriodId = uuidv4();

      // When & Then
      await request(app.getHttpServer())
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: nonExistentPeriodId,
        })
        .expect(404);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('동료평가 요청 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
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

      // Then - 필수 필드 검증
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('message');
    });

    it('응답의 ID가 유효한 UUID 형식이어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0]; // 명시적으로 다른 직원 할당
      const evaluatee = testData.employees[1];
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
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(response.body.id).toMatch(uuidRegex);
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('동료평가 요청 데이터 무결성 시나리오', () => {
    it('생성된 동료평가가 DB에 올바르게 저장되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
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

      // Then - DB 검증
      const dbRecord = await getPeerEvaluationFromDb(response.body.id);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.id).toBe(response.body.id);
      expect(dbRecord.evaluatorId).toBe(evaluator.id);
      expect(dbRecord.evaluateeId).toBe(evaluatee.id); // evaluateeId가 피평가자입니다
      expect(dbRecord.periodId).toBe(period.id);
      expect(dbRecord.deletedAt).toBeNull();
    });

    it('생성된 동료평가의 상태가 올바르게 설정되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // Then - DB 검증
      const dbRecord = await getPeerEvaluationFromDb(response.id);
      expect(dbRecord).toBeDefined();
      // 초기 상태 검증 (pending 또는 draft)
      expect(['pending', 'draft']).toContain(dbRecord.status);
    });

    it('생성 시 createdAt과 updatedAt이 설정되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1]; // 서로 다른 직원으로 명시
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      // Then - DB 검증
      const dbRecord = await getPeerEvaluationFromDb(response.id);
      expect(dbRecord.createdAt).toBeDefined();
      expect(dbRecord.updatedAt).toBeDefined();
      expect(new Date(dbRecord.createdAt).getTime()).not.toBeNaN();
      expect(new Date(dbRecord.updatedAt).getTime()).not.toBeNaN();
    });
  });
});
