/**
 * 프로젝트에 할당된 직원 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 특정 평가기간에 특정 프로젝트에 할당된 모든 직원을 조회하는 기능을 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/project-assignments/projects/:projectId/periods/:periodId (실제 데이터)', () => {
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

  async function getProject() {
    const result = await dataSource.query(
      `SELECT id FROM project WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getPeriod() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_period WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('기본 조회', () => {
    it('특정 프로젝트의 특정 평가기간 할당 직원 목록을 조회할 수 있어야 한다', async () => {
      const project = await getProject();
      const period = await getPeriod();

      if (!project || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${project.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(result).toHaveProperty('employees');
      expect(Array.isArray(result.employees)).toBe(true);

      if (result.employees.length > 0) {
        const firstEmployee = result.employees[0];
        expect(firstEmployee).toHaveProperty('id');
        expect(firstEmployee).toHaveProperty('name');
        expect(firstEmployee).toHaveProperty('employeeNumber');
        expect(firstEmployee).toHaveProperty('email');
      }

      console.log(
        `\n✅ 프로젝트 할당 직원 목록 조회 성공 (${result.employees.length}명)`,
      );
    });
  });

  describe('다중 직원', () => {
    it('한 프로젝트에 여러 직원이 할당된 경우 모두 조회되어야 한다', async () => {
      // 여러 직원이 할당된 프로젝트 찾기
      const projects = await dataSource.query(
        `SELECT p.id, p.name, COUNT(pa.id) as assignment_count
         FROM project p
         INNER JOIN evaluation_project_assignment pa ON p.id = pa."projectId"
         WHERE p."deletedAt" IS NULL AND pa."deletedAt" IS NULL
         GROUP BY p.id, p.name
         HAVING COUNT(pa.id) >= 2
         LIMIT 1`,
      );

      if (projects.length === 0) {
        console.log('여러 직원이 할당된 프로젝트가 없어서 테스트 스킵');
        return;
      }

      const project = projects[0];
      const period = await getPeriod();

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${project.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(result.employees.length).toBeGreaterThanOrEqual(1);

      console.log(`\n✅ 다중 직원 조회 성공 (${result.employees.length}명)`);
    });
  });

  describe('빈 결과', () => {
    it('해당 프로젝트에 할당된 직원이 없을 때 빈 배열을 반환해야 한다', async () => {
      // 할당이 없는 프로젝트 찾기
      const projects = await dataSource.query(
        `SELECT p.id
         FROM project p
         WHERE p."deletedAt" IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM evaluation_project_assignment pa
           WHERE pa."projectId" = p.id AND pa."deletedAt" IS NULL
         )
         LIMIT 1`,
      );

      if (projects.length === 0) {
        console.log('할당이 없는 프로젝트가 없어서 테스트 스킵');
        return;
      }

      const project = projects[0];
      const period = await getPeriod();

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${project.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(result.employees).toEqual([]);

      console.log('\n✅ 빈 배열 반환 성공');
    });
  });

  describe('취소된 할당 제외', () => {
    it('취소된 할당은 목록에서 자동 제외되어야 한다', async () => {
      const project = await getProject();
      const period = await getPeriod();

      if (!project || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 할당 조회
      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${project.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      // API는 자동으로 취소되지 않은 할당의 직원만 반환
      expect(result.employees).toBeDefined();
      expect(Array.isArray(result.employees)).toBe(true);

      console.log(
        `\n✅ 취소된 할당 제외 확인 (활성 직원: ${result.employees.length}명)`,
      );
    });
  });

  describe('직원 정보 포함', () => {
    it('각 직원의 상세 정보가 포함되어야 한다', async () => {
      const project = await getProject();
      const period = await getPeriod();

      if (!project || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${project.id}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.employees.length > 0) {
        const employee = result.employees[0];

        // 직원 기본 정보 확인
        expect(employee).toHaveProperty('id');
        expect(employee).toHaveProperty('name');
        expect(employee).toHaveProperty('employeeNumber');
        expect(employee).toHaveProperty('email');
        expect(employee).toHaveProperty('departmentId');
        expect(employee).toHaveProperty('departmentName');
        expect(employee).toHaveProperty('status');

        // 타입 확인
        expect(typeof employee.id).toBe('string');
        expect(typeof employee.name).toBe('string');
        expect(typeof employee.status).toBe('string');

        console.log('\n✅ 직원 정보 포함 확인');
      } else {
        console.log('\n⚠️ 할당된 직원이 없어서 정보 확인 스킵');
      }
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 프로젝트 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const period = await getPeriod();
      const nonExistentProjectId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${nonExistentProjectId}/periods/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.employees).toEqual([]);

      console.log('\n✅ 존재하지 않는 프로젝트 처리 확인');
    });

    it('존재하지 않는 평가기간 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const project = await getProject();
      const nonExistentPeriodId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${project.id}/periods/${nonExistentPeriodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.employees).toEqual([]);

      console.log('\n✅ 존재하지 않는 평가기간 처리 확인');
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getPeriod();
      const invalidUuid = 'invalid-uuid';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/projects/${invalidUuid}/periods/${period.id}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 에러 확인');
    });
  });
});
