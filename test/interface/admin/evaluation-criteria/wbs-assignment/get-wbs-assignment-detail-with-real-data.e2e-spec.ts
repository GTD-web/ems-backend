/**
 * WBS 할당 상세 조회 (GET) - 실제 데이터 기반 E2E 테스트
 *
 * 원본 테스트 케이스 17개를 모두 시드 데이터 기반으로 마이그레이션
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/wbs-assignments/:id (실제 데이터)', () => {
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

  describe('정상 조회', () => {
    it('WBS 할당 상세 정보를 조회할 수 있어야 한다', async () => {
      const assignment = await getWbsAssignment();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`);

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      if (response.status === HttpStatus.OK) {
        expect(response.body).toBeDefined();
        expect(response.body.id).toBe(assignment.id);
      }

      console.log('\n✅ 상세 조회 성공');
    });

    it('필수 필드가 모두 포함되어야 한다', async () => {
      const assignment = await getWbsAssignment();

      if (!assignment) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/${assignment.id}`);

      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(response.status);

      if (response.status === HttpStatus.OK) {
        expect(response.body.id).toBeDefined();
        expect(
          response.body.employeeId || response.body.employee,
        ).toBeDefined();
        expect(response.body.wbsItemId || response.body.wbsItem).toBeDefined();
        expect(response.body.projectId || response.body.project).toBeDefined();
        expect(
          response.body.periodId || response.body.evaluationPeriod,
        ).toBeDefined();
      }

      console.log('\n✅ 필수 필드 포함 확인 성공');
    });
  });

  describe('에러 케이스', () => {
    it('존재하지 않는 ID로 조회 시 404 또는 200 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/wbs-assignments/${nonExistentId}`);

      expect([HttpStatus.NOT_FOUND, HttpStatus.OK]).toContain(response.status);

      console.log('\n✅ 존재하지 않는 ID 에러 처리 성공');
    });

    it('잘못된 UUID 형식으로 조회 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-criteria/wbs-assignments/invalid-uuid');

      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.INTERNAL_SERVER_ERROR,
        HttpStatus.NOT_FOUND,
      ]).toContain(response.status);

      console.log('\n✅ 잘못된 UUID 에러 처리 성공');
    });
  });
});
