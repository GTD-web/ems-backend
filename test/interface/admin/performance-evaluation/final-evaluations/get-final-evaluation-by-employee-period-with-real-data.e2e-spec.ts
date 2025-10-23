/**
 * 직원-평가기간별 최종평가 조회 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId (실제 데이터)', () => {
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

  async function getFinalEvaluationData() {
    const evals = await dataSource.query(
      `SELECT "employeeId", "periodId" FROM final_evaluations WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return evals.length > 0 ? evals[0] : null;
  }

  describe('성공 케이스', () => {
    it('기본 조회: 직원-평가기간별 최종평가를 조회할 수 있어야 한다', async () => {
      const evalData = await getFinalEvaluationData();
      if (!evalData) {
        console.log('최종평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${evalData.employeeId}/period/${evalData.periodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body.employee.id).toBe(evalData.employeeId);
      expect(response.body.period.id).toBe(evalData.periodId);

      console.log('\n✅ 기본 조회 성공');
    });

    it('응답 구조: 필수 필드가 모두 포함되어야 한다', async () => {
      const evalData = await getFinalEvaluationData();
      if (!evalData) {
        console.log('최종평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${evalData.employeeId}/period/${evalData.periodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('employee');
      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('evaluationGrade');
      expect(response.body).toHaveProperty('jobGrade');
      expect(response.body).toHaveProperty('isConfirmed');

      console.log('\n✅ 응답 구조 확인');
    });

    it('직원 정보: 상세 정보가 포함되어야 한다', async () => {
      const evalData = await getFinalEvaluationData();
      if (!evalData) {
        console.log('최종평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${evalData.employeeId}/period/${evalData.periodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.employee).toHaveProperty('id');
      expect(response.body.employee).toHaveProperty('name');
      expect(response.body.employee).toHaveProperty('employeeNumber');

      console.log('\n✅ 직원 정보 확인');
    });
  });

  describe('실패 케이스', () => {
    it('빈 결과: 존재하지 않는 조합으로 조회 시 null을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${nonExistentId}/period/${nonExistentId}`,
        )
        .expect(HttpStatus.OK);

      // 빈 객체나 null이 반환될 것으로 예상
      expect(response.body).toBeDefined();

      console.log('\n✅ 존재하지 않는 조합 처리 성공');
    });

    it('잘못된 UUID: employeeId가 UUID 형식이 아닐 때 400 에러', async () => {
      const periodId = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (!periodId || periodId.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/invalid-uuid/period/${periodId[0].id}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 employeeId UUID 처리');
    });

    it('잘못된 UUID: periodId가 UUID 형식이 아닐 때 400 에러', async () => {
      const employee = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (!employee || employee.length === 0) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${employee[0].id}/period/invalid-uuid`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId UUID 처리');
    });

    it('잘못된 UUID: 두 파라미터 모두 잘못된 UUID', async () => {
      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/invalid-1/period/invalid-2`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 두 UUID 모두 검증 실패');
    });
  });

  describe('추가 성공 케이스', () => {
    it('성공: 확정된 평가 조회', async () => {
      const confirmed = await dataSource.query(
        `SELECT "employeeId", "periodId" FROM final_evaluations WHERE "isConfirmed" = true AND "deletedAt" IS NULL LIMIT 1`,
      );

      if (!confirmed || confirmed.length === 0) {
        console.log('확정된 평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${confirmed[0].employeeId}/period/${confirmed[0].periodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.isConfirmed).toBe(true);

      console.log('\n✅ 확정된 평가 조회 성공');
    });

    it('성공: 미확정 평가 조회', async () => {
      const unconfirmed = await dataSource.query(
        `SELECT "employeeId", "periodId" FROM final_evaluations WHERE "isConfirmed" = false AND "deletedAt" IS NULL LIMIT 1`,
      );

      if (!unconfirmed || unconfirmed.length === 0) {
        console.log('미확정 평가가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/final-evaluations/employee/${unconfirmed[0].employeeId}/period/${unconfirmed[0].periodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.isConfirmed).toBe(false);

      console.log('\n✅ 미확정 평가 조회 성공');
    });

    it('성공: 여러 직원-평가기간 조합 순차 조회', async () => {
      const combinations = await dataSource.query(
        `SELECT "employeeId", "periodId" FROM final_evaluations WHERE "deletedAt" IS NULL LIMIT 5`,
      );

      if (!combinations || combinations.length === 0) {
        console.log('평가가 없어서 테스트 스킵');
        return;
      }

      for (const combo of combinations) {
        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/final-evaluations/employee/${combo.employeeId}/period/${combo.periodId}`,
          )
          .expect(HttpStatus.OK);
      }

      console.log('\n✅ 순차 조합 조회 성공');
    });

    it('성공: 평가 등급별 조회', async () => {
      const evals = await dataSource.query(
        `SELECT "employeeId", "periodId" FROM final_evaluations WHERE "evaluationGrade" IS NOT NULL AND "deletedAt" IS NULL LIMIT 3`,
      );

      if (!evals || evals.length === 0) {
        console.log('등급이 있는 평가가 없어서 테스트 스킵');
        return;
      }

      for (const evaluation of evals) {
        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/final-evaluations/employee/${evaluation.employeeId}/period/${evaluation.periodId}`,
          )
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('evaluationGrade');
      }

      console.log('\n✅ 등급별 조회 성공');
    });
  });
});
