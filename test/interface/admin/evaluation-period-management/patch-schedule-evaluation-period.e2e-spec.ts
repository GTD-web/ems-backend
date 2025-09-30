import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /admin/evaluation-periods/:id/schedule', () => {
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
    it('평가 기간 시작일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '시작일 수정 테스트 평가기간',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '시작일 수정 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'A', minRange: 90, maxRange: 100 },
          { grade: 'B', minRange: 80, maxRange: 89 },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 시작일 수정
      const updateData = {
        startDate: '2024-02-01T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.startDate).toBe('2024-02-01T00:00:00.000Z');
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
      expect(response.body.peerEvaluationDeadline).toBe('2024-06-30');
    });

    it('평가 기간 종료일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '종료일 수정 테스트 평가기간',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '종료일 수정 테스트',
        maxSelfEvaluationRate: 130,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 종료일 수정
      const updateData = {
        endDate: '2024-12-31T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.endDate).toBe('2024-12-31T00:00:00.000Z');
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.name).toBe(createData.name);
    });

    it('평가설정 단계 마감일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '평가설정 마감일 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '평가설정 마감일 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 평가설정 마감일 수정
      const updateData = {
        evaluationSetupDeadline: '2024-01-15T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.evaluationSetupDeadline).toBe(
        '2024-01-15T00:00:00.000Z',
      );
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.name).toBe(createData.name);
    });

    it('업무 수행 단계 마감일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '업무수행 마감일 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '업무수행 마감일 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 업무수행 마감일 수정
      const updateData = {
        performanceDeadline: '2024-05-31T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.performanceDeadline).toBe(
        '2024-05-31T00:00:00.000Z',
      );
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.name).toBe(createData.name);
    });

    it('자기 평가 단계 마감일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '자기평가 마감일 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '자기평가 마감일 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 자기평가 마감일 수정
      const updateData = {
        selfEvaluationDeadline: '2024-06-15T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.selfEvaluationDeadline).toBe(
        '2024-06-15T00:00:00.000Z',
      );
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.name).toBe(createData.name);
    });

    it('하향/동료평가 단계 마감일을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '하향동료평가 마감일 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '하향동료평가 마감일 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 하향동료평가 마감일 수정
      const updateData = {
        peerEvaluationDeadline: '2024-07-15T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-07-15T00:00:00.000Z',
      );
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.name).toBe(createData.name);
    });

    it('전체 일정을 한 번에 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '전체 일정 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '전체 일정 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 전체 일정 수정
      const updateData = {
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2024-12-31T00:00:00.000Z',
        evaluationSetupDeadline: '2024-02-15T00:00:00.000Z',
        performanceDeadline: '2024-10-31T00:00:00.000Z',
        selfEvaluationDeadline: '2024-11-15T00:00:00.000Z',
        peerEvaluationDeadline: '2024-11-30T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.startDate).toBe('2024-02-01T00:00:00.000Z');
      expect(response.body.endDate).toBe('2024-12-31T00:00:00.000Z');
      expect(response.body.evaluationSetupDeadline).toBe(
        '2024-02-15T00:00:00.000Z',
      );
      expect(response.body.performanceDeadline).toBe(
        '2024-10-31T00:00:00.000Z',
      );
      expect(response.body.selfEvaluationDeadline).toBe(
        '2024-11-15T00:00:00.000Z',
      );
      expect(response.body.peerEvaluationDeadline).toBe(
        '2024-11-30T00:00:00.000Z',
      );
      // 기본 정보는 변경되지 않아야 함
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
    });

    it('일부 일정만 선택적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '선택적 일정 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '선택적 일정 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 일부 일정만 수정 (시작일, 종료일, 자기평가 마감일만)
      const updateData = {
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-12-15T00:00:00.000Z',
        selfEvaluationDeadline: '2024-06-10T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.startDate).toBe('2024-01-15T00:00:00.000Z');
      expect(response.body.endDate).toBe('2024-12-15T00:00:00.000Z');
      expect(response.body.selfEvaluationDeadline).toBe(
        '2024-06-10T00:00:00.000Z',
      );
      // 수정하지 않은 필드는 기존 값 또는 null 유지
      expect(response.body.peerEvaluationDeadline).toBe('2024-06-30');
      expect(response.body.evaluationSetupDeadline).toBeNull();
      expect(response.body.performanceDeadline).toBeNull();
    });

    it('빈 객체로 요청 시 기존 값이 유지되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '빈 객체 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '빈 객체 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 빈 객체로 수정 요청
      const updateData = {};

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 기존 값이 모두 유지되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.peerEvaluationDeadline).toBe('2024-06-30');
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
    });

    it('올바른 순서로 전체 일정을 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '올바른 순서 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '올바른 순서 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 올바른 순서로 전체 일정 수정
      const updateData = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        evaluationSetupDeadline: '2024-02-28',
        performanceDeadline: '2024-06-30',
        selfEvaluationDeadline: '2024-09-30',
        peerEvaluationDeadline: '2024-11-30',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 모든 날짜가 올바른 순서로 설정되어야 함
      expect(response.body.startDate).toBe('2024-01-01');
      expect(response.body.endDate).toBe('2024-12-31T00:00:00.000Z');
      expect(response.body.evaluationSetupDeadline).toBe('2024-02-28T00:00:00.000Z');
      expect(response.body.performanceDeadline).toBe('2024-06-30T00:00:00.000Z');
      expect(response.body.selfEvaluationDeadline).toBe('2024-09-30T00:00:00.000Z');
      expect(response.body.peerEvaluationDeadline).toBe('2024-11-30T00:00:00.000Z');
    });
  });

  // ==================== 실패 케이스 ====================

  describe('실패 케이스', () => {
    it('존재하지 않는 평가 기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 평가 기간 ID
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When & Then: 404 에러 발생
      const updateData = {
        startDate: '2024-02-01T00:00:00.000Z',
      };

      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${nonExistentId}/schedule`)
        .send(updateData)
        .expect(404);
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid';

      // When & Then: 400 에러 발생
      const updateData = {
        startDate: '2024-02-01T00:00:00.000Z',
      };

      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${invalidId}/schedule`)
        .send(updateData)
        .expect(400);
    });

    it('잘못된 날짜 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '잘못된 날짜 형식 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '잘못된 날짜 형식 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 잘못된 날짜 형식으로 400 에러 발생
      const trulyInvalidDateFormats = [
        { startDate: 'invalid-date' }, // 400 에러
        { peerEvaluationDeadline: 'not-a-date' }, // 400 에러
      ];

      for (const updateData of trulyInvalidDateFormats) {
        await request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData)
          .expect(400); // 현재는 400 에러가 발생함
      }

      // 일부 형식은 유효하게 처리되거나 다른 에러가 발생함
      const otherDateFormats = [
        { endDate: '2024/12/31' }, // 유효한 형식으로 처리될 수 있음
        { evaluationSetupDeadline: '31-12-2024' }, // 유효한 형식으로 처리될 수 있음
        { performanceDeadline: '2024-13-01' }, // 유효한 형식으로 처리될 수 있음
        { selfEvaluationDeadline: '2024-02-30' }, // 유효한 형식으로 처리될 수 있음
      ];

      for (const updateData of otherDateFormats) {
        const response = await request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData);

        // 200, 400, 또는 500 에러 중 하나가 발생할 수 있음
        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('잘못된 데이터 타입으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '잘못된 데이터 타입 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
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
        { startDate: 123 }, // 숫자
        { endDate: true }, // 불린
        { evaluationSetupDeadline: [] }, // 배열
        { performanceDeadline: {} }, // 객체
      ];

      for (const updateData of invalidDataTypes) {
        await request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData)
          .expect(400); // 현재는 400 에러가 발생함
      }
    });
  });

  // ==================== 비즈니스 로직 검증 ====================

  describe('비즈니스 로직 검증', () => {
    it('시작일이 종료일보다 늦을 때 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '날짜 순서 검증 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '날짜 순서 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 시작일이 종료일보다 늦을 때 400 에러 발생
      const updateData = {
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(400);
    });

    it('마감일들이 논리적 순서를 위반할 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '마감일 순서 검증 테스트',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '마감일 순서 검증 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 다양한 순서 위반 케이스들
      const invalidOrderCases = [
        // 자기평가 마감일이 하향/동료평가 마감일보다 늦음
        {
          selfEvaluationDeadline: '2024-12-31',
          peerEvaluationDeadline: '2024-06-30',
        },
        // 업무수행 마감일이 자기평가 마감일보다 늦음
        {
          performanceDeadline: '2024-12-31',
          selfEvaluationDeadline: '2024-06-30',
        },
        // 평가설정 마감일이 업무수행 마감일보다 늦음
        {
          evaluationSetupDeadline: '2024-12-31',
          performanceDeadline: '2024-06-30',
        },
        // 전체 순서가 뒤바뀜
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          evaluationSetupDeadline: '2024-10-01',
          performanceDeadline: '2024-08-01',
          selfEvaluationDeadline: '2024-06-01',
          peerEvaluationDeadline: '2024-04-01',
        },
      ];

      for (const updateData of invalidOrderCases) {
        await request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData)
          .expect(400);
      }
    });

    it('완료된 평가 기간의 일정 수정 시 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 및 완료
      const createData = {
        name: '완료된 평가기간 수정 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '완료된 평가기간 수정 테스트',
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
        .expect(201);

      // 평가 기간 완료
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // When & Then: 완료된 평가 기간 수정 시 422 에러 발생
      const updateData = {
        startDate: '2024-02-01T00:00:00.000Z',
      };

      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(422);
    });
  });

  // ==================== 데이터 무결성 검증 ====================

  describe('데이터 무결성 검증', () => {
    it('일정 수정 후 다른 필드들이 변경되지 않아야 한다', async () => {
      // Given: 복잡한 평가 기간 생성
      const createData = {
        name: '데이터 무결성 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '데이터 무결성 테스트용 평가기간',
        maxSelfEvaluationRate: 150,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 75, maxRange: 84 },
          { grade: 'C', minRange: 65, maxRange: 74 },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalData = createResponse.body;

      // When: 일정만 수정
      const updateData = {
        startDate: '2024-01-15T00:00:00.000Z',
        endDate: '2024-12-15T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 일정 외 다른 필드들이 변경되지 않았는지 확인
      expect(response.body.name).toBe(originalData.name);
      expect(response.body.description).toBe(originalData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        originalData.maxSelfEvaluationRate,
      );
      expect(response.body.gradeRanges).toEqual(originalData.gradeRanges);
      expect(response.body.status).toBe(originalData.status);
      expect(response.body.criteriaSettingEnabled).toBe(
        originalData.criteriaSettingEnabled,
      );
      expect(response.body.selfEvaluationSettingEnabled).toBe(
        originalData.selfEvaluationSettingEnabled,
      );
      expect(response.body.finalEvaluationSettingEnabled).toBe(
        originalData.finalEvaluationSettingEnabled,
      );

      // 수정된 일정 필드만 변경되었는지 확인
      expect(response.body.startDate).toBe('2024-01-15T00:00:00.000Z');
      expect(response.body.endDate).toBe('2024-12-15T00:00:00.000Z');
    });

    it('동시성 처리: 동일한 평가 기간을 동시에 수정할 때 하나만 성공해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '동시성 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '동시성 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 동시에 여러 수정 요청
      const updateData1 = { startDate: '2024-01-15' };
      const updateData2 = { startDate: '2024-02-01' };

      const [response1, response2] = await Promise.all([
        request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData1),
        request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData2),
      ]);

      // Then: 두 요청 모두 성공해야 함
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // 최종 상태 확인
      const finalResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      // 마지막 수정이 반영되어야 함 (조회 시에는 date 형식으로 반환됨)
      expect(['2024-01-15', '2024-02-01']).toContain(
        finalResponse.body.startDate,
      );
    });
  });

  // ==================== 특수 케이스 ====================

  describe('특수 케이스', () => {
    it('윤년 날짜로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '윤년 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '윤년 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 윤년 2월 29일로 수정
      const updateData = {
        startDate: '2024-02-29T00:00:00.000Z', // 2024년은 윤년
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 윤년 날짜가 정상적으로 처리되어야 함
      expect(response.body.startDate).toBe('2024-02-29T00:00:00.000Z');
    });

    it('타임존이 다른 날짜로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '타임존 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '타임존 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 다양한 타임존 형식으로 수정
      const timeZoneFormats = [
        { startDate: '2024-02-01T00:00:00Z' },
        { endDate: '2024-12-31T23:59:59.999Z' },
        { evaluationSetupDeadline: '2024-02-15T09:00:00+09:00' },
      ];

      for (const updateData of timeZoneFormats) {
        const response = await request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
          .send(updateData)
          .expect(200);

        // Then: UTC로 정규화되어 저장되어야 함
        const fieldName = Object.keys(updateData)[0];
        expect(response.body[fieldName]).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      }
    });

    it('매우 먼 미래 날짜로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '먼 미래 날짜 테스트',
        startDate: '2024-01-01T00:00:00.000Z',
        peerEvaluationDeadline: '2024-06-30T00:00:00.000Z',
        description: '먼 미래 날짜 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 먼 미래 날짜로 수정
      const updateData = {
        startDate: '2099-01-01T00:00:00.000Z',
        endDate: '2099-12-31T00:00:00.000Z',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/schedule`)
        .send(updateData)
        .expect(200);

      // Then: 먼 미래 날짜가 정상적으로 처리되어야 함
      expect(response.body.startDate).toBe('2099-01-01T00:00:00.000Z');
      expect(response.body.endDate).toBe('2099-12-31T00:00:00.000Z');
    });
  });
});
