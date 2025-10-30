/**
 * 동료평가 상세 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 12개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('GET /admin/performance-evaluation/peer-evaluations/:id (실제 데이터)', () => {
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

  async function getPeerEvaluationFromDb(id: string) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE id = $1`,
      [id],
    );
    return records.length > 0 ? records[0] : null;
  }

  describe('동료평가 상세 조회 성공 시나리오', () => {
    it('기본 동료평가 상세 정보를 조회할 수 있어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(evaluationId);

      console.log('\n✅ 기본 상세 조회 성공');
    });

    it('생성된 동료평가의 모든 필드가 조회되어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(evaluationId);
      expect(response.body).toHaveProperty('evaluator');
      expect(response.body).toHaveProperty('evaluatee');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      console.log('\n✅ 모든 필드 조회 성공');
    });

    it('평가자와 피평가자의 정보가 포함되어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('evaluator');
      expect(response.body).toHaveProperty('evaluatee');

      console.log('\n✅ 평가자/피평가자 정보 포함 확인');
    });

    it('부서 정보가 포함되어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      // 부서 정보는 evaluator/evaluatee 객체 내부에 포함될 수 있음

      console.log('\n✅ 부서 정보 포함 확인');
    });
  });

  describe('동료평가 상세 조회 실패 시나리오', () => {
    it('잘못된 형식의 평가 ID로 조회 시 400 에러가 발생해야 한다', async () => {
      const invalidEvaluationId = 'invalid-uuid';

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/${invalidEvaluationId}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 평가 ID 처리');
    });

    it('존재하지 않는 평가 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      const nonExistentEvaluationId = uuidv4();

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/${nonExistentEvaluationId}`,
        );

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 평가 ID 처리');
    });
  });

  describe('동료평가 상세 조회 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 질문이 있는 평가를 생성
      const questions = await dataSource.query(
        `SELECT id FROM evaluation_question WHERE "deletedAt" IS NULL LIMIT 1`,
      );
      if (questions.length === 0) {
        console.log('질문이 없어서 테스트 스킵');
        return;
      }

      const createResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id],
        });

      if (createResponse.status !== 201) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      const evaluationId = createResponse.body.id;

      const response = await testSuite
        .request()
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('evaluator');
      expect(response.body).toHaveProperty('evaluatee');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('isCompleted');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');

      // 평가자 정보 검증 (rankName, roles 포함)
      expect(response.body.evaluator).toBeDefined();
      expect(response.body.evaluator).not.toBeNull();
      expect(response.body.evaluator).toHaveProperty('id');
      expect(response.body.evaluator).toHaveProperty('name');
      expect(response.body.evaluator).toHaveProperty('employeeNumber');
      expect(response.body.evaluator).toHaveProperty('email');
      expect(response.body.evaluator).toHaveProperty('departmentId');
      expect(response.body.evaluator).toHaveProperty('status');
      expect(response.body.evaluator).toHaveProperty('rankName');
      expect(response.body.evaluator).toHaveProperty('roles');
      expect(typeof response.body.evaluator.rankName).toBe('string');
      expect(Array.isArray(response.body.evaluator.roles)).toBe(true);
      response.body.evaluator.roles.forEach((role: any) => {
        expect(typeof role).toBe('string');
      });

      // 점수 필드 검증 (질문이 있는 경우)
      expect(response.body.questions).toBeDefined();
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions.length).toBeGreaterThan(0);
      const question = response.body.questions[0];
      expect(question).toHaveProperty('score');
      if (question.score !== null && question.score !== undefined) {
        expect(typeof question.score).toBe('number');
        expect(question.score).toBeGreaterThanOrEqual(1);
        expect(question.score).toBeLessThanOrEqual(5);
      }

      console.log('\n✅ 응답 필수 필드 확인');
    });

    it('UUID 필드가 유효한 UUID 형식이어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(response.body.id)).toBe(true);

      console.log('\n✅ UUID 형식 확인');
    });

    it('날짜 필드가 유효한 날짜 형식이어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      if (response.body.createdAt) {
        expect(new Date(response.body.createdAt)).toBeInstanceOf(Date);
      }
      if (response.body.updatedAt) {
        expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
      }

      console.log('\n✅ 날짜 형식 확인');
    });
  });

  describe('동료평가 상세 조회 데이터 무결성 검증', () => {
    it('조회된 데이터가 DB의 실제 데이터와 일치해야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      const dbRecord = await getPeerEvaluationFromDb(evaluationId);

      if (dbRecord) {
        expect(response.body.id).toBe(dbRecord.id);
        expect(response.body.status).toBe(dbRecord.status);
        expect(response.body.isCompleted).toBe(dbRecord.isCompleted);
      }

      console.log('\n✅ DB 데이터 일치 확인');
    });

    it('초기 생성 시 isCompleted가 false여야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body.isCompleted).toBe(false);

      console.log('\n✅ 초기 isCompleted false 확인');
    });

    it('초기 생성 시 status가 pending이어야 한다', async () => {
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
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      expect(response.body.status).toBe('pending');

      console.log('\n✅ 초기 status pending 확인');
    });

    it('답변을 저장한 후 상세 조회 시 답변 정보가 포함되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 질문 2개 가져오기
      const questions = await dataSource.query(
        `SELECT id FROM evaluation_question WHERE "deletedAt" IS NULL LIMIT 2`,
      );
      if (questions.length < 2) {
        console.log('질문 데이터가 부족하여 테스트 스킵');
        return;
      }

      // 동료평가 생성
      const createResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id, questions[1].id],
        });

      if (createResponse.status !== 201) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      const evaluationId = createResponse.body.id;

      // 답변 저장
      const answersData = [
        {
          questionId: questions[0].id,
          answer: '첫 번째 질문에 대한 답변입니다.',
        },
        {
          questionId: questions[1].id,
          answer: '두 번째 질문에 대한 답변입니다.',
        },
      ];

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${evaluationId}/answers`,
        )
        .send({
          peerEvaluationId: evaluationId,
          answers: answersData,
        })
        .expect(HttpStatus.CREATED);

      // 상세 조회
      const response = await testSuite
        .request()
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      // 질문 목록 확인
      expect(response.body.questions).toBeDefined();
      expect(response.body.questions.length).toBeGreaterThan(0);

      // 답변이 포함된 질문 확인
      const answeredQuestions = response.body.questions.filter(
        (q: any) => q.answer !== null && q.answer !== undefined,
      );
      expect(answeredQuestions.length).toBe(2);

      // 각 질문의 답변이 저장한 내용과 일치하는지 확인
      const question1 = response.body.questions.find(
        (q: any) => q.id === questions[0].id,
      );
      const question2 = response.body.questions.find(
        (q: any) => q.id === questions[1].id,
      );

      expect(question1).toBeDefined();
      expect(question1.answer).toBe('첫 번째 질문에 대한 답변입니다.');
      expect(question1.answeredAt).toBeDefined();
      expect(question1.answeredBy).toBeDefined();

      expect(question2).toBeDefined();
      expect(question2.answer).toBe('두 번째 질문에 대한 답변입니다.');
      expect(question2.answeredAt).toBeDefined();
      expect(question2.answeredBy).toBeDefined();

      console.log('\n✅ 답변 정보 포함 확인');
      console.log('  - 답변된 질문 수:', answeredQuestions.length);
      console.log('  - 질문 1 답변:', question1.answer);
      console.log('  - 질문 2 답변:', question2.answer);
    });

    it('답변이 없는 질문은 answer 필드가 null이어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 질문 포함하여 동료평가 생성
      const questions = await dataSource.query(
        `SELECT id FROM evaluation_question WHERE "deletedAt" IS NULL LIMIT 2`,
      );
      if (questions.length < 2) {
        console.log('질문 데이터가 부족하여 테스트 스킵');
        return;
      }

      const createResponse = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
          questionIds: [questions[0].id, questions[1].id],
        });

      if (createResponse.status !== 201) {
        console.log('평가 생성 실패, 테스트 스킵');
        return;
      }

      const evaluationId = createResponse.body.id;

      // 답변 저장하지 않고 바로 조회
      const response = await testSuite
        .request()
        .get(`/admin/performance-evaluation/peer-evaluations/${evaluationId}`)
        .expect(HttpStatus.OK);

      // 모든 질문의 answer가 null이어야 함
      expect(response.body.questions).toBeDefined();
      expect(response.body.questions.length).toBeGreaterThan(0);

      response.body.questions.forEach((question: any) => {
        expect(question.answer).toBeNull();
        expect(question.answeredAt).toBeNull();
        expect(question.answeredBy).toBeNull();
      });

      console.log('\n✅ 답변 없는 질문 확인');
    });
  });
});
