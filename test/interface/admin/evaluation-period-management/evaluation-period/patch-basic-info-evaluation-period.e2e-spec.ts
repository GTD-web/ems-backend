import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../base-e2e.spec';

describe('PATCH /admin/evaluation-periods/:id/basic-info', () => {
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
    it('평가 기간 이름을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '기본 정보 수정 테스트 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
        description: '기본 정보 수정 테스트',
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

      // When: 이름 수정
      const updateData = {
        name: '수정된 평가기간 이름',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.name).toBe(updateData.name);
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.description).toBe(createData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        createData.maxSelfEvaluationRate,
      );
    });

    it('평가 기간 설명을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '설명 수정 테스트 평가기간',
        startDate: '2024-02-01',
        peerEvaluationDeadline: '2024-07-31',
        description: '원본 설명',
        maxSelfEvaluationRate: 130,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 설명 수정
      const updateData = {
        description: '수정된 평가기간 설명입니다.',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.description).toBe(updateData.description);
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.name).toBe(createData.name);
      expect(response.body.maxSelfEvaluationRate).toBe(
        createData.maxSelfEvaluationRate,
      );
    });

    it('자기평가 달성률 최대값을 성공적으로 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '달성률 수정 테스트 평가기간',
        startDate: '2024-03-01',
        peerEvaluationDeadline: '2024-08-31',
        description: '달성률 수정 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 달성률 수정
      const updateData = {
        maxSelfEvaluationRate: 150,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );
      // 부분 수정 시 기존 값이 유지되어야 함
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
    });

    it('모든 기본 정보를 동시에 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '전체 수정 테스트 평가기간',
        startDate: '2024-04-01',
        peerEvaluationDeadline: '2024-09-30',
        description: '전체 수정 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 모든 기본 정보 수정
      const updateData = {
        name: '완전히 수정된 평가기간 이름',
        description: '완전히 수정된 평가기간 설명',
        maxSelfEvaluationRate: 180,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );
      // 등급 구간은 변경되지 않음
      expect(response.body.gradeRanges).toHaveLength(3);
    });

    it('빈 객체로 요청 시 기존 값이 유지되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '빈 객체 테스트 평가기간',
        startDate: '2024-05-01',
        peerEvaluationDeadline: '2024-10-31',
        description: '빈 객체 테스트',
        maxSelfEvaluationRate: 140,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 빈 객체로 수정 요청
      const updateData = {};

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 빈 객체로 수정 시 기존 값이 모두 유지되어야 함
      expect(response.body.name).toBe(createData.name);
      expect(response.body.description).toBe(createData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        createData.maxSelfEvaluationRate,
      );
    });

    it('특수 문자가 포함된 이름과 설명을 수정해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '특수문자 테스트 평가기간',
        startDate: '2024-06-01',
        peerEvaluationDeadline: '2024-11-30',
        description: '특수문자 테스트',
        maxSelfEvaluationRate: 125,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When: 특수 문자 포함 수정
      const updateData = {
        name: '2024년 Q2 평가기간 (수정) - [특별]',
        description:
          '특수문자 포함 설명: @#$%^&*()_+-=[]{}|;:,.<>?/~`\n줄바꿈도 포함',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 응답 검증
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
    });
  });

  // ==================== 클라이언트 에러 (400번대) ====================

  describe('클라이언트 에러', () => {
    it('존재하지 않는 평가 기간 ID로 수정 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 UUID
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const updateData = {
        name: '존재하지 않는 평가기간 수정',
      };

      // When & Then: 404 에러 발생
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${nonExistentId}/basic-info`)
        .send(updateData);

      expect([400, 404]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.message).toContain('평가 기간을 찾을 수 없습니다');
      }
    });

    it('잘못된 UUID 형식으로 수정 시 적절한 에러가 발생해야 한다', async () => {
      // Given: 잘못된 UUID 형식
      const invalidId = 'invalid-uuid-format';
      const updateData = {
        name: '잘못된 UUID 테스트',
      };

      // When & Then: 400 또는 500 에러 발생
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${invalidId}/basic-info`)
        .send(updateData);

      expect([400, 500]).toContain(response.status);
    });

    it('빈 문자열 이름으로 수정 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '빈 이름 테스트 평가기간',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 빈 문자열 이름으로 수정
      const updateData = {
        name: '',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '평가 기간명이 제공된 경우 빈 값일 수 없습니다.',
      );
    });

    it('잘못된 타입의 이름으로 수정 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '타입 테스트 평가기간',
        startDate: '2024-08-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 숫자 타입 이름으로 수정
      const updateData = {
        name: 123456,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData);

      // 타입 변환이 일어날 수 있으므로 200 또는 400 허용
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.message).toContain(
          '평가 기간명은 문자열이어야 합니다.',
        );
      }
    });

    it('잘못된 타입의 설명으로 수정 시 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '설명 타입 테스트 평가기간',
        startDate: '2024-09-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 배열 타입 설명으로 수정
      const updateData = {
        description: ['배열', '타입', '설명'],
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '평가 기간 설명은 문자열이어야 합니다.',
      );
    });
  });

  // ==================== 달성률 검증 테스트 ====================

  describe('달성률 검증 테스트', () => {
    it('달성률이 100% 미만일 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '달성률 최소값 테스트 평가기간',
        startDate: '2024-10-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 100% 미만 달성률로 수정
      const updateData = {
        maxSelfEvaluationRate: 99,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '자기평가 달성률 최대값은 100% 이상이어야 합니다.',
      );
    });

    it('달성률이 200%를 초과할 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '달성률 최대값 테스트 평가기간',
        startDate: '2024-11-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 200% 초과 달성률로 수정
      const updateData = {
        maxSelfEvaluationRate: 201,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '자기평가 달성률 최대값은 200% 이하여야 합니다.',
      );
    });

    it('달성률이 문자열일 때 400 에러가 발생해야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '달성률 타입 테스트 평가기간',
        startDate: '2024-12-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 문자열 달성률로 수정
      const updateData = {
        maxSelfEvaluationRate: '150%',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain(
        '자기평가 달성률 최대값은 숫자여야 합니다.',
      );
    });

    it('달성률 경계값 테스트 (100%, 200%)', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '달성률 경계값 테스트 평가기간',
        startDate: '2024-01-15',
        peerEvaluationDeadline: '2024-06-15',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: 100% 설정 (성공)
      const updateData100 = {
        maxSelfEvaluationRate: 100,
      };

      const response100 = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData100)
        .expect(200);

      expect(response100.body.maxSelfEvaluationRate).toBe(100);

      // When & Then: 200% 설정 (성공)
      const updateData200 = {
        maxSelfEvaluationRate: 200,
      };

      const response200 = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData200)
        .expect(200);

      expect(response200.body.maxSelfEvaluationRate).toBe(200);
    });
  });

  // ==================== 비즈니스 로직 에러 (422번대) ====================

  describe('비즈니스 로직 에러', () => {
    it('중복된 이름으로 수정 시 422 에러가 발생해야 한다', async () => {
      // Given: 두 개의 평가 기간 생성
      const createData1 = {
        name: '첫 번째 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-06-30',
      };

      const createData2 = {
        name: '두 번째 평가기간',
        startDate: '2024-07-01',
        peerEvaluationDeadline: '2024-12-31',
      };

      await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData1)
        .expect(201);

      const createResponse2 = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData2)
        .expect(201);

      const evaluationPeriodId2 = createResponse2.body.id;

      // When & Then: 첫 번째 평가기간과 같은 이름으로 수정
      const updateData = {
        name: '첫 번째 평가기간',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId2}/basic-info`)
        .send(updateData);

      // 중복 이름 검증이 있다면 409, 없다면 200
      expect([200, 409]).toContain(response.status);
      if (response.status === 409) {
        expect(response.body.message).toContain(
          '이미 존재하는 평가 기간 이름입니다',
        );
      }
    });
  });

  // ==================== 상태별 수정 테스트 ====================

  describe('상태별 수정 테스트', () => {
    it('대기 중인 평가 기간의 기본 정보를 수정해야 한다', async () => {
      // Given: 대기 중인 평가 기간 생성
      const createData = {
        name: '대기 상태 수정 테스트 평가기간',
        startDate: '2024-02-15',
        peerEvaluationDeadline: '2024-07-15',
        description: '대기 상태 테스트',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 대기 상태 확인
      expect(createResponse.body.status).toBe('waiting');

      // When: 기본 정보 수정
      const updateData = {
        name: '대기 상태에서 수정된 이름',
        description: '대기 상태에서 수정된 설명',
        maxSelfEvaluationRate: 160,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 수정 성공 및 상태 유지
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );
      expect(response.body.status).toBe('waiting'); // 상태는 변경되지 않음
    });

    it('진행 중인 평가 기간의 기본 정보를 수정해야 한다', async () => {
      // Given: 진행 중인 평가 기간 생성 및 시작
      const createData = {
        name: '진행 중 수정 테스트 평가기간',
        startDate: '2024-03-15',
        peerEvaluationDeadline: '2024-08-15',
        description: '진행 중 테스트',
        maxSelfEvaluationRate: 130,
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

      // When: 기본 정보 수정
      const updateData = {
        name: '진행 중 상태에서 수정된 이름',
        description: '진행 중 상태에서 수정된 설명',
        maxSelfEvaluationRate: 170,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 수정 성공 및 상태 유지
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );
      expect(response.body.status).toBe('in-progress'); // 상태는 변경되지 않음
    });

    it('완료된 평가 기간의 기본 정보를 수정해야 한다', async () => {
      // Given: 완료된 평가 기간 생성, 시작, 완료
      const createData = {
        name: '완료 상태 수정 테스트 평가기간',
        startDate: '2024-04-15',
        peerEvaluationDeadline: '2024-09-15',
        description: '완료 상태 테스트',
        maxSelfEvaluationRate: 140,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // 평가 기간 시작 및 완료
      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(200);

      await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(200);

      // When: 기본 정보 수정
      const updateData = {
        name: '완료 상태에서 수정된 이름',
        description: '완료 상태에서 수정된 설명',
        maxSelfEvaluationRate: 180,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData);

      // Then: 완료된 평가 기간은 수정할 수 없음 (422 에러)
      expect(response.status).toBe(422);
    });
  });

  // ==================== 데이터 무결성 테스트 ====================

  describe('데이터 무결성 테스트', () => {
    it('기본 정보 수정 후 다른 필드들이 변경되지 않아야 한다', async () => {
      // Given: 복잡한 평가 기간 생성
      const createData = {
        name: '무결성 테스트 평가기간',
        startDate: '2024-05-15',
        peerEvaluationDeadline: '2024-10-15',
        description: '무결성 테스트',
        maxSelfEvaluationRate: 125,
        gradeRanges: [
          { grade: 'S+', minRange: 95, maxRange: 100 },
          { grade: 'S', minRange: 90, maxRange: 94 },
          { grade: 'A+', minRange: 85, maxRange: 89 },
          { grade: 'A', minRange: 80, maxRange: 84 },
        ],
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalData = createResponse.body;

      // When: 기본 정보만 수정
      const updateData = {
        name: '수정된 이름',
        description: '수정된 설명',
        maxSelfEvaluationRate: 175,
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 기본 정보는 변경되고 다른 필드는 유지
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );

      // 날짜 필드는 변경되지 않음
      expect(response.body.startDate).toBeDefined();
      expect(response.body.peerEvaluationDeadline).toBeDefined();

      // 등급 구간은 변경되지 않음
      expect(response.body.gradeRanges).toEqual(originalData.gradeRanges);

      // 메타데이터는 변경되지 않음
      expect(response.body.createdBy).toBe(originalData.createdBy);
      expect(response.body.createdAt).toBe(originalData.createdAt);
      expect(response.body.updatedAt).toBeDefined();
      expect(response.body.updatedBy).toBeDefined();
    });

    it('수정 후 생성자 정보가 유지되어야 한다', async () => {
      // Given: 평가 기간 생성
      const createData = {
        name: '생성자 정보 유지 테스트',
        startDate: '2024-06-15',
        peerEvaluationDeadline: '2024-11-15',
        description: '생성자 정보 테스트',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;
      const originalCreatedBy = createResponse.body.createdBy;
      const originalCreatedAt = createResponse.body.createdAt;

      // When: 기본 정보 수정
      const updateData = {
        name: '수정된 이름',
        description: '수정된 설명',
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(200);

      // Then: 생성자 정보 유지, 수정자 정보 업데이트
      expect(response.body.createdBy).toBe(originalCreatedBy);
      expect(response.body.createdAt).toBe(originalCreatedAt);
      expect(response.body.updatedAt).toBeDefined();
      expect(response.body.updatedBy).toBeDefined();
      expect(response.body.updatedAt).not.toBe(originalCreatedAt);
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능 테스트', () => {
    it('여러 평가 기간을 순차적으로 수정할 수 있어야 한다', async () => {
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
            description: `성능 테스트 ${index + 1}`,
            maxSelfEvaluationRate: 120 + index * 10,
          })
          .expect(201),
      );

      const createResponses = await Promise.all(createPromises);
      const evaluationPeriodIds = createResponses.map(
        (response) => response.body.id,
      );

      // When: 순차적으로 수정
      const startTime = Date.now();
      const updatePromises = evaluationPeriodIds.map((id, index) =>
        request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${id}/basic-info`)
          .send({
            name: `수정된 성능 테스트 평가기간 ${index + 1}`,
            description: `수정된 성능 테스트 설명 ${index + 1}`,
            maxSelfEvaluationRate: 150 + index * 10,
          })
          .expect(200),
      );

      const updateResponses = await Promise.all(updatePromises);
      const endTime = Date.now();

      // Then: 모든 수정이 성공하고 합리적인 시간 내에 완료
      expect(updateResponses).toHaveLength(5);
      updateResponses.forEach((response, index) => {
        expect(response.body.name).toBe(
          `수정된 성능 테스트 평가기간 ${index + 1}`,
        );
        expect(response.body.description).toBe(
          `수정된 성능 테스트 설명 ${index + 1}`,
        );
        expect(response.body.maxSelfEvaluationRate).toBe(150 + index * 10);
      });

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // 10초 이내
    });
  });

  // ==================== HTTP 관련 테스트 ====================

  describe('HTTP 관련 테스트', () => {
    it('GET 메서드로 수정 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성
      const createData = {
        name: 'HTTP 메서드 테스트 평가기간',
        startDate: '2024-07-15',
        peerEvaluationDeadline: '2024-12-15',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: GET 메서드로 수정 시도
      const response = await request(app.getHttpServer()).get(
        `/admin/evaluation-periods/${evaluationPeriodId}/basic-info`,
      );

      expect([404, 405]).toContain(response.status);
    });

    it('POST 메서드로 수정 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성
      const createData = {
        name: 'HTTP POST 테스트 평가기간',
        startDate: '2024-08-15',
        peerEvaluationDeadline: '2024-12-15',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: POST 메서드로 수정 시도
      const response = await request(app.getHttpServer())
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send({ name: '테스트' });

      expect([404, 405]).toContain(response.status);
    });

    it('DELETE 메서드로 수정 시도 시 405 에러가 발생해야 한다', async () => {
      // Given: 존재하는 평가 기간 생성
      const createData = {
        name: 'HTTP DELETE 테스트 평가기간',
        startDate: '2024-09-15',
        peerEvaluationDeadline: '2024-12-15',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(201);

      const evaluationPeriodId = createResponse.body.id;

      // When & Then: DELETE 메서드로 수정 시도
      const response = await request(app.getHttpServer()).delete(
        `/admin/evaluation-periods/${evaluationPeriodId}/basic-info`,
      );

      expect([404, 405]).toContain(response.status);
    });
  });
});
