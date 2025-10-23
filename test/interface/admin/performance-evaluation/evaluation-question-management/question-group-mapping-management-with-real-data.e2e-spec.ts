/**
 * 질문-그룹 매핑 관리 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오의 질문 그룹과 평가 질문을 활용한 매핑 관리 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('질문-그룹 매핑 관리 API (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  const BASE_URL = '/admin/performance-evaluation/evaluation-questions';
  let testGroupId: string;
  let testQuestion1Id: string;
  let testQuestion2Id: string;
  let testQuestion3Id: string;

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

    console.log('\n✅ 시드 데이터 생성 완료 (full)\n');
  });

  beforeEach(async () => {
    // 각 테스트마다 새로운 테스트용 질문 그룹과 질문 생성
    const groupResponse = await testSuite
      .request()
      .post(`${BASE_URL}/question-groups`)
      .send({ name: `테스트 질문 그룹 ${Date.now()}` })
      .expect(HttpStatus.CREATED);

    testGroupId = groupResponse.body.id;

    // 테스트용 질문 3개 생성
    const question1Response = await testSuite
      .request()
      .post(`${BASE_URL}/evaluation-questions`)
      .send({ text: `테스트 질문 1 ${Date.now()}` })
      .expect(HttpStatus.CREATED);

    testQuestion1Id = question1Response.body.id;

    const question2Response = await testSuite
      .request()
      .post(`${BASE_URL}/evaluation-questions`)
      .send({ text: `테스트 질문 2 ${Date.now()}` })
      .expect(HttpStatus.CREATED);

    testQuestion2Id = question2Response.body.id;

    const question3Response = await testSuite
      .request()
      .post(`${BASE_URL}/evaluation-questions`)
      .send({ text: `테스트 질문 3 ${Date.now()}` })
      .expect(HttpStatus.CREATED);

    testQuestion3Id = question3Response.body.id;
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 테스트 케이스 ====================

  describe('POST /question-group-mappings - 그룹에 질문 추가', () => {
    it('정상 추가: groupId, questionId로 추가할 수 있어야 한다', async () => {
      const createDto = {
        groupId: testGroupId,
        questionId: testQuestion1Id,
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      console.log('\n✅ 그룹에 질문 추가 성공');
    });

    it('displayOrder 지정: displayOrder를 명시적으로 지정할 수 있어야 한다', async () => {
      const createDto = {
        groupId: testGroupId,
        questionId: testQuestion2Id,
        displayOrder: 10,
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');

      console.log('\n✅ displayOrder 지정 추가 성공');
    });

    it('실패: 존재하지 않는 그룹에 질문을 추가할 수 없어야 한다', async () => {
      const createDto = {
        groupId: '00000000-0000-0000-0000-000000000000',
        questionId: testQuestion1Id,
      };

      await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings`)
        .send(createDto)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 그룹 추가 방지 성공');
    });
  });

  describe('POST /question-group-mappings/batch - 그룹에 여러 질문 추가', () => {
    it('정상 추가: 여러 질문을 한 번에 추가할 수 있어야 한다', async () => {
      const createDto = {
        groupId: testGroupId,
        questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings/batch`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('successCount');
      expect(response.body.successCount).toBe(3);

      console.log('\n✅ 여러 질문 배치 추가 성공');
    });
  });

  describe('GET /question-groups/:groupId/questions - 그룹의 질문 목록 조회', () => {
    it('정상 조회: 그룹에 속한 질문 목록을 조회할 수 있어야 한다', async () => {
      // 먼저 질문 추가
      await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
        })
        .expect(HttpStatus.CREATED);

      // 목록 조회
      const response = await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${testGroupId}/questions`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      console.log('\n✅ 그룹의 질문 목록 조회 성공');
    });

    it('빈 목록: 존재하지 않는 그룹의 질문 목록 조회 시 빈 배열을 반환해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${nonExistentId}/questions`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);

      console.log('\n✅ 존재하지 않는 그룹 빈 목록 반환 성공');
    });
  });

  describe('PUT /question-group-mappings/reorder - 그룹 내 질문 순서 재정의', () => {
    it('정상 재정의: 질문들의 순서를 변경할 수 있어야 한다', async () => {
      // 먼저 질문들을 배치로 추가
      await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings/batch`)
        .send({
          groupId: testGroupId,
          questionIds: [testQuestion1Id, testQuestion2Id, testQuestion3Id],
        })
        .expect(HttpStatus.CREATED);

      // 순서 재정의 (3 -> 1 -> 2)
      const reorderDto = {
        groupId: testGroupId,
        questionIds: [testQuestion3Id, testQuestion1Id, testQuestion2Id],
      };

      const response = await testSuite
        .request()
        .put(`${BASE_URL}/question-group-mappings/reorder`)
        .send(reorderDto)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');

      console.log('\n✅ 질문 순서 재정의 성공');
    });
  });

  describe('DELETE /question-group-mappings/:mappingId - 그룹에서 질문 제거', () => {
    it('정상 제거: 그룹에서 질문을 제거할 수 있어야 한다', async () => {
      // 먼저 질문 추가
      const mappingResponse = await testSuite
        .request()
        .post(`${BASE_URL}/question-group-mappings`)
        .send({
          groupId: testGroupId,
          questionId: testQuestion1Id,
        })
        .expect(HttpStatus.CREATED);

      const mappingId = mappingResponse.body.id;

      // 제거 (204 No Content 응답 예상)
      await testSuite
        .request()
        .delete(`${BASE_URL}/question-group-mappings/${mappingId}`)
        .expect(HttpStatus.NO_CONTENT);

      console.log('\n✅ 그룹에서 질문 제거 성공');
    });

    it('실패: 존재하지 않는 매핑을 제거할 수 없어야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .delete(`${BASE_URL}/question-group-mappings/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 매핑 제거 방지 성공');
    });
  });
});
