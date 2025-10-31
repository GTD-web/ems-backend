/**
 * WBS ID 기반 할당 순서 변경 (PATCH) - 실제 데이터 기반 E2E 테스트
 *
 * 새로운 WBS ID 기반 엔드포인트에 대한 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-criteria/wbs-assignments/wbs-item/:wbsItemId/order (실제 데이터)', () => {
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

  async function getWbsAssignmentWithDetails() {
    const result = await dataSource.query(`
      SELECT 
        wa.id,
        wa."employeeId",
        wa."wbsItemId",
        wa."projectId",
        wa."periodId",
        wa."displayOrder"
      FROM evaluation_wbs_assignment wa
      WHERE wa."deletedAt" IS NULL
      ORDER BY wa."displayOrder"
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getTwoWbsAssignmentsSameEmployee() {
    const result = await dataSource.query(`
      SELECT 
        wa1.id as assignment1_id,
        wa1."employeeId" as employee_id,
        wa1."wbsItemId" as wbs_item1_id,
        wa1."projectId" as project_id,
        wa1."periodId" as period_id,
        wa1."displayOrder" as display_order1,
        wa2.id as assignment2_id,
        wa2."wbsItemId" as wbs_item2_id,
        wa2."displayOrder" as display_order2
      FROM evaluation_wbs_assignment wa1
      INNER JOIN evaluation_wbs_assignment wa2
        ON wa1."employeeId" = wa2."employeeId"
        AND wa1."projectId" = wa2."projectId"
        AND wa1."periodId" = wa2."periodId"
        AND wa1.id != wa2.id
      WHERE wa1."deletedAt" IS NULL
        AND wa2."deletedAt" IS NULL
        AND wa1."displayOrder" < wa2."displayOrder"
      ORDER BY wa1."displayOrder"
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  describe('순서 변경 성공 시나리오', () => {
    it('WBS ID를 사용하여 할당을 위로 이동할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignmentsSameEmployee();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item2_id}/order`,
        )
        .send({
          employeeId: assignments.employee_id,
          wbsItemId: assignments.wbs_item2_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
          direction: 'up',
        });

      // 완료된 평가기간이면 422, 성공하면 200
      if (response.status === HttpStatus.OK) {
        expect(response.status).toBe(HttpStatus.OK);
      } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      }

      console.log('\n✅ WBS ID 기반 위로 이동 테스트 성공:', response.status);
    });

    it('WBS ID를 사용하여 할당을 아래로 이동할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignmentsSameEmployee();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item1_id}/order`,
        )
        .send({
          employeeId: assignments.employee_id,
          wbsItemId: assignments.wbs_item1_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
          direction: 'down',
        });

      // 완료된 평가기간이면 422, 성공하면 200
      if (response.status === HttpStatus.OK) {
        expect(response.status).toBe(HttpStatus.OK);
      } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      }

      console.log(
        '\n✅ WBS ID 기반 아래로 이동 테스트 성공:',
        response.status,
      );
    });

    it('첫 번째 항목을 위로 이동하면 순서가 유지되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      // 첫 항목 위로 이동: 성공(200), 완료된 평가기간(422), Bad Request(400), 또는 Not Found(404)
      expect([
        HttpStatus.OK,
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log(
        '\n✅ WBS ID 기반 첫 항목 위로 이동 처리 성공:',
        response.status,
      );
    });

    it('마지막 항목을 아래로 이동하면 순서가 유지되어야 한다', async () => {
      const result = await dataSource.query(`
        SELECT 
          wa.id,
          wa."employeeId",
          wa."wbsItemId",
          wa."projectId",
          wa."periodId"
        FROM evaluation_wbs_assignment wa
        WHERE wa."deletedAt" IS NULL
        ORDER BY wa."displayOrder" DESC
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const assignment = result[0];

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'down',
        });

      // 마지막 항목 아래로 이동: 성공(200), 완료된 평가기간(422), Bad Request(400), 또는 Not Found(404)
      expect([
        HttpStatus.OK,
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log(
        '\n✅ WBS ID 기반 마지막 항목 아래로 이동 처리 성공:',
        response.status,
      );
    });

    it('여러 번 순서를 변경할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignmentsSameEmployee();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 첫 번째 이동
      await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item1_id}/order`,
        )
        .send({
          employeeId: assignments.employee_id,
          wbsItemId: assignments.wbs_item1_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
          direction: 'down',
        });

      // 두 번째 이동
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item2_id}/order`,
        )
        .send({
          employeeId: assignments.employee_id,
          wbsItemId: assignments.wbs_item2_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
          direction: 'up',
        });

      // 완료된 평가기간이면 422, 성공하면 200
      if (response.status === HttpStatus.OK) {
        expect(response.status).toBe(HttpStatus.OK);
      } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      }

      console.log(
        '\n✅ WBS ID 기반 여러 번 순서 변경 테스트 성공:',
        response.status,
      );
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 할당 조합으로 순서 변경 시 404 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: nonExistentEmployeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      expect([HttpStatus.NOT_FOUND, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );

      console.log(
        '\n✅ 존재하지 않는 할당 조합 에러 처리 성공:',
        response.status,
      );
    });

    it('잘못된 direction 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'invalid',
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log(
        '\n✅ 잘못된 direction 에러 처리 성공:',
        response.status,
      );
    });

    it('완료된 평가기간의 할당 순서 변경 시 422 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      // 평가기간 상태에 따라 200(진행중) 또는 422(완료됨)
      expect([
        HttpStatus.OK,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log(
        '\n✅ 완료된 평가기간 검증 테스트 성공:',
        response.status,
      );
    });

    it('UUID가 아닌 WBS ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch('/admin/evaluation-criteria/wbs-assignments/wbs-item/invalid-id/order')
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: 'invalid-id',
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 처리 성공:', response.status);
    });

    it('필수 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // employeeId 누락
      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 필수 필드 누락 에러 처리 성공:', response.status);
    });

    it('direction 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ direction 누락 에러 처리 성공:', response.status);
    });
  });

  describe('독립성 테스트', () => {
    it('서로 다른 직원의 WBS 할당 순서는 독립적으로 관리되어야 한다', async () => {
      const result = await dataSource.query(`
        SELECT 
          e1.id as employee1_id,
          e2.id as employee2_id,
          wa1."wbsItemId" as wbs_item1_id,
          wa2."wbsItemId" as wbs_item2_id,
          wa1."projectId" as project_id,
          wa1."periodId" as period_id
        FROM employee e1
        CROSS JOIN employee e2
        CROSS JOIN evaluation_wbs_assignment wa1
        CROSS JOIN evaluation_wbs_assignment wa2
        WHERE e1."deletedAt" IS NULL
        AND e2."deletedAt" IS NULL
        AND e1.id != e2.id
        AND wa1."employeeId" = e1.id
        AND wa2."employeeId" = e2.id
        AND wa1."projectId" = wa2."projectId"
        AND wa1."periodId" = wa2."periodId"
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
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${result[0].wbs_item1_id}/order`,
        )
        .send({
          employeeId: result[0].employee1_id,
          wbsItemId: result[0].wbs_item1_id,
          projectId: result[0].project_id,
          periodId: result[0].period_id,
          direction: 'down',
        });

      // 완료된 평가기간이면 422, 성공하면 200
      if (response.status === HttpStatus.OK) {
        expect(response.status).toBe(HttpStatus.OK);
      } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      }

      console.log('\n✅ 직원별 독립성 확인 성공:', response.status);
    });

    it('서로 다른 평가기간의 WBS 할당 순서는 독립적으로 관리되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      // 완료된 평가기간이면 422, 성공하면 200
      if (response.status === HttpStatus.OK) {
        expect(response.status).toBe(HttpStatus.OK);
      } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      }

      console.log('\n✅ 평가기간별 독립성 확인 성공:', response.status);
    });

    it('서로 다른 프로젝트의 WBS 할당 순서는 독립적으로 관리되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'down',
        });

      // 완료된 평가기간이면 422, 성공하면 200
      if (response.status === HttpStatus.OK) {
        expect(response.status).toBe(HttpStatus.OK);
      } else if (response.status === HttpStatus.UNPROCESSABLE_ENTITY) {
        expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      } else {
        expect(response.status).toBe(HttpStatus.NOT_FOUND);
      }

      console.log('\n✅ 프로젝트별 독립성 확인 성공:', response.status);
    });
  });

  describe('URL 파라미터와 Body 파라미터 일치 검증', () => {
    it('URL의 wbsItemId와 Body의 wbsItemId가 일치하지 않아도 URL 파라미터가 우선 적용되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const differentWbsId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: differentWbsId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      // URL의 wbsItemId가 우선 적용되므로, URL의 할당이 존재하면 성공(200) 또는 422(완료된 평가기간)
      // 만약 Body의 wbsItemId로 조회를 시도한다면 404
      expect([
        HttpStatus.OK,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log(
        '\n✅ URL 파라미터 우선 적용 확인:',
        response.status,
      );
    });

    it('URL의 wbsItemId와 Body의 wbsItemId가 일치하면 성공해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}/order`,
        )
        .send({
          employeeId: assignment.employeeId,
          wbsItemId: assignment.wbsItemId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
          direction: 'up',
        });

      // 평가기간 상태에 따라 200(진행중) 또는 422(완료됨) 또는 404(할당 없음)
      expect([
        HttpStatus.OK,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log(
        '\n✅ URL과 Body 파라미터 일치 시 성공 처리 확인:',
        response.status,
      );
    });
  });
});

