/**
 * 동료평가 상세 조회 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

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

  async function getPeerEvaluationId() {
    const result = await dataSource.query(
      `SELECT id FROM peer_evaluation WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0].id : null;
  }

  describe('성공 케이스', () => {
    it('동료평가 상세 정보를 조회할 수 있어야 한다', async () => {
      const evalId = await getPeerEvaluationId();
      if (!evalId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`/admin/performance-evaluation/peer-evaluations/${evalId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('evaluator');
      expect(response.body).toHaveProperty('evaluatee');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('status');

      console.log('\n✅ 상세 조회 성공');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404 에러', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .get(`/admin/performance-evaluation/peer-evaluations/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 ID 처리');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러', async () => {
      await testSuite
        .request()
        .get(`/admin/performance-evaluation/peer-evaluations/invalid-uuid`)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 처리');
    });
  });
});
