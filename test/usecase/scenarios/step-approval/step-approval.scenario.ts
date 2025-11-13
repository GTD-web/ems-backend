import { BaseE2ETest } from '../../../base-e2e.spec';
import { StepApprovalApiClient } from '../api-clients/step-approval.api-client';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';
import { WbsSelfEvaluationApiClient } from '../api-clients/wbs-self-evaluation.api-client';
import { DownwardEvaluationApiClient } from '../api-clients/downward-evaluation.api-client';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';

/**
 * 단계 승인 관리 시나리오
 *
 * 단계 승인 관련 모든 시나리오를 제공합니다.
 */
export class StepApprovalScenario {
  private stepApprovalApiClient: StepApprovalApiClient;
  private dashboardApiClient: DashboardApiClient;
  private wbsSelfEvaluationApiClient: WbsSelfEvaluationApiClient;
  private downwardEvaluationApiClient: DownwardEvaluationApiClient;
  private evaluationPeriodScenario: EvaluationPeriodScenario;
  private projectAssignmentScenario: ProjectAssignmentScenario;
  private wbsAssignmentScenario: WbsAssignmentScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.stepApprovalApiClient = new StepApprovalApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.wbsSelfEvaluationApiClient = new WbsSelfEvaluationApiClient(testSuite);
    this.downwardEvaluationApiClient = new DownwardEvaluationApiClient(
      testSuite,
    );
    this.evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    this.projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    this.wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
  }

  // ==================== 초기 구성 데이터 생성 ====================

  /**
   * 단계 승인 테스트를 위한 초기 구성 데이터를 생성한다
   *
   * 선행 조건 설정 순서:
   * 1. 프로젝트 할당
   * 2. WBS 할당
   * 3. 1차 평가자 매핑 구성 (선택사항)
   *
   * 주의: 평가기간 생성 및 시작, 평가 대상자 등록은 beforeEach에서 수행되어야 함
   */
  async 초기_구성_데이터를_생성한다(config: {
    evaluationPeriodId: string; // 평가기간 ID (필수)
    employeeId: string;
    projectId: string;
    wbsItemId: string;
    primaryEvaluatorId?: string; // 1차 평가자 ID (선택사항, 없으면 자동 구성)
  }): Promise<{
    evaluationPeriodId: string;
    employeeId: string;
    projectId: string;
    wbsItemId: string;
  }> {
    // 1. 프로젝트 할당
    await this.projectAssignmentScenario.프로젝트를_할당한다({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      projectId: config.projectId,
    });

    // 2. WBS 할당
    await this.wbsAssignmentScenario.WBS를_할당한다({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      wbsItemId: config.wbsItemId,
      projectId: config.projectId,
    });

    // 3. 1차 평가자 매핑 수동 구성 (직원의 managerId가 없으면 자동 구성되지 않음)
    // WBS 할당 시 평가라인 자동 구성에서 직원의 managerId가 없으면 1차 평가자 매핑이 생성되지 않음
    // 따라서 평가라인 구성 API를 직접 호출하여 1차 평가자 매핑을 생성
    if (config.primaryEvaluatorId) {
      await this.testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/period/${config.evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: config.primaryEvaluatorId,
        })
        .expect(201);
    }

    return {
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      projectId: config.projectId,
      wbsItemId: config.wbsItemId,
    };
  }

  // ==================== 단계 승인 Enum 조회 ====================

  /**
   * 단계 승인 Enum 목록을 조회한다
   */
  async 단계승인_Enum목록을_조회한다() {
    return await this.stepApprovalApiClient.getStepApprovalEnums();
  }

  // ==================== 평가기준 설정 단계 승인 ====================

  /**
   * 평가기준 설정 단계 승인 상태를 변경한다
   */
  async 평가기준설정_단계승인_상태를_변경한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
  }) {
    return await this.stepApprovalApiClient.updateCriteriaStepApproval(config);
  }

  // ==================== 자기평가 단계 승인 ====================

  /**
   * 자기평가 단계 승인 상태를 변경한다
   */
  async 자기평가_단계승인_상태를_변경한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
    approveSubsequentSteps?: boolean;
  }) {
    return await this.stepApprovalApiClient.updateSelfStepApproval(config);
  }

  /**
   * 자기평가 제출 상태를 조회한다 (자기평가 목록 API)
   */
  async 자기평가_제출상태를_조회한다(config: {
    employeeId: string;
    periodId?: string;
    page?: number;
    limit?: number;
  }) {
    const query: any = {};
    if (config.periodId) query.periodId = config.periodId;
    if (config.page) query.page = config.page;
    if (config.limit) query.limit = config.limit;

    const response = await this.testSuite
      .request()
      .get(
        `/admin/performance-evaluation/wbs-self-evaluations/employee/${config.employeeId}`,
      )
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 자기평가 제출 상태를 대시보드 API로 조회한다
   */
  async 자기평가_제출상태를_대시보드에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 자기평가 제출 상태를 할당 데이터 API로 조회한다
   */
  async 자기평가_제출상태를_할당데이터에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  // ==================== 1차 하향평가 단계 승인 ====================

  /**
   * 1차 하향평가 단계 승인 상태를 변경한다
   */
  async 일차하향평가_단계승인_상태를_변경한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
    approveSubsequentSteps?: boolean;
  }) {
    return await this.stepApprovalApiClient.updatePrimaryStepApproval(config);
  }

  /**
   * 1차 하향평가 제출 상태를 조회한다 (하향평가 목록 API)
   */
  async 일차하향평가_제출상태를_조회한다(config: {
    evaluatorId: string;
    periodId?: string;
    evaluateeId?: string;
    page?: number;
    limit?: number;
  }) {
    return await this.downwardEvaluationApiClient.getByEvaluator({
      evaluatorId: config.evaluatorId,
      periodId: config.periodId,
      evaluateeId: config.evaluateeId,
      evaluationType: 'primary',
      page: config.page,
      limit: config.limit,
    });
  }

  /**
   * 1차 하향평가 제출 상태를 대시보드 API로 조회한다
   */
  async 일차하향평가_제출상태를_대시보드에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 1차 하향평가 제출 상태를 할당 데이터 API로 조회한다
   */
  async 일차하향평가_제출상태를_할당데이터에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 1차 하향평가 제출 상태를 통합 조회 API로 조회한다
   */
  async 일차하향평가_제출상태를_통합조회에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.evaluationPeriodId}/employees/${config.employeeId}/complete-status`,
      )
      .expect(200);

    return response.body;
  }

  // ==================== 2차 하향평가 단계 승인 ====================

  /**
   * 2차 하향평가 단계 승인 상태를 변경한다 (평가자별)
   */
  async 이차하향평가_단계승인_상태를_변경한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    status: 'pending' | 'approved' | 'revision_requested';
    revisionComment?: string;
    approveSubsequentSteps?: boolean;
  }) {
    return await this.stepApprovalApiClient.updateSecondaryStepApproval(config);
  }

  /**
   * 2차 하향평가 제출 상태를 조회한다 (하향평가 목록 API)
   */
  async 이차하향평가_제출상태를_조회한다(config: {
    evaluatorId: string;
    periodId?: string;
    evaluateeId?: string;
    page?: number;
    limit?: number;
  }) {
    return await this.downwardEvaluationApiClient.getByEvaluator({
      evaluatorId: config.evaluatorId,
      periodId: config.periodId,
      evaluateeId: config.evaluateeId,
      evaluationType: 'secondary',
      page: config.page,
      limit: config.limit,
    });
  }

  /**
   * 2차 하향평가 제출 상태를 대시보드 API로 조회한다
   */
  async 이차하향평가_제출상태를_대시보드에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 2차 하향평가 제출 상태를 할당 데이터 API로 조회한다
   */
  async 이차하향평가_제출상태를_할당데이터에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 2차 하향평가 제출 상태를 통합 조회 API로 조회한다
   */
  async 이차하향평가_제출상태를_통합조회에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    const response = await this.testSuite
      .request()
      .get(
        `/admin/dashboard/${config.evaluationPeriodId}/employees/${config.employeeId}/complete-status`,
      )
      .expect(200);

    return response.body;
  }
}
