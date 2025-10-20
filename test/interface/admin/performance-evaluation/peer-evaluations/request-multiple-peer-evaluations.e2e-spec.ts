import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { TestContextService } from '@context/test-context/test-context.service';
import { EmployeeDto } from '@domain/common/employee/employee.types';
import { EvaluationPeriodDto } from '@domain/core/evaluation-period/evaluation-period.types';
import { QuestionGroupDto } from '@domain/sub/question-group/question-group.types';
import { EvaluationQuestionDto } from '@domain/sub/evaluation-question/evaluation-question.types';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees', () => {
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

    console.log('동료평가 일괄 요청 테스트 데이터 생성 완료:', {
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

  function getRandomQuestion(): EvaluationQuestionDto {
    return testData.questions[
      Math.floor(Math.random() * testData.questions.length)
    ];
  }

  /**
   * 한 명의 평가자가 여러 피평가자를 평가하도록 요청 헬퍼
   */
  function requestMultiplePeerEvaluations(data: {
    evaluatorId: string;
    evaluateeIds: string[];
    periodId: string;
    requestDeadline?: Date;
    questionIds?: string[];
    requestedBy?: string;
  }) {
    return testSuite
      .request()
      .post(
        '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
      )
      .send(data);
  }

  /**
   * DB에서 동료평가 조회 헬퍼
   */
  async function getPeerEvaluationsFromDb(ids: string[]) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE id = ANY($1::uuid[])`,
      [ids],
    );
    return records;
  }

  // ==================== 성공 시나리오 ====================

  describe('한 명의 평가자가 여러 피평가자를 평가하도록 요청 성공 시나리오', () => {
    it('기본 일괄 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then
      expect(response.body).toHaveProperty('ids');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.ids)).toBe(true);
      expect(response.body.ids.length).toBe(evaluatees.length);
      expect(response.body.count).toBe(evaluatees.length);
    });

    it('요청 마감일을 포함하여 일괄 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();
      const requestDeadline = new Date('2024-12-31');

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
        requestDeadline,
      }).expect(201);

      // Then
      expect(response.body.ids.length).toBe(evaluatees.length);
      expect(response.body.count).toBe(evaluatees.length);

      // DB 확인
      const dbRecords = await getPeerEvaluationsFromDb(response.body.ids);
      expect(dbRecords.length).toBe(evaluatees.length);
      dbRecords.forEach((record: any) => {
        expect(new Date(record.requestDeadline).getTime()).toBe(
          requestDeadline.getTime(),
        );
      });
    });

    it('질문 ID 목록을 포함하여 일괄 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();
      const questions = [getRandomQuestion(), getRandomQuestion()];

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
        questionIds: questions.map((q) => q.id),
      }).expect(201);

      // Then
      expect(response.body.ids.length).toBe(evaluatees.length);
      expect(response.body.count).toBe(evaluatees.length);
    });

    it('requestedBy를 포함하여 일괄 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();
      const requestedBy = uuidv4();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
        requestedBy,
      }).expect(201);

      // Then
      expect(response.body.ids.length).toBe(evaluatees.length);
      expect(response.body.count).toBe(evaluatees.length);
    });

    it('requestedBy 없이 일괄 요청을 생성할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then
      expect(response.body.ids.length).toBe(evaluatees.length);
    });

    it('단일 피평가자에게 요청할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatee = testData.employees[1];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: [evaluatee.id],
        periodId: period.id,
      }).expect(201);

      // Then
      expect(response.body.ids.length).toBe(1);
      expect(response.body.count).toBe(1);
    });

    it('많은 피평가자에게 동시에 요청할 수 있어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = testData.employees.filter(
        (e) => e.id !== evaluator.id,
      );
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then
      expect(response.body.ids.length).toBe(evaluatees.length);
      expect(response.body.count).toBe(evaluatees.length);
    });
  });

  // ==================== 실패 시나리오 ====================

  describe('한 명의 평가자가 여러 피평가자를 평가하도록 요청 실패 시나리오', () => {
    it('잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluatees = [testData.employees[0], testData.employees[1]];
      const period = getRandomEvaluationPeriod();
      const invalidEvaluatorId = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: invalidEvaluatorId,
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: period.id,
        })
        .expect(400);
    });

    it('잘못된 형식의 evaluateeIds로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();
      const invalidEvaluateeIds = ['invalid-uuid', uuidv4()];

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: invalidEvaluateeIds,
          periodId: period.id,
        })
        .expect(400);
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const invalidPeriodId = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: invalidPeriodId,
        })
        .expect(400);
    });

    it('빈 evaluateeIds 배열로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = getRandomEmployee();
      const period = getRandomEvaluationPeriod();

      // When & Then
      await testSuite
        .request()
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

    it('evaluatorId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluatees = [testData.employees[0], testData.employees[1]];
      const period = getRandomEvaluationPeriod();

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: period.id,
        })
        .expect(400);
    });

    it('evaluateeIds 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const period = getRandomEvaluationPeriod();

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          periodId: period.id,
        })
        .expect(400);
    });

    it('periodId 누락 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: evaluatees.map((e) => e.id),
        })
        .expect(400);
    });

    it('잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();
      const invalidRequestedBy = 'invalid-uuid';

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: period.id,
          requestedBy: invalidRequestedBy,
        })
        .expect(400);
    });

    it('잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();
      const invalidQuestionIds = ['invalid-uuid', uuidv4()];

      // When & Then
      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: period.id,
          questionIds: invalidQuestionIds,
        })
        .expect(400);
    });

    it('존재하지 않는 evaluatorId로 요청 시 아무것도 생성되지 않아야 한다', async () => {
      // Given
      const nonExistentEvaluatorId = uuidv4();
      const evaluatees = [testData.employees[0], testData.employees[1]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: nonExistentEvaluatorId,
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: period.id,
        })
        .expect(201);

      // Then - 평가자가 존재하지 않아 아무것도 생성되지 않아야 함
      expect(response.body.count).toBe(0);
      expect(response.body.ids.length).toBe(0);
    });

    it('존재하지 않는 evaluateeId 포함 시 해당 피평가자는 건너뛰고 나머지만 생성해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const validEvaluatee = testData.employees[1];
      const nonExistentEvaluateeId = uuidv4();
      const period = getRandomEvaluationPeriod();

      // When
      const response = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: [validEvaluatee.id, nonExistentEvaluateeId],
          periodId: period.id,
        })
        .expect(201);

      // Then - 유효한 피평가자에 대해서만 생성되어야 함
      expect(response.body.count).toBe(1);
      expect(response.body.ids.length).toBe(1);
    });

    it('존재하지 않는 periodId로 요청 시 아무것도 생성되지 않아야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const nonExistentPeriodId = uuidv4();

      // When
      const response = await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluator-to-many-evaluatees',
        )
        .send({
          evaluatorId: evaluator.id,
          evaluateeIds: evaluatees.map((e) => e.id),
          periodId: nonExistentPeriodId,
        })
        .expect(201);

      // Then - 평가기간이 존재하지 않아 아무것도 생성되지 않아야 함
      expect(response.body.count).toBe(0);
      expect(response.body.ids.length).toBe(0);
    });
  });

  // ==================== 응답 구조 검증 ====================

  describe('일괄 요청 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then - 필수 필드 검증
      expect(response.body).toHaveProperty('ids');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('message');
    });

    it('응답의 IDs가 모두 유효한 UUID 형식이어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      response.body.ids.forEach((id: string) => {
        expect(id).toMatch(uuidRegex);
      });
    });

    it('응답의 count가 생성된 평가 개수와 일치해야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [
        testData.employees[1],
        testData.employees[2],
        testData.employees[3],
      ];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then
      expect(response.body.count).toBe(evaluatees.length);
      expect(response.body.ids.length).toBe(evaluatees.length);
    });
  });

  // ==================== 데이터 무결성 시나리오 ====================

  describe('일괄 요청 데이터 무결성 시나리오', () => {
    it('생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then - DB 검증
      const dbRecords = await getPeerEvaluationsFromDb(response.body.ids);
      expect(dbRecords.length).toBe(evaluatees.length);

      dbRecords.forEach((record: any, index: number) => {
        expect(record.evaluatorId).toBe(evaluator.id);
        expect(record.periodId).toBe(period.id);
        expect(evaluatees.map((e) => e.id)).toContain(record.evaluateeId);
      });
    });

    it('생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then - DB 검증
      const dbRecords = await getPeerEvaluationsFromDb(response.body.ids);
      dbRecords.forEach((record: any) => {
        expect(record.isCompleted).toBe(false);
        expect(record.status).toBe('pending');
      });
    });

    it('생성 시 모든 평가에 createdAt과 updatedAt이 설정되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [testData.employees[1], testData.employees[2]];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then - DB 검증
      const dbRecords = await getPeerEvaluationsFromDb(response.body.ids);
      dbRecords.forEach((record: any) => {
        expect(record.createdAt).toBeDefined();
        expect(record.updatedAt).toBeDefined();
        expect(new Date(record.createdAt)).toBeInstanceOf(Date);
        expect(new Date(record.updatedAt)).toBeInstanceOf(Date);
      });
    });

    it('피평가자 목록에 평가자 자신이 포함된 경우 제외되어야 한다', async () => {
      // Given
      const evaluator = testData.employees[0];
      const evaluatees = [
        testData.employees[0], // 평가자 자신
        testData.employees[1],
        testData.employees[2],
      ];
      const period = getRandomEvaluationPeriod();

      // When
      const response = await requestMultiplePeerEvaluations({
        evaluatorId: evaluator.id,
        evaluateeIds: evaluatees.map((e) => e.id),
        periodId: period.id,
      }).expect(201);

      // Then - 자기 자신을 제외한 피평가자 수만큼 생성되어야 함
      expect(response.body.count).toBe(evaluatees.length - 1);
      expect(response.body.ids.length).toBe(evaluatees.length - 1);

      // DB 검증 - 자기 자신은 피평가자로 포함되지 않아야 함
      const dbRecords = await getPeerEvaluationsFromDb(response.body.ids);
      dbRecords.forEach((record: any) => {
        expect(record.evaluateeId).not.toBe(evaluator.id);
      });
    });
  });
});
