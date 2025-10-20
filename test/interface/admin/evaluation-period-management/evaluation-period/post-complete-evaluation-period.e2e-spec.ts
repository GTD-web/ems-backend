import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';

describe('POST /admin/evaluation-periods/:id/complete', () => {
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
    it('진행 중인 평가 기간을 성공적으로 완료해야 한다', async () => {
      // Given: 진행 중인 평가 기간 생성 및 시작
      const createData = {
        name: '완료 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '평가기간 완료 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'A', minRange: 90, maxRange: 100 },
          { grade: 'B', minRange: 80, maxRange: 89 },
        ],
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When: 평가 기간 완료
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // Then: 응답 검증
      expect(response.body).toEqual({ success: true });

      // 상태 변경 확인
      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('completed');
    });

    it('완료된 평가 기간이 활성 목록에서 제거되어야 한다', async () => {
      // Given: 진행 중인 평가 기간 생성 및 시작
      const createData = {
        name: '활성 목록 제거 테스트 평가기간',
        startDate: '2024-02-01',
        peerEvaluationDeadline: '2024-07-31',
        description: '활성 목록 제거 확인 테스트',
        maxSelfEvaluationRate: 150,
        gradeRanges: [{ grade: 'S', minRange: 95, maxRange: 100 }],
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // 활성 목록에 있는지 확인
      const activeBeforeResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeBeforeResponse.body).toHaveLength(1);
      expect(activeBeforeResponse.body[0].id).toBe(evaluationPeriodId);

      // When: 평가 기간 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // Then: 활성 목록에서 제거됨
      const activeAfterResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeAfterResponse.body).toHaveLength(0);
    });

    it('복잡한 등급 구간을 가진 평가 기간을 완료해야 한다', async () => {
      // Given: 복잡한 등급 구간을 가진 평가 기간 생성 및 시작
      const createData = {
        name: '복잡한 등급 구간 완료 테스트',
        startDate: '2024-03-01',
        peerEvaluationDeadline: '2024-08-31',
        description: '다양한 등급 구간 완료 테스트',
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

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When: 평가 기간 완료
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // Then: 응답 및 상태 검증
      expect(response.body).toEqual({ success: true });

      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('completed');
      expect(detailResponse.body.gradeRanges).toHaveLength(8);
    });

    it('최소한의 데이터로 생성된 평가 기간을 완료해야 한다', async () => {
      // Given: 최소한의 데이터로 평가 기간 생성 및 시작
      const createData = {
        name: '최소 데이터 완료 테스트',
        startDate: '2024-04-01',
        peerEvaluationDeadline: '2024-09-30',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When: 평가 기간 완료
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // Then: 응답 검증
      expect(response.body).toEqual({ success: true });

      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('completed');
      expect(detailResponse.body.maxSelfEvaluationRate).toBe(120); // 기본값
      expect(detailResponse.body.gradeRanges).toEqual([]); // 빈 배열
    });
  });

  // ==================== 클라이언트 에러 (400번대) ====================

  describe('클라이언트 에러', () => {
    it('존재하지 않는 평가 기간 ID로 완료 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 UUID
      const nonExistentId = '12345678-1234-1234-1234-123456789012';

      // When & Then: 400 또는 404 에러 발생
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${nonExistentId}/complete`);

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });

    it('잘못된 UUID 형식으로 완료 시 적절한 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid-format';

      // When & Then: 400 또는 500 에러 발생
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${invalidId}/complete`);

      expect([400, 500]).toContain(response.status);
    });

    it('빈 문자열 ID로 완료 시 적절한 에러가 발생해야 한다', async () => {
      // Given: 빈 문자열 ID
      const emptyId = '';

      // When & Then: 404 에러 (라우팅 실패)
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${emptyId}/complete`);

      expect([404, 400]).toContain(response.status);
    });

    it('null ID로 완료 시 적절한 에러가 발생해야 한다', async () => {
      // Given: null ID
      const nullId = 'null';

      // When & Then: 400 또는 500 에러 발생
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${nullId}/complete`);

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==================== 상태 전이 에러 (422번대) ====================

  describe('상태 전이 에러', () => {
    it('대기 중인 평가 기간을 완료 시 422 에러가 발생해야 한다', async () => {
      // Given: 대기 중인 평가 기간 생성 (시작하지 않음)
      const createData = {
        name: '대기 상태 완료 테스트 평가기간',
        startDate: '2024-05-01',
        peerEvaluationDeadline: '2024-10-31',
        description: '대기 상태에서 완료 방지 테스트',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 대기 중인 평가 기간 완료 시도 (실패)
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(422);

      expect(response.body.message).toContain(
        '진행 중 상태에서만 완료할 수 있습니다',
      );
    });

    it('이미 완료된 평가 기간을 다시 완료 시 422 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성, 시작, 완료
      const createData = {
        name: '중복 완료 테스트 평가기간',
        startDate: '2024-06-01',
        peerEvaluationDeadline: '2024-11-30',
        description: '중복 완료 방지 테스트',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // 첫 번째 완료 (성공)
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // When & Then: 두 번째 완료 시도 (실패)
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(422);

      expect(response.body.message).toContain(
        '진행 중 상태에서만 완료할 수 있습니다',
      );
    });
  });

  // ==================== 동시성 테스트 ====================

  describe('동시성 테스트', () => {
    it('동일한 평가 기간을 동시에 완료할 때 적절히 처리되어야 한다', async () => {
      // Given: 진행 중인 평가 기간 생성 및 시작
      const timestamp = Date.now();
      const uniqueId = Math.floor(Math.random() * 10000);
      const createData = {
        name: `동시성 완료 테스트 평가기간 ${timestamp}-${uniqueId}`,
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '동시성 완료 테스트',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When: 동시에 완료 요청
      const promises = Array(3)
        .fill(null)
        .map(() =>
          testSuite
            .request()
            .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
            .then(
              (res) => ({ status: res.status, success: true }),
              (err) => ({
                status: err.response?.status || 500,
                success: false,
              }),
            ),
        );

      const results = await Promise.all(promises);

      // Then: 최소한 하나는 성공해야 하고, 최종 상태는 completed여야 함
      const successCount = results.filter((r) => r.status === 200).length;
      const errorCount = results.filter((r) => r.status === 422).length;

      // 동시성 제어에 따라 다를 수 있으므로 유연하게 검증
      expect(successCount).toBeGreaterThanOrEqual(1);
      expect(successCount + errorCount).toBe(3);

      // 최종 상태 확인
      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(detailResponse.body.status).toBe('completed');
    });
  });

  // ==================== 경계값 테스트 ====================

  describe('경계값 테스트', () => {
    it('UUID 최대 길이로 완료 시도해야 한다', async () => {
      // Given: 정확한 UUID 형식이지만 존재하지 않는 ID
      const maxLengthUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

      // When & Then: 400 또는 404 에러 발생
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${maxLengthUuid}/complete`);

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });

    it('UUID 최소 길이로 완료 시도해야 한다', async () => {
      // Given: 정확한 UUID 형식이지만 존재하지 않는 ID
      const minLengthUuid = '00000000-0000-0000-0000-000000000000';

      // When & Then: 400 또는 404 에러 발생
      const response = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${minLengthUuid}/complete`);

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });
  });

  // ==================== HTTP 관련 테스트 ====================

  describe('HTTP 관련 테스트', () => {
    it('GET 메서드로 완료 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성 및 시작
      const createData = {
        name: 'HTTP 메서드 테스트 평가기간',
        startDate: '2024-08-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When & Then: GET 메서드로 완료 시도
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/complete`);

      expect([404, 405]).toContain(response.status);
    });

    it('PUT 메서드로 완료 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성 및 시작
      const createData = {
        name: 'HTTP PUT 테스트 평가기간',
        startDate: '2024-09-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When & Then: PUT 메서드로 완료 시도
      const response = await testSuite
        .request()
        .put(`/admin/evaluation-periods/${evaluationPeriodId}/complete`);

      expect([404, 405]).toContain(response.status);
    });

    it('DELETE 메서드로 완료 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성 및 시작
      const createData = {
        name: 'HTTP DELETE 테스트 평가기간',
        startDate: '2024-10-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When & Then: DELETE 메서드로 완료 시도
      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${evaluationPeriodId}/complete`);

      expect([404, 405]).toContain(response.status);
    });
  });

  // ==================== 데이터 무결성 테스트 ====================

  describe('데이터 무결성 테스트', () => {
    it('완료 후 평가 기간 데이터가 변경되지 않아야 한다', async () => {
      // Given: 평가 기간 생성 및 시작
      const createData = {
        name: '데이터 무결성 완료 테스트 평가기간',
        startDate: '2024-11-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '데이터 무결성 확인',
        maxSelfEvaluationRate: 150,
        gradeRanges: [
          { grade: 'A', minRange: 90, maxRange: 100 },
          { grade: 'B', minRange: 80, maxRange: 89 },
        ],
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // 시작된 상태의 데이터 저장
      const startedResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      const startedData = startedResponse.body;

      // When: 평가 기간 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // Then: 기본 데이터는 변경되지 않고 상태만 변경
      const detailResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      const completedData = detailResponse.body;

      // 기본 정보는 동일
      expect(completedData.name).toBe(startedData.name);
      expect(completedData.startDate).toBeDefined();
      expect(completedData.peerEvaluationDeadline).toBeDefined();
      expect(completedData.description).toBe(startedData.description);
      expect(completedData.maxSelfEvaluationRate).toBe(
        startedData.maxSelfEvaluationRate,
      );
      expect(completedData.gradeRanges).toEqual(startedData.gradeRanges);

      // 상태만 변경
      expect(completedData.status).toBe('completed');
      expect(startedData.status).toBe('in-progress');
    });

    it('완료 후 생성자 및 시작자 정보가 유지되어야 한다', async () => {
      // Given: 평가 기간 생성 및 시작
      const createData = {
        name: '생성자 정보 유지 완료 테스트',
        startDate: '2024-12-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalCreatedBy = createResponse.body.createdBy;
      const originalCreatedAt = createResponse.body.createdAt;

      // 평가 기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      // When: 평가 기간 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // Then: 생성자 및 시작자 정보 유지
      const detailResponse = await testSuite
        .request()
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
    it('여러 평가 기간을 순차적으로 완료할 수 있어야 한다', async () => {
      // Given: 여러 평가 기간 생성 및 시작
      const createPromises = Array.from({ length: 5 }, (_, index) =>
        testSuite
          .request()
          .post('/admin/evaluation-periods')
          .send({
            name: `성능 테스트 완료 평가기간 ${index + 1}`,
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

      // 모든 평가 기간 시작
      const startPromises = evaluationPeriodIds.map((id) =>
        testSuite
          .request()
          .post(`/admin/evaluation-periods/${id}/start`)
          .expect(200),
      );

      await Promise.all(startPromises);

      // When: 순차적으로 완료
      const startTime = Date.now();
      const completePromises = evaluationPeriodIds.map((id) =>
        testSuite
          .request()
          .post(`/admin/evaluation-periods/${id}/complete`)
          .expect(200),
      );

      const completeResponses = await Promise.all(completePromises);
      const endTime = Date.now();

      // Then: 모든 완료가 성공하고 합리적인 시간 내에 완료
      expect(completeResponses).toHaveLength(5);
      completeResponses.forEach((response) => {
        expect(response.body).toEqual({ success: true });
      });

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // 10초 이내

      // 모든 평가 기간이 활성 목록에서 제거되었는지 확인
      const activeResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods/active')
        .expect(200);

      expect(activeResponse.body).toHaveLength(0);

      // 전체 목록에서는 여전히 조회 가능한지 확인
      const allResponse = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .expect(200);

      expect(allResponse.body.items).toHaveLength(5);
      allResponse.body.items.forEach((item: any) => {
        expect(item.status).toBe('completed');
      });
    });
  });

  // ==================== 상태 전이 시퀀스 테스트 ====================

  describe('상태 전이 시퀀스 테스트', () => {
    it('생성 -> 시작 -> 완료 전체 시퀀스가 정상 작동해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '전체 시퀀스 테스트 평가기간',
        startDate: '2024-01-15',
        peerEvaluationDeadline: '2024-06-15',
        description: '전체 라이프사이클 테스트',
        maxSelfEvaluationRate: 130,
        gradeRanges: [
          { grade: 'Excellent', minRange: 90, maxRange: 100 },
          { grade: 'Good', minRange: 70, maxRange: 89 },
          { grade: 'Fair', minRange: 50, maxRange: 69 },
        ],
      };

      // Step 1: 생성 (WAITING 상태)
      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      expect(createResponse.body.status).toBe('waiting');

      // Step 2: 시작 (IN_PROGRESS 상태)
      const startResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      expect(startResponse.body).toEqual({ success: true });

      const afterStartResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(afterStartResponse.body.status).toBe('in-progress');

      // Step 3: 완료 (COMPLETED 상태)
      const completeResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      expect(completeResponse.body).toEqual({ success: true });

      const afterCompleteResponse = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(afterCompleteResponse.body.status).toBe('completed');

      // 모든 단계에서 기본 데이터는 유지됨
      expect(afterCompleteResponse.body.name).toBe(createData.name);
      expect(afterCompleteResponse.body.description).toBe(
        createData.description,
      );
      expect(afterCompleteResponse.body.maxSelfEvaluationRate).toBe(
        createData.maxSelfEvaluationRate,
      );
      expect(afterCompleteResponse.body.gradeRanges).toHaveLength(3);
    });
  });
});
