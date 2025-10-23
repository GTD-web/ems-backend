/**
 * 평가기간 목록 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 부서/직원/평가기간 데이터를 사용하여
 * 평가기간 목록 조회 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 페이징 조회
 * 2. 상태별 필터링
 * 3. 검색 기능
 * 4. 정렬 기능
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-periods - 실제 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 기본 페이징 조회', () => {
    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 기본 페이징 조회 ===');

      // 기존 데이터 정리
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

      // with_period 시나리오로 시드 데이터 생성
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_period',
          clearExisting: false,
          evaluationConfig: {
            periodCount: 5,
          },
        })
        .expect(201);

      console.log('실제 데이터 기반 시드 데이터 생성 완료');
    });

    it('평가기간 목록을 페이징으로 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 구조:');
      console.log('  items:', result.items?.length || 0);
      console.log('  total:', result.total);
      console.log('  page:', result.page);
      console.log('  limit:', result.limit);

      // 기본 구조 검증
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');

      expect(Array.isArray(result.items)).toBe(true);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBeGreaterThan(0);

      console.log('\n✅ 페이징 조회 성공');
    });

    it('각 평가기간이 필수 필드를 포함해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.items.length > 0) {
        const period = result.items[0];

        console.log('\n📝 평가기간 정보:');
        console.log('  ID:', period.id);
        console.log('  이름:', period.name);
        console.log('  상태:', period.status);

        // 필수 필드 검증
        expect(period).toHaveProperty('id');
        expect(period).toHaveProperty('name');
        expect(period).toHaveProperty('status');
        expect(period).toHaveProperty('startDate');
        expect(period).toHaveProperty('createdAt');
        expect(period).toHaveProperty('updatedAt');

        // 값 타입 검증
        expect(typeof period.id).toBe('string');
        expect(typeof period.name).toBe('string');
        expect(['waiting', 'in-progress', 'completed']).toContain(
          period.status,
        );

        console.log('\n✅ 필수 필드 검증 완료');
      }
    });

    it('페이지 크기를 조정하여 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 3 })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 페이지 크기 조정:');
      console.log('  요청 limit: 3');
      console.log('  실제 items 수:', result.items.length);

      expect(result.limit).toBe(3);
      expect(result.items.length).toBeLessThanOrEqual(3);

      console.log('\n✅ 페이지 크기 조정 성공');
    });
  });

  describe('시나리오 2: 다양한 상태 확인', () => {
    it('평가기간이 다양한 상태를 가질 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 평가기간 상태 확인:');
      console.log('  총 개수:', result.total);

      const statusCount = result.items.reduce((acc: any, period: any) => {
        acc[period.status] = (acc[period.status] || 0) + 1;
        return acc;
      }, {});

      console.log('  상태별 개수:', statusCount);

      // 각 평가기간이 유효한 상태를 가져야 함
      result.items.forEach((period: any) => {
        expect(['waiting', 'in-progress', 'completed']).toContain(
          period.status,
        );
      });

      console.log('\n✅ 상태 확인 완료');
    });
  });

  describe('시나리오 3: 정렬 기능', () => {
    it('생성일 기준 내림차순으로 정렬되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10, sortBy: 'createdAt', order: 'DESC' })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 정렬 결과:');
      console.log('  items 수:', result.items.length);

      if (result.items.length >= 2) {
        const firstDate = new Date(result.items[0].createdAt);
        const secondDate = new Date(result.items[1].createdAt);

        console.log('  첫 번째 날짜:', firstDate);
        console.log('  두 번째 날짜:', secondDate);

        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime(),
        );

        console.log('\n✅ 정렬 확인 완료');
      }
    });
  });

  describe('시나리오 4: 빈 결과 처리', () => {
    beforeAll(async () => {
      console.log('\n=== 시나리오 4: 빈 결과 처리 ===');

      // 데이터 정리
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

      console.log('데이터 정리 완료');
    });

    it('평가기간이 없을 때 빈 목록을 반환해야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 빈 목록 조회:');
      console.log('  items:', result.items.length);
      console.log('  total:', result.total);

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);

      console.log('\n✅ 빈 목록 반환 확인');
    });
  });

  describe('시나리오 5: 타임스탬프 및 필드 검증', () => {
    beforeAll(async () => {
      console.log('\n=== 시나리오 5: 타임스탬프 및 필드 검증 ===');

      // 데이터 생성
      await testSuite
        .request()
        .post('/admin/seed/generate-with-real-data')
        .send({
          scenario: 'with_period',
          clearExisting: false,
          evaluationConfig: {
            periodCount: 3,
          },
        })
        .expect(201);
    });

    it('타임스탬프 필드들이 올바른 형식이어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 타임스탬프 검증:');

      result.items.forEach((period: any) => {
        expect(new Date(period.createdAt).toString()).not.toBe('Invalid Date');
        expect(new Date(period.updatedAt).toString()).not.toBe('Invalid Date');
        expect(new Date(period.startDate).toString()).not.toBe('Invalid Date');
      });

      console.log('  ✓ 모든 타임스탬프가 유효함');
      console.log('\n✅ 타임스탬프 검증 완료');
    });

    it('등급 구간 정보가 올바르게 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get('/admin/evaluation-periods')
        .query({ page: 1, limit: 10 })
        .expect(HttpStatus.OK);

      const result = response.body;

      if (result.items.length > 0) {
        const period = result.items[0];

        console.log('\n📝 등급 구간 검증:');

        if (period.gradeRanges && Array.isArray(period.gradeRanges)) {
          console.log('  등급 구간 수:', period.gradeRanges.length);

          period.gradeRanges.forEach((range: any) => {
            expect(range).toHaveProperty('grade');
            expect(range).toHaveProperty('minRange');
            expect(range).toHaveProperty('maxRange');

            expect(typeof range.grade).toBe('string');
            expect(typeof range.minRange).toBe('number');
            expect(typeof range.maxRange).toBe('number');
            expect(range.minRange).toBeLessThanOrEqual(range.maxRange);
          });

          console.log('  ✓ 등급 구간 정보 유효함');
        }

        console.log('\n✅ 등급 구간 검증 완료');
      }
    });
  });
});
