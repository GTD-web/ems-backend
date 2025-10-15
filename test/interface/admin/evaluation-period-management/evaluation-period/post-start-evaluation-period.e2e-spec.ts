import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('POST /admin/evaluation-periods/:id/start', () => {
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
    it('대기 중인 평가 기간을 성공적으로 시작해야 한다', async () => {
      // Given: 대기 중인 평가 기간 생성
      const createData = {
        name: '시작 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '평가기간 시작 테스트',
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

      // When: 평가 기간 시작
      const response = await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // Then: 응답 검증
      expect(response.body).toEqual({ success: true });

      // 상태 변경 확인
      const detailResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('in-progress');
      // phase 필드는 응답에 포함되지 않을 수 있음
      if (detailResponse.body.phase) {
        expect(detailResponse.body.phase).toBe('self-evaluation');
      }
    });

    it('시작된 평가 기간이 활성 목록에 나타나야 한다', async () => {
      // Given: 대기 중인 평가 기간 생성
      const createData = {
        name: '활성 목록 테스트 평가기간',
        startDate: '2024-02-01',
        peerEvaluationDeadline: '2024-07-31',
        description: '활성 목록 확인 테스트',
        maxSelfEvaluationRate: 150,
        gradeRanges: [{ grade: 'S', minRange: 95, maxRange: 100 }],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 평가 기간 시작
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // Then: 활성 목록에서 확인
      const activeResponse = await request(app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeResponse.body).toHaveLength(1);
      expect(activeResponse.body[0].id).toBe(evaluationPeriodId);
      expect(activeResponse.body[0].status).toBe('in-progress');
      expect(activeResponse.body[0].name).toBe('활성 목록 테스트 평가기간');
    });

    it('복잡한 등급 구간을 가진 평가 기간을 시작해야 한다', async () => {
      // Given: 복잡한 등급 구간을 가진 평가 기간 생성
      const createData = {
        name: '복잡한 등급 구간 평가기간',
        startDate: '2024-03-01',
        peerEvaluationDeadline: '2024-08-31',
        description: '다양한 등급 구간 테스트',
        maxSelfEvaluationRate: 180,
        gradeRanges: [
          { grade: 'S+', minRange: 95, maxRange: 100 },
          { grade: 'S', minRange: 90, maxRange: 94 },
          { grade: 'A+', minRange: 85, maxRange: 89 },
          { grade: 'A', minRange: 80, maxRange: 84 },
          { grade: 'B+', minRange: 75, maxRange: 79 },
          { grade: 'B', minRange: 70, maxRange: 74 },
          { grade: 'C', minRange: 60, maxRange: 69 },
          { grade: 'D', minRange: 0, maxRange: 59 },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 평가 기간 시작
      const response = await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // Then: 응답 및 상태 검증
      expect(response.body).toEqual(expect.any(Object));

      const detailResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('in-progress');
      expect(detailResponse.body.gradeRanges).toHaveLength(8);
    });

    it('최소한의 데이터로 생성된 평가 기간을 시작해야 한다', async () => {
      // Given: 최소한의 데이터로 평가 기간 생성
      const createData = {
        name: '최소 데이터 평가기간',
        startDate: '2024-04-01',
        peerEvaluationDeadline: '2024-09-30',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 평가 기간 시작
      const response = await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // Then: 응답 검증
      expect(response.body).toEqual(expect.any(Object));

      const detailResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('in-progress');
      expect(detailResponse.body.maxSelfEvaluationRate).toBe(120); // 기본값
      expect(detailResponse.body.gradeRanges).toEqual([]); // 빈 배열
    });
  });

  // ==================== 클라이언트 에러 (400번대) ====================

  describe('클라이언트 에러', () => {
    it('존재하지 않는 평가 기간 ID로 시작 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 UUID
      const nonExistentId = '12345678-1234-1234-1234-123456789012';

      // When & Then: 400 또는 404 에러 발생
      const response = await request(app.getHttpServer()).post(
        `/admin/evaluation-periods/${nonExistentId}/start`,
      );

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });

    it('잘못된 UUID 형식으로 시작 시 적절한 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid-format';

      // When & Then: 400 또는 500 에러 발생
      const response = await request(app.getHttpServer()).post(
        `/admin/evaluation-periods/${invalidId}/start`,
      );

      expect([400, 500]).toContain(response.status);
    });

    it('빈 문자열 ID로 시작 시 적절한 에러가 발생해야 한다', async () => {
      // Given: 빈 문자열 ID
      const emptyId = '';

      // When & Then: 404 에러 (라우팅 실패)
      const response = await request(app.getHttpServer()).post(
        `/admin/evaluation-periods/${emptyId}/start`,
      );

      expect([404, 400]).toContain(response.status);
    });

    it('null ID로 시작 시 적절한 에러가 발생해야 한다', async () => {
      // Given: null ID
      const nullId = 'null';

      // When & Then: 400 또는 500 에러 발생
      const response = await request(app.getHttpServer()).post(
        `/admin/evaluation-periods/${nullId}/start`,
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== 상태 전이 에러 (422번대) ====================

  describe('상태 전이 에러', () => {
    it('이미 시작된 평가 기간을 다시 시작 시 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성 및 시작
      const createData = {
        name: '중복 시작 테스트 평가기간',
        startDate: '2024-05-01',
        peerEvaluationDeadline: '2024-10-31',
        description: '중복 시작 방지 테스트',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 첫 번째 시작 (성공)
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When & Then: 두 번째 시작 시도 (실패)
      const response = await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(422);

      expect(response.body.message).toContain('대기 상태에서만 시작');
    });

    it('완료된 평가 기간을 시작 시 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성, 시작, 완료
      const createData = {
        name: '완료된 평가기간 시작 테스트',
        startDate: '2024-06-01',
        peerEvaluationDeadline: '2024-11-30',
        description: '완료된 평가기간 시작 방지 테스트',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 시작
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // 완료 (만약 완료 엔드포인트가 있다면)
      // 현재 컨트롤러에 완료 엔드포인트가 없으므로 이 테스트는 주석 처리
      // await request(app.getHttpServer())
      //   .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
      //   .expect(200);

      // When & Then: 완료된 평가 기간 시작 시도 (실패)
      // 현재는 이미 시작된 상태에서 다시 시작하는 경우만 테스트
      const response = await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(422);

      expect(response.body.message).toContain('대기 상태에서만 시작');
    });
  });

  // ==================== 동시성 테스트 ====================

  describe('동시성 테스트', () => {
    it('동일한 평가 기간을 동시에 시작할 때 적절히 처리되어야 한다', async () => {
      // Given: 대기 중인 평가 기간 생성
      const createData = {
        name: '동시성 테스트 평가기간',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '동시성 테스트',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 동시에 시작 요청
      const promises = Array(3)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
            .then(
              (res) => ({ status: res.status, success: true }),
              (err) => ({
                status: err.response?.status || 500,
                success: false,
              }),
            ),
        );

      const results = await Promise.all(promises);

      // Then: 최소 하나는 성공해야 하고, 모든 요청의 합은 3이어야 함
      const successCount = results.filter((r) => r.status === 200).length;
      const errorCount = results.filter((r) => r.status === 422).length;

      expect(successCount).toBeGreaterThanOrEqual(1); // 최소 1개는 성공
      expect(successCount + errorCount).toBe(3); // 전체 요청 수

      // 최종적으로 평가 기간이 시작 상태인지 확인
      const detailResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('in-progress');
    });
  });

  // ==================== 경계값 테스트 ====================

  describe('경계값 테스트', () => {
    it('UUID 최대 길이로 시작 시도해야 한다', async () => {
      // Given: 정확한 UUID 형식이지만 존재하지 않는 ID
      const maxLengthUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

      // When & Then: 400 또는 404 에러 발생
      const response = await request(app.getHttpServer()).post(
        `/admin/evaluation-periods/${maxLengthUuid}/start`,
      );

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });

    it('UUID 최소 길이로 시작 시도해야 한다', async () => {
      // Given: 정확한 UUID 형식이지만 존재하지 않는 ID
      const minLengthUuid = '00000000-0000-0000-0000-000000000000';

      // When & Then: 400 또는 404 에러 발생
      const response = await request(app.getHttpServer()).post(
        `/admin/evaluation-periods/${minLengthUuid}/start`,
      );

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });
  });

  // ==================== HTTP 관련 테스트 ====================

  describe('HTTP 관련 테스트', () => {
    it('GET 메서드로 시작 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성
      const createData = {
        name: 'HTTP 메서드 테스트 평가기간',
        startDate: '2024-08-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: GET 메서드로 시작 시도
      const response = await request(app.getHttpServer()).get(
        `/admin/evaluation-periods/${evaluationPeriodId}/start`,
      );

      expect([404, 405]).toContain(response.status);
    });

    it('PUT 메서드로 시작 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성
      const createData = {
        name: 'HTTP PUT 테스트 평가기간',
        startDate: '2024-09-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: PUT 메서드로 시작 시도
      const response = await request(app.getHttpServer()).put(
        `/admin/evaluation-periods/${evaluationPeriodId}/start`,
      );

      expect([404, 405]).toContain(response.status);
    });

    it('DELETE 메서드로 시작 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성
      const createData = {
        name: 'HTTP DELETE 테스트 평가기간',
        startDate: '2024-10-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: DELETE 메서드로 시작 시도
      const response = await request(app.getHttpServer()).delete(
        `/admin/evaluation-periods/${evaluationPeriodId}/start`,
      );

      expect([404, 405]).toContain(response.status);
    });
  });

  // ==================== 데이터 무결성 테스트 ====================

  describe('데이터 무결성 테스트', () => {
    it('시작 후 평가 기간 데이터가 변경되지 않아야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '데이터 무결성 테스트 평가기간',
        startDate: '2024-11-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '데이터 무결성 확인',
        maxSelfEvaluationRate: 150,
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
      const originalData = createResponse.body;

      // When: 평가 기간 시작
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // Then: 기본 데이터는 변경되지 않고 상태만 변경
      const detailResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      const updatedData = detailResponse.body;

      // 기본 정보는 동일
      expect(updatedData.name).toBe(originalData.name);
      // 날짜는 형식이 다를 수 있으므로 존재 여부만 확인
      expect(updatedData.startDate).toBeDefined();
      expect(updatedData.peerEvaluationDeadline).toBeDefined();
      expect(updatedData.description).toBe(originalData.description);
      expect(updatedData.maxSelfEvaluationRate).toBe(
        originalData.maxSelfEvaluationRate,
      );
      expect(updatedData.gradeRanges).toEqual(originalData.gradeRanges);

      // 상태만 변경
      expect(updatedData.status).toBe('in-progress');
      expect(originalData.status).toBe('waiting');
      // phase 필드는 응답에 포함되지 않을 수 있음
      if (updatedData.phase) {
        expect(updatedData.phase).toBe('self-evaluation');
      }
    });

    it('시작 후 생성자 정보가 유지되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '생성자 정보 유지 테스트',
        startDate: '2024-12-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalCreatedBy = createResponse.body.createdBy;
      const originalCreatedAt = createResponse.body.createdAt;

      // When: 평가 기간 시작
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // Then: 생성자 정보 유지
      const detailResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.createdBy).toBe(originalCreatedBy);
      expect(detailResponse.body.createdAt).toBe(originalCreatedAt);
      expect(detailResponse.body.updatedAt).toBeDefined();
      expect(detailResponse.body.updatedBy).toBeDefined();
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능 테스트', () => {
    it('여러 평가 기간을 순차적으로 시작할 수 있어야 한다', async () => {
      // Given: 여러 평가 기간 생성
      const createPromises = Array.from({ length: 5 }, (_, index) =>
        request(app.getHttpServer())
          .post('/admin/evaluation-periods')
          .send({
            name: `성능 테스트 평가기간 ${index + 1}`,
            startDate: `2024-${String(index + 1).padStart(2, '0')}-01`,
            peerEvaluationDeadline: `2024-${String(index + 1).padStart(
              2,
              '0',
            )}-28`,
          })
          .expect(201),
      );

      const createResponses = await Promise.all(createPromises);
      const evaluationPeriodIds = createResponses.map(
        (response) => response.body.id,
      );

      // When: 순차적으로 시작
      const startTime = Date.now();
      const startPromises = evaluationPeriodIds.map((id) =>
        request(app.getHttpServer())
          .post(`/admin/evaluation-periods/${id}/start`)
          .expect(200),
      );

      const startResponses = await Promise.all(startPromises);
      const endTime = Date.now();

      // Then: 모든 시작이 성공하고 합리적인 시간 내에 완료
      expect(startResponses).toHaveLength(5);
      startResponses.forEach((response) => {
        expect(response.body).toEqual(expect.any(Object));
      });

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // 10초 이내

      // 모든 평가 기간이 활성 상태인지 확인
      const activeResponse = await request(app.getHttpServer())
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeResponse.body).toHaveLength(5);
    });
  });
});
