/**
 * 최종평가 확정 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/performance-evaluation/final-evaluations/:id/confirm (실제 데이터)', () => {
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

  async function getUnconfirmedEvaluation() {
    const evals = await dataSource.query(
      `SELECT id FROM final_evaluations 
       WHERE "isConfirmed" = false AND "deletedAt" IS NULL LIMIT 1`,
    );
    return evals.length > 0 ? evals[0].id : null;
  }

  async function getConfirmedEvaluation() {
    const evals = await dataSource.query(
      `SELECT id FROM final_evaluations 
       WHERE "isConfirmed" = true AND "deletedAt" IS NULL LIMIT 1`,
    );
    return evals.length > 0 ? evals[0].id : null;
  }

  it('성공: 미확정 최종평가를 확정할 수 있어야 한다', async () => {
    const evalId = await getUnconfirmedEvaluation();
    if (!evalId) {
      console.log('미확정 최종평가가 없어서 테스트 스킵');
      return;
    }

    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${evalId}/confirm`)
      .send()
      .expect(HttpStatus.OK);

    console.log('\n✅ 최종평가 확정 성공');
  });

  it('성공: 확정 후 DB에서 isConfirmed가 true로 변경되어야 한다', async () => {
    const evalId = await getUnconfirmedEvaluation();
    if (!evalId) {
      console.log('미확정 최종평가가 없어서 테스트 스킵');
      return;
    }

    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${evalId}/confirm`)
      .send()
      .expect(HttpStatus.OK);

    // DB에서 확정 상태 확인
    const result = await dataSource.query(
      `SELECT "isConfirmed" FROM final_evaluations WHERE id = $1`,
      [evalId],
    );

    if (result.length > 0) {
      expect(result[0].isConfirmed).toBe(true);
    }

    console.log('\n✅ 확정 상태 변경 확인');
  });

  it('실패: 이미 확정된 평가는 다시 확정할 수 없어야 한다', async () => {
    const evalId = await getConfirmedEvaluation();
    if (!evalId) {
      console.log('확정된 최종평가가 없어서 테스트 스킵');
      return;
    }

    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${evalId}/confirm`)
      .send()
      .expect(HttpStatus.CONFLICT);

    console.log('\n✅ 중복 확정 방지 성공');
  });

  it('실패: 존재하지 않는 평가는 확정할 수 없어야 한다', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/${nonExistentId}/confirm`,
      )
      .send()
      .expect(HttpStatus.NOT_FOUND);

    console.log('\n✅ 존재하지 않는 평가 확정 방지 성공');
  });

  it('실패: 잘못된 UUID로 확정 시도 시 400 에러가 발생해야 한다', async () => {
    const invalidId = 'invalid-uuid';

    await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/final-evaluations/${invalidId}/confirm`,
      )
      .send()
      .expect(HttpStatus.BAD_REQUEST);

    console.log('\n✅ 잘못된 UUID 처리 성공');
  });

  it('성공: 여러 평가를 순차적으로 확정', async () => {
    const evals = await dataSource.query(
      `SELECT id FROM final_evaluations 
       WHERE "isConfirmed" = false AND "deletedAt" IS NULL LIMIT 3`,
    );

    if (!evals || evals.length === 0) {
      console.log('미확정 평가가 없어서 테스트 스킵');
      return;
    }

    for (const evaluation of evals) {
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/${evaluation.id}/confirm`,
        )
        .send()
        .expect(HttpStatus.OK);
    }

    console.log('\n✅ 순차 확정 성공');
  });

  it('성공: confirmedAt 타임스탬프가 기록되어야 한다', async () => {
    const evalId = await getUnconfirmedEvaluation();
    if (!evalId) {
      console.log('미확정 평가가 없어서 테스트 스킵');
      return;
    }

    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${evalId}/confirm`)
      .send()
      .expect(HttpStatus.OK);

    const result = await dataSource.query(
      `SELECT "confirmedAt" FROM final_evaluations WHERE id = $1`,
      [evalId],
    );

    if (result.length > 0) {
      expect(result[0].confirmedAt).toBeTruthy();
    }

    console.log('\n✅ confirmedAt 타임스탬프 기록 확인');
  });

  it('성공: 확정 후 다시 조회 시 isConfirmed가 true', async () => {
    const evalId = await getUnconfirmedEvaluation();
    if (!evalId) {
      console.log('미확정 평가가 없어서 테스트 스킵');
      return;
    }

    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${evalId}/confirm`)
      .send()
      .expect(HttpStatus.OK);

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body.isConfirmed).toBe(true);

    console.log('\n✅ 확정 후 조회 검증');
  });

  it('실패: 빈 ID로 요청', async () => {
    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations//confirm`)
      .send()
      .expect(HttpStatus.NOT_FOUND);

    console.log('\n✅ 빈 ID 처리');
  });

  it('성공: 확정 후 목록에서 확인', async () => {
    const evalId = await getUnconfirmedEvaluation();
    if (!evalId) {
      console.log('미확정 평가가 없어서 테스트 스킵');
      return;
    }

    await testSuite
      .request()
      .post(`/admin/performance-evaluation/final-evaluations/${evalId}/confirm`)
      .send()
      .expect(HttpStatus.OK);

    const listResponse = await testSuite
      .request()
      .get('/admin/performance-evaluation/final-evaluations')
      .query({ confirmedOnly: 'true' })
      .expect(HttpStatus.OK);

    const found = listResponse.body.evaluations.some(
      (e: any) => e.id === evalId,
    );
    expect(found).toBe(true);

    console.log('\n✅ 확정 후 목록 확인');
  });
});
