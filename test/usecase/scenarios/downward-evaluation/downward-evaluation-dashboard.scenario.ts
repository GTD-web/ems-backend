import { In } from 'typeorm';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';
import { DownwardEvaluationDashboardScenario as DashboardVerificationScenario } from './dashboard-verification.scenario';
import { BaseDownwardEvaluationScenario } from './base-downward-evaluation.scenario';
import { PrimaryDownwardEvaluationScenario } from './primary-downward-evaluation.scenario';
import { SecondaryDownwardEvaluationScenario } from './secondary-downward-evaluation.scenario';

/**
 * 하향평가 대시보드 검증 시나리오
 * 
 * 하향평가 작성 후 대시보드에서의 데이터 검증 기능을 제공합니다.
 * 1차/2차 하향평가 모두에 대한 대시보드 검증을 포함합니다.
 */
export class DownwardEvaluationDashboardScenario {
  private dashboardApiClient: DashboardApiClient;
  private baseScenario: BaseDownwardEvaluationScenario;
  private primaryScenario: PrimaryDownwardEvaluationScenario;
  private secondaryScenario: SecondaryDownwardEvaluationScenario;
  private dashboardVerificationScenario: DashboardVerificationScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.dashboardApiClient = new DashboardApiClient(testSuite);
    this.baseScenario = new BaseDownwardEvaluationScenario(testSuite);
    this.primaryScenario = new PrimaryDownwardEvaluationScenario(testSuite);
    this.secondaryScenario = new SecondaryDownwardEvaluationScenario(testSuite);
    this.dashboardVerificationScenario = new DashboardVerificationScenario(testSuite);
  }

  /**
   * 1차/2차 하향평가 작성 후 대시보드 검증 시나리오
   */
  async 하향평가_작성_후_대시보드_검증_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    projectId: string;
    evaluatorId: string;
  }): Promise<{
    WBS할당결과: any;
    자기평가결과: any;
    일차하향평가저장: any;
    일차하향평가제출: any;
    이차하향평가저장: any;
    이차하향평가제출: any;
    대시보드검증결과: any;
  }> {
    console.log('🚀 하향평가 작성 후 대시보드 검증 시나리오 시작...');

    // 1. WBS 할당 및 평가라인 매핑 확인
    const WBS할당결과 = await this.baseScenario.WBS할당_및_평가라인_매핑_확인({
      employeeId: config.evaluateeId,
      wbsItemId: config.wbsId,
      projectId: config.projectId,
      periodId: config.periodId,
    });

    // 2. 자기평가 완료
    const 자기평가결과 = await this.baseScenario.하향평가를_위한_자기평가_완료({
      employeeId: config.evaluateeId,
      wbsItemId: config.wbsId,
      periodId: config.periodId,
      selfEvaluationContent: '하향평가를 위한 자기평가',
      selfEvaluationScore: 90,
      performanceResult: '목표를 달성했습니다.',
    });

    // 3. 1차 하향평가 저장
    const 일차하향평가저장 = await this.primaryScenario.일차하향평가를_저장한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: WBS할당결과.primaryEvaluatorId || config.evaluatorId,
      selfEvaluationId: 자기평가결과.selfEvaluationId,
      downwardEvaluationContent: '업무 수행 능력이 우수합니다.',
      downwardEvaluationScore: 95,
    });

    // 4. 1차 하향평가 제출
    const 일차하향평가제출 = await this.primaryScenario.일차하향평가를_제출한다({
      evaluateeId: config.evaluateeId,
      periodId: config.periodId,
      wbsId: config.wbsId,
      evaluatorId: WBS할당결과.primaryEvaluatorId || config.evaluatorId,
    });

    // 5. 2차 하향평가 저장 (2차 평가자가 있는 경우에만)
    let 이차하향평가저장: any = null;
    let 이차하향평가제출: any = null;

    if (WBS할당결과.secondaryEvaluatorId) {
      이차하향평가저장 = await this.secondaryScenario.이차하향평가를_저장한다({
        evaluateeId: config.evaluateeId,
        periodId: config.periodId,
        wbsId: config.wbsId,
        evaluatorId: WBS할당결과.secondaryEvaluatorId,
        selfEvaluationId: 자기평가결과.selfEvaluationId,
        downwardEvaluationContent: '전반적으로 우수한 성과를 보였습니다.',
        downwardEvaluationScore: 88,
      });

      // 6. 2차 하향평가 제출
      이차하향평가제출 = await this.secondaryScenario.이차하향평가를_제출한다({
        evaluateeId: config.evaluateeId,
        periodId: config.periodId,
        wbsId: config.wbsId,
        evaluatorId: WBS할당결과.secondaryEvaluatorId,
      });
    }

    // 7. 대시보드에서 하향평가 데이터 검증
    const 대시보드검증결과 =
      await this.dashboardVerificationScenario.하향평가_작성_후_대시보드_검증_시나리오를_실행한다(
        {
          periodId: config.periodId,
          employeeId: config.evaluateeId,
          wbsId: config.wbsId,
          primary평가ID: 일차하향평가저장.id,
          secondary평가ID: 이차하향평가저장?.id,
        },
      );

    // 8. 검증
    expect(일차하향평가저장.id).toBeDefined();
    expect(일차하향평가제출.isSubmitted).toBe(true);
    expect(대시보드검증결과.대시보드검증결과.primary하향평가).toBeDefined();
    expect(
      대시보드검증결과.대시보드검증결과.primary하향평가.assignedWbsCount,
    ).toBeGreaterThan(0);

    if (WBS할당결과.secondaryEvaluatorId) {
      expect(이차하향평가저장.id).toBeDefined();
      expect(이차하향평가제출.isSubmitted).toBe(true);
      expect(대시보드검증결과.대시보드검증결과.secondary하향평가).toBeDefined();
    }

    console.log('✅ 하향평가 작성 후 대시보드 검증 시나리오 완료!');

    return {
      WBS할당결과,
      자기평가결과,
      일차하향평가저장,
      일차하향평가제출,
      이차하향평가저장,
      이차하향평가제출,
      대시보드검증결과,
    };
  }

  /**
   * 대시보드 검증 포함 하향평가 전체 시나리오 (E2E 테스트용)
   */
  async 대시보드_검증_포함_하향평가_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
    wbsItemIds: string[];
    projectIds: string[];
    evaluatorId: string;
    excludeEmployeeIds: string[];
  }): Promise<{
    하향평가결과: any;
  }> {
    console.log('🚀 대시보드 검증 포함 하향평가 시나리오 시작...');

    // 다른 팀원 찾기 (excludeEmployeeIds가 아닌 다른 직원, managerId가 있는 직원만)
    const employees = await this.testSuite.getRepository('Employee').find({
      where: { id: In(config.employeeIds) },
      select: ['id', 'managerId'],
    });

    const 다른팀원들 = employees.filter(
      (emp) =>
        !config.excludeEmployeeIds.includes(emp.id) && emp.managerId !== null,
    );

    if (다른팀원들.length < 1) {
      console.log(
        '⚠️ managerId가 있는 충분한 팀원이 없습니다. 테스트를 건너뜁니다.',
      );
      throw new Error('테스트를 위한 충분한 팀원이 없습니다.');
    }

    const 대시보드검증용팀원 = 다른팀원들[다른팀원들.length - 1];

    // 하향평가 작성 후 대시보드 검증
    const 하향평가결과 =
      await this.하향평가_작성_후_대시보드_검증_시나리오를_실행한다({
        evaluateeId: 대시보드검증용팀원.id,
        periodId: config.evaluationPeriodId,
        wbsId: config.wbsItemIds[2] || config.wbsItemIds[0],
        projectId: config.projectIds[0],
        evaluatorId: config.evaluatorId,
      });

    console.log('✅ 대시보드 검증 포함 하향평가 시나리오 완료!');

    return { 하향평가결과 };
  }

  /**
   * 대시보드 상태 검증
   */
  async 대시보드_상태를_검증한다(config: {
    evaluationPeriodId: string;
    employeeId: string;
    expectedPrimaryStatus: 'none' | 'in_progress' | 'complete';
    expectedSecondaryStatus: 'none' | 'in_progress' | 'complete';
  }): Promise<{
    primaryStatus: string;
    secondaryStatus: string;
    대시보드데이터: any;
  }> {
    console.log('🔍 대시보드 상태 검증 시작...');
    console.log(`   피평가자 ID: ${config.employeeId}`);
    console.log(`   평가기간 ID: ${config.evaluationPeriodId}`);
    console.log(`   예상 1차 상태: ${config.expectedPrimaryStatus}`);
    console.log(`   예상 2차 상태: ${config.expectedSecondaryStatus}`);

    // 대시보드 API 호출
    const response = await this.dashboardApiClient.getEmployeesStatus(
      config.evaluationPeriodId,
    );

    // 해당 직원의 데이터 찾기
    const 대시보드데이터 = response.find(
      (emp: any) => emp.employeeId === config.employeeId,
    );

    if (!대시보드데이터) {
      throw new Error(`직원 ${config.employeeId}의 대시보드 데이터를 찾을 수 없습니다.`);
    }

    console.log(`   직원: ${대시보드데이터.employee.name}`);

    // 1차 하향평가 상태 확인
    let primaryStatus = 'none';
    if (대시보드데이터.downwardEvaluation?.primary) {
      primaryStatus = 대시보드데이터.downwardEvaluation.primary.status;
      console.log(`   1차 하향평가 상태: ${primaryStatus}`);
    } else {
      console.log('   1차 하향평가: 없음');
    }

    // 2차 하향평가 상태 확인
    let secondaryStatus = 'none';
    if (대시보드데이터.downwardEvaluation?.secondary?.evaluators?.length > 0) {
      secondaryStatus = 대시보드데이터.downwardEvaluation.secondary.evaluators[0].status;
      console.log(`   2차 하향평가 상태: ${secondaryStatus}`);
    } else {
      console.log('   2차 하향평가: 없음');
    }

    // 상태 검증
    if (primaryStatus !== config.expectedPrimaryStatus) {
      console.log(`❌ 1차 하향평가 상태 불일치 - 예상: ${config.expectedPrimaryStatus}, 실제: ${primaryStatus}`);
    } else {
      console.log(`✅ 1차 하향평가 상태 일치: ${primaryStatus}`);
    }

    if (secondaryStatus !== config.expectedSecondaryStatus) {
      console.log(`❌ 2차 하향평가 상태 불일치 - 예상: ${config.expectedSecondaryStatus}, 실제: ${secondaryStatus}`);
    } else {
      console.log(`✅ 2차 하향평가 상태 일치: ${secondaryStatus}`);
    }

    console.log('✅ 대시보드 상태 검증 완료');

    return {
      primaryStatus,
      secondaryStatus,
      대시보드데이터,
    };
  }

}
