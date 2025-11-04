import { Injectable } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';

/**
 * 평가기간 하이브리드 수동 설정 시나리오
 */
@Injectable()
export class EvaluationPeriodHybridManualSettingsScenario {
  private static callCount = 0; // 호출 횟수 추적 (고유한 날짜 생성을 위해)

  constructor(private readonly baseE2E: BaseE2ETest) {}

  /**
   * 평가기간을 생성한다
   */
  async 평가기간을_생성한다(): Promise<{ id: string }> {
    // 호출 횟수 증가 (각 테스트마다 고유한 날짜를 보장하기 위해)
    EvaluationPeriodHybridManualSettingsScenario.callCount++;
    
    const timestamp = Date.now();
    // 고유한 날짜를 위해 timestamp와 호출 횟수를 조합하여 시작일 생성 (겹침 방지)
    // 2020년 1월 1일을 기준으로 timestamp를 일수로 변환
    const baseDate = new Date('2020-01-01T00:00:00.000Z');
    // timestamp를 일수로 변환
    const daysFromBase = Math.floor(timestamp / (1000 * 60 * 60 * 24));
    // 호출 횟수에 100일을 곱하여 각 테스트마다 충분한 날짜 간격 보장
    // 예: 1번째 호출 = 0일, 2번째 호출 = 100일, 3번째 호출 = 200일...
    const callOffset = (EvaluationPeriodHybridManualSettingsScenario.callCount - 1) * 100;
    // 랜덤 값을 추가하여 더 고유한 날짜 생성 (0~50일 범위)
    const randomOffset = Math.floor(Math.random() * 50);
    const totalDays = daysFromBase + callOffset + randomOffset;
    const startDateObj = new Date(baseDate);
    startDateObj.setDate(baseDate.getDate() + totalDays);
    
    // 시작일로부터 20일 후 종료일
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 20);
    
    // 날짜 포맷팅
    const year = startDateObj.getFullYear();
    const month = (startDateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = startDateObj.getDate().toString().padStart(2, '0');
    const endYear = endDateObj.getFullYear();
    const endMonth = (endDateObj.getMonth() + 1).toString().padStart(2, '0');
    const endDay = endDateObj.getDate().toString().padStart(2, '0');
    
    const startDate = `${year}-${month}-${day}T00:00:00.000Z`;
    const endDate = `${endYear}-${endMonth}-${endDay}T23:59:59.999Z`;
    
    // 마감일 계산 (시작일 기준)
    const evaluationSetupDeadline = new Date(startDateObj);
    evaluationSetupDeadline.setDate(startDateObj.getDate() + 5);
    const performanceDeadline = new Date(startDateObj);
    performanceDeadline.setDate(startDateObj.getDate() + 10);
    const selfEvaluationDeadline = new Date(startDateObj);
    selfEvaluationDeadline.setDate(startDateObj.getDate() + 15);
    const peerEvaluationDeadline = new Date(startDateObj);
    peerEvaluationDeadline.setDate(startDateObj.getDate() + 18);
    
    const formatDate = (date: Date): string => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}T23:59:59.999Z`;
    };

    const response = await this.baseE2E.request()
      .post('/admin/evaluation-periods')
      .send({
        name: `하이브리드 테스트 평가기간_${timestamp}`,
        startDate: startDate,
        endDate: endDate,
        evaluationSetupDeadline: formatDate(evaluationSetupDeadline),
        performanceDeadline: formatDate(performanceDeadline),
        selfEvaluationDeadline: formatDate(selfEvaluationDeadline),
        peerEvaluationDeadline: formatDate(peerEvaluationDeadline),
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
