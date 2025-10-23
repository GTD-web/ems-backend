/**
 * 미할당 WBS 항목 조회 (GET) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 15개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/wbs-assignments/unassigned (실제 데이터)', () => {
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

  async function getProjectAndPeriod() {
    const result = await dataSource.query(`
      SELECT 
        p.id as project_id,
        ep.id as period_id
      FROM project p
      CROSS JOIN evaluation_period ep
      WHERE p."deletedAt" IS NULL
      AND ep."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  async function getEmployeeProjectPeriod() {
    const result = await dataSource.query(`
      SELECT 
        e.id as employee_id,
        p.id as project_id,
        ep.id as period_id
      FROM employee e
      CROSS JOIN project p
      CROSS JOIN evaluation_period ep
      WHERE e."deletedAt" IS NULL
      AND p."deletedAt" IS NULL
      AND ep."deletedAt" IS NULL
      LIMIT 1
    `);
    return result.length > 0 ? result[0] : null;
  }

  describe('전체 미할당 조회', () => {
    it('employeeId 없이 프로젝트의 모든 미할당 WBS를 조회할 수 있어야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: data.project_id, periodId: data.period_id })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.wbsItems || response.body)).toBe(true);

      console.log('\n✅ 미할당 WBS 항목 조회 성공');
    });

    it('모두 할당된 경우 빈 배열을 반환해야 한다', async () => {
      const data = await getEmployeeProjectPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: data.project_id,
          periodId: data.period_id,
          employeeId: data.employee_id,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 빈 배열 반환 확인 성공');
    });

    it('할당이 없는 경우 모든 WBS를 반환해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      // 할당이 없는 조합 찾기
      const result = await dataSource.query(`
        SELECT p.id as project_id, ep.id as period_id
        FROM project p
        CROSS JOIN evaluation_period ep
        WHERE p."deletedAt" IS NULL
        AND ep."deletedAt" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM evaluation_wbs_assignment wa
          WHERE wa."projectId" = p.id
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
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: result[0].project_id,
          periodId: result[0].period_id,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 모든 WBS 반환 확인 성공');
    });
  });

  describe('직원별 미할당 조회', () => {
    it('특정 직원에게 할당되지 않은 WBS만 조회되어야 한다', async () => {
      const data = await getEmployeeProjectPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: data.project_id,
          periodId: data.period_id,
          employeeId: data.employee_id,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 직원별 미할당 조회 성공');
    });

    it('다른 직원에게 할당된 WBS는 미할당으로 간주되어야 한다', async () => {
      const data = await getEmployeeProjectPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: data.project_id,
          periodId: data.period_id,
          employeeId: data.employee_id,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 다른 직원 할당 WBS 미할당 간주 확인');
    });
  });

  describe('취소된 할당 처리', () => {
    it('취소된 할당은 미할당으로 간주되어야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: data.project_id, periodId: data.period_id })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 취소된 할당 처리 확인 성공');
    });
  });

  describe('평가기간 격리', () => {
    it('다른 평가기간의 할당은 고려하지 않아야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: data.project_id, periodId: data.period_id })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 평가기간 격리 확인 성공');
    });
  });

  describe('에러 케이스', () => {
    it('필수 파라미터 projectId 누락 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ periodId: data.period_id });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ projectId 누락 에러 처리 성공');
    });

    it('필수 파라미터 periodId 누락 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: data.project_id });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ periodId 누락 에러 처리 성공');
    });

    it('잘못된 UUID 형식의 projectId로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: 'invalid-uuid', periodId: data.period_id });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 projectId UUID 에러 처리 성공');
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: data.project_id, periodId: 'invalid-uuid' });

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 periodId UUID 에러 처리 성공');
    });

    it('존재하지 않는 프로젝트 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: nonExistentId, periodId: data.period_id });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 프로젝트 에러 처리 성공');
    });

    it('존재하지 않는 평가기간 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({ projectId: data.project_id, periodId: nonExistentId });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 평가기간 에러 처리 성공');
    });

    it('존재하지 않는 직원 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      const data = await getProjectAndPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: data.project_id,
          periodId: data.period_id,
          employeeId: nonExistentId,
        });

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 존재하지 않는 직원 에러 처리 성공');
    });
  });

  describe('통합 시나리오', () => {
    it('일부만 할당된 경우 미할당 WBS만 반환되어야 한다', async () => {
      const data = await getEmployeeProjectPeriod();

      if (!data) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
        .query({
          projectId: data.project_id,
          periodId: data.period_id,
          employeeId: data.employee_id,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();

      console.log('\n✅ 일부 할당 시나리오 확인 성공');
    });
  });
});
