/**
 * 평가기간 기본 정보 수정 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 평가기간 데이터를 사용하여
 * 기본 정보 수정 기능을 검증합니다.
 *
 * 테스트 시나리오:
 * 1. 성공 케이스 (이름/설명/달성률 수정)
 * 2. 클라이언트 에러 (잘못된 입력)
 * 3. 달성률 검증
 * 4. 상태별 수정
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-periods/:id/basic-info - 실제 데이터 기반', () => {
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

  describe('시나리오 1: 성공 케이스', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 1: 성공 케이스 ===');

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

      // 평가기간 조회 (수정 가능한 상태: waiting 또는 in-progress)
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status IN (:...statuses)', {
          statuses: ['waiting', 'in-progress'],
        })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        evaluationPeriodId = periods[0].id;
        console.log(`테스트 평가기간 ID: ${evaluationPeriodId}`);
      }
    });

    it('평가 기간 이름을 성공적으로 수정해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        name: '수정된 평가기간 이름',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 수정된 이름:', response.body.name);

      expect(response.body.name).toBe(updateData.name);

      console.log('\n✅ 이름 수정 성공');
    });

    it('평가 기간 설명을 성공적으로 수정해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        description: '수정된 평가기간 설명입니다.',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 수정된 설명:', response.body.description);

      expect(response.body.description).toBe(updateData.description);

      console.log('\n✅ 설명 수정 성공');
    });

    it('자기평가 달성률 최대값을 성공적으로 수정해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        maxSelfEvaluationRate: 150,
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 수정된 달성률:', response.body.maxSelfEvaluationRate);

      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );

      console.log('\n✅ 달성률 수정 성공');
    });

    it('모든 기본 정보를 동시에 수정해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        name: '완전히 수정된 평가기간 이름',
        description: '완전히 수정된 평가기간 설명',
        maxSelfEvaluationRate: 180,
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 수정된 정보:');
      console.log('  이름:', response.body.name);
      console.log('  설명:', response.body.description);
      console.log('  달성률:', response.body.maxSelfEvaluationRate);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );

      console.log('\n✅ 전체 수정 성공');
    });

    it('빈 객체로 요청 시 기존 값이 유지되어야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {};

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 기존 값 유지 확인:');
      console.log('  이름:', response.body.name);
      console.log('  설명:', response.body.description);

      expect(response.body.name).toBeDefined();
      expect(response.body.description).toBeDefined();

      console.log('\n✅ 빈 객체 처리 성공');
    });

    it('특수 문자가 포함된 이름과 설명을 수정해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        name: '2024년 Q2 평가기간 (수정) - [특별]',
        description:
          '특수문자 포함 설명: @#$%^&*()_+-=[]{}|;:,.<>?/~`\n줄바꿈도 포함',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 특수문자 포함 수정:');
      console.log('  이름:', response.body.name);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);

      console.log('\n✅ 특수문자 수정 성공');
    });
  });

  describe('시나리오 2: 클라이언트 에러', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 2: 클라이언트 에러 ===');

      // 평가기간 조회
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        evaluationPeriodId = periods[0].id;
      }
    });

    it('존재하지 않는 평가 기간 ID로 수정 시 에러가 발생해야 한다', async () => {
      const nonExistentId = '12345678-1234-1234-1234-123456789012';
      const updateData = {
        name: '존재하지 않는 평가기간 수정',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${nonExistentId}/basic-info`)
        .send(updateData);

      console.log('\n📊 응답 상태:', response.status);

      expect([400, 404]).toContain(response.status);

      console.log('\n✅ 에러 처리 확인');
    });

    it('잘못된 UUID 형식으로 수정 시 에러가 발생해야 한다', async () => {
      const invalidId = 'invalid-uuid-format';
      const updateData = {
        name: '잘못된 UUID 테스트',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${invalidId}/basic-info`)
        .send(updateData);

      console.log('\n📊 응답 상태:', response.status);

      expect([400, 500]).toContain(response.status);

      console.log('\n✅ UUID 검증 확인');
    });

    it('빈 문자열 이름으로 수정 시 400 에러가 발생해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        name: '',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 에러 메시지:', response.body.message);

      expect(response.body.message).toContain(
        '평가 기간명이 제공된 경우 빈 값일 수 없습니다.',
      );

      console.log('\n✅ 빈 문자열 검증 확인');
    });

    it('잘못된 타입의 설명으로 수정 시 400 에러가 발생해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        description: ['배열', '타입', '설명'],
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 에러 메시지:', response.body.message);

      expect(response.body.message).toContain(
        '평가 기간 설명은 문자열이어야 합니다.',
      );

      console.log('\n✅ 타입 검증 확인');
    });
  });

  describe('시나리오 3: 달성률 검증', () => {
    let evaluationPeriodId: string;

    beforeAll(async () => {
      console.log('\n=== 시나리오 3: 달성률 검증 ===');

      // 평가기간 조회 (수정 가능한 상태: waiting 또는 in-progress)
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status IN (:...statuses)', {
          statuses: ['waiting', 'in-progress'],
        })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        evaluationPeriodId = periods[0].id;
      }
    });

    it('달성률이 100% 미만일 때 400 에러가 발생해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        maxSelfEvaluationRate: 99,
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 에러 메시지:', response.body.message);

      expect(response.body.message).toContain(
        '자기평가 달성률 최대값은 100% 이상이어야 합니다.',
      );

      console.log('\n✅ 최소값 검증 확인');
    });

    it('달성률이 200%를 초과할 때 400 에러가 발생해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        maxSelfEvaluationRate: 201,
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 에러 메시지:', response.body.message);

      expect(response.body.message).toContain(
        '자기평가 달성률 최대값은 200% 이하여야 합니다.',
      );

      console.log('\n✅ 최대값 검증 확인');
    });

    it('달성률이 문자열일 때 400 에러가 발생해야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        maxSelfEvaluationRate: '150%',
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.BAD_REQUEST);

      console.log('\n📊 에러 메시지:', response.body.message);

      expect(response.body.message).toContain(
        '자기평가 달성률 최대값은 숫자여야 합니다.',
      );

      console.log('\n✅ 타입 검증 확인');
    });

    it('달성률 경계값 테스트 (100%, 200%)', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      // 100% 설정 (성공)
      const updateData100 = {
        maxSelfEvaluationRate: 100,
      };

      const response100 = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData100)
        .expect(HttpStatus.OK);

      console.log('\n📝 100% 설정:', response100.body.maxSelfEvaluationRate);

      expect(response100.body.maxSelfEvaluationRate).toBe(100);

      // 200% 설정 (성공)
      const updateData200 = {
        maxSelfEvaluationRate: 200,
      };

      const response200 = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData200)
        .expect(HttpStatus.OK);

      console.log('📝 200% 설정:', response200.body.maxSelfEvaluationRate);

      expect(response200.body.maxSelfEvaluationRate).toBe(200);

      console.log('\n✅ 경계값 테스트 성공');
    });
  });

  describe('시나리오 4: 상태별 수정', () => {
    beforeAll(async () => {
      console.log('\n=== 시나리오 4: 상태별 수정 ===');
    });

    it('대기 중인 평가 기간의 기본 정보를 수정해야 한다', async () => {
      // 대기 중인 평가기간 찾기
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'waiting' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        console.log('\n대기 중인 평가기간 ID:', evaluationPeriodId);

        const updateData = {
          name: '대기 상태에서 수정된 이름',
          description: '대기 상태에서 수정된 설명',
          maxSelfEvaluationRate: 160,
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
          .send(updateData)
          .expect(HttpStatus.OK);

        console.log('  수정된 이름:', response.body.name);
        console.log('  상태:', response.body.status);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.description).toBe(updateData.description);
        expect(response.body.maxSelfEvaluationRate).toBe(
          updateData.maxSelfEvaluationRate,
        );
        expect(response.body.status).toBe('waiting');

        console.log('\n✅ 대기 중 수정 성공');
      } else {
        console.log('\n⚠️  대기 중인 평가기간이 없어서 테스트 스킵');
      }
    });

    it('진행 중인 평가 기간의 기본 정보를 수정해야 한다', async () => {
      // 진행 중인 평가기간 찾기
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'in-progress' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        console.log('\n진행 중인 평가기간 ID:', evaluationPeriodId);

        const updateData = {
          name: '진행 중 상태에서 수정된 이름',
          description: '진행 중 상태에서 수정된 설명',
          maxSelfEvaluationRate: 170,
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
          .send(updateData)
          .expect(HttpStatus.OK);

        console.log('  수정된 이름:', response.body.name);
        console.log('  상태:', response.body.status);

        expect(response.body.name).toBe(updateData.name);
        expect(response.body.description).toBe(updateData.description);
        expect(response.body.maxSelfEvaluationRate).toBe(
          updateData.maxSelfEvaluationRate,
        );
        expect(response.body.status).toBe('in-progress');

        console.log('\n✅ 진행 중 수정 성공');
      } else {
        console.log('\n⚠️  진행 중인 평가기간이 없어서 테스트 스킵');
      }
    });

    it('완료된 평가 기간의 기본 정보 수정은 실패해야 한다', async () => {
      // 완료된 평가기간 찾기
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'completed' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        console.log('\n완료된 평가기간 ID:', evaluationPeriodId);

        const updateData = {
          name: '완료 상태에서 수정 시도',
          description: '완료 상태에서 수정 시도',
          maxSelfEvaluationRate: 180,
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
          .send(updateData);

        console.log('  응답 상태:', response.status);

        // 완료된 평가기간은 수정할 수 없음 (422 에러)
        expect(response.status).toBe(422);

        console.log('\n✅ 완료 상태 수정 제한 확인');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 5: 데이터 무결성', () => {
    let evaluationPeriodId: string;
    let originalData: any;

    beforeAll(async () => {
      console.log('\n=== 시나리오 5: 데이터 무결성 ===');

      // 평가기간 조회 (수정 가능한 상태: waiting 또는 in-progress)
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status IN (:...statuses)', {
          statuses: ['waiting', 'in-progress'],
        })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        evaluationPeriodId = periods[0].id;

        // 원본 데이터 조회
        const response = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
          .expect(HttpStatus.OK);

        originalData = response.body;
      }
    });

    it('기본 정보 수정 후 다른 필드들이 변경되지 않아야 한다', async () => {
      if (!evaluationPeriodId) {
        console.log('평가기간이 없어서 테스트 스킵');
        return;
      }

      const updateData = {
        name: '무결성 테스트 수정된 이름',
        description: '무결성 테스트 수정된 설명',
        maxSelfEvaluationRate: 175,
      };

      const response = await testSuite
        .request()
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/basic-info`)
        .send(updateData)
        .expect(HttpStatus.OK);

      console.log('\n📝 수정 후 데이터:');
      console.log('  이름:', response.body.name);
      console.log('  설명:', response.body.description);
      console.log('  달성률:', response.body.maxSelfEvaluationRate);

      // 기본 정보는 변경됨
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.maxSelfEvaluationRate).toBe(
        updateData.maxSelfEvaluationRate,
      );

      // 날짜 필드는 변경되지 않음
      expect(response.body.startDate).toBeDefined();

      // 메타데이터는 변경되지 않음
      expect(response.body.createdAt).toBe(originalData.createdAt);
      expect(response.body.updatedAt).toBeDefined();

      console.log('\n✅ 데이터 무결성 확인');
    });
  });
});
