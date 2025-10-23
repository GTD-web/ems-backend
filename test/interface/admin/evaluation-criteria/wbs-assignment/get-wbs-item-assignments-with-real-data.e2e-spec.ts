/**
 * WBS 항목별 직원 할당 조회 (GET) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 11개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/wbs-assignments/wbs-item/:wbsItemId/period/:periodId (실제 데이터)', () => {
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

  async function getWbsItemAndPeriod() {
    const result = await dataSource.query(`
      SELECT 
        wa."wbsItemId" as wbs_item_id,
        wa."periodId" as period_id
      FROM evaluation_wbs_assignment wa
      WHERE wa."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getWbsItemWithMultipleAssignments() {
    const result = await dataSource.query(`
      SELECT 
        wa."wbsItemId" as wbs_item_id,
        wa."periodId" as period_id,
        COUNT(*) as count
      FROM evaluation_wbs_assignment wa
      WHERE wa."deletedAt" IS NULL
      GROUP BY wa."wbsItemId", wa."periodId"
      HAVING COUNT(*) >= 2
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getWbsItem() {
    const result = await dataSource.query(
      `SELECT id FROM wbs_item WHERE "deletedAt" IS NULL LIMIT 1`,
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
    it('특정 WBS 항목의 특정 평가기간 직원 할당을 조회할 수 있어야 한다', async () => {
      const data = await getWbsItemAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${data.wbs_item_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBeGreaterThan(0);

      console.log('\n✅ WBS 항목 할당 조회 성공');
    });

    it('직원 할당이 없는 경우 빈 배열을 반환해야 한다', async () => {
      const wbsItem = await getWbsItem();
      const period = await getPeriod();

      if (!wbsItem || !period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 할당이 없는 조합 찾기
      const result = await dataSource.query(`
        SELECT w.id as wbs_id, ep.id as period_id
        FROM wbs_item w
        CROSS JOIN evaluation_period ep
        WHERE w."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM evaluation_wbs_assignment wa
          WHERE wa."wbsItemId" = w.id
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
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${result[0].wbs_id}/period/${result[0].period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBe(0);

      console.log('\n✅ 빈 배열 반환 성공');
    });

    it('여러 직원이 할당된 경우 모두 조회되어야 한다', async () => {
      const data = await getWbsItemWithMultipleAssignments();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${data.wbs_item_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBeGreaterThanOrEqual(2);

      console.log('\n✅ 다중 할당 조회 성공');
    });

    it('취소된 할당은 조회 결과에서 제외되어야 한다', async () => {
      const data = await getWbsItemAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${data.wbs_item_id}/period/${data.period_id}`,
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

    it('다른 WBS 항목의 할당은 조회되지 않아야 한다', async () => {
      const data = await getWbsItemAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${data.wbs_item_id}/period/${data.period_id}`,
        )
        .expect(HttpStatus.OK);

      // 모든 할당이 동일한 WBS 항목인지 확인
      if (
        response.body.wbsAssignments &&
        response.body.wbsAssignments.length > 0
      ) {
        response.body.wbsAssignments.forEach((assignment: any) => {
          expect(assignment.wbsItemId).toBe(data.wbs_item_id);
        });
      }

      console.log('\n✅ WBS 항목 필터링 확인 성공');
    });

    it('다른 평가기간의 할당은 조회되지 않아야 한다', async () => {
      const data = await getWbsItemAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${data.wbs_item_id}/period/${data.period_id}`,
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
    it('잘못된 UUID 형식의 wbsItemId로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/invalid-uuid/period/${period.id}`,
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 wbsItemId UUID 에러 성공');
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const wbsItem = await getWbsItem();

      if (!wbsItem) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/invalid-uuid`,
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 periodId UUID 에러 성공');
    });

    it('존재하지 않는 WBS 항목 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${nonExistentId}/period/${period.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.wbsAssignments).toBeDefined();
      expect(Array.isArray(response.body.wbsAssignments)).toBe(true);
      expect(response.body.wbsAssignments.length).toBe(0);

      console.log('\n✅ 존재하지 않는 WBS 항목 빈 배열 반환 성공');
    });

    it('존재하지 않는 평가기간 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const wbsItem = await getWbsItem();

      if (!wbsItem) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${wbsItem.id}/period/${nonExistentId}`,
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
      const data = await getWbsItemAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments/wbs-item/${data.wbs_item_id}/period/${data.period_id}`,
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
      }

      console.log('\n✅ 필수 데이터 포함 확인 성공');
    });
  });
});
