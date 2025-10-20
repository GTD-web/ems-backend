import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 평가 질문 관리 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/evaluation-questions/evaluation-questions (평가 질문 생성)
 * - PATCH /admin/performance-evaluation/evaluation-questions/evaluation-questions/:id (평가 질문 수정)
 * - DELETE /admin/performance-evaluation/evaluation-questions/evaluation-questions/:id (평가 질문 삭제)
 * - GET /admin/performance-evaluation/evaluation-questions/evaluation-questions/:id (평가 질문 조회)
 * - GET /admin/performance-evaluation/evaluation-questions/evaluation-questions (평가 질문 목록 조회)
 * - POST /admin/performance-evaluation/evaluation-questions/evaluation-questions/:id/copy (평가 질문 복사)
 */
describe('평가 질문 관리 API', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;

  const BASE_URL = '/admin/performance-evaluation/evaluation-questions';

  // 테스트용 질문 그룹 ID를 저장할 변수
  let testGroupId: string;

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

    // 테스트용 질문 그룹 생성
    const groupResponse = await testSuite
      .request()
      .post(`${BASE_URL}/question-groups`)
      .send({ name: '테스트 질문 그룹' })
      .expect(201);

    testGroupId = groupResponse.body.id;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /evaluation-questions - 평가 질문 생성', () => {
    describe('성공 케이스', () => {
      it('기본 생성: 질문 내용만 지정하여 생성할 수 있어야 한다', async () => {
        // Given
        const createDto = {
          text: '이 프로젝트에서 당신의 기여도를 평가해주세요.',
        };

        // When
        const response = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          '평가 질문이 성공적으로 생성되었습니다.',
        );
        expect(response.body.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });

      it('점수 범위 포함: minScore, maxScore를 포함하여 생성할 수 있어야 한다', async () => {
        // Given
        const createDto = {
          text: '업무 수행 능력을 평가해주세요.',
          minScore: 1,
          maxScore: 5,
        };

        // When
        const response = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');

        // 생성된 질문 조회하여 점수 범위 확인
        const getResponse = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${response.body.id}`)
          .expect(200);

        expect(getResponse.body.minScore).toBe(1);
        expect(getResponse.body.maxScore).toBe(5);
      });

      it('그룹 자동 추가: groupId와 displayOrder를 포함하여 생성 시 해당 그룹에 자동 추가되어야 한다', async () => {
        // Given
        const createDto = {
          text: '팀워크를 평가해주세요.',
          minScore: 0,
          maxScore: 100,
          groupId: testGroupId,
          displayOrder: 0,
        };

        // When
        const response = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');

        // 그룹의 질문 목록 조회하여 확인
        const groupQuestionsResponse = await testSuite
          .request()
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body.length).toBeGreaterThan(0);
        expect(
          groupQuestionsResponse.body.some(
            (mapping) => mapping.questionId === response.body.id,
          ),
        ).toBe(true);
      });

      it('응답 구조 검증: 응답에 id와 message 필드가 포함되어야 한다', async () => {
        // Given
        const createDto = {
          text: '응답 구조 검증용 질문',
        };

        // When
        const response = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
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
      it('질문 내용 중복: 동일한 질문 내용으로 생성 시 409 에러가 발생해야 한다', async () => {
        // Given - 첫 번째 질문 생성
        const createDto = {
          text: '중복 테스트 질문',
        };

        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(201);

        // When & Then - 동일한 내용으로 다시 생성 시도
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(409);
      });

      it('질문 내용 누락: text 필드 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const createDto = {};

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(400);
      });

      it('빈 질문 내용: 빈 문자열로 생성 시 400 에러가 발생해야 한다', async () => {
        // Given
        const createDto = {
          text: '',
        };

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(400);
      });

      it('공백만 포함된 질문: 공백만 포함된 질문으로 생성 시 400 에러가 발생해야 한다', async () => {
        // Given
        const createDto = {
          text: '   ',
        };

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto)
          .expect(400);
      });

      it('잘못된 점수 범위: minScore >= maxScore인 경우 400 에러가 발생해야 한다', async () => {
        // Given - minScore가 maxScore와 같은 경우
        const createDto1 = {
          text: '잘못된 점수 범위 1',
          minScore: 5,
          maxScore: 5,
        };

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto1)
          .expect(400);

        // Given - minScore가 maxScore보다 큰 경우
        const createDto2 = {
          text: '잘못된 점수 범위 2',
          minScore: 10,
          maxScore: 5,
        };

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send(createDto2)
          .expect(400);
      });
    });
  });

  describe('PATCH /evaluation-questions/:id - 평가 질문 수정', () => {
    describe('성공 케이스', () => {
      it('질문 내용 수정: text 필드로 질문 내용을 변경할 수 있어야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '수정 전 질문 내용' })
          .expect(201);

        const questionId = createResponse.body.id;

        // When - 질문 내용 수정
        const updateDto = {
          text: '수정 후 질문 내용',
        };

        const updateResponse = await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${questionId}`)
          .send(updateDto)
          .expect(200);

        // Then
        expect(updateResponse.body).toHaveProperty('id', questionId);
        expect(updateResponse.body).toHaveProperty('message');
        expect(updateResponse.body.message).toBe(
          '평가 질문이 성공적으로 수정되었습니다.',
        );

        // 변경 확인
        const getResponse = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${questionId}`)
          .expect(200);

        expect(getResponse.body.text).toBe('수정 후 질문 내용');
      });

      it('점수 범위 수정: minScore, maxScore를 변경할 수 있어야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({
            text: '점수 범위 수정 테스트',
            minScore: 1,
            maxScore: 5,
          })
          .expect(201);

        const questionId = createResponse.body.id;

        // When - 점수 범위 수정
        const updateDto = {
          minScore: 0,
          maxScore: 10,
        };

        await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${questionId}`)
          .send(updateDto)
          .expect(200);

        // Then - 변경 확인
        const getResponse = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${questionId}`)
          .expect(200);

        expect(getResponse.body.minScore).toBe(0);
        expect(getResponse.body.maxScore).toBe(10);
      });

      it('부분 수정: 일부 필드만 포함하여 수정할 수 있어야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({
            text: '부분 수정 테스트',
            minScore: 1,
            maxScore: 5,
          })
          .expect(201);

        const questionId = createResponse.body.id;

        // When - text만 수정 (점수 범위는 변경하지 않음)
        const updateDto = {
          text: '부분 수정 완료',
        };

        await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${questionId}`)
          .send(updateDto)
          .expect(200);

        // Then
        const getResponse = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${questionId}`)
          .expect(200);

        expect(getResponse.body.text).toBe('부분 수정 완료');
        expect(getResponse.body.minScore).toBe(1); // 변경되지 않음
        expect(getResponse.body.maxScore).toBe(5); // 변경되지 않음
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const updateDto = {
          text: '수정 시도',
        };

        // When & Then
        await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${nonExistentId}`)
          .send(updateDto)
          .expect(404);
      });

      it('질문 내용 중복: 다른 질문과 중복되는 내용으로 변경 시 409 에러가 발생해야 한다', async () => {
        // Given - 두 개의 질문 생성
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '기존 질문 A' })
          .expect(201);

        const createResponseB = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '기존 질문 B' })
          .expect(201);

        // When & Then - 질문 B를 질문 A와 동일한 내용으로 변경 시도
        await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${createResponseB.body.id}`)
          .send({ text: '기존 질문 A' })
          .expect(409);
      });

      it('잘못된 점수 범위: minScore >= maxScore인 경우 400 에러가 발생해야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '점수 범위 수정 테스트', minScore: 1, maxScore: 5 })
          .expect(201);

        // When & Then - 잘못된 점수 범위로 수정 시도
        await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${createResponse.body.id}`)
          .send({ minScore: 5, maxScore: 5 })
          .expect(400);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';
        const updateDto = {
          text: '수정 시도',
        };

        // When & Then
        await testSuite
          .request()
          .patch(`${BASE_URL}/evaluation-questions/${invalidId}`)
          .send(updateDto)
          .expect(400);
      });
    });
  });

  describe('DELETE /evaluation-questions/:id - 평가 질문 삭제', () => {
    describe('성공 케이스', () => {
      it('정상 삭제: 응답이 없는 질문을 삭제할 수 있어야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '삭제 가능 질문' })
          .expect(201);

        const questionId = createResponse.body.id;

        // When - 질문 삭제
        await testSuite
          .request()
          .delete(`${BASE_URL}/evaluation-questions/${questionId}`)
          .expect(204);

        // Then - 삭제된 질문 조회 시 404 에러
        await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${questionId}`)
          .expect(404);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .delete(`${BASE_URL}/evaluation-questions/${nonExistentId}`)
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await testSuite
          .request()
          .delete(`${BASE_URL}/evaluation-questions/${invalidId}`)
          .expect(400);
      });
    });
  });

  describe('GET /evaluation-questions/:id - 평가 질문 조회', () => {
    describe('성공 케이스', () => {
      it('정상 조회: 유효한 ID로 질문 정보를 조회할 수 있어야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({
            text: '조회 테스트 질문',
            minScore: 1,
            maxScore: 5,
          })
          .expect(201);

        const questionId = createResponse.body.id;

        // When - 질문 조회
        const response = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${questionId}`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id', questionId);
        expect(response.body).toHaveProperty('text', '조회 테스트 질문');
        expect(response.body).toHaveProperty('minScore', 1);
        expect(response.body).toHaveProperty('maxScore', 5);
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');
      });

      it('응답 구조 검증: 응답에 id, text, minScore, maxScore 등의 필드가 포함되어야 한다', async () => {
        // Given - 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '응답 구조 검증 질문' })
          .expect(201);

        // When - 질문 조회
        const response = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${createResponse.body.id}`)
          .expect(200);

        // Then - 필수 필드 확인
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('text');
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('updatedAt');

        // 타입 확인
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.text).toBe('string');
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${nonExistentId}`)
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${invalidId}`)
          .expect(400);
      });
    });
  });

  describe('GET /evaluation-questions - 평가 질문 목록 조회', () => {
    describe('성공 케이스', () => {
      it('목록 조회: 모든 평가 질문을 조회할 수 있어야 한다', async () => {
        // Given - 여러 질문 생성
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '질문 1' })
          .expect(201);

        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '질문 2' })
          .expect(201);

        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '질문 3' })
          .expect(201);

        // When - 목록 조회
        const response = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(3);
        expect(response.body.some((q) => q.text === '질문 1')).toBe(true);
        expect(response.body.some((q) => q.text === '질문 2')).toBe(true);
        expect(response.body.some((q) => q.text === '질문 3')).toBe(true);
      });

      it('빈 목록: 질문이 없을 때 빈 배열을 반환해야 한다', async () => {
        // Given - 질문이 없는 상태

        // When
        const response = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('응답 구조 검증: 각 질문 항목에 필수 필드가 포함되어야 한다', async () => {
        // Given - 질문 생성
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '테스트 질문' })
          .expect(201);

        // When
        const response = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions`)
          .expect(200);

        // Then
        expect(response.body.length).toBeGreaterThan(0);
        const firstQuestion = response.body[0];
        expect(firstQuestion).toHaveProperty('id');
        expect(firstQuestion).toHaveProperty('text');
      });
    });
  });

  describe('POST /evaluation-questions/:id/copy - 평가 질문 복사', () => {
    describe('성공 케이스', () => {
      it('정상 복사: 유효한 ID로 질문을 복사할 수 있어야 한다', async () => {
        // Given - 원본 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({
            text: '원본 질문',
            minScore: 1,
            maxScore: 5,
          })
          .expect(201);

        const originalId = createResponse.body.id;

        // When - 질문 복사
        const copyResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions/${originalId}/copy`)
          .send({})
          .expect(201);

        // Then
        expect(copyResponse.body).toHaveProperty('id');
        expect(copyResponse.body).toHaveProperty('message');
        expect(copyResponse.body.message).toBe(
          '평가 질문이 성공적으로 복사되었습니다.',
        );
        expect(copyResponse.body.id).not.toBe(originalId); // 새로운 ID

        // 복사된 질문 조회
        const copiedQuestion = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${copyResponse.body.id}`)
          .expect(200);

        expect(copiedQuestion.body.text).toContain('원본 질문');
        expect(copiedQuestion.body.text).toContain('(복사본)');
        expect(copiedQuestion.body.minScore).toBe(1);
        expect(copiedQuestion.body.maxScore).toBe(5);
      });

      it('복사본 표시: 복사된 질문 내용에 "(복사본)"이 포함되어야 한다', async () => {
        // Given - 원본 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '복사 테스트 질문' })
          .expect(201);

        // When - 질문 복사
        const copyResponse = await testSuite
          .request()
          .post(
            `${BASE_URL}/evaluation-questions/${createResponse.body.id}/copy`,
          )
          .send({})
          .expect(201);

        // Then - 복사본 확인
        const copiedQuestion = await testSuite
          .request()
          .get(`${BASE_URL}/evaluation-questions/${copyResponse.body.id}`)
          .expect(200);

        expect(copiedQuestion.body.text).toBe('복사 테스트 질문 (복사본)');
      });

      it('응답 구조 검증: 응답에 새로운 질문의 id가 포함되어야 한다', async () => {
        // Given - 원본 질문 생성
        const createResponse = await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '응답 구조 검증 질문' })
          .expect(201);

        // When - 질문 복사
        const copyResponse = await testSuite
          .request()
          .post(
            `${BASE_URL}/evaluation-questions/${createResponse.body.id}/copy`,
          )
          .send({})
          .expect(201);

        // Then
        expect(copyResponse.body).toHaveProperty('id');
        expect(copyResponse.body).toHaveProperty('message');
        expect(typeof copyResponse.body.id).toBe('string');
        expect(copyResponse.body.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 질문: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions/${nonExistentId}/copy`)
          .send({})
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await testSuite
          .request()
          .post(`${BASE_URL}/evaluation-questions/${invalidId}/copy`)
          .send({})
          .expect(400);
      });
    });
  });

  describe('데이터 무결성 테스트', () => {
    it('Soft Delete: 삭제된 질문은 목록 조회에서 제외되어야 한다', async () => {
      // Given - 질문 생성
      const createResponse = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send({ text: 'Soft Delete 테스트 질문' })
        .expect(201);

      const questionId = createResponse.body.id;

      // 생성 직후 목록 조회
      const beforeDeleteResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions`)
        .expect(200);

      const beforeCount = beforeDeleteResponse.body.length;

      // When - 질문 삭제
      await testSuite
        .request()
        .delete(`${BASE_URL}/evaluation-questions/${questionId}`)
        .expect(204);

      // Then - 삭제 후 목록 조회
      const afterDeleteResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions`)
        .expect(200);

      expect(afterDeleteResponse.body.length).toBe(beforeCount - 1);
      expect(afterDeleteResponse.body.some((q) => q.id === questionId)).toBe(
        false,
      );
    });

    it('생성 후 조회: 생성된 질문이 즉시 조회 가능해야 한다', async () => {
      // Given & When - 질문 생성
      const createResponse = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send({ text: '생성 후 조회 테스트' })
        .expect(201);

      const questionId = createResponse.body.id;

      // Then - 즉시 조회 가능
      const getResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${questionId}`)
        .expect(200);

      expect(getResponse.body.id).toBe(questionId);
      expect(getResponse.body.text).toBe('생성 후 조회 테스트');
    });

    it('수정 후 조회: 수정된 내용이 즉시 반영되어야 한다', async () => {
      // Given - 질문 생성
      const createResponse = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send({ text: '수정 전' })
        .expect(201);

      const questionId = createResponse.body.id;

      // When - 질문 수정
      await testSuite
        .request()
        .patch(`${BASE_URL}/evaluation-questions/${questionId}`)
        .send({ text: '수정 후' })
        .expect(200);

      // Then - 수정 내용 즉시 반영 확인
      const getResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${questionId}`)
        .expect(200);

      expect(getResponse.body.text).toBe('수정 후');
    });
  });
});
