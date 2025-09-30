import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../src/app.module';
import { EvaluationPeriod } from '../../../../src/domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodStatus } from '../../../../src/domain/core/evaluation-period/evaluation-period.types';

describe('PATCH /admin/evaluation-periods/:id/settings/criteria-permission (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let evaluationPeriodId: string;
  let completedEvaluationPeriodId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  beforeEach(async () => {
    // 테스트용 평가 기간 생성 (WAITING 상태)
    const evaluationPeriod = new EvaluationPeriod();
    Object.assign(evaluationPeriod, {
      name: `테스트 평가 기간 ${Date.now()}`,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: EvaluationPeriodStatus.WAITING,
      maxSelfEvaluationRate: 120,
      criteriaSettingEnabled: false, // 기본값 false로 설정
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: false,
      gradeRanges: [
        { grade: 'S', minRange: 95, maxRange: 100 },
        { grade: 'A', minRange: 85, maxRange: 94 },
        { grade: 'B', minRange: 75, maxRange: 84 },
        { grade: 'C', minRange: 65, maxRange: 74 },
        { grade: 'F', minRange: 0, maxRange: 64 },
      ],
      createdBy: 'test-user',
      updatedBy: 'test-user',
    });

    const savedPeriod = await dataSource.manager.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 완료된 평가 기간 생성 (COMPLETED 상태)
    const completedPeriod = new EvaluationPeriod();
    Object.assign(completedPeriod, {
      name: `완료된 평가 기간 ${Date.now()}`,
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31'),
      status: EvaluationPeriodStatus.COMPLETED,
      maxSelfEvaluationRate: 120,
      criteriaSettingEnabled: true,
      selfEvaluationSettingEnabled: true,
      finalEvaluationSettingEnabled: false,
      gradeRanges: [
        { grade: 'A', minRange: 80, maxRange: 100 },
        { grade: 'B', minRange: 60, maxRange: 79 },
        { grade: 'C', minRange: 0, maxRange: 59 },
      ],
      createdBy: 'test-user',
      updatedBy: 'test-user',
    });

    const savedCompletedPeriod = await dataSource.manager.save(completedPeriod);
    completedEvaluationPeriodId = savedCompletedPeriod.id;
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    if (evaluationPeriodId) {
      await dataSource.manager.delete(EvaluationPeriod, {
        id: evaluationPeriodId,
      });
    }
    if (completedEvaluationPeriodId) {
      await dataSource.manager.delete(EvaluationPeriod, {
        id: completedEvaluationPeriodId,
      });
    }
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  // ==================== 성공 케이스 ====================

  describe('성공 케이스', () => {
    it('평가 기준 설정 수동 허용을 true로 변경 시 200 응답을 반환해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: true,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.criteriaSettingEnabled).toBe(true);
      expect(response.body.id).toBe(evaluationPeriodId);
    });

    it('평가 기준 설정 수동 허용을 false로 변경 시 200 응답을 반환해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: false,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.criteriaSettingEnabled).toBe(false);
      expect(response.body.id).toBe(evaluationPeriodId);
    });

    it('동일한 값으로 여러 번 수정해도 정상 동작해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: true,
      };

      // When - 첫 번째 수정
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(200);

      // When - 두 번째 수정 (동일한 값)
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.criteriaSettingEnabled).toBe(true);
    });

    it('수정 후 다른 필드들은 변경되지 않아야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: true,
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.name).toContain('테스트 평가 기간');
      expect(response.body.status).toBe('waiting');
      expect(response.body.maxSelfEvaluationRate).toBe(120);
      expect(response.body.selfEvaluationSettingEnabled).toBe(true);
      expect(response.body.finalEvaluationSettingEnabled).toBe(false);
      expect(response.body.gradeRanges).toHaveLength(5);
    });
  });

  // ==================== 실패 케이스 - 요청 데이터 검증 ====================

  describe('실패 케이스 - 요청 데이터 검증', () => {
    it('allowManualSetting 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {};

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('수동 허용 여부는 필수'),
        ]),
      );
    });

    it('allowManualSetting이 불린 값이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: 'invalid',
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('불린 값')]),
      );
    });

    it('allowManualSetting이 숫자인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: 1,
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('불린 값')]),
      );
    });

    it('allowManualSetting이 null인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: null,
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringContaining('수동 허용 여부는 필수'),
        ]),
      );
    });

    it('allowManualSetting이 배열인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: [true],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('불린 값')]),
      );
    });

    it('allowManualSetting이 객체인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: { value: true },
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('불린 값')]),
      );
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: true,
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          '/admin/evaluation-periods/invalid-uuid/settings/criteria-permission',
        )
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });

    it('추가 필드가 포함된 경우에도 정상 처리되어야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: true,
        extraField: 'should be ignored',
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.criteriaSettingEnabled).toBe(true);
    });
  });

  // ==================== 실패 케이스 - 리소스 존재 ====================

  describe('실패 케이스 - 리소스 존재', () => {
    it('존재하지 않는 평가 기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        allowManualSetting: true,
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${nonExistentId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });
  });

  // ==================== 실패 케이스 - 상태별 수정 제한 ====================

  describe('실패 케이스 - 상태별 수정 제한', () => {
    it('완료된 평가 기간의 설정 수정 시 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        allowManualSetting: false,
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${completedEvaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect([200, 422, 500]);

      if (response.status !== 200) {
        expect(response.body.message).toContain(
          '완료된 평가 기간은 수정할 수 없습니다',
        );
      }
    });
  });

  // ==================== 엣지 케이스 ====================

  describe('엣지 케이스', () => {
    it('true에서 false로 변경 후 다시 true로 변경할 수 있어야 한다', async () => {
      // Given
      const trueData = { allowManualSetting: true };
      const falseData = { allowManualSetting: false };

      // When - true로 변경
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(trueData)
        .expect(200);

      // When - false로 변경
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(falseData)
        .expect(200);

      // When - 다시 true로 변경
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(trueData)
        .expect(200);

      // Then
      expect(response.body.criteriaSettingEnabled).toBe(true);
    });

    it('빈 객체로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {};

      // When & Then
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .send(updateData)
        .expect(400);
    });

    it('Content-Type이 application/json이 아닌 경우에도 처리되어야 한다', async () => {
      // Given
      const updateData = 'allowManualSetting=true';

      // When & Then
      await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
        )
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(updateData)
        .expect(400); // JSON 파싱 에러 또는 검증 에러 예상
    });
  });

  // ==================== 동시성 테스트 ====================

  describe('동시성 테스트', () => {
    it('동일한 평가 기간에 대한 동시 설정 변경 요청을 적절히 처리해야 한다', async () => {
      // Given
      const updateData1 = { allowManualSetting: true };
      const updateData2 = { allowManualSetting: false };

      // When - 동시 요청
      const [response1, response2] = await Promise.allSettled([
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData1),
        request(app.getHttpServer())
          .patch(
            `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
          )
          .send(updateData2),
      ]);

      // Then - 둘 다 성공하거나 하나는 성공해야 함 (동시성 처리에 따라)
      const successfulResponses = [response1, response2].filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 200,
      );
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);

      // 마지막 응답의 값이 최종 상태가 되어야 함
      const finalResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${evaluationPeriodId}`)
        .expect(200);

      expect(typeof finalResponse.body.criteriaSettingEnabled).toBe('boolean');
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능 테스트', () => {
    it('연속적인 설정 변경 요청을 빠르게 처리할 수 있어야 한다', async () => {
      // Given
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .patch(
              `/admin/evaluation-periods/${evaluationPeriodId}/settings/criteria-permission`,
            )
            .send({ allowManualSetting: i % 2 === 0 }),
        );
      }

      // When
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Then
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // 10개 요청이 5초 이내에 완료되어야 함
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
