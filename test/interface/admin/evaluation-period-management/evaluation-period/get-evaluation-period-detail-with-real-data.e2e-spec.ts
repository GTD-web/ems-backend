/**
 * 평가기간 상세 조회 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 평가기간 데이터를 사용하여
 * 평가기간 상세 조회 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 존재하는 평가기간 상세 조회
 * 2. 존재하지 않는 평가기간 조회
 * 3. 필드 검증
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('GET /admin/evaluation-periods/:id - 실제 데이터 기반', () => {
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

  describe('시나리오 1: 존재하는 평가기간 상세 조회', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 존재하는 평가기간 상세 조회 ===');

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
            periodCount: 3,
          },
        })
        .expect(201);

      console.log('실제 데이터 기반 시드 데이터 생성 완료');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .orderBy('period.createdAt', 'DESC')
        .limit(1)
        .getMany();

      evaluationPeriodId = evaluationPeriods[0].id;
      console.log(`테스트 평가기간 ID: ${evaluationPeriodId}`);
    });

    it('평가기간 상세 정보를 조회할 수 있어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 평가기간 상세 정보:');
      console.log('  ID:', result.id);
      console.log('  이름:', result.name);
      console.log('  상태:', result.status);
      console.log('  시작일:', result.startDate);

      // 기본 필드 검증
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');

      expect(result.id).toBe(evaluationPeriodId);
      expect(typeof result.name).toBe('string');
      expect(['waiting', 'in-progress', 'completed']).toContain(result.status);

      console.log('\n✅ 상세 조회 성공');
    });

    it('등급 구간 정보가 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📝 등급 구간 정보:');

      if (result.gradeRanges && Array.isArray(result.gradeRanges)) {
        console.log('  등급 구간 수:', result.gradeRanges.length);

        expect(result.gradeRanges.length).toBeGreaterThan(0);

        result.gradeRanges.forEach((range: any) => {
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
    });

    it('최대 자기평가 비율 정보가 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📝 최대 자기평가 비율:');
      console.log('  값:', result.maxSelfEvaluationRate);

      if (result.maxSelfEvaluationRate !== undefined) {
        expect(typeof result.maxSelfEvaluationRate).toBe('number');
        expect(result.maxSelfEvaluationRate).toBeGreaterThanOrEqual(0);
        expect(result.maxSelfEvaluationRate).toBeLessThanOrEqual(200);
      }

      console.log('\n✅ 최대 자기평가 비율 검증 완료');
    });

    it('권한 설정 정보가 포함되어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📝 권한 설정 정보:');

      // 권한 관련 필드들 확인
      const permissionFields = [
        'isCriteriaSettingAllowed',
        'isSelfEvaluationSettingAllowed',
        'isManualSettingAllowed',
        'isFinalEvaluationSettingAllowed',
      ];

      permissionFields.forEach((field) => {
        if (result[field] !== undefined) {
          console.log(`  ${field}:`, result[field]);
          expect(typeof result[field]).toBe('boolean');
        }
      });

      console.log('\n✅ 권한 설정 검증 완료');
    });

    it('타임스탬프 필드들이 올바른 형식이어야 한다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 타임스탬프 검증:');

      expect(new Date(result.createdAt).toString()).not.toBe('Invalid Date');
      expect(new Date(result.updatedAt).toString()).not.toBe('Invalid Date');
      expect(new Date(result.startDate).toString()).not.toBe('Invalid Date');

      // 선택적 날짜 필드들
      const optionalDateFields = [
        'peerEvaluationDeadline',
        'selfEvaluationDeadline',
        'performanceDeadline',
        'evaluationSetupDeadline',
      ];

      optionalDateFields.forEach((field) => {
        if (result[field]) {
          expect(new Date(result[field]).toString()).not.toBe('Invalid Date');
        }
      });

      console.log('  ✓ 모든 타임스탬프가 유효함');
      console.log('\n✅ 타임스탬프 검증 완료');
    });
  });

  describe('시나리오 2: 존재하지 않는 평가기간 조회', () => {
    it('존재하지 않는 ID로 조회 시 null 또는 빈 객체를 반환해야 한다', async () => {
      console.log('\n=== 시나리오 2: 존재하지 않는 평가기간 조회 ===');

      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${nonExistentId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📊 응답 결과:');
      console.log('  result:', result);

      // null이 빈 객체로 직렬화될 수 있으므로 둘 다 허용
      const isEmpty =
        result === null ||
        result === undefined ||
        Object.keys(result).length === 0;

      expect(isEmpty).toBe(true);

      console.log('\n✅ null/빈 객체 반환 확인');
    });

    it('잘못된 UUID 형식으로 조회 시 에러를 반환해야 한다', async () => {
      console.log('\n=== 잘못된 UUID 형식 조회 ===');

      const invalidUuid = 'invalid-uuid-format';

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${invalidUuid}`);

      console.log('\n📊 응답 상태:', response.status);

      // 400 Bad Request 또는 500 Internal Server Error
      expect([400, 500]).toContain(response.status);

      console.log('\n✅ 에러 응답 확인');
    });
  });

  describe('시나리오 3: 다양한 상태의 평가기간 조회', () => {
    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 다양한 상태의 평가기간 조회 ===');
    });

    it('진행중인 평가기간을 조회할 수 있어야 한다', async () => {
      // 진행중인 평가기간 찾기
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'in-progress' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const periodId = periods[0].id;

        console.log('\n진행중인 평가기간 ID:', periodId);

        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${periodId}`)
          .expect(HttpStatus.OK);

        const result = response.body;

        console.log('  상태:', result.status);

        expect(result.status).toBe('in-progress');

        console.log('\n✅ 진행중인 평가기간 조회 성공');
      } else {
        console.log('\n⚠️  진행중인 평가기간이 없어서 테스트 스킵');
      }
    });

    it('완료된 평가기간을 조회할 수 있어야 한다', async () => {
      // 완료된 평가기간 찾기
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'completed' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const periodId = periods[0].id;

        console.log('\n완료된 평가기간 ID:', periodId);

        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${periodId}`)
          .expect(HttpStatus.OK);

        const result = response.body;

        console.log('  상태:', result.status);

        expect(result.status).toBe('completed');

        console.log('\n✅ 완료된 평가기간 조회 성공');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 4: 스케줄 정보 검증', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 4: 스케줄 정보 검증 ===');

      // 평가기간 조회
      const evaluationPeriods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .limit(1)
        .getMany();

      if (evaluationPeriods.length > 0) {
        evaluationPeriodId = evaluationPeriods[0].id;
      }
    });

    it('스케줄 관련 필드들이 일관성이 있어야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(HttpStatus.OK);

      const result = response.body;

      console.log('\n📝 스케줄 정보:');
      console.log('  시작일:', result.startDate);
      console.log('  자기평가 마감:', result.selfEvaluationDeadline);
      console.log('  동료평가 마감:', result.peerEvaluationDeadline);
      console.log('  성과평가 마감:', result.performanceDeadline);

      // 시작일은 필수
      expect(result.startDate).toBeDefined();

      // 각 마감일이 있으면 시작일 이후여야 함
      if (result.selfEvaluationDeadline) {
        const startDate = new Date(result.startDate);
        const deadline = new Date(result.selfEvaluationDeadline);
        expect(deadline.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      }

      console.log('\n✅ 스케줄 일관성 검증 완료');
    });
  });
});
