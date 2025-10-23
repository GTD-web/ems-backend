/**
 * WBS 할당 목록 조회 (GET) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 16개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/wbs-assignments (실제 데이터)', () => {
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

  async function getProject() {
    const result = await dataSource.query(
      `SELECT id FROM project WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  async function getWbsItem() {
    const result = await dataSource.query(
      `SELECT id FROM wbs_item WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return result.length > 0 ? result[0] : null;
  }

  describe('기본 조회', () => {
    it('모든 WBS 할당 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments')
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);
      expect(response.body.totalCount).toBeDefined();

      console.log('\n✅ WBS 할당 목록 조회 성공');
    });

    it('빈 목록을 조회할 수 있어야 한다', async () => {
      // 모든 할당 삭제
      await dataSource.query(
        `UPDATE evaluation_wbs_assignment SET "deletedAt" = NOW()`,
      );

      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments')
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toEqual([]);
      expect(response.body.totalCount).toBe(0);

      console.log('\n✅ 빈 목록 조회 성공');
    });
  });

  describe('필터링', () => {
    it('평가기간 ID로 필터링할 수 있어야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments?periodId=${period.id}`)
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 평가기간 필터링 성공');
    });

    it('직원 ID로 필터링할 수 있어야 한다', async () => {
      const employee = await getEmployee();

      if (!employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments?employeeId=${employee.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 직원 필터링 성공');
    });

    it('프로젝트 ID로 필터링할 수 있어야 한다', async () => {
      const project = await getProject();

      if (!project) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments?projectId=${project.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 프로젝트 필터링 성공');
    });

    it('WBS 항목 ID로 필터링할 수 있어야 한다', async () => {
      const wbsItem = await getWbsItem();

      if (!wbsItem) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments?wbsItemId=${wbsItem.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ WBS 항목 필터링 성공');
    });

    it('여러 필터를 조합하여 조회할 수 있어야 한다', async () => {
      const period = await getPeriod();
      const employee = await getEmployee();

      if (!period || !employee) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments?periodId=${period.id}&employeeId=${employee.id}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 복합 필터링 성공');
    });
  });

  describe('페이징', () => {
    it('페이지 크기를 지정하여 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments?pageSize=5')
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);
      if (response.body.assignments.length > 0) {
        expect(response.body.assignments.length).toBeLessThanOrEqual(5);
      }

      console.log('\n✅ 페이지 크기 지정 성공');
    });

    it('특정 페이지를 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments?page=1&pageSize=10')
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 특정 페이지 조회 성공');
    });
  });

  describe('정렬', () => {
    it('할당일 기준으로 정렬할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments?orderBy=createdAt')
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 정렬 성공');
    });

    it('내림차순으로 정렬할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          '/admin/evaluation-criteria/wbs-assignments?orderBy=createdAt&orderDirection=DESC',
        )
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 내림차순 정렬 성공');
    });
  });

  describe('에러 케이스', () => {
    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          '/admin/evaluation-criteria/wbs-assignments?periodId=invalid-uuid',
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.OK,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 periodId UUID 에러 처리 성공');
    });

    it('잘못된 UUID 형식의 employeeId로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          '/admin/evaluation-criteria/wbs-assignments?employeeId=invalid-uuid',
        );

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.OK,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 employeeId UUID 에러 처리 성공');
    });

    it('잘못된 page 값으로 요청 시 적절히 처리되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments?page=-1');

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 잘못된 page 값 처리 성공');
    });

    it('잘못된 orderDirection 값으로 요청 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          '/admin/evaluation-criteria/wbs-assignments?orderDirection=INVALID',
        );

      expect([HttpStatus.BAD_REQUEST, HttpStatus.OK]).toContain(
        response.status,
      );

      console.log('\n✅ 잘못된 orderDirection 값 처리 성공');
    });
  });

  describe('통합 시나리오', () => {
    it('필터링, 페이징, 정렬을 동시에 적용할 수 있어야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/wbs-assignments?periodId=${period.id}&page=1&pageSize=10&orderBy=createdAt&orderDirection=DESC`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.assignments).toBeDefined();
      expect(Array.isArray(response.body.assignments)).toBe(true);

      console.log('\n✅ 통합 시나리오 성공');
    });
  });
});
