import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/seed/status - 시드 데이터 상태 조회 테스트', () => {
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

  // ==================== GET /admin/seed/status ====================

  describe('성공 케이스', () => {
    it('데이터가 없을 때 hasData가 false이고 모든 카운트가 0이어야 함', async () => {
      // Given: 데이터가 없는 상태

      // When
      const response = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      // Then
      expect(response.body).toHaveProperty('hasData', false);
      expect(response.body).toHaveProperty('entityCounts');
      expect(response.body.entityCounts.Department).toBe(0);
      expect(response.body.entityCounts.Employee).toBe(0);
      expect(response.body.entityCounts.Project).toBe(0);
      expect(response.body.entityCounts.WbsItem).toBe(0);
      expect(response.body.entityCounts.EvaluationPeriod).toBe(0);
    });

    it('MINIMAL 시나리오 생성 후 올바른 상태를 반환해야 함', async () => {
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

      // When
      const response = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      // Then
      expect(response.body.hasData).toBe(true);
      expect(response.body.entityCounts.Department).toBeGreaterThan(0);
      expect(response.body.entityCounts.Employee).toBe(10);
      expect(response.body.entityCounts.Project).toBe(3);
      expect(response.body.entityCounts.WbsItem).toBeGreaterThan(0);
      expect(response.body.entityCounts.EvaluationPeriod).toBe(0); // MINIMAL은 평가기간 없음
    });

    it('WITH_PERIOD 시나리오 생성 후 평가기간이 포함되어야 함', async () => {
      // Given
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
          periodCount: 2,
        },
      };

      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // When
      const response = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      // Then
      expect(response.body.hasData).toBe(true);
      expect(response.body.entityCounts.EvaluationPeriod).toBe(2);
    });

    it('데이터 생성 전후로 상태가 변경되어야 함', async () => {
      // Given: 생성 전 상태 확인
      const beforeResponse = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(beforeResponse.body.hasData).toBe(false);

      // When: 데이터 생성
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

      // Then: 생성 후 상태 확인
      const afterResponse = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(afterResponse.body.hasData).toBe(true);
      expect(afterResponse.body.entityCounts.Employee).toBeGreaterThan(
        beforeResponse.body.entityCounts.Employee,
      );
    });

    it('삭제 후 hasData가 false로 변경되어야 함', async () => {
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

      const beforeDelete = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(beforeDelete.body.hasData).toBe(true);

      // When: 삭제
      await testSuite.request().delete('/admin/seed/clear').expect(200);

      // Then: 삭제 후 상태 확인
      const afterDelete = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      expect(afterDelete.body.hasData).toBe(false);
      expect(afterDelete.body.entityCounts.Employee).toBe(0);
    });

    it('응답 구조가 정확해야 함', async () => {
      // When
      const response = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      // Then: 필수 필드 검증
      expect(response.body).toHaveProperty('hasData');
      expect(response.body).toHaveProperty('entityCounts');
      expect(typeof response.body.hasData).toBe('boolean');
      expect(typeof response.body.entityCounts).toBe('object');

      // entityCounts 필드 검증
      const { entityCounts } = response.body;
      expect(entityCounts).toHaveProperty('Department');
      expect(entityCounts).toHaveProperty('Employee');
      expect(entityCounts).toHaveProperty('Project');
      expect(entityCounts).toHaveProperty('WbsItem');
      expect(entityCounts).toHaveProperty('EvaluationPeriod');

      // 모든 카운트가 숫자여야 함
      Object.values(entityCounts).forEach((count) => {
        expect(typeof count).toBe('number');
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('여러 번 조회해도 일관된 결과를 반환해야 함', async () => {
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

      // When: 여러 번 조회
      const response1 = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      const response2 = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      const response3 = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      // Then: 모든 응답이 동일해야 함
      expect(response1.body).toEqual(response2.body);
      expect(response2.body).toEqual(response3.body);
    });
  });
});
