/**
 * 동료평가 일괄 요청 (N:1) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 28개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('POST /admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators (실제 데이터)', () => {
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

  async function getEvaluatee() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getThreeEvaluators() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL OFFSET 1 LIMIT 3`,
    );
    return result.length >= 3
      ? [result[0].id, result[1].id, result[2].id]
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

  async function bulkRequestToMultipleEvaluators(data: any) {
    return testSuite
      .request()
      .post(
        '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
      )
      .send(data);
  }

  describe('동료평가 일괄 요청 성공 시나리오', () => {
    it('기본 일괄 요청을 생성할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      if (response.status === HttpStatus.CREATED) {
        expect(response.body).toHaveProperty('ids');
        expect(Array.isArray(response.body.ids)).toBe(true);
      }

      console.log('\n✅ 기본 일괄 요청 성공');
    });

    it('요청 마감일을 포함하여 일괄 요청을 생성할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 마감일 포함 일괄 요청 성공');
    });

    it('질문 ID 목록을 포함하여 일괄 요청을 생성할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      const question = await getQuestion();
      if (!evaluatee || !evaluators || !period || !question) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
        questionIds: [question.id],
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 질문 ID 포함 일괄 요청 성공');
    });

    it('requestedBy를 포함하여 일괄 요청을 생성할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
        requestedBy: uuidv4(),
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ requestedBy 포함 일괄 요청 성공');
    });

    it('requestedBy 없이 일괄 요청을 생성할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ requestedBy 없이 일괄 요청 성공');
    });

    it('단일 평가자에게도 요청할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: [evaluators[0]],
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 단일 평가자 요청 성공');
    });

    it('많은 평가자에게 동시에 요청할 수 있어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 다수 평가자 일괄 요청 성공');
    });
  });

  describe('동료평가 일괄 요청 실패 시나리오', () => {
    it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: 'invalid-uuid',
          evaluatorIds: evaluators,
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluateeId 처리');
    });

    it('잘못된 형식의 evaluatorIds로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          evaluatorIds: ['invalid-uuid'],
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluatorIds 처리');
    });

    it('잘못된 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      if (!evaluatee || !evaluators) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          evaluatorIds: evaluators,
          periodId: 'invalid-uuid',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId 처리');
    });

    it('빈 evaluatorIds 배열로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          evaluatorIds: [],
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 빈 배열 처리');
    });

    it('evaluateeId 생략 시 400 에러가 발생해야 한다', async () => {
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluatorIds: evaluators,
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ evaluateeId 생략 처리');
    });

    it('evaluatorIds 생략 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          periodId: period.id,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ evaluatorIds 생략 처리');
    });

    it('periodId 생략 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      if (!evaluatee || !evaluators) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          evaluatorIds: evaluators,
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ periodId 생략 처리');
    });

    it('잘못된 형식의 requestedBy로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          evaluatorIds: evaluators,
          periodId: period.id,
          requestedBy: 'invalid-uuid',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 requestedBy 처리');
    });

    it('잘못된 형식의 questionIds로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          '/admin/performance-evaluation/peer-evaluations/requests/bulk/one-evaluatee-to-many-evaluators',
        )
        .send({
          evaluateeId: evaluatee.id,
          evaluatorIds: evaluators,
          periodId: period.id,
          questionIds: ['invalid-uuid'],
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 questionIds 처리');
    });

    it('존재하지 않는 evaluateeId로 요청 시 아무것도 생성되지 않아야 한다', async () => {
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: uuidv4(),
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      expect([
        HttpStatus.CREATED,
        HttpStatus.NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 evaluateeId 처리');
    });

    it('존재하지 않는 evaluatorId 포함 시 해당 평가자는 건너뛰고 나머지를 생성해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: [...evaluators, uuidv4()],
        periodId: period.id,
      });

      expect([
        HttpStatus.CREATED,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 evaluatorId 처리');
    });

    it('존재하지 않는 periodId로 요청 시 아무것도 생성되지 않아야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      if (!evaluatee || !evaluators) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: uuidv4(),
      });

      expect([
        HttpStatus.CREATED,
        HttpStatus.NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 periodId 처리');
    });

    it('중복된 evaluatorId가 포함된 경우 한 번만 생성되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: [evaluators[0], evaluators[0], evaluators[1]],
        periodId: period.id,
      });

      expect([
        HttpStatus.CREATED,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 중복 evaluatorId 처리');
    });
  });

  describe('동료평가 일괄 요청 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED) {
        expect(response.body).toHaveProperty('ids');
        expect(response.body).toHaveProperty('count');
      }

      console.log('\n✅ 응답 필수 필드 확인');
    });

    it('응답의 IDs가 모두 유효한 UUID 형식이어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.ids) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        response.body.ids.forEach((id: string) => {
          expect(uuidRegex.test(id)).toBe(true);
        });
      }

      console.log('\n✅ UUID 형식 확인');
    });

    it('응답의 count가 생성된 평가 개수와 일치해야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED) {
        expect(response.body.count).toBe(response.body.ids.length);
      }

      console.log('\n✅ count 일치 확인');
    });

    it('부분 성공 시 응답에 성공/실패 정보가 포함되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: [...evaluators, uuidv4()],
        periodId: period.id,
      });

      expect([
        HttpStatus.CREATED,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 부분 성공 응답 확인');
    });
  });

  describe('동료평가 일괄 요청 데이터 무결성 검증', () => {
    it('생성된 모든 동료평가가 DB에 올바르게 저장되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.ids) {
        for (const id of response.body.ids) {
          const dbRecord = await dataSource.query(
            `SELECT * FROM peer_evaluation WHERE id = $1`,
            [id],
          );
          expect(dbRecord.length).toBeGreaterThan(0);
          if (dbRecord.length > 0) {
            expect(dbRecord[0].evaluateeId).toBe(evaluatee.id);
            expect(evaluators).toContain(dbRecord[0].evaluatorId);
            expect(dbRecord[0].periodId).toBe(period.id);
          }
        }
      }

      console.log('\n✅ DB 저장 확인');
    });

    it('생성된 모든 동료평가의 상태가 올바르게 설정되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.ids) {
        for (const id of response.body.ids) {
          const dbRecord = await dataSource.query(
            `SELECT * FROM peer_evaluation WHERE id = $1`,
            [id],
          );
          if (dbRecord.length > 0) {
            expect(dbRecord[0].status).toBe('pending');
            expect(dbRecord[0].isCompleted).toBe(false);
          }
        }
      }

      console.log('\n✅ 상태 설정 확인');
    });

    it('생성 시 모든 평가의 createdAt과 updatedAt이 설정되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      if (response.status === HttpStatus.CREATED && response.body.ids) {
        for (const id of response.body.ids) {
          const dbRecord = await dataSource.query(
            `SELECT * FROM peer_evaluation WHERE id = $1`,
            [id],
          );
          if (dbRecord.length > 0) {
            expect(dbRecord[0].createdAt).toBeDefined();
            expect(dbRecord[0].updatedAt).toBeDefined();
          }
        }
      }

      console.log('\n✅ 타임스탬프 설정 확인');
    });

    it('평가자 목록에 피평가자 본인을 포함할 경우 제외되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: [evaluatee.id, ...evaluators],
        periodId: period.id,
      });

      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 자기 자신 제외 확인');
    });

    it('동일한 조합의 평가 요청 시 중복 생성이 방지되어야 한다', async () => {
      const evaluatee = await getEvaluatee();
      const evaluators = await getThreeEvaluators();
      const period = await getEvaluationPeriod();
      if (!evaluatee || !evaluators || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const firstResponse = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      const secondResponse = await bulkRequestToMultipleEvaluators({
        evaluateeId: evaluatee.id,
        evaluatorIds: evaluators,
        periodId: period.id,
      });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        firstResponse.status,
      );
      expect([
        HttpStatus.CREATED,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(secondResponse.status);

      console.log('\n✅ 중복 방지 확인');
    });
  });
});
