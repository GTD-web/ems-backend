/**
 * 성과평가 마감일 수정 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-periods/:id/performance-deadline - 실제 데이터 기반', () => {
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
            waiting: 0.4,
            inProgress: 0.4,
            completed: 0.2,
          },
        },
      })
      .expect(201);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 성공 케이스', () => {
    it('성과평가 마감일을 수정해야 한다', async () => {
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
        const period = periods[0];
        const evaluationPeriodId = period.id;

        const startDate = new Date(period.startDate);
        const newDeadline = new Date(startDate);
        newDeadline.setMonth(newDeadline.getMonth() + 2);

        const updateData = {
          performanceDeadline: newDeadline.toISOString().split('T')[0],
        };

        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send(updateData)
          .expect(HttpStatus.OK);

        expect(response.body.performanceDeadline).toBeDefined();
        expect(response.body.id).toBe(evaluationPeriodId);

        console.log('\n✅ 성과평가 마감일 설정 성공');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 2: 완료된 평가기간', () => {
    it('완료된 평가 기간의 마감일 수정은 실패해야 한다', async () => {
      const periods = await dataSource
        .getRepository('EvaluationPeriod')
        .createQueryBuilder('period')
        .where('period.deletedAt IS NULL')
        .andWhere('period.status = :status', { status: 'completed' })
        .limit(1)
        .getMany();

      if (periods.length > 0) {
        const evaluationPeriodId = periods[0].id;

        const updateData = {
          performanceDeadline: '2024-12-31',
        };

        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/performance-deadline`,
          )
          .send(updateData);

        expect(response.status).toBe(422);

        console.log('\n✅ 완료 상태 수정 제한 확인');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });
});
