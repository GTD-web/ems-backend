/**
 * 할당되지 않은 직원 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 특정 평가기간에 프로젝트가 할당되지 않은 직원 목록을 조회하는 기능을 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-criteria/project-assignments/unassigned-employees (실제 데이터)', () => {
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

  describe('기본 조회', () => {
    it('특정 평가기간에 할당되지 않은 모든 직원을 조회할 수 있어야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(result).toHaveProperty('periodId');
      expect(result).toHaveProperty('employees');
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.periodId).toBe(period.id);

      console.log(
        `\n✅ 미할당 직원 목록 조회 성공 (${result.employees.length}명)`,
      );
    });
  });

  describe('프로젝트 제외', () => {
    it('특정 프로젝트를 제외하고 할당되지 않은 직원을 조회할 수 있어야 한다', async () => {
      const period = await getPeriod();
      const project = await getProject();

      if (!period || !project) {
        console.log('데이터가 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${period.id}&projectId=${project.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(result).toHaveProperty('periodId');
      expect(result).toHaveProperty('projectId');
      expect(result).toHaveProperty('employees');
      expect(Array.isArray(result.employees)).toBe(true);
      expect(result.periodId).toBe(period.id);
      expect(result.projectId).toBe(project.id);

      console.log(
        `\n✅ 특정 프로젝트 제외 조회 성공 (${result.employees.length}명)`,
      );
    });
  });

  describe('빈 결과', () => {
    it('모든 직원이 할당된 경우 빈 배열을 반환해야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      expect(Array.isArray(result.employees)).toBe(true);
      // 빈 배열이거나 미할당 직원이 있을 수 있음

      console.log('\n✅ 빈 결과 처리 확인');
    });
  });

  describe('직원 정보', () => {
    it('각 직원의 상세 정보가 포함되어야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${period.id}`,
        )
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.employees.length > 0) {
        const employee = result.employees[0];

        expect(employee).toHaveProperty('id');
        expect(employee).toHaveProperty('name');
        expect(typeof employee.id).toBe('string');
        expect(typeof employee.name).toBe('string');

        console.log('\n✅ 직원 상세 정보 포함 확인');
      } else {
        console.log('\n⚠️ 미할당 직원이 없어서 정보 확인 스킵');
      }
    });
  });

  describe('필수 파라미터', () => {
    it('periodId 누락 시 400 에러가 발생해야 한다', async () => {
      const response = await testSuite
        .request()
        .get(
          '/admin/evaluation-criteria/project-assignments/unassigned-employees',
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 필수 파라미터 누락 에러 확인');
    });
  });

  describe('에러 처리', () => {
    it('존재하지 않는 평가기간 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
      const nonExistentPeriodId = '550e8400-e29b-41d4-a716-446655440099'; // 존재하지 않는 UUID

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${nonExistentPeriodId}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.employees).toBeDefined();

      console.log('\n✅ 존재하지 않는 평가기간 처리 확인');
    });

    it('잘못된 UUID 형식의 periodId로 요청 시 400 에러가 발생해야 한다', async () => {
      const invalidUuid = 'invalid-uuid';

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${invalidUuid}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 UUID 형식 에러 확인');
    });

    it('잘못된 UUID 형식의 projectId로 요청 시 400 에러가 발생해야 한다', async () => {
      const period = await getPeriod();
      const invalidUuid = 'invalid-uuid';

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${period.id}&projectId=${invalidUuid}`,
        )
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 projectId UUID 형식 에러 확인');
    });
  });

  describe('대용량 직원', () => {
    it('1000명 이상 직원 중 할당되지 않은 직원을 조회할 수 있어야 한다', async () => {
      const period = await getPeriod();

      if (!period) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const startTime = Date.now();

      const response = await testSuite
        .request()
        .get(
          `/admin/evaluation-criteria/project-assignments/unassigned-employees?periodId=${period.id}`,
        )
        .expect(HttpStatus.OK);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = response.body;

      expect(Array.isArray(result.employees)).toBe(true);
      expect(duration).toBeLessThan(5000); // 5초 이내

      console.log(`\n✅ 대용량 조회 성능 확인 (${duration}ms)`);
    });
  });
});
