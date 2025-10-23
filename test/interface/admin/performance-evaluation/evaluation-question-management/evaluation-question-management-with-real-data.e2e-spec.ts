/**
 * 평가 질문 관리 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오의 평가 질문 데이터를 활용한 CRUD 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('평가 질문 관리 API (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  const BASE_URL = '/admin/performance-evaluation/evaluation-questions';
  let testGroupId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 시드 데이터 초기화
    await testSuite
      .request()
      .delete('/admin/seed/clear')
      .expect((res) => {
        if (res.status !== 200 && res.status !== 404) {
          throw new Error(
            `Failed to clear seed data: ${res.status} ${res.text}`,
          );
        }
      });

    // full 시나리오로 시드 데이터 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'full',
        clearExisting: false,
      })
      .expect(201);

    // 테스트용 질문 그룹 생성
    const groupResponse = await testSuite
      .request()
      .post(`${BASE_URL}/question-groups`)
      .send({ name: '테스트 질문 그룹' })
      .expect(HttpStatus.CREATED);

    testGroupId = groupResponse.body.id;

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getEvaluationQuestion() {
    const questions = await dataSource.query(
      `SELECT id, text, "minScore", "maxScore" 
       FROM evaluation_question
       WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return questions.length > 0 ? questions[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('POST /evaluation-questions - 평가 질문 생성', () => {
    it('기본 생성: 질문 내용만 지정하여 생성할 수 있어야 한다', async () => {
      const createDto = {
        text: '이 프로젝트에서 당신의 기여도를 평가해주세요.',
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      console.log('\n✅ 평가 질문 생성 성공');
    });

    it('점수 범위 포함: minScore, maxScore를 포함하여 생성할 수 있어야 한다', async () => {
      const createDto = {
        text: '업무 수행 능력을 평가해주세요.',
        minScore: 1,
        maxScore: 5,
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');

      // 생성된 질문 조회
      const getResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${response.body.id}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.minScore).toBe(1);
      expect(getResponse.body.maxScore).toBe(5);

      console.log('\n✅ 점수 범위 포함 질문 생성 성공');
    });

    it('실패: 빈 질문 내용으로 생성할 수 없어야 한다', async () => {
      const createDto = {
        text: '',
      };

      await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 빈 질문 내용 검증 성공');
    });
  });

  describe('GET /evaluation-questions/:id - 평가 질문 조회', () => {
    it('성공: 존재하는 평가 질문을 조회할 수 있어야 한다', async () => {
      const question = await getEvaluationQuestion();
      if (!question) {
        console.log('평가 질문이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${question.id}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(question.id);
      expect(response.body.text).toBe(question.text);

      console.log('\n✅ 평가 질문 조회 성공');
    });

    it('실패: 존재하지 않는 질문 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 질문 처리 성공');
    });
  });

  describe('GET /evaluation-questions - 평가 질문 목록 조회', () => {
    it('성공: 평가 질문 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      console.log('\n✅ 평가 질문 목록 조회 성공');
    });
  });

  describe('PATCH /evaluation-questions/:id - 평가 질문 수정', () => {
    it('성공: 평가 질문의 내용을 수정할 수 있어야 한다', async () => {
      const question = await getEvaluationQuestion();
      if (!question) {
        console.log('평가 질문이 없어서 테스트 스킵');
        return;
      }

      const updateDto = {
        text: '수정된 질문 내용',
      };

      const response = await testSuite
        .request()
        .patch(`${BASE_URL}/evaluation-questions/${question.id}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(question.id);

      // 수정 확인
      const getResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${question.id}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.text).toBe('수정된 질문 내용');

      console.log('\n✅ 평가 질문 수정 성공');
    });

    it('성공: 점수 범위를 수정할 수 있어야 한다', async () => {
      const question = await getEvaluationQuestion();
      if (!question) {
        console.log('평가 질문이 없어서 테스트 스킵');
        return;
      }

      const updateDto = {
        minScore: 0,
        maxScore: 10,
      };

      const response = await testSuite
        .request()
        .patch(`${BASE_URL}/evaluation-questions/${question.id}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(question.id);

      console.log('\n✅ 점수 범위 수정 성공');
    });

    it('실패: 존재하지 않는 질문을 수정할 수 없어야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        text: '수정 시도',
      };

      await testSuite
        .request()
        .patch(`${BASE_URL}/evaluation-questions/${nonExistentId}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 질문 수정 방지 성공');
    });
  });

  describe('POST /evaluation-questions/:id/copy - 평가 질문 복사', () => {
    it('성공: 평가 질문을 복사할 수 있어야 한다', async () => {
      const question = await getEvaluationQuestion();
      if (!question) {
        console.log('평가 질문이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions/${question.id}/copy`)
        .send()
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).not.toBe(question.id);

      // 복사된 질문 조회
      const copyResponse = await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${response.body.id}`)
        .expect(HttpStatus.OK);

      expect(copyResponse.body.text).toContain(question.text);

      console.log('\n✅ 평가 질문 복사 성공');
    });

    it('실패: 존재하지 않는 질문을 복사할 수 없어야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions/${nonExistentId}/copy`)
        .send()
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 질문 복사 방지 성공');
    });
  });

  describe('DELETE /evaluation-questions/:id - 평가 질문 삭제', () => {
    it('성공: 평가 질문을 삭제할 수 있어야 한다', async () => {
      // 테스트용 질문 생성
      const createResponse = await testSuite
        .request()
        .post(`${BASE_URL}/evaluation-questions`)
        .send({ text: '삭제할 질문' })
        .expect(HttpStatus.CREATED);

      const questionId = createResponse.body.id;

      // 삭제 (204 No Content 응답 예상)
      await testSuite
        .request()
        .delete(`${BASE_URL}/evaluation-questions/${questionId}`)
        .expect(HttpStatus.NO_CONTENT);

      // 삭제 확인
      await testSuite
        .request()
        .get(`${BASE_URL}/evaluation-questions/${questionId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 평가 질문 삭제 성공');
    });

    it('실패: 존재하지 않는 질문을 삭제할 수 없어야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .delete(`${BASE_URL}/evaluation-questions/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 질문 삭제 방지 성공');
    });
  });
});
