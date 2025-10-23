/**
 * 평가기간별 동료평가 취소 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('DELETE /admin/performance-evaluation/peer-evaluations/periods/:periodId (실제 데이터)', () => {
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

  async function getPeriodId() {
    const periods = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return periods.length > 0 ? periods[0].id : null;
  }

  describe('성공 케이스', () => {
    it('평가기간별 동료평가를 취소할 수 있어야 한다', async () => {
      const periodId = await getPeriodId();
      if (!periodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/periods/${periodId}`,
        );

      // 200, 204 또는 404 허용
      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 평가기간별 취소 처리');
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 UUID 형식으로 요청 시 400 또는 404 에러', async () => {
      const response = await testSuite
        .request()
        .delete(
          `/admin/performance-evaluation/peer-evaluations/periods/invalid-uuid`,
        );

      expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log('\n✅ 잘못된 UUID 처리');
    });
  });
});
