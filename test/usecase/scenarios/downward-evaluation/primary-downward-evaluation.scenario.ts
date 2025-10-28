import { BaseE2ETest } from '../../../base-e2e.spec';
import { DownwardEvaluationApiClient } from '../api-clients/downward-evaluation.api-client';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';
import { BaseDownwardEvaluationScenario } from './base-downward-evaluation.scenario';

/**
 * 1차 하향평가 시나리오
 * 
 * 1차 하향평가 관련 기능을 제공합니다.
 * 기본 하향평가 시나리오를 상속받아 1차 평가에 특화된 기능들을 포함합니다.
 */
export class PrimaryDownwardEvaluationScenario extends BaseDownwardEvaluationScenario {
  private dashboardApiClient: DashboardApiClient;

  constructor(testSuite: BaseE2ETest) {
    super(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  /**
   * 1차 하향평가 저장 (Upsert)
   */
  async 일차하향평가를_저장한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    console.log(`📝 1차 하향평가 저장 시작...`);
    console.log(`   피평가자: ${config.evaluateeId}`);
    console.log(`   평가자: ${config.evaluatorId}`);
    console.log(`   WBS: ${config.wbsId}`);

    const result = await this.apiClient.upsertPrimary(config);

    expect(result.id).toBeDefined();
    expect(result.evaluatorId).toBe(config.evaluatorId);
    expect(result.message).toBeDefined();

    console.log(`✅ 1차 하향평가 저장 완료 (ID: ${result.id})`);

    return result;
  }

  /**
   * 1차 하향평가 제출
   */
  async 일차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<any> {
    console.log(`📤 1차 하향평가 제출 시작...`);

    await this.apiClient.submitPrimary(config);

    console.log(`✅ 1차 하향평가 제출 완료`);

    return { isSubmitted: true, evaluatorType: 'primary' };
  }

  /**
   * 하향평가 초기화 (1차)
   */
  async 일차하향평가를_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    console.log(`🔄 1차 하향평가 초기화...`);

    await this.apiClient.resetPrimary(config);

    console.log(`✅ 1차 하향평가 초기화 완료`);
  }

  /**
   * 1차 하향평가 전체 시나리오 실행
   */
  async 일차하향평가_전체_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
    제출결과: any;
    상세조회결과: any;
    대시보드조회결과: any;
  }> {
    console.log('🚀 1차 하향평가 전체 시나리오 시작...');

    // 1. 1차 하향평가 저장
    const 저장결과 = await this.일차하향평가를_저장한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: config.evaluatorId,
      selfEvaluationId: config.selfEvaluationId,
      downwardEvaluationContent: config.downwardEvaluationContent,
      downwardEvaluationScore: config.downwardEvaluationScore,
    });

    // 2. 1차 하향평가 제출
    const 제출결과 = await this.일차하향평가를_제출한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: config.evaluatorId,
    });

    // 3. 하향평가 상세 조회
    const 상세조회결과 = await this.하향평가_상세를_조회한다(저장결과.id);

    // 4. 대시보드에서 평가자 할당 데이터 조회 및 검증
    console.log('🔍 대시보드에서 평가자 할당 데이터 조회...');
    const 대시보드조회결과 =
      await this.dashboardApiClient.getEvaluatorEmployeeAssignedData({
        periodId: config.periodId,
        evaluatorId: config.evaluatorId,
        employeeId: config.evaluateeId,
      });

    // 5. 대시보드 데이터 검증
    this.대시보드에서_일차하향평가_포함_여부를_검증한다(
      대시보드조회결과,
      config.wbsId,
      저장결과,
    );

    console.log('✅ 1차 하향평가 전체 시나리오 완료!');

    return {
      저장결과,
      제출결과,
      상세조회결과,
      대시보드조회결과,
    };
  }

  /**
   * 1차 하향평가 전체 프로세스 실행
   * (WBS 할당 → 자기평가 → 1차 하향평가 전체 플로우)
   */
  async 일차하향평가_전체_프로세스_실행(config: {
    evaluateeId: string;
    evaluatorId?: string; // 옵셔널: 미제공 시 WBS 할당에서 자동 생성된 1차 평가자 사용
    wbsItemId: string;
    projectId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    WBS할당결과: {
      mappingCount: number;
      primaryEvaluatorId?: string;
      secondaryEvaluatorId?: string;
    };
    자기평가결과: { selfEvaluationId: string };
    하향평가저장: any;
    하향평가제출: any;
  }> {
    console.log('🚀 1차 하향평가 전체 프로세스 시작...');

    // 1. WBS 할당 및 평가라인 매핑 확인
    const WBS할당결과 = await this.WBS할당_및_평가라인_매핑_확인({
      employeeId: config.evaluateeId,
      wbsItemId: config.wbsItemId,
      projectId: config.projectId,
      periodId: config.periodId,
    });

    // 2. 자기평가 완료
    const 자기평가결과 = await this.하향평가를_위한_자기평가_완료({
      employeeId: config.evaluateeId,
      wbsItemId: config.wbsItemId,
      periodId: config.periodId,
      selfEvaluationContent: config.selfEvaluationContent,
      selfEvaluationScore: config.selfEvaluationScore,
      performanceResult: config.performanceResult,
    });

    // 1차 평가자 ID 확정: 전달받은 값 또는 WBS 할당에서 자동 생성된 값 사용
    const 실제일차평가자ID =
      config.evaluatorId || WBS할당결과.primaryEvaluatorId;

    if (!실제일차평가자ID) {
      throw new Error(
        '1차 평가자 ID를 찾을 수 없습니다. WBS 할당을 먼저 수행하거나 evaluatorId를 명시해주세요.',
      );
    }

    console.log(`  ✅ 1차 평가자 ID: ${실제일차평가자ID}`);

    // 3. 1차 하향평가 저장
    const 하향평가저장 = await this.일차하향평가를_저장한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsItemId,
      evaluatorId: 실제일차평가자ID,
      selfEvaluationId: 자기평가결과.selfEvaluationId,
      downwardEvaluationContent: config.downwardEvaluationContent,
      downwardEvaluationScore: config.downwardEvaluationScore,
    });

    // 4. 1차 하향평가 제출
    const 하향평가제출 = await this.일차하향평가를_제출한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsItemId,
      evaluatorId: 실제일차평가자ID,
    });

    // 5. 검증
    expect(하향평가저장.id).toBeDefined();
    expect(하향평가저장.evaluatorId).toBe(실제일차평가자ID);
    expect(하향평가저장.message).toBeDefined();
    expect(하향평가제출.isSubmitted).toBe(true);

    console.log(
      `✅ 1차 하향평가 전체 프로세스 완료 - 평가 ID: ${하향평가저장.id}, 평가자: ${config.evaluatorId}, 피평가자: ${config.evaluateeId}`,
    );

    return { WBS할당결과, 자기평가결과, 하향평가저장, 하향평가제출 };
  }

  /**
   * 1차 하향평가 저장 시나리오
   * (간단 버전 - WBS 할당과 자기평가는 이미 완료된 상태)
   */
  async 일차하향평가_저장_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
  }> {
    console.log('📝 1차 하향평가 저장 시나리오 시작...');

    // 1차 하향평가 저장
    const 저장결과 = await this.일차하향평가를_저장한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: config.evaluatorId,
      selfEvaluationId: config.selfEvaluationId,
      downwardEvaluationContent: config.downwardEvaluationContent,
      downwardEvaluationScore: config.downwardEvaluationScore,
    });

    // 검증
    expect(저장결과.id).toBeDefined();
    expect(저장결과.evaluatorId).toBe(config.evaluatorId);
    expect(저장결과.message).toBeDefined();

    console.log(`✅ 1차 하향평가 저장 시나리오 완료 (ID: ${저장결과.id})`);

    return { 저장결과 };
  }

  /**
   * 대시보드에서 1차 하향평가 포함 여부 검증
   */
  private 대시보드에서_일차하향평가_포함_여부를_검증한다(
    대시보드데이터: any,
    wbsId: string,
    저장한평가: any,
  ): void {
    console.log('🔍 대시보드 데이터에서 1차 하향평가 검증...');

    // 1. projects 배열 존재 확인
    expect(대시보드데이터.projects).toBeDefined();
    expect(Array.isArray(대시보드데이터.projects)).toBe(true);

    // 2. 해당 WBS 항목 찾기
    let 해당WBS찾음 = false;
    let 일차하향평가찾음 = false;

    for (const project of 대시보드데이터.projects) {
      if (!project.wbsList || !Array.isArray(project.wbsList)) {
        continue;
      }

      for (const wbs of project.wbsList) {
        if (wbs.wbsId === wbsId) {
          해당WBS찾음 = true;
          console.log(`   ✓ WBS 항목 발견: ${wbs.wbsId}`);

          // 3. primaryDownwardEvaluation 확인
          if (wbs.primaryDownwardEvaluation) {
            일차하향평가찾음 = true;
            console.log(`   ✓ 1차 하향평가 발견`);
            console.log(`     - 평가 ID: ${wbs.primaryDownwardEvaluation.id}`);
            console.log(
              `     - 제출 여부: ${wbs.primaryDownwardEvaluation.isSubmitted}`,
            );

            // 4. 평가 내용 검증
            expect(wbs.primaryDownwardEvaluation.id).toBe(저장한평가.id);
            expect(wbs.primaryDownwardEvaluation.evaluatorType).toBe('primary');
            expect(wbs.primaryDownwardEvaluation.isSubmitted).toBe(true);

            // 저장 응답에는 id, evaluatorId, message만 있으므로
            // content와 score는 대시보드 데이터에 있는지만 확인
            if (wbs.primaryDownwardEvaluation.downwardEvaluationContent) {
              expect(
                wbs.primaryDownwardEvaluation.downwardEvaluationContent,
              ).toBeDefined();
            }

            if (
              wbs.primaryDownwardEvaluation.downwardEvaluationScore !==
              undefined
            ) {
              expect(
                wbs.primaryDownwardEvaluation.downwardEvaluationScore,
              ).toBeDefined();
            }
          }
        }
      }
    }

    expect(해당WBS찾음).toBe(true);
    expect(일차하향평가찾음).toBe(true);

    console.log('✅ 대시보드에서 1차 하향평가 검증 완료');
  }
}
