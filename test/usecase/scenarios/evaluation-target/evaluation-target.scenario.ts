import { BaseE2ETest } from '../../../base-e2e.spec';
import { EvaluationTargetApiClient } from '../api-clients/evaluation-target.api-client';

/**
 * 평가대상 관리 시나리오 클래스
 * 
 * 평가대상과 관련된 모든 시나리오를 관리합니다.
 */
export class EvaluationTargetScenario {
  private apiClient: EvaluationTargetApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new EvaluationTargetApiClient(testSuite);
  }

  /**
   * 평가대상자를 대량 등록한다
   */
  async 평가대상자를_대량_등록한다(
    evaluationPeriodId: string,
    employeeIds: string[],
  ): Promise<any[]> {
    return await this.apiClient.registerBulkEvaluationTargets({
      evaluationPeriodId,
      employeeIds,
    });
  }

  /**
   * 평가대상자를 단일 등록한다
   */
  async 평가대상자를_단일_등록한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    return await this.apiClient.registerEvaluationTarget({
      evaluationPeriodId,
      employeeId,
    });
  }

  /**
   * 평가대상자를 단일 등록한다 (409 에러 기대)
   */
  async 평가대상자를_단일_등록한다_409에러기대(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    return await this.apiClient.registerEvaluationTargetExpectConflict({
      evaluationPeriodId,
      employeeId,
    });
  }

  /**
   * 평가대상자를 제외한다
   */
  async 평가대상자를_제외한다(
    evaluationPeriodId: string,
    employeeId: string,
    excludeReason: string,
  ): Promise<any> {
    return await this.apiClient.excludeEvaluationTarget({
      evaluationPeriodId,
      employeeId,
      excludeReason,
    });
  }

  /**
   * 평가대상자를 포함한다 (제외 취소)
   */
  async 평가대상자를_포함한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    return await this.apiClient.includeEvaluationTarget({
      evaluationPeriodId,
      employeeId,
    });
  }

  /**
   * 평가대상자 목록을 조회한다
   */
  async 평가대상자_목록을_조회한다(
    evaluationPeriodId: string,
    includeExcluded: boolean = false,
  ): Promise<any> {
    return await this.apiClient.getEvaluationTargets({
      evaluationPeriodId,
      includeExcluded,
    });
  }

  /**
   * 제외된 평가대상자 목록을 조회한다
   */
  async 제외된_평가대상자_목록을_조회한다(
    evaluationPeriodId: string,
  ): Promise<any> {
    return await this.apiClient.getExcludedEvaluationTargets(evaluationPeriodId);
  }

  /**
   * 직원의 평가기간 맵핑을 조회한다
   */
  async 직원의_평가기간_맵핑을_조회한다(
    employeeId: string,
  ): Promise<any> {
    return await this.apiClient.getEmployeeEvaluationPeriods(employeeId);
  }

  /**
   * 평가대상 여부를 확인한다
   */
  async 평가대상_여부를_확인한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    return await this.apiClient.checkEvaluationTarget({
      evaluationPeriodId,
      employeeId,
    });
  }

  /**
   * 평가대상자 등록을 해제한다
   */
  async 평가대상자_등록을_해제한다(
    evaluationPeriodId: string,
    employeeId: string,
  ): Promise<any> {
    return await this.apiClient.unregisterEvaluationTarget({
      evaluationPeriodId,
      employeeId,
    });
  }

  /**
   * 모든 평가대상자 등록을 해제한다
   */
  async 모든_평가대상자_등록을_해제한다(
    evaluationPeriodId: string,
  ): Promise<any> {
    return await this.apiClient.unregisterAllEvaluationTargets(evaluationPeriodId);
  }

  /**
   * 평가대상 기본 관리 전체 시나리오를 실행한다
   */
  async 평가대상_기본_관리_전체_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
  }): Promise<{
    대량등록결과: any[];
    단일등록결과: any;
    조회결과: any;
    상태확인결과: any;
  }> {
    // 1단계: 대량 등록
    const 대량등록결과 = await this.평가대상자를_대량_등록한다(
      config.evaluationPeriodId,
      config.employeeIds,
    );

    // 2단계: 단일 등록
    const 단일등록결과 = await this.평가대상자를_단일_등록한다(
      config.evaluationPeriodId,
      config.employeeIds[0],
    );

    // 3단계: 조회
    const 조회결과 = await this.평가대상자_목록을_조회한다(
      config.evaluationPeriodId,
      false,
    );

    // 4단계: 상태 확인
    const 상태확인결과 = await this.평가대상_여부를_확인한다(
      config.evaluationPeriodId,
      config.employeeIds[0],
    );

    return {
      대량등록결과,
      단일등록결과,
      조회결과,
      상태확인결과,
    };
  }

  /**
   * 평가대상 제외/포함 관리 전체 시나리오를 실행한다
   */
  async 평가대상_제외포함_관리_전체_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
    excludeReason: string;
  }): Promise<{
    대량등록결과: any[];
    제외결과: any;
    제외된대상자조회결과: any;
    포함결과: any;
    포함후조회결과: any;
  }> {
    // 1단계: 대량 등록
    const 대량등록결과 = await this.평가대상자를_대량_등록한다(
      config.evaluationPeriodId,
      config.employeeIds,
    );

    // 2단계: 제외
    const 제외결과 = await this.평가대상자를_제외한다(
      config.evaluationPeriodId,
      config.employeeIds[0],
      config.excludeReason,
    );

    // 3단계: 제외된 대상자 조회
    const 제외된대상자조회결과 = await this.제외된_평가대상자_목록을_조회한다(
      config.evaluationPeriodId,
    );

    // 4단계: 포함
    const 포함결과 = await this.평가대상자를_포함한다(
      config.evaluationPeriodId,
      config.employeeIds[0],
    );

    // 5단계: 포함 후 조회
    const 포함후조회결과 = await this.평가대상자_목록을_조회한다(
      config.evaluationPeriodId,
      true,
    );

    return {
      대량등록결과,
      제외결과,
      제외된대상자조회결과,
      포함결과,
      포함후조회결과,
    };
  }

  /**
   * 평가대상 등록 해제 관리 전체 시나리오를 실행한다
   */
  async 평가대상_등록해제_관리_전체_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
  }): Promise<{
    대량등록결과: any[];
    단일해제결과: any;
    해제후조회결과: any;
    전체해제결과: any;
    전체해제후조회결과: any;
  }> {
    // 1단계: 대량 등록
    const 대량등록결과 = await this.평가대상자를_대량_등록한다(
      config.evaluationPeriodId,
      config.employeeIds,
    );

    // 2단계: 단일 해제
    const 단일해제결과 = await this.평가대상자_등록을_해제한다(
      config.evaluationPeriodId,
      config.employeeIds[0],
    );

    // 3단계: 해제 후 조회
    const 해제후조회결과 = await this.평가대상자_목록을_조회한다(
      config.evaluationPeriodId,
      false,
    );

    // 4단계: 전체 해제
    const 전체해제결과 = await this.모든_평가대상자_등록을_해제한다(
      config.evaluationPeriodId,
    );

    // 5단계: 전체 해제 후 조회
    const 전체해제후조회결과 = await this.평가대상자_목록을_조회한다(
      config.evaluationPeriodId,
      false,
    );

    return {
      대량등록결과,
      단일해제결과,
      해제후조회결과,
      전체해제결과,
      전체해제후조회결과,
    };
  }
}
