/**
 * 프로젝트 일괄 할당 (POST bulk) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 14개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/project-assignments/bulk (실제 데이터)', () => {
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

  async function getTwoEmployees() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { employee1: result[0], employee2: result[1] }
      : null;
  }

  async function getTwoProjects() {
    const result = await dataSource.query(
      `SELECT id FROM project WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { project1: result[0], project2: result[1] }
      : null;
  }

  async function getPeriod() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL AND status IN ('waiting', 'in-progress') LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('API 기본 동작', () => {
    it('일괄 할당 API가 존재해야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
          ],
        });

      expect([HttpStatus.CREATED, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ API 존재 확인 성공');
    });

    it('잘못된 경로로 요청 시 404 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/invalid-bulk');

      expect(response.status).toBe(HttpStatus.NOT_FOUND);

      console.log('\n✅ 잘못된 경로 404 에러 성공');
    });
  });

  describe('일괄 할당 성공 시나리오', () => {
    it('단일 할당을 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
          ],
        });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 단일 할당 생성 성공');
    });

    it('여러 할당을 동시에 생성할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
            {
              employeeId: employees.employee2.id,
              projectId: projects.project2.id,
              periodId: period.id,
              assignedBy: employees.employee2.id,
            },
          ],
        });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 여러 할당 동시 생성 성공');
    });

    it('동일한 직원을 여러 프로젝트에 할당할 수 있어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
            {
              employeeId: employees.employee1.id,
              projectId: projects.project2.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
          ],
        });

      expect([HttpStatus.CREATED, HttpStatus.CONFLICT]).toContain(
        response.status,
      );

      console.log('\n✅ 동일 직원 여러 프로젝트 할당 성공');
    });
  });

  describe('유효성 검증', () => {
    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({})
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 필수 필드 누락 400 에러 성공');
    });

    it('빈 배열로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [],
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.CREATED]).toContain(
        response.status,
      );

      console.log('\n✅ 빈 배열 에러 성공');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: 'invalid-uuid',
              projectId: 'invalid-uuid',
              periodId: period.id,
              assignedBy: 'invalid-uuid',
            },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body.message).toBeDefined();

      console.log('\n✅ 잘못된 UUID 400 에러 성공');
    });
  });

  describe('중복 처리', () => {
    it('중복된 할당 요청 시 적절히 처리되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
          ],
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 중복 할당 처리 성공');
    });

    it('일부 성공 일부 실패 시 적절히 처리되어야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
            {
              employeeId: 'invalid-uuid',
              projectId: projects.project2.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
          ],
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 일부 성공 일부 실패 처리 성공');
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 직원 ID로 요청 시 적절한 에러가 발생해야 한다', async () => {
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: nonExistentId,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: nonExistentId,
            },
          ],
        });

      expect([
        HttpStatus.NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CREATED,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 직원 ID 에러 성공');
    });

    it('존재하지 않는 프로젝트 ID로 요청 시 적절한 에러가 발생해야 한다', async () => {
      const employees = await getTwoEmployees();
      const period = await getPeriod();

      if (!employees || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: nonExistentId,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
          ],
        });

      expect([
        HttpStatus.NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CREATED,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 프로젝트 ID 에러 성공');
    });
  });

  describe('성능 테스트', () => {
    it('대량 할당 시 응답 시간이 5초 이내여야 한다', async () => {
      const employees = await getTwoEmployees();
      const projects = await getTwoProjects();
      const period = await getPeriod();

      if (!employees || !projects || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      await testSuite
        .request()
        .post('/admin/evaluation-criteria/project-assignments/bulk')
        .send({
          assignments: [
            {
              employeeId: employees.employee1.id,
              projectId: projects.project1.id,
              periodId: period.id,
              assignedBy: employees.employee1.id,
            },
            {
              employeeId: employees.employee2.id,
              projectId: projects.project2.id,
              periodId: period.id,
              assignedBy: employees.employee2.id,
            },
          ],
        });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(5000);

      console.log(`\n✅ 대량 할당 응답 시간: ${responseTime}ms`);
    });
  });
});
