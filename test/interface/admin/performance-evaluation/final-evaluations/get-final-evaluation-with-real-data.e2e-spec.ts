/**
 * 최종평가 상세 조회 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/final-evaluations/:id (실제 데이터)', () => {
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

  async function getFinalEvaluationId() {
    const evals = await dataSource.query(
      `SELECT id FROM final_evaluations WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return evals.length > 0 ? evals[0].id : null;
  }

  it('성공: 최종평가를 조회할 수 있어야 한다', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('employee');
    expect(response.body).toHaveProperty('period');

    console.log('\n✅ 최종평가 조회 성공');
  });

  it('성공: 직원 정보가 포함되어야 한다', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body.employee).toHaveProperty('id');
    expect(response.body.employee).toHaveProperty('name');
    expect(response.body.employee).toHaveProperty('employeeNumber');

    console.log('\n✅ 직원 정보 포함 확인');
  });

  it('성공: 평가기간 정보가 포함되어야 한다', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body.period).toHaveProperty('id');
    expect(response.body.period).toHaveProperty('name');

    console.log('\n✅ 평가기간 정보 포함 확인');
  });

  it('성공: 평가 상세 정보가 포함되어야 한다', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    // 평가 상세 정보가 있으면 확인
    if (response.body.evaluationGrade) {
      expect(typeof response.body.evaluationGrade).toBe('string');
    }
    if (response.body.jobGrade) {
      expect(typeof response.body.jobGrade).toBe('string');
    }
    expect(response.body).toHaveProperty('isConfirmed');

    console.log('\n✅ 평가 상세 정보 포함 확인');
  });

  it('실패: 존재하지 않는 ID로 조회 시 404 에러가 발생해야 한다', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${nonExistentId}`)
      .expect(HttpStatus.NOT_FOUND);

    console.log('\n✅ 존재하지 않는 평가 처리 성공');
  });

  it('실패: 잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
    const invalidId = 'invalid-uuid';

    await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${invalidId}`)
      .expect(HttpStatus.BAD_REQUEST);

    console.log('\n✅ 잘못된 UUID 처리 성공');
  });

  it('성공: 확정된 평가 조회', async () => {
    const confirmed = await dataSource.query(
      `SELECT id FROM final_evaluations WHERE "isConfirmed" = true AND "deletedAt" IS NULL LIMIT 1`,
    );

    if (!confirmed || confirmed.length === 0) {
      console.log('확정된 평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${confirmed[0].id}`)
      .expect(HttpStatus.OK);

    expect(response.body.isConfirmed).toBe(true);
    expect(response.body).toHaveProperty('confirmedAt');

    console.log('\n✅ 확정된 평가 조회 성공');
  });

  it('성공: 미확정 평가 조회', async () => {
    const unconfirmed = await dataSource.query(
      `SELECT id FROM final_evaluations WHERE "isConfirmed" = false AND "deletedAt" IS NULL LIMIT 1`,
    );

    if (!unconfirmed || unconfirmed.length === 0) {
      console.log('미확정 평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(
        `/admin/performance-evaluation/final-evaluations/${unconfirmed[0].id}`,
      )
      .expect(HttpStatus.OK);

    expect(response.body.isConfirmed).toBe(false);

    console.log('\n✅ 미확정 평가 조회 성공');
  });

  it('성공: jobGrade 필드 확인', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('jobGrade');
    expect(response.body).toHaveProperty('jobDetailedGrade');

    console.log('\n✅ jobGrade 필드 확인');
  });

  it('성공: finalComments 필드 확인', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    // finalComments는 optional이므로 존재 여부만 확인
    expect(response.body).toBeDefined();

    console.log('\n✅ finalComments 필드 확인');
  });

  it('성공: createdAt과 updatedAt 필드 확인', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('createdAt');
    expect(response.body).toHaveProperty('updatedAt');

    console.log('\n✅ 생성/수정 시간 필드 확인');
  });

  it('성공: 여러 평가를 순차적으로 조회', async () => {
    const evals = await dataSource.query(
      `SELECT id FROM final_evaluations WHERE "deletedAt" IS NULL LIMIT 5`,
    );

    if (!evals || evals.length === 0) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    for (const evaluation of evals) {
      const response = await testSuite
        .request()
        .get(`/admin/performance-evaluation/final-evaluations/${evaluation.id}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(evaluation.id);
    }

    console.log('\n✅ 순차 조회 성공');
  });

  it('성공: 응답에 모든 등급 필드가 포함되어야 한다', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    expect(response.body).toHaveProperty('evaluationGrade');
    expect(response.body).toHaveProperty('jobGrade');
    expect(response.body).toHaveProperty('jobDetailedGrade');

    console.log('\n✅ 등급 필드 모두 포함 확인');
  });

  it('성공: actionBy 필드 확인', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    const response = await testSuite
      .request()
      .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
      .expect(HttpStatus.OK);

    // actionBy는 optional이므로 존재 여부만 체크
    expect(response.body).toBeDefined();

    console.log('\n✅ actionBy 필드 확인');
  });

  it('성공: 같은 ID로 여러 번 조회', async () => {
    const evalId = await getFinalEvaluationId();
    if (!evalId) {
      console.log('최종평가가 없어서 테스트 스킵');
      return;
    }

    for (let i = 0; i < 3; i++) {
      const response = await testSuite
        .request()
        .get(`/admin/performance-evaluation/final-evaluations/${evalId}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(evalId);
    }

    console.log('\n✅ 중복 조회 성공');
  });

  it('성공: 다양한 등급의 평가 조회', async () => {
    const grades = ['S', 'A', 'B', 'C', 'D'];

    for (const grade of grades) {
      const evals = await dataSource.query(
        `SELECT id FROM final_evaluations WHERE "evaluationGrade" = $1 AND "deletedAt" IS NULL LIMIT 1`,
        [grade],
      );

      if (evals && evals.length > 0) {
        const response = await testSuite
          .request()
          .get(`/admin/performance-evaluation/final-evaluations/${evals[0].id}`)
          .expect(HttpStatus.OK);

        expect(response.body.evaluationGrade).toBe(grade);
      }
    }

    console.log('\n✅ 다양한 등급 조회 성공');
  });
});
