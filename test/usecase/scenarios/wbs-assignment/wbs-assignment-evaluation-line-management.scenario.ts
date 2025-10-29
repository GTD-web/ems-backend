import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentBasicScenario } from './wbs-assignment-basic.scenario';

/**
 * WBS 평가라인 관리 시나리오 클래스
 * 
 * 1차/2차 평가자 구성 및 대시보드 검증 기능을 테스트합니다.
 */
export class WbsAssignmentEvaluationLineManagementScenario {
  private basicScenario: WbsAssignmentBasicScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.basicScenario = new WbsAssignmentBasicScenario(testSuite);
  }

  /**
   * 1차 평가자를 구성합니다.
   */
  async 일차_평가자를_구성한다(
    employeeId: string,
    periodId: string,
    evaluatorId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${periodId}/primary-evaluator`)
      .send({
        evaluatorId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 2차 평가자를 구성합니다.
   */
  async 이차_평가자를_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .post(`/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/wbs/${wbsItemId}/period/${periodId}/secondary-evaluator`)
      .send({
        evaluatorId,
      })
      .expect(200);

    return response.body;
  }

  /**
   * 직원 평가설정을 조회합니다.
   */
  async 직원_평가설정을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/evaluation-lines/employee/${employeeId}/period/${periodId}/settings`)
      .expect(200);

    return response.body;
  }

  /**
   * 평가자별 피평가자 목록을 조회합니다.
   */
  async 평가자별_피평가자_목록을_조회한다(evaluatorId: string): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/evaluation-lines/evaluator/${evaluatorId}/employees`)
      .expect(200);

    return response.body;
  }

  /**
   * 1차 평가자 구성 후 대시보드 검증 시나리오를 실행합니다.
   */
  async 일차_평가자_구성_후_대시보드_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    newEvaluatorId: string,
  ): Promise<{
    primaryEvaluatorConfigured: boolean;
    dashboardVerified: boolean;
    evaluatorChanged: boolean;
    verifiedEndpoints: number;
    beforeEvaluatorId?: string;
    afterEvaluatorId?: string;
  }> {
    console.log('📝 1차 평가자 구성 후 대시보드 검증 시나리오');

    let verifiedEndpoints = 0;

    // 1. 구성 전 직원 할당 데이터 조회 (기존 평가자 확인)
    console.log('📝 1. 구성 전 직원 할당 데이터 조회');
    const assignedDataBefore = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // 기존 1차 평가자 ID 추출
    const beforeEvaluatorId = assignedDataBefore.primaryDownwardEvaluation?.evaluatorId;
    console.log(`📝 구성 전 1차 평가자 ID: ${beforeEvaluatorId || '없음'}`);

    // 2. 1차 평가자 구성
    console.log('📝 2. 1차 평가자 구성');
    let primaryEvaluatorConfigured = false;
    try {
      const configureResult = await this.일차_평가자를_구성한다(
        employeeId,
        periodId,
        newEvaluatorId,
      );
      primaryEvaluatorConfigured = true;
      console.log(`✅ 1차 평가자 구성 완료: ${configureResult.evaluatorId}`);
    } catch (error) {
      console.log(`❌ 1차 평가자 구성 실패:`, error.message);
    }

    // 3. 구성 후 직원 할당 데이터 조회 (변경된 평가자 확인)
    console.log('📝 3. 구성 후 직원 할당 데이터 조회');
    const assignedDataAfter = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // 변경된 1차 평가자 ID 확인
    const afterEvaluatorId = assignedDataAfter.primaryDownwardEvaluation?.evaluatorId;
    console.log(`📝 구성 후 1차 평가자 ID: ${afterEvaluatorId || '없음'}`);

    // 4. 평가자 변경 검증
    const evaluatorChanged = beforeEvaluatorId !== afterEvaluatorId && afterEvaluatorId === newEvaluatorId;
    console.log(`📝 평가자 변경 검증: ${beforeEvaluatorId} → ${afterEvaluatorId} (${evaluatorChanged ? '성공' : '실패'})`);

    // 5. 직원 평가설정 조회로 추가 검증
    console.log('📝 4. 직원 평가설정 조회로 추가 검증');
    try {
      const evaluationSettings = await this.직원_평가설정을_조회한다(employeeId, periodId);
      verifiedEndpoints++;

      // 평가라인 매핑에서 1차 평가자 확인
      const primaryMapping = evaluationSettings.evaluationLineMappings?.find(
        (mapping: any) => mapping.evaluatorType === 'primary'
      );
      
      if (primaryMapping) {
        console.log(`✅ 평가설정에서 1차 평가자 확인: ${primaryMapping.evaluatorId}`);
        console.log(`📝 평가설정 평가자 ID: ${primaryMapping.evaluatorId}, 예상 ID: ${newEvaluatorId}`);
        
        if (primaryMapping.evaluatorId === newEvaluatorId) {
          console.log(`✅ 평가설정과 대시보드 평가자 ID 일치`);
        } else {
          console.log(`❌ 평가설정과 대시보드 평가자 ID 불일치`);
        }
      } else {
        console.log(`❌ 평가설정에서 1차 평가자 매핑을 찾을 수 없음`);
      }
    } catch (error) {
      console.log(`❌ 직원 평가설정 조회 실패:`, error.message);
    }

    // 6. 새로운 평가자의 피평가자 목록에서 해당 직원 확인
    console.log('📝 5. 새로운 평가자의 피평가자 목록에서 해당 직원 확인');
    try {
      const evaluatorEmployees = await this.평가자별_피평가자_목록을_조회한다(newEvaluatorId);
      verifiedEndpoints++;

      const targetEmployee = evaluatorEmployees.find(
        (emp: any) => emp.employeeId === employeeId
      );
      
      if (targetEmployee) {
        console.log(`✅ 새로운 평가자의 피평가자 목록에서 해당 직원 확인: ${targetEmployee.employeeId}`);
      } else {
        console.log(`❌ 새로운 평가자의 피평가자 목록에서 해당 직원을 찾을 수 없음`);
      }
    } catch (error) {
      console.log(`❌ 평가자별 피평가자 목록 조회 실패:`, error.message);
    }

    // 7. 대시보드 검증 종합
    const dashboardVerified = evaluatorChanged && primaryEvaluatorConfigured;
    
    console.log(`📊 1차 평가자 구성 후 대시보드 검증 결과:`);
    console.log(`  - 1차 평가자 구성: ${primaryEvaluatorConfigured ? '✅' : '❌'}`);
    console.log(`  - 평가자 변경: ${evaluatorChanged ? '✅' : '❌'}`);
    console.log(`  - 대시보드 검증: ${dashboardVerified ? '✅' : '❌'}`);
    console.log(`  - 검증된 엔드포인트: ${verifiedEndpoints}개`);

    return {
      primaryEvaluatorConfigured,
      dashboardVerified,
      evaluatorChanged,
      verifiedEndpoints,
      beforeEvaluatorId,
      afterEvaluatorId,
    };
  }

  /**
   * 2차 평가자 구성 후 대시보드 검증 시나리오를 실행합니다.
   */
  async 이차_평가자_구성_후_대시보드_검증_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    newEvaluatorId: string,
  ): Promise<{
    secondaryEvaluatorConfigured: boolean;
    dashboardVerified: boolean;
    wbsSecondaryEvaluatorSet: boolean;
    verifiedEndpoints: number;
    beforeSecondaryEvaluatorId?: string;
    afterSecondaryEvaluatorId?: string;
  }> {
    console.log('📝 2차 평가자 구성 후 대시보드 검증 시나리오');

    let verifiedEndpoints = 0;

    // 1. 프로젝트 할당 먼저 생성
    console.log('📝 1. 프로젝트 할당 생성 중...');
    await this.basicScenario.프로젝트를_대량으로_할당한다(periodId, [projectId], [employeeId]);
    console.log('✅ 프로젝트 할당 완료');

    // 2. WBS 할당 생성
    console.log('📝 2. WBS 할당 생성');
    const assignment = await this.basicScenario.WBS_할당을_생성한다(
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    );
    console.log(`✅ WBS 할당 생성 완료: ${assignment.id}`);

    // 3. 구성 전 직원 할당 데이터 조회 (기존 2차 평가자 확인)
    console.log('📝 3. 구성 전 직원 할당 데이터 조회');
    const assignedDataBefore = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // 해당 WBS의 기존 2차 평가자 ID 추출
    const targetWbsBefore = assignedDataBefore.projects
      .flatMap((project: any) => project.wbsList || [])
      .find((wbs: any) => wbs.wbsId === wbsItemId);

    const beforeSecondaryEvaluatorId = targetWbsBefore?.secondaryDownwardEvaluation?.evaluatorId;
    console.log(`📝 구성 전 2차 평가자 ID: ${beforeSecondaryEvaluatorId || '없음'}`);

    // 4. 2차 평가자 구성
    console.log('📝 4. 2차 평가자 구성');
    let secondaryEvaluatorConfigured = false;
    try {
      const configureResult = await this.이차_평가자를_구성한다(
        employeeId,
        wbsItemId,
        periodId,
        newEvaluatorId,
      );
      secondaryEvaluatorConfigured = true;
      console.log(`✅ 2차 평가자 구성 완료: ${configureResult.evaluatorId}`);
    } catch (error) {
      console.log(`❌ 2차 평가자 구성 실패:`, error.message);
    }

    // 5. 구성 후 직원 할당 데이터 조회 (변경된 2차 평가자 확인)
    console.log('📝 5. 구성 후 직원 할당 데이터 조회');
    const assignedDataAfter = await this.basicScenario.직원_할당_데이터를_조회한다(periodId, employeeId);
    verifiedEndpoints++;

    // 해당 WBS의 변경된 2차 평가자 ID 확인
    const targetWbsAfter = assignedDataAfter.projects
      .flatMap((project: any) => project.wbsList || [])
      .find((wbs: any) => wbs.wbsId === wbsItemId);

    const afterSecondaryEvaluatorId = targetWbsAfter?.secondaryDownwardEvaluation?.evaluatorId;
    console.log(`📝 구성 후 2차 평가자 ID: ${afterSecondaryEvaluatorId || '없음'}`);

    // 6. 2차 평가자 변경 검증
    const wbsSecondaryEvaluatorSet = afterSecondaryEvaluatorId === newEvaluatorId;
    console.log(`📝 2차 평가자 변경 검증: ${beforeSecondaryEvaluatorId} → ${afterSecondaryEvaluatorId} (${wbsSecondaryEvaluatorSet ? '성공' : '실패'})`);

    // 7. 직원 평가설정 조회로 추가 검증
    console.log('📝 6. 직원 평가설정 조회로 추가 검증');
    try {
      const evaluationSettings = await this.직원_평가설정을_조회한다(employeeId, periodId);
      verifiedEndpoints++;

      // 평가라인 매핑에서 2차 평가자 확인 (WBS별)
      const secondaryMapping = evaluationSettings.evaluationLineMappings?.find(
        (mapping: any) => mapping.evaluatorType === 'secondary' && mapping.wbsItemId === wbsItemId
      );
      
      if (secondaryMapping) {
        console.log(`✅ 평가설정에서 2차 평가자 확인: ${secondaryMapping.evaluatorId}`);
        console.log(`📝 평가설정 평가자 ID: ${secondaryMapping.evaluatorId}, 예상 ID: ${newEvaluatorId}`);
        
        if (secondaryMapping.evaluatorId === newEvaluatorId) {
          console.log(`✅ 평가설정과 대시보드 평가자 ID 일치`);
        } else {
          console.log(`❌ 평가설정과 대시보드 평가자 ID 불일치`);
        }
      } else {
        console.log(`❌ 평가설정에서 2차 평가자 매핑을 찾을 수 없음`);
      }
    } catch (error) {
      console.log(`❌ 직원 평가설정 조회 실패:`, error.message);
    }

    // 8. 새로운 평가자의 피평가자 목록에서 해당 직원 확인
    console.log('📝 7. 새로운 평가자의 피평가자 목록에서 해당 직원 확인');
    try {
      const evaluatorEmployees = await this.평가자별_피평가자_목록을_조회한다(newEvaluatorId);
      verifiedEndpoints++;

      const targetEmployee = evaluatorEmployees.find(
        (emp: any) => emp.employeeId === employeeId
      );
      
      if (targetEmployee) {
        console.log(`✅ 새로운 평가자의 피평가자 목록에서 해당 직원 확인: ${targetEmployee.employeeId}`);
      } else {
        console.log(`❌ 새로운 평가자의 피평가자 목록에서 해당 직원을 찾을 수 없음`);
      }
    } catch (error) {
      console.log(`❌ 평가자별 피평가자 목록 조회 실패:`, error.message);
    }

    // 9. 대시보드 검증 종합
    const dashboardVerified = wbsSecondaryEvaluatorSet && secondaryEvaluatorConfigured;
    
    console.log(`📊 2차 평가자 구성 후 대시보드 검증 결과:`);
    console.log(`  - 2차 평가자 구성: ${secondaryEvaluatorConfigured ? '✅' : '❌'}`);
    console.log(`  - WBS 2차 평가자 설정: ${wbsSecondaryEvaluatorSet ? '✅' : '❌'}`);
    console.log(`  - 대시보드 검증: ${dashboardVerified ? '✅' : '❌'}`);
    console.log(`  - 검증된 엔드포인트: ${verifiedEndpoints}개`);

    return {
      secondaryEvaluatorConfigured,
      dashboardVerified,
      wbsSecondaryEvaluatorSet,
      verifiedEndpoints,
      beforeSecondaryEvaluatorId,
      afterSecondaryEvaluatorId,
    };
  }
}

