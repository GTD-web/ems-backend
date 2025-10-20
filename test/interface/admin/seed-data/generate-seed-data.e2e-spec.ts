import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/seed/generate - 시드 데이터 생성 테스트', () => {
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

  // ==================== POST /admin/seed/generate ====================

  describe('성공 케이스', () => {
    it('MINIMAL 시나리오로 조직 데이터만 생성해야 함', async () => {
      // Given
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

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalDuration');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBeGreaterThan(0);

      // Phase1 결과 검증
      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      expect(phase1Result).toBeDefined();
      expect(phase1Result.entityCounts).toHaveProperty('Department');
      expect(phase1Result.entityCounts).toHaveProperty('Employee');
      expect(phase1Result.entityCounts).toHaveProperty('Project');
      expect(phase1Result.entityCounts).toHaveProperty('WbsItem');
      expect(phase1Result.entityCounts.Department).toBeGreaterThan(0);
      expect(phase1Result.entityCounts.Employee).toBe(10);
    });

    it('WITH_PERIOD 시나리오로 조직 데이터 + 평가기간을 생성해야 함', async () => {
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
          periodCount: 1,
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBeGreaterThanOrEqual(2);

      // Phase1 & Phase2 결과 검증
      const phase1Result = response.body.results.find(
        (r: any) => r.phase === 'Phase1',
      );
      const phase2Result = response.body.results.find(
        (r: any) => r.phase === 'Phase2',
      );

      expect(phase1Result).toBeDefined();
      expect(phase2Result).toBeDefined();
      expect(phase2Result.entityCounts).toHaveProperty('EvaluationPeriod');
      expect(phase2Result.entityCounts).toHaveProperty(
        'EvaluationPeriodEmployeeMapping',
      );
      expect(phase2Result.entityCounts.EvaluationPeriod).toBe(1);
    });

    it('WITH_ASSIGNMENTS 시나리오로 할당까지 생성해야 함', async () => {
      // Given
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

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.results.length).toBeGreaterThanOrEqual(3);

      // Phase3-8 결과 검증
      const phase38Result = response.body.results.find(
        (r: any) => r.phase === 'Phase3-8',
      );

      expect(phase38Result).toBeDefined();
      expect(phase38Result.entityCounts).toHaveProperty(
        'EvaluationProjectAssignment',
      );
      expect(phase38Result.entityCounts).toHaveProperty(
        'EvaluationWbsAssignment',
      );
    });

    it('clearExisting이 false일 때 기존 데이터를 유지해야 함', async () => {
      // Given: 첫 번째 시드 데이터 생성
      const firstConfig = {
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
        .send(firstConfig)
        .expect(201);

      // When: clearExisting: false로 추가 생성
      const secondConfig = {
        scenario: 'minimal',
        clearExisting: false,
        dataScale: {
          departmentCount: 2,
          employeeCount: 3,
          projectCount: 1,
          wbsPerProject: 2,
        },
      };

      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(secondConfig)
        .expect(201);

      // Then: 데이터가 추가되어야 함
      expect(response.body.success).toBe(true);

      // 상태 조회로 확인
      const statusResponse = await testSuite
        .request()
        .get('/admin/seed/status')
        .expect(200);

      // 첫 번째(5개) + 두 번째(3개) = 최소 8개 이상
      expect(statusResponse.body.entityCounts.Employee).toBeGreaterThanOrEqual(
        8,
      );
    });

    it('stateDistribution을 커스텀하여 생성할 수 있어야 함', async () => {
      // Given: 커스텀 상태 분포 설정
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 20,
          projectCount: 3,
          wbsPerProject: 5,
        },
        stateDistribution: {
          employeeStatus: {
            active: 0.7,
            onLeave: 0.2,
            resigned: 0.1,
          },
          projectStatus: {
            active: 0.5,
            completed: 0.3,
            cancelled: 0.2,
          },
        },
      };

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.success).toBe(true);
      expect(response.body.results[0].entityCounts.Employee).toBe(20);
    });

    it('생성 시간(duration)이 포함되어야 함', async () => {
      // Given
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

      // When
      const response = await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(201);

      // Then
      expect(response.body.totalDuration).toBeGreaterThan(0);
      response.body.results.forEach((result: any) => {
        expect(result.duration).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('실패 케이스', () => {
    it('scenario가 누락되면 400 에러를 반환해야 함', async () => {
      // Given
      const config = {
        // scenario 누락
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(400);
    });

    it('dataScale이 누락되면 400 에러를 반환해야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        // dataScale 누락
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(400);
    });

    it('잘못된 scenario 값이면 400 에러를 반환해야 함', async () => {
      // Given
      const config = {
        scenario: 'invalid_scenario',
        clearExisting: true,
        dataScale: {
          departmentCount: 5,
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(400);
    });

    it('dataScale의 값이 0 이하면 400 에러를 반환해야 함', async () => {
      // Given
      const config = {
        scenario: 'minimal',
        clearExisting: true,
        dataScale: {
          departmentCount: 0, // 0은 허용되지 않음
          employeeCount: 10,
          projectCount: 3,
          wbsPerProject: 5,
        },
      };

      // When & Then
      await testSuite
        .request()
        .post('/admin/seed/generate')
        .send(config)
        .expect(400);
    });

    it('body가 없으면 400 에러를 반환해야 함', async () => {
      // When & Then
      await testSuite.request().post('/admin/seed/generate').expect(400);
    });
  });
});
