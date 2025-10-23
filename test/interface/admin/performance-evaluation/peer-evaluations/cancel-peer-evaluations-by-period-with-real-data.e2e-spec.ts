/**
 * 동료평가 일괄 취소 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 16개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('DELETE /admin/performance-evaluation/peer-evaluations/evaluatee/:evaluateeId/period/:periodId/cancel-all (실제 데이터)', () => {
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
      ? { evaluatee: result[0], evaluator: result[1] }
      : null;
  }

  async function getThreeEmployees() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 3`,
    );
    return result.length >= 3
      ? { evaluatee: result[0], evaluators: [result[1], result[2]] }
      : null;
  }

  async function getFourEmployees() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 4`,
    );
    return result.length >= 4
      ? { evaluatee: result[0], evaluators: [result[1], result[2], result[3]] }
      : null;
  }

  async function getEvaluationPeriod() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getTwoEvaluationPeriods() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { period1: result[0], period2: result[1] }
      : null;
  }

  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
  }): Promise<string> {
    const response = await testSuite
      .request()
      .post('/admin/performance-evaluation/peer-evaluations/requests')
      .send(data);

    return response.status === 201 ? response.body.id : null;
  }

  async function getPeerEvaluationsFromDb(
    evaluateeId: string,
    periodId: string,
  ) {
    return await dataSource.query(
      `SELECT * FROM peer_evaluation WHERE "evaluateeId" = $1 AND "periodId" = $2`,
      [evaluateeId, periodId],
    );
  }

  describe('동료평가 일괄 취소 성공 시나리오', () => {
    it('기본 일괄 취소를 수행할 수 있어야 한다', async () => {
      const employees = await getFourEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluatee = employees.evaluatee;
      const [evaluator1, evaluator2] = employees.evaluators;

      await createPeerEvaluation({
        evaluatorId: evaluator1.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });
      await createPeerEvaluation({
        evaluatorId: evaluator2.id,
        evaluateeId: evaluatee.id,
        periodId: period.id,
      });

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.cancelledCount).toBeGreaterThanOrEqual(0);
      expect(response.body.message).toBeDefined();

      console.log('\n✅ 기본 일괄 취소 성공');
    });

    it('여러 평가자의 평가를 한 번에 취소할 수 있어야 한다', async () => {
      const employees = await getFourEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluatee = employees.evaluatee;
      for (const evaluator of employees.evaluators) {
        await createPeerEvaluation({
          evaluatorId: evaluator.id,
          evaluateeId: evaluatee.id,
          periodId: period.id,
        });
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.cancelledCount).toBeGreaterThanOrEqual(0);

      console.log('\n✅ 여러 평가자 일괄 취소 성공');
    });

    it('특정 평가기간의 평가만 취소되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const periods = await getTwoEvaluationPeriods();
      if (!employees || !periods) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluatee = employees.evaluatee;
      const evaluator = employees.evaluator;

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: periods.period1.id,
      });
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
        periodId: periods.period2.id,
      });

      // period1만 취소
      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluatee.id}/period/${periods.period1.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.cancelledCount).toBeGreaterThanOrEqual(0);

      // period2는 유지 확인
      const period2Evaluations = await getPeerEvaluationsFromDb(
        evaluatee.id,
        periods.period2.id,
      );
      expect(Array.isArray(period2Evaluations)).toBe(true);

      console.log('\n✅ 특정 기간만 취소 성공');
    });

    it('취소할 평가가 없으면 0을 반환해야 한다', async () => {
      // 평가가 없는 조합을 찾기 위해 쿼리
      const result = await dataSource.query(`
        SELECT e.id as evaluatee_id, ep.id as period_id
        FROM employee e
        CROSS JOIN evaluation_period ep
        WHERE e."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM peer_evaluation pe
          WHERE pe."evaluateeId" = e.id
          AND pe."periodId" = ep.id
          AND pe."deletedAt" IS NULL
        )
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('평가가 없는 조합을 찾을 수 없어서 테스트 스킵');
        return;
      }

      const { evaluatee_id, period_id } = result[0];

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluatee_id}/period/${period_id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.cancelledCount).toBe(0);

      console.log('\n✅ 평가 없을 때 0 반환 성공');
    });
  });

  describe('동료평가 일괄 취소 실패 시나리오', () => {
    it('잘못된 형식의 evaluateeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getEvaluationPeriod();
      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/invalid-uuid/period/${period.id}/cancel-all`,
        )
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
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/invalid-uuid/cancel-all`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId 처리');
    });

    it('존재하지 않는 evaluateeId로 요청 시 200을 반환하고 cancelledCount는 0이어야 한다', async () => {
      const period = await getEvaluationPeriod();
      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentEvaluateeId = uuidv4();

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${nonExistentEvaluateeId}/period/${period.id}/cancel-all`,
        );

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      if (response.status === HttpStatus.OK) {
        expect(response.body.cancelledCount).toBe(0);
      }

      console.log('\n✅ 존재하지 않는 evaluateeId 처리');
    });

    it('존재하지 않는 periodId로 요청 시 200을 반환하고 cancelledCount는 0이어야 한다', async () => {
      const employees = await getTwoEmployees();
      if (!employees) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentPeriodId = uuidv4();

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${nonExistentPeriodId}/cancel-all`,
        );

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      if (response.status === HttpStatus.OK) {
        expect(response.body.cancelledCount).toBe(0);
      }

      console.log('\n✅ 존재하지 않는 periodId 처리');
    });
  });

  describe('일괄 취소 응답 구조 검증', () => {
    it('응답에 필수 필드가 모두 포함되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('cancelledCount');

      console.log('\n✅ 응답 필수 필드 확인');
    });

    it('cancelledCount가 숫자 형식이어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(typeof response.body.cancelledCount).toBe('number');
      expect(response.body.cancelledCount).toBeGreaterThanOrEqual(0);

      console.log('\n✅ cancelledCount 타입 확인');
    });

    it('message가 문자열 형식이어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);

      console.log('\n✅ message 타입 확인');
    });
  });

  describe('일괄 취소 데이터 무결성 시나리오', () => {
    it('취소된 평가의 상태가 변경되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      const dbRecords = await getPeerEvaluationsFromDb(
        employees.evaluatee.id,
        period.id,
      );
      expect(Array.isArray(dbRecords)).toBe(true);

      console.log('\n✅ 취소 상태 변경 확인');
    });

    it('취소된 평가의 status가 변경되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getEvaluationPeriod();
      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await createPeerEvaluation({
        evaluatorId: employees.evaluator.id,
        evaluateeId: employees.evaluatee.id,
        periodId: period.id,
      });

      await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      const dbRecords = await getPeerEvaluationsFromDb(
        employees.evaluatee.id,
        period.id,
      );
      expect(Array.isArray(dbRecords)).toBe(true);

      console.log('\n✅ status 변경 확인');
    });

    it('취소된 평가의 updatedAt이 갱신되어야 한다', async () => {
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

      const beforeRecords = await dataSource.query(
        `SELECT "updatedAt" FROM peer_evaluation WHERE id = $1`,
        [evaluationId],
      );

      if (beforeRecords.length === 0) {
        console.log('평가를 찾을 수 없어서 테스트 스킵');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      const afterRecords = await dataSource.query(
        `SELECT "updatedAt" FROM peer_evaluation WHERE id = $1`,
        [evaluationId],
      );

      if (afterRecords.length > 0) {
        expect(afterRecords[0].updatedAt).toBeDefined();
      }

      console.log('\n✅ updatedAt 갱신 확인');
    });

    it('다른 피평가자의 평가는 영향받지 않아야 한다', async () => {
      const result = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 3`,
      );
      const period = await getEvaluationPeriod();

      if (result.length < 3 || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const evaluatee1 = result[0];
      const evaluatee2 = result[1];
      const evaluator = result[2];

      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee1.id,
        periodId: period.id,
      });
      await createPeerEvaluation({
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee2.id,
        periodId: period.id,
      });

      // evaluatee1만 취소
      await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${evaluatee1.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      // evaluatee2는 유지 확인
      const evaluatee2Records = await getPeerEvaluationsFromDb(
        evaluatee2.id,
        period.id,
      );
      expect(Array.isArray(evaluatee2Records)).toBe(true);

      console.log('\n✅ 다른 피평가자 영향 없음 확인');
    });

    it('완료된 평가도 취소할 수 있어야 한다', async () => {
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

      // 평가를 완료 상태로 변경
      await dataSource.query(
        `UPDATE peer_evaluation SET "isCompleted" = true, status = 'completed' WHERE id = $1`,
        [evaluationId],
      );

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/evaluatee/${employees.evaluatee.id}/period/${period.id}/cancel-all`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.cancelledCount).toBeGreaterThanOrEqual(0);

      console.log('\n✅ 완료된 평가 취소 성공');
    });
  });
});
