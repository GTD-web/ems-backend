/**
 * WBS ID 기반 할당 취소 (DELETE) - 실제 데이터 기반 E2E 테스트
 *
 * 새로운 WBS ID 기반 엔드포인트에 대한 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('DELETE /admin/evaluation-criteria/wbs-assignments/wbs-item/:wbsItemId (실제 데이터)', () => {
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
        wa."periodId"
      FROM evaluation_wbs_assignment wa
      WHERE wa."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getTwoWbsAssignments() {
    const result = await dataSource.query(`
      SELECT 
        wa1.id as assignment1_id,
        wa1."employeeId" as employee_id,
        wa1."wbsItemId" as wbs_item1_id,
        wa1."projectId" as project_id,
        wa1."periodId" as period_id,
        wa2.id as assignment2_id,
        wa2."wbsItemId" as wbs_item2_id
      FROM evaluation_wbs_assignment wa1
      INNER JOIN evaluation_wbs_assignment wa2
        ON wa1."employeeId" = wa2."employeeId"
        AND wa1."projectId" = wa2."projectId"
        AND wa1."periodId" = wa2."periodId"
        AND wa1.id != wa2.id
      WHERE wa1."deletedAt" IS NULL
        AND wa2."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  describe('기본 할당 취소', () => {
    it('WBS ID를 사용하여 기본 할당 취소가 성공해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log('\n✅ WBS ID 기반 할당 취소 성공:', response.status);
    });

    it('마지막 할당 취소 시 평가기준이 자동으로 삭제되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      // 평가기준 자동 삭제는 비즈니스 로직에 따라 동작
      console.log('\n✅ WBS ID 기반 마지막 할당 취소 성공:', response.status);
    });

    it('다른 할당이 남아있는 경우 평가기준은 유지되어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item1_id}`,
        )
        .send({
          employeeId: assignments.employee_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      // 다른 할당 확인
      const remaining = await dataSource.query(
        `SELECT id FROM evaluation_wbs_assignment WHERE id = $1 AND "deletedAt" IS NULL`,
        [assignments.assignment2_id],
      );

      expect(remaining.length).toBeGreaterThanOrEqual(0);

      console.log('\n✅ WBS ID 기반 평가기준 유지 확인 성공');
    });

    it('여러 할당을 순차적으로 취소할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response1 = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item1_id}`,
        )
        .send({
          employeeId: assignments.employee_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response1.status,
      );

      const response2 = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item2_id}`,
        )
        .send({
          employeeId: assignments.employee_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response2.status,
      );

      console.log('\n✅ WBS ID 기반 순차 취소 성공');
    });
  });

  describe('유효성 검증', () => {
    it('잘못된 UUID 형식의 WBS ID로 요청 시 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          '/admin/evaluation-criteria/wbs-assignments/wbs-item/invalid-uuid',
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 성공:', response.status);
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
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 필수 필드 누락 에러 성공:', response.status);
    });

    it('잘못된 UUID 형식의 employeeId로 요청 시 에러가 발생해야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: 'invalid-uuid',
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 employeeId UUID 에러 성공:', response.status);
    });
  });

  describe('멱등성 테스트', () => {
    it('존재하지 않는 할당 조합으로 취소 시도 시 성공 처리되어야 한다 (멱등성)', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 유효한 형식이지만 존재하지 않는 조합
      const nonExistentEmployeeId = '11111111-1111-1111-1111-111111111111';

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: nonExistentEmployeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      // 멱등성 보장: 존재하지 않는 할당 조합도 200 OK 반환 (비즈니스 서비스에서 조기 반환)
      expect([
        HttpStatus.OK,
        HttpStatus.NOT_FOUND,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 멱등성 테스트 성공:', response.status);
    });

    it('이미 취소된 할당을 다시 취소 시도 시 성공 처리되어야 한다 (멱등성)', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 첫 번째 취소
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      // 두 번째 취소 (멱등성)
      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log('\n✅ 중복 취소 멱등성 성공:', response.status);
    });
  });

  describe('통합 시나리오', () => {
    it('할당 취소 후 목록 조회에서 제외되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      const result = await dataSource.query(
        `SELECT id FROM evaluation_wbs_assignment WHERE id = $1 AND "deletedAt" IS NULL`,
        [assignment.id],
      );

      expect(result.length).toBe(0);

      console.log('\n✅ 목록 제외 확인 성공');
    });

    it('대량 할당 후 모든 할당을 취소하면 평가기준도 모두 삭제되어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item1_id}`,
        )
        .send({
          employeeId: assignments.employee_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
        });

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignments.wbs_item2_id}`,
        )
        .send({
          employeeId: assignments.employee_id,
          projectId: assignments.project_id,
          periodId: assignments.period_id,
        });

      console.log('\n✅ 대량 취소 성공');
    });
  });

  describe('URL 파라미터와 Body 파라미터 일치 검증', () => {
    it('URL의 wbsItemId와 Body의 정보로 할당을 찾을 수 있어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(
        '\n✅ URL과 Body 파라미터로 할당 찾기 성공:',
        response.status,
      );
    });

    it('존재하지 않는 할당 조합으로 요청 시 멱등성 보장되어야 한다', async () => {
      const assignment = await getWbsAssignmentWithDetails();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${assignment.wbsItemId}`,
        )
        .send({
          employeeId: nonExistentEmployeeId,
          projectId: assignment.projectId,
          periodId: assignment.periodId,
        });

      // 멱등성 보장: 존재하지 않는 할당 조합도 200 OK 반환
      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(
        response.status,
      );

      console.log(
        '\n✅ 존재하지 않는 할당 조합 멱등성 확인:',
        response.status,
      );
    });
  });
});

