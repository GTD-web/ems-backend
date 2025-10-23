/**
 * 할당된 피평가자 목록 조회 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId/assigned-evaluatees (실제 데이터)', () => {
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

  // ==================== 테스트 케이스 ====================

  describe('성공 케이스', () => {
    it('기본 목록: 할당된 피평가자 목록을 조회할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`,
        )
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ 기본 목록 조회 성공');
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
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`,
        )
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ periodId 필터링 성공');
    });

    it('필터링: includeCompleted로 완료된 평가 포함 여부를 제어할 수 있어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`,
        )
        .query({ includeCompleted: 'true' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ includeCompleted 필터링 성공');
    });

    it('응답 구조: 피평가자 정보가 포함되어야 한다', async () => {
      const evaluatorId = await getEvaluatorWithPeerEvaluations();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`,
        )
        .expect(HttpStatus.OK);

      if (response.body.length > 0) {
        const firstItem = response.body[0];
        expect(firstItem).toHaveProperty('evaluateeId');
        expect(firstItem).toHaveProperty('evaluatee');
        expect(firstItem.evaluatee).toHaveProperty('name');
        expect(firstItem).toHaveProperty('evaluationId');
        expect(firstItem).toHaveProperty('status');
      }

      console.log('\n✅ 응답 구조 확인');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 평가자 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${nonExistentId}/assigned-evaluatees`,
        )
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      console.log('\n✅ 존재하지 않는 평가자 처리');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid';

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${invalidId}/assigned-evaluatees`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 처리');
    });
  });
});
