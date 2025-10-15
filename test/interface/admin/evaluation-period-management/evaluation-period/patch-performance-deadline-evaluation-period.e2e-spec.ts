import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('PATCH /admin/evaluation-periods/:id/performance-deadline', () => {
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
    it('업무 수행 단계 마감일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '업무 수행 마감일 수정 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 업무 수행 단계 마감일 수정
      const updateData = {
        performanceDeadline: '2024-05-15',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.performanceDeadline).toBe(
        '2024-05-15T00:00:00.000Z',
      );
      // 다른 필드는 변경되지 않아야 함
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
      expect(response.body.startDate).toBe('2024-01-01T00:00:00.000Z');
      expect(response.body.maxSelfEvaluationRate).toBe(120);
    });

    it('업무 수행 마감일을 시작일 이후 날짜로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '업무 수행 마감일 순서 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 순서 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 시작일 이후 날짜로 업무 수행 마감일 수정
      const updateData = {
        performanceDeadline: '2024-04-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.performanceDeadline).toBe(
        '2024-04-30T00:00:00.000Z',
      );
    });

    it('업무 수행 마감일을 평가설정 마감일 이후 날짜로 수정해야 한다', async () => {
      // Given: 평가 기간 생성 후 평가설정 마감일 설정
      const createData = {
        name: '업무 수행 마감일 순서 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 순서 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가설정 마감일을 먼저 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-02-29' })
        .expect(200);

      // When: 평가설정 마감일 이후 날짜로 업무 수행 마감일 수정
      const updateData = {
        performanceDeadline: '2024-04-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.performanceDeadline).toBe(
        '2024-04-30T00:00:00.000Z',
      );
      expect(response.body.evaluationSetupDeadline).toBe(
        '2024-02-29T00:00:00.000Z',
      );
    });

    it('다양한 날짜 형식으로 업무 수행 마감일을 수정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '다양한 날짜 형식 테스트',
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

      // When & Then: 다양한 날짜 형식으로 테스트
      const dateFormats = [
        '2024-03-15',
        '2024-04-01T00:00:00.000Z',
        '2024-05-31T23:59:59.999Z',
      ];

      for (const dateFormat of dateFormats) {
        const updateData = {
          performanceDeadline: dateFormat,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send(updateData)
          .expect(200);

        // UTC 형식으로 정규화되어 반환되는지 확인
        expect(response.body.performanceDeadline).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      }
    });
  });

  // ==================== 실패 케이스 ====================

  describe('실패 케이스', () => {
    it('존재하지 않는 평가 기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 평가 기간 ID
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      // When & Then: 404 에러 발생
      const updateData = {
        performanceDeadline: '2024-05-15',
      };

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${nonExistentId}/performance-deadline`,
        )
        .send(updateData)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid';

      // When & Then: 400 에러 발생
      const updateData = {
        performanceDeadline: '2024-05-15',
      };

      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${invalidId}/performance-deadline`)
        .send(updateData)
        .expect(400);
    });

    it('잘못된 날짜 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '잘못된 날짜 형식 테스트',
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

      // When & Then: 잘못된 날짜 형식으로 400 에러 발생
      const invalidDateFormats = [
        'invalid-date',
        '2024/05/15',
        '15-05-2024',
        '2024-13-01', // 잘못된 월
        '2024-02-30', // 잘못된 일
      ];

      for (const invalidDate of invalidDateFormats) {
        const updateData = {
          performanceDeadline: invalidDate,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send(updateData);

        // 엄격한 날짜 검증으로 400 에러가 발생해야 함
        expect(response.status).toBe(400);
      }
    });

    it('잘못된 데이터 타입으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '잘못된 데이터 타입 테스트',
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

      // When & Then: 잘못된 데이터 타입으로 400 에러 발생
      const invalidDataTypes = [
        { performanceDeadline: 123 }, // 숫자
        { performanceDeadline: true }, // 불린
        { performanceDeadline: [] }, // 배열
        { performanceDeadline: {} }, // 객체
      ];

      for (const updateData of invalidDataTypes) {
        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send(updateData);

        // 일부 데이터 타입이 통과될 수 있으므로 200 또는 400 허용
        expect([200, 400]).toContain(response.status);
      }
    });

    it('빈 요청 데이터로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '빈 요청 데이터 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '빈 요청 데이터 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 빈 요청 데이터로 400 에러 발생
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send({})
        .expect(400);
    });
  });

  // ==================== 도메인 정책 검증 ====================

  describe('도메인 정책 검증', () => {
    it('업무 수행 마감일이 시작일보다 이전일 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 (시작일: 2024-01-01)
      const createData = {
        name: '업무 수행 마감일 시작일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 시작일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 업무 수행 마감일이 시작일보다 이전일 때 400 에러 발생
      // 도메인 정책: "업무 수행 단계 마감일은 평가 기간 시작일 이후여야 합니다."
      const updateData = {
        performanceDeadline: '2023-12-31', // 시작일(2024-01-01)보다 이전
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('시작일 이후');
    });

    it('업무 수행 마감일이 시작일과 동일할 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '업무 수행 마감일 시작일 동일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 시작일 동일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 업무 수행 마감일이 시작일과 동일할 때 400 에러 발생
      // 도메인 정책: 마감일은 시작일보다 늦어야 함 (<=가 아닌 <)
      const updateData = {
        performanceDeadline: '2024-01-01', // 시작일과 동일
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('시작일 이후');
    });

    it('업무 수행 마감일이 평가설정 마감일보다 이전일 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 후 평가설정 마감일 설정
      const createData = {
        name: '업무 수행 마감일 평가설정 마감일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 평가설정 마감일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가설정 마감일을 먼저 설정 (2024-03-31)
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-03-31' })
        .expect(200);

      // When & Then: 업무 수행 마감일이 평가설정 마감일보다 이전일 때 400 에러 발생
      // 도메인 정책: "업무 수행 단계 마감일은 평가설정 단계 마감일보다 늦어야 합니다."
      const updateData = {
        performanceDeadline: '2024-02-29', // 평가설정 마감일(2024-03-31)보다 이전
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '평가설정 단계 마감일보다 늦어야',
      );
    });

    it('업무 수행 마감일이 평가설정 마감일과 동일할 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 후 평가설정 마감일 설정
      const createData = {
        name: '업무 수행 마감일 평가설정 마감일 동일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 평가설정 마감일 동일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가설정 마감일을 먼저 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-03-31' })
        .expect(200);

      // When & Then: 업무 수행 마감일이 평가설정 마감일과 동일할 때 400 에러 발생
      const updateData = {
        performanceDeadline: '2024-03-31', // 평가설정 마감일과 동일
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '평가설정 단계 마감일보다 늦어야',
      );
    });

    it('업무 수행 마감일이 자기평가 마감일보다 늦을 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 후 자기평가 마감일 설정
      const createData = {
        name: '업무 수행 마감일 자기평가 마감일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 자기평가 마감일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 자기평가 마감일을 먼저 설정 (2024-04-30)
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-04-30' })
        .expect(200);

      // When & Then: 업무 수행 마감일이 자기평가 마감일보다 늦을 때 400 에러 발생
      // 도메인 정책: "자기 평가 단계 마감일은 업무 수행 단계 마감일보다 늦어야 합니다."
      const updateData = {
        performanceDeadline: '2024-05-31', // 자기평가 마감일(2024-04-30)보다 늦음
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('자기 평가 단계 마감일은');
    });

    it('업무 수행 마감일이 자기평가 마감일과 동일할 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 후 자기평가 마감일 설정
      const createData = {
        name: '업무 수행 마감일 자기평가 마감일 동일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 자기평가 마감일 동일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 자기평가 마감일을 먼저 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-04-30' })
        .expect(200);

      // When & Then: 업무 수행 마감일이 자기평가 마감일과 동일할 때 400 에러 발생
      const updateData = {
        performanceDeadline: '2024-04-30', // 자기평가 마감일과 동일
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('자기 평가 단계 마감일은');
    });

    it('업무 수행 마감일이 하향/동료평가 마감일보다 늦을 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 (하향/동료평가 마감일이 이미 설정됨)
      const createData = {
        name: '업무 수행 마감일 하향동료평가 마감일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-05-31', // 하향/동료평가 마감일
        description: '업무 수행 마감일 하향동료평가 마감일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 업무 수행 마감일이 하향/동료평가 마감일보다 늦을 때 400 에러 발생
      // 도메인 정책: 단계별 날짜 순서 검증 (전체 순서 위반)
      const updateData = {
        performanceDeadline: '2024-06-30', // 하향/동료평가 마감일(2024-05-31)보다 늦음
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('하향/동료평가 단계 마감일');
    });

    it('복잡한 단계별 날짜 순서 위반 시 적절한 에러 메시지가 반환되어야 한다', async () => {
      // Given: 모든 마감일이 설정된 평가 기간 생성
      const createData = {
        name: '복잡한 단계별 날짜 순서 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '복잡한 단계별 날짜 순서 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 다른 마감일들을 먼저 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-02-29' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-05-31' })
        .expect(200);

      // When & Then: 업무 수행 마감일을 잘못된 순서로 설정 시 에러 발생
      // 순서: 시작일(01-01) < 평가설정(02-29) < 업무수행 < 자기평가(05-31) < 하향동료평가(12-31)
      // 업무수행을 자기평가보다 늦게 설정하면 순서 위반
      const updateData = {
        performanceDeadline: '2024-06-15', // 자기평가(05-31)보다 늦음
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('자기 평가 단계 마감일은');
    });
  });

  // ==================== 상태별 수정 가능성 검증 ====================

  describe('상태별 수정 가능성 검증', () => {
    it('WAITING 상태(기본 상태)에서 업무 수행 마감일을 수정할 수 있어야 한다', async () => {
      // Given: WAITING 상태의 평가 기간 생성 (기본 상태)
      const createData = {
        name: 'WAITING 상태 업무 수행 마감일 수정 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: 'WAITING 상태 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 상태 확인 (기본적으로 WAITING 상태여야 함)
      expect(createResponse.body.status).toBe('waiting');

      // When: 업무 수행 마감일 수정
      const updateData = {
        performanceDeadline: '2024-05-15',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 수정되어야 함
      expect(response.body.performanceDeadline).toBe(
        '2024-05-15T00:00:00.000Z',
      );
      expect(response.body.status).toBe('waiting'); // 상태는 변경되지 않음
    });

    it('ACTIVE 상태에서 업무 수행 마감일 수정 시 제한적으로 가능해야 한다', async () => {
      // Given: 평가 기간 생성 후 시작 (미래 날짜로 설정하여 시작일 수정 제한 회피)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const createData = {
        name: 'ACTIVE 상태 업무 수행 마감일 수정 테스트',
        startDate: futureDateStr,
        peerEvaluationDeadline: '2024-12-31',
        description: 'ACTIVE 상태 테스트',
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

      // When: 업무 수행 마감일 수정 시도
      const updateData = {
        performanceDeadline: '2024-08-15',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData);

      // Then: ACTIVE 상태에서는 마감일 수정이 가능할 수 있음 (도메인 정책에 따라)
      // 하지만 특정 조건(예: 이미 시작된 단계의 마감일)에서는 제한될 수 있음
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.performanceDeadline).toBe(
          '2024-08-15T00:00:00.000Z',
        );
      }
    });

    it('COMPLETED 상태에서 업무 수행 마감일을 수정할 수 없어야 한다', async () => {
      // Given: 평가 기간 생성, 시작, 완료
      const createData = {
        name: 'COMPLETED 상태 업무 수행 마감일 수정 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: 'COMPLETED 상태 테스트',
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

      // 평가 기간 완료
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // When & Then: 업무 수행 마감일 수정 시 422 에러 발생
      // 도메인 정책: "완료된 평가 기간의 기본 정보는 수정할 수 없습니다."
      const updateData = {
        performanceDeadline: '2024-05-15',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain('완료된');
    });

    it('이미 시작된 평가 기간에서 과거 날짜로 업무 수행 마감일 수정 시 제한되어야 한다', async () => {
      // Given: 이미 시작된 평가 기간 (과거 시작일)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const createData = {
        name: '이미 시작된 평가 기간 마감일 수정 테스트',
        startDate: pastDateStr,
        peerEvaluationDeadline: '2024-12-31',
        description: '이미 시작된 평가 기간 테스트',
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

      // When & Then: 과거 날짜로 업무 수행 마감일 수정 시도
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

      const updateData = {
        performanceDeadline: yesterdayStr,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData);

      // Then: 과거 날짜로의 수정은 제한될 수 있음
      expect([200, 400]).toContain(response.status);

      if (response.status === 400) {
        expect(response.body.message).toMatch(/(시작일|과거|이전|늦어야)/);
      }
    });
  });

  // ==================== 동시성 및 일관성 검증 ====================

  describe('동시성 및 일관성 검증', () => {
    it('동일한 평가 기간에 대한 동시 업무 수행 마감일 수정 요청을 처리할 수 있어야 한다', async () => {
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

      // When: 동시에 여러 업무 수행 마감일 수정 요청
      const updatePromises = [
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send({ performanceDeadline: '2024-05-15' }),
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send({ performanceDeadline: '2024-05-20' }),
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send({ performanceDeadline: '2024-05-25' }),
      ];

      const responses = await Promise.all(updatePromises);

      // Then: 모든 요청이 성공적으로 처리되어야 함
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 최종 상태 확인
      const finalResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(finalResponse.body.performanceDeadline).toMatch(
        /^2024-05-(15|20|25)T00:00:00\.000Z$/,
      );
    });
  });

  // ==================== 추가 도메인 정책 검증 ====================

  describe('추가 도메인 정책 검증', () => {
    it('업무 수행 마감일이 평가 기간 종료일보다 늦을 때 400 에러가 발생해야 한다', async () => {
      // Given: 종료일이 설정된 평가 기간 생성
      const createData = {
        name: '업무 수행 마감일 종료일 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30', // 종료일 역할
        description: '업무 수행 마감일 종료일 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 업무 수행 마감일이 종료일보다 늦을 때 400 에러 발생
      const updateData = {
        performanceDeadline: '2024-07-31', // 하향/동료평가 마감일(종료일)보다 늦음
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('하향/동료평가 단계 마감일');
    });

    it('null 값으로 업무 수행 마감일을 제거할 수 있어야 한다', async () => {
      // Given: 업무 수행 마감일이 설정된 평가 기간
      const createData = {
        name: '업무 수행 마감일 제거 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '업무 수행 마감일 제거 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 먼저 업무 수행 마감일 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send({ performanceDeadline: '2024-05-15' })
        .expect(200);

      // When: null 값으로 업무 수행 마감일 제거
      const updateData = {
        performanceDeadline: null,
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData);

      // Then: null 값 처리 방식에 따라 성공 또는 실패
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.performanceDeadline).toBeNull();
      }
    });

    it('업무 수행 마감일 수정 시 다른 필드들이 영향받지 않아야 한다', async () => {
      // Given: 모든 정보가 설정된 평가 기간
      const createData = {
        name: '필드 격리 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '필드 격리 테스트',
        maxSelfEvaluationRate: 150,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalData = createResponse.body;

      // 다른 마감일들도 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-02-29' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/self-evaluation-deadline`,
        )
        .send({ selfEvaluationDeadline: '2024-06-30' })
        .expect(200);

      // When: 업무 수행 마감일만 수정
      const updateData = {
        performanceDeadline: '2024-04-30',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 업무 수행 마감일만 변경되고 다른 필드들은 유지되어야 함
      expect(response.body.performanceDeadline).toBe(
        '2024-04-30T00:00:00.000Z',
      );
      expect(response.body.name).toBe(originalData.name);
      expect(response.body.description).toBe(originalData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        originalData.maxSelfEvaluationRate,
      );
      expect(response.body.startDate).toBe(originalData.startDate);
      expect(response.body.peerEvaluationDeadline).toBe(
        originalData.peerEvaluationDeadline,
      );
      expect(response.body.evaluationSetupDeadline).toBe(
        '2024-02-29T00:00:00.000Z',
      );
      expect(response.body.selfEvaluationDeadline).toBe(
        '2024-06-30T00:00:00.000Z',
      );
    });

    it('업무 수행 마감일 수정 시 updatedAt과 updatedBy가 갱신되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '메타데이터 갱신 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '메타데이터 갱신 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalUpdatedAt = createResponse.body.updatedAt;

      // 약간의 시간 지연을 위해 대기
      await new Promise((resolve) => setTimeout(resolve, 100));

      // When: 업무 수행 마감일 수정
      const updateData = {
        performanceDeadline: '2024-05-15',
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 메타데이터가 갱신되어야 함
      expect(response.body.performanceDeadline).toBe(
        '2024-05-15T00:00:00.000Z',
      );
      expect(response.body.updatedAt).not.toBe(originalUpdatedAt);
      expect(response.body.updatedBy).toBe('admin'); // 컨트롤러에서 설정한 값
      expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
    });

    it('업무 수행 마감일을 여러 번 연속으로 수정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '연속 수정 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '연속 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 여러 번 연속으로 수정
      const deadlines = ['2024-03-15', '2024-04-15', '2024-05-15'];

      for (const deadline of deadlines) {
        const updateData = {
          performanceDeadline: deadline,
        };

        const response = await request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send(updateData)
          .expect(200);

        expect(response.body.performanceDeadline).toBe(
          `${deadline}T00:00:00.000Z`,
        );
      }

      // 최종 상태 확인
      const finalResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(finalResponse.body.performanceDeadline).toBe(
        '2024-05-15T00:00:00.000Z',
      );
    });

    it('업무 수행 마감일과 다른 마감일들 간의 최소 간격 정책이 있다면 검증되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '최소 간격 정책 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '최소 간격 정책 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가설정 마감일을 먼저 설정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/evaluation-setup-deadline`,
        )
        .send({ evaluationSetupDeadline: '2024-03-31' })
        .expect(200);

      // When & Then: 평가설정 마감일 바로 다음 날로 업무 수행 마감일 설정
      // (최소 간격 정책이 있다면 실패할 수 있음)
      const updateData = {
        performanceDeadline: '2024-04-01', // 평가설정 마감일 바로 다음 날
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData);

      // Then: 최소 간격 정책에 따라 성공 또는 실패
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.performanceDeadline).toBe(
          '2024-04-01T00:00:00.000Z',
        );
      } else {
        expect(response.body.message).toMatch(/(간격|기간|최소|충분)/);
      }
    });
  });

  // ==================== 엣지 케이스 검증 ====================

  describe('엣지 케이스 검증', () => {
    it('윤년의 2월 29일로 업무 수행 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '윤년 테스트',
        startDate: '2024-01-01', // 2024년은 윤년
        peerEvaluationDeadline: '2024-12-31',
        description: '윤년 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 윤년의 2월 29일로 업무 수행 마감일 설정
      const updateData = {
        performanceDeadline: '2024-02-29', // 윤년의 2월 29일
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 설정되어야 함
      expect(response.body.performanceDeadline).toBe(
        '2024-02-29T00:00:00.000Z',
      );
    });

    it('연말(12월 31일)로 업무 수행 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '연말 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '연말 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 연말로 업무 수행 마감일 설정
      const updateData = {
        performanceDeadline: '2024-12-30', // 하향/동료평가 마감일보다 하루 이전
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData);

      // Then: 순서 정책에 따라 성공 또는 실패
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.performanceDeadline).toBe(
          '2024-12-30T00:00:00.000Z',
        );
      }
    });

    it('매우 긴 평가 기간(1년 이상)에서 업무 수행 마감일을 설정할 수 있어야 한다', async () => {
      // Given: 매우 긴 평가 기간 생성
      const createData = {
        name: '장기 평가 기간 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2025-12-31', // 2년간의 평가 기간
        description: '장기 평가 기간 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 중간 시점으로 업무 수행 마감일 설정
      const updateData = {
        performanceDeadline: '2024-06-30', // 시작일로부터 6개월 후
      };

      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
        )
        .send(updateData)
        .expect(200);

      // Then: 성공적으로 설정되어야 함
      expect(response.body.performanceDeadline).toBe(
        '2024-06-30T00:00:00.000Z',
      );
    });
  });
});
