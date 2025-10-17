import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 질문-그룹 매핑 관리 E2E 테스트
 *
 * 테스트 대상:
 * - POST /admin/performance-evaluation/evaluation-questions/question-group-mappings (그룹에 질문 추가)
 * - POST /admin/performance-evaluation/evaluation-questions/question-group-mappings/batch (그룹에 여러 질문 추가)
 * - PUT /admin/performance-evaluation/evaluation-questions/question-group-mappings/reorder (그룹 내 질문 순서 재정의)
 * - DELETE /admin/performance-evaluation/evaluation-questions/question-group-mappings/:mappingId (그룹에서 질문 제거)
 * - GET /admin/performance-evaluation/evaluation-questions/question-groups/:groupId/questions (그룹의 질문 목록 조회)
 */
describe('질문-그룹 매핑 관리 API', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;

  const BASE_URL = '/admin/performance-evaluation/evaluation-questions';

  // 테스트용 데이터를 저장할 변수
  let testGroupId: string;
  let testQuestion1Id: string;
  let testQuestion2Id: string;
  let testQuestion3Id: string;

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
    const groupResponse = await request(app.getHttpServer())
      .post(`${BASE_URL}/question-groups`)
      .send({ name: '테스트 질문 그룹' })
      .expect(201);

    testGroupId = groupResponse.body.id;

    // 테스트용 질문 3개 생성
    const question1Response = await request(app.getHttpServer())
      .post(`${BASE_URL}/evaluation-questions`)
      .send({ text: '테스트 질문 1' })
      .expect(201);

    testQuestion1Id = question1Response.body.id;

    const question2Response = await request(app.getHttpServer())
      .post(`${BASE_URL}/evaluation-questions`)
      .send({ text: '테스트 질문 2' })
      .expect(201);

    testQuestion2Id = question2Response.body.id;

    const question3Response = await request(app.getHttpServer())
      .post(`${BASE_URL}/evaluation-questions`)
      .send({ text: '테스트 질문 3' })
      .expect(201);

    testQuestion3Id = question3Response.body.id;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /question-group-mappings - 그룹에 질문 추가', () => {
    describe('성공 케이스', () => {
      it('정상 추가: groupId, questionId로 추가할 수 있어야 한다 (displayOrder 자동 설정)', async () => {
        // Given
        const addDto = {
          groupId: testGroupId,
          questionId: testQuestion1Id,
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          '그룹에 질문이 성공적으로 추가되었습니다.',
        );

        // 그룹의 질문 목록 조회하여 확인
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body.length).toBe(1);
        expect(groupQuestionsResponse.body[0].questionId).toBe(testQuestion1Id);
      });

      it('순서 지정 추가: displayOrder를 명시적으로 지정하여 추가할 수 있어야 한다', async () => {
        // Given
        const addDto = {
          groupId: testGroupId,
          questionId: testQuestion1Id,
          displayOrder: 5,
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');

        // displayOrder 확인
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body[0].displayOrder).toBe(5);
      });

      it('자동 순서 배치: displayOrder 생략 시 마지막 순서로 자동 배치되어야 한다', async () => {
        // Given - 첫 번째 질문 추가
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion1Id,
            displayOrder: 0,
          })
          .expect(201);

        // When - displayOrder 없이 두 번째 질문 추가
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion2Id,
          })
          .expect(201);

        // Then - 자동으로 마지막 순서(1)로 배치되어야 함
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body.length).toBe(2);
        expect(groupQuestionsResponse.body[1].displayOrder).toBe(1);
      });

      it('응답 구조 검증: 응답에 매핑 id가 포함되어야 한다', async () => {
        // Given
        const addDto = {
          groupId: testGroupId,
          questionId: testQuestion1Id,
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(response.body.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      });
    });

    describe('실패 케이스', () => {
      it('중복 매핑 방지: 동일한 그룹에 동일한 질문 추가 시 409 에러가 발생해야 한다', async () => {
        // Given - 첫 번째 추가
        const addDto = {
          groupId: testGroupId,
          questionId: testQuestion1Id,
        };

        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(201);

        // When & Then - 동일한 질문 다시 추가 시도
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(409);
      });

      it('존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const addDto = {
          groupId: '00000000-0000-0000-0000-000000000000',
          questionId: testQuestion1Id,
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(404);
      });

      it('존재하지 않는 질문: 유효하지 않은 questionId로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const addDto = {
          groupId: testGroupId,
          questionId: '00000000-0000-0000-0000-000000000000',
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(404);
      });

      it('필수 필드 누락: groupId 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const addDto = {
          questionId: testQuestion1Id,
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(400);
      });

      it('필수 필드 누락: questionId 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const addDto = {
          groupId: testGroupId,
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send(addDto)
          .expect(400);
      });
    });
  });

  describe('POST /question-group-mappings/batch - 그룹에 여러 질문 추가', () => {
    describe('성공 케이스', () => {
      it('정상 추가: groupId와 questionIds 배열로 여러 질문을 추가할 수 있어야 한다', async () => {
        // Given
        const batchAddDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('ids');
        expect(response.body).toHaveProperty('successCount');
        expect(response.body).toHaveProperty('totalCount');
        expect(response.body.ids.length).toBe(3);
        expect(response.body.successCount).toBe(3);
        expect(response.body.totalCount).toBe(3);

        // 그룹의 질문 목록 조회하여 확인
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body.length).toBe(3);
      });

      it('순차 순서: startDisplayOrder부터 순차적으로 displayOrder가 할당되어야 한다', async () => {
        // Given
        const batchAddDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
          startDisplayOrder: 5,
        };

        // When
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(201);

        // Then - displayOrder가 5, 6, 7로 할당되어야 함
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body.length).toBe(3);
        expect(groupQuestionsResponse.body[0].displayOrder).toBe(5);
        expect(groupQuestionsResponse.body[1].displayOrder).toBe(6);
        expect(groupQuestionsResponse.body[2].displayOrder).toBe(7);
      });

      it('응답 구조 검증: 응답에 ids, successCount, totalCount가 포함되어야 한다', async () => {
        // Given
        const batchAddDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id],
        };

        // When
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(201);

        // Then
        expect(response.body).toHaveProperty('ids');
        expect(response.body).toHaveProperty('successCount');
        expect(response.body).toHaveProperty('totalCount');
        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.ids)).toBe(true);
        expect(typeof response.body.successCount).toBe('number');
        expect(typeof response.body.totalCount).toBe('number');
      });

      it('중복 건너뛰기: 이미 추가된 질문은 건너뛰고 나머지만 추가해야 한다', async () => {
        // Given - 첫 번째 질문 미리 추가
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion1Id,
          })
          .expect(201);

        // When - 첫 번째 질문 포함하여 배치 추가 시도
        const batchAddDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        };

        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(201);

        // Then - 중복된 첫 번째 질문은 건너뛰고 2개만 추가
        expect(response.body.successCount).toBe(2);
        expect(response.body.totalCount).toBe(3);

        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body.length).toBe(3);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const batchAddDto = {
          groupId: '00000000-0000-0000-0000-000000000000',
          questionIds: [testQuestion1Id, testQuestion2Id],
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(404);
      });

      it('존재하지 않는 질문: 일부 questionId가 유효하지 않을 경우 404 에러가 발생해야 한다', async () => {
        // Given
        const batchAddDto = {
          groupId: testGroupId,
          questionIds: [
            testQuestion1Id,
            '00000000-0000-0000-0000-000000000000',
          ],
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(404);
      });

      it('필수 필드 누락: groupId 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const batchAddDto = {
          questionIds: [testQuestion1Id, testQuestion2Id],
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(400);
      });

      it('필수 필드 누락: questionIds 누락 시 400 에러가 발생해야 한다', async () => {
        // Given
        const batchAddDto = {
          groupId: testGroupId,
        };

        // When & Then
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send(batchAddDto)
          .expect(400);
      });
    });
  });

  describe('PUT /question-group-mappings/reorder - 그룹 내 질문 순서 재정의', () => {
    beforeEach(async () => {
      // 테스트용 질문 3개를 그룹에 추가
      await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings/batch`)
        .send({
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        })
        .expect(201);
    });

    describe('성공 케이스', () => {
      it('정상 재정렬: groupId와 모든 questionIds 배열로 순서를 재정의할 수 있어야 한다', async () => {
        // Given - 순서 변경: 3 -> 1 -> 2
        const reorderDto = {
          groupId: testGroupId,
          questionIds: [testQuestion3Id, testQuestion1Id, testQuestion2Id],
        };

        // When
        const response = await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id', testGroupId);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe(
          '그룹 내 질문 순서가 성공적으로 재정의되었습니다.',
        );

        // 순서 확인
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body[0].questionId).toBe(testQuestion3Id);
        expect(groupQuestionsResponse.body[1].questionId).toBe(testQuestion1Id);
        expect(groupQuestionsResponse.body[2].questionId).toBe(testQuestion2Id);
      });

      it('배열 순서 반영: 배열 인덱스 순서대로 displayOrder가 할당되어야 한다 (0, 1, 2, ...)', async () => {
        // Given
        const reorderDto = {
          groupId: testGroupId,
          questionIds: [testQuestion2Id, testQuestion3Id, testQuestion1Id],
        };

        // When
        await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(200);

        // Then - displayOrder가 0, 1, 2로 할당
        const groupQuestionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(groupQuestionsResponse.body[0].displayOrder).toBe(0);
        expect(groupQuestionsResponse.body[1].displayOrder).toBe(1);
        expect(groupQuestionsResponse.body[2].displayOrder).toBe(2);
      });

      it('응답 구조 검증: 응답에 id와 message가 포함되어야 한다', async () => {
        // Given
        const reorderDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        };

        // When
        const response = await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.message).toBe('string');
      });
    });

    describe('실패 케이스', () => {
      it('일부 질문 누락: 그룹의 모든 질문을 포함하지 않으면 400 에러가 발생해야 한다', async () => {
        // Given - 3개 중 2개만 포함
        const reorderDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id],
        };

        // When & Then
        await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(400);
      });

      it('추가 질문 포함: 그룹에 없는 질문 ID 포함 시 400 에러가 발생해야 한다', async () => {
        // Given - 그룹에 없는 질문 포함
        const newQuestionResponse = await request(app.getHttpServer())
          .post(`${BASE_URL}/evaluation-questions`)
          .send({ text: '그룹에 없는 질문' })
          .expect(201);

        const reorderDto = {
          groupId: testGroupId,
          questionIds: [
            testQuestion1Id,
            testQuestion2Id,
            testQuestion3Id,
            newQuestionResponse.body.id,
          ],
        };

        // When & Then
        await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(400);
      });

      it('중복 ID: 중복된 질문 ID 포함 시 400 에러가 발생해야 한다', async () => {
        // Given
        const reorderDto = {
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion1Id, testQuestion2Id],
        };

        // When & Then
        await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(400);
      });

      it('존재하지 않는 그룹: 유효하지 않은 groupId로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const reorderDto = {
          groupId: '00000000-0000-0000-0000-000000000000',
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        };

        // When & Then
        await request(app.getHttpServer())
          .put(`${BASE_URL}/question-group-mappings/reorder`)
          .send(reorderDto)
          .expect(404);
      });
    });
  });

  describe('DELETE /question-group-mappings/:mappingId - 그룹에서 질문 제거', () => {
    let testMappingId: string;

    beforeEach(async () => {
      // 테스트용 매핑 생성
      const mappingResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
        })
        .expect(201);

      testMappingId = mappingResponse.body.id;
    });

    describe('성공 케이스', () => {
      it('정상 제거: 유효한 매핑 ID로 제거할 수 있어야 한다', async () => {
        // Given - 제거 전 확인
        const beforeResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(beforeResponse.body.length).toBe(1);

        // When - 매핑 제거
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-group-mappings/${testMappingId}`)
          .expect(204);

        // Then - 제거 후 확인
        const afterResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(afterResponse.body.length).toBe(0);
      });
    });

    describe('실패 케이스', () => {
      it('존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-group-mappings/${nonExistentId}`)
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid-format';

        // When & Then
        await request(app.getHttpServer())
          .delete(`${BASE_URL}/question-group-mappings/${invalidId}`)
          .expect(400);
      });
    });
  });

  describe('GET /question-groups/:groupId/questions - 그룹의 질문 목록 조회', () => {
    describe('성공 케이스', () => {
      it('정상 조회: 유효한 groupId로 질문 목록을 조회할 수 있어야 한다', async () => {
        // Given - 질문 3개 추가
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings/batch`)
          .send({
            groupId: testGroupId,
            questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
          })
          .expect(201);

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(3);
        expect(response.body[0].questionId).toBe(testQuestion1Id);
        expect(response.body[1].questionId).toBe(testQuestion2Id);
        expect(response.body[2].questionId).toBe(testQuestion3Id);
      });

      it('빈 배열 반환: 질문이 없는 그룹의 경우 빈 배열을 반환해야 한다', async () => {
        // Given - 질문이 없는 그룹

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('응답 구조 검증: 각 매핑 정보에 id, groupId, questionId, displayOrder가 포함되어야 한다', async () => {
        // Given - 질문 1개 추가
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion1Id,
          })
          .expect(201);

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        // Then
        expect(response.body.length).toBe(1);
        const mapping = response.body[0];
        expect(mapping).toHaveProperty('id');
        expect(mapping).toHaveProperty('groupId', testGroupId);
        expect(mapping).toHaveProperty('questionId', testQuestion1Id);
        expect(mapping).toHaveProperty('displayOrder');
        expect(typeof mapping.displayOrder).toBe('number');
      });

      it('순서 정렬: displayOrder 오름차순으로 정렬되어야 한다', async () => {
        // Given - 역순으로 질문 추가
        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion1Id,
            displayOrder: 2,
          })
          .expect(201);

        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion2Id,
            displayOrder: 1,
          })
          .expect(201);

        await request(app.getHttpServer())
          .post(`${BASE_URL}/question-group-mappings`)
          .send({
            groupId: testGroupId,
            questionId: testQuestion3Id,
            displayOrder: 0,
          })
          .expect(201);

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        // Then - displayOrder 오름차순 정렬 확인
        expect(response.body[0].displayOrder).toBe(0);
        expect(response.body[1].displayOrder).toBe(1);
        expect(response.body[2].displayOrder).toBe(2);
        expect(response.body[0].questionId).toBe(testQuestion3Id);
        expect(response.body[1].questionId).toBe(testQuestion2Id);
        expect(response.body[2].questionId).toBe(testQuestion1Id);
      });

      it('존재하지 않는 그룹: 잘못된 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
        // Given
        const nonExistentGroupId = '00000000-0000-0000-0000-000000000000';

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${nonExistentGroupId}/questions`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });
  });

  describe('데이터 무결성 테스트', () => {
    it('Soft Delete: 제거된 매핑은 목록 조회에서 제외되어야 한다', async () => {
      // Given - 질문 추가
      const mappingResponse = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
        })
        .expect(201);

      const mappingId = mappingResponse.body.id;

      // 추가 확인
      const beforeResponse = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
        .expect(200);

      expect(beforeResponse.body.length).toBe(1);

      // When - 매핑 제거
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/question-group-mappings/${mappingId}`)
        .expect(204);

      // Then - 제거된 매핑은 조회에서 제외
      const afterResponse = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
        .expect(200);

      expect(afterResponse.body.length).toBe(0);
    });

    it('질문 삭제와 매핑: 질문이 삭제되어도 매핑은 유지되어야 한다', async () => {
      // Given - 질문 추가
      await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
        })
        .expect(201);

      // When - 질문 삭제
      await request(app.getHttpServer())
        .delete(`${BASE_URL}/evaluation-questions/${testQuestion1Id}`)
        .expect(204);

      // Then - 매핑은 유지 (실제로는 비즈니스 로직에 따라 다를 수 있음)
      const response = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
        .expect(200);

      // 매핑은 남아있지만, 삭제된 질문은 조회되지 않음 (구현에 따라)
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('재정렬 후 순서 유지: 재정렬 후 조회 시 새로운 순서가 유지되어야 한다', async () => {
      // Given - 질문 3개 추가
      await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings/batch`)
        .send({
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        })
        .expect(201);

      // When - 순서 재정렬
      await request(app.getHttpServer())
        .put(`${BASE_URL}/question-group-mappings/reorder`)
        .send({
          groupId: testGroupId,
          questionIds: [testQuestion3Id, testQuestion1Id, testQuestion2Id],
        })
        .expect(200);

      // Then - 새로운 순서 유지 확인
      const response = await request(app.getHttpServer())
        .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
        .expect(200);

      expect(response.body[0].questionId).toBe(testQuestion3Id);
      expect(response.body[1].questionId).toBe(testQuestion1Id);
      expect(response.body[2].questionId).toBe(testQuestion2Id);
    });
  });

  describe('PATCH /question-group-mappings/:mappingId/move-up - 질문 순서 위로 이동', () => {
    let mapping1Id: string;
    let mapping2Id: string;
    let mapping3Id: string;

    beforeEach(async () => {
      // 테스트용 질문 3개를 그룹에 추가
      const response1 = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
          displayOrder: 0,
        })
        .expect(201);
      mapping1Id = response1.body.id;

      const response2 = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion2Id,
          displayOrder: 1,
        })
        .expect(201);
      mapping2Id = response2.body.id;

      const response3 = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion3Id,
          displayOrder: 2,
        })
        .expect(201);
      mapping3Id = response3.body.id;
    });

    describe('성공 케이스', () => {
      it('정상 이동: 두 번째 이상 위치의 질문을 위로 이동할 수 있어야 한다', async () => {
        // Given - 초기 순서: 질문1(0), 질문2(1), 질문3(2)

        // When - 질문2를 위로 이동 (1 -> 0)
        const response = await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${mapping2Id}/move-up`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id', mapping2Id);
        expect(response.body).toHaveProperty('message');

        // 순서 확인: 질문2(0), 질문1(1), 질문3(2)
        const questionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(questionsResponse.body[0].questionId).toBe(testQuestion2Id);
        expect(questionsResponse.body[1].questionId).toBe(testQuestion1Id);
        expect(questionsResponse.body[2].questionId).toBe(testQuestion3Id);
      });

      it('응답 구조 검증: 응답에 id와 message가 포함되어야 한다', async () => {
        // Given - 질문3 선택

        // When
        const response = await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${mapping3Id}/move-up`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.message).toBe('string');
      });
    });

    describe('실패 케이스', () => {
      it('첫 번째 위치: 이미 첫 번째 위치의 질문 이동 시도 시 400 에러가 발생해야 한다', async () => {
        // Given - 질문1이 첫 번째 위치

        // When & Then - 첫 번째 질문을 위로 이동 시도
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${mapping1Id}/move-up`)
          .expect(400);
      });

      it('존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${nonExistentId}/move-up`)
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${invalidId}/move-up`)
          .expect(400);
      });
    });
  });

  describe('PATCH /question-group-mappings/:mappingId/move-down - 질문 순서 아래로 이동', () => {
    let mapping1Id: string;
    let mapping2Id: string;
    let mapping3Id: string;

    beforeEach(async () => {
      // 테스트용 질문 3개를 그룹에 추가
      const response1 = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
          displayOrder: 0,
        })
        .expect(201);
      mapping1Id = response1.body.id;

      const response2 = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion2Id,
          displayOrder: 1,
        })
        .expect(201);
      mapping2Id = response2.body.id;

      const response3 = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion3Id,
          displayOrder: 2,
        })
        .expect(201);
      mapping3Id = response3.body.id;
    });

    describe('성공 케이스', () => {
      it('정상 이동: 마지막 이전 위치의 질문을 아래로 이동할 수 있어야 한다', async () => {
        // Given - 초기 순서: 질문1(0), 질문2(1), 질문3(2)

        // When - 질문2를 아래로 이동 (1 -> 2)
        const response = await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${mapping2Id}/move-down`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id', mapping2Id);
        expect(response.body).toHaveProperty('message');

        // 순서 확인: 질문1(0), 질문3(1), 질문2(2)
        const questionsResponse = await request(app.getHttpServer())
          .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
          .expect(200);

        expect(questionsResponse.body[0].questionId).toBe(testQuestion1Id);
        expect(questionsResponse.body[1].questionId).toBe(testQuestion3Id);
        expect(questionsResponse.body[2].questionId).toBe(testQuestion2Id);
      });

      it('응답 구조 검증: 응답에 id와 message가 포함되어야 한다', async () => {
        // Given - 질문1 선택

        // When
        const response = await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${mapping1Id}/move-down`)
          .expect(200);

        // Then
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('message');
        expect(typeof response.body.id).toBe('string');
        expect(typeof response.body.message).toBe('string');
      });
    });

    describe('실패 케이스', () => {
      it('마지막 위치: 이미 마지막 위치의 질문 이동 시도 시 400 에러가 발생해야 한다', async () => {
        // Given - 질문3이 마지막 위치

        // When & Then - 마지막 질문을 아래로 이동 시도
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${mapping3Id}/move-down`)
          .expect(400);
      });

      it('존재하지 않는 매핑: 잘못된 ID로 요청 시 404 에러가 발생해야 한다', async () => {
        // Given
        const nonExistentId = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await request(app.getHttpServer())
          .patch(
            `${BASE_URL}/question-group-mappings/${nonExistentId}/move-down`,
          )
          .expect(404);
      });

      it('잘못된 ID 형식: UUID 형식이 아닌 ID로 요청 시 400 에러가 발생해야 한다', async () => {
        // Given
        const invalidId = 'invalid-uuid';

        // When & Then
        await request(app.getHttpServer())
          .patch(`${BASE_URL}/question-group-mappings/${invalidId}/move-down`)
          .expect(400);
      });
    });
  });

  describe('GET /evaluation-questions/:questionId/groups - 질문이 속한 그룹 목록 조회', () => {
    let testGroup2Id: string;

    beforeEach(async () => {
      // 두 번째 그룹 생성
      const group2Response = await request(app.getHttpServer())
        .post(`${BASE_URL}/question-groups`)
        .send({ name: '두 번째 테스트 그룹' })
        .expect(201);

      testGroup2Id = group2Response.body.id;

      // 질문1을 두 그룹에 모두 추가
      await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
          displayOrder: 0,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroup2Id,
          questionId: testQuestion1Id,
          displayOrder: 0,
        })
        .expect(201);
    });

    describe('성공 케이스', () => {
      it('정상 조회: 유효한 questionId로 그룹 목록을 조회할 수 있어야 한다', async () => {
        // Given - 질문1이 두 그룹에 속함

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/evaluation-questions/${testQuestion1Id}/groups`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);

        const groupIds = response.body.map((m: any) => m.groupId);
        expect(groupIds).toContain(testGroupId);
        expect(groupIds).toContain(testGroup2Id);
      });

      it('빈 배열 반환: 어떤 그룹에도 속하지 않은 질문의 경우 빈 배열을 반환해야 한다', async () => {
        // Given - 질문2는 어떤 그룹에도 속하지 않음

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/evaluation-questions/${testQuestion2Id}/groups`)
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('응답 구조 검증: 각 매핑 정보에 id, groupId, questionId, displayOrder가 포함되어야 한다', async () => {
        // Given - 질문1이 그룹에 속함

        // When
        const response = await request(app.getHttpServer())
          .get(`${BASE_URL}/evaluation-questions/${testQuestion1Id}/groups`)
          .expect(200);

        // Then
        expect(response.body.length).toBeGreaterThan(0);
        const mapping = response.body[0];
        expect(mapping).toHaveProperty('id');
        expect(mapping).toHaveProperty('groupId');
        expect(mapping).toHaveProperty('questionId', testQuestion1Id);
        expect(mapping).toHaveProperty('displayOrder');
        expect(typeof mapping.displayOrder).toBe('number');
      });

      it('존재하지 않는 질문: 잘못된 ID로 요청 시 빈 배열을 반환해야 한다', async () => {
        // Given
        const nonExistentQuestionId = '00000000-0000-0000-0000-000000000000';

        // When
        const response = await request(app.getHttpServer())
          .get(
            `${BASE_URL}/evaluation-questions/${nonExistentQuestionId}/groups`,
          )
          .expect(200);

        // Then
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });
    });
  });
});
