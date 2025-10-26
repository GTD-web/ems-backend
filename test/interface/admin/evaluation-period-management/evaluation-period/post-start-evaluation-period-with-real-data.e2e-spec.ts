/**
 * 평가기간 시작 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('POST /admin/evaluation-periods/:id/start - 실제 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

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

    await testSuite
      .request()
      .post('/admin/seed/generate-with-real-data')
      .send({
        scenario: 'with_period',
        clearExisting: false,
        evaluationConfig: {
          periodCount: 5,
        },
        stateDistribution: {
          evaluationPeriodStatus: {
            waiting: 0.8, // 80%는 대기 중
            inProgress: 0, // 시작 테스트를 위해 진행 중인 평가기간 없음
            completed: 0.2, // 20%는 완료
          },
        },
      })
      .expect(201);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 성공 케이스', () => {
    it('대기 중인 평가 기간을 성공적으로 시작해야 한다', async () => {
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'waiting' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        const response = await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
          .expect(HttpStatus.OK);

        expect(response.body).toEqual({ success: true });

        // 상태 변경 확인
        const detailResponse = await testSuite
          .request()
          .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
          .expect(HttpStatus.OK);

        expect(detailResponse.body.status).toBe('in-progress');

        console.log('\n✅ 평가기간 시작 성공');
      } else {
        console.log('대기 중인 평가기간이 없어서 테스트 스킵');
      }
    });

    it('진행 중인 평가 기간이 활성 목록에 나타나야 한다', async () => {
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'in-progress' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        const activeResponse = await testSuite
          .request()
          .get('/admin/evaluation-periods/active')
          .expect(HttpStatus.OK);

        const activePeriod = activeResponse.body.find(
          (p: any) => p.id === evaluationPeriodId,
        );
        expect(activePeriod).toBeDefined();
        expect(activePeriod.status).toBe('in-progress');

        console.log('\n✅ 진행 중인 평가기간 활성 목록 확인');
      } else {
        console.log('진행 중인 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 2: 이미 시작된 평가기간', () => {
    it('이미 진행 중인 평가 기간을 시작하려고 하면 에러가 발생해야 한다', async () => {
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'in-progress' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        const response = await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`);

        expect([400, 422]).toContain(response.status);

        console.log('\n✅ 이미 시작된 평가기간 재시작 제한 확인');
      } else {
        console.log('\n⚠️  진행 중인 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 3: 완료된 평가기간', () => {
    it('완료된 평가 기간을 시작하려고 하면 에러가 발생해야 한다', async () => {
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'completed' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        const response = await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`);

        expect([400, 422]).toContain(response.status);

        console.log('\n✅ 완료된 평가기간 시작 제한 확인');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });
});
