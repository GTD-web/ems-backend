import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /admin/evaluation-periods/:id/peer-evaluation-deadline', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    await testSuite.cleanupBeforeTest();
  });

  // ==================== 성공 케이스 ====================

  describe('성공 케이스', () => {
    it('하향/동료평가 단계 마감일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '하향/동료평가 마감일 수정 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '하향/동료평가 마감일 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 하향/동료평가 단계 마감일 수정
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(evaluationPeriodId);
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
    });

    it('다양한 날짜 형식으로 하향/동료평가 마감일을 수정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '다양한 날짜 형식 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '다양한 날짜 형식 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 다양한 날짜 형식으로 수정
      const testCases = [
        { input: '2024-10-15', expected: '2024-10-15T00:00:00.000Z' },
        { input: '2024-11-01', expected: '2024-11-01T00:00:00.000Z' },
        { input: '2024-12-15', expected: '2024-12-15T00:00:00.000Z' },
      ];

      for (const testCase of testCases) {
        const updateData = {
          peerEvaluationDeadline: testCase.input,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(updateData)
          .expect(200);

        expect(response.body.peerEvaluationDeadline).toBe(testCase.expected);
      }
    });

    it('윤년 날짜로 하향/동료평가 마감일을 수정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '윤년 날짜 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '윤년 날짜 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 윤년 날짜로 수정
      const updateData = {
        peerEvaluationDeadline: '2024-02-29',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 윤년 날짜가 정상적으로 설정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-02-29T00:00:00.000Z',
      );
    });
  });

  // ==================== 실패 케이스 ====================

  describe('실패 케이스', () => {
    it('존재하지 않는 평가 기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 UUID
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When & Then: 404 에러 발생
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${nonExistentId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid';

      // When & Then: 400 에러 발생
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${invalidId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(400);
    });

    it('필수 필드 누락 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '필수 필드 누락 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '필수 필드 누락 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 빈 객체로 요청 시 400 에러
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send({})
        .expect(400);
    });

    it('잘못된 날짜 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '잘못된 날짜 형식 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '잘못된 날짜 형식 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 잘못된 날짜 형식들로 요청 (일부는 성공할 수 있음)
      const invalidDates = ['invalid-date', '2024-13-01', '2024-02-30'];

      for (const invalidDate of invalidDates) {
        const updateData = {
          peerEvaluationDeadline: invalidDate,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(updateData);

        // 400 에러가 발생해야 함 (잘못된 날짜 형식)
        expect(response.status).toBe(400);
      }
    });

    it('잘못된 데이터 타입으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '잘못된 데이터 타입 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '잘못된 데이터 타입 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 잘못된 데이터 타입들로 요청
      const invalidTypes = [
        { peerEvaluationDeadline: 123 },
        { peerEvaluationDeadline: true },
        { peerEvaluationDeadline: [] },
        { peerEvaluationDeadline: {} },
        { peerEvaluationDeadline: null },
      ];

      for (const invalidType of invalidTypes) {
        await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(invalidType)
          .expect(400);
      }
    });
  });

  // ==================== 도메인 정책 검증 ====================

  describe('도메인 정책 검증', () => {
    it('하향/동료평가 마감일이 시작일보다 이전일 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 (시작일: 2024-01-01)
      const createData = {
        name: '하향/동료평가 마감일 시작일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '하향/동료평가 마감일 시작일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 하향/동료평가 마감일이 시작일보다 이전일 때 400 에러 발생
      const updateData = {
        peerEvaluationDeadline: '2023-12-31', // 시작일(2024-01-01)보다 이전
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('시작일 이후');
    });

    it('하향/동료평가 마감일이 자기 평가 마감일보다 이전일 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 후 자기 평가 마감일 설정
      const createData = {
        name: '하향/동료평가 마감일 자기 평가 마감일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '하향/동료평가 마감일 자기 평가 마감일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 자기 평가 마감일을 먼저 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-09-30' })
        .expect(200);

      // When & Then: 하향/동료평가 마감일이 자기 평가 마감일보다 이전일 때 400 에러 발생
      const updateData = {
        peerEvaluationDeadline: '2024-08-31', // 자기 평가 마감일(2024-09-30)보다 이전
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('자기 평가');
    });

    it('올바른 순서로 하향/동료평가 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '올바른 순서 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '올바른 순서 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가설정 마감일 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-03-31' })
        .expect(200);

      // 업무 수행 마감일 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send({ performanceDeadline: '2024-06-30' })
        .expect(200);

      // 자기 평가 마감일 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-09-30' })
        .expect(200);

      // When: 올바른 순서로 하향/동료평가 마감일 설정
      const updateData = {
        peerEvaluationDeadline: '2024-11-30', // 자기 평가(09-30) 이후
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 설정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
    });

    it('하향/동료평가 마감일을 가장 마지막 단계로 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '마지막 단계 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '마지막 단계 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 모든 이전 단계 마감일 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-02-29' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send({ performanceDeadline: '2024-05-31' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-08-31' })
        .expect(200);

      // When: 하향/동료평가 마감일을 마지막으로 설정
      const updateData = {
        peerEvaluationDeadline: '2024-10-31', // 모든 이전 단계 이후
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 설정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-10-31T00:00:00.000Z',
      );
    });
  });

  // ==================== 상태별 수정 제한 ====================

  describe('상태별 수정 제한', () => {
    it('WAITING 상태에서는 하향/동료평가 마감일을 수정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성 (기본적으로 WAITING 상태)
      const createData = {
        name: 'WAITING 상태 수정 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: 'WAITING 상태 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: WAITING 상태에서 하향/동료평가 마감일 수정
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 수정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
      expect(response.body.status).toBe('waiting');
    });

    it('ACTIVE 상태에서는 제한적으로 하향/동료평가 마감일을 수정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성 후 시작
      const createData = {
        name: 'ACTIVE 상태 수정 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: 'ACTIVE 상태 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When: ACTIVE 상태에서 하향/동료평가 마감일 수정
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 수정됨 (제한적 허용)
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
      expect(response.body.status).toBe('in-progress');
    });

    it('COMPLETED 상태에서는 하향/동료평가 마감일을 수정할 수 없어야 한다', async () => {
      // Given: 평가 기간 생성 후 시작 및 완료
      const createData = {
        name: 'COMPLETED 상태 수정 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: 'COMPLETED 상태 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작 후 완료
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // When & Then: COMPLETED 상태에서 하향/동료평가 마감일 수정 시 422 에러
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain('완료된 평가 기간');
    });
  });

  // ==================== 동시성 및 에지 케이스 ====================

  describe('동시성 및 에지 케이스', () => {
    it('동일한 평가 기간에 대해 동시에 하향/동료평가 마감일을 수정할 때 적절히 처리되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '동시성 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '동시성 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 동시에 여러 요청 실행
      const updateData1 = { peerEvaluationDeadline: '2024-11-15' };
      const updateData2 = { peerEvaluationDeadline: '2024-11-30' };

      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(updateData1),
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(updateData2),
      ]);

      // Then: 둘 중 하나는 성공해야 함
      const successfulResponses = [response1, response2].filter(
        (res) => res.status === 200,
      );
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);
    });

    it('월말 날짜들로 하향/동료평가 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '월말 날짜 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '월말 날짜 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 다양한 월말 날짜로 수정
      const monthEndDates = [
        { input: '2024-01-31', expected: '2024-01-31T00:00:00.000Z' },
        { input: '2024-02-29', expected: '2024-02-29T00:00:00.000Z' }, // 윤년
        { input: '2024-04-30', expected: '2024-04-30T00:00:00.000Z' },
        { input: '2024-06-30', expected: '2024-06-30T00:00:00.000Z' },
        { input: '2024-09-30', expected: '2024-09-30T00:00:00.000Z' },
        { input: '2024-11-30', expected: '2024-11-30T00:00:00.000Z' },
      ];

      for (const testCase of monthEndDates) {
        const updateData = {
          peerEvaluationDeadline: testCase.input,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(updateData)
          .expect(200);

        expect(response.body.peerEvaluationDeadline).toBe(testCase.expected);
      }
    });

    it('연말 날짜로 하향/동료평가 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '연말 날짜 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '연말 날짜 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 연말 날짜로 수정
      const updateData = {
        peerEvaluationDeadline: '2024-12-31',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 연말 날짜가 정상적으로 설정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-12-31T00:00:00.000Z',
      );
    });

    it('긴 기간의 평가 기간에서 하향/동료평가 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 긴 기간의 평가 기간 생성
      const createData = {
        name: '긴 기간 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2025-12-31', // 2년 기간
        description: '긴 기간 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 중간 시점으로 하향/동료평가 마감일 설정
      const updateData = {
        peerEvaluationDeadline: '2025-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 긴 기간 내 날짜가 정상적으로 설정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2025-11-30T00:00:00.000Z',
      );
    });

    it('하향/동료평가 마감일을 시작일과 같은 날로 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '시작일 동일 날짜 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '시작일 동일 날짜 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 시작일과 같은 날로 하향/동료평가 마감일 설정
      const updateData = {
        peerEvaluationDeadline: '2024-01-01', // 시작일과 동일
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 시작일과 같은 날짜가 정상적으로 설정됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-01-01T00:00:00.000Z',
      );
    });
  });

  // ==================== 데이터 무결성 검증 ====================

  describe('데이터 무결성 검증', () => {
    it('하향/동료평가 마감일 수정 후 다른 필드들은 변경되지 않아야 한다', async () => {
      // Given: 기본 평가 기간 생성 (등급 구간 없이)
      const createData = {
        name: '데이터 무결성 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '데이터 무결성 테스트',
        maxSelfEvaluationRate: 150,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalData = createResponse.body;

      // When: 하향/동료평가 마감일만 수정
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 하향/동료평가 마감일만 변경되고 다른 필드는 유지됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
      expect(response.body.name).toBe(originalData.name);
      expect(response.body.description).toBe(originalData.description);
      expect(response.body.startDate).toBe(originalData.startDate);
      expect(response.body.maxSelfEvaluationRate).toBe(
        originalData.maxSelfEvaluationRate,
      );
      expect(response.body.status).toBe(originalData.status);
    });

    it('하향/동료평가 마감일 수정 후 다른 마감일들은 변경되지 않아야 한다', async () => {
      // Given: 모든 마감일이 설정된 평가 기간 생성
      const createData = {
        name: '마감일 무결성 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '마감일 무결성 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 다른 마감일들 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-03-31' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send({ performanceDeadline: '2024-06-30' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-09-30' })
        .expect(200);

      // 현재 상태 조회
      const beforeResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      // When: 하향/동료평가 마감일만 수정
      const updateData = {
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 하향/동료평가 마감일만 변경되고 다른 마감일들은 유지됨
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
      expect(response.body.evaluationSetupDeadline).toBe(
        beforeResponse.body.evaluationSetupDeadline,
      );
      expect(response.body.performanceDeadline).toBe(
        beforeResponse.body.performanceDeadline,
      );
      expect(response.body.selfEvaluationDeadline).toBe(
        beforeResponse.body.selfEvaluationDeadline,
      );
    });

    it('하향/동료평가 마감일을 여러 번 수정해도 데이터 무결성이 유지되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '다중 수정 무결성 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '다중 수정 무결성 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalData = createResponse.body;

      // When: 여러 번 하향/동료평가 마감일 수정
      const updateDates = ['2024-10-31', '2024-11-15', '2024-11-30'];

      for (const date of updateDates) {
        const updateData = {
          peerEvaluationDeadline: date,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/peer-evaluation-deadline`,
          )
          .send(updateData)
          .expect(200);

        // Then: 각 수정 후에도 다른 필드들은 변경되지 않음
        expect(response.body.peerEvaluationDeadline).toBe(
          `${date}T00:00:00.000Z`,
        );
        expect(response.body.name).toBe(originalData.name);
        expect(response.body.description).toBe(originalData.description);
        expect(response.body.startDate).toBe(originalData.startDate);
        expect(response.body.status).toBe(originalData.status);
      }
    });
  });
});
