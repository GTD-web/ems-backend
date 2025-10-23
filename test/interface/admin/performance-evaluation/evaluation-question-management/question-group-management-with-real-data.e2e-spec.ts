/**
 * 평가 질문 그룹 관리 - 실제 데이터 기반 E2E 테스트
 *
 * full 시나리오의 질문 그룹 데이터를 활용한 CRUD 테스트입니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('평가 질문 그룹 관리 API (실제 데이터)', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;
  const BASE_URL = '/admin/performance-evaluation/evaluation-questions';

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

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 헬퍼 함수 ====================

  async function getQuestionGroup() {
    const groups = await dataSource.query(
      `SELECT id, name, "isDefault" FROM question_group 
       WHERE "deletedAt" IS NULL LIMIT 1`,
    );
    return groups.length > 0 ? groups[0] : null;
  }

  // ==================== 테스트 케이스 ====================

  describe('POST /question-groups - 질문 그룹 생성', () => {
    it('기본 생성: 그룹명을 지정하여 질문 그룹을 생성할 수 있어야 한다', async () => {
      const createDto = {
        name: '새로운 평가 그룹',
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/question-groups`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      console.log('\n✅ 질문 그룹 생성 성공');
    });

    it('기본 그룹 설정: isDefault를 true로 설정하여 기본 그룹을 생성할 수 있어야 한다', async () => {
      const createDto = {
        name: '기본 그룹',
        isDefault: true,
      };

      const response = await testSuite
        .request()
        .post(`${BASE_URL}/question-groups`)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id');

      // 생성된 그룹 조회하여 isDefault 확인
      const getResponse = await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${response.body.id}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.isDefault).toBe(true);

      console.log('\n✅ 기본 그룹 생성 성공');
    });

    it('실패: 빈 이름으로 그룹을 생성할 수 없어야 한다', async () => {
      const createDto = {
        name: '',
      };

      await testSuite
        .request()
        .post(`${BASE_URL}/question-groups`)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 빈 이름 검증 성공');
    });
  });

  describe('GET /question-groups/:id - 질문 그룹 조회', () => {
    it('성공: 존재하는 질문 그룹을 조회할 수 있어야 한다', async () => {
      const group = await getQuestionGroup();
      if (!group) {
        console.log('질문 그룹이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${group.id}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(group.id);
      expect(response.body.name).toBe(group.name);

      console.log('\n✅ 질문 그룹 조회 성공');
    });

    it('실패: 존재하지 않는 그룹 ID로 조회 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 그룹 처리 성공');
    });
  });

  describe('GET /question-groups - 질문 그룹 목록 조회', () => {
    it('성공: 질문 그룹 목록을 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`${BASE_URL}/question-groups`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      console.log('\n✅ 질문 그룹 목록 조회 성공');
    });
  });

  describe('PATCH /question-groups/:id - 질문 그룹 수정', () => {
    it('성공: 질문 그룹의 이름을 수정할 수 있어야 한다', async () => {
      const group = await getQuestionGroup();
      if (!group) {
        console.log('질문 그룹이 없어서 테스트 스킵');
        return;
      }

      const updateDto = {
        name: '수정된 그룹명',
      };

      const response = await testSuite
        .request()
        .patch(`${BASE_URL}/question-groups/${group.id}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(group.id);

      // 수정 확인
      const getResponse = await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${group.id}`)
        .expect(HttpStatus.OK);

      expect(getResponse.body.name).toBe('수정된 그룹명');

      console.log('\n✅ 질문 그룹 수정 성공');
    });

    it('성공: 기본 그룹 설정을 변경할 수 있어야 한다', async () => {
      const group = await getQuestionGroup();
      if (!group) {
        console.log('질문 그룹이 없어서 테스트 스킵');
        return;
      }

      const updateDto = {
        isDefault: !group.isDefault,
      };

      const response = await testSuite
        .request()
        .patch(`${BASE_URL}/question-groups/${group.id}`)
        .send(updateDto)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(group.id);

      console.log('\n✅ 기본 그룹 설정 변경 성공');
    });

    it('실패: 존재하지 않는 그룹을 수정할 수 없어야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateDto = {
        name: '수정 시도',
      };

      await testSuite
        .request()
        .patch(`${BASE_URL}/question-groups/${nonExistentId}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 그룹 수정 방지 성공');
    });
  });

  describe('DELETE /question-groups/:id - 질문 그룹 삭제', () => {
    it('성공: 질문 그룹을 삭제할 수 있어야 한다', async () => {
      // 테스트용 그룹 생성
      const createResponse = await testSuite
        .request()
        .post(`${BASE_URL}/question-groups`)
        .send({ name: '삭제할 그룹' })
        .expect(HttpStatus.CREATED);

      const groupId = createResponse.body.id;

      // 삭제 (204 No Content 응답 예상)
      await testSuite
        .request()
        .delete(`${BASE_URL}/question-groups/${groupId}`)
        .expect(HttpStatus.NO_CONTENT);

      // 삭제 확인
      await testSuite
        .request()
        .get(`${BASE_URL}/question-groups/${groupId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 질문 그룹 삭제 성공');
    });

    it('실패: 존재하지 않는 그룹을 삭제할 수 없어야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await testSuite
        .request()
        .delete(`${BASE_URL}/question-groups/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      console.log('\n✅ 존재하지 않는 그룹 삭제 방지 성공');
    });
  });
});
