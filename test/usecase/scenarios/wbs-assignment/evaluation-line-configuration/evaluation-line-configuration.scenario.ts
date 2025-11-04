import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationLineApiClient } from '../../api-clients/evaluation-line.api-client';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { ProjectAssignmentApiClient } from '../../api-clients/project-assignment.api-client';
import { WbsAssignmentApiClient } from '../../api-clients/wbs-assignment.api-client';

/**
 * 평가라인 변경 관리 시나리오
 *
 * 평가라인 구성 관련 HTTP 요청을 캡슐화합니다.
 * - 1차/2차 평가자 구성
 * - 배치 평가자 구성
 * - 평가라인 조회
 * - 대시보드 검증
 */
export class EvaluationLineConfigurationScenario {
  private evaluationLineApiClient: EvaluationLineApiClient;
  private dashboardApiClient: DashboardApiClient;
  private projectAssignmentApiClient: ProjectAssignmentApiClient;
  private wbsAssignmentApiClient: WbsAssignmentApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.evaluationLineApiClient = new EvaluationLineApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
    this.wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
  }

  /**
   * 단일 직원의 1차 평가자 구성
   */
  async 일차_평가자를_구성한다(config: {
    employeeId: string;
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    return await this.evaluationLineApiClient.configurePrimaryEvaluator(config);
  }

  /**
   * 단일 직원의 2차 평가자 구성
   */
  async 이차_평가자를_구성한다(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    return await this.evaluationLineApiClient.configureSecondaryEvaluator(
      config,
    );
  }

  /**
   * 여러 직원의 1차 평가자 배치 구성
   */
  async 여러_직원의_일차_평가자를_배치_구성한다(config: {
    periodId: string;
    assignments: Array<{
      employeeId: string;
      evaluatorId: string;
    }>;
  }): Promise<any> {
    return await this.evaluationLineApiClient.batchConfigurePrimaryEvaluator(
      config,
    );
  }

  /**
   * 여러 직원의 2차 평가자 배치 구성
   */
  async 여러_직원의_이차_평가자를_배치_구성한다(config: {
    periodId: string;
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      evaluatorId: string;
    }>;
  }): Promise<any> {
    return await this.evaluationLineApiClient.batchConfigureSecondaryEvaluator(
      config,
    );
  }

  /**
   * 직원 평가설정 통합 조회
   */
  async 직원_평가설정을_조회한다(config: {
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    return await this.evaluationLineApiClient.getEmployeeEvaluationSettings(
      config,
    );
  }

  /**
   * 평가기간별 평가자 목록 조회
   */
  async 평가기간별_평가자_목록을_조회한다(config: {
    periodId: string;
    type?: 'primary' | 'secondary' | 'all';
  }): Promise<any> {
    return await this.evaluationLineApiClient.getEvaluatorsByPeriod(config);
  }

  /**
   * 평가자별 피평가자 조회
   */
  async 평가자별_피평가자를_조회한다(config: {
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    return await this.evaluationLineApiClient.getEvaluatorEmployees(config);
  }

  /**
   * 직원 평가기간 현황 조회
   */
  async 직원_평가기간_현황을_조회한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus(
      config,
    );
  }

  /**
   * 평가자별 피평가자 현황 조회
   */
  async 평가자별_피평가자_현황을_조회한다(config: {
    periodId: string;
    evaluatorId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEvaluatorTargetsStatus(config);
  }

  /**
   * 모든 직원 평가기간 현황 조회
   */
  async 모든_직원_평가기간_현황을_조회한다(
    periodId: string,
  ): Promise<any> {
    const result = await this.dashboardApiClient.getEmployeesStatus(
      periodId,
      false,
    );
    // getEmployeesStatus는 배열을 반환
    return Array.isArray(result) ? result : [];
  }
}

