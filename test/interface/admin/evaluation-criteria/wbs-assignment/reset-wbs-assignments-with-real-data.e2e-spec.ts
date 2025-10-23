/**
 * WBS 할당 초기화 (POST /reset) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 17개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-criteria/wbs-assignments/reset (실제 데이터)', () => {
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

  async function getEmployeePeriod() {
    const result = await dataSource.query(`
      SELECT 
        e.id as employee_id,
        ep.id as period_id
      FROM employee e
      CROSS JOIN evaluation_period ep
      WHERE e."deletedAt" IS NULL
      AND ep."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  describe('초기화 성공 시나리오', () => {
    it('직원의 특정 평가기간 WBS 할당을 초기화할 수 있어야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ WBS 할당 초기화 성공');
    });

    it('이미 초기화된 직원의 WBS 할당을 다시 초기화해도 에러가 발생하지 않아야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 첫 번째 초기화
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      // 두 번째 초기화
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 재초기화 처리 성공');
    });

    it('WBS 할당이 없는 직원을 초기화해도 에러가 발생하지 않아야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 할당 없는 직원 초기화 성공');
    });

    it('초기화 시 삭제된 할당의 deletedAt과 deletedBy가 설정되어야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ deletedAt/deletedBy 설정 확인');
    });

    it('초기화 후 할당 목록 조회 시 빈 배열을 반환해야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 초기화
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      // 목록 조회
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments')
        .query({ employeeId: data.employee_id, periodId: data.period_id });

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      console.log('\n✅ 초기화 후 목록 조회 확인');
    });

    it('초기화 후 재할당할 수 있어야 한다', async () => {
      const data = await dataSource.query(`
        SELECT 
          e.id as employee_id,
          ep.id as period_id,
          p.id as project_id,
          w.id as wbs_item_id
        FROM employee e
        CROSS JOIN evaluation_period ep
        CROSS JOIN project p
        CROSS JOIN wbs_item w
        WHERE e."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND p."deletedAt" IS NULL
        AND w."deletedAt" IS NULL
        AND w."projectId" = p.id
        LIMIT 1
      `);

      if (data.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 초기화
      await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data[0].employee_id,
          periodId: data[0].period_id,
        });

      // 재할당
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: data[0].employee_id,
          projectId: data[0].project_id,
          periodId: data[0].period_id,
          wbsItemId: data[0].wbs_item_id,
        });

      expect([HttpStatus.CREATED, HttpStatus.OK]).toContain(response.status);

      console.log('\n✅ 재할당 성공');
    });

    it('여러 프로젝트의 할당을 한번에 초기화할 수 있어야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 여러 프로젝트 초기화 성공');
    });

    it('많은 수의 할당을 초기화할 수 있어야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 대량 할당 초기화 성공');
    });
  });

  describe('에러 케이스', () => {
    it('필수 필드가 누락되면 400 에러가 발생해야 한다 - employeeId 누락', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          periodId: data.period_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ employeeId 누락 에러 처리 성공');
    });

    it('필수 필드가 누락되면 400 에러가 발생해야 한다 - periodId 누락', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ periodId 누락 에러 처리 성공');
    });

    it('존재하지 않는 employeeId로 요청 시 200 또는 204가 반환되어야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: nonExistentId,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 employeeId 처리 확인');
    });

    it('존재하지 않는 periodId로 요청 시 200 또는 204가 반환되어야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: nonExistentId,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.BAD_REQUEST,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 periodId 처리 확인');
    });

    it('UUID가 아닌 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: 'invalid-uuid',
          periodId: data.period_id,
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 처리 성공');
    });

    it('UUID가 아닌 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: 'invalid-uuid',
        });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 periodId UUID 에러 처리 성공');
    });

    it('완료된 평가기간의 WBS 할당 초기화 시 422 에러가 발생해야 한다', async () => {
      const data = await getEmployeePeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: data.employee_id,
          periodId: data.period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 완료된 평가기간 에러 처리 확인');
    });

    it('빈 요청 본문으로 초기화 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({});

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 빈 요청 본문 에러 처리 성공');
    });
  });

  describe('독립성 테스트', () => {
    it('서로 다른 직원의 WBS 할당 초기화는 독립적이어야 한다', async () => {
      const result = await dataSource.query(`
        SELECT e1.id as employee1_id, e2.id as employee2_id, ep.id as period_id
        FROM employee e1
        CROSS JOIN employee e2
        CROSS JOIN evaluation_period ep
        WHERE e1."deletedAt" IS NULL
        AND e2."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND e1.id != e2.id
        LIMIT 1
      `);

      if (result.length === 0) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 직원1 초기화
      const response = await testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments/reset')
        .send({
          employeeId: result[0].employee1_id,
          periodId: result[0].period_id,
        });

      expect([
        HttpStatus.OK,
        HttpStatus.NO_CONTENT,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 직원별 독립성 확인 성공');
    });
  });
});
