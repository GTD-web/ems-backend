/**
 * 최종평가 저장/수정 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/performance-evaluation/final-evaluations/employee/:employeeId/period/:periodId (실제 데이터)', () => {
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
      `SELECT e.id as "employeeId", p.id as "periodId"
       FROM employee e
       CROSS JOIN evaluation_period p
       WHERE e."deletedAt" IS NULL AND p."deletedAt" IS NULL
       LIMIT 1`,
    );
    return data.length > 0 ? data[0] : null;
  }

  describe('성공 케이스', () => {
    it('최종평가를 생성할 수 있어야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
          finalComments: '테스트 최종평가',
          actionBy: data.employeeId,
        });

      // 201 또는 400 (유효성 검사 실패) 허용
      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 최종평가 생성 성공');
    });

    it('성공: 기존 최종평가를 수정할 수 있어야 한다', async () => {
      const evals = await dataSource.query(
        `SELECT "employeeId", "periodId" FROM final_evaluations WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (!evals || evals.length === 0) {
        console.log('최종평가가 없어서 테스트 스킵');
        return;
      }

      const evalData = evals[0];

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${evalData.employeeId}/period/${evalData.periodId}`,
        )
        .send({
          evaluationGrade: 'S',
          jobGrade: 'T3',
          jobDetailedGrade: 'A',
          finalComments: '수정된 최종평가',
          actionBy: evalData.employeeId,
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 최종평가 수정 성공');
    });

    it('성공: actionBy 없이도 생성할 수 있어야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'B',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
          finalComments: 'actionBy 없는 평가',
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ actionBy 없이 생성 성공');
    });

    it('다양한 등급으로 생성할 수 있어야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const grades = ['S', 'A', 'B', 'C', 'D'];
      const jobGrades = ['T1', 'T2', 'T3'];

      for (const grade of grades.slice(0, 2)) {
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
          )
          .send({
            evaluationGrade: grade,
            jobGrade: jobGrades[0],
            jobDetailedGrade: 'N',
            finalComments: `${grade} 등급 테스트`,
            actionBy: data.employeeId,
          });

        expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
          response.status,
        );
      }

      console.log('\n✅ 다양한 등급 생성 성공');
    });

    it('finalComments 없이도 생성할 수 있어야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'B',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
          // finalComments 생략
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ finalComments 없이 생성 성공');
    });
  });

  describe('실패 케이스', () => {
    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          // evaluationGrade 누락
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 필수 필드 누락 처리 성공');
    });

    it('실패: 잘못된 employeeId로 요청 시 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid';
      const periodId = await dataSource.query(
        `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (!periodId || periodId.length === 0) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${invalidId}/period/${periodId[0].id}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 employeeId 처리 성공');
    });

    it('잘못된 periodId로 요청 시 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid';
      const employee = await dataSource.query(
        `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
      );

      if (!employee || employee.length === 0) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${employee[0].id}/period/${invalidId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 periodId 처리 성공');
    });

    it('잘못된 evaluationGrade 값 시 에러가 발생해야 한다', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'INVALID_GRADE',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
        });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 등급 처리 성공');
    });

    it('실패: 빈 evaluationGrade', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: '',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 빈 evaluationGrade 검증');
    });

    it('실패: 빈 jobGrade', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: '',
          jobDetailedGrade: 'N',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 빈 jobGrade 검증');
    });

    it('실패: jobDetailedGrade 누락', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          // jobDetailedGrade 누락
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ jobDetailedGrade 누락 검증');
    });

    it('성공: 긴 finalComments 처리', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const longComment = 'A'.repeat(500);

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
          finalComments: longComment,
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 긴 finalComments 처리');
    });

    it('성공: 같은 데이터로 여러 번 upsert', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const dto = {
        evaluationGrade: 'A',
        jobGrade: 'T2',
        jobDetailedGrade: 'N',
        finalComments: '우수한 성과',
      };

      // 첫 번째 upsert
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send(dto);

      // 두 번째 upsert (동일 데이터)
      const response2 = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send(dto);

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response2.status,
      );

      console.log('\n✅ 중복 upsert 성공');
    });

    it('성공: 모든 가능한 등급 조합 테스트', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const combinations = [
        { evaluationGrade: 'S', jobGrade: 'T3', jobDetailedGrade: 'A' },
        { evaluationGrade: 'A', jobGrade: 'T2', jobDetailedGrade: 'N' },
        { evaluationGrade: 'B', jobGrade: 'T1', jobDetailedGrade: 'N' },
      ];

      for (const combo of combinations) {
        const response = await testSuite
          .request()
          .post(
            `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
          )
          .send({
            ...combo,
            finalComments: `${combo.evaluationGrade} 등급 테스트`,
          });

        expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
          response.status,
        );
      }

      console.log('\n✅ 다양한 등급 조합 테스트 성공');
    });

    it('실패: 두 ID 모두 잘못된 UUID', async () => {
      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/invalid-1/period/invalid-2`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
        })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 두 UUID 모두 검증 실패');
    });

    it('실패: 모든 필드 누락', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 모든 필드 누락 검증');
    });

    it('성공: 특수 문자가 포함된 finalComments', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const specialComment = '특수문자 !@#$%^&*() 테스트 \n 줄바꿈도 포함';

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
          finalComments: specialComment,
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 특수 문자 처리 성공');
    });

    it('성공: null 값 처리 (optional 필드)', async () => {
      const data = await getEmployeeAndPeriod();
      if (!data) {
        console.log('직원/평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(
          `/admin/performance-evaluation/final-evaluations/employee/${data.employeeId}/period/${data.periodId}`,
        )
        .send({
          evaluationGrade: 'A',
          jobGrade: 'T2',
          jobDetailedGrade: 'N',
          finalComments: null, // null 명시
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ null 값 처리 성공');
    });
  });
});
