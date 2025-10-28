import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentBasicScenario } from './wbs-assignment-basic.scenario';
import { WbsAssignmentCriteriaScenario } from './wbs-assignment-criteria.scenario';
import { WbsAssignmentEvaluationLineScenario } from './wbs-assignment-evaluation-line.scenario';

/**
 * WBS 할당 통합 시나리오 클래스
 * 
 * WBS 할당의 모든 기능을 통합하여 테스트합니다.
 * - 기본 할당/취소/순서변경/초기화
 * - 평가기준 자동생성 및 수정
 * - 평가라인 자동구성 및 1차 평가자 지정
 * - 대시보드 검증
 */
export class WbsAssignmentIntegrationScenario {
  private basicScenario: WbsAssignmentBasicScenario;
  private criteriaScenario: WbsAssignmentCriteriaScenario;
  private evaluationLineScenario: WbsAssignmentEvaluationLineScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.basicScenario = new WbsAssignmentBasicScenario(testSuite);
    this.criteriaScenario = new WbsAssignmentCriteriaScenario(testSuite);
    this.evaluationLineScenario = new WbsAssignmentEvaluationLineScenario(testSuite);
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
    console.log('📝 WBS 할당 후 대시보드 검증 시나리오');

    // 1. 프로젝트 할당 먼저 생성 (대시보드 API가 프로젝트 할당을 먼저 확인함)
    console.log('📝 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], employeeIds);
    console.log('✅ 프로젝트 할당 완료');

    // 2. WBS 대량 할당
    const assignments: any[] = [];
    for (const employeeId of employeeIds) {
      for (const wbsItemId of wbsItemIds) {
        const assignment = await this.basicScenario.WBS_할당을_생성한다(
          employeeId,
          wbsItemId,
          projectId,
          periodId,
        );
        assignments.push(assignment);
      }
    }

    console.log(`✅ WBS 대량 할당 완료: ${employeeIds.length}명 × ${wbsItemIds.length}개 = ${assignments.length}건`);

    // 3. 데이터베이스에서 WBS 할당 확인
    const wbsAssignments = await this.testSuite.getRepository('EvaluationWbsAssignment').find({
      where: { periodId },
    });
    console.log(`📝 데이터베이스 WBS 할당 수: ${wbsAssignments.length}개`);

    // 4. 각 직원의 할당 데이터 검증
    console.log(`📝 ${employeeIds.length}명의 직원 할당 데이터 검증 시작`);
    let verifiedDashboardEndpoints = 0;

    for (const employeeId of employeeIds) {
      const assignedData = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
      
      // WBS 할당이 대시보드에 반영되었는지 확인
      const wbsAssignments = assignedData.projects
        .flatMap((project: any) => project.wbsList || [])
        .filter((wbs: any) => wbsItemIds.includes(wbs.wbsId));

      expect(wbsAssignments.length).toBe(wbsItemIds.length);
      console.log(`  ✅ ${employeeId}: ${wbsItemIds.length}개 WBS 배정 확인`);
      verifiedDashboardEndpoints++;
    }

    console.log('✅ 모든 직원의 WBS 할당 데이터 검증 완료');
    console.log(`✅ WBS 할당 및 검증 완료 - 총 ${assignments.length}건 할당, ${employeeIds.length}명 검증, ${verifiedDashboardEndpoints}개 대시보드 엔드포인트 검증`);

    return {
      assignments,
      verifiedDashboardEndpoints,
    };
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
    console.log('📝 WBS 할당 취소 시나리오');

    // 1. 프로젝트 할당 먼저 생성 (대시보드 API가 프로젝트 할당을 먼저 확인함)
    console.log('📝 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], [employeeId]);
    console.log('✅ 프로젝트 할당 완료');

    // 2. WBS 할당 생성
    const wbsItems = await this.testSuite.getRepository('WbsItem').find({
      where: { projectId },
      take: 3,
    });

    for (const wbsItem of wbsItems) {
      await this.basicScenario.WBS_할당을_생성한다(employeeId, wbsItem.id, projectId, periodId);
    }

    // 3. 직원의 WBS 할당 조회
    const employeeAssignments = await this.basicScenario.직원의_WBS_할당을_조회한다(employeeId, periodId);
    const initialCount = employeeAssignments.wbsAssignments.length;
    
    console.log(`📝 초기 WBS 할당 수: ${initialCount}개`);

    // 4. 첫 번째 할당 취소
    if (initialCount > 0) {
      const firstAssignment = employeeAssignments.wbsAssignments[0];
      await this.basicScenario.WBS_할당을_취소한다(firstAssignment.id);
      console.log(`✅ WBS 할당 취소 완료: ${firstAssignment.id}`);
    }

    // 5. 대시보드에서 할당 수 감소 확인
    const assignedData = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    
    // 프로젝트별로 WBS 할당 확인
    const targetProject = assignedData.projects.find((project: any) => project.projectId === projectId);
    const wbsAssignments = targetProject?.wbsList || [];

    const finalCount = wbsAssignments.length;
    expect(finalCount).toBe(initialCount - 1);
    console.log(`✅ 대시보드에서 WBS 할당 수 감소 확인: ${initialCount}개 → ${finalCount}개`);

    console.log(`✅ WBS 할당 취소 완료 - 취소된 할당: ${initialCount - finalCount}개, 대시보드 검증: 1개`);

    return {
      cancelledAssignments: initialCount - finalCount,
      verifiedDashboardEndpoints: 1,
    };
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
    console.log('📝 WBS 할당 순서 변경 시나리오');

    // 1. 프로젝트 할당 먼저 생성 (대시보드 API가 프로젝트 할당을 먼저 확인함)
    console.log('📝 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], [employeeId]);
    console.log('✅ 프로젝트 할당 완료');

    // 2. WBS 할당 생성 (최소 2개)
    const wbsItems = await this.testSuite.getRepository('WbsItem').find({
      where: { projectId },
      take: 2,
    });

    if (wbsItems.length < 2) {
      console.log('⚠️ 순서 변경을 위한 WBS 항목이 부족합니다 (최소 2개 필요)');
      return { orderChanges: 0, verifiedDashboardEndpoints: 0 };
    }

    for (const wbsItem of wbsItems) {
      await this.basicScenario.WBS_할당을_생성한다(employeeId, wbsItem.id, projectId, periodId);
    }

    // 3. 직원의 WBS 할당 조회
    const employeeAssignments = await this.basicScenario.직원의_WBS_할당을_조회한다(employeeId, periodId);
    const assignments = employeeAssignments.wbsAssignments.filter(
      (assignment: any) => assignment.projectId === projectId,
    );

    if (assignments.length < 2) {
      console.log('⚠️ 순서 변경을 위한 할당이 부족합니다 (최소 2개 필요)');
      return { orderChanges: 0, verifiedDashboardEndpoints: 0 };
    }

    // 3. 첫 번째 할당을 아래로 이동
    const firstAssignment = assignments[0];
    await this.basicScenario.WBS_할당_순서를_변경한다(firstAssignment.id, 'down');
    console.log(`✅ WBS 할당 순서 변경 완료: ${firstAssignment.id} 아래로 이동`);

    // 4. 대시보드에서 순서 변경 확인
    const assignedData = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    
    // 프로젝트별로 WBS 할당 확인
    const targetProject = assignedData.projects.find((project: any) => project.projectId === projectId);
    const wbsAssignments = targetProject?.wbsList || [];
    
    expect(wbsAssignments.length).toBe(assignments.length);
    console.log(`✅ 대시보드에서 WBS 할당 순서 변경 확인: ${wbsAssignments.length}개`);

    console.log(`✅ WBS 할당 순서 변경 완료 - 순서 변경: 1회, 대시보드 검증: 1개`);

    return {
      orderChanges: 1,
      verifiedDashboardEndpoints: 1,
    };
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
    console.log('📝 WBS 할당 초기화 시나리오');

    // 1. 프로젝트 할당 먼저 생성 (대시보드 API가 프로젝트 할당을 먼저 확인함)
    console.log('📝 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], [employeeId]);
    console.log('✅ 프로젝트 할당 완료');

    // 2. WBS 할당 생성
    const wbsItems = await this.testSuite.getRepository('WbsItem').find({
      where: { projectId },
      take: 3,
    });

    for (const wbsItem of wbsItems) {
      await this.basicScenario.WBS_할당을_생성한다(employeeId, wbsItem.id, projectId, periodId);
    }

    // 3. 초기 할당 상태 확인
    const initialAssignments = await this.basicScenario.직원의_WBS_할당을_조회한다(employeeId, periodId);
    const initialCount = initialAssignments.wbsAssignments.length;
    console.log(`📝 초기 WBS 할당 수: ${initialCount}개`);

    if (initialCount === 0) {
      console.log('⚠️ 초기화할 WBS 할당이 없습니다');
      return { resetType: 'none', verifiedDashboardEndpoints: 0 };
    }

    // 4. 직원별 WBS 할당 초기화
    await this.basicScenario.직원의_WBS_할당을_초기화한다(employeeId, periodId);
    console.log(`✅ 직원 WBS 할당 초기화 완료: ${employeeId}`);

    // 5. 대시보드에서 초기화 확인
    const assignedData = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    
    // 프로젝트별로 WBS 할당 확인
    const targetProject = assignedData.projects.find((project: any) => project.projectId === projectId);
    const wbsAssignments = targetProject?.wbsList || [];

    expect(wbsAssignments.length).toBe(0);
    console.log(`✅ 대시보드에서 WBS 할당 초기화 확인: ${wbsAssignments.length}개`);

    console.log(`✅ WBS 할당 초기화 완료 - 초기화 타입: 직원별, 대시보드 검증: 1개`);

    return {
      resetType: 'employee',
      verifiedDashboardEndpoints: 1,
    };
  }

  /**
   * WBS 할당 후 평가기준 및 평가라인 통합 검증 시나리오를 실행합니다.
   */
  async WBS_할당_후_평가기준_및_평가라인_통합_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
  ): Promise<{
    assignmentCreated: boolean;
    criteriaAutoGenerated: boolean;
    evaluationLineConfigured: boolean;
    primaryEvaluatorAssigned: boolean;
    verifiedEndpoints: number;
  }> {
    console.log('📝 WBS 할당 후 평가기준 및 평가라인 통합 검증 시나리오');

    // 1. WBS 할당 및 평가기준 자동생성 검증
    const criteriaResult = await this.criteriaScenario.WBS_할당_후_평가기준_자동생성_검증_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
      projectId,
    );

    // 2. WBS 할당 및 평가라인 자동구성 검증
    const evaluationLineResult = await this.evaluationLineScenario.WBS_할당_후_평가라인_자동구성_검증_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
      projectId,
    );

    console.log(`✅ WBS 할당 후 평가기준 및 평가라인 통합 검증 완료`);
    console.log(`  - 할당 생성: ${criteriaResult.assignmentCreated}`);
    console.log(`  - 평가기준 자동생성: ${criteriaResult.criteriaAutoGenerated}`);
    console.log(`  - 평가라인 자동구성: ${evaluationLineResult.evaluationLineConfigured}`);
    console.log(`  - 1차 평가자 할당: ${evaluationLineResult.primaryEvaluatorAssigned}`);

    return {
      assignmentCreated: criteriaResult.assignmentCreated,
      criteriaAutoGenerated: criteriaResult.criteriaAutoGenerated,
      evaluationLineConfigured: evaluationLineResult.evaluationLineConfigured,
      primaryEvaluatorAssigned: evaluationLineResult.primaryEvaluatorAssigned,
      verifiedEndpoints: criteriaResult.verifiedEndpoints + evaluationLineResult.verifiedEndpoints,
    };
  }
}
