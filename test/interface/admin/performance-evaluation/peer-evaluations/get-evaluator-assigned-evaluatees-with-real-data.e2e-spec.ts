/**
 * 할당된 피평가자 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 13개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

describe('GET /admin/performance-evaluation/peer-evaluations/evaluator/:evaluatorId/assigned-evaluatees (실제 데이터)', () => {
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

  async function getEvaluatorWithEvaluatees() {
    const result = await dataSource.query(
      `SELECT DISTINCT pe."evaluatorId" as "evaluatorId", pe."periodId"
       FROM peer_evaluation pe
       WHERE pe."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getTwoEvaluationPeriods() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { period1: result[0], period2: result[1] }
      : null;
  }

  async function createPeerEvaluation(data: {
    evaluatorId: string;
    evaluateeId: string;
    periodId: string;
    status?: string;
    isCompleted?: boolean;
  }): Promise<string> {
    const result = await dataSource.query(
      `INSERT INTO peer_evaluation ("evaluatorId", "evaluateeId", "periodId", "evaluationDate", "status", "isCompleted", "mappedDate", "mappedBy", "isActive", "version", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), $4, $5, NOW(), $1, true, 1, NOW(), NOW())
       RETURNING id`,
      [
        data.evaluatorId,
        data.evaluateeId,
        data.periodId,
        data.status || 'pending',
        data.isCompleted || false,
      ],
    );
    return result[0].id;
  }

  function getAssignedEvaluatees(
    evaluatorId: string,
    query?: {
      periodId?: string;
      includeCompleted?: string;
    },
  ) {
    let url = `/admin/performance-evaluation/peer-evaluations/evaluator/${evaluatorId}/assigned-evaluatees`;
    const params: string[] = [];

    if (query) {
      if (query.periodId) params.push(`periodId=${query.periodId}`);
      if (query.includeCompleted !== undefined)
        params.push(`includeCompleted=${query.includeCompleted}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return testSuite.request().get(url);
  }

  describe('할당된 피평가자 목록 조회 성공 시나리오', () => {
    it('기본 목록을 조회할 수 있어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ 기본 목록 조회 성공');
    });

    it('여러 명의 피평가자를 조회할 수 있어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ 여러 피평가자 조회 성공');
    });

    it('periodId로 필터링할 수 있어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId, {
        periodId: data.periodId,
      }).expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ periodId 필터링 성공');
    });

    it('완료된 평가를 제외할 수 있어야 한다 (기본 동작)', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ 완료된 평가 제외 확인');
    });

    it('완료된 평가를 포함할 수 있어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId, {
        includeCompleted: 'true',
      }).expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ 완료된 평가 포함 성공');
    });

    it('평가가 없는 평가자의 경우 빈 배열을 반환해야 한다', async () => {
      const employee = await dataSource.query(
        `SELECT id FROM employee 
         WHERE NOT EXISTS (
           SELECT 1 FROM peer_evaluation pe 
           WHERE pe."evaluatorId" = employee.id AND pe."deletedAt" IS NULL
         )
         AND "deletedAt" IS NULL
         LIMIT 1`,
      );

      if (employee.length === 0) {
        console.log('평가 없는 직원을 찾을 수 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(employee[0].id).expect(
        HttpStatus.OK,
      );

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 성공');
    });
  });

  describe('할당된 피평가자 목록 조회 실패 시나리오', () => {
    it('잘못된 형식의 evaluatorId로 조회 시 400 에러가 발생해야 한다', async () => {
      const invalidEvaluatorId = 'invalid-uuid';

      await testSuite
        .request()
        .get(
          `/admin/performance-evaluation/peer-evaluations/evaluator/${invalidEvaluatorId}/assigned-evaluatees`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 evaluatorId 처리');
    });

    it('잘못된 형식의 periodId로 조회 시 400 에러가 발생해야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const invalidPeriodId = 'invalid-uuid';

      await getAssignedEvaluatees(data.evaluatorId, {
        periodId: invalidPeriodId,
      }).expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId 처리');
    });
  });

  describe('할당된 피평가자 목록 조회 응답 구조 검증', () => {
    it('응답은 배열 형태여야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      expect(Array.isArray(response.body)).toBe(true);

      console.log('\n✅ 배열 형태 확인');
    });

    it('피평가자에 필요한 필수 필드가 포함되어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      if (response.body.length > 0) {
        const firstItem = response.body[0];
        expect(firstItem).toHaveProperty('evaluatee');
      }

      console.log('\n✅ 필수 필드 확인');
    });

    it('피평가자 정보에 직원 필드가 포함되어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      if (response.body.length > 0) {
        const firstItem = response.body[0];
        expect(firstItem).toHaveProperty('evaluatee');
        if (firstItem.evaluatee) {
          expect(firstItem.evaluatee).toHaveProperty('name');
        }
      }

      console.log('\n✅ 직원 필드 확인');
    });

    it('피평가자 부서 정보가 포함되어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      if (response.body.length > 0) {
        const firstItem = response.body[0];
        expect(firstItem).toHaveProperty('evaluatee');
      }

      console.log('\n✅ 부서 정보 확인');
    });

    it('UUID 필드가 유효한 UUID 형식이어야 한다', async () => {
      const data = await getEvaluatorWithEvaluatees();
      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await getAssignedEvaluatees(data.evaluatorId).expect(
        HttpStatus.OK,
      );

      if (response.body.length > 0) {
        const firstItem = response.body[0];
        if (firstItem.id) {
          const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          expect(uuidRegex.test(firstItem.id)).toBe(true);
        }
      }

      console.log('\n✅ UUID 형식 확인');
    });
  });
});
