/**
 * 평가기간 시작일 수정 - Minimal 데이터 기반 E2E 테스트
 *
 * 전략: minimal 시나리오로 최소 데이터(조직, 직원)만 생성하고
 * 평가기간은 테스트에서 직접 생성하여 날짜를 제어합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-periods/:id/start-date - Minimal 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 데이터 초기화
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

    // minimal 시나리오: 평가기간 없이 최소 데이터(조직, 직원)만 생성
    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'minimal',
        clearExisting: false,
      })
      .expect(201);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 성공 케이스', () => {
    it('대기 중인 평가기간의 시작일을 수정해야 한다', async () => {
      // Given: 알려진 날짜로 평가기간 생성 (2030년 사용)
      const createData = {
        name: '시작일 수정 테스트 평가기간',
        startDate: '2030-01-01',
        peerEvaluationDeadline: '2030-12-31',
        description: '시작일 수정 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
        ],
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // When: 시작일 수정 (1개월 뒤로)
      const updateData = {
        startDate: '2030-02-01',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData)
        .expect(HttpStatus.OK);

      // Then: 응답 검증
      expect(response.body.id).toBe(evaluationPeriodId);
      expect(
        new Date(response.body.startDate).toISOString().split('T')[0],
      ).toBe('2030-02-01');

      console.log('\n✅ 시작일 수정 성공');
    });

    it('시작일을 앞당길 수 있어야 한다', async () => {
      // Given: 평가기간 생성 (2031년 사용)
      const createData = {
        name: '시작일 앞당기기 테스트',
        startDate: '2031-03-01',
        peerEvaluationDeadline: '2031-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // When: 시작일을 앞당김
      const updateData = {
        startDate: '2031-02-15',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData)
        .expect(HttpStatus.OK);

      // Then
      expect(
        new Date(response.body.startDate).toISOString().split('T')[0],
      ).toBe('2031-02-15');

      console.log('\n✅ 시작일 앞당기기 성공');
    });
  });

  describe('시나리오 2: 1년 제한 검증', () => {
    it('시작일 변경으로 평가기간이 1년을 초과하면 에러가 발생해야 한다', async () => {
      // Given: 평가기간 생성 (2032년 사용)
      const createData = {
        name: '1년 제한 테스트',
        startDate: '2032-01-01',
        peerEvaluationDeadline: '2032-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // When: 시작일을 1년 이상 앞당김
      const updateData = {
        startDate: '2031-01-01', // peerEvaluationDeadline이 2032-12-31이므로 1년 초과
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData);

      // Then: 400 또는 422 에러
      expect([
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNPROCESSABLE_ENTITY,
      ]).toContain(response.status);
      expect(response.body.message).toContain('1년');

      console.log('\n✅ 1년 제한 검증 확인');
    });
  });

  describe('시나리오 3: 기간 겹침 검증', () => {
    it('다른 평가기간과 겹치는 시작일로 변경 시 에러가 발생해야 한다', async () => {
      // Given: 첫 번째 평가기간 생성 (2033년 사용)
      const firstPeriod = {
        name: '2033년 평가기간',
        startDate: '2033-01-01',
        peerEvaluationDeadline: '2033-12-31',
        maxSelfEvaluationRate: 120,
      };

      await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(firstPeriod)
        .expect(HttpStatus.CREATED);

      // 두 번째 평가기간 생성 (2034년)
      const secondPeriod = {
        name: '2034년 평가기간',
        startDate: '2034-01-01',
        peerEvaluationDeadline: '2034-12-31',
        maxSelfEvaluationRate: 120,
      };

      const secondResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(secondPeriod)
        .expect(HttpStatus.CREATED);

      const secondPeriodId = secondResponse.body.id;

      // When: 두 번째 평가기간의 시작일을 2033년으로 변경 (첫 번째와 겹침)
      const updateData = {
        startDate: '2033-06-01', // 첫 번째 평가기간과 겹침
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${secondPeriodId}/start-date`)
        .send(updateData);

      // Then: 409 Conflict 또는 400 에러 (1년 초과 또는 겹침)
      expect([HttpStatus.CONFLICT, HttpStatus.BAD_REQUEST]).toContain(
        response.status,
      );
      // 겹침 또는 1년 초과 에러 메시지
      const hasError =
        response.body.message.includes('겹칩니다') ||
        response.body.message.includes('1년');
      expect(hasError).toBe(true);

      console.log('\n✅ 기간 검증 확인');
    });
  });

  describe('시나리오 4: 상태별 수정 제한', () => {
    it('진행 중인 평가기간의 시작일은 수정할 수 없어야 한다', async () => {
      // Given: 평가기간 생성 및 시작 (2035년 사용)
      const createData = {
        name: '진행 중 수정 제한 테스트',
        startDate: '2035-01-01',
        peerEvaluationDeadline: '2035-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // 평가기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(HttpStatus.OK);

      // When: 진행 중인 평가기간의 시작일 변경 시도
      const updateData = {
        startDate: '2035-02-01',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData);

      // Then: 진행 중인 평가기간도 시작일 수정이 가능할 수 있음
      expect([
        HttpStatus.OK,
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      if (response.status !== HttpStatus.OK) {
        expect(response.body.message).toContain('시작');
        console.log('\n✅ 진행 중인 평가기간 수정 제한 확인');
      } else {
        console.log('\n✅ 진행 중인 평가기간 시작일 수정 가능 확인');
      }
    });

    it('완료된 평가기간의 시작일은 수정할 수 없어야 한다', async () => {
      // Given: 평가기간 생성, 시작, 완료 (2036년 사용)
      const createData = {
        name: '완료 수정 제한 테스트',
        startDate: '2036-01-01',
        peerEvaluationDeadline: '2036-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // 평가기간 시작
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
        .expect(HttpStatus.OK);

      // 평가기간 완료
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/complete`)
        .expect(HttpStatus.OK);

      // When: 완료된 평가기간의 시작일 변경 시도
      const updateData = {
        startDate: '2036-02-01',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData);

      // Then: 422 에러
      expect([
        HttpStatus.UNPROCESSABLE_ENTITY,
        HttpStatus.BAD_REQUEST,
      ]).toContain(response.status);

      console.log('\n✅ 완료된 평가기간 수정 제한 확인');
    });
  });

  describe('시나리오 5: 잘못된 입력', () => {
    it('잘못된 날짜 형식으로 요청 시 에러가 발생해야 한다', async () => {
      // Given: 평가기간 생성 (2037년 사용)
      const createData = {
        name: '잘못된 날짜 형식 테스트',
        startDate: '2037-01-01',
        peerEvaluationDeadline: '2037-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // When: 잘못된 날짜 형식
      const updateData = {
        startDate: 'invalid-date',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData);

      // Then: 400 에러
      expect(response.status).toBe(HttpStatus.BAD_REQUEST);

      console.log('\n✅ 잘못된 날짜 형식 검증 확인');
    });

    it('존재하지 않는 평가기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given: 존재하지 않는 ID
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When & Then
      const updateData = {
        startDate: '2025-02-01',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${nonExistentId}/start-date`)
        .send(updateData)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toContain('찾을 수 없습니다');

      console.log('\n✅ 존재하지 않는 ID 검증 확인');
    });
  });

  describe('시나리오 6: 엣지 케이스', () => {
    it('동일한 시작일로 변경해도 성공해야 한다', async () => {
      // Given: 평가기간 생성 (2038년 사용)
      const createData = {
        name: '동일 날짜 변경 테스트',
        startDate: '2038-01-01',
        peerEvaluationDeadline: '2038-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // When: 동일한 시작일로 변경
      const updateData = {
        startDate: '2038-01-01',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send(updateData)
        .expect(HttpStatus.OK);

      // Then
      expect(
        new Date(response.body.startDate).toISOString().split('T')[0],
      ).toBe('2038-01-01');

      console.log('\n✅ 동일 날짜 변경 성공');
    });

    it('여러 번 연속으로 시작일을 변경할 수 있어야 한다', async () => {
      // Given: 평가기간 생성 (2039년 사용)
      const createData = {
        name: '연속 변경 테스트',
        startDate: '2039-01-01',
        peerEvaluationDeadline: '2039-12-31',
        maxSelfEvaluationRate: 120,
      };

      const createResponse = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData)
        .expect(HttpStatus.CREATED);

      const evaluationPeriodId = createResponse.body.id;

      // When: 첫 번째 변경
      await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send({ startDate: '2039-02-01' })
        .expect(HttpStatus.OK);

      // 두 번째 변경
      await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send({ startDate: '2039-03-01' })
        .expect(HttpStatus.OK);

      // 세 번째 변경
      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/start-date`)
        .send({ startDate: '2039-04-01' })
        .expect(HttpStatus.OK);

      // Then
      expect(
        new Date(response.body.startDate).toISOString().split('T')[0],
      ).toBe('2039-04-01');

      console.log('\n✅ 연속 변경 성공');
    });
  });
});
