import { BaseE2ETest } from '../../base-e2e.spec';
import { DownwardEvaluationApiClient } from './api-clients/downward-evaluation.api-client';
import { DashboardApiClient } from './api-clients/dashboard.api-client';
import { SelfEvaluationScenario } from './self-evaluation.scenario';

/**
 * 하향평가 시나리오
 *
 * 엔드포인트만을 사용하여 하향평가 관련 기능을 테스트합니다.
 * 1차/2차 하향평가의 전체 프로세스를 시나리오 형태로 구성합니다.
 */
export class DownwardEvaluationScenario {
  private apiClient: DownwardEvaluationApiClient;
  private dashboardApiClient: DashboardApiClient;
  private selfEvaluationScenario: SelfEvaluationScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new DownwardEvaluationApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
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
   * 2차 하향평가 저장 (Upsert)
   */
  async 이차하향평가를_저장한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    console.log(`📝 2차 하향평가 저장 시작...`);
    console.log(`   피평가자: ${config.evaluateeId}`);
    console.log(`   평가자: ${config.evaluatorId}`);
    console.log(`   WBS: ${config.wbsId}`);

    const result = await this.apiClient.upsertSecondary(config);

    expect(result.id).toBeDefined();
    expect(result.evaluatorId).toBe(config.evaluatorId);
    expect(result.message).toBeDefined();

    console.log(`✅ 2차 하향평가 저장 완료 (ID: ${result.id})`);

    return result;
  }

  /**
   * 2차 하향평가 제출
   */
  async 이차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<any> {
    console.log(`📤 2차 하향평가 제출 시작...`);

    await this.apiClient.submitSecondary(config);

    console.log(`✅ 2차 하향평가 제출 완료`);

    return { isSubmitted: true, evaluatorType: 'secondary' };
  }

  /**
   * 하향평가 상세 조회
   */
  async 하향평가_상세를_조회한다(evaluationId: string): Promise<any> {
    console.log(`🔍 하향평가 상세 조회 (ID: ${evaluationId})`);

    const result = await this.apiClient.getDetail(evaluationId);

    expect(result.id).toBe(evaluationId);
    expect(result.evaluateeId).toBeDefined();
    expect(result.periodId).toBeDefined();
    expect(result.wbsId).toBeDefined();
    expect(result.evaluatorId).toBeDefined();
    expect(result.evaluatorType).toBeDefined();

    return result;
  }

  /**
   * 평가자별 피평가자 하향평가 목록 조회
   */
  async 평가자별_하향평가_목록을_조회한다(config: {
    evaluatorId: string;
    periodId: string;
    evaluatorType?: 'primary' | 'secondary';
    employeeId?: string;
    projectId?: string;
  }): Promise<any> {
    console.log(`🔍 평가자별 하향평가 목록 조회`);
    console.log(`   평가자: ${config.evaluatorId}`);
    console.log(`   평가기간: ${config.periodId}`);

    const result = await this.apiClient.getByEvaluator({
      evaluatorId: config.evaluatorId,
      periodId: config.periodId,
      evaluationType: config.evaluatorType,
      evaluateeId: config.employeeId,
    });

    // API 응답은 { evaluations: [...], total, page, limit } 형태
    expect(result).toBeDefined();
    expect(Array.isArray(result.evaluations)).toBe(true);

    console.log(
      `✅ 하향평가 목록 조회 완료 (평가 수: ${result.evaluations.length}, 전체: ${result.total})`,
    );

    return {
      evaluatorId: config.evaluatorId,
      periodId: config.periodId,
      evaluations: result.evaluations,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  /**
   * 피평가자별 하향평가 목록 조회
   * (평가자 여러 명의 평가를 모두 조회하려면 별도 엔드포인트가 필요하지만, 현재는 평가자별 조회 사용)
   */
  async 피평가자별_하향평가_목록을_조회한다(config: {
    evaluateeId: string;
    periodId: string;
    evaluatorType?: 'primary' | 'secondary';
    projectId?: string;
  }): Promise<any> {
    console.log(`🔍 피평가자별 하향평가 목록 조회`);
    console.log(`   피평가자: ${config.evaluateeId}`);
    console.log(`   평가기간: ${config.periodId}`);

    // 1. 평가라인 매핑에서 해당 피평가자를 평가하는 평가자 ID를 조회
    const mappings = await this.testSuite
      .getRepository('EvaluationLineMapping')
      .createQueryBuilder('mapping')
      .where('mapping.employeeId = :employeeId', {
        employeeId: config.evaluateeId,
      })
      .andWhere('mapping.deletedAt IS NULL')
      .getMany();

    console.log(`   평가자 수: ${mappings.length}`);

    // 2. 각 평가자에 대해 API 호출하여 평가 조회
    const allEvaluations: any[] = [];
    for (const mapping of mappings) {
      try {
        const result = await this.apiClient.getByEvaluator({
          evaluatorId: mapping.evaluatorId,
          periodId: config.periodId,
          evaluateeId: config.evaluateeId,
          evaluationType: config.evaluatorType,
        });

        if (result.evaluations && result.evaluations.length > 0) {
          allEvaluations.push(...result.evaluations);
        }
      } catch (error) {
        console.log(`   평가자 ${mapping.evaluatorId}의 평가 조회 실패`);
      }
    }

    console.log(
      `✅ 하향평가 목록 조회 완료 (평가 수: ${allEvaluations.length})`,
    );

    return {
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      evaluations: allEvaluations,
    };
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
   * 2차 하향평가 전체 시나리오 실행
   */
  async 이차하향평가_전체_시나리오를_실행한다(config: {
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
    console.log('🚀 2차 하향평가 전체 시나리오 시작...');

    // 1. 2차 하향평가 저장
    const 저장결과 = await this.이차하향평가를_저장한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: config.evaluatorId,
      selfEvaluationId: config.selfEvaluationId,
      downwardEvaluationContent: config.downwardEvaluationContent,
      downwardEvaluationScore: config.downwardEvaluationScore,
    });

    // 2. 2차 하향평가 제출
    const 제출결과 = await this.이차하향평가를_제출한다({
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
    this.대시보드에서_이차하향평가_포함_여부를_검증한다(
      대시보드조회결과,
      config.wbsId,
      저장결과,
    );

    console.log('✅ 2차 하향평가 전체 시나리오 완료!');

    return {
      저장결과,
      제출결과,
      상세조회결과,
      대시보드조회결과,
    };
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

  /**
   * 대시보드에서 2차 하향평가 포함 여부 검증
   */
  private 대시보드에서_이차하향평가_포함_여부를_검증한다(
    대시보드데이터: any,
    wbsId: string,
    저장한평가: any,
  ): void {
    console.log('🔍 대시보드 데이터에서 2차 하향평가 검증...');

    // 1. projects 배열 존재 확인
    expect(대시보드데이터.projects).toBeDefined();
    expect(Array.isArray(대시보드데이터.projects)).toBe(true);

    // 2. 해당 WBS 항목 찾기
    let 해당WBS찾음 = false;
    let 이차하향평가찾음 = false;

    for (const project of 대시보드데이터.projects) {
      if (!project.wbsList || !Array.isArray(project.wbsList)) {
        continue;
      }

      for (const wbs of project.wbsList) {
        if (wbs.wbsId === wbsId) {
          해당WBS찾음 = true;
          console.log(`   ✓ WBS 항목 발견: ${wbs.wbsId}`);

          // 3. secondaryDownwardEvaluation 확인
          if (wbs.secondaryDownwardEvaluation) {
            이차하향평가찾음 = true;
            console.log(`   ✓ 2차 하향평가 발견`);
            console.log(
              `     - 평가 ID: ${wbs.secondaryDownwardEvaluation.id}`,
            );
            console.log(
              `     - 제출 여부: ${wbs.secondaryDownwardEvaluation.isSubmitted}`,
            );

            // 4. 평가 내용 검증
            expect(wbs.secondaryDownwardEvaluation.id).toBe(저장한평가.id);
            expect(wbs.secondaryDownwardEvaluation.evaluatorType).toBe(
              'secondary',
            );
            expect(wbs.secondaryDownwardEvaluation.isSubmitted).toBe(true);

            // 저장 응답에는 id, evaluatorId, message만 있으므로
            // content와 score는 대시보드 데이터에 있는지만 확인
            if (wbs.secondaryDownwardEvaluation.downwardEvaluationContent) {
              expect(
                wbs.secondaryDownwardEvaluation.downwardEvaluationContent,
              ).toBeDefined();
            }

            if (
              wbs.secondaryDownwardEvaluation.downwardEvaluationScore !==
              undefined
            ) {
              expect(
                wbs.secondaryDownwardEvaluation.downwardEvaluationScore,
              ).toBeDefined();
            }
          }
        }
      }
    }

    expect(해당WBS찾음).toBe(true);
    expect(이차하향평가찾음).toBe(true);

    console.log('✅ 대시보드에서 2차 하향평가 검증 완료');
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
   * 하향평가 초기화 (2차)
   */
  async 이차하향평가를_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    console.log(`🔄 2차 하향평가 초기화...`);

    await this.apiClient.resetSecondary(config);

    console.log(`✅ 2차 하향평가 초기화 완료`);
  }

  /**
   * WBS 할당 및 평가라인 매핑 확인
   * (하향평가의 전제 조건)
   */
  async WBS할당_및_평가라인_매핑_확인(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    mappingCount: number;
    primaryEvaluatorId?: string;
    secondaryEvaluatorId?: string;
  }> {
    console.log('📌 WBS 할당 및 평가라인 매핑 확인...');

    // 1. WBS 할당 (평가라인 매핑 자동 생성)
    await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments')
      .send({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        projectId: config.projectId,
        periodId: config.periodId,
      })
      .expect(201);

    console.log(
      `✅ WBS 할당 완료 - 피평가자: ${config.employeeId}, WBS: ${config.wbsItemId}`,
    );

    // 2. 평가라인 매핑 확인
    // - 1차 평가자: wbsItemId가 null (직원별 고정 담당자)
    // - 2차 평가자: wbsItemId가 있음 (WBS별 평가자)
    const allMappings = await this.testSuite
      .getRepository('EvaluationLineMapping')
      .createQueryBuilder('mapping')
      .where('mapping.employeeId = :employeeId', {
        employeeId: config.employeeId,
      })
      .andWhere(
        '(mapping.wbsItemId = :wbsItemId OR mapping.wbsItemId IS NULL)',
        { wbsItemId: config.wbsItemId },
      )
      .andWhere('mapping.deletedAt IS NULL')
      .getMany();

    const primaryMapping = allMappings.find((m) => m.wbsItemId === null);
    const secondaryMapping = allMappings.find(
      (m) => m.wbsItemId === config.wbsItemId,
    );

    console.log(
      `📊 평가라인 매핑: ${allMappings.length}개 (피평가자: ${config.employeeId})`,
    );
    if (primaryMapping) {
      console.log(
        `  1차 평가자: ${primaryMapping.evaluatorId} (wbsItemId: null)`,
      );
    }
    if (secondaryMapping) {
      console.log(
        `  2차 평가자: ${secondaryMapping.evaluatorId} (wbsItemId: ${secondaryMapping.wbsItemId})`,
      );
    }

    return {
      mappingCount: allMappings.length,
      primaryEvaluatorId: primaryMapping?.evaluatorId,
      secondaryEvaluatorId: secondaryMapping?.evaluatorId,
    };
  }

  /**
   * 하향평가를 위한 자기평가 완료
   * (하향평가의 전제 조건)
   */
  async 하향평가를_위한_자기평가_완료(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
  }): Promise<{ selfEvaluationId: string }> {
    console.log('📝 자기평가 저장 및 제출...');

    // 1. 자기평가 저장
    const 자기평가저장 =
      await this.selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        periodId: config.periodId,
        selfEvaluationContent: config.selfEvaluationContent,
        selfEvaluationScore: config.selfEvaluationScore,
        performanceResult: config.performanceResult,
      });

    // 2. 자기평가 제출
    const 자기평가제출 =
      await this.selfEvaluationScenario.WBS자기평가를_제출한다(자기평가저장.id);

    expect(자기평가제출.isCompleted).toBe(true);

    console.log(`✅ 자기평가 완료 (ID: ${자기평가저장.id})`);

    return { selfEvaluationId: 자기평가저장.id };
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
   * 2차 하향평가 전체 프로세스 실행
   * (WBS 할당 → 자기평가 → 2차 하향평가 전체 플로우)
   */
  async 이차하향평가_전체_프로세스_실행(config: {
    evaluateeId: string;
    evaluatorId?: string; // 옵셔널: 미제공 시 WBS 할당에서 자동 생성된 2차 평가자 사용
    wbsItemId: string;
    projectId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
    skipWbsAssignment?: boolean; // WBS 할당이 이미 되어 있는 경우
    skipSelfEvaluation?: boolean; // 자기평가가 이미 되어 있는 경우
  }): Promise<{
    WBS할당결과?: {
      mappingCount: number;
      primaryEvaluatorId?: string;
      secondaryEvaluatorId?: string;
    };
    자기평가결과?: { selfEvaluationId: string };
    하향평가저장: any;
    하향평가제출: any;
  }> {
    console.log('🚀 2차 하향평가 전체 프로세스 시작...');

    let WBS할당결과:
      | {
          mappingCount: number;
          primaryEvaluatorId?: string;
          secondaryEvaluatorId?: string;
        }
      | undefined;
    let 자기평가결과: { selfEvaluationId: string } | undefined;

    // 1. WBS 할당 (옵션)
    if (!config.skipWbsAssignment) {
      try {
        WBS할당결과 = await this.WBS할당_및_평가라인_매핑_확인({
          employeeId: config.evaluateeId,
          wbsItemId: config.wbsItemId,
          projectId: config.projectId,
          periodId: config.periodId,
        });
      } catch (error: any) {
        // 409 Conflict (이미 할당된 경우)는 무시하고 평가라인 매핑만 조회
        if (error?.status === 409 || error?.response?.status === 409) {
          console.log(
            '⚠️ WBS가 이미 할당되어 있습니다. 평가라인 매핑 조회 중...',
          );

          // 평가라인 매핑 조회
          const allMappings = await this.testSuite
            .getRepository('EvaluationLineMapping')
            .createQueryBuilder('mapping')
            .where('mapping.employeeId = :employeeId', {
              employeeId: config.evaluateeId,
            })
            .andWhere(
              '(mapping.wbsItemId = :wbsItemId OR mapping.wbsItemId IS NULL)',
              { wbsItemId: config.wbsItemId },
            )
            .andWhere('mapping.deletedAt IS NULL')
            .getMany();

          const primaryMapping = allMappings.find((m) => m.wbsItemId === null);
          const secondaryMapping = allMappings.find(
            (m) => m.wbsItemId === config.wbsItemId,
          );

          WBS할당결과 = {
            mappingCount: allMappings.length,
            primaryEvaluatorId: primaryMapping?.evaluatorId,
            secondaryEvaluatorId: secondaryMapping?.evaluatorId,
          };
        } else {
          throw error;
        }
      }
    }

    // 2. 자기평가 (옵션)
    if (!config.skipSelfEvaluation) {
      자기평가결과 = await this.하향평가를_위한_자기평가_완료({
        employeeId: config.evaluateeId,
        wbsItemId: config.wbsItemId,
        periodId: config.periodId,
        selfEvaluationContent: config.selfEvaluationContent,
        selfEvaluationScore: config.selfEvaluationScore,
        performanceResult: config.performanceResult,
      });
    }

    // 2차 평가자 ID 확정: 전달받은 값 또는 WBS 할당에서 자동 생성된 값 사용
    const 실제이차평가자ID =
      config.evaluatorId || WBS할당결과?.secondaryEvaluatorId;

    if (!실제이차평가자ID) {
      console.log(
        '⚠️ 2차 평가자 ID를 찾을 수 없습니다. 프로젝트에 매니저가 설정되지 않아 2차 평가자가 자동 할당되지 않았습니다.',
      );
      // 2차 평가자가 없는 경우, WBS 할당 결과만 반환
      return {
        WBS할당결과,
        자기평가결과,
        하향평가저장: {
          id: null,
          evaluatorId: null,
          message: '2차 평가자 없음',
        },
        하향평가제출: { isSubmitted: false },
      };
    }

    console.log(`  ✅ 2차 평가자 ID: ${실제이차평가자ID}`);

    // 3. 2차 하향평가 저장
    const 하향평가저장 = await this.이차하향평가를_저장한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsItemId,
      evaluatorId: 실제이차평가자ID,
      selfEvaluationId: 자기평가결과?.selfEvaluationId,
      downwardEvaluationContent: config.downwardEvaluationContent,
      downwardEvaluationScore: config.downwardEvaluationScore,
    });

    // 4. 2차 하향평가 제출
    const 하향평가제출 = await this.이차하향평가를_제출한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsItemId,
      evaluatorId: 실제이차평가자ID,
    });

    // 5. 검증
    expect(하향평가저장.id).toBeDefined();
    expect(하향평가저장.evaluatorId).toBe(실제이차평가자ID);
    expect(하향평가저장.message).toBeDefined();
    expect(하향평가제출.isSubmitted).toBe(true);

    console.log(
      `✅ 2차 하향평가 전체 프로세스 완료 - 평가 ID: ${하향평가저장.id}, 평가자: ${실제이차평가자ID}, 피평가자: ${config.evaluateeId}`,
    );

    return { WBS할당결과, 자기평가결과, 하향평가저장, 하향평가제출 };
  }

  /**
   * 하향평가 관리 전체 시나리오
   * - 1차/2차 하향평가 저장 및 제출
   * - 평가자별/피평가자별 목록 조회
   * - 평가자 타입별 필터링 조회
   */
  async 하향평가_관리_전체_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
    projectIds: string[];
    wbsItemIds: string[];
    evaluatorId: string;
    evaluateeId: string;
  }): Promise<{
    일차하향평가결과: any;
    이차하향평가결과: any;
    평가자별목록조회: any;
    피평가자별목록조회: any;
    일차필터링조회: any;
    이차필터링조회: any;
  }> {
    console.log('🚀 하향평가 관리 전체 시나리오 시작...');

    // 1. 1차 하향평가 전체 프로세스
    const 일차하향평가결과 = await this.일차하향평가_전체_프로세스_실행({
      evaluateeId: config.evaluateeId,
      wbsItemId: config.wbsItemIds[0],
      projectId: config.projectIds[0],
      periodId: config.evaluationPeriodId,
      selfEvaluationContent: '1차 하향평가를 위한 자기평가',
      selfEvaluationScore: 90,
      performanceResult: '우수한 성과를 달성했습니다.',
      downwardEvaluationContent:
        '업무 수행 능력이 뛰어나며 팀에 기여도가 높습니다.',
      downwardEvaluationScore: 95,
    });

    // 2. 2차 하향평가 전체 프로세스
    const 이차하향평가결과 = await this.이차하향평가_전체_프로세스_실행({
      evaluateeId: config.evaluateeId,
      wbsItemId: config.wbsItemIds[1],
      projectId: config.projectIds[0],
      periodId: config.evaluationPeriodId,
      selfEvaluationContent: '2차 하향평가를 위한 자기평가',
      selfEvaluationScore: 85,
      performanceResult: '목표를 달성했습니다.',
      downwardEvaluationContent:
        '전반적으로 우수한 성과를 보였으며, 지속적인 발전을 기대합니다.',
      downwardEvaluationScore: 88,
    });

    // 3. 평가자별 하향평가 목록 조회
    const 평가자별목록조회 = await this.평가자별_하향평가_목록을_조회한다({
      evaluatorId: config.evaluatorId,
      periodId: config.evaluationPeriodId,
    });

    // 4. 피평가자별 하향평가 목록 조회
    const 피평가자별목록조회 = await this.피평가자별_하향평가_목록을_조회한다({
      evaluateeId: config.evaluateeId,
      periodId: config.evaluationPeriodId,
    });

    // 5. 1차 평가자 타입으로 필터링 조회
    const 일차필터링조회 = await this.평가자별_하향평가_목록을_조회한다({
      evaluatorId: config.evaluatorId,
      periodId: config.evaluationPeriodId,
      evaluatorType: 'primary',
    });

    // 6. 2차 평가자 타입으로 필터링 조회
    const 이차평가자 = config.employeeIds[2] || config.employeeIds[0];
    const 이차필터링조회 = await this.평가자별_하향평가_목록을_조회한다({
      evaluatorId: 이차평가자,
      periodId: config.evaluationPeriodId,
      evaluatorType: 'secondary',
    });

    console.log('✅ 하향평가 관리 전체 시나리오 완료!');

    return {
      일차하향평가결과,
      이차하향평가결과,
      평가자별목록조회,
      피평가자별목록조회,
      일차필터링조회,
      이차필터링조회,
    };
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
   * 2차 하향평가 저장 시나리오
   * (간단 버전 - WBS 할당과 자기평가는 이미 완료된 상태)
   */
  async 이차하향평가_저장_시나리오를_실행한다(config: {
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
    console.log('📝 2차 하향평가 저장 시나리오 시작...');

    // 2차 하향평가 저장
    const 저장결과 = await this.이차하향평가를_저장한다({
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

    console.log(`✅ 2차 하향평가 저장 시나리오 완료 (ID: ${저장결과.id})`);

    return { 저장결과 };
  }

  /**
   * 1차/2차 하향평가 저장 후 제출 시나리오
   */
  async 하향평가_저장_후_제출_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    evaluatorType: 'primary' | 'secondary';
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
    제출결과: any;
  }> {
    console.log(
      `📝 ${config.evaluatorType === 'primary' ? '1차' : '2차'} 하향평가 저장 후 제출 시나리오 시작...`,
    );

    // 1. 저장
    const 저장결과 =
      config.evaluatorType === 'primary'
        ? await this.일차하향평가를_저장한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
            selfEvaluationId: config.selfEvaluationId,
            downwardEvaluationContent: config.downwardEvaluationContent,
            downwardEvaluationScore: config.downwardEvaluationScore,
          })
        : await this.이차하향평가를_저장한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
            selfEvaluationId: config.selfEvaluationId,
            downwardEvaluationContent: config.downwardEvaluationContent,
            downwardEvaluationScore: config.downwardEvaluationScore,
          });

    // 2. 제출
    const 제출결과 =
      config.evaluatorType === 'primary'
        ? await this.일차하향평가를_제출한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
          })
        : await this.이차하향평가를_제출한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
          });

    // 검증
    expect(저장결과.id).toBeDefined();
    expect(저장결과.evaluatorId).toBe(config.evaluatorId);
    expect(제출결과.isSubmitted).toBe(true);

    console.log(
      `✅ ${config.evaluatorType === 'primary' ? '1차' : '2차'} 하향평가 저장 후 제출 시나리오 완료`,
    );

    return { 저장결과, 제출결과 };
  }
}
