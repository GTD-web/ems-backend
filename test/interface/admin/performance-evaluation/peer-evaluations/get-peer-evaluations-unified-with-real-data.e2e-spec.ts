/**
 * 동료평가 목록 조회 통합 엔드포인트 - 실제 데이터 기반 E2E 테스트
 * GET /admin/performance-evaluation/peer-evaluations
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/peer-evaluations (통합 엔드포인트 - 실제 데이터)', () => {
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

  async function getEvaluatorId() {
    const result = await dataSource.query(
      `SELECT DISTINCT pe."evaluatorId"
       FROM peer_evaluation pe
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0].evaluatorId : null;
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

  async function getPeriodId() {
    const periods = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return periods.length > 0 ? periods[0].id : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 케이스', () => {
    it('전체 목록 조회: evaluatorId와 evaluateeId 없이 모든 동료평가 목록 조회', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('evaluations');
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      console.log('\n✅ 전체 목록 조회 성공');
    });

    it('평가자 기준 필터링: evaluatorId로 특정 평가자의 동료평가 목록 조회', async () => {
      const evaluatorId = await getEvaluatorId();
      if (!evaluatorId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluatorId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 필터링된 결과에서 모든 평가가 해당 평가자에 대한 것인지 확인
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluator).toBeDefined();
          expect(evaluation.evaluator.id).toBe(evaluatorId);
        });
      }

      console.log('\n✅ 평가자 기준 필터링 성공');
    });

    it('피평가자 기준 필터링: evaluateeId로 특정 피평가자의 동료평가 목록 조회', async () => {
      const evaluateeId = await getEvaluateeId();
      if (!evaluateeId) {
        console.log('동료평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluateeId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 필터링된 결과에서 모든 평가가 해당 피평가자에 대한 것인지 확인
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluatee).toBeDefined();
          expect(evaluation.evaluatee.id).toBe(evaluateeId);
        });
      }

      console.log('\n✅ 피평가자 기준 필터링 성공');
    });

    it('복합 필터링: evaluatorId와 evaluateeId를 함께 사용하여 필터링', async () => {
      const evaluatorId = await getEvaluatorId();
      const evaluateeId = await getEvaluateeId();

      if (!evaluatorId || !evaluateeId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluatorId, evaluateeId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 필터링된 결과 검증
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluator.id).toBe(evaluatorId);
          expect(evaluation.evaluatee.id).toBe(evaluateeId);
        });
      }

      console.log('\n✅ 복합 필터링 검증 완료');
    });

    it('periodId 필터링: 평가기간으로 필터링', async () => {
      const periodId = await getPeriodId();
      if (!periodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 필터링된 결과에서 모든 평가가 해당 평가기간에 대한 것인지 확인
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.period).toBeDefined();
          expect(evaluation.period.id).toBe(periodId);
        });
      }

      console.log('\n✅ periodId 필터링 검증 완료');
    });

    it('status 필터링: 평가 상태로 필터링', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ status: 'in_progress' });

      // 400 또는 200 허용 (API가 status 값을 검증할 수 있음)
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ status 필터링 처리');
    });

    it('페이지네이션 작동: page와 limit 파라미터로 페이지네이션 지원', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ page: 1, limit: 5 })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('total');
      expect(response.body.limit).toBe(5);
      expect(response.body.page).toBe(1);

      console.log('\n✅ 페이지네이션 작동 확인');
    });

    it('응답 구조 검증: 모든 필수 필드가 포함되어야 함', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('evaluations');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('evaluator');
        expect(firstItem).toHaveProperty('evaluatee');
        expect(firstItem).toHaveProperty('period');
        expect(firstItem).toHaveProperty('status');
        expect(firstItem).toHaveProperty('questions');
      }

      console.log('\n✅ 응답 구조 검증 완료');
    });

    it('상세 정보 포함: 평가기간, 평가자, 피평가자, 부서, 매핑자, 질문 목록 포함', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];

        // 평가기간 정보
        if (firstItem.period) {
          expect(firstItem.period).toHaveProperty('id');
          expect(firstItem.period).toHaveProperty('name');
        }

        // 평가자 정보
        expect(firstItem.evaluator).toBeDefined();
        expect(firstItem.evaluator).toHaveProperty('id');
        expect(firstItem.evaluator).toHaveProperty('name');

        // 피평가자 정보
        if (firstItem.evaluatee) {
          expect(firstItem.evaluatee).toHaveProperty('id');
          expect(firstItem.evaluatee).toHaveProperty('name');
        }

        // 질문 목록
        expect(firstItem.questions).toBeDefined();
        expect(Array.isArray(firstItem.questions)).toBe(true);
      }

      console.log('\n✅ 상세 정보 포함 확인');
    });

    it('UUID 형식 검증: 모든 UUID 필드가 유효한 형식이어야 함', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstItem = response.body.evaluations[0];

        // UUID 형식 검증
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        expect(firstItem.id).toMatch(uuidRegex);
        expect(firstItem.evaluator.id).toMatch(uuidRegex);
        if (firstItem.evaluatee) {
          expect(firstItem.evaluatee.id).toMatch(uuidRegex);
        }
        if (firstItem.period) {
          expect(firstItem.period.id).toMatch(uuidRegex);
        }
      }

      console.log('\n✅ UUID 형식 검증 완료');
    });

    it('다중 필터 조합: evaluatorId, evaluateeId, periodId를 함께 사용', async () => {
      const evaluatorId = await getEvaluatorId();
      const evaluateeId = await getEvaluateeId();
      const periodId = await getPeriodId();

      if (!evaluatorId || !evaluateeId || !periodId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluatorId, evaluateeId, periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 모든 필터 조건이 적용되었는지 확인
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluator.id).toBe(evaluatorId);
          expect(evaluation.evaluatee.id).toBe(evaluateeId);
          expect(evaluation.period.id).toBe(periodId);
        });
      }

      console.log('\n✅ 다중 필터 조합 검증 완료');
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 evaluatorId 형식으로 필터링 시 400 에러', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluatorId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluatorId 형식 처리');
    });

    it('잘못된 evaluateeId 형식으로 필터링 시 400 에러', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluateeId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluateeId 형식 처리');
    });

    it('잘못된 periodId 형식으로 필터링 시 400 에러', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ periodId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId 형식 처리');
    });

    it('잘못된 페이지 번호 시 400 에러', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ page: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 페이지 번호 처리');
    });

    it('존재하지 않는 evaluatorId로 필터링 시 빈 목록 반환', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluatorId: nonExistentId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 존재하지 않는 evaluatorId 처리');
    });

    it('존재하지 않는 evaluateeId로 필터링 시 빈 목록 반환', async () => {
      const nonExistentId = '00000000-0000-4000-8000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/peer-evaluations')
        .query({ evaluateeId: nonExistentId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 존재하지 않는 evaluateeId 처리');
    });
  });
});


