import { Injectable } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 평가기간 하이브리드 수동 설정 시나리오
 */
@Injectable()
export class EvaluationPeriodHybridManualSettingsScenario {
  constructor(private readonly baseE2E: BaseE2ETest) {}

  /**
   * 평가기간을 생성한다
   */
  async 평가기간을_생성한다(): Promise<{ id: string }> {
    const timestamp = Date.now();
    const year = 2030;
    const month = (timestamp % 12) + 1; // 1-12월 중 랜덤 선택
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-28T23:59:59.999Z`;
    
    const response = await this.baseE2E.request()
      .post('/admin/evaluation-periods')
      .send({
        name: `${year}년 ${month}월 하이브리드 테스트 평가기간_${timestamp}`,
        startDate: startDate,
        endDate: endDate,
        evaluationSetupDeadline: `${year}-${month.toString().padStart(2, '0')}-05T23:59:59.999Z`,
        performanceDeadline: `${year}-${month.toString().padStart(2, '0')}-15T23:59:59.999Z`,
        selfEvaluationDeadline: `${year}-${month.toString().padStart(2, '0')}-20T23:59:59.999Z`,
        peerEvaluationDeadline: `${year}-${month.toString().padStart(2, '0')}-25T23:59:59.999Z`,
      });

    if (response.status !== 201) {
      console.error('평가기간 생성 실패:', response.status, response.body);
      throw new Error(`평가기간 생성 실패: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return { id: response.body.id };
  }

  /**
   * 평가기간을 시작한다
   */
  async 평가기간을_시작한다(periodId: string): Promise<void> {
    await this.baseE2E.request()
      .post(`/admin/evaluation-periods/${periodId}/start`)
      .expect(200);
  }

  /**
   * 평가기간을 완료한다
   */
  async 평가기간을_완료한다(periodId: string): Promise<void> {
    await this.baseE2E.request()
      .post(`/admin/evaluation-periods/${periodId}/complete`)
      .expect(200);
  }

  /**
   * 평가기간 상세 정보를 조회한다
   */
  async 평가기간_상세를_조회한다(periodId: string): Promise<{
    id: string;
    name: string;
    status: string;
    currentPhase: string;
    criteriaSettingEnabled: boolean;
    selfEvaluationSettingEnabled: boolean;
    finalEvaluationSettingEnabled: boolean;
    manuallySetFields: string[];
  }> {
    const response = await this.baseE2E.request()
      .get(`/admin/evaluation-periods/${periodId}`)
      .expect(200);

    return {
      id: response.body.id,
      name: response.body.name,
      status: response.body.status,
      currentPhase: response.body.currentPhase,
      criteriaSettingEnabled: response.body.criteriaSettingEnabled,
      selfEvaluationSettingEnabled: response.body.selfEvaluationSettingEnabled,
      finalEvaluationSettingEnabled: response.body.finalEvaluationSettingEnabled,
      manuallySetFields: response.body.manuallySetFields || [],
    };
  }

  /**
   * 평가기간 설정을 변경한다
   */
  async 평가기간_설정을_변경한다(
    periodId: string,
    settingType: 'criteria' | 'self-evaluation' | 'final-evaluation',
    enabled: boolean,
  ): Promise<void> {
    const endpoint = `/admin/evaluation-periods/${periodId}/settings/${settingType}-permission`;
    
    const response = await this.baseE2E.request()
      .patch(endpoint)
      .send({ allowManualSetting: enabled });

    if (response.status !== 200) {
      console.error('설정 변경 실패:', response.status, response.body);
      throw new Error(`설정 변경 실패: ${response.status} - ${JSON.stringify(response.body)}`);
    }
  }

  /**
   * 평가기간 단계를 변경한다
   */
  async 평가기간_단계를_변경한다(
    periodId: string,
    phase: 'evaluation-setup' | 'performance' | 'self-evaluation' | 'peer-evaluation' | 'closure',
  ): Promise<void> {
    const endpoint = `/admin/evaluation-periods/${periodId}/phase-change`;
    
    await this.baseE2E.request()
      .post(endpoint)
      .send({ targetPhase: phase })
      .expect(200);
  }

  /**
   * 대시보드 상태를 조회한다
   */
  async 대시보드_상태를_조회한다(periodId: string): Promise<{
    evaluationPeriod: {
      status: string;
      currentPhase: string;
      manualSettings: {
        criteriaSettingEnabled: boolean;
        selfEvaluationSettingEnabled: boolean;
        finalEvaluationSettingEnabled: boolean;
      };
    };
  }> {
    const response = await this.baseE2E.request()
      .get(`/admin/dashboard/${periodId}/employees/status`)
      .expect(200);

    return {
      evaluationPeriod: {
        status: response.body.evaluationPeriod.status,
        currentPhase: response.body.evaluationPeriod.currentPhase,
        manualSettings: response.body.evaluationPeriod.manualSettings,
      },
    };
  }

  /**
   * 수동 설정이 보존되는지 확인한다
   */
  수동설정_보존을_확인한다(
    beforeSettings: { criteriaSettingEnabled: boolean; selfEvaluationSettingEnabled: boolean; finalEvaluationSettingEnabled: boolean },
    afterSettings: { criteriaSettingEnabled: boolean; selfEvaluationSettingEnabled: boolean; finalEvaluationSettingEnabled: boolean },
    manuallySetFields: string[],
  ): void {
    if (manuallySetFields.includes('criteriaSettingEnabled')) {
      expect(afterSettings.criteriaSettingEnabled).toBe(beforeSettings.criteriaSettingEnabled);
    }
    if (manuallySetFields.includes('selfEvaluationSettingEnabled')) {
      expect(afterSettings.selfEvaluationSettingEnabled).toBe(beforeSettings.selfEvaluationSettingEnabled);
    }
    if (manuallySetFields.includes('finalEvaluationSettingEnabled')) {
      expect(afterSettings.finalEvaluationSettingEnabled).toBe(beforeSettings.finalEvaluationSettingEnabled);
    }
  }

  /**
   * 기본값이 적용되는지 확인한다
   */
  기본값_적용을_확인한다(
    settings: { criteriaSettingEnabled: boolean; selfEvaluationSettingEnabled: boolean; finalEvaluationSettingEnabled: boolean },
    expectedSettings: { criteriaSettingEnabled: boolean; selfEvaluationSettingEnabled: boolean; finalEvaluationSettingEnabled: boolean },
  ): void {
    expect(settings.criteriaSettingEnabled).toBe(expectedSettings.criteriaSettingEnabled);
    expect(settings.selfEvaluationSettingEnabled).toBe(expectedSettings.selfEvaluationSettingEnabled);
    expect(settings.finalEvaluationSettingEnabled).toBe(expectedSettings.finalEvaluationSettingEnabled);
  }
}
