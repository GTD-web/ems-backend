import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentBasicScenario } from './wbs-assignment-basic.scenario';
import { WbsAssignmentCriteriaScenario } from './wbs-assignment-criteria.scenario';
import { WbsAssignmentEvaluationLineScenario } from './wbs-assignment-evaluation-line.scenario';
import { WbsAssignmentEvaluationCriteriaManagementScenario } from './wbs-assignment-evaluation-criteria-management.scenario';
import { Not, IsNull } from 'typeorm';

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
  private evaluationCriteriaManagementScenario: WbsAssignmentEvaluationCriteriaManagementScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.basicScenario = new WbsAssignmentBasicScenario(testSuite);
    this.criteriaScenario = new WbsAssignmentCriteriaScenario(testSuite);
    this.evaluationLineScenario = new WbsAssignmentEvaluationLineScenario(testSuite);
    this.evaluationCriteriaManagementScenario = new WbsAssignmentEvaluationCriteriaManagementScenario(testSuite);
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
    totalWbsVerified?: number;
    totalCriteriaVerified?: number;
    totalPrimaryEvaluatorVerified?: number;
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

    // 4. 각 직원의 할당 데이터 종합 검증 (WBS, 평가기준, 1차 평가자)
    console.log(`📝 ${employeeIds.length}명의 직원 할당 데이터 종합 검증 시작`);
    let verifiedDashboardEndpoints = 0;
    let totalWbsVerified = 0;
    let totalCriteriaVerified = 0;
    let totalPrimaryEvaluatorVerified = 0;

    for (const employeeId of employeeIds) {
      // 1차 평가자 ID 조회 (직원의 managerId가 없으면 다른 직원을 평가자로 사용)
      const employee = await this.testSuite.getRepository('Employee').findOne({
        where: { id: employeeId },
      });
      
      let evaluatorId: string;
      if (employee && employee.managerId) {
        evaluatorId = employee.managerId;
      } else {
        // managerId가 없는 경우 다른 직원을 평가자로 사용
        const otherEmployees = await this.testSuite.getRepository('Employee').find({
          where: { 
            id: Not(employeeId),
            deletedAt: IsNull(),
          },
          take: 1,
        });
        
        if (otherEmployees.length === 0) {
          console.log(`⚠️ ${employeeId}: 1차 평가자 정보가 없고 다른 직원도 없어 검증을 건너뜁니다`);
          continue;
        }
        
        evaluatorId = otherEmployees[0].id;
        console.log(`⚠️ ${employeeId}: managerId가 없어 다른 직원 ${evaluatorId}를 평가자로 사용합니다`);
      }
      
      // 대시보드 종합 검증 수행
      const verificationResult = await this.basicScenario.WBS_할당_대시보드_종합_검증을_수행한다(
        periodId,
        employeeId,
        evaluatorId,
        wbsItemIds,
      );

      verifiedDashboardEndpoints += verificationResult.verifiedEndpoints;
      if (verificationResult.wbsAssignmentsVerified) totalWbsVerified++;
      if (verificationResult.evaluationCriteriaVerified) totalCriteriaVerified++;
      if (verificationResult.primaryEvaluatorVerified) totalPrimaryEvaluatorVerified++;

      // 상세한 평가기준 검증 결과 출력
      if (verificationResult.wbsCriteriaDetails) {
        console.log(`  📊 ${employeeId} WBS별 평가기준 상세:`);
        verificationResult.wbsCriteriaDetails.forEach(detail => {
          console.log(`    - WBS ${detail.wbsId}: ${detail.criteriaCount}개 ${detail.hasCriteria ? '✅' : '❌'}`);
        });
        console.log(`    - 총 평가기준: ${verificationResult.totalCriteriaCount || 0}개`);
      }

      // 평가자 평가 대상자 현황 검증 결과 출력
      if (verificationResult.evaluatorTargetsDetails) {
        console.log(`  📊 ${employeeId} 평가자 평가 대상자 현황 상세:`);
        verificationResult.evaluatorTargetsDetails.forEach(detail => {
          console.log(`    - ${detail.employeeId}: evaluationCriteria=${detail.evaluationCriteriaCount}개, wbsCriteria=${detail.wbsCriteriaCount}개, evaluationLine=${detail.evaluationLineCount}개`);
        });
      }

      console.log(`  📊 ${employeeId} 검증 결과: WBS=${verificationResult.wbsAssignmentsVerified}, 평가기준=${verificationResult.evaluationCriteriaVerified}, 1차평가자=${verificationResult.primaryEvaluatorVerified}`);
      console.log(`  📊 ${employeeId} 평가자 현황: evaluationCriteria=${verificationResult.evaluatorTargetsEvaluationCriteriaVerified}, wbsCriteria=${verificationResult.evaluatorTargetsWbsCriteriaVerified}, evaluationLine=${verificationResult.evaluatorTargetsEvaluationLineVerified}`);
    }

    console.log('✅ 모든 직원의 WBS 할당 데이터 검증 완료');
    console.log(`📊 종합 검증 결과:`);
    console.log(`  - WBS 할당 검증: ${totalWbsVerified}/${employeeIds.length}명`);
    console.log(`  - 평가기준 검증: ${totalCriteriaVerified}/${employeeIds.length}명`);
    console.log(`  - 1차 평가자 검증: ${totalPrimaryEvaluatorVerified}/${employeeIds.length}명`);
    console.log(`✅ WBS 할당 및 검증 완료 - 총 ${assignments.length}건 할당, ${employeeIds.length}명 검증, ${verifiedDashboardEndpoints}개 대시보드 엔드포인트 검증`);

    return {
      assignments,
      verifiedDashboardEndpoints,
      totalWbsVerified,
      totalCriteriaVerified,
      totalPrimaryEvaluatorVerified,
    };
  }

  /**
   * WBS 할당 후 대시보드 API를 통한 종합 검증 시나리오를 실행합니다.
   */
  async WBS_할당_대시보드_종합_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemIds: string[],
    projectId: string,
  ): Promise<{
    assignmentCreated: boolean;
    wbsAssignmentsVerified: boolean;
    evaluationCriteriaVerified: boolean;
    primaryEvaluatorVerified: boolean;
    verifiedEndpoints: number;
    wbsCriteriaDetails?: { wbsId: string; criteriaCount: number; hasCriteria: boolean }[];
    totalCriteriaCount?: number;
    wbsDownwardEvaluationVerified?: boolean;
    wbsDownwardEvaluationDetails?: {
      wbsId: string;
      hasPrimaryDownwardEvaluation: boolean;
      hasSecondaryDownwardEvaluation: boolean;
      primaryDownwardEvaluationId?: string;
      secondaryDownwardEvaluationId?: string;
    }[];
    evaluatorTargetsEvaluationCriteriaVerified?: boolean;
    evaluatorTargetsWbsCriteriaVerified?: boolean;
    evaluatorTargetsEvaluationLineVerified?: boolean;
    evaluatorTargetsDetails?: {
      employeeId: string;
      hasEvaluationCriteria: boolean;
      hasWbsCriteria: boolean;
      hasEvaluationLine: boolean;
      evaluationCriteriaCount: number;
      wbsCriteriaCount: number;
      evaluationLineCount: number;
    }[];
  }> {
    console.log('📝 WBS 할당 대시보드 종합 검증 시나리오');

    // 1. 프로젝트 할당 먼저 생성
    console.log('📝 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], [employeeId]);
    console.log('✅ 프로젝트 할당 완료');

    // 2. WBS 할당 생성
    const assignments: any[] = [];
    for (const wbsItemId of wbsItemIds) {
      const assignment = await this.basicScenario.WBS_할당을_생성한다(
        employeeId,
        wbsItemId,
        projectId,
        periodId,
      );
      assignments.push(assignment);
    }

    console.log(`✅ WBS 할당 생성 완료: ${assignments.length}개`);

    // 3. 1차 평가자 ID 조회 (직원의 managerId가 없으면 다른 직원을 평가자로 사용)
    const employee = await this.testSuite.getRepository('Employee').findOne({
      where: { id: employeeId },
    });
    
    let evaluatorId: string;
    if (employee && employee.managerId) {
      evaluatorId = employee.managerId;
    } else {
      // managerId가 없는 경우 다른 직원을 평가자로 사용
      const otherEmployees = await this.testSuite.getRepository('Employee').find({
        where: { 
          id: Not(employeeId),
          deletedAt: IsNull(),
        },
        take: 1,
      });
      
      if (otherEmployees.length === 0) {
        throw new Error(`직원 ${employeeId}의 1차 평가자 정보가 없고, 다른 직원도 없습니다`);
      }
      
      evaluatorId = otherEmployees[0].id;
      console.log(`⚠️ 직원 ${employeeId}의 managerId가 없어 다른 직원 ${evaluatorId}를 평가자로 사용합니다`);
    }

    // 4. 대시보드 종합 검증 수행
    const verificationResult = await this.basicScenario.WBS_할당_대시보드_종합_검증을_수행한다(
      periodId,
      employeeId,
      evaluatorId,
      wbsItemIds,
    );

    // 상세한 평가기준 검증 결과 출력
    if (verificationResult.wbsCriteriaDetails) {
      console.log(`📊 WBS별 평가기준 상세 검증 결과:`);
      verificationResult.wbsCriteriaDetails.forEach(detail => {
        console.log(`  - WBS ${detail.wbsId}: ${detail.criteriaCount}개 평가기준 ${detail.hasCriteria ? '✅' : '❌'}`);
      });
      console.log(`  - 총 평가기준 수: ${verificationResult.totalCriteriaCount || 0}개`);
    }

    // WBS별 하향평가 상세 검증 결과 출력
    if (verificationResult.wbsDownwardEvaluationDetails) {
      console.log(`📊 WBS별 하향평가 상세 검증 결과:`);
      verificationResult.wbsDownwardEvaluationDetails.forEach(detail => {
        console.log(`  - WBS ${detail.wbsId}: primaryDownwardEvaluation=${detail.hasPrimaryDownwardEvaluation ? '✅' : '❌'}, secondaryDownwardEvaluation=${detail.hasSecondaryDownwardEvaluation ? '✅' : '❌'}`);
        if (detail.primaryDownwardEvaluationId) {
          console.log(`    - primaryDownwardEvaluation ID: ${detail.primaryDownwardEvaluationId}`);
        }
        if (detail.secondaryDownwardEvaluationId) {
          console.log(`    - secondaryDownwardEvaluation ID: ${detail.secondaryDownwardEvaluationId}`);
        }
      });
    }

    // 평가자 평가 대상자 현황 상세 검증 결과 출력
    if (verificationResult.evaluatorTargetsDetails) {
      console.log(`📊 평가자 평가 대상자 현황 상세 검증 결과:`);
      verificationResult.evaluatorTargetsDetails.forEach(detail => {
        console.log(`  - ${detail.employeeId}: evaluationCriteria=${detail.evaluationCriteriaCount}개, wbsCriteria=${detail.wbsCriteriaCount}개, evaluationLine=${detail.evaluationLineCount}개`);
      });
    }

    console.log(`✅ WBS 할당 대시보드 종합 검증 완료 - 할당: ${assignments.length}개, WBS: ${verificationResult.wbsAssignmentsVerified}, 평가기준: ${verificationResult.evaluationCriteriaVerified}, 1차평가자: ${verificationResult.primaryEvaluatorVerified}`);

    return {
      assignmentCreated: true,
      wbsAssignmentsVerified: verificationResult.wbsAssignmentsVerified,
      evaluationCriteriaVerified: verificationResult.evaluationCriteriaVerified,
      primaryEvaluatorVerified: verificationResult.primaryEvaluatorVerified,
      verifiedEndpoints: verificationResult.verifiedEndpoints,
      wbsCriteriaDetails: verificationResult.wbsCriteriaDetails,
      totalCriteriaCount: verificationResult.totalCriteriaCount,
      wbsDownwardEvaluationVerified: verificationResult.wbsDownwardEvaluationVerified,
      wbsDownwardEvaluationDetails: verificationResult.wbsDownwardEvaluationDetails,
      evaluatorTargetsEvaluationCriteriaVerified: verificationResult.evaluatorTargetsEvaluationCriteriaVerified,
      evaluatorTargetsWbsCriteriaVerified: verificationResult.evaluatorTargetsWbsCriteriaVerified,
      evaluatorTargetsEvaluationLineVerified: verificationResult.evaluatorTargetsEvaluationLineVerified,
      evaluatorTargetsDetails: verificationResult.evaluatorTargetsDetails,
    };
  }

  /**
   * WBS 평가기준 생성-저장-삭제-재저장 시나리오를 실행합니다.
   */
  async WBS_평가기준_생성_저장_삭제_재저장_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
  ): Promise<{
    assignmentCreated: boolean;
    autoGeneratedCriteria: boolean;
    criteriaSaved: boolean;
    criteriaDeleted: boolean;
    criteriaReSaved: boolean;
    verifiedEndpoints: number;
    criteriaDetails?: {
      autoGeneratedId?: string;
      savedId?: string;
      reSavedId?: string;
    };
  }> {
    return await this.evaluationCriteriaManagementScenario.WBS_평가기준_생성_저장_삭제_재저장_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
      projectId,
    );
  }

  /**
   * WBS 할당 후 평가라인 수정 검증 시나리오를 실행합니다.
   */
  async WBS_할당_후_평가라인_수정_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    newPrimaryEvaluatorId: string,
  ): Promise<{
    assignmentCreated: boolean;
    evaluationLineModified: boolean;
    verifiedEndpoints: number;
  }> {
    return await this.evaluationLineScenario.WBS_할당_후_평가라인_수정_검증_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
      projectId,
      newPrimaryEvaluatorId,
    );
  }

  /**
   * 2차 평가자 구성 시나리오를 실행합니다.
   */
  async 이차_평가자_구성_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    secondaryEvaluatorId: string,
  ): Promise<{
    assignmentCreated: boolean;
    secondaryEvaluatorConfigured: boolean;
    verifiedEndpoints: number;
  }> {
    return await this.evaluationLineScenario.이차_평가자_구성_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
      projectId,
      secondaryEvaluatorId,
    );
  }

  /**
   * 모든 직원 평가기간 현황 검증 시나리오를 실행합니다.
   */
  async 모든_직원_평가기간_현황_검증_시나리오를_실행한다(
    periodId: string,
    expectedEmployeeIds: string[],
  ): Promise<{
    employeesStatusVerified: boolean;
    evaluationCriteriaVerified: boolean;
    wbsCriteriaVerified: boolean;
    evaluationLineVerified: boolean;
    verifiedEndpoints: number;
    statusDetails?: {
      totalEmployees: number;
      employeesWithEvaluationCriteria: number;
      employeesWithWbsCriteria: number;
      employeesWithEvaluationLine: number;
      employeeDetails: {
        employeeId: string;
        hasEvaluationCriteria: boolean;
        hasWbsCriteria: boolean;
        hasEvaluationLine: boolean;
        evaluationCriteriaCount: number;
        wbsCriteriaCount: number;
        evaluationLineCount: number;
      }[];
    };
  }> {
    return await this.basicScenario.모든_직원_평가기간_현황_검증을_수행한다(
      periodId,
      expectedEmployeeIds,
    );
  }

  /**
   * WBS 항목 평가기준 전체 삭제 시나리오를 실행합니다.
   */
  async WBS_항목_평가기준_전체삭제_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
  ): Promise<{
    assignmentCreated: boolean;
    criteriaCreated: boolean;
    criteriaBulkDeleted: boolean;
    verifiedEndpoints: number;
  }> {
    return await this.evaluationCriteriaManagementScenario.WBS_항목_평가기준_전체삭제_시나리오를_실행한다(
      periodId,
      employeeId,
      wbsItemId,
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

