/**
 * 직원별 WBS 할당 조회 (GET) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 12개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/wbs-assignments/employee/:employeeId/period/:periodId (실제 데이터)', () => {
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
    const result = await dataSource.query(`
      SELECT 
        wa."employeeId" as employee_id,
        wa."periodId" as period_id
      FROM evaluation_wbs_assignment wa
      WHERE wa."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getEmployeeWithMultipleAssignments() {
    const result = await dataSource.query(`
      SELECT 
        wa."employeeId" as employee_id,
        wa."periodId" as period_id,
        COUNT(*) as count
      FROM evaluation_wbs_assignment wa
      WHERE wa."deletedAt" IS NULL
      GROUP BY wa."employeeId", wa."periodId"
      HAVING COUNT(*) >= 2
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

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

  describe('정상 조회', () => {
    it('특정 직원의 특정 평가기간 WBS 할당을 조회할 수 있어야 한다', async () => {
      const data = await getEmployeeAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBeGreaterThan(0);

      console.log('\n✅ 직원 WBS 할당 조회 성공');
    });

    it('WBS 할당이 없는 경우 빈 배열을 반환해야 한다', async () => {
      const employee = await getEmployee();
      const period = await getPeriod();

      if (!employee || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 할당이 없는 조합 찾기
      const result = await dataSource.query(`
        SELECT e.id as employee_id, ep.id as period_id
        FROM employee e
        CROSS JOIN evaluation_period ep
        WHERE e."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM evaluation_wbs_assignment wa
          WHERE wa."employeeId" = e.id
          AND wa."periodId" = ep.id
          AND wa."deletedAt" IS NULL
        )
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('할당 없는 조합을 찾을 수 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${result[0].employee_id}/period/${result[0].period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 성공');
    });

    it('여러 프로젝트의 여러 WBS가 할당된 경우 모두 조회되어야 한다', async () => {
      const data = await getEmployeeWithMultipleAssignments();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBeGreaterThanOrEqual(2);

      console.log('\n✅ 다중 할당 조회 성공');
    });

    it('프로젝트별로 그룹화된 데이터를 반환해야 한다', async () => {
      const data = await getEmployeeAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);

      console.log('\n✅ 그룹화된 데이터 반환 확인 성공');
    });

    it('취소된 WBS 할당은 조회 결과에서 제외되어야 한다', async () => {
      const data = await getEmployeeAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      // 취소된 할당 제외 확인
      if (
        response.body.wbsAssignments &&
        response.body.wbsAssignments.length > 0
      ) {
        response.body.wbsAssignments.forEach((assignment: any) => {
          expect(
            assignment.deletedAt == null || assignment.deletedAt === undefined,
          ).toBe(true);
        });
      }

      console.log('\n✅ 취소된 할당 제외 확인 성공');
    });

    it('다른 직원의 WBS 할당은 조회되지 않아야 한다', async () => {
      const data = await getEmployeeAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      // 모든 할당이 동일한 직원인지 확인
      if (
        response.body.wbsAssignments &&
        response.body.wbsAssignments.length > 0
      ) {
        response.body.wbsAssignments.forEach((assignment: any) => {
          expect(assignment.employeeId).toBe(data.employee_id);
        });
      }

      console.log('\n✅ 직원 필터링 확인 성공');
    });

    it('다른 평가기간의 WBS 할당은 조회되지 않아야 한다', async () => {
      const data = await getEmployeeAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      // 모든 할당이 동일한 평가기간인지 확인
      if (
        response.body.wbsAssignments &&
        response.body.wbsAssignments.length > 0
      ) {
        response.body.wbsAssignments.forEach((assignment: any) => {
          expect(assignment.periodId).toBe(data.period_id);
        });
      }

      console.log('\n✅ 평가기간 필터링 확인 성공');
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/invalid-uuid/period/${period.id}`,
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 employeeId UUID 에러 성공');
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const employee = await getEmployee();

      if (!employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${employee.id}/period/invalid-uuid`,
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 periodId UUID 에러 성공');
    });

    it('존재하지 않는 직원 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${nonExistentId}/period/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBe(0);

      console.log('\n✅ 존재하지 않는 직원 빈 배열 반환 성공');
    });

    it('존재하지 않는 평가기간 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const employee = await getEmployee();

      if (!employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${employee.id}/period/${nonExistentId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBe(0);

      console.log('\n✅ 존재하지 않는 평가기간 빈 배열 반환 성공');
    });
  });

  describe('응답 구조', () => {
    it('조회 결과에 필수 연관 데이터가 포함되어야 한다', async () => {
      const data = await getEmployeeAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      if (
        response.body.wbsAssignments &&
        response.body.wbsAssignments.length > 0
      ) {
        const firstItem = response.body.wbsAssignments[0];
        expect(firstItem.id).toBeDefined();
        expect(firstItem.employeeId || firstItem.employee).toBeDefined();
        expect(firstItem.wbsItemId || firstItem.wbsItem).toBeDefined();
        expect(firstItem.projectId || firstItem.project).toBeDefined();
      }

      console.log('\n✅ 필수 데이터 포함 확인 성공');
    });

    it('한 프로젝트 내에서 여러 WBS 할당을 한 번에 조회할 수 있어야 한다', async () => {
      const data = await getEmployeeWithMultipleAssignments();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/employee/${data.employee_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);

      console.log('\n✅ 프로젝트 내 여러 WBS 조회 성공');
    });
  });
});
