import { BaseE2ETest } from '../../../base-e2e.spec';
import { ProjectAssignmentApiClient } from '../api-clients/project-assignment.api-client';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';

/**
 * 프로젝트 할당 시나리오
 *
 * 프로젝트 할당과 관련된 비즈니스 시나리오를 제공합니다.
 * HTTP 엔드포인트를 통해서만 데이터를 조작하고 조회합니다.
 */
export class ProjectAssignmentScenario {
  private apiClient: ProjectAssignmentApiClient;
  private dashboardApiClient: DashboardApiClient;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.apiClient = new ProjectAssignmentApiClient(testSuite);
    this.dashboardApiClient = new DashboardApiClient(testSuite);
  }

  // ==================== 프로젝트 할당 생성 ====================

  /**
   * 프로젝트를 할당한다
   */
  async 프로젝트를_할당한다(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<any> {
    return await this.apiClient.create(config);
  }

  /**
   * 프로젝트를 할당하고 대시보드에서 검증한다
   */
  async 프로젝트를_할당하고_대시보드에서_검증한다(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    할당결과: any;
    대시보드상태: any;
    evaluationCriteria: {
      status: string;
      assignedProjectCount: number;
    };
    할당데이터: any;
    프로젝트목록: any[];
    총프로젝트수: number;
  }> {
    // 1. 프로젝트 할당
    const 할당결과 = await this.프로젝트를_할당한다(config);

    // 2. 대시보드에서 상태 조회
    const 대시보드상태 = await this.대시보드_직원_현황을_조회한다(config.periodId);
    const 직원상태 = 대시보드상태.find((emp: any) => emp.employeeId === config.employeeId);

    // 3. 직원 할당 데이터 조회
    const 할당데이터 = await this.직원_할당_데이터를_조회한다({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 4. evaluationCriteria 정보 추출
    const evaluationCriteria = {
      status: 직원상태?.criteriaSetup?.evaluationCriteria?.status || 'unknown',
      assignedProjectCount: 직원상태?.criteriaSetup?.evaluationCriteria?.assignedProjectCount || 0,
    };

    // 5. 할당 데이터에서 프로젝트 정보 추출
    const 프로젝트목록 = 할당데이터.projects || [];
    const 총프로젝트수 = 할당데이터.summary?.totalProjects || 0;

    return {
      할당결과,
      대시보드상태: 직원상태,
      evaluationCriteria,
      할당데이터,
      프로젝트목록,
      총프로젝트수,
    };
  }

  /**
   * 프로젝트를 대량으로 할당한다
   */
  async 프로젝트를_대량으로_할당한다(assignments: Array<{
    employeeId: string;
    projectId: string;
    periodId: string;
  }>): Promise<any[]> {
    return await this.apiClient.bulkCreate({ assignments });
  }

  // ==================== 프로젝트 할당 조회 ====================

  /**
   * 프로젝트 할당 목록을 조회한다
   */
  async 프로젝트_할당_목록을_조회한다(filter: {
    periodId?: string;
    employeeId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<any> {
    return await this.apiClient.getList(filter);
  }

  /**
   * 직원별 할당 프로젝트를 조회한다
   */
  async 직원별_할당_프로젝트를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    return await this.apiClient.getEmployeeProjects({ employeeId, periodId });
  }

  /**
   * 프로젝트별 할당 직원을 조회한다
   */
  async 프로젝트별_할당_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<any> {
    return await this.apiClient.getProjectEmployees({ projectId, periodId });
  }

  /**
   * 미할당 직원 목록을 조회한다
   */
  async 미할당_직원_목록을_조회한다(config: {
    periodId: string;
    projectId?: string;
  }): Promise<any> {
    return await this.apiClient.getUnassignedEmployees(config);
  }

  /**
   * 할당 가능한 프로젝트 목록을 조회한다
   */
  async 할당_가능한_프로젝트_목록을_조회한다(config: {
    periodId: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<any> {
    return await this.apiClient.getAvailableProjects(config);
  }

  /**
   * 프로젝트 할당 상세를 조회한다
   */
  async 프로젝트_할당_상세를_조회한다(assignmentId: string): Promise<any> {
    return await this.apiClient.getDetail(assignmentId);
  }

  // ==================== 프로젝트 할당 수정 ====================

  /**
   * 프로젝트 할당 순서를 변경한다 (Deprecated)
   * @deprecated 프로젝트 ID 기반 메서드를 사용하세요. 프로젝트_할당_순서를_프로젝트_ID로_변경한다
   */
  async 프로젝트_할당_순서를_변경한다(
    assignmentId: string,
    direction: 'up' | 'down',
  ): Promise<any> {
    return await this.apiClient.changeOrder({ assignmentId, direction });
  }

  /**
   * 프로젝트 할당 순서를 프로젝트 ID로 변경한다
   */
  async 프로젝트_할당_순서를_프로젝트_ID로_변경한다(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
    direction: 'up' | 'down';
  }): Promise<any> {
    return await this.apiClient.changeOrderByProject(config);
  }

  /**
   * 프로젝트 할당 순서를 변경하고 대시보드에서 검증한다 (Deprecated)
   * @deprecated 프로젝트 ID 기반 메서드를 사용하세요. 프로젝트_할당_순서를_프로젝트_ID로_변경하고_대시보드에서_검증한다
   */
  async 프로젝트_할당_순서를_변경하고_대시보드에서_검증한다(config: {
    assignmentId: string;
    direction: 'up' | 'down';
    evaluationPeriodId: string;
    employeeId: string;
  }): Promise<{
    순서변경결과: any;
    할당데이터: any;
    프로젝트순서: any[];
    총프로젝트수: number;
  }> {
    // 1. 순서 변경 전 할당 데이터 조회
    const 변경전할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });

    // 2. 프로젝트 할당 순서 변경
    const 순서변경결과 = await this.프로젝트_할당_순서를_변경한다(
      config.assignmentId,
      config.direction,
    );

    // 3. 순서 변경 후 할당 데이터 조회
    const 변경후할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.evaluationPeriodId,
      employeeId: config.employeeId,
    });

    return {
      순서변경결과,
      할당데이터: 변경후할당데이터,
      프로젝트순서: 변경후할당데이터.projects || [],
      총프로젝트수: 변경후할당데이터.summary?.totalProjects || 0,
    };
  }

  /**
   * 프로젝트 할당 순서를 프로젝트 ID로 변경하고 대시보드에서 검증한다
   */
  async 프로젝트_할당_순서를_프로젝트_ID로_변경하고_대시보드에서_검증한다(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
    direction: 'up' | 'down';
  }): Promise<{
    순서변경결과: any;
    할당데이터: any;
    프로젝트순서: any[];
    총프로젝트수: number;
  }> {
    // 1. 순서 변경 전 할당 데이터 조회
    const 변경전할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    // 2. 프로젝트 할당 순서 변경 (프로젝트 ID 기반)
    const 순서변경결과 = await this.프로젝트_할당_순서를_프로젝트_ID로_변경한다({
      employeeId: config.employeeId,
      projectId: config.projectId,
      periodId: config.periodId,
      direction: config.direction,
    });

    // 3. 순서 변경 후 할당 데이터 조회
    const 변경후할당데이터 = await this.dashboardApiClient.getEmployeeAssignedData({
      periodId: config.periodId,
      employeeId: config.employeeId,
    });

    return {
      순서변경결과,
      할당데이터: 변경후할당데이터,
      프로젝트순서: 변경후할당데이터.projects || [],
      총프로젝트수: 변경후할당데이터.summary?.totalProjects || 0,
    };
  }

  // ==================== 프로젝트 할당 삭제 ====================

  /**
   * 프로젝트 할당을 취소한다 (Deprecated)
   * @deprecated 프로젝트 ID 기반 메서드를 사용하세요. 프로젝트_할당을_프로젝트_ID로_취소한다
   */
  async 프로젝트_할당을_취소한다(assignmentId: string): Promise<void> {
    return await this.apiClient.cancel(assignmentId);
  }

  /**
   * 프로젝트 할당을 프로젝트 ID로 취소한다
   */
  async 프로젝트_할당을_프로젝트_ID로_취소한다(config: {
    employeeId: string;
    projectId: string;
    periodId: string;
  }): Promise<void> {
    return await this.apiClient.cancelByProject(config);
  }

  // ==================== 대시보드 검증 ====================

  /**
   * 대시보드에서 직원 현황을 조회한다
   */
  async 대시보드_직원_현황을_조회한다(
    evaluationPeriodId: string,
    includeUnregistered: boolean = false,
  ): Promise<any> {
    return await this.dashboardApiClient.getEmployeesStatus(evaluationPeriodId, includeUnregistered);
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


  // ==================== 복합 시나리오 ====================

  /**
   * 프로젝트 할당 전체 시나리오를 실행한다
   */
  async 프로젝트_할당_전체_시나리오를_실행한다(config: {
    employeeIds: string[];
    projectIds: string[];
    periodId: string;
  }): Promise<{
    단일할당검증결과: any;
    대량할당결과: any[];
    할당목록조회결과: any;
    직원별조회결과: any;
    프로젝트별조회결과: any;
    미할당직원조회결과: any;
    할당가능프로젝트조회결과: any;
  }> {
    const { employeeIds, projectIds, periodId } = config;

    // 1. 단일 할당 + 대시보드 검증
    const 단일할당검증결과 = await this.프로젝트를_할당하고_대시보드에서_검증한다({
      employeeId: employeeIds[0],
      projectId: projectIds[0],
      periodId,
    });

    // 2. 대량 할당
    const 대량할당데이터 = employeeIds.slice(1).map((employeeId, index) => ({
      employeeId,
      projectId: projectIds[index % projectIds.length],
      periodId,
    }));
    const 대량할당결과 = await this.프로젝트를_대량으로_할당한다(대량할당데이터);

    // 3. 할당 목록 조회
    const 할당목록조회결과 = await this.프로젝트_할당_목록을_조회한다({
      periodId,
      page: 1,
      limit: 10,
    });

    // 4. 직원별 할당 프로젝트 조회
    const 직원별조회결과 = await this.직원별_할당_프로젝트를_조회한다(
      employeeIds[0],
      periodId,
    );

    // 5. 프로젝트별 할당 직원 조회
    const 프로젝트별조회결과 = await this.프로젝트별_할당_직원을_조회한다(
      projectIds[0],
      periodId,
    );

    // 6. 미할당 직원 조회
    const 미할당직원조회결과 = await this.미할당_직원_목록을_조회한다({
      periodId,
      projectId: projectIds[0],
    });

    // 7. 할당 가능한 프로젝트 조회
    const 할당가능프로젝트조회결과 = await this.할당_가능한_프로젝트_목록을_조회한다({
      periodId,
      page: 1,
      limit: 10,
    });

    return {
      단일할당검증결과,
      대량할당결과,
      할당목록조회결과,
      직원별조회결과,
      프로젝트별조회결과,
      미할당직원조회결과,
      할당가능프로젝트조회결과,
    };
  }


}
