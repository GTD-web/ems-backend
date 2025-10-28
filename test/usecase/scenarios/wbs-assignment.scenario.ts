import { BaseE2ETest } from '../../base-e2e.spec';
import { WbsAssignmentIntegrationScenario } from './wbs-assignment/wbs-assignment-integration.scenario';

/**
 * WBS 할당 관련 시나리오 클래스 (레거시 호환)
 * 
 * @deprecated 새로운 폴더 구조의 시나리오를 사용하세요.
 * - WbsAssignmentBasicScenario: 기본 할당/취소/순서변경/초기화
 * - WbsAssignmentCriteriaScenario: 평가기준 자동생성 및 수정
 * - WbsAssignmentEvaluationLineScenario: 평가라인 자동구성 및 1차 평가자 지정
 * - WbsAssignmentIntegrationScenario: 통합 시나리오
 */
export class WbsAssignmentScenario {
  private integrationScenario: WbsAssignmentIntegrationScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.integrationScenario = new WbsAssignmentIntegrationScenario(testSuite);
  }

  /**
   * WBS 할당 후 대시보드 검증 시나리오를 실행합니다.
   */
  async WBS_할당_후_대시보드_검증_시나리오를_실행한다(
    periodId: string,
    employeeIds: string[],
    wbsItemIds: string[],
    projectId: string,
  ): Promise<{
    assignments: any[];
    verifiedDashboardEndpoints: number;
  }> {
    return this.integrationScenario.WBS_할당_후_대시보드_검증_시나리오를_실행한다(
      periodId,
      employeeIds,
      wbsItemIds,
      projectId,
    );
  }

  /**
   * WBS 할당 취소 시나리오를 실행합니다.
   */
  async WBS_할당_취소_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<{
    cancelledAssignments: number;
    verifiedDashboardEndpoints: number;
  }> {
    return this.integrationScenario.WBS_할당_취소_시나리오를_실행한다(
      periodId,
      employeeId,
      projectId,
    );
  }

  /**
   * WBS 할당 순서 변경 시나리오를 실행합니다.
   */
  async WBS_할당_순서_변경_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<{
    orderChanges: number;
    verifiedDashboardEndpoints: number;
  }> {
    return this.integrationScenario.WBS_할당_순서_변경_시나리오를_실행한다(
      periodId,
      employeeId,
      projectId,
    );
  }

  /**
   * WBS 할당 초기화 시나리오를 실행합니다.
   */
  async WBS_할당_초기화_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    projectId: string,
  ): Promise<{
    resetType: string;
    verifiedDashboardEndpoints: number;
  }> {
    return this.integrationScenario.WBS_할당_초기화_시나리오를_실행한다(
      periodId,
      employeeId,
      projectId,
    );
  }
}
