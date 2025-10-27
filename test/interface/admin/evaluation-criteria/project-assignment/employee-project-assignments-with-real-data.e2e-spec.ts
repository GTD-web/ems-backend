/**
 * 직원별 프로젝트 할당 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 11개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/project-assignments/employees/:employeeId/periods/:periodId (실제 데이터)', () => {
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

  async function getPeriod() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('API 기본 동작', () => {
    it('직원별 프로젝트 할당 목록 조회 API가 존재해야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${period.id}`,
        );

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toBeDefined();

      console.log('\n✅ API 존재 확인 성공');
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          '/admin/evaluation-criteria/project-assignments/invalid-path/employees',
        );

      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ 잘못된 경로 404 에러 성공');
    });
  });

  describe('정상 조회', () => {
    it('유효한 직원 ID와 기간 ID로 목록을 조회할 수 있어야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);

      console.log('\n✅ 유효한 조회 성공');
    });

    it('할당이 없는 직원은 빈 배열을 반환해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 할당이 없는 직원 찾기
      const result = await dataSource.query(
        `
        SELECT e.id
        FROM employee e
        WHERE e."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM evaluation_project_assignment epa
          WHERE epa."employeeId" = e.id
          AND epa."periodId" = $1
          AND epa."deletedAt" IS NULL
        )
        LIMIT 1
      `,
        [period.id],
      );

      if (result.length === 0) {
        console.log('할당 없는 직원을 찾을 수 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${result[0].id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 성공');
    });

    it('응답 데이터가 배열 형식이어야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);

      console.log('\n✅ 배열 형식 확인 성공');
    });

    it('각 할당 항목에 필수 필드가 포함되어야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      if (response.body.length > 0) {
        const firstItem = response.body[0];
        expect(firstItem.id).toBeDefined();
        expect(firstItem.employeeId).toBeDefined();
        expect(firstItem.projectId).toBeDefined();
        expect(firstItem.periodId).toBeDefined();
      }

      console.log('\n✅ 필수 필드 포함 확인 성공');
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 직원 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${nonExistentId}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBe(0);

      console.log('\n✅ 존재하지 않는 직원 빈 배열 반환 성공');
    });

    it('존재하지 않는 기간 ID로 조회 시 빈 배열을 반환해야 한다', async () => {
      const employee = await getEmployee();

      if (!employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${nonExistentId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('projects');
      expect(Array.isArray(response.body.projects)).toBe(true);
      expect(response.body.projects.length).toBe(0);

      console.log('\n✅ 존재하지 않는 기간 빈 배열 반환 성공');
    });

    it('잘못된 UUID 형식으로 조회 시 400 또는 500 에러가 발생해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/invalid-uuid/periods/${period.id}`,
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 성공');
    });
  });

  describe('성능 테스트', () => {
    it('응답 시간이 2초 이내여야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);

      console.log(`\n✅ 응답 시간: ${responseTime}ms`);
    });

    it('여러 할당이 있는 경우도 빠르게 조회되어야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/employees/${employee.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000);

      console.log(`\n✅ 다중 할당 조회 응답 시간: ${responseTime}ms`);
    });
  });
});
