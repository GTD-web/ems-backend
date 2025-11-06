import { BaseE2ETest } from '../../../base-e2e.spec';
import { DownwardEvaluationApiClient } from '../api-clients/downward-evaluation.api-client';
import { SelfEvaluationScenario } from '../self-evaluation.scenario';

/**
 * 기본 하향평가 시나리오
 *
 * 하향평가의 기본적인 CRUD 기능을 제공합니다.
 * 1차/2차 구분 없이 공통으로 사용되는 기능들을 포함합니다.
 */
export class BaseDownwardEvaluationScenario {
  protected apiClient: DownwardEvaluationApiClient;
  protected selfEvaluationScenario: SelfEvaluationScenario;

  constructor(protected readonly testSuite: BaseE2ETest) {
    this.apiClient = new DownwardEvaluationApiClient(testSuite);
    this.selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
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
   * 평가자별 하향평가 목록 조회
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

    // 2. 자기평가 제출 (피평가자 → 1차 평가자)
    const 자기평가제출 =
      await this.selfEvaluationScenario.WBS자기평가를_제출한다(자기평가저장.id);

    expect(자기평가제출.submittedToEvaluator).toBe(true);

    console.log(`✅ 자기평가 완료 (ID: ${자기평가저장.id})`);

    return { selfEvaluationId: 자기평가저장.id };
  }
}
