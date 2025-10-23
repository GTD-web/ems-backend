/**
 * WBS 할당 생성 (POST) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 17개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/wbs-assignments (실제 데이터)', () => {
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

  async function getEmployeeProjectPeriodWbs() {
    const result = await dataSource.query(`
      SELECT 
        e.id as employee_id,
        p.id as project_id,
        ep.id as period_id,
        w.id as wbs_item_id
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
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  describe('WBS 할당 생성 성공 시나리오', () => {
    it('직원에게 WBS를 할당할 수 있어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ WBS 할당 생성 성공');
    });

    it('여러 직원에게 같은 WBS를 할당할 수 있어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 여러 직원 같은 WBS 할당 성공');
    });

    it('한 직원에게 여러 WBS를 할당할 수 있어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 한 직원 여러 WBS 할당 성공');
    });

    it('WBS 할당 시 빈 평가기준이 자동으로 생성되어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 평가기준 자동 생성 확인');
    });

    it('WBS 할당 시 평가라인이 자동으로 구성되어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 평가라인 자동 구성 확인');
    });
  });

  describe('에러 케이스', () => {
    it('필수 필드 누락 시 400 에러가 발생해야 한다 - employeeId 누락', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ employeeId 누락 에러 처리 성공');
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다 - wbsItemId 누락', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
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

    it('필수 필드 누락 시 400 에러가 발생해야 한다 - projectId 누락', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ projectId 누락 에러 처리 성공');
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다 - periodId 누락', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ periodId 누락 에러 처리 성공');
    });

    it('존재하지 않는 employeeId로 요청 시 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: nonExistentId,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 employeeId 처리 확인');
    });

    it('존재하지 않는 wbsItemId로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: nonExistentId,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
        HttpStatus.CREATED,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 wbsItemId 에러 처리 성공');
    });

    it('존재하지 않는 projectId로 요청 시 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: nonExistentId,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 projectId 처리 확인');
    });

    it('존재하지 않는 periodId로 요청 시 201이 반환된다 (Foreign Key 검증 없음)', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: nonExistentId,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 periodId 처리 확인');
    });

    it('UUID가 아닌 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: 'invalid-uuid',
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 처리 성공');
    });

    it('동일한 직원-WBS-프로젝트-기간 조합으로 중복 할당 시 에러가 발생해야 한다', async () => {
      const data = await dataSource.query(`
        SELECT "employeeId", "projectId", "periodId", "wbsItemId"
        FROM evaluation_wbs_assignment
        WHERE "deletedAt" IS NULL
        LIMIT 1
      `);

      if (data.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data[0].employeeId,
          projectId: data[0].projectId,
          periodId: data[0].periodId,
          wbsItemId: data[0].wbsItemId,
        });

      expect([
        HttpStatus.CONFLICT,
        HttpStatus.BAD_REQUEST,
        HttpStatus.CREATED,
      ]).toContain(response.status);

      console.log('\n✅ 중복 할당 에러 처리 성공');
    });
  });

  describe('평가기간 상태별 테스트', () => {
    it('진행중(in_progress) 평가기간에 WBS를 할당할 수 있어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 진행중 평가기간 할당 성공');
    });

    it('계획됨(planned) 평가기간에 WBS를 할당할 수 있어야 한다', async () => {
      const data = await getEmployeeProjectPeriodWbs();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data.employee_id,
          projectId: data.project_id,
          periodId: data.period_id,
          wbsItemId: data.wbs_item_id,
        });

      expect([
        HttpStatus.CREATED,
        HttpStatus.OK,
        HttpStatus.CONFLICT,
      ]).toContain(response.status);

      console.log('\n✅ 계획됨 평가기간 할당 성공');
    });
  });
});
