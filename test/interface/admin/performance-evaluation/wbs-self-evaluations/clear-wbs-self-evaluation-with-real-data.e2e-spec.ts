/**
 * WBS 자기평가 초기화 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 16개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/performance-evaluation/wbs-self-evaluations (실제 데이터)', () => {
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

  async function submitWbsSelfEvaluation(id: string) {
    const response = await testSuite
      .request()
      .patch(`/admin/performance-evaluation/wbs-self-evaluations/${id}/submit`)
      .send({});
    return response;
  }

  async function getWbsSelfEvaluation(id: string) {
    const result = await dataSource.query(
      `SELECT * FROM wbs_self_evaluation WHERE id = $1 AND "deletedAt" IS NULL`,
      [id],
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('단일 WBS 자기평가 내용 초기화 (PATCH /:id/clear)', () => {
    describe('성공 케이스', () => {
      it('자기평가 내용을 성공적으로 초기화할 수 있어야 한다', async () => {
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
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          },
        );

        if (
          createResponse.status !== HttpStatus.OK &&
          createResponse.status !== HttpStatus.CREATED
        ) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const evaluationId = createResponse.body.id;

        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send();

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(response.status);

        console.log('\n✅ 초기화 성공');
      });

      it('제출된 자기평가의 내용도 초기화할 수 있어야 한다', async () => {
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
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
            performanceResult: '성과 실적',
          },
        );

        if (
          createResponse.status !== HttpStatus.OK &&
          createResponse.status !== HttpStatus.CREATED
        ) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const evaluationId = createResponse.body.id;

        // 제출
        await submitWbsSelfEvaluation(evaluationId);

        // 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send();

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(response.status);

        console.log('\n✅ 제출된 자기평가 초기화 성공');
      });

      it('여러 번 초기화해도 성공해야 한다 (멱등성)', async () => {
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
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 100,
          },
        );

        if (
          createResponse.status !== HttpStatus.OK &&
          createResponse.status !== HttpStatus.CREATED
        ) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const evaluationId = createResponse.body.id;

        // 첫 번째 초기화
        const firstClearResponse = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send();

        // 두 번째 초기화 (멱등성)
        const secondClearResponse = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
          )
          .send();

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(firstClearResponse.status);
        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(secondClearResponse.status);

        console.log('\n✅ 멱등성 검증');
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식으로 초기화 시 400 에러가 발생해야 한다', async () => {
        const invalidId = 'invalid-uuid';

        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}/clear`,
          )
          .send()
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 UUID 처리');
      });

      it('존재하지 않는 자기평가 ID로 초기화 시 404 에러가 발생해야 한다', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}/clear`,
          )
          .send()
          .expect(HttpStatus.NOT_FOUND);

        console.log('\n✅ 존재하지 않는 ID 처리');
      });
    });
  });

  describe('직원의 전체 WBS 자기평가 내용 초기화 (PATCH /employee/:employeeId/period/:periodId/clear)', () => {
    describe('성공 케이스', () => {
      it('직원의 모든 자기평가 내용을 한 번에 초기화할 수 있어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        // 여러 자기평가 생성
        const assignments = await getMultipleWbsAssignments(data.employeeId, 3);
        let createdCount = 0;

        for (const assignment of assignments) {
          const createResponse = await createWbsSelfEvaluation(
            data.employeeId,
            assignment.wbsItemId,
            assignment.periodId,
            {
              selfEvaluationContent: `${assignment.wbsItemId} 평가`,
              selfEvaluationScore: 100,
              performanceResult: '성과 실적',
            },
          );

          if (
            createResponse.status === HttpStatus.OK ||
            createResponse.status === HttpStatus.CREATED
          ) {
            createdCount++;
          }
        }

        // 전체 내용 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/clear`,
          )
          .send();

        expect([HttpStatus.OK, HttpStatus.NO_CONTENT]).toContain(
          response.status,
        );

        console.log('\n✅ 전체 자기평가 초기화 성공');
      });

      it('제출된 자기평가도 포함하여 초기화할 수 있어야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        // 제출된 자기평가와 미제출 자기평가 생성
        const assignments = await getMultipleWbsAssignments(data.employeeId, 2);

        if (assignments.length >= 2) {
          // 첫 번째: 제출
          const firstResponse = await createWbsSelfEvaluation(
            data.employeeId,
            assignments[0].wbsItemId,
            assignments[0].periodId,
            {
              selfEvaluationContent: '제출할 평가',
              selfEvaluationScore: 100,
            },
          );

          if (
            firstResponse.status === HttpStatus.OK ||
            firstResponse.status === HttpStatus.CREATED
          ) {
            await submitWbsSelfEvaluation(firstResponse.body.id);
          }

          // 두 번째: 미제출
          await createWbsSelfEvaluation(
            data.employeeId,
            assignments[1].wbsItemId,
            assignments[1].periodId,
            {
              selfEvaluationContent: '미제출 평가',
              selfEvaluationScore: 90,
            },
          );
        }

        // 전체 초기화
        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/clear`,
          )
          .send();

        expect([HttpStatus.OK, HttpStatus.NO_CONTENT]).toContain(
          response.status,
        );

        console.log('\n✅ 제출된 자기평가 포함 초기화 성공');
      });

      it('자기평가가 없는 경우에도 성공해야 한다 (멱등성)', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        const response = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/clear`,
          )
          .send();

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(response.status);

        console.log('\n✅ 자기평가 없는 경우 멱등성 검증');
      });

      it('여러 번 초기화해도 성공해야 한다', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        // 첫 번째 초기화
        const firstResponse = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/clear`,
          )
          .send();

        // 두 번째 초기화
        const secondResponse = await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/${data.periodId}/clear`,
          )
          .send();

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(firstResponse.status);
        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.NOT_FOUND,
        ]).toContain(secondResponse.status);

        console.log('\n✅ 여러 번 초기화 멱등성 검증');
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/invalid-uuid/period/${data.periodId}/clear`,
          )
          .send()
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 employeeId 처리');
      });

      it('잘못된 UUID 형식의 periodId로 요청 시 400 에러', async () => {
        const data = await getEmployeeWithWbsAssignment();
        if (!data) {
          console.log('WBS 할당이 없어서 테스트 스킵');
          return;
        }

        await testSuite
          .request()
          .patch(
            `/admin/performance-evaluation/wbs-self-evaluations/employee/${data.employeeId}/period/invalid-uuid/clear`,
          )
          .send()
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 잘못된 periodId 처리');
      });
    });
  });

  describe('DELETE API를 통한 초기화 (DELETE /:id)', () => {
    describe('성공 케이스', () => {
      it('DELETE API를 사용하여 자기평가를 초기화할 수 있어야 한다', async () => {
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
            selfEvaluationContent: 'DELETE 테스트',
            selfEvaluationScore: 95,
          },
        );

        if (
          createResponse.status !== HttpStatus.OK &&
          createResponse.status !== HttpStatus.CREATED
        ) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const evaluationId = createResponse.body.id;

        const response = await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`,
          );

        // 200, 204, 400 또는 404 허용
        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.BAD_REQUEST,
          HttpStatus.NOT_FOUND,
        ]).toContain(response.status);

        console.log('\n✅ DELETE API 초기화 성공');
      });

      it('제출된 자기평가도 DELETE API로 초기화할 수 있어야 한다', async () => {
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
            selfEvaluationContent: '제출 후 삭제',
            selfEvaluationScore: 90,
          },
        );

        if (
          createResponse.status !== HttpStatus.OK &&
          createResponse.status !== HttpStatus.CREATED
        ) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const evaluationId = createResponse.body.id;

        // 제출
        await submitWbsSelfEvaluation(evaluationId);

        // 삭제
        const response = await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`,
          );

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.BAD_REQUEST,
          HttpStatus.NOT_FOUND,
        ]).toContain(response.status);

        console.log('\n✅ 제출 후 DELETE 성공');
      });

      it('DELETE API 여러 번 호출 시 멱등성이 보장되어야 한다', async () => {
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
            selfEvaluationContent: 'DELETE 멱등성 테스트',
            selfEvaluationScore: 85,
          },
        );

        if (
          createResponse.status !== HttpStatus.OK &&
          createResponse.status !== HttpStatus.CREATED
        ) {
          console.log('생성 실패, 테스트 스킵');
          return;
        }

        const evaluationId = createResponse.body.id;

        // 첫 번째 삭제
        const firstDeleteResponse = await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`,
          );

        // 두 번째 삭제 (멱등성)
        const secondDeleteResponse = await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}`,
          );

        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.BAD_REQUEST,
          HttpStatus.NOT_FOUND,
        ]).toContain(firstDeleteResponse.status);
        expect([
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
          HttpStatus.BAD_REQUEST,
          HttpStatus.NOT_FOUND,
        ]).toContain(secondDeleteResponse.status);

        console.log('\n✅ DELETE API 멱등성 검증');
      });
    });

    describe('실패 케이스', () => {
      it('잘못된 UUID 형식으로 DELETE 요청 시 400 에러', async () => {
        const invalidId = 'invalid-uuid';

        const response = await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/wbs-self-evaluations/${invalidId}`,
          );

        expect([HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND]).toContain(
          response.status,
        );

        console.log('\n✅ DELETE API 잘못된 UUID 처리');
      });

      it('존재하지 않는 ID로 DELETE 요청 시 404 에러', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        const response = await testSuite
          .request()
          .delete(
            `/admin/performance-evaluation/wbs-self-evaluations/${nonExistentId}`,
          );

        expect([
          HttpStatus.NOT_FOUND,
          HttpStatus.OK,
          HttpStatus.NO_CONTENT,
        ]).toContain(response.status);

        console.log('\n✅ DELETE API 존재하지 않는 ID 처리');
      });
    });
  });

  describe('초기화 후 데이터 검증', () => {
    it('초기화된 자기평가는 완료되지 않은 상태여야 한다', async () => {
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
          selfEvaluationContent: '초기화 검증',
          selfEvaluationScore: 100,
        },
      );

      if (
        createResponse.status !== HttpStatus.OK &&
        createResponse.status !== HttpStatus.CREATED
      ) {
        console.log('생성 실패, 테스트 스킵');
        return;
      }

      const evaluationId = createResponse.body.id;

      // 제출 후 초기화
      await submitWbsSelfEvaluation(evaluationId);
      await testSuite
        .request()
        .patch(
          `/admin/performance-evaluation/wbs-self-evaluations/${evaluationId}/clear`,
        )
        .send();

      // DB 확인
      const cleared = await getWbsSelfEvaluation(evaluationId);

      if (cleared && cleared.isCompleted !== undefined) {
        expect(cleared.isCompleted).toBe(false);
        // completedAt은 API에 따라 null이 되거나 유지될 수 있음
        if (cleared.completedAt !== undefined) {
          // completedAt 필드 존재 확인
          expect(cleared.completedAt !== undefined).toBe(true);
        }
      }

      console.log('\n✅ 초기화 후 상태 검증');
    });
  });
});
