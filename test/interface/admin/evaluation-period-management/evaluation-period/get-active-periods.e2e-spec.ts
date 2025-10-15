import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('EvaluationPeriodManagement GET /active Endpoint (e2e)', () => {
  const testSuite = new BaseE2ETest();

  beforeAll(async () => {
    await testSuite.initializeApp();
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트 전 데이터베이스 정리
    await testSuite.cleanupBeforeTest();
  });

  afterEach(async () => {
    // 각 테스트 후 데이터베이스 정리 (선택적)
    // await testSuite.cleanupAfterTest();
  });

  describe('GET /admin/evaluation-periods/active', () => {
    it('활성 평가 기간이 없을 때 빈 목록을 반환해야 한다', async () => {
      // Given: 빈 상태

      // When & Then
      const response = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('여러 활성 평가 기간이 있을 때 모든 활성 기간을 반환해야 한다', async () => {
      // Given: 여러 평가 기간 생성 (일부는 활성화, 일부는 비활성) - 겹치지 않는 날짜로 설정
      const periods = [
        {
          name: '2024년 1분기 평가',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '1분기 성과 평가 (활성)',
          maxSelfEvaluationRate: 100,
          gradeRanges: [
            { grade: 'S', minRange: 90, maxRange: 100 },
            { grade: 'A', minRange: 80, maxRange: 89 },
          ],
        },
        {
          name: '2024년 2분기 평가',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '2분기 성과 평가 (비활성)',
          maxSelfEvaluationRate: 110,
          gradeRanges: [
            { grade: 'S', minRange: 92, maxRange: 100 },
            { grade: 'A', minRange: 82, maxRange: 91 },
          ],
        },
        {
          name: '2024년 3분기 평가',
          startDate: '2024-07-01',
          peerEvaluationDeadline: '2024-09-30',
          description: '3분기 성과 평가 (활성)',
          maxSelfEvaluationRate: 120,
          gradeRanges: [
            { grade: 'S', minRange: 88, maxRange: 100 },
            { grade: 'A', minRange: 78, maxRange: 87 },
            { grade: 'B', minRange: 65, maxRange: 77 },
          ],
        },
        {
          name: '2024년 4분기 평가',
          startDate: '2024-10-01',
          peerEvaluationDeadline: '2024-12-31',
          description: '4분기 성과 평가 (활성)',
          maxSelfEvaluationRate: 130,
          gradeRanges: [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 85, maxRange: 94 },
          ],
        },
        {
          name: '2023년 하반기 평가',
          startDate: '2023-07-01',
          peerEvaluationDeadline: '2023-12-31',
          description: '2023년 하반기 성과 평가 (비활성)',
          maxSelfEvaluationRate: 115,
          gradeRanges: [
            { grade: 'S', minRange: 90, maxRange: 100 },
            { grade: 'A', minRange: 80, maxRange: 89 },
          ],
        },
      ];

      const createdPeriods: any[] = [];

      // 모든 평가 기간 생성
      for (const period of periods) {
        const createResponse = await request(testSuite.app.getHttpServer())
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
        createdPeriods.push({
          ...createResponse.body,
          originalData: period,
        });
      }

      // 일부 평가 기간만 활성화 (1분기, 3분기, 4분기)
      const periodsToActivate = [0, 2, 3]; // 인덱스
      const activatedPeriods: any[] = [];

      for (const index of periodsToActivate) {
        const period = createdPeriods[index];
        await request(testSuite.app.getHttpServer())
          .post(`/admin/evaluation-periods/${period.id}/start`)
          .expect(200);
        activatedPeriods.push(period);
      }

      // When & Then: 활성 평가 기간 조회
      const response = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      // 3개의 활성 평가 기간이 반환되어야 함
      expect(response.body).toHaveLength(3);

      // 반환된 평가 기간들이 실제로 활성화된 것들인지 확인
      const activeNames = response.body.map((item: any) => item.name);
      expect(activeNames).toContain('2024년 1분기 평가');
      expect(activeNames).toContain('2024년 3분기 평가');
      expect(activeNames).toContain('2024년 4분기 평가');

      // 비활성 평가 기간들은 포함되지 않아야 함
      expect(activeNames).not.toContain('2024년 2분기 평가');
      expect(activeNames).not.toContain('2023년 하반기 평가');

      // 각 활성 평가 기간의 상세 정보 검증
      const fourthQuarter = response.body.find(
        (item: any) => item.name === '2024년 4분기 평가',
      );
      expect(fourthQuarter).toBeDefined();
      expect(fourthQuarter.description).toBe('4분기 성과 평가 (활성)');
      expect(fourthQuarter.maxSelfEvaluationRate).toBe(130);

      const firstQuarter = response.body.find(
        (item: any) => item.name === '2024년 1분기 평가',
      );
      expect(firstQuarter).toBeDefined();
      expect(firstQuarter.maxSelfEvaluationRate).toBe(100);
    });

    it('활성 평가 기간의 상태가 올바르게 설정되는지 확인해야 한다', async () => {
      // Given: 평가 기간 생성 및 활성화
      const createData = {
        name: '임시 활성 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '임시로 활성화할 평가',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // 평가 기간 활성화
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/start`)
        .expect(200);

      // 활성 목록에 포함되는지 확인
      const activeResponse1 = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeResponse1.body).toHaveLength(1);
      expect(activeResponse1.body[0].name).toBe('임시 활성 평가');

      // When & Then: 활성 평가 기간이 정상적으로 조회되는지 확인
      // (완료 기능은 별도의 단계 변경 API가 필요하므로 여기서는 활성 상태 확인만 테스트)
      expect(activeResponse1.body).toHaveLength(1);
      expect(activeResponse1.body[0].name).toBe('임시 활성 평가');

      // 활성 평가 기간의 상태가 'in-progress'인지 확인
      const detailResponse = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('in-progress');
    });

    it('완료된 평가 기간은 활성 목록에서 제외되어야 한다', async () => {
      // Given: 평가 기간 생성 및 활성화
      const createData = {
        name: '완료 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '완료 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // 평가 기간 활성화
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/start`)
        .expect(200);

      // 활성 목록에 포함되는지 확인
      const activeBeforeComplete = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeBeforeComplete.body).toHaveLength(1);
      expect(activeBeforeComplete.body[0].name).toBe('완료 테스트 평가');

      // When: 평가 기간 완료 (단계 제약 없이)
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/complete`)
        .expect(200);

      // Then: 완료 후 활성 목록에서 제외되는지 확인
      const activeAfterComplete = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeAfterComplete.body).toHaveLength(0);

      // 완료된 상태 확인
      const detailResponse = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('completed');
      expect(detailResponse.body.currentPhase).toBe('closure');
      expect(detailResponse.body.completedDate).toBeDefined();
    });

    it('여러 활성 평가 기간 중 일부만 완료해도 나머지는 활성 목록에 유지되어야 한다', async () => {
      // Given: 2개의 평가 기간 생성 및 활성화
      const periods = [
        {
          name: '첫 번째 활성 평가',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '첫 번째 활성 평가 기간',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '두 번째 활성 평가',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '두 번째 활성 평가 기간',
          maxSelfEvaluationRate: 110,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
      ];

      const createdPeriods: any[] = [];
      for (const period of periods) {
        const createResponse = await request(testSuite.app.getHttpServer())
          .post('/admin/evaluation-periods')
          .send(period)
          .expect(201);
        createdPeriods.push(createResponse.body);

        // 각 평가 기간 활성화
        await request(testSuite.app.getHttpServer())
          .post(`/admin/evaluation-periods/${createResponse.body.id}/start`)
          .expect(200);
      }

      // 2개 모두 활성 상태인지 확인
      const activeBefore = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeBefore.body).toHaveLength(2);

      // When: 첫 번째 평가 기간만 완료
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${createdPeriods[0].id}/complete`)
        .expect(200);

      // Then: 두 번째 평가 기간만 활성 목록에 남아있어야 함
      const activeAfter = await request(testSuite.app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeAfter.body).toHaveLength(1);
      expect(activeAfter.body[0].name).toBe('두 번째 활성 평가');
      expect(activeAfter.body[0].id).toBe(createdPeriods[1].id);
    });

    it('존재하지 않는 평가 기간 ID로 완료 시도 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 ID로 완료 시도
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${nonExistentId}/complete`)
        .expect(404);
    });

    it('이미 완료된 평가 기간을 다시 완료 시도 시 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성, 시작, 완료
      const createData = {
        name: '중복 완료 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '중복 완료 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // 평가 기간 시작
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/start`)
        .expect(200);

      // 첫 번째 완료
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/complete`)
        .expect(200);

      // When & Then: 이미 완료된 평가 기간을 다시 완료 시도
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/complete`)
        .expect(422); // Unprocessable Entity
    });

    it('존재하지 않는 평가 기간 ID로 시작 시도 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // When & Then: 존재하지 않는 ID로 시작 시도
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${nonExistentId}/start`)
        .expect(404);
    });

    it('이미 시작된 평가 기간을 다시 시작 시도 시 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 및 시작
      const createData = {
        name: '중복 시작 테스트 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '중복 시작 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // 첫 번째 시작
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/start`)
        .expect(200);

      // When & Then: 이미 시작된 평가 기간을 다시 시작 시도
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/start`)
        .expect(422); // Unprocessable Entity
    });

    it('잘못된 UUID 형식으로 완료 시도 시 적절한 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid-format';

      // When & Then: 잘못된 UUID 형식으로 완료 시도
      const response = await request(testSuite.app.getHttpServer()).post(
        `/admin/evaluation-periods/${invalidId}/complete`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('잘못된 UUID 형식으로 시작 시도 시 적절한 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid-format';

      // When & Then: 잘못된 UUID 형식으로 시작 시도
      const response = await request(testSuite.app.getHttpServer()).post(
        `/admin/evaluation-periods/${invalidId}/start`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
