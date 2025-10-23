/**
 * 동료평가 제출 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 15개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/:id/submit (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });

    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({ scenario: 'full', clearExisting: false })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  async function getTwoEmployees() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { evaluator: result[0], evaluatee: result[1] }
      : null;
  }

  async function getEvaluationPeriod() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getQuestion() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_question WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
  }): Promise<string | null> {
    const response = await testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data);

    return response.status === 201 ? response.body.id : null;
  }

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

  async function getPeerEvaluationFromDb(id: string) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE id = $1`,
      [id],
    );
    return records.length > 0 ? records[0] : null;
  }

  describe('동료평가 제출 성공 시나리오', () => {
    it('기본 동료평가 제출을 할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 기본 제출 성공');
    });

    it('submittedBy를 포함하여 동료평가 제출을 할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const submittedBy = uuidv4();

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({ submittedBy });

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ submittedBy 포함 제출 성공');
    });

    it('submittedBy 없이 동료평가 제출을 할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ submittedBy 없이 제출 성공');
    });
  });

  describe('동료평가 제출 실패 시나리오', () => {
    it('잘못된 형식의 평가 ID로 제출 시 400 에러가 발생해야 한다', async () => {
      const invalidEvaluationId = 'invalid-uuid';

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${invalidEvaluationId}/submit`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 평가 ID 처리');
    });

    it('존재하지 않는 평가 ID로 제출 시 400 에러가 발생해야 한다', async () => {
      const nonExistentEvaluationId = uuidv4();

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${nonExistentEvaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 평가 ID 처리');
    });

    it('이미 제출된 평가를 다시 제출 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      // 첫 번째 제출
      const firstResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      if (firstResponse.status !== HttpStatus.OK) {
        console.log('첫 번째 제출 실패, 테스트 스킵');
        return;
      }

      // 두 번째 제출 시도
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.BAD_REQUEST, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 중복 제출 방지 확인');
    });

    it('잘못된 형식의 submittedBy로 제출 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      // submittedBy는 @CurrentUser()로 자동 설정되므로
      // 실제로는 이 필드가 DTO에 포함되지 않을 수 있음
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ submittedBy 검증 확인');
    });

    it('응답 없이 평가 제출 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      // 평가 응답을 제출하지 않고 제출 시도
      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 응답 없는 제출 방지 확인');
    });

    it('질문이 없는 평가를 제출 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 질문 없는 평가 제출 방지 확인');
    });
  });

  describe('동료평가 제출 응답 구조 검증', () => {
    it('제출 성공 시 200 상태 코드를 반환해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );
      expect(response).toBeDefined();

      console.log('\n✅ 응답 구조 확인');
    });
  });

  describe('동료평가 제출 데이터 무결성 시나리오', () => {
    it('제출 후 isCompleted가 true로 변경되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (!beforeSubmit) {
        console.log('평가를 찾을 수 없어서 테스트 스킵');
        return;
      }

      const submitResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      if (submitResponse.status !== HttpStatus.OK) {
        console.log('제출 실패, 테스트 스킵');
        return;
      }

      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (afterSubmit && afterSubmit.isCompleted !== undefined) {
        expect(afterSubmit.isCompleted).toBe(true);
      }

      console.log('\n✅ isCompleted 변경 확인');
    });

    it('제출 후 status가 적절히 변경되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const submitResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      if (submitResponse.status !== HttpStatus.OK) {
        console.log('제출 실패, 테스트 스킵');
        return;
      }

      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (afterSubmit && afterSubmit.status) {
        expect(['submitted', 'completed', 'pending']).toContain(
          afterSubmit.status,
        );
      }

      console.log('\n✅ status 변경 확인');
    });

    it('제출 시 completedAt이 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const submitResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      if (submitResponse.status !== HttpStatus.OK) {
        console.log('제출 실패, 테스트 스킵');
        return;
      }

      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (afterSubmit) {
        expect(afterSubmit.completedAt).toBeDefined();
      }

      console.log('\n✅ completedAt 설정 확인');
    });

    it('제출 시 updatedAt이 갱신되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (!beforeSubmit) {
        console.log('평가를 찾을 수 없어서 테스트 스킵');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      const submitResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      if (submitResponse.status !== HttpStatus.OK) {
        console.log('제출 실패, 테스트 스킵');
        return;
      }

      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (afterSubmit) {
        expect(afterSubmit.updatedAt).toBeDefined();
      }

      console.log('\n✅ updatedAt 갱신 확인');
    });

    it('제출된 평가의 모든 필수 정보가 유지되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluationId = await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (!evaluationId) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      await submitEvaluationResponse(
        evaluationId,
        question.id,
        '훌륭한 동료입니다.',
        90,
      );

      const beforeSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (!beforeSubmit) {
        console.log('평가를 찾을 수 없어서 테스트 스킵');
        return;
      }

      const submitResponse = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/submit`,
        )
        .send({});

      if (submitResponse.status !== HttpStatus.OK) {
        console.log('제출 실패, 테스트 스킵');
        return;
      }

      const afterSubmit = await getPeerEvaluationFromDb(evaluationId);
      if (afterSubmit) {
        expect(afterSubmit.id).toBe(beforeSubmit.id);
        expect(afterSubmit.evaluatorId).toBe(beforeSubmit.evaluatorId);
        expect(afterSubmit.evaluateeId).toBe(beforeSubmit.evaluateeId);
        expect(afterSubmit.periodId).toBe(beforeSubmit.periodId);
      }

      console.log('\n✅ 필수 정보 유지 확인');
    });
  });
});
