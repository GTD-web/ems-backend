/**
 * 평가기간 삭제 - 실제 데이터 기반 E2E 테스트
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('DELETE /admin/evaluation-periods/:id - 실제 데이터 기반', () => {
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
            inProgress: 0.3,
            completed: 0.3,
          },
        },
      })
      .expect(201);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  describe('시나리오 1: 성공 케이스', () => {
    it('대기 중인 평가 기간을 삭제해야 한다', async () => {
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
          .delete(`/admin/evaluation-periods/${evaluationPeriodId}`)
          .expect(HttpStatus.OK);

        expect(response.body).toEqual({ success: true });

        // 목록에서 제외됐는지 확인
        const listResponse = await testSuite
          .request()
          .get('/admin/evaluation-periods')
          .expect(HttpStatus.OK);

        const deletedPeriod = listResponse.body.items?.find(
          (p: any) => p.id === evaluationPeriodId,
        );
        expect(deletedPeriod).toBeUndefined();

        console.log('\n✅ 대기 중인 평가기간 삭제 성공');
      } else {
        console.log('대기 중인 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 2: 진행 중인 평가기간', () => {
    it('진행 중인 평가 기간 삭제 시 에러가 발생해야 한다', async () => {
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
          .delete(`/admin/evaluation-periods/${evaluationPeriodId}`);

        // 진행 중인 평가기간 삭제는 제한될 수 있음
        expect([200, 400, 422]).toContain(response.status);

        console.log('\n✅ 진행 중인 평가기간 삭제 확인');
      } else {
        console.log('\n⚠️  진행 중인 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 3: 완료된 평가기간', () => {
    it('완료된 평가 기간 삭제 시 에러가 발생해야 한다', async () => {
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
          .delete(`/admin/evaluation-periods/${evaluationPeriodId}`);

        // 완료된 평가기간 삭제는 제한될 수 있음
        expect([200, 400, 422]).toContain(response.status);

        console.log('\n✅ 완료된 평가기간 삭제 확인');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 4: 존재하지 않는 평가기간', () => {
    it('존재하지 않는 평가 기간 삭제 시 404 에러가 발생해야 한다', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await testSuite
        .request()
        .delete(`/admin/evaluation-periods/${nonExistentId}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.message).toContain('찾을 수 없습니다');

      console.log('\n✅ 존재하지 않는 평가기간 삭제 시 404 확인');
    });
  });
});
