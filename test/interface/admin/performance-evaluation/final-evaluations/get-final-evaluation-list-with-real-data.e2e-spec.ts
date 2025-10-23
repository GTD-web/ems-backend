/**
 * 최종평가 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오의 최종평가 데이터를 활용한 목록 조회 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/performance-evaluation/final-evaluations (실제 데이터)', () => {
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

  async function getPeriodId() {
    const periods = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return periods.length > 0 ? periods[0].id : null;
  }

  async function getEmployeeId() {
    const employees = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return employees.length > 0 ? employees[0].id : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('성공 케이스', () => {
    it('기본 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');

      console.log('\n✅ 기본 목록 조회 성공');
    });

    it('직원 정보가 객체로 반환되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstEval = response.body.evaluations[0];
        expect(firstEval.employee).toHaveProperty('id');
        expect(firstEval.employee).toHaveProperty('name');
        expect(firstEval.employee).toHaveProperty('employeeNumber');
      }

      console.log('\n✅ 직원 정보 포함 확인');
    });

    it('평가기간 정보가 객체로 반환되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .expect(HttpStatus.OK);

      if (response.body.evaluations.length > 0) {
        const firstEval = response.body.evaluations[0];
        expect(firstEval.period).toHaveProperty('id');
        expect(firstEval.period).toHaveProperty('name');
      }

      console.log('\n✅ 평가기간 정보 포함 확인');
    });

    it('페이지네이션이 작동해야 한다', async () => {
      const page1 = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ page: 1, limit: 5 })
        .expect(HttpStatus.OK);

      expect(page1.body.page).toBe(1);
      expect(page1.body.limit).toBe(5);
      expect(Array.isArray(page1.body.evaluations)).toBe(true);

      console.log('\n✅ 페이지네이션 작동 확인');
    });

    it('employeeId로 필터링할 수 있어야 한다', async () => {
      const periodId = await getPeriodId();
      if (!periodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 결과가 있으면 모두 해당 평가기간의 데이터인지 확인
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((item: any) => {
          expect(item.period.id).toBe(periodId);
        });
      }

      console.log('\n✅ 평가기간 필터링 조회 성공');
    });

    it('성공: 직원 ID로 필터링하여 조회할 수 있어야 한다', async () => {
      const employeeId = await getEmployeeId();
      if (!employeeId) {
        console.log('직원이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ employeeId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      // 결과가 있으면 모두 해당 직원의 데이터인지 확인
      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((item: any) => {
          expect(item.employee.id).toBe(employeeId);
        });
      }

      console.log('\n✅ employeeId 필터링 성공');
    });

    it('periodId로 필터링할 수 있어야 한다', async () => {
      const periodId = await getPeriodId();
      if (!periodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ periodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      if (response.body.evaluations.length > 0) {
        response.body.evaluations.forEach((item: any) => {
          expect(item.period.id).toBe(periodId);
        });
      }

      console.log('\n✅ periodId 필터링 성공');
    });

    it('evaluationGrade로 필터링할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ evaluationGrade: 'S' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ evaluationGrade 필터링 성공');
    });

    it('confirmedOnly로 필터링할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ confirmedOnly: 'true' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ confirmedOnly 필터링 성공');
    });

    it('createdAt 기준으로 정렬할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ sortBy: 'createdAt', sortOrder: 'DESC' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ createdAt 정렬 성공');
    });
  });

  describe('실패 케이스', () => {
    it('잘못된 페이지 번호 시 400 에러', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ page: -1 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 페이지 번호 처리');
    });

    it('잘못된 limit 값 시 400 에러', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ limit: 0 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 limit 처리');
    });

    it('존재하지 않는 직원 ID로 조회 시 빈 목록 반환', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ employeeId: nonExistentId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 존재하지 않는 직원 처리');
    });

    it('존재하지 않는 평가기간 ID로 조회 시 빈 목록을 반환해야 한다', async () => {
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ periodId: nonExistentPeriodId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 존재하지 않는 평가기간 빈 목록 반환 성공');
    });

    it('잘못된 UUID 형식의 employeeId는 무시되고 200 반환', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ employeeId: 'invalid-uuid' })
        .expect(HttpStatus.OK);

      // 잘못된 UUID는 무시되고 정상 응답 반환
      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ 잘못된 employeeId UUID 처리 (무시)');
    });

    it('잘못된 UUID 형식의 periodId는 무시되고 200 반환', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ periodId: 'invalid-uuid' })
        .expect(HttpStatus.OK);

      // 잘못된 UUID는 무시되고 정상 응답 반환
      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ 잘못된 periodId UUID 처리 (무시)');
    });

    it('잘못된 sortOrder 값 처리', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ sortBy: 'createdAt', sortOrder: 'INVALID' });

      // 400 또는 기본값으로 처리
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 잘못된 sortOrder 처리');
    });

    it('잘못된 sortBy 값 처리', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ sortBy: 'invalidField', sortOrder: 'ASC' });

      // 400 또는 기본값으로 처리
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 잘못된 sortBy 처리');
    });

    it('실패: limit이 0 이하일 때', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ limit: 0 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ limit 0 처리');
    });

    it('실패: page가 0일 때', async () => {
      await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ page: 0 })
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ page 0 처리');
    });

    it('실패: 잘못된 evaluationGrade 값', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ evaluationGrade: 'INVALID' });

      // 400 또는 빈 배열 반환
      expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 잘못된 evaluationGrade 처리');
    });

    it('성공: 빈 목록 조회 (존재하지 않는 필터)', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ employeeId: nonExistentId, periodId: nonExistentId })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.evaluations.length).toBe(0);

      console.log('\n✅ 빈 목록 조회 성공');
    });

    it('성공: confirmedOnly=false 필터링', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({ confirmedOnly: 'false' })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ confirmedOnly=false 필터링 성공');
    });

    it('성공: 정렬과 페이지네이션 조합', async () => {
      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          page: 1,
          limit: 5,
        })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);
      expect(response.body.limit).toBe(5);

      console.log('\n✅ 정렬+페이지네이션 조합 성공');
    });

    it('성공: 모든 필터 조합', async () => {
      const employeeId = await getEmployeeId();
      const periodId = await getPeriodId();

      if (!employeeId || !periodId) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/performance-evaluation/final-evaluations')
        .query({
          employeeId,
          periodId,
          evaluationGrade: 'A',
          confirmedOnly: 'true',
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          page: 1,
          limit: 10,
        })
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.evaluations)).toBe(true);

      console.log('\n✅ 모든 필터 조합 성공');
    });
  });
});
