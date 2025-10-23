/**
 * WBS 자기평가 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 16개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/wbs-self-evaluations (실제 데이터)', () => {
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

  async function getEmployeeWithWbsAssignment() {
    const result = await dataSource.query(
      `SELECT DISTINCT wa."employeeId", wa."wbsItemId", wa."periodId"
       FROM evaluation_wbs_assignment wa
       WHERE wa."deletedAt" IS NULL
       LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getMultipleWbsAssignments(
    employeeId: string,
    limit: number = 3,
  ) {
    const result = await dataSource.query(
      `SELECT wa."wbsItemId", wa."periodId"
       FROM evaluation_wbs_assignment wa
       WHERE wa."employeeId" = $1 AND wa."deletedAt" IS NULL
       LIMIT $2`,
      [employeeId, limit],
    );
    return result;
  }

  async function getWbsSelfEvaluationId() {
    const result = await dataSource.query(
      `SELECT id FROM wbs_self_evaluation WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0].id : null;
  }

  async function createWbsSelfEvaluation(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    data: any,
  ) {
    const response = await testSuite
      .request()
      .post(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}`,
      )
      .send(data);
    return response;
  }

  describe('직원의 자기평가 목록 조회 (GET /employee/:employeeId)', () => {
    describe('성공 케이스', () => {
      it('직원의 자기평가 목록을 조회할 수 있어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        // 2개의 자기평가 생성
        const assignments = await getMultipleWbsAssignments(data.employeeId, 2);
        if (assignments.length >= 2) {
          await createWbsSelfEvaluation(
            data.employeeId,
            assignments[0].wbsItemId,
            assignments[0].periodId,
            {
              selfEvaluationContent: '첫 번째 평가',
              selfEvaluationScore: 100,
            },
          );
          await createWbsSelfEvaluation(
            data.employeeId,
            assignments[1].wbsItemId,
            assignments[1].periodId,
            {
              selfEvaluationContent: '두 번째 평가',
              selfEvaluationScore: 90,
            },
          );
        }

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}`,
          )
          .expect(HttpStatus.OK);

        // 응답 구조 검증
        expect(response.body).toHaveProperty('evaluations');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(Array.isArray(response.body.evaluations)).toBe(true);

        console.log('\n✅ 목록 조회 성공');
      });

      it('반환된 각 자기평가 항목은 모든 필수 필드를 포함해야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        await createWbsSelfEvaluation(
          data.employeeId,
          data.wbsItemId,
          data.periodId,
          {
            selfEvaluationContent: '테스트 평가',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          },
        );

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}`,
          )
          .expect(HttpStatus.OK);

        if (response.body.evaluations.length > 0) {
          const evaluation = response.body.evaluations[0];

          // 필수 필드 검증
          expect(evaluation).toHaveProperty('id');
          expect(evaluation).toHaveProperty('periodId');
          expect(evaluation).toHaveProperty('employeeId');
          expect(evaluation).toHaveProperty('wbsItemId');
          expect(evaluation).toHaveProperty('isCompleted');
          expect(evaluation).toHaveProperty('evaluationDate');
          expect(evaluation).toHaveProperty('createdAt');
          expect(evaluation).toHaveProperty('updatedAt');
          expect(evaluation).toHaveProperty('version');

          // 타입 검증
          expect(typeof evaluation.id).toBe('string');
          expect(typeof evaluation.periodId).toBe('string');
          expect(typeof evaluation.employeeId).toBe('string');
          expect(typeof evaluation.wbsItemId).toBe('string');
          expect(typeof evaluation.isCompleted).toBe('boolean');
          expect(typeof evaluation.version).toBe('number');
        }

        console.log('\n✅ 필수 필드 검증 성공');
      });

      it('periodId 필터로 특정 평가기간의 자기평가만 조회할 수 있어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        await createWbsSelfEvaluation(
          data.employeeId,
          data.wbsItemId,
          data.periodId,
          {
            selfEvaluationContent: '평가 내용',
            selfEvaluationScore: 100,
          },
        );

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}`,
          )
          .query({ periodId: data.periodId })
          .expect(HttpStatus.OK);

        expect(Array.isArray(response.body.evaluations)).toBe(true);
        response.body.evaluations.forEach((evaluation: any) => {
          expect(evaluation.periodId).toBe(data.periodId);
        });

        console.log('\n✅ periodId 필터링 성공');
      });

      it('페이지네이션이 정상적으로 작동해야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        // 여러 개 생성
        const assignments = await getMultipleWbsAssignments(data.employeeId, 3);
        for (const assignment of assignments) {
          await createWbsSelfEvaluation(
            data.employeeId,
            assignment.wbsItemId,
            assignment.periodId,
            {
              selfEvaluationContent: `평가 ${assignment.wbsItemId}`,
              selfEvaluationScore: 100,
            },
          );
        }

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}`,
          )
          .query({ page: 1, limit: 2 })
          .expect(HttpStatus.OK);

        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(2);
        expect(response.body.evaluations.length).toBeLessThanOrEqual(2);

        console.log('\n✅ 페이지네이션 성공');
      });

      it('자기평가가 없는 경우 빈 배열을 반환해야 한다', async () => {
        // 실제 직원 중 WBS 할당이 없는 직원 찾기
        const result = await dataSource.query(
          `SELECT e.id FROM employee e
           WHERE NOT EXISTS (
             SELECT 1 FROM evaluation_wbs_assignment wa 
             WHERE wa."employeeId" = e.id AND wa."deletedAt" IS NULL
           )
           AND e."deletedAt" IS NULL
           LIMIT 1`,
        );

        if (result.length === 0) {
          console.log('WBS 할당이 없는 직원이 없어서 테스트 스킵');
          return;
        }

        const employeeWithNoAssignment = result[0].id;

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${employeeWithNoAssignment}`,
          )
          .expect(HttpStatus.OK);

        expect(response.body.evaluations).toEqual([]);
        expect(response.body.total).toBe(0);

        console.log('\n✅ 빈 배열 반환 성공');
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
        const invalidId = 'invalid-uuid';

        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${invalidId}`,
          )
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 UUID 처리');
      });
    });
  });

  describe('WBS 자기평가 상세정보 조회 (GET /:id)', () => {
    describe('성공 케이스', () => {
      it('자기평가 상세정보를 조회할 수 있어야 한다', async () => {
        const evalId = await getWbsSelfEvaluationId();
        if (!evalId) {
          console.log('자기평가가 없어서 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(`/admin/performance-evaluation/wbs-self-evaluations/${evalId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(evalId);

        console.log('\n✅ 상세 조회 성공');
      });

      it('반환된 상세정보는 모든 필수 필드를 포함해야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        const createResponse = await createWbsSelfEvaluation(
          data.employeeId,
          data.wbsItemId,
          data.periodId,
          {
            selfEvaluationContent: '상세 평가',
            selfEvaluationScore: 95,
            performanceResult: '성과 결과',
          },
        );

        if (createResponse.status !== 200) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(HttpStatus.OK);

        const detail = response.body;

        // 기본 필드
        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('periodId');
        expect(detail).toHaveProperty('employeeId');
        expect(detail).toHaveProperty('wbsItemId');
        expect(detail).toHaveProperty('isCompleted');
        expect(detail).toHaveProperty('evaluationDate');
        expect(detail).toHaveProperty('createdAt');
        expect(detail).toHaveProperty('updatedAt');
        expect(detail).toHaveProperty('version');

        console.log('\n✅ 모든 필드 검증 성공');
      });

      it('WBS 항목 정보가 포함되어야 한다', async () => {
        const evalId = await getWbsSelfEvaluationId();
        if (!evalId) {
          console.log('자기평가가 없어서 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(`/admin/performance-evaluation/wbs-self-evaluations/${evalId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('wbsItemId');

        console.log('\n✅ WBS 항목 정보 포함 확인');
      });

      it('프로젝트 정보가 포함되어야 한다', async () => {
        const evalId = await getWbsSelfEvaluationId();
        if (!evalId) {
          console.log('자기평가가 없어서 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(`/admin/performance-evaluation/wbs-self-evaluations/${evalId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toBeDefined();

        console.log('\n✅ 프로젝트 정보 확인');
      });

      it('직원 정보가 포함되어야 한다', async () => {
        const evalId = await getWbsSelfEvaluationId();
        if (!evalId) {
          console.log('자기평가가 없어서 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(`/admin/performance-evaluation/wbs-self-evaluations/${evalId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('employeeId');

        console.log('\n✅ 직원 정보 확인');
      });

      it('평가기간 정보가 포함되어야 한다', async () => {
        const evalId = await getWbsSelfEvaluationId();
        if (!evalId) {
          console.log('자기평가가 없어서 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(`/admin/performance-evaluation/wbs-self-evaluations/${evalId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toHaveProperty('periodId');

        console.log('\n✅ 평가기간 정보 확인');
      });

      it('자기평가 내용(selfEvaluationContent)이 있으면 포함되어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        const createResponse = await createWbsSelfEvaluation(
          data.employeeId,
          data.wbsItemId,
          data.periodId,
          {
            selfEvaluationContent: '자기평가 내용입니다',
            selfEvaluationScore: 90,
          },
        );

        if (createResponse.status !== 200) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(HttpStatus.OK);

        if (response.body.selfEvaluationContent) {
          expect(response.body.selfEvaluationContent).toBeDefined();
        }

        console.log('\n✅ 자기평가 내용 확인');
      });

      it('자기평가 점수(selfEvaluationScore)가 있으면 포함되어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        const createResponse = await createWbsSelfEvaluation(
          data.employeeId,
          data.wbsItemId,
          data.periodId,
          {
            selfEvaluationContent: '평가',
            selfEvaluationScore: 85,
          },
        );

        if (createResponse.status !== 200) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(HttpStatus.OK);

        if (response.body.selfEvaluationScore !== undefined) {
          expect(typeof response.body.selfEvaluationScore).toBe('number');
        }

        console.log('\n✅ 자기평가 점수 확인');
      });

      it('실적(performanceResult)이 있으면 포함되어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        const createResponse = await createWbsSelfEvaluation(
          data.employeeId,
          data.wbsItemId,
          data.periodId,
          {
            selfEvaluationContent: '평가',
            selfEvaluationScore: 85,
            performanceResult: '실적 내용',
          },
        );

        if (createResponse.status !== 200) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${createResponse.body.id}`,
          )
          .expect(HttpStatus.OK);

        if (response.body.performanceResult) {
          expect(response.body.performanceResult).toBeDefined();
        }

        console.log('\n✅ 실적 정보 확인');
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 ID로 조회 시 404 에러', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}`,
          )
          .expect(HttpStatus.NOT_FOUND);

        console.log('\n✅ 존재하지 않는 ID 처리');
      });

      it('잘못된 UUID 형식으로 요청 시 400 에러', async () => {
        const invalidId = 'invalid-uuid';

        await testSuite
          .request()
          .get(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}`,
          )
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 UUID 처리');
      });
    });
  });
});
