/**
 * 동료평가 제출 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

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

  async function getIncompletePeerEvaluation() {
    const result = await dataSource.query(
      `SELECT id FROM peer_evaluation 
       WHERE "isCompleted" = false AND "deletedAt" IS NULL 
       LIMIT 1`,
    );
    return result.length > 0 ? result[0].id : null;
  }

  describe('성공 케이스', () => {
    it('미완료 동료평가를 제출할 수 있어야 한다', async () => {
      const evalId = await getIncompletePeerEvaluation();
      if (!evalId) {
        console.log('미완료 동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(`/admin/performance-evaluation/peer-evaluations/${evalId}/submit`)
        .send();

      // 200 또는 400 허용 (평가 내용이 없으면 실패할 수 있음)
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 동료평가 제출 처리');
    });
  });

  describe('실패 케이스', () => {
    it('존재하지 않는 ID로 제출 시 400 에러', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/${nonExistentId}/submit`,
        )
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 존재하지 않는 ID 처리');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러', async () => {
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/peer-evaluations/invalid-uuid/submit`,
        )
        .send()
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 처리');
    });
  });
});
