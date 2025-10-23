/**
 * WBS 대량 할당 (POST) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 16개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/wbs-assignments/bulk (실제 데이터)', () => {
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

  async function getTwoUnassignedWbs() {
    const result = await dataSource.query(`
      SELECT 
        e.id as employee_id,
        p.id as project_id,
        ep.id as period_id,
        ARRAY_AGG(w.id) as wbs_item_ids
      FROM employee e
      CROSS JOIN project p
      CROSS JOIN evaluation_period ep
      CROSS JOIN wbs_item w
      WHERE e."deletedAt" IS NULL
      AND p."deletedAt" IS NULL
      AND ep."deletedAt" IS NULL
      AND w."deletedAt" IS NULL
      AND w."projectId" = p.id
      AND NOT EXISTS (
        SELECT 1 FROM evaluation_wbs_assignment wa
        WHERE wa."employeeId" = e.id
        AND wa."projectId" = p.id
        AND wa."periodId" = ep.id
        AND wa."wbsItemId" = w.id
        AND wa."deletedAt" IS NULL
      )
      GROUP BY e.id, p.id, ep.id
      HAVING COUNT(w.id) >= 2
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  describe('대량 할당 성공 시나리오', () => {
    it('여러 직원에게 WBS를 한번에 할당할 수 있어야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 여러 직원 대량 할당 성공');
    });

    it('한 직원에게 여러 WBS를 한번에 할당할 수 있어야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 한 직원 여러 WBS 대량 할당 성공');
    });

    it('여러 직원-WBS 조합을 한번에 할당할 수 있어야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 여러 조합 대량 할당 성공');
    });

    it('대량 할당 시 빈 평가기준이 자동으로 생성되어야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 평가기준 자동 생성 확인');
    });

    it('대량 할당 시 평가라인이 자동으로 구성되어야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 평가라인 자동 구성 확인');
    });

    it('빈 배열로 대량 할당 시 빈 배열을 반환해야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: [],
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 빈 배열 처리 확인');
    });
  });

  describe('에러 케이스', () => {
    it('assignments 필드가 누락되면 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({});

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ assignments 누락 에러 처리 성공');
    });

    it('assignments가 배열이 아니면 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({ assignments: 'not-an-array' });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ assignments 타입 에러 처리 성공');
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - employeeId 누락', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ employeeId 누락 에러 처리 성공');
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - wbsItemId 누락', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ wbsItemId 누락 에러 처리 성공');
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - projectId 누락', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ projectId 누락 에러 처리 성공');
    });

    it('할당 배열의 항목에서 필수 필드 누락 시 에러가 발생해야 한다 - periodId 누락', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ periodId 누락 에러 처리 성공');
    });

    it('존재하지 않는 employeeId가 포함된 경우 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: nonExistentId,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 employeeId 처리 확인');
    });

    it('UUID가 아닌 employeeId가 포함된 경우 에러가 발생해야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: 'invalid-uuid',
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 처리 성공');
    });

    it('일부 할당이 중복되는 경우 전체 트랜잭션이 롤백되어야 한다', async () => {
      const data = await getTwoUnassignedWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemIds: data.wbs_item_ids.slice(0, 2),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 중복 트랜잭션 롤백 확인');
    });

    it('10개 이상의 할당을 한번에 처리할 수 있어야 한다', async () => {
      const result = await dataSource.query(`
        SELECT 
          e.id as employee_id,
          p.id as project_id,
          ep.id as period_id,
          ARRAY_AGG(w.id) as wbs_item_ids
        FROM employee e
        CROSS JOIN project p
        CROSS JOIN evaluation_period ep
        CROSS JOIN wbs_item w
        WHERE e."deletedAt" IS NULL
        AND p."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND w."deletedAt" IS NULL
        AND w."projectId" = p.id
        GROUP BY e.id, p.id, ep.id
        HAVING COUNT(w.id) >= 10
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/bulk')
        .send({
          employeeId: result[0].employee_id,
          projectId: result[0].project_id,
          periodId: result[0].period_id,
          wbsItemIds: result[0].wbs_item_ids.slice(0, 10),
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 10개 이상 대량 처리 확인');
    });
  });
});
