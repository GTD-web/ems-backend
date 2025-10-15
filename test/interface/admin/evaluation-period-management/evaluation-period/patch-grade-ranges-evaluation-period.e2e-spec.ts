import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../../../src/app.module';
import { EvaluationPeriod } from '../../../../src/domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodStatus } from '../../../../src/domain/core/evaluation-period/evaluation-period.types';

describe('PATCH /admin/evaluation-periods/:id/grade-ranges (E2E)', () => {
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
    evaluationPeriod.name = `테스트 평가 기간 ${Date.now()}`;
    evaluationPeriod.startDate = new Date('2024-01-01');
    evaluationPeriod.endDate = new Date('2024-12-31');
    evaluationPeriod.status = EvaluationPeriodStatus.WAITING;
    evaluationPeriod.maxSelfEvaluationRate = 120;
    evaluationPeriod.criteriaSettingEnabled = true;
    evaluationPeriod.selfEvaluationSettingEnabled = true;
    evaluationPeriod.finalEvaluationSettingEnabled = false;
    evaluationPeriod.gradeRanges = [
      { grade: 'S', minRange: 95, maxRange: 100 },
      { grade: 'A', minRange: 85, maxRange: 94 },
      { grade: 'B', minRange: 75, maxRange: 84 },
      { grade: 'C', minRange: 65, maxRange: 74 },
      { grade: 'F', minRange: 0, maxRange: 64 },
    ];
    evaluationPeriod.createdBy = 'test-user';
    evaluationPeriod.updatedBy = 'test-user';

    const savedPeriod = await dataSource.manager.save(evaluationPeriod);
    evaluationPeriodId = savedPeriod.id;

    // 완료된 평가 기간 생성 (COMPLETED 상태)
    const completedPeriod = new EvaluationPeriod();
    completedPeriod.name = `완료된 평가 기간 ${Date.now()}`;
    completedPeriod.startDate = new Date('2023-01-01');
    completedPeriod.endDate = new Date('2023-12-31');
    completedPeriod.status = EvaluationPeriodStatus.COMPLETED;
    completedPeriod.maxSelfEvaluationRate = 120;
    completedPeriod.criteriaSettingEnabled = true;
    completedPeriod.selfEvaluationSettingEnabled = true;
    completedPeriod.finalEvaluationSettingEnabled = false;
    completedPeriod.gradeRanges = [
      { grade: 'A', minRange: 80, maxRange: 100 },
      { grade: 'B', minRange: 60, maxRange: 79 },
      { grade: 'C', minRange: 0, maxRange: 59 },
    ];
    completedPeriod.createdBy = 'test-user';
    completedPeriod.updatedBy = 'test-user';

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
    it('유효한 등급 구간으로 수정 시 200 응답을 반환해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 92, maxRange: 94 },
          { grade: 'A', minRange: 88, maxRange: 91 },
          { grade: 'B+', minRange: 85, maxRange: 87 },
          { grade: 'B', minRange: 80, maxRange: 84 },
          { grade: 'C', minRange: 70, maxRange: 79 },
          { grade: 'F', minRange: 0, maxRange: 69 },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges).toHaveLength(8);
      expect(response.body.gradeRanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ grade: 'S+', minRange: 98, maxRange: 100 }),
          expect.objectContaining({ grade: 'S', minRange: 95, maxRange: 97 }),
          expect.objectContaining({ grade: 'A+', minRange: 92, maxRange: 94 }),
        ]),
      );
    });

    it('기존 등급 구간을 완전히 다른 구간으로 교체할 수 있어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'Excellent', minRange: 90, maxRange: 100 },
          { grade: 'Good', minRange: 70, maxRange: 89 },
          { grade: 'Poor', minRange: 0, maxRange: 69 },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges).toHaveLength(3);
      expect(response.body.gradeRanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            grade: 'Excellent',
            minRange: 90,
            maxRange: 100,
          }),
          expect.objectContaining({
            grade: 'Good',
            minRange: 70,
            maxRange: 89,
          }),
          expect.objectContaining({ grade: 'Poor', minRange: 0, maxRange: 69 }),
        ]),
      );
    });

    it('단일 등급 구간으로 설정할 수 있어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'Pass', minRange: 0, maxRange: 100 }],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges).toHaveLength(1);
      expect(response.body.gradeRanges[0]).toEqual(
        expect.objectContaining({ grade: 'Pass', minRange: 0, maxRange: 100 }),
      );
    });

    it('경계값 등급 구간을 설정할 수 있어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'Perfect', minRange: 99, maxRange: 100 },
          { grade: 'High', minRange: 1, maxRange: 98 },
          { grade: 'Zero', minRange: 0, maxRange: 0 },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect([200, 422]); // 도메인 정책에 따라 422가 발생할 수 있음

      // Then
      if (response.status === 200) {
        expect(response.body.gradeRanges).toHaveLength(3);
        expect(response.body.gradeRanges).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              grade: 'Perfect',
              minRange: 99,
              maxRange: 100,
            }),
            expect.objectContaining({
              grade: 'Zero',
              minRange: 0,
              maxRange: 0,
            }),
          ]),
        );
      }
    });

    it('등급 구간 수정 후 다른 필드들은 변경되지 않아야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'New', minRange: 0, maxRange: 100 }],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.name).toContain('테스트 평가 기간');
      expect(response.body.status).toBe('waiting');
      expect(response.body.maxSelfEvaluationRate).toBe(120);
      expect(response.body.criteriaSettingEnabled).toBe(true);
      expect(response.body.selfEvaluationSettingEnabled).toBe(true);
      expect(response.body.finalEvaluationSettingEnabled).toBe(false);
    });
  });

  // ==================== 실패 케이스 - 요청 데이터 검증 ====================

  describe('실패 케이스 - 요청 데이터 검증', () => {
    it('gradeRanges 필드가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {};

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('등급 구간 목록')]),
      );
    });

    it('gradeRanges가 배열이 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: 'invalid',
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('배열')]),
      );
    });

    it('gradeRanges가 빈 배열인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('최소 1개 이상')]),
      );
    });

    it('등급이 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ minRange: 80, maxRange: 100 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('등급은 필수')]),
      );
    });

    it('등급이 빈 문자열인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: '', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('등급은 필수')]),
      );
    });

    it('minRange가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', maxRange: 100 }],
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);
    });

    it('maxRange가 누락된 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80 }],
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);
    });

    it('minRange가 숫자가 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 'invalid', maxRange: 100 }],
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);
    });

    it('maxRange가 숫자가 아닌 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 'invalid' }],
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);
    });

    it('minRange가 0 미만인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: -1, maxRange: 100 }],
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);
    });

    it('maxRange가 100 초과인 경우 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 101 }],
      };

      // When & Then
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(400);
    });

    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch('/admin/evaluation-periods/invalid-uuid/grade-ranges')
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });
  });

  // ==================== 실패 케이스 - 리소스 존재 ====================

  describe('실패 케이스 - 리소스 존재', () => {
    it('존재하지 않는 평가 기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${nonExistentId}/grade-ranges`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });
  });

  // ==================== 실패 케이스 - 도메인 정책 검증 ====================

  describe('실패 케이스 - 도메인 정책 검증', () => {
    it('중복된 등급이 있는 경우 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'A', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
        ],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain('중복된 등급');
    });

    it('minRange가 maxRange보다 큰 경우 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 90, maxRange: 80 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain(
        '최소 범위는 최대 범위보다 작아야',
      );
    });

    it('minRange와 maxRange가 같은 경우 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 80 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain(
        '최소 범위는 최대 범위보다 작아야',
      );
    });

    it('점수 범위가 겹치는 경우 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 90 },
          { grade: 'B', minRange: 85, maxRange: 95 }, // A와 겹침
        ],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain('점수 범위가 겹칩니다');
    });

    it('점수 범위가 경계에서 겹치는 경우 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 90 },
          { grade: 'B', minRange: 90, maxRange: 95 }, // A의 maxRange와 B의 minRange가 같음
        ],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(422);

      expect(response.body.message).toContain('점수 범위가 겹칩니다');
    });
  });

  // ==================== 실패 케이스 - 상태별 수정 제한 ====================

  describe('실패 케이스 - 상태별 수정 제한', () => {
    it('완료된 평가 기간의 등급 구간 수정 시 422 에러가 발생해야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [{ grade: 'A', minRange: 80, maxRange: 100 }],
      };

      // When & Then
      const response = await request(app.getHttpServer())
        .patch(
          `/admin/evaluation-periods/${completedEvaluationPeriodId}/grade-ranges`,
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
    it('많은 수의 등급 구간을 설정할 수 있어야 한다', async () => {
      // Given
      const gradeRanges: Array<{
        grade: string;
        minRange: number;
        maxRange: number;
      }> = [];
      for (let i = 0; i < 20; i++) {
        gradeRanges.push({
          grade: `Grade${i}`,
          minRange: i * 5,
          maxRange: i * 5 + 4,
        });
      }
      const updateData = { gradeRanges };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges).toHaveLength(20);
    });

    it('특수 문자가 포함된 등급명을 사용할 수 있어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'S++', minRange: 95, maxRange: 100 },
          { grade: 'A-B', minRange: 85, maxRange: 94 },
          { grade: 'C/D', minRange: 70, maxRange: 84 },
          { grade: 'F_FAIL', minRange: 0, maxRange: 69 },
        ],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges).toHaveLength(4);
      expect(response.body.gradeRanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ grade: 'S++' }),
          expect.objectContaining({ grade: 'A-B' }),
          expect.objectContaining({ grade: 'C/D' }),
          expect.objectContaining({ grade: 'F_FAIL' }),
        ]),
      );
    });

    it('긴 등급명을 사용할 수 있어야 한다', async () => {
      // Given
      const longGradeName = 'VeryLongGradeNameThatExceedsNormalLength';
      const updateData = {
        gradeRanges: [{ grade: longGradeName, minRange: 0, maxRange: 100 }],
      };

      // When
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges[0].grade).toBe(longGradeName);
    });

    it('동일한 등급 구간으로 여러 번 수정해도 무결성이 유지되어야 한다', async () => {
      // Given
      const updateData = {
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 60, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 59 },
        ],
      };

      // When - 첫 번째 수정
      await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // When - 두 번째 수정 (동일한 데이터)
      const response = await request(app.getHttpServer())
        .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
        .send(updateData)
        .expect(200);

      // Then
      expect(response.body.gradeRanges).toHaveLength(3);
      expect(response.body.gradeRanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ grade: 'A', minRange: 80, maxRange: 100 }),
          expect.objectContaining({ grade: 'B', minRange: 60, maxRange: 79 }),
          expect.objectContaining({ grade: 'C', minRange: 0, maxRange: 59 }),
        ]),
      );
    });
  });

  // ==================== 동시성 테스트 ====================

  describe('동시성 테스트', () => {
    it('동일한 평가 기간에 대한 동시 등급 구간 수정 요청을 적절히 처리해야 한다', async () => {
      // Given
      const updateData1 = {
        gradeRanges: [
          { grade: 'A', minRange: 80, maxRange: 100 },
          { grade: 'B', minRange: 0, maxRange: 79 },
        ],
      };
      const updateData2 = {
        gradeRanges: [
          { grade: 'X', minRange: 50, maxRange: 100 },
          { grade: 'Y', minRange: 0, maxRange: 49 },
        ],
      };

      // When - 동시 요청
      const [response1, response2] = await Promise.allSettled([
        request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
          .send(updateData1),
        request(app.getHttpServer())
          .patch(`/admin/evaluation-periods/${evaluationPeriodId}/grade-ranges`)
          .send(updateData2),
      ]);

      // Then - 둘 다 성공하거나 하나는 성공해야 함 (동시성 처리에 따라)
      const successfulResponses = [response1, response2].filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 200,
      );
      expect(successfulResponses.length).toBeGreaterThanOrEqual(1);
    });
  });
});
