/**
 * 하향평가 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오에서 생성된 하향평가 데이터를 조회하는 테스트입니다.
 * Phase 7에서 자동으로 생성된 하향평가 데이터를 사용합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/downward-evaluations/evaluator/:evaluatorId - 목록 조회 (실제 데이터)', () => {
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
      .send({
        scenario: 'full',
        clearExisting: false,
      })
      .expect(201);

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getExistingEvaluator() {
    // Phase 7에서 생성된 하향평가의 평가자 조회
    const evaluators = await dataSource.query(
      `SELECT DISTINCT "evaluatorId" as id, COUNT(*) as evaluation_count
       FROM downward_evaluation
       WHERE "deletedAt" IS NULL
       GROUP BY "evaluatorId"
       HAVING COUNT(*) > 0
       LIMIT 1`,
    );
    return evaluators.length > 0 ? evaluators[0] : null;
  }

  async function getEvaluateeForEvaluator(evaluatorId: string) {
    const evaluatees = await dataSource.query(
      `SELECT DISTINCT "employeeId" as id
       FROM downward_evaluation
       WHERE "evaluatorId" = $1 AND "deletedAt" IS NULL
       LIMIT 1`,
      [evaluatorId],
    );
    return evaluatees.length > 0 ? evaluatees[0] : null;
  }

  async function getPeriodForEvaluator(evaluatorId: string) {
    const periods = await dataSource.query(
      `SELECT DISTINCT "periodId" as id
       FROM downward_evaluation
       WHERE "evaluatorId" = $1 AND "deletedAt" IS NULL
       LIMIT 1`,
      [evaluatorId],
    );
    return periods.length > 0 ? periods[0] : null;
  }

  async function getWbsForEvaluator(evaluatorId: string) {
    const wbsList = await dataSource.query(
      `SELECT DISTINCT "wbsId" as id
       FROM downward_evaluation
       WHERE "evaluatorId" = $1 AND "deletedAt" IS NULL
       LIMIT 1`,
      [evaluatorId],
    );
    return wbsList.length > 0 ? wbsList[0] : null;
  }

  async function getCompletedEvaluationForEvaluator(evaluatorId: string) {
    const evaluations = await dataSource.query(
      `SELECT id
       FROM downward_evaluation
       WHERE "evaluatorId" = $1 AND "isCompleted" = true AND "deletedAt" IS NULL
       LIMIT 1`,
      [evaluatorId],
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  async function getIncompleteEvaluationForEvaluator(evaluatorId: string) {
    const evaluations = await dataSource.query(
      `SELECT id
       FROM downward_evaluation
       WHERE "evaluatorId" = $1 AND "isCompleted" = false AND "deletedAt" IS NULL
       LIMIT 1`,
      [evaluatorId],
    );
    return evaluations.length > 0 ? evaluations[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 시나리오', () => {
    it('평가자의 하향평가 목록을 조회할 수 있어야 한다', async () => {
      const evaluator = await getExistingEvaluator();

      if (!evaluator) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      console.log(
        `\n평가자 ID: ${evaluator.id}, 평가 개수: ${evaluator.evaluation_count}`,
      );

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .expect(HttpStatus.OK);

      // Then - 응답 구조 검증
      expect(response.body).toHaveProperty('evaluations');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      // 목록 데이터 검증
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBeGreaterThan(0);
      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);

      // 첫 번째 평가 항목의 구조 검증
      const evaluation = response.body.evaluations[0];
      expect(evaluation).toHaveProperty('id');
      expect(evaluation).toHaveProperty('employeeId');
      expect(evaluation).toHaveProperty('evaluatorId');
      expect(evaluation.evaluatorId).toBe(evaluator.id);
      expect(evaluation).toHaveProperty('wbsId');
      expect(evaluation).toHaveProperty('periodId');
      expect(evaluation).toHaveProperty('evaluationDate');
      expect(evaluation).toHaveProperty('evaluationType');
      expect(['primary', 'secondary']).toContain(evaluation.evaluationType);
      expect(evaluation).toHaveProperty('isCompleted');
      expect(evaluation).toHaveProperty('createdAt');
      expect(evaluation).toHaveProperty('updatedAt');
      expect(evaluation).toHaveProperty('version');

      console.log('\n✅ 하향평가 목록 조회 성공');
      console.log(`   - 조회된 평가 수: ${response.body.evaluations.length}`);
      console.log(`   - 전체 평가 수: ${response.body.total}`);
    });

    it('evaluateeId 필터로 특정 피평가자의 평가만 조회할 수 있어야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      const evaluatee = await getEvaluateeForEvaluator(evaluator.id);
      if (!evaluatee) {
        console.log('피평가자를 찾을 수 없어서 테스트 스킵');
        return;
      }

      // When - evaluateeId로 필터링
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ evaluateeId: evaluatee.id })
        .expect(HttpStatus.OK);

      // Then - evaluatee에 대한 평가만 반환
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
      response.body.evaluations.forEach((evaluation: any) => {
        expect(evaluation.employeeId).toBe(evaluatee.id);
        expect(evaluation.evaluatorId).toBe(evaluator.id);
      });

      console.log('\n✅ evaluateeId 필터 조회 성공');
    });

    it('periodId 필터로 특정 평가기간의 평가만 조회할 수 있어야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      const period = await getPeriodForEvaluator(evaluator.id);
      if (!period) {
        console.log('평가기간을 찾을 수 없어서 테스트 스킵');
        return;
      }

      // When - periodId로 필터링
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ periodId: period.id })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
      response.body.evaluations.forEach((evaluation: any) => {
        expect(evaluation.periodId).toBe(period.id);
      });

      console.log('\n✅ periodId 필터 조회 성공');
    });

    it('wbsId 필터로 특정 WBS의 평가만 조회할 수 있어야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      const wbs = await getWbsForEvaluator(evaluator.id);
      if (!wbs) {
        console.log('WBS를 찾을 수 없어서 테스트 스킵');
        return;
      }

      // When - wbsId로 필터링
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ wbsId: wbs.id })
        .expect(HttpStatus.OK);

      // Then
      expect(response.body.evaluations.length).toBeGreaterThanOrEqual(1);
      response.body.evaluations.forEach((evaluation: any) => {
        expect(evaluation.wbsId).toBe(wbs.id);
      });

      console.log('\n✅ wbsId 필터 조회 성공');
    });

    it('evaluationType 필터로 primary 또는 secondary만 조회할 수 있어야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      // When - primary만 조회
      const primaryResponse = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ evaluationType: 'primary' })
        .expect(HttpStatus.OK);

      // Then - primary만 반환
      if (primaryResponse.body.evaluations.length > 0) {
        primaryResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluationType).toBe('primary');
        });
        console.log('\n✅ primary 필터 조회 성공');
      }

      // When - secondary만 조회
      const secondaryResponse = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ evaluationType: 'secondary' })
        .expect(HttpStatus.OK);

      // Then - secondary만 반환
      if (secondaryResponse.body.evaluations.length > 0) {
        secondaryResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.evaluationType).toBe('secondary');
        });
        console.log('\n✅ secondary 필터 조회 성공');
      }
    });

    it('isCompleted 필터로 완료/미완료 평가를 구분 조회할 수 있어야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('생성된 하향평가가 없어서 테스트 스킵');
        return;
      }

      // 완료된 평가 확인
      const completedEval = await getCompletedEvaluationForEvaluator(
        evaluator.id,
      );
      if (completedEval) {
        const completedResponse = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ isCompleted: true })
          .expect(HttpStatus.OK);

        expect(completedResponse.body.evaluations.length).toBeGreaterThan(0);
        completedResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.isCompleted).toBe(true);
          expect(evaluation.completedAt).toBeDefined();
        });
        console.log('\n✅ 완료 평가 필터 조회 성공');
      }

      // 미완료 평가 확인
      const incompleteEval = await getIncompleteEvaluationForEvaluator(
        evaluator.id,
      );
      if (incompleteEval) {
        const incompleteResponse = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
          )
          .query({ isCompleted: false })
          .expect(HttpStatus.OK);

        expect(incompleteResponse.body.evaluations.length).toBeGreaterThan(0);
        incompleteResponse.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.isCompleted).toBe(false);
        });
        console.log('\n✅ 미완료 평가 필터 조회 성공');
      }
    });

    it('존재하지 않는 평가자 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When
      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${nonExistentId}`,
        )
        .expect(HttpStatus.OK);

      // Then
      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);
      expect(response.body.total).toBe(0);

      console.log('\n✅ 빈 배열 반환 테스트 성공');
    });
  });

  describe('실패 시나리오', () => {
    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      await testSuite
        .request()
        .get(
          '/admin/performance-evaluation/downward-evaluations/evaluator/invalid-uuid',
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 테스트 성공');
    });

    it('잘못된 evaluateeId 필터로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('평가자가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ evaluateeId: 'invalid-uuid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluateeId 필터 테스트 성공');
    });

    it('잘못된 evaluationType 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const evaluator = await getExistingEvaluator();
      if (!evaluator) {
        console.log('평가자가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/downward-evaluations/evaluator/${evaluator.id}`,
        )
        .query({ evaluationType: 'invalid' })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluationType 테스트 성공');
    });
  });
});

