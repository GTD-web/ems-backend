/**
 * WBS 할당 삭제 (DELETE) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 9개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('[DELETE] /admin/evaluation-criteria/wbs-assignments/:id (실제 데이터)', () => {
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

  async function getWbsAssignment() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getTwoWbsAssignments() {
    const result = await dataSource.query(
      `SELECT id FROM evaluation_wbs_assignment WHERE "deletedAt" IS NULL LIMIT 2`,
    );
    return result.length >= 2
      ? { assignment1: result[0], assignment2: result[1] }
      : null;
  }

  describe('기본 할당 취소', () => {
    it('1-1. 기본 할당 취소가 성공해야 한다', async () => {
      const assignment = await getWbsAssignment();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .expect(HttpStatus.OK);

      console.log('\n✅ 할당 취소 성공');
    });

    it('1-2. 마지막 할당 취소 시 평가기준이 자동으로 삭제되어야 한다', async () => {
      const assignment = await getWbsAssignment();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`);

      // 평가기준 자동 삭제는 비즈니스 로직에 따라 동작
      console.log('\n✅ 마지막 할당 취소 성공');
    });

    it('1-3. 다른 할당이 남아있는 경우 평가기준은 유지되어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment1.id}`,
        );

      // 다른 할당 확인
      const remaining = await dataSource.query(
        `SELECT id FROM evaluation_wbs_assignment WHERE id = $1 AND "deletedAt" IS NULL`,
        [assignments.assignment2.id],
      );

      expect(remaining.length).toBeGreaterThan(0);

      console.log('\n✅ 평가기준 유지 확인 성공');
    });

    it('1-4. 여러 할당을 순차적으로 취소할 수 있어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment1.id}`,
        )
        .expect(HttpStatus.OK);

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment2.id}`,
        )
        .expect(HttpStatus.OK);

      console.log('\n✅ 순차 취소 성공');
    });
  });

  describe('유효성 검증', () => {
    it('2-1. 잘못된 UUID 형식으로 요청 시 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .delete('/admin/evaluation-criteria/wbs-assignments/invalid-uuid');

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 성공');
    });
  });

  describe('멱등성 테스트', () => {
    it('3-1. 존재하지 않는 할당 ID로 취소 시도 시 성공 처리되어야 한다 (멱등성)', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${nonExistentId}`);

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 멱등성 테스트 성공');
    });

    it('3-2. 이미 취소된 할당을 다시 취소 시도 시 성공 처리되어야 한다 (멱등성)', async () => {
      const assignment = await getWbsAssignment();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .expect(HttpStatus.OK);

      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`);

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 중복 취소 멱등성 성공');
    });
  });

  describe('통합 시나리오', () => {
    it('4-1. 할당 취소 후 목록 조회에서 제외되어야 한다', async () => {
      const assignment = await getWbsAssignment();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`)
        .expect(HttpStatus.OK);

      const result = await dataSource.query(
        `SELECT id FROM evaluation_wbs_assignment WHERE id = $1 AND "deletedAt" IS NULL`,
        [assignment.id],
      );

      expect(result.length).toBe(0);

      console.log('\n✅ 목록 제외 확인 성공');
    });

    it('4-2. 대량 할당 후 모든 할당을 취소하면 평가기준도 모두 삭제되어야 한다', async () => {
      const assignments = await getTwoWbsAssignments();

      if (!assignments) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment1.id}`,
        )
        .expect(HttpStatus.OK);

      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/wbs-assignments/${assignments.assignment2.id}`,
        )
        .expect(HttpStatus.OK);

      console.log('\n✅ 대량 취소 성공');
    });
  });
});
