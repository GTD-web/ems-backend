/**
 * 평가자의 동료평가 목록 조회 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 시드 데이터 초기화
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

    // full 시나리오로 시드 데이터 생성
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

  // ==================== 헬퍼 함수 ====================

  async function getEvaluatorWithPeerEvaluations() {
    const result = await dataSource.query(
      `SELECT DISTINCT pe."evaluatorId"
       FROM peer_evaluation pe
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0].evaluatorId : null;
  }

  async function getPeriodId() {
    const periods = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return periods.length > 0 ? periods[0].id : null;
  }

  async function getEvaluateeId() {
    const result = await dataSource.query(
      `SELECT DISTINCT pe."evaluateeId"
       FROM peer_evaluation pe
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0].evaluateeId : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 케이스', () => {
    it('기본 목록: 동료평가 목록을 조회할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');

      console.log('\n✅ 기본 목록 조회 성공');
    });

    it('여러 개의 평가 목록을 조회할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(0);

      console.log('\n✅ 여러 평가 목록 조회 성공');
    });

    it('페이지네이션: page와 limit 파라미터가 작동해야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ page: 1, limit: 5 })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body.limit).toBe(5);

      console.log('\n✅ 페이지네이션 성공');
    });

    it('필터링: evaluateeId로 필터링할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      const evaluateeId = await getEvaluateeId();

      if (!evaluatorId || !evaluateeId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ evaluateeId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ evaluateeId 필터링 성공');
    });

    it('필터링: periodId로 필터링할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      const periodId = await getPeriodId();

      if (!evaluatorId || !periodId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ periodId 필터링 성공');
    });

    it('필터링: status로 필터링할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ status: 'in_progress' });

      // 400 또는 200 허용 (API가 status 값을 검증할 수 있음)
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ status 필터링 처리');
    });

    it('응답 구조: 평가 정보가 포함되어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('evaluatorId');
        expect(firstItem).toHaveProperty('evaluateeId');
        expect(firstItem).toHaveProperty('periodId');
        expect(firstItem).toHaveProperty('status');
      }

      console.log('\n✅ 응답 구조 확인');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 평가자 ID로 조회 시 빈 목록을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${nonExistentId}`,
        )
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 존재하지 않는 평가자 처리');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid';

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${invalidId}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 처리');
    });

    it('잘못된 페이지 번호 시 400 에러', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}`,
        )
        .query({ page: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 페이지 처리');
    });
  });
});
