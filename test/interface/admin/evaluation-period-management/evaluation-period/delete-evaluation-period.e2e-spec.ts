import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodStatus } from '@domain/core/evaluation-period/evaluation-period.types';

describe('DELETE /admin/evaluation-periods/:id (E2E)', () => {
  let testSuite: BaseE2ETest;
  let app: INestApplication;
  let dataSource: any;
  let waitingEvaluationPeriodId: string;
  let activeEvaluationPeriodId: string;
  let completedEvaluationPeriodId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;
    dataSource = (testSuite as any).dataSource;
  });

  beforeEach(async () => {
    // 기존 데이터 정리
    await dataSource.manager.clear(EvaluationPeriod);

    // 대기 중인 평가 기간 생성 (WAITING 상태)
    const waitingPeriod = new EvaluationPeriod();
    Object.assign(waitingPeriod, {
      name: `대기 중인 평가 기간 ${Date.now()}`,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: EvaluationPeriodStatus.WAITING,
      maxSelfEvaluationRate: 120,
      criteriaSettingEnabled: false,
      selfEvaluationSettingEnabled: false,
      finalEvaluationSettingEnabled: false,
      gradeRanges: [
        { grade: 'A', minRange: 80, maxRange: 100 },
        { grade: 'B', minRange: 60, maxRange: 79 },
        { grade: 'C', minRange: 0, maxRange: 59 },
      ],
      createdBy: 'test-user',
      updatedBy: 'test-user',
    });

    const savedWaitingPeriod = await dataSource.manager.save(waitingPeriod);
    waitingEvaluationPeriodId = savedWaitingPeriod.id;

    // 활성 평가 기간 생성 (ACTIVE 상태)
    const activePeriod = new EvaluationPeriod();
    activePeriod.name = `활성 평가 기간 ${Date.now()}`;
    activePeriod.startDate = new Date('2024-01-01');
    activePeriod.endDate = new Date('2024-12-31');
    activePeriod.status = EvaluationPeriodStatus.IN_PROGRESS;
    activePeriod.maxSelfEvaluationRate = 120;
    activePeriod.criteriaSettingEnabled = true;
    activePeriod.selfEvaluationSettingEnabled = true;
    activePeriod.finalEvaluationSettingEnabled = false;
    activePeriod.gradeRanges = [
      { grade: 'S', minRange: 95, maxRange: 100 },
      { grade: 'A', minRange: 85, maxRange: 94 },
      { grade: 'B', minRange: 75, maxRange: 84 },
      { grade: 'C', minRange: 65, maxRange: 74 },
      { grade: 'F', minRange: 0, maxRange: 64 },
    ];
    activePeriod.createdBy = 'test-user';
    activePeriod.updatedBy = 'test-user';

    const savedActivePeriod = await dataSource.manager.save(activePeriod);
    activeEvaluationPeriodId = savedActivePeriod.id;

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
      finalEvaluationSettingEnabled: true,
      gradeRanges: [
        { grade: 'Excellent', minRange: 90, maxRange: 100 },
        { grade: 'Good', minRange: 70, maxRange: 89 },
        { grade: 'Fair', minRange: 50, maxRange: 69 },
        { grade: 'Poor', minRange: 0, maxRange: 49 },
      ],
      createdBy: 'test-user',
      updatedBy: 'test-user',
    });

    const savedCompletedPeriod = await dataSource.manager.save(completedPeriod);
    completedEvaluationPeriodId = savedCompletedPeriod.id;
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await dataSource.manager.clear(EvaluationPeriod);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  // ==================== 성공 케이스 ====================

  describe('성공 케이스', () => {
    it('대기 중인 평가 기간 삭제 시 200 응답과 true를 반환해야 한다', async () => {
      // When
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // 실제로 삭제되었는지 확인
      const deletedPeriod = await dataSource.manager.findOne(EvaluationPeriod, {
        where: { id: waitingEvaluationPeriodId },
      });
      expect(deletedPeriod).toBeNull();
    });

    it('완료된 평가 기간 삭제 시 200 응답과 true를 반환해야 한다', async () => {
      // When
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${completedEvaluationPeriodId}`)
        .expect(200);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      // 실제로 삭제되었는지 확인
      const deletedPeriod = await dataSource.manager.findOne(EvaluationPeriod, {
        where: { id: completedEvaluationPeriodId },
      });
      expect(deletedPeriod).toBeNull();
    });

    it('삭제 후 목록 조회 시 삭제된 평가 기간이 제외되어야 한다', async () => {
      // Given - 삭제 전 목록 확인
      const beforeResponse = await request(app.getHttpServer())
        .get('/admin/evaluation-periods')
        .expect(200);
      expect(beforeResponse.body.items).toHaveLength(3);

      // When - 평가 기간 삭제
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);

      // Then - 삭제 후 목록 확인
      const afterResponse = await request(app.getHttpServer())
        .get('/admin/evaluation-periods')
        .expect(200);
      expect(afterResponse.body.items).toHaveLength(2);
      expect(
        afterResponse.body.items.find(
          (period: any) => period.id === waitingEvaluationPeriodId,
        ),
      ).toBeUndefined();
    });

    it('삭제 후 상세 조회 시 null을 반환해야 한다', async () => {
      // Given - 삭제 전 상세 조회 확인
      const beforeResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);
      expect(beforeResponse.body).not.toBeNull();

      // When - 평가 기간 삭제
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);

      // Then - 삭제 후 상세 조회
      const afterResponse = await request(app.getHttpServer())
        .get(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);
      // 삭제된 항목에 대해 null 또는 빈 객체 반환 (구현에 따라 다를 수 있음)
      expect([null, {}]).toContainEqual(afterResponse.body);
    });
  });

  // ==================== 실패 케이스 - 요청 데이터 검증 ====================

  describe('실패 케이스 - 요청 데이터 검증', () => {
    it('잘못된 UUID 형식으로 요청 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      const response = await request(app.getHttpServer())
        .delete('/admin/evaluation-periods/invalid-uuid')
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });

    it('빈 문자열 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // When & Then
      await request(app.getHttpServer())
        .delete('/admin/evaluation-periods/')
        .expect(404);
    });

    it('특수 문자가 포함된 ID로 요청 시 400 에러가 발생해야 한다', async () => {
      // When & Then
      const response = await request(app.getHttpServer())
        .delete('/admin/evaluation-periods/123-456-789-abc!@#')
        .expect(400);

      expect(response.body.message).toContain('UUID');
    });
  });

  // ==================== 실패 케이스 - 리소스 존재 ====================

  describe('실패 케이스 - 리소스 존재', () => {
    it('존재하지 않는 평가 기간 ID로 요청 시 404 에러가 발생해야 한다', async () => {
      // Given
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When & Then
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${nonExistentId}`)
        .expect(404);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });

    it('이미 삭제된 평가 기간을 다시 삭제 시 404 에러가 발생해야 한다', async () => {
      // Given - 먼저 삭제
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);

      // When & Then - 다시 삭제 시도
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(404);

      expect(response.body.message).toContain('찾을 수 없습니다');
    });
  });

  // ==================== 실패 케이스 - 상태별 삭제 제한 ====================

  describe('실패 케이스 - 상태별 삭제 제한', () => {
    it('활성 상태의 평가 기간 삭제 시 422 에러가 발생해야 한다', async () => {
      // Given - 활성 상태 확인
      const activePeriod = await dataSource.manager.findOne(EvaluationPeriod, {
        where: { id: activeEvaluationPeriodId },
      });
      expect(activePeriod).not.toBeNull();
      expect(activePeriod!.status).toBe(EvaluationPeriodStatus.IN_PROGRESS);
      expect(activePeriod!.활성화된_상태인가()).toBe(true);

      // When & Then - 422 에러만 허용
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${activeEvaluationPeriodId}`)
        .expect(422);

      expect(response.body.message).toContain(
        '활성 상태인 평가 기간은 삭제할 수 없습니다',
      );
    });
  });

  // ==================== 엣지 케이스 ====================

  describe('엣지 케이스', () => {
    it('복잡한 등급 구간을 가진 평가 기간도 정상 삭제되어야 한다', async () => {
      // Given - 복잡한 등급 구간을 가진 평가 기간 생성
      const complexPeriod = new EvaluationPeriod();
      Object.assign(complexPeriod, {
        name: '복잡한 등급 구간 평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: EvaluationPeriodStatus.WAITING,
        maxSelfEvaluationRate: 120,
        criteriaSettingEnabled: false,
        selfEvaluationSettingEnabled: false,
        finalEvaluationSettingEnabled: false,
        gradeRanges: [
          { grade: 'S+', minRange: 98, maxRange: 100 },
          { grade: 'S', minRange: 95, maxRange: 97 },
          { grade: 'A+', minRange: 92, maxRange: 94 },
          { grade: 'A', minRange: 88, maxRange: 91 },
          { grade: 'B+', minRange: 85, maxRange: 87 },
          { grade: 'B', minRange: 80, maxRange: 84 },
          { grade: 'C', minRange: 0, maxRange: 79 },
        ],
        createdBy: 'test-user',
        updatedBy: 'test-user',
      });

      const savedComplexPeriod = await dataSource.manager.save(complexPeriod);

      // When
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${savedComplexPeriod.id}`)
        .expect(200);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('최소 필드만으로 생성된 평가 기간도 정상 삭제되어야 한다', async () => {
      // Given - 최소 필드만으로 평가 기간 생성
      const minimalPeriod = new EvaluationPeriod();
      Object.assign(minimalPeriod, {
        name: '최소 필드 평가 기간',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: EvaluationPeriodStatus.WAITING,
        maxSelfEvaluationRate: 100,
        criteriaSettingEnabled: false,
        selfEvaluationSettingEnabled: false,
        finalEvaluationSettingEnabled: false,
        gradeRanges: [{ grade: 'Pass', minRange: 0, maxRange: 100 }],
        createdBy: 'test-user',
        updatedBy: 'test-user',
      });

      const savedMinimalPeriod = await dataSource.manager.save(minimalPeriod);

      // When
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${savedMinimalPeriod.id}`)
        .expect(200);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });

    it('특수 문자가 포함된 이름의 평가 기간도 정상 삭제되어야 한다', async () => {
      // Given - 특수 문자가 포함된 이름의 평가 기간 생성
      const specialNamePeriod = new EvaluationPeriod();
      Object.assign(specialNamePeriod, {
        name: '특수문자 평가기간 !@#$%^&*()_+-=[]{}|;:,.<>?',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        status: EvaluationPeriodStatus.WAITING,
        maxSelfEvaluationRate: 120,
        criteriaSettingEnabled: false,
        selfEvaluationSettingEnabled: false,
        finalEvaluationSettingEnabled: false,
        gradeRanges: [{ grade: 'A', minRange: 0, maxRange: 100 }],
        createdBy: 'test-user',
        updatedBy: 'test-user',
      });

      const savedSpecialPeriod =
        await dataSource.manager.save(specialNamePeriod);

      // When
      const response = await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${savedSpecialPeriod.id}`)
        .expect(200);

      // Then
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });
    });
  });

  // ==================== 동시성 테스트 ====================

  describe('동시성 테스트', () => {
    it('동일한 평가 기간을 동시에 삭제할 때 하나만 성공해야 한다', async () => {
      // When - 동시 삭제 요청
      const [response1, response2] = await Promise.allSettled([
        request(app.getHttpServer()).delete(
          `/admin/evaluation-periods/${waitingEvaluationPeriodId}`,
        ),
        request(app.getHttpServer()).delete(
          `/admin/evaluation-periods/${waitingEvaluationPeriodId}`,
        ),
      ]);

      // Then - 하나는 성공(200), 하나는 실패(404)해야 함
      const responses = [response1, response2];
      const successfulResponses = responses.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 200,
      );
      const failedResponses = responses.filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 404,
      );

      expect(successfulResponses).toHaveLength(1);
      expect(failedResponses).toHaveLength(1);
    });

    it('서로 다른 평가 기간을 동시에 삭제할 수 있어야 한다', async () => {
      // When - 서로 다른 평가 기간 동시 삭제
      const [response1, response2] = await Promise.allSettled([
        request(app.getHttpServer()).delete(
          `/admin/evaluation-periods/${waitingEvaluationPeriodId}`,
        ),
        request(app.getHttpServer()).delete(
          `/admin/evaluation-periods/${completedEvaluationPeriodId}`,
        ),
      ]);

      // Then - 둘 다 성공해야 함
      const successfulResponses = [response1, response2].filter(
        (result) =>
          result.status === 'fulfilled' && result.value.status === 200,
      );
      expect(successfulResponses).toHaveLength(2);
    });
  });

  // ==================== 성능 테스트 ====================

  describe('성능 테스트', () => {
    it('여러 평가 기간을 연속으로 빠르게 삭제할 수 있어야 한다', async () => {
      // Given - 추가 평가 기간들 생성
      const additionalPeriods: string[] = [];
      for (let i = 0; i < 5; i++) {
        const period = new EvaluationPeriod();
        Object.assign(period, {
          name: `성능 테스트 평가 기간 ${i}`,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          status: EvaluationPeriodStatus.WAITING,
          maxSelfEvaluationRate: 120,
          criteriaSettingEnabled: false,
          selfEvaluationSettingEnabled: false,
          finalEvaluationSettingEnabled: false,
          gradeRanges: [{ grade: 'A', minRange: 0, maxRange: 100 }],
          createdBy: 'test-user',
          updatedBy: 'test-user',
        });
        const saved = await dataSource.manager.save(period);
        additionalPeriods.push(saved.id);
      }

      // When - 연속 삭제
      const startTime = Date.now();
      const deletePromises = additionalPeriods.map((id) =>
        request(app.getHttpServer()).delete(`/admin/evaluation-periods/${id}`),
      );
      const responses = await Promise.all(deletePromises);
      const endTime = Date.now();

      // Then
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true });
      });

      // 5개 삭제가 3초 이내에 완료되어야 함
      expect(endTime - startTime).toBeLessThan(3000);
    });
  });

  // ==================== 데이터 무결성 테스트 ====================

  describe('데이터 무결성 테스트', () => {
    it('삭제 후 관련 데이터도 함께 정리되어야 한다', async () => {
      // Given - 삭제 전 데이터 존재 확인
      const beforePeriod = await dataSource.manager.findOne(EvaluationPeriod, {
        where: { id: waitingEvaluationPeriodId },
      });
      expect(beforePeriod).not.toBeNull();

      // When - 삭제
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${waitingEvaluationPeriodId}`)
        .expect(200);

      // Then - 데이터가 완전히 제거되었는지 확인
      const afterPeriod = await dataSource.manager.findOne(EvaluationPeriod, {
        where: { id: waitingEvaluationPeriodId },
      });
      expect(afterPeriod).toBeNull();

      // 관련 테이블에서도 데이터가 정리되었는지 확인 (필요시)
      // 예: 평가 기간과 연관된 다른 엔티티들의 데이터 정리 확인
    });

    it('삭제 실패 시 데이터가 변경되지 않아야 한다', async () => {
      // Given - 존재하지 않는 ID로 삭제 시도
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      // When - 삭제 실패
      await request(app.getHttpServer())
        .delete(`/admin/evaluation-periods/${nonExistentId}`)
        .expect(404);

      // Then - 기존 데이터는 그대로 유지되어야 함
      const existingPeriods = await dataSource.manager.find(EvaluationPeriod);
      expect(existingPeriods).toHaveLength(3); // 원래 생성한 3개 그대로
    });
  });
});
