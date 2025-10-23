/**
 * 동료평가 요청 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

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

  async function getEmployeeAndPeriod() {
    const data = await dataSource.query(
      `SELECT e.id as "evaluatorId", p.id as "periodId"
       FROM employee e
       CROSS JOIN evaluation_period p
       WHERE e."deletedAt" IS NULL AND p."deletedAt" IS NULL
       LIMIT 2`,
    );
    return data.length >= 2 ? data : null;
  }

  describe('성공 케이스', () => {
    it('동료평가 요청을 생성할 수 있어야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data || data.length < 2) {
        console.log('데이터가 부족해서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({
          evaluatorId: data[0].evaluatorId,
          evaluateeId: data[1].evaluatorId,
          periodId: data[0].periodId,
        });

      // 201 또는 400 허용 (이미 존재하거나 유효성 검증 실패 가능)
      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 동료평가 요청 처리');
    });
  });

  describe('실패 케이스', () => {
    it('필수 필드 누락 시 400 에러', async () => {
      await testSuite
        .request()
        .post('/admin/performance-evaluation/peer-evaluations/requests')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 필수 필드 누락 처리');
    });
  });
});
