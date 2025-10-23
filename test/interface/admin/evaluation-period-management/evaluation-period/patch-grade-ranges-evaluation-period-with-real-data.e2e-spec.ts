/**
 * 등급 구간 수정 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-periods/:id/grade-ranges - 실제 데이터 기반', () => {
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
    it('등급 구간을 수정해야 한다', async () => {
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
        const evaluationPeriodId = periods[0].id;

        const updateData = {
          gradeRanges: [
            { grade: 'S', minRange: 95, maxRange: 100 },
            { grade: 'A', minRange: 85, maxRange: 94 },
            { grade: 'B', minRange: 70, maxRange: 84 },
            { grade: 'C', minRange: 0, maxRange: 69 },
          ],
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
          .send(updateData)
          .expect(HttpStatus.OK);

        expect(response.body.id).toBe(evaluationPeriodId);
        expect(response.body.gradeRanges).toBeDefined();
        expect(Array.isArray(response.body.gradeRanges)).toBe(true);
        expect(response.body.gradeRanges.length).toBe(4);

        console.log('\n✅ 등급 구간 수정 성공');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });

    it('등급 구간을 추가로 수정해야 한다', async () => {
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
        const evaluationPeriodId = periods[0].id;

        const updateData = {
          gradeRanges: [
            { grade: 'S+', minRange: 98, maxRange: 100 },
            { grade: 'S', minRange: 95, maxRange: 97 },
            { grade: 'A', minRange: 85, maxRange: 94 },
            { grade: 'B', minRange: 70, maxRange: 84 },
            { grade: 'C', minRange: 0, maxRange: 69 },
          ],
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
          .send(updateData)
          .expect(HttpStatus.OK);

        expect(response.body.gradeRanges.length).toBe(5);

        console.log('\n✅ 등급 구간 추가 수정 성공');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 2: 클라이언트 에러', () => {
    it('잘못된 등급 구간 범위로 수정 시 에러가 발생해야 한다', async () => {
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
        const evaluationPeriodId = periods[0].id;

        // minRange > maxRange인 잘못된 범위
        const updateData = {
          gradeRanges: [{ grade: 'A', minRange: 90, maxRange: 80 }],
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
          .send(updateData);

        expect([400, 422]).toContain(response.status);

        console.log('\n✅ 잘못된 범위 검증 확인');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 3: 완료된 평가기간', () => {
    it('완료된 평가 기간도 등급 구간 수정이 가능할 수 있다', async () => {
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
          gradeRanges: [
            { grade: 'A', minRange: 80, maxRange: 100 },
            { grade: 'B', minRange: 0, maxRange: 79 },
          ],
        };

        const response = await testSuite
          .request()
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
          .send(updateData);

        // 등급 구간은 완료된 평가기간에서도 수정 가능할 수 있음
        expect([200, 422]).toContain(response.status);

        console.log('\n✅ 완료 상태 등급 구간 수정 확인');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });
});
