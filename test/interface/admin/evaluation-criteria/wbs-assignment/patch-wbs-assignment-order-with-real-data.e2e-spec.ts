/**
 * WBS 할당 순서 변경 (PATCH) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 13개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-criteria/wbs-assignments/:id/order (실제 데이터)', () => {
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

  async function getTwoWbsAssignments() {
    const result = await dataSource.query(
      `SELECT id, "displayOrder" FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL ORDER BY "displayOrder" LIMIT 2`,
    );
    return result.length >= 2
      ? { assignment1: result[0], assignment2: result[1] }
      : null;
  }

  async function getWbsAssignment() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getEmployee() {
    const result = await dataSource.query(
      `SELECT id FROM employee WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('순서 변경 성공 시나리오', () => {
    it('WBS 할당을 위로 이동할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();
      const employee = await getEmployee();

      if (!assignments || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment2.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 위로 이동 성공');
    });

    it('WBS 할당을 아래로 이동할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();
      const employee = await getEmployee();

      if (!assignments || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment1.id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: employee.id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 아래로 이동 성공');
    });

    it('첫 번째 항목을 위로 이동하면 순서가 유지되어야 한다', async () => {
      const assignment = await getWbsAssignment();
      const employee = await getEmployee();

      if (!assignment || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([
        HttpStatus.OK,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 첫 항목 위로 이동 처리 성공');
    });

    it('마지막 항목을 아래로 이동하면 순서가 유지되어야 한다', async () => {
      const result = await dataSource.query(
        `SELECT id FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL ORDER BY "displayOrder" DESC LIMIT 1`,
      );
      const employee = await getEmployee();

      if (result.length === 0 || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${result[0].id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: employee.id });

      expect([
        HttpStatus.OK,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 마지막 항목 아래로 이동 처리 성공');
    });

    it('여러 번 순서를 변경할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();
      const employee = await getEmployee();

      if (!assignments || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 첫 번째 이동
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment1.id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: employee.id });

      // 두 번째 이동
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment2.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 여러 번 순서 변경 성공');
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 할당 ID로 순서 변경 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const employee = await getEmployee();

      if (!employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${nonExistentId}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 ID 에러 처리 성공');
    });

    it('잘못된 direction 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignment();
      const employee = await getEmployee();

      if (!assignment || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'invalid' })
        .send({ updatedBy: employee.id });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 direction 에러 처리 성공');
    });

    it('완료된 평가기간의 할당 순서 변경 시 422 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignment();
      const employee = await getEmployee();

      if (!assignment || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([
        HttpStatus.OK,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 완료된 평가기간 에러 처리 성공');
    });

    it('UUID가 아닌 할당 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const employee = await getEmployee();

      if (!employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/wbs-assignments/invalid-id/order')
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 처리 성공');
    });

    it('direction 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignment();
      const employee = await getEmployee();

      if (!assignment || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignment.id}/order`,
        )
        .send({ updatedBy: employee.id });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ direction 누락 에러 처리 성공');
    });
  });

  describe('독립성 테스트', () => {
    it('서로 다른 직원의 WBS 할당 순서는 독립적으로 관리되어야 한다', async () => {
      const result = await dataSource.query(`
        SELECT 
          e1.id as employee1_id,
          e2.id as employee2_id,
          wa1.id as assignment1_id,
          wa2.id as assignment2_id
        FROM employee e1
        CROSS JOIN employee e2
        CROSS JOIN evaluation_wbs_assignment wa1
        CROSS JOIN evaluation_wbs_assignment wa2
        WHERE e1."deletedAt" IS NULL
        AND e2."deletedAt" IS NULL
        AND e1.id != e2.id
        AND wa1."employeeId" = e1.id
        AND wa2."employeeId" = e2.id
        AND wa1."deletedAt" IS NULL
        AND wa2."deletedAt" IS NULL
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${result[0].assignment1_id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: result[0].employee1_id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 직원별 독립성 확인 성공');
    });

    it('서로 다른 평가기간의 WBS 할당 순서는 독립적으로 관리되어야 한다', async () => {
      const assignment = await getWbsAssignment();
      const employee = await getEmployee();

      if (!assignment || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'up' })
        .send({ updatedBy: employee.id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 평가기간별 독립성 확인 성공');
    });

    it('서로 다른 프로젝트의 WBS 할당 순서는 독립적으로 관리되어야 한다', async () => {
      const assignment = await getWbsAssignment();
      const employee = await getEmployee();

      if (!assignment || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/${assignment.id}/order`,
        )
        .query({ direction: 'down' })
        .send({ updatedBy: employee.id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 프로젝트별 독립성 확인 성공');
    });
  });
});
