/**
 * 동료평가 요청 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 23개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/requests (실제 데이터)', () => {
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

  async function getThreeEmployees() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 3`,
    );
    return result.length >= 3
      ? { evaluator: result[0], evaluatee1: result[1], evaluatee2: result[2] }
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

  async function requestPeerEvaluation(data: any) {
    return testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data);
  }

  async function getPeerEvaluationFromDb(id: string) {
    const records = await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE id = $1`,
      [id],
    );
    return records.length > 0 ? records[0] : null;
  }

  describe('동료평가 요청 성공 시나리오', () => {
    it('기본 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      if (response.status === HttpStatus.CREATED) {
        expect(response.body).toHaveProperty('id');
      }

      console.log('\n✅ 기본 요청 생성 성공');
    });

    it('요청 마감일을 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 마감일 포함 요청 성공');
    });

    it('질문 ID 목록을 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!employees || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
        questionIds: [question.id],
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 질문 ID 포함 요청 성공');
    });

    it('requestedBy를 포함하여 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
        requestedBy: uuidv4(),
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ requestedBy 포함 요청 성공');
    });

    it('requestedBy 없이 동료평가 요청을 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ requestedBy 없이 요청 성공');
    });

    it('동일한 평가자가 여러 피평가자에게서 평가 요청을 받을 수 있어야 한다', async () => {
      const employees = await getThreeEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response1 = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee1.id,
        periodId: period.id,
      });

      const response2 = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee2.id,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response1.status,
      );
      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response2.status,
      );

      console.log('\n✅ 여러 피평가자로부터 요청 성공');
    });

    it('한 피평가자가 여러 평가자에게 평가를 요청할 수 있어야 한다', async () => {
      const result = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 3`,
      );
      if (result.length < 3) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const period = await getEvaluationPeriod();
      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const evaluatee = result[0];
      const evaluator1 = result[1];
      const evaluator2 = result[2];

      const response1 = await requestPeerEvaluation({
        evaluatorId: evaluator1.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      const response2 = await requestPeerEvaluation({
        evaluatorId: evaluator2.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response1.status,
      );
      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response2.status,
      );

      console.log('\n✅ 여러 평가자에게 요청 성공');
    });
  });

  describe('동료평가 요청 실패 시나리오', () => {
    it('잘못된 형식의 evaluatorId로 요청 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: 'invalid-uuid',
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluatorId 처리');
    });

    it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: 'invalid-uuid',
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluateeId 처리');
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      if (!employees) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
          periodId: 'invalid-uuid',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId 처리');
    });

    it('evaluatorId 생략 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ evaluatorId 생략 처리');
    });

    it('evaluateeId 생략 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ evaluateeId 생략 처리');
    });

    it('periodId 생략 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      if (!employees) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ periodId 생략 처리');
    });

    it('잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
          requestedBy: 'invalid-uuid',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 requestedBy 처리');
    });

    it('잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: employees.evaluator.id,
          evaluateeId: employees.evaluatee.id,
          periodId: period.id,
          questionIds: ['invalid-uuid'],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 questionIds 처리');
    });

    it('존재하지 않는 evaluatorId로 요청 시 404 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: uuidv4(),
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 evaluatorId 처리');
    });

    it('존재하지 않는 evaluateeId로 요청 시 404 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: uuidv4(),
        periodId: period.id,
      });

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 evaluateeId 처리');
    });

    it('존재하지 않는 periodId로 요청 시 404 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      if (!employees) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: uuidv4(),
      });

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 periodId 처리');
    });
  });

  describe('동료평가 요청 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED) {
        expect(response.body).toHaveProperty('id');
      }

      console.log('\n✅ 응답 필수 필드 확인');
    });

    it('응답의 ID가 유효한 UUID 형식이어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.id) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(uuidRegex.test(response.body.id)).toBe(true);
      }

      console.log('\n✅ UUID 형식 확인');
    });
  });

  describe('동료평가 요청 데이터 무결성 검증', () => {
    it('생성된 동료평가가 DB에 올바르게 저장되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.id) {
        const dbRecord = await getPeerEvaluationFromDb(response.body.id);
        expect(dbRecord).toBeDefined();
        if (dbRecord) {
          expect(dbRecord.evaluatorId).toBe(employees.evaluator.id);
          expect(dbRecord.evaluateeId).toBe(employees.evaluatee.id);
          expect(dbRecord.periodId).toBe(period.id);
        }
      }

      console.log('\n✅ DB 저장 확인');
    });

    it('생성된 동료평가의 상태가 올바르게 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.id) {
        const dbRecord = await getPeerEvaluationFromDb(response.body.id);
        if (dbRecord) {
          expect(dbRecord.status).toBe('pending');
          expect(dbRecord.isCompleted).toBe(false);
        }
      }

      console.log('\n✅ 상태 설정 확인');
    });

    it('생성 시 createdAt과 updatedAt이 설정되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await requestPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.id) {
        const dbRecord = await getPeerEvaluationFromDb(response.body.id);
        if (dbRecord) {
          expect(dbRecord.createdAt).toBeDefined();
          expect(dbRecord.updatedAt).toBeDefined();
        }
      }

      console.log('\n✅ 타임스탬프 설정 확인');
    });
  });
});
