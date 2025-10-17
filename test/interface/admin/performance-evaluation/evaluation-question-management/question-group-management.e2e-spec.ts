import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 평가 질문 그룹 관리 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/evaluation-questions/question-groups (질문 그룹 생성)
 * - PATCH /admin/performance-evaluation/evaluation-questions/question-groups/:id (질문 그룹 수정)
 * - DELETE /admin/performance-evaluation/evaluation-questions/question-groups/:id (질문 그룹 삭제)
 * - GET /admin/performance-evaluation/evaluation-questions/question-groups/:id (질문 그룹 조회)
 * - GET /admin/performance-evaluation/evaluation-questions/question-groups (질문 그룹 목록 조회)
 */
describe('평가 질문 그룹 관리 API', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;

  const BASE_URL = '/admin/performance-evaluation/evaluation-questions';

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /question-groups - 질문 그룹 생성', () => {
    describe('성공 케이스', () => {
      it('기본 생성: 그룹명을 지정하여 질문 그룹을 생성할 수 있어야 한다', async () => {
        // Given
        const createDto = {
          name: '기본 평가 그룹',
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          '질문 그룹이 성공적으로 생성되었습니다.',
        );
        expect(response.body.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });

      it('기본 그룹 설정: isDefault를 true로 설정하여 기본 그룹을 생성할 수 있어야 한다', async () => {
        // Given
        const createDto = {
          name: '기본 그룹',
          isDefault: true,
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');

        // 생성된 그룹 조회하여 isDefault 확인
        const getResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${response.body.id}`)
          .expect(200);

        expect(getResponse.body.isDefault).toBe(true);
      });

      it('createdBy 포함: 생성자 ID를 포함하여 그룹을 생성할 수 있어야 한다', async () => {
        // Given
        const createDto = {
          name: '평가 그룹 with createdBy',
          createdBy: '123e4567-e89b-12d3-a456-426614174000',
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
      });

      it('응답 구조 검증: 응답에 id와 message 필드가 포함되어야 한다', async () => {
        // Given
        const createDto = {
          name: '응답 구조 검증 그룹',
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.message).toBe('string');
      });
    });

    describe('실패 케이스', () => {
      it('그룹명 중복: 동일한 그룹명으로 생성 시 409 에러가 발생해야 한다', async () => {
        // Given - 첫 번째 그룹 생성
        const createDto = {
          name: '중복 테스트 그룹',
        };

        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(201);

        // When & Then - 동일한 이름으로 다시 생성 시도
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(409);
      });

      it('그룹명 누락: name 필드 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const createDto = {};

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(400);
      });

      it('빈 그룹명: 빈 문자열로 생성 시 400 에러가 발생해야 한다', async () => {
        // Given
        const createDto = {
          name: '',
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(400);
      });

      it('공백만 포함된 그룹명: 공백만 포함된 그룹명으로 생성 시 400 에러가 발생해야 한다', async () => {
        // Given
        const createDto = {
          name: '   ',
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send(createDto)
          .expect(400);
      });
    });
  });

  describe('PATCH /question-groups/:id - 질문 그룹 수정', () => {
    describe('성공 케이스', () => {
      it('그룹명 수정: name 필드로 그룹명을 변경할 수 있어야 한다', async () => {
        // Given - 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '수정 전 그룹명' })
          .expect(201);

        const groupId = createResponse.body.id;

        // When - 그룹명 수정
        const updateDto = {
          name: '수정 후 그룹명',
        };

        const updateResponse = await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${groupId}`)
          .send(updateDto)
          .expect(200);

        // Then
        expect(updateResponse.body).toHaveProperty('id', groupId);
        expect(updateResponse.body).toHaveProperty('message');
        expect(updateResponse.body.message).toBe(
          '질문 그룹이 성공적으로 수정되었습니다.',
        );

        // 변경 확인
        const getResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${groupId}`)
          .expect(200);

        expect(getResponse.body.name).toBe('수정 후 그룹명');
      });

      it('기본 그룹 설정: isDefault를 true로 변경하여 기본 그룹으로 설정할 수 있어야 한다', async () => {
        // Given - 일반 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '일반 그룹', isDefault: false })
          .expect(201);

        const groupId = createResponse.body.id;

        // When - 기본 그룹으로 설정
        const updateDto = {
          isDefault: true,
        };

        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${groupId}`)
          .send(updateDto)
          .expect(200);

        // Then - 기본 그룹 설정 확인
        const getResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${groupId}`)
          .expect(200);

        expect(getResponse.body.isDefault).toBe(true);
      });

      it('부분 수정: 일부 필드만 포함하여 수정할 수 있어야 한다', async () => {
        // Given - 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '부분 수정 테스트 그룹', isDefault: false })
          .expect(201);

        const groupId = createResponse.body.id;

        // When - name만 수정 (isDefault는 변경하지 않음)
        const updateDto = {
          name: '부분 수정 완료',
        };

        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${groupId}`)
          .send(updateDto)
          .expect(200);

        // Then
        const getResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${groupId}`)
          .expect(200);

        expect(getResponse.body.name).toBe('부분 수정 완료');
        expect(getResponse.body.isDefault).toBe(false); // 변경되지 않음
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const updateDto = {
          name: '수정 시도',
        };

        // When & Then
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${nonExistentId}`)
          .send(updateDto)
          .expect(404);
      });

      it('그룹명 중복: 다른 그룹과 중복되는 이름으로 변경 시 409 에러가 발생해야 한다', async () => {
        // Given - 두 개의 그룹 생성
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '기존 그룹 A' })
          .expect(201);

        const createResponseB = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '기존 그룹 B' })
          .expect(201);

        // When & Then - 그룹 B를 그룹 A와 동일한 이름으로 변경 시도
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${createResponseB.body.id}`)
          .send({ name: '기존 그룹 A' })
          .expect(409);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';
        const updateDto = {
          name: '수정 시도',
        };

        // When & Then
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${invalidId}`)
          .send(updateDto)
          .expect(400);
      });

      it('빈 그룹명으로 수정: 빈 문자열로 수정 시 400 에러가 발생해야 한다', async () => {
        // Given - 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '정상 그룹명' })
          .expect(201);

        // When & Then - 빈 문자열로 수정 시도
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-groups/${createResponse.body.id}`)
          .send({ name: '' })
          .expect(400);
      });
    });
  });

  describe('DELETE /question-groups/:id - 질문 그룹 삭제', () => {
    describe('성공 케이스', () => {
      it('정상 삭제: 삭제 가능한 그룹을 삭제할 수 있어야 한다', async () => {
        // Given - 삭제 가능한 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '삭제 가능 그룹' })
          .expect(201);

        const groupId = createResponse.body.id;

        // When - 그룹 삭제
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-groups/${groupId}`)
          .expect(204);

        // Then - 삭제된 그룹 조회 시 404 에러
        await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${groupId}`)
          .expect(404);
      });
    });

    describe('실패 케이스', () => {
      it('기본 그룹 삭제 시도: isDefault가 true인 그룹 삭제 시 403 에러가 발생해야 한다', async () => {
        // Given - 기본 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '기본 그룹', isDefault: true })
          .expect(201);

        const groupId = createResponse.body.id;

        // When & Then - 기본 그룹 삭제 시도
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-groups/${groupId}`)
          .expect(403);
      });

      it('존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-groups/${nonExistentId}`)
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-groups/${invalidId}`)
          .expect(400);
      });
    });
  });

  describe('GET /question-groups/:id - 질문 그룹 조회', () => {
    describe('성공 케이스', () => {
      it('정상 조회: 유효한 ID로 그룹 정보를 조회할 수 있어야 한다', async () => {
        // Given - 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '조회 테스트 그룹', isDefault: false })
          .expect(201);

        const groupId = createResponse.body.id;

        // When - 그룹 조회
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${groupId}`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id', groupId);
        expect(response.body).toHaveProperty('name', '조회 테스트 그룹');
        expect(response.body).toHaveProperty('isDefault', false);
        expect(response.body).toHaveProperty('isDeletable');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('응답 구조 검증: 응답에 id, name, isDefault, isDeletable 등의 필드가 포함되어야 한다', async () => {
        // Given - 그룹 생성
        const createResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '응답 구조 검증 그룹' })
          .expect(201);

        // When - 그룹 조회
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${createResponse.body.id}`)
          .expect(200);

        // Then - 필수 필드 확인
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('isDefault');
        expect(response.body).toHaveProperty('isDeletable');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');

        // 타입 확인
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.name).toBe('string');
        expect(typeof response.body.isDefault).toBe('boolean');
        expect(typeof response.body.isDeletable).toBe('boolean');
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 그룹: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${nonExistentId}`)
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${invalidId}`)
          .expect(400);
      });
    });
  });

  describe('GET /question-groups - 질문 그룹 목록 조회', () => {
    describe('성공 케이스', () => {
      it('목록 조회: 모든 질문 그룹을 조회할 수 있어야 한다', async () => {
        // Given - 여러 그룹 생성
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '그룹 1' })
          .expect(201);

        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '그룹 2' })
          .expect(201);

        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '그룹 3' })
          .expect(201);

        // When - 목록 조회
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);
        expect(response.body.some((group) => group.name === '그룹 1')).toBe(
          true,
        );
        expect(response.body.some((group) => group.name === '그룹 2')).toBe(
          true,
        );
        expect(response.body.some((group) => group.name === '그룹 3')).toBe(
          true,
        );
      });

      it('빈 목록: 그룹이 없을 때 빈 배열을 반환해야 한다', async () => {
        // Given - 그룹이 없는 상태

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('응답 구조 검증: 각 그룹 항목에 필수 필드가 포함되어야 한다', async () => {
        // Given - 그룹 생성
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '테스트 그룹' })
          .expect(201);

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups`)
          .expect(200);

        // Then
        expect(response.body.length).toBeGreaterThan(0);
        const firstGroup = response.body[0];
        expect(firstGroup).toHaveProperty('id');
        expect(firstGroup).toHaveProperty('name');
        expect(firstGroup).toHaveProperty('isDefault');
        expect(firstGroup).toHaveProperty('isDeletable');
      });
    });
  });

  describe('데이터 무결성 테스트', () => {
    it('Soft Delete: 삭제된 그룹은 목록 조회에서 제외되어야 한다', async () => {
      // Given - 그룹 생성
      const createResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-groups`)
        .send({ name: 'Soft Delete 테스트 그룹' })
        .expect(201);

      const groupId = createResponse.body.id;

      // 생성 직후 목록 조회
      const beforeDeleteResponse = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups`)
        .expect(200);

      const beforeCount = beforeDeleteResponse.body.length;

      // When - 그룹 삭제
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/question-groups/${groupId}`)
        .expect(204);

      // Then - 삭제 후 목록 조회
      const afterDeleteResponse = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups`)
        .expect(200);

      expect(afterDeleteResponse.body.length).toBe(beforeCount - 1);
      expect(
        afterDeleteResponse.body.some((group) => group.id === groupId),
      ).toBe(false);
    });

    it('생성 후 조회: 생성된 그룹이 즉시 조회 가능해야 한다', async () => {
      // Given & When - 그룹 생성
      const createResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-groups`)
        .send({ name: '생성 후 조회 테스트' })
        .expect(201);

      const groupId = createResponse.body.id;

      // Then - 즉시 조회 가능
      const getResponse = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${groupId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(groupId);
      expect(getResponse.body.name).toBe('생성 후 조회 테스트');
    });

    it('수정 후 조회: 수정된 내용이 즉시 반영되어야 한다', async () => {
      // Given - 그룹 생성
      const createResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-groups`)
        .send({ name: '수정 전' })
        .expect(201);

      const groupId = createResponse.body.id;

      // When - 그룹 수정
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/question-groups/${groupId}`)
        .send({ name: '수정 후' })
        .expect(200);

      // Then - 수정 내용 즉시 반영 확인
      const getResponse = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${groupId}`)
        .expect(200);

      expect(getResponse.body.name).toBe('수정 후');
    });

    it('기본 그룹 전환: 새로운 기본 그룹 설정 시 기존 기본 그룹은 해제되어야 한다', async () => {
      // Given - 첫 번째 기본 그룹 생성
      const firstGroupResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-groups`)
        .send({ name: '첫 번째 기본 그룹', isDefault: true })
        .expect(201);

      const firstGroupId = firstGroupResponse.body.id;

      // 두 번째 일반 그룹 생성
      const secondGroupResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-groups`)
        .send({ name: '두 번째 그룹', isDefault: false })
        .expect(201);

      const secondGroupId = secondGroupResponse.body.id;

      // When - 두 번째 그룹을 기본 그룹으로 설정
      await request(app.getHttpServer())
        .patch(`${BASE_URL}/question-groups/${secondGroupId}`)
        .send({ isDefault: true })
        .expect(200);

      // Then - 첫 번째 그룹은 기본 그룹이 아니어야 함
      const firstGroupGet = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${firstGroupId}`)
        .expect(200);

      expect(firstGroupGet.body.isDefault).toBe(false);

      // 두 번째 그룹은 기본 그룹이어야 함
      const secondGroupGet = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${secondGroupId}`)
        .expect(200);

      expect(secondGroupGet.body.isDefault).toBe(true);
    });
  });

  describe('GET /question-groups/default - 기본 질문 그룹 조회', () => {
    describe('성공 케이스', () => {
      it('기본 그룹 조회: isDefault가 true인 그룹을 조회할 수 있어야 한다', async () => {
        // Given - 기본 그룹 생성
        const groupResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '기본 그룹', isDefault: true })
          .expect(201);

        const groupId = groupResponse.body.id;

        // When - 기본 그룹 조회
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/default`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id', groupId);
        expect(response.body).toHaveProperty('name', '기본 그룹');
        expect(response.body).toHaveProperty('isDefault', true);
      });

      it('응답 구조 검증: 응답에 id, name, isDefault, isDeletable 등의 필드가 포함되어야 한다', async () => {
        // Given - 기본 그룹 생성
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '기본 그룹', isDefault: true })
          .expect(201);

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/default`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('isDefault');
        expect(response.body).toHaveProperty('isDeletable');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.name).toBe('string');
        expect(typeof response.body.isDefault).toBe('boolean');
        expect(typeof response.body.isDeletable).toBe('boolean');
      });
    });

    describe('실패 케이스', () => {
      it('기본 그룹 없음: 기본 그룹이 설정되지 않은 경우 404 에러가 발생해야 한다', async () => {
        // Given - 일반 그룹만 생성 (isDefault: false)
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-groups`)
          .send({ name: '일반 그룹', isDefault: false })
          .expect(201);

        // When & Then - 기본 그룹이 없으므로 404 에러
        await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/default`)
          .expect(404);
      });
    });
  });
});
