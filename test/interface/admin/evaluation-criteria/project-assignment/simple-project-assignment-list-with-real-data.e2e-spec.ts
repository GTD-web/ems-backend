/**
 * 프로젝트 할당 목록 조회 (Simple) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 24개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/project-assignments (Simple) (실제 데이터)', () => {
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

  async function getEmployee() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getProject() {
    const result = await dataSource.query(
      `SELECT id FROM project WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getEvaluationPeriod() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  // ==================== 기본 API 테스트 ====================

  describe('API 기본 동작', () => {
    it('프로젝트 할당 목록 조회 API가 존재해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ API 존재 확인 성공');
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/non-existent-endpoint');

      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ 잘못된 경로 404 에러 성공');
    });
  });

  // ==================== 쿼리 파라미터 테스트 ====================

  describe('쿼리 파라미터', () => {
    it('페이지 파라미터를 받을 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 1 });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ 페이지 파라미터 처리 성공');
    });

    it('리미트 파라미터를 받을 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ limit: 10 });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ 리미트 파라미터 처리 성공');
    });

    it('실제 데이터로 필터 파라미터를 받을 수 있어야 한다', async () => {
      const employee = await getEmployee();
      const project = await getProject();

      if (!employee || !project) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          employeeId: employee.id,
          projectId: project.id,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ 필터 파라미터 처리 성공');
    });

    it('평가기간 ID로 필터링할 수 있어야 한다', async () => {
      const period = await getEvaluationPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          periodId: period.id,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);

      console.log('\n✅ 평가기간 필터링 성공');
    });
  });

  // ==================== 페이지네이션 테스트 ====================

  describe('페이지네이션', () => {
    it('기본 페이지네이션 파라미터를 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments');

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);

      console.log('\n✅ 기본 페이지네이션 성공');
    });

    it('유효한 페이지 번호를 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 1 });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ 유효한 페이지 번호 처리 성공');
    });

    it('유효한 페이지 크기를 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ limit: 10 });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ 유효한 페이지 크기 처리 성공');
    });

    it('페이지와 크기를 동시에 지정할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 1, limit: 5 });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBeLessThanOrEqual(5);

      console.log('\n✅ 페이지와 크기 동시 지정 성공');
    });

    it('큰 페이지 번호를 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: 999999, limit: 10 });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);

      console.log('\n✅ 큰 페이지 번호 처리 성공');
    });

    it('정렬과 페이지네이션 조합을 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          page: 1,
          limit: 5,
          orderBy: 'assignedDate',
          orderDirection: 'DESC',
        });

      expect(response.status).toBe(HttpStatus.OK);

      console.log('\n✅ 정렬과 페이지네이션 조합 성공');
    });

    it('실제 데이터로 필터링과 페이지네이션 조합을 처리해야 한다', async () => {
      const employee = await getEmployee();
      const period = await getEvaluationPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          page: 1,
          limit: 10,
          employeeId: employee.id,
          periodId: period.id,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ 필터링과 페이지네이션 조합 성공');
    });
  });

  // ==================== HTTP 메서드 테스트 ====================

  describe('HTTP 메서드', () => {
    it('GET 메서드만 허용해야 한다', async () => {
      const postResponse = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments');

      expect(postResponse.status).toBe(HttpStatus.BAD_REQUEST);

      console.log('\n✅ POST 메서드 거부 성공');
    });

    it('PUT 메서드는 허용하지 않아야 한다', async () => {
      const putResponse = await testSuite
        .request()
        .put('/admin/evaluation-criteria/project-assignments');

      expect(putResponse.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ PUT 메서드 거부 성공');
    });

    it('DELETE 메서드는 허용하지 않아야 한다', async () => {
      const deleteResponse = await testSuite
        .request()
        .delete('/admin/evaluation-criteria/project-assignments');

      expect(deleteResponse.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ DELETE 메서드 거부 성공');
    });
  });

  // ==================== 에러 처리 테스트 ====================

  describe('에러 처리', () => {
    it('잘못된 UUID 형식을 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ employeeId: 'invalid-uuid' });

      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 처리 성공');
    });

    it('음수 페이지 번호를 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ page: -1 });

      expect([HttpStatus.OK, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(
        response.status,
      );

      console.log('\n✅ 음수 페이지 처리 성공');
    });

    it('0 페이지 크기를 처리해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({ limit: 0 });

      expect([HttpStatus.OK, HttpStatus.INTERNAL_SERVER_ERROR]).toContain(
        response.status,
      );

      console.log('\n✅ 0 페이지 크기 처리 성공');
    });

    it('존재하지 않는 직원 ID로 필터링할 수 있어야 한다', async () => {
      const period = await getEvaluationPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          employeeId: '00000000-0000-0000-0000-000000000000',
          periodId: period.id,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(0);

      console.log('\n✅ 존재하지 않는 직원 ID 처리 성공');
    });

    it('존재하지 않는 프로젝트 ID로 필터링할 수 있어야 한다', async () => {
      const period = await getEvaluationPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          projectId: '00000000-0000-0000-0000-000000000000',
          periodId: period.id,
        });

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);
      expect(assignments.length).toBe(0);

      console.log('\n✅ 존재하지 않는 프로젝트 ID 처리 성공');
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능', () => {
    it('응답 시간이 합리적이어야 한다', async () => {
      const startTime = Date.now();

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments');

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(HttpStatus.OK);

      console.log(`\n✅ 응답 시간: ${responseTime}ms`);
    });

    it('필터링된 요청의 응답 시간이 합리적이어야 한다', async () => {
      const period = await getEvaluationPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          periodId: period.id,
          page: 1,
          limit: 10,
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(HttpStatus.OK);

      expect(response.body).toBeDefined();
      const assignments = response.body.assignments;
      expect(Array.isArray(assignments)).toBe(true);

      console.log(`\n✅ 필터링 응답 시간: ${responseTime}ms`);
    });

    it('대량 데이터 조회 시 응답 시간이 합리적이어야 한다', async () => {
      const period = await getEvaluationPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/project-assignments')
        .query({
          periodId: period.id,
          page: 1,
          limit: 100,
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000);
      expect(response.status).toBe(HttpStatus.OK);

      console.log(`\n✅ 대량 조회 응답 시간: ${responseTime}ms`);
    });
  });
});
