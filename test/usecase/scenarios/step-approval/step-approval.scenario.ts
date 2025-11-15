import { BaseE2ETest } from '../../../base-e2e.spec';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';
import { DownwardEvaluationApiClient } from '../api-clients/downward-evaluation.api-client';
import { EvaluationLineApiClient } from '../api-clients/evaluation-line.api-client';
import { RevisionRequestApiClient } from '../api-clients/revision-request.api-client';
import { StepApprovalApiClient } from '../api-clients/step-approval.api-client';
import { WbsEvaluationCriteriaApiClient } from '../api-clients/wbs-evaluation-criteria.api-client';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';

/**
 * 단계 승인 관리 시나리오
 *
 * 단계 승인 관련 모든 시나리오를 제공합니다.
 */
export class StepApprovalScenario {
  private stepApprovalApiClient: StepApprovalApiClient;
  private dashboardApiClient: DashboardApiClient;
  private downwardEvaluationApiClient: DownwardEvaluationApiClient;
  private revisionRequestApiClient: RevisionRequestApiClient;
  private evaluationLineApiClient: EvaluationLineApiClient;
  private wbsEvaluationCriteriaApiClient: WbsEvaluationCriteriaApiClient;
  private wbsAssignmentScenario: WbsAssignmentScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.stepApprovalApiClient = new StepApprovalApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.downwardEvaluationApiClient = new DownwardEvaluationApiClient(
      testSuite,
    );
    this.revisionRequestApiClient = new RevisionRequestApiClient(testSuite);
    this.evaluationLineApiClient = new EvaluationLineApiClient(testSuite);
    this.wbsEvaluationCriteriaApiClient = new WbsEvaluationCriteriaApiClient(
      testSuite,
    );
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
    // 1. 프로젝트 할당 (중복 시 무시)
    // API 클라이언트를 직접 사용하지 않고 HTTP 요청을 직접 수행하여 409 에러를 처리
    const projectAssignmentResponse = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments')
      .send({
        employeeId: config.employeeId,
        projectId: config.projectId,
        periodId: config.evaluationPeriodId,
      });

    // 409 Conflict 에러는 이미 할당되어 있는 경우이므로 무시
    if (projectAssignmentResponse.status === 409) {
      // 이미 할당되어 있으므로 무시
    } else if (projectAssignmentResponse.status !== 201) {
      // 다른 에러는 throw
      throw new Error(
        `프로젝트 할당 생성 실패: ${projectAssignmentResponse.status} - ${JSON.stringify(projectAssignmentResponse.body)}`,
      );
    }

    // 2. WBS 할당 (중복 시 무시)
    try {
      await this.wbsAssignmentScenario.WBS를_할당한다({
        periodId: config.evaluationPeriodId,
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        projectId: config.projectId,
      });
    } catch (error: any) {
      // 409 Conflict 에러는 이미 할당되어 있는 경우이므로 무시
      if (error?.response?.status !== 409) {
        throw error;
      }
    }

    // 3. 1차 평가자 매핑 수동 구성 (직원의 managerId가 없으면 자동 구성되지 않음)
    // WBS 할당 시 평가라인 자동 구성에서 직원의 managerId가 없으면 1차 평가자 매핑이 생성되지 않음
    // 따라서 평가라인 구성 API를 직접 호출하여 1차 평가자 매핑을 생성
    if (config.primaryEvaluatorId) {
      await this.evaluationLineApiClient.configurePrimaryEvaluator({
        employeeId: config.employeeId,
        periodId: config.evaluationPeriodId,
        evaluatorId: config.primaryEvaluatorId,
      });
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

  /**
   * 평가기준을 제출한다
   */
  async 평가기준을_제출한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.wbsEvaluationCriteriaApiClient.submitEvaluationCriteria(
      config,
    );
  }

  /**
   * 평가기준 제출을 초기화한다
   */
  async 평가기준_제출을_초기화한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.wbsEvaluationCriteriaApiClient.resetEvaluationCriteriaSubmission(
      config,
    );
  }

  /**
   * 평가기준 제출 상태를 대시보드에서 조회한다
   */
  async 평가기준_제출상태를_대시보드에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 평가기준 제출 상태를 할당 데이터에서 조회한다
   */
  async 평가기준_제출상태를_할당데이터에서_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 직원 목록 상태를 조회한다
   */
  async 직원_목록_상태를_조회한다(config: { evaluationPeriodId: string }) {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${config.evaluationPeriodId}/employees/status`)
      .expect(200);

    return response.body;
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
    return await this.dashboardApiClient.getEmployeeCompleteStatus({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  // ==================== 재작성 요청 완료 ====================

  /**
   * 재작성 완료 응답을 제출한다
   */
  async 재작성완료_응답을_제출한다(config: {
    requestId: string;
    responseComment: string;
  }) {
    await this.revisionRequestApiClient.completeRevisionRequest({
      requestId: config.requestId,
      responseComment: config.responseComment,
    });
  }

  /**
   * 재작성 완료 응답을 제출한다 (관리자용 - 평가기간, 직원, 평가자 기반)
   */
  async 재작성완료_응답을_제출한다_관리자용(config: {
    evaluationPeriodId: string;
    employeeId: string;
    evaluatorId: string;
    step: 'criteria' | 'self' | 'primary' | 'secondary';
    responseComment: string;
  }) {
    await this.revisionRequestApiClient.completeRevisionRequestByEvaluator({
      evaluationPeriodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
      evaluatorId: config.evaluatorId,
      step: config.step,
      responseComment: config.responseComment,
    });
  }

  /**
   * 재작성 요청 목록을 조회한다 (관리자용)
   */
  async 재작성요청_목록을_조회한다(config?: {
    evaluationPeriodId?: string;
    employeeId?: string;
    step?: 'criteria' | 'self' | 'primary' | 'secondary';
    isCompleted?: boolean;
  }) {
    return await this.revisionRequestApiClient.getRevisionRequests({
      evaluationPeriodId: config?.evaluationPeriodId,
      employeeId: config?.employeeId,
      step: config?.step,
      isCompleted: config?.isCompleted,
    });
  }

  /**
   * 내 재작성 요청 목록을 조회한다 (담당자용)
   */
  async 내_재작성요청_목록을_조회한다(config?: {
    evaluationPeriodId?: string;
    step?: 'criteria' | 'self' | 'primary' | 'secondary';
    isRead?: boolean;
    isCompleted?: boolean;
  }) {
    return await this.revisionRequestApiClient.getMyRevisionRequests({
      evaluationPeriodId: config?.evaluationPeriodId,
      step: config?.step,
      isRead: config?.isRead,
      isCompleted: config?.isCompleted,
    });
  }

  // ==================== 대시보드 상태 조회 ====================

  /**
   * 직원 평가기간 현황을 조회한다 (대시보드 상태 검증용)
   */
  async 직원_평가기간_현황을_조회한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
  }) {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });
  }

  /**
   * 2차 평가자 매핑을 구성한다
   */
  async 이차평가자_매핑을_구성한다(config: {
    employeeId: string;
    evaluationPeriodId: string;
    evaluatorId: string;
    wbsItemId?: string;
  }) {
    if (config.wbsItemId) {
      // WBS별 2차 평가자 구성
      return await this.evaluationLineApiClient.configureSecondaryEvaluator({
        employeeId: config.employeeId,
        wbsItemId: config.wbsItemId,
        periodId: config.evaluationPeriodId,
        evaluatorId: config.evaluatorId,
      });
    } else {
      // 직원별 2차 평가자 구성 (직원 레벨)
      // API 클라이언트에 직원별 2차 평가자 구성 메서드가 없으므로 직접 호출
      const response = await this.testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${config.employeeId}/period/${config.evaluationPeriodId}/secondary-evaluator`,
        )
        .send({
          evaluatorId: config.evaluatorId,
        })
        .expect(201);

      return response.body;
    }
  }
}
