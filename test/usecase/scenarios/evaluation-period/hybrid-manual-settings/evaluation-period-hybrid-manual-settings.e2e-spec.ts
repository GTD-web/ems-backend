import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodHybridManualSettingsScenario } from './evaluation-period-hybrid-manual-settings.scenario';

describe('평가기간 하이브리드 수동 설정 관리', () => {
  let app: INestApplication;
  let baseE2E: BaseE2ETest;
  let scenario: EvaluationPeriodHybridManualSettingsScenario;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [BaseE2ETest, EvaluationPeriodHybridManualSettingsScenario],
    }).compile();

    app = moduleFixture.createNestApplication();
    baseE2E = moduleFixture.get<BaseE2ETest>(BaseE2ETest);
    scenario = moduleFixture.get<EvaluationPeriodHybridManualSettingsScenario>(
      EvaluationPeriodHybridManualSettingsScenario,
    );

    await baseE2E.initializeApp();

    // 기존 평가기간 정리
    await baseE2E
      .request()
      .delete('/admin/evaluation-periods/cleanup-test-data')
      .catch(() => {
        // 정리 API가 없으면 무시
      });
  });

  afterAll(async () => {
    await baseE2E.closeApp();
  });

  describe('하이브리드 수동 설정 기본 시나리오', () => {
    it('수동 설정이 없는 경우 자동 단계 전이 시 기본값이 적용된다', async () => {
      // Given: 평가기간 생성 및 시작
      const { id: periodId } = await scenario.평가기간을_생성한다();
      await scenario.평가기간을_시작한다(periodId);

      // When: evaluation-setup 단계에서 performance 단계로 자동 전이
      let periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('🔍 evaluation-setup 단계 상태:', {
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      await scenario.평가기간_단계를_변경한다(periodId, 'performance');

      // Then: performance 단계에서 모든 설정이 false로 설정됨 (기본값)
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('🔍 performance 단계 상태:', {
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.currentPhase).toBe('performance');
      expect(periodDetail.criteriaSettingEnabled).toBe(false);
      expect(periodDetail.selfEvaluationSettingEnabled).toBe(false);
      expect(periodDetail.finalEvaluationSettingEnabled).toBe(false);
      expect(periodDetail.manuallySetFields).toEqual([]);
    });

    it('수동 설정이 있는 경우 자동 단계 전이 시 수동 설정이 보존된다', async () => {
      // Given: 평가기간 생성 및 시작
      const { id: periodId } = await scenario.평가기간을_생성한다();
      await scenario.평가기간을_시작한다(periodId);

      // When: evaluation-setup 단계에서 수동으로 criteriaSettingEnabled를 false로 설정
      await scenario.평가기간_설정을_변경한다(periodId, 'criteria', false);

      let periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('🔍 수동 설정 후 evaluation-setup 단계 상태:', {
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      // performance 단계로 전이
      await scenario.평가기간_단계를_변경한다(periodId, 'performance');

      // Then: performance 단계에서 수동 설정된 criteriaSettingEnabled는 false로 보존됨
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('🔍 performance 단계 전이 후 상태:', {
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.currentPhase).toBe('performance');
      expect(periodDetail.criteriaSettingEnabled).toBe(false); // 수동 설정 보존
      expect(periodDetail.selfEvaluationSettingEnabled).toBe(false); // 기본값 적용
      expect(periodDetail.finalEvaluationSettingEnabled).toBe(false); // 기본값 적용
      expect(periodDetail.manuallySetFields).toContain(
        'criteriaSettingEnabled',
      );
    });

    it('여러 수동 설정이 있는 경우 모든 수동 설정이 보존된다', async () => {
      // Given: 평가기간 생성 및 시작
      const { id: periodId } = await scenario.평가기간을_생성한다();
      await scenario.평가기간을_시작한다(periodId);

      // When: evaluation-setup 단계에서 여러 설정을 수동으로 변경
      await scenario.평가기간_설정을_변경한다(periodId, 'criteria', false);
      await scenario.평가기간_설정을_변경한다(
        periodId,
        'self-evaluation',
        true,
      );

      let periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('🔍 여러 수동 설정 후 evaluation-setup 단계 상태:', {
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      // performance 단계를 거쳐 self-evaluation 단계로 전이 (단계 전이 규칙: evaluation-setup → performance → self-evaluation)
      await scenario.평가기간_단계를_변경한다(periodId, 'performance');
      await scenario.평가기간_단계를_변경한다(periodId, 'self-evaluation');

      // Then: self-evaluation 단계에서 수동 설정들이 보존됨
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('🔍 self-evaluation 단계 전이 후 상태:', {
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.currentPhase).toBe('self-evaluation');
      expect(periodDetail.criteriaSettingEnabled).toBe(false); // 수동 설정 보존
      expect(periodDetail.selfEvaluationSettingEnabled).toBe(true); // 수동 설정 보존
      expect(periodDetail.finalEvaluationSettingEnabled).toBe(false); // 기본값 적용
      expect(periodDetail.manuallySetFields).toContain(
        'criteriaSettingEnabled',
      );
      expect(periodDetail.manuallySetFields).toContain(
        'selfEvaluationSettingEnabled',
      );
    });
  });

  describe('하이브리드 수동 설정 복합 시나리오', () => {
    it('단계별로 다른 수동 설정을 적용하고 자동 전이 시 보존되는지 확인한다', async () => {
      // Given: 평가기간 생성 및 시작
      const { id: periodId } = await scenario.평가기간을_생성한다();
      await scenario.평가기간을_시작한다(periodId);

      // Step 1: evaluation-setup 단계에서 criteria 설정을 수동으로 변경
      await scenario.평가기간_설정을_변경한다(periodId, 'criteria', false);
      let periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('📋 Step 1 - evaluation-setup 단계 (criteria 수동 설정):', {
        phase: periodDetail.currentPhase,
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      // Step 2: performance 단계로 전이 (수동 설정 보존 확인)
      await scenario.평가기간_단계를_변경한다(periodId, 'performance');
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('📋 Step 2 - performance 단계 전이 후:', {
        phase: periodDetail.currentPhase,
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.criteriaSettingEnabled).toBe(false); // 수동 설정 보존

      // Step 3: self-evaluation 단계로 전이 (기본값 적용 확인)
      await scenario.평가기간_단계를_변경한다(periodId, 'self-evaluation');
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('📋 Step 3 - self-evaluation 단계 전이 후:', {
        phase: periodDetail.currentPhase,
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.criteriaSettingEnabled).toBe(false); // 수동 설정 보존
      expect(periodDetail.selfEvaluationSettingEnabled).toBe(false); // 기본값 적용 (false)

      // Step 4: peer-evaluation 단계로 전이 (기본값 적용 확인)
      await scenario.평가기간_단계를_변경한다(periodId, 'peer-evaluation');
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('📋 Step 4 - peer-evaluation 단계 전이 후:', {
        phase: periodDetail.currentPhase,
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.criteriaSettingEnabled).toBe(false); // 수동 설정 보존
      expect(periodDetail.selfEvaluationSettingEnabled).toBe(false); // 기본값 적용 (false)
      expect(periodDetail.finalEvaluationSettingEnabled).toBe(false); // 기본값 적용 (false)

      // Step 5: closure 단계로 전이 (기본값 적용 확인)
      await scenario.평가기간_단계를_변경한다(periodId, 'closure');
      periodDetail = await scenario.평가기간_상세를_조회한다(periodId);
      console.log('📋 Step 5 - closure 단계 전이 후:', {
        phase: periodDetail.currentPhase,
        criteriaSettingEnabled: periodDetail.criteriaSettingEnabled,
        selfEvaluationSettingEnabled: periodDetail.selfEvaluationSettingEnabled,
        finalEvaluationSettingEnabled:
          periodDetail.finalEvaluationSettingEnabled,
        manuallySetFields: periodDetail.manuallySetFields,
      });

      expect(periodDetail.criteriaSettingEnabled).toBe(false); // 수동 설정 보존
      expect(periodDetail.selfEvaluationSettingEnabled).toBe(false); // 기본값 적용
      expect(periodDetail.finalEvaluationSettingEnabled).toBe(false); // 기본값 적용
    });
  });

  describe('하이브리드 수동 설정 에러 케이스', () => {
    let periodIdForCleanup: string | null = null;

    afterEach(async () => {
      // 각 테스트 후 생성된 평가기간 정리
      if (periodIdForCleanup) {
        try {
          await baseE2E
            .request()
            .delete(`/admin/evaluation-periods/${periodIdForCleanup}`)
            .catch(() => {
              // 정리 API가 없거나 이미 삭제된 경우 무시
            });
        } catch (error) {
          // 정리 실패 시 무시
        }
        periodIdForCleanup = null;
      }
    });

    it('완료된 평가기간에서 수동 설정 변경 시 에러가 발생한다', async () => {
      // Given: 평가기간 생성, 시작, 완료
      const { id: periodId } = await scenario.평가기간을_생성한다();
      periodIdForCleanup = periodId;
      await scenario.평가기간을_시작한다(periodId);
      await scenario.평가기간을_완료한다(periodId);

      // When & Then: 완료된 평가기간에서 설정 변경 시도
      await baseE2E
        .request()
        .patch(
          `/admin/evaluation-periods/${periodId}/settings/criteria-permission`,
        )
        .send({ enabled: true })
        .expect(400);
    });
  });
});
