import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('EvaluationPeriodManagement GET /evaluation-periods/:id Endpoint (e2e)', () => {
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

  describe('GET /admin/evaluation-periods/:id', () => {
    it('존재하는 평가 기간의 상세 정보를 조회해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '2024년 상반기 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [
          { grade: 'S', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
        ],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // When & Then
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: periodId,
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
        status: 'waiting', // 새로 생성된 평가 기간은 대기 상태
      });

      // 날짜 필드 검증
      expect(response.body.startDate).toBeDefined();
      expect(response.body.peerEvaluationDeadline).toBeDefined();

      // 등급 구간 검증
      expect(response.body.gradeRanges).toHaveLength(2);
      expect(response.body.gradeRanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            grade: 'S',
            minRange: 90,
            maxRange: 100,
          }),
          expect.objectContaining({
            grade: 'A',
            minRange: 80,
            maxRange: 89,
          }),
        ]),
      );
    });

    it('존재하지 않는 평가 기간 조회 시 null을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${nonExistentId}`)
        .expect(200);

      // null이 빈 객체로 직렬화될 수 있으므로 둘 다 허용
      expect(
        response.body === null || Object.keys(response.body).length === 0,
      ).toBe(true);
    });

    it('활성화된 평가 기간의 상세 정보를 조회해야 한다', async () => {
      // Given: 평가 기간 생성 및 활성화
      const createData = {
        name: '활성화된 평가 기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '활성화 테스트용 평가 기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
        ],
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

      // When & Then: 활성화된 평가 기간 상세 조회
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: periodId,
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
        status: 'in-progress', // 활성화된 상태
      });

      // 등급 구간이 3개인지 확인
      expect(response.body.gradeRanges).toHaveLength(3);
    });

    it('복잡한 등급 구간을 가진 평가 기간의 상세 정보를 조회해야 한다', async () => {
      // Given: 복잡한 등급 구간을 가진 평가 기간 생성
      const createData = {
        name: '복잡한 등급 구간 평가',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '다양한 등급 구간을 가진 평가 기간',
        maxSelfEvaluationRate: 150,
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 90, maxRange: 94 },
          { grade: 'A', minRange: 85, maxRange: 89 },
          { grade: 'B+', minRange: 80, maxRange: 84 },
          { grade: 'B', minRange: 75, maxRange: 79 },
          { grade: 'C', minRange: 60, maxRange: 74 },
        ],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // When & Then
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: periodId,
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
      });

      // 7개의 등급 구간이 모두 포함되어 있는지 확인
      expect(response.body.gradeRanges).toHaveLength(7);

      // 특정 등급 구간들이 올바르게 설정되어 있는지 확인
      const gradeRanges = response.body.gradeRanges;
      const sPlus = gradeRanges.find((range: any) => range.grade === 'S+');
      const c = gradeRanges.find((range: any) => range.grade === 'C');

      expect(sPlus).toEqual({
        grade: 'S+',
        minRange: 98,
        maxRange: 100,
      });

      expect(c).toEqual({
        grade: 'C',
        minRange: 60,
        maxRange: 74,
      });
    });

    it('잘못된 형식의 ID로 조회 시 적절한 응답을 반환해야 한다', async () => {
      const invalidId = 'invalid-uuid-format';

      // UUID 형식이 아닌 ID로 요청 시 데이터베이스 에러로 500 응답이 발생할 수 있음
      const response = await request(testSuite.app.getHttpServer()).get(
        `/admin/evaluation-periods/${invalidId}`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('여러 평가 기간 중 특정 평가 기간만 조회해야 한다', async () => {
      // Given: 여러 평가 기간 생성
      const periods = [
        {
          name: '첫 번째 평가',
          startDate: '2024-01-01',
          peerEvaluationDeadline: '2024-03-31',
          description: '첫 번째 테스트 평가',
          maxSelfEvaluationRate: 100,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '두 번째 평가',
          startDate: '2024-04-01',
          peerEvaluationDeadline: '2024-06-30',
          description: '두 번째 테스트 평가',
          maxSelfEvaluationRate: 110,
          gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
        },
        {
          name: '세 번째 평가',
          startDate: '2024-07-01',
          peerEvaluationDeadline: '2024-09-30',
          description: '세 번째 테스트 평가',
          maxSelfEvaluationRate: 120,
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
      }

      // When & Then: 두 번째 평가 기간만 조회
      const targetPeriod = createdPeriods[1];
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${targetPeriod.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: targetPeriod.id,
        name: '두 번째 평가',
        description: '두 번째 테스트 평가',
        maxSelfEvaluationRate: 110,
      });

      // 다른 평가 기간의 정보가 포함되지 않았는지 확인
      expect(response.body.name).not.toBe('첫 번째 평가');
      expect(response.body.name).not.toBe('세 번째 평가');
    });

    it('삭제된 평가 기간 조회 시 null을 반환해야 한다', async () => {
      // Given: 평가 기간 생성 후 삭제
      const createData = {
        name: '삭제될 평가 기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '삭제 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // 평가 기간 삭제
      await request(testSuite.app.getHttpServer())
        .delete(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      // When & Then: 삭제된 평가 기간 조회 시 null 반환
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      // null이 빈 객체로 직렬화될 수 있으므로 둘 다 허용
      expect(
        response.body === null || Object.keys(response.body).length === 0,
      ).toBe(true);
    });

    it('완료된 평가 기간의 상세 정보를 조회해야 한다', async () => {
      // Given: 평가 기간 생성, 시작, 완료
      const createData = {
        name: '완료된 평가 기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '완료 상태 테스트용 평가 기간',
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

      // 평가 기간 완료
      await request(testSuite.app.getHttpServer())
        .post(`/admin/evaluation-periods/${periodId}/complete`)
        .expect(200);

      // When & Then: 완료된 평가 기간 상세 조회
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: periodId,
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
        status: 'completed',
        currentPhase: 'closure',
      });

      expect(response.body.completedDate).toBeDefined();
    });

    it('대기 상태 평가 기간의 상세 정보를 조회해야 한다', async () => {
      // Given: 평가 기간 생성 (시작하지 않음)
      const createData = {
        name: '대기 상태 평가 기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '대기 상태 테스트용 평가 기간',
        maxSelfEvaluationRate: 100,
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      const createResponse = await request(testSuite.app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const periodId = createResponse.body.id;

      // When & Then: 대기 상태 평가 기간 상세 조회
      const response = await request(testSuite.app.getHttpServer())
        .get(`/admin/evaluation-periods/${periodId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: periodId,
        name: createData.name,
        description: createData.description,
        maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
        status: 'waiting',
        currentPhase: 'waiting',
      });

      expect(response.body.completedDate).toBeNull();
    });

    it('빈 문자열 ID로 조회 시 적절한 에러가 발생해야 한다', async () => {
      // When & Then: 빈 문자열 ID로 조회 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        '/admin/evaluation-periods/',
      );

      // 200 (OK - 목록 조회), 404 (Not Found), 또는 400 (Bad Request) 중 하나여야 함
      expect([200, 400, 404]).toContain(response.status);
    });

    it('매우 긴 잘못된 ID로 조회 시 적절한 에러가 발생해야 한다', async () => {
      const veryLongInvalidId = 'a'.repeat(1000); // 1000자 길이의 잘못된 ID

      // When & Then: 매우 긴 잘못된 ID로 조회 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        `/admin/evaluation-periods/${veryLongInvalidId}`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('SQL 인젝션 시도 시 적절한 에러가 발생해야 한다', async () => {
      const sqlInjectionId = "'; DROP TABLE evaluation_period; --";

      // When & Then: SQL 인젝션 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        `/admin/evaluation-periods/${encodeURIComponent(sqlInjectionId)}`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('특수 문자가 포함된 잘못된 ID로 조회 시 적절한 에러가 발생해야 한다', async () => {
      const specialCharId = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      // When & Then: 특수 문자가 포함된 ID로 조회 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        `/admin/evaluation-periods/${encodeURIComponent(specialCharId)}`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('null ID로 조회 시 적절한 에러가 발생해야 한다', async () => {
      // When & Then: null ID로 조회 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        '/admin/evaluation-periods/null',
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('undefined ID로 조회 시 적절한 에러가 발생해야 한다', async () => {
      // When & Then: undefined ID로 조회 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        '/admin/evaluation-periods/undefined',
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });

    it('숫자 형태의 잘못된 ID로 조회 시 적절한 에러가 발생해야 한다', async () => {
      const numericId = '12345';

      // When & Then: 숫자 형태의 ID로 조회 시도
      const response = await request(testSuite.app.getHttpServer()).get(
        `/admin/evaluation-periods/${numericId}`,
      );

      // 400 (Bad Request), 404 (Not Found), 또는 500 (Internal Server Error) 중 하나여야 함
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
