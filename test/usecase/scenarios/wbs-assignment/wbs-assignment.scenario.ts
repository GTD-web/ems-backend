import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentApiClient } from '../api-clients/wbs-assignment.api-client';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';

/**
 * WBS 할당 시나리오
 *
 * WBS 할당과 관련된 비즈니스 시나리오를 제공합니다.
 * HTTP 엔드포인트를 통해서만 데이터를 조작하고 조회합니다.
 */
export class WbsAssignmentScenario {
  private apiClient: WbsAssignmentApiClient;
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new WbsAssignmentApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  // ==================== WBS 할당 생성 ====================

  /**
   * WBS를 할당한다
   */
  async WBS를_할당한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<any> {
    return await this.apiClient.create(config);
  }

  /**
   * WBS를 할당하고 대시보드에서 검증한다
   */
  async WBS를_할당하고_대시보드에서_검증한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    할당결과: any;
    대시보드상태: any;
    evaluationCriteria: {
      status: string;
      assignedProjectCount: number;
      assignedWbsCount: number;
    };
    할당데이터: any;
    WBS목록: any[];
    총WBS수: number;
  }> {
    // 1. WBS 할당
    const 할당결과 = await this.WBS를_할당한다(config);

    // 2. 대시보드에서 상태 조회
    const 대시보드상태 = await this.대시보드_직원_현황을_조회한다(
      config.periodId,
    );
    const 직원상태 = 대시보드상태.find(
      (emp: any) => emp.employeeId === config.employeeId,
    );

    // 3. 직원 할당 데이터 조회
    const 할당데이터 = await this.직원_할당_데이터를_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 4. evaluationCriteria 정보 추출
    const evaluationCriteria = {
      status: 직원상태?.evaluationCriteria?.status || 'unknown',
      assignedProjectCount:
        직원상태?.evaluationCriteria?.assignedProjectCount || 0,
      assignedWbsCount: 직원상태?.evaluationCriteria?.assignedWbsCount || 0,
    };

    // 5. 할당 데이터에서 WBS 정보 추출
    const 프로젝트 = 할당데이터.projects?.find(
      (p: any) => p.projectId === config.projectId,
    );
    const WBS목록 = 프로젝트?.wbsList || [];
    const 총WBS수 = 할당데이터.summary?.totalWbsCount || 0;

    return {
      할당결과,
      대시보드상태: 직원상태,
      evaluationCriteria,
      할당데이터,
      WBS목록,
      총WBS수,
    };
  }

  /**
   * WBS를 대량으로 할당한다
   */
  async WBS를_대량으로_할당한다(
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
    }>,
  ): Promise<any[]> {
    return await this.apiClient.bulkCreate({ assignments });
  }

  /**
   * WBS를 생성하고 할당한다
   */
  async WBS를_생성하고_할당한다(config: {
    title: string;
    projectId: string;
    employeeId: string;
    periodId: string;
  }): Promise<any> {
    return await this.apiClient.createAndAssign(config);
  }

  // ==================== WBS 할당 조회 ====================

  /**
   * WBS 할당 목록을 조회한다
   */
  async WBS_할당_목록을_조회한다(filter: {
    periodId?: string;
    employeeId?: string;
    wbsItemId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<any> {
    return await this.apiClient.getList(filter);
  }

  /**
   * 직원별 할당 WBS를 조회한다
   */
  async 직원별_할당_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    return await this.apiClient.getEmployeeWbsAssignments({
      employeeId,
      periodId,
    });
  }

  /**
   * 프로젝트별 할당 WBS를 조회한다
   */
  async 프로젝트별_할당_WBS를_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<any> {
    return await this.apiClient.getProjectWbsAssignments({
      projectId,
      periodId,
    });
  }

  /**
   * WBS 항목별 할당된 직원을 조회한다
   */
  async WBS_항목별_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<any> {
    return await this.apiClient.getWbsItemAssignments({
      wbsItemId,
      periodId,
    });
  }

  /**
   * 미할당 WBS 항목 목록을 조회한다
   */
  async 미할당_WBS_항목_목록을_조회한다(config: {
    projectId: string;
    periodId: string;
    employeeId?: string;
  }): Promise<any> {
    return await this.apiClient.getUnassignedWbsItems(config);
  }

  /**
   * WBS 할당 상세를 조회한다
   */
  async WBS_할당_상세를_조회한다(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<any> {
    return await this.apiClient.getDetail(config);
  }

  // ==================== WBS 할당 수정 ====================

  /**
   * WBS 할당 순서를 변경한다 (WBS ID 기반)
   */
  async WBS_할당_순서를_WBS_ID로_변경한다(config: {
    wbsItemId: string;
    employeeId: string;
    projectId: string;
    periodId: string;
    direction: 'up' | 'down';
  }): Promise<any> {
    return await this.apiClient.changeOrderByWbs(config);
  }

  /**
   * WBS 할당 순서를 WBS ID로 변경하고 대시보드에서 검증한다
   */
  async WBS_할당_순서를_WBS_ID로_변경하고_대시보드에서_검증한다(config: {
    wbsItemId: string;
    employeeId: string;
    projectId: string;
    periodId: string;
    direction: 'up' | 'down';
  }): Promise<{
    순서변경결과: any;
    할당데이터: any;
    WBS순서: any[];
    총WBS수: number;
  }> {
    // 1. 순서 변경 전 할당 데이터 조회
    const 변경전할당데이터 =
      await this.dashboardApiClient.getEmployeeAssignedData({
        periodId: config.periodId,
        employeeId: config.employeeId,
      });

    // 2. WBS 할당 순서 변경 (WBS ID 기반)
    const 순서변경결과 = await this.WBS_할당_순서를_WBS_ID로_변경한다({
      wbsItemId: config.wbsItemId,
      employeeId: config.employeeId,
      projectId: config.projectId,
      periodId: config.periodId,
      direction: config.direction,
    });

    // 3. 순서 변경 후 할당 데이터 조회
    const 변경후할당데이터 =
      await this.dashboardApiClient.getEmployeeAssignedData({
        periodId: config.periodId,
        employeeId: config.employeeId,
      });

    // 4. 프로젝트의 WBS 목록 추출
    const 프로젝트 = 변경후할당데이터.projects?.find(
      (p: any) => p.projectId === config.projectId,
    );
    const WBS순서 = 프로젝트?.wbsList || [];
    const 총WBS수 = 변경후할당데이터.summary?.totalWbs || 0;

    return {
      순서변경결과,
      할당데이터: 변경후할당데이터,
      WBS순서,
      총WBS수,
    };
  }

  /**
   * WBS 항목 이름을 수정한다
   */
  async WBS_항목_이름을_수정한다(config: {
    wbsItemId: string;
    title: string;
  }): Promise<any> {
    return await this.apiClient.updateWbsItemTitle(config);
  }

  // ==================== WBS 할당 삭제 ====================

  /**
   * WBS 할당을 WBS ID로 취소한다
   */
  async WBS_할당을_WBS_ID로_취소한다(config: {
    wbsItemId: string;
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<void> {
    return await this.apiClient.cancelByWbs(config);
  }

  /**
   * 평가기간의 WBS 할당을 초기화한다
   */
  async 평가기간의_WBS_할당을_초기화한다(periodId: string): Promise<void> {
    return await this.apiClient.resetPeriodWbsAssignments(periodId);
  }

  /**
   * 프로젝트의 WBS 할당을 초기화한다
   */
  async 프로젝트의_WBS_할당을_초기화한다(config: {
    projectId: string;
    periodId: string;
  }): Promise<void> {
    return await this.apiClient.resetProjectWbsAssignments(config);
  }

  /**
   * 직원의 WBS 할당을 초기화한다
   */
  async 직원의_WBS_할당을_초기화한다(config: {
    employeeId: string;
    periodId: string;
  }): Promise<void> {
    return await this.apiClient.resetEmployeeWbsAssignments(config);
  }

  // ==================== 대시보드 검증 ====================

  /**
   * 대시보드에서 직원 현황을 조회한다
   */
  async 대시보드_직원_현황을_조회한다(
    evaluationPeriodId: string,
    includeUnregistered: boolean = false,
  ): Promise<any> {
    return await this.dashboardApiClient.getEmployeesStatus(
      evaluationPeriodId,
      includeUnregistered,
    );
  }

  /**
   * 직원 할당 데이터를 조회한다
   */
  async 직원_할당_데이터를_조회한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEmployeeAssignedData(config);
  }

  /**
   * 개별 직원의 평가기간 현황을 조회한다
   */
  async 직원의_평가기간_현황을_조회한다(config: {
    periodId: string;
    employeeId: string;
  }): Promise<any> {
    return await this.dashboardApiClient.getEmployeeEvaluationPeriodStatus(
      config,
    );
  }

  // ==================== 복합 시나리오 ====================

  /**
   * WBS 할당 전체 시나리오를 실행한다
   */
  async WBS_할당_전체_시나리오를_실행한다(config: {
    employeeIds: string[];
    wbsItemIds: string[];
    projectIds: string[];
    periodId: string;
  }): Promise<{
    단일할당검증결과: any;
    대량할당결과: any[];
    할당목록조회결과: any;
    직원별조회결과: any;
    프로젝트별조회결과: any;
    WBS별조회결과: any;
    미할당WBS조회결과: any;
  }> {
    const { employeeIds, wbsItemIds, projectIds, periodId } = config;

    // 1. 단일 할당 + 대시보드 검증
    const 단일할당검증결과 = await this.WBS를_할당하고_대시보드에서_검증한다({
      employeeId: employeeIds[0],
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
      periodId,
    });

    // 2. 대량 할당
    const 대량할당데이터 = employeeIds.slice(1).map((employeeId, index) => ({
      employeeId,
      wbsItemId: wbsItemIds[index % wbsItemIds.length],
      projectId: projectIds[index % projectIds.length],
      periodId,
    }));
    const 대량할당결과 = await this.WBS를_대량으로_할당한다(대량할당데이터);

    // 3. 할당 목록 조회
    const 할당목록조회결과 = await this.WBS_할당_목록을_조회한다({
      periodId,
      page: 1,
      limit: 10,
    });

    // 4. 직원별 할당 WBS 조회
    const 직원별조회결과 = await this.직원별_할당_WBS를_조회한다(
      employeeIds[0],
      periodId,
    );

    // 5. 프로젝트별 할당 WBS 조회
    const 프로젝트별조회결과 = await this.프로젝트별_할당_WBS를_조회한다(
      projectIds[0],
      periodId,
    );

    // 6. WBS 항목별 할당된 직원 조회
    const WBS별조회결과 = await this.WBS_항목별_할당된_직원을_조회한다(
      wbsItemIds[0],
      periodId,
    );

    // 7. 미할당 WBS 항목 조회
    const 미할당WBS조회결과 = await this.미할당_WBS_항목_목록을_조회한다({
      periodId,
      projectId: projectIds[0],
    });

    return {
      단일할당검증결과,
      대량할당결과,
      할당목록조회결과,
      직원별조회결과,
      프로젝트별조회결과,
      WBS별조회결과,
      미할당WBS조회결과,
    };
  }
}
