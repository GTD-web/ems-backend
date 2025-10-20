import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('DELETE /admin/seed/clear - 시드 데이터 삭제 테스트', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    await testSuite.cleanupAfterTest();
  });

  // ==================== DELETE /admin/seed/clear ====================

  describe('성공 케이스', () => {
    it('시드 데이터를 생성한 후 삭제할 수 있어야 함', async () => {
      // Given: 시드 데이터 생성
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // 생성 확인
      const statusBeforeDelete = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(statusBeforeDelete.body.hasData).toBe(true);
      expect(statusBeforeDelete.body.entityCounts.Employee).toBeGreaterThan(0);

      // When: 시드 데이터 삭제
      const response = await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect(200);

      // Then: 삭제 성공 메시지
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('삭제');

      // 삭제 확인
      const statusAfterDelete = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(statusAfterDelete.body.entityCounts.Department).toBe(0);
      expect(statusAfterDelete.body.entityCounts.Employee).toBe(0);
      expect(statusAfterDelete.body.entityCounts.Project).toBe(0);
      expect(statusAfterDelete.body.entityCounts.WbsItem).toBe(0);
    });

    it('WITH_PERIOD 시나리오의 데이터를 삭제할 수 있어야 함', async () => {
      // Given: 평가기간 포함 데이터 생성
      const config = {
        scenario: 'with_period',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 1,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When: 삭제
      const response = await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect(200);

      // Then: 모든 데이터 삭제 확인
      const statusAfterDelete = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(statusAfterDelete.body.entityCounts.EvaluationPeriod).toBe(0);
      expect(statusAfterDelete.body.entityCounts.Employee).toBe(0);
    });

    it('WITH_ASSIGNMENTS 시나리오의 데이터를 삭제할 수 있어야 함', async () => {
      // Given: 할당 포함 데이터 생성
      const config = {
        scenario: 'with_assignments',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
        evaluationConfig: {
          periodCount: 1,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When: 삭제
      await testSuite.request().delete('/admin/seed/clear').expect(200);

      // Then: 모든 데이터 삭제 확인
      const statusAfterDelete = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(statusAfterDelete.body.hasData).toBe(false);
    });

    it('데이터가 없을 때도 삭제 요청이 성공해야 함', async () => {
      // Given: 데이터가 없는 상태

      // When: 삭제 요청
      const response = await testSuite
        .request()
        .delete('/admin/seed/clear')
        .expect(200);

      // Then: 성공 메시지 반환
      expect(response.body).toHaveProperty('message');
    });

    it('여러 번 삭제 요청해도 에러가 발생하지 않아야 함', async () => {
      // Given: 데이터 생성
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 3,
          employeeCount: 5,
          projectCount: 2,
          wbsPerProject: 3,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When: 여러 번 삭제
      await testSuite.request().delete('/admin/seed/clear').expect(200);

      await testSuite.request().delete('/admin/seed/clear').expect(200);

      await testSuite.request().delete('/admin/seed/clear').expect(200);

      // Then: 데이터가 없는 상태 확인
      const status = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(status.body.entityCounts.Employee).toBe(0);
    });
  });
});
