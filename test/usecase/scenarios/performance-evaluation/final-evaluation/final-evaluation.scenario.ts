import { BaseE2ETest } from '../../../../base-e2e.spec';
import { FinalEvaluationApiClient } from '../../api-clients/final-evaluation.api-client';

/**
 * 최종평가 시나리오
 *
 * 최종평가 관리의 다양한 시나리오를 캡슐화합니다.
 */
export class FinalEvaluationScenario {
  private apiClient: FinalEvaluationApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new FinalEvaluationApiClient(testSuite);
  }

  /**
   * 최종평가를 저장한다 (Upsert)
   */
  async 최종평가를_저장한다(config: {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments?: string;
  }): Promise<any> {
    return await this.apiClient.upsertFinalEvaluation(
      config.employeeId,
      config.periodId,
      {
        evaluationGrade: config.evaluationGrade,
        jobGrade: config.jobGrade,
        jobDetailedGrade: config.jobDetailedGrade,
        finalComments: config.finalComments,
      },
    );
  }

  /**
   * 최종평가를 확정한다
   */
  async 최종평가를_확정한다(id: string): Promise<any> {
    return await this.apiClient.confirmFinalEvaluation(id);
  }

  /**
   * 최종평가 확정을 취소한다
   */
  async 최종평가_확정을_취소한다(id: string): Promise<any> {
    return await this.apiClient.cancelConfirmationFinalEvaluation(id);
  }

  /**
   * 최종평가 상세정보를 조회한다
   */
  async 최종평가_상세정보를_조회한다(id: string): Promise<any> {
    return await this.apiClient.getFinalEvaluation(id);
  }

  /**
   * 최종평가 목록을 조회한다
   */
  async 최종평가_목록을_조회한다(filters?: {
    employeeId?: string;
    periodId?: string;
    evaluationGrade?: string;
    jobGrade?: string;
    jobDetailedGrade?: string;
    confirmedOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<any> {
    return await this.apiClient.getFinalEvaluationList(filters);
  }

  /**
   * 직원-평가기간별 최종평가를 조회한다
   */
  async 직원_평가기간별_최종평가를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    return await this.apiClient.getFinalEvaluationByEmployeePeriod(
      employeeId,
      periodId,
    );
  }

  /**
   * 최종평가 전체 시나리오를 실행한다
   * (저장 → 확정 → 확정 취소 → 재확정 → 조회)
   */
  async 최종평가_전체_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments?: string;
  }): Promise<{
    저장결과: any;
    확정결과: any;
    확정취소결과: any;
    재확정결과: any;
    최종조회결과: any;
  }> {
    // 1단계: 저장
    const 저장결과 = await this.최종평가를_저장한다(config);

    // 2단계: 확정
    const 확정결과 = await this.최종평가를_확정한다(저장결과.id);

    // 3단계: 확정 취소
    const 확정취소결과 = await this.최종평가_확정을_취소한다(저장결과.id);

    // 4단계: 재확정
    const 재확정결과 = await this.최종평가를_확정한다(저장결과.id);

    // 5단계: 최종 조회
    const 최종조회결과 = await this.최종평가_상세정보를_조회한다(저장결과.id);

    return {
      저장결과,
      확정결과,
      확정취소결과,
      재확정결과,
      최종조회결과,
    };
  }
}

