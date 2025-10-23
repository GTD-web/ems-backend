/**
 * 평가기준 설정 권한 수정 - 실제 데이터 기반 E2E 테스트
 *
 * 이 테스트는 실제 평가기간 데이터를 사용하여
 * 평가기준 설정 권한 수정 기능을 검증합니다.
 */

import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { DataSource } from 'typeorm';

describe('PATCH /admin/evaluation-periods/:id/settings/criteria-permission - 실제 데이터 기반', () => {
  let testSuite: BaseE2ETest;
  let dataSource: DataSource;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    dataSource = testSuite.app.get(DataSource);

    // 기존 데이터 정리 및 시드 데이터 생성
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
    it('평가 기준 설정 수동 허용을 true로 변경해야 한다', async () => {
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

        console.log('\n평가기간 ID:', evaluationPeriodId);

        const updateData = {
          allowManualSetting: true,
        };

        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData)
          .expect(HttpStatus.OK);

        console.log('수정된 권한:', response.body.criteriaSettingEnabled);

        expect(response.body.criteriaSettingEnabled).toBe(true);
        expect(response.body.id).toBe(evaluationPeriodId);

        console.log('\n✅ 권한 true 설정 성공');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });

    it('평가 기준 설정 수동 허용을 false로 변경해야 한다', async () => {
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
          allowManualSetting: false,
        };

        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData)
          .expect(HttpStatus.OK);

        console.log('\n수정된 권한:', response.body.criteriaSettingEnabled);

        expect(response.body.criteriaSettingEnabled).toBe(false);
        expect(response.body.id).toBe(evaluationPeriodId);

        console.log('\n✅ 권한 false 설정 성공');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });

    it('동일한 값으로 여러 번 수정해도 정상 동작해야 한다', async () => {
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
          allowManualSetting: true,
        };

        // 첫 번째 수정
        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData)
          .expect(HttpStatus.OK);

        // 두 번째 수정 (동일한 값)
        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData)
          .expect(HttpStatus.OK);

        console.log('\n수정된 권한:', response.body.criteriaSettingEnabled);

        expect(response.body.criteriaSettingEnabled).toBe(true);

        console.log('\n✅ 중복 수정 성공');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 2: 클라이언트 에러', () => {
    it('존재하지 않는 평가 기간 ID로 수정 시 에러가 발생해야 한다', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const updateData = {
        allowManualSetting: true,
      };

      const response = await testSuite
        .request()
        .patch(
          `/admin/evaluation-periods/${nonExistentId}/settings/criteria-permission`,
        )
        .send(updateData);

      console.log('\n응답 상태:', response.status);

      expect([400, 404]).toContain(response.status);

      console.log('\n✅ 에러 처리 확인');
    });

    it('잘못된 타입의 값으로 수정 시 400 에러가 발생해야 한다', async () => {
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
          allowManualSetting: 'invalid-value',
        };

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData)
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 타입 검증 확인');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });

    it('빈 객체로 요청 시 400 에러가 발생해야 한다', async () => {
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

        const updateData = {};

        await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData)
          .expect(HttpStatus.BAD_REQUEST);

        console.log('\n✅ 빈 객체 검증 확인');
      } else {
        console.log('평가기간이 없어서 테스트 스킵');
      }
    });
  });

  describe('시나리오 3: 상태별 수정', () => {
    it('완료된 평가 기간의 권한 수정은 실패해야 한다', async () => {
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
          allowManualSetting: true,
        };

        const response = await testSuite
          .request()
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData);

        console.log('응답 상태:', response.status);

        // 완료된 평가기간은 수정할 수 없음 (422 에러)
        expect(response.status).toBe(422);

        console.log('\n✅ 완료 상태 수정 제한 확인');
      } else {
        console.log('\n⚠️  완료된 평가기간이 없어서 테스트 스킵');
      }
    });
  });
});
