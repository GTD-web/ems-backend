import { BaseE2ETest } from '../../../base-e2e.spec';
import { BaseDownwardEvaluationScenario } from './base-downward-evaluation.scenario';
import { PrimaryDownwardEvaluationScenario } from './primary-downward-evaluation.scenario';
import { SecondaryDownwardEvaluationScenario } from './secondary-downward-evaluation.scenario';
import { DownwardEvaluationDashboardScenario } from './downward-evaluation-dashboard.scenario';
import { ComplexDownwardEvaluationScenario } from './complex-downward-evaluation.scenario';

/**
 * 하향평가 시나리오 (메인)
 *
 * 엔드포인트만을 사용하여 하향평가 관련 기능을 테스트합니다.
 * 1차/2차 하향평가의 전체 프로세스를 시나리오 형태로 구성합니다.
 * 
 * 이 클래스는 분리된 시나리오 클래스들을 조합하여 사용합니다:
 * - BaseDownwardEvaluationScenario: 기본 하향평가 기능
 * - PrimaryDownwardEvaluationScenario: 1차 하향평가 전용 기능
 * - SecondaryDownwardEvaluationScenario: 2차 하향평가 전용 기능
 * - DownwardEvaluationDashboardScenario: 대시보드 검증 기능
 * - ComplexDownwardEvaluationScenario: 복합 시나리오 기능
 */
export class DownwardEvaluationScenario {
  private baseScenario: BaseDownwardEvaluationScenario;
  private primaryScenario: PrimaryDownwardEvaluationScenario;
  private secondaryScenario: SecondaryDownwardEvaluationScenario;
  private complexScenario: ComplexDownwardEvaluationScenario;
  public dashboardScenario: DownwardEvaluationDashboardScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.baseScenario = new BaseDownwardEvaluationScenario(testSuite);
    this.primaryScenario = new PrimaryDownwardEvaluationScenario(testSuite);
    this.secondaryScenario = new SecondaryDownwardEvaluationScenario(testSuite);
    this.dashboardScenario = new DownwardEvaluationDashboardScenario(testSuite);
    this.complexScenario = new ComplexDownwardEvaluationScenario(testSuite);
  }

  // ===== 기본 하향평가 기능 위임 =====

  /**
   * 하향평가 상세 조회
   */
  async 하향평가_상세를_조회한다(evaluationId: string): Promise<any> {
    return this.baseScenario.하향평가_상세를_조회한다(evaluationId);
  }

  /**
   * 평가자별 하향평가 목록 조회
   */
  async 평가자별_하향평가_목록을_조회한다(config: {
    evaluatorId: string;
    periodId: string;
    evaluatorType?: 'primary' | 'secondary';
    employeeId?: string;
    projectId?: string;
  }): Promise<any> {
    return this.baseScenario.평가자별_하향평가_목록을_조회한다(config);
  }

  /**
   * 피평가자별 하향평가 목록 조회
   */
  async 피평가자별_하향평가_목록을_조회한다(config: {
    evaluateeId: string;
    periodId: string;
    evaluatorType?: 'primary' | 'secondary';
    projectId?: string;
  }): Promise<any> {
    return this.baseScenario.피평가자별_하향평가_목록을_조회한다(config);
  }

  /**
   * WBS 할당 및 평가라인 매핑 확인
   */
  async WBS할당_및_평가라인_매핑_확인(config: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
  }): Promise<{
    mappingCount: number;
    primaryEvaluatorId?: string;
    secondaryEvaluatorId?: string;
  }> {
    return this.baseScenario.WBS할당_및_평가라인_매핑_확인(config);
  }

  /**
   * 하향평가를 위한 자기평가 완료
   */
  async 하향평가를_위한_자기평가_완료(config: {
    employeeId: string;
    wbsItemId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
  }): Promise<{ selfEvaluationId: string }> {
    return this.baseScenario.하향평가를_위한_자기평가_완료(config);
  }

  // ===== 1차 하향평가 기능 위임 =====

  /**
   * 1차 하향평가 저장 (Upsert)
   */
  async 일차하향평가를_저장한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    return this.primaryScenario.일차하향평가를_저장한다(config);
  }

  /**
   * 1차 하향평가 제출
   */
  async 일차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<any> {
    return this.primaryScenario.일차하향평가를_제출한다(config);
  }

  /**
   * 하향평가 초기화 (1차)
   */
  async 일차하향평가를_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    return this.primaryScenario.일차하향평가를_초기화한다(config);
  }

  /**
   * 1차 하향평가 전체 시나리오 실행
   */
  async 일차하향평가_전체_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
    제출결과: any;
    상세조회결과: any;
    대시보드조회결과: any;
  }> {
    return this.primaryScenario.일차하향평가_전체_시나리오를_실행한다(config);
  }

  /**
   * 1차 하향평가 전체 프로세스 실행
   */
  async 일차하향평가_전체_프로세스_실행(config: {
    evaluateeId: string;
    evaluatorId?: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    WBS할당결과: {
      mappingCount: number;
      primaryEvaluatorId?: string;
      secondaryEvaluatorId?: string;
    };
    자기평가결과: { selfEvaluationId: string };
    하향평가저장: any;
    하향평가제출: any;
  }> {
    return this.primaryScenario.일차하향평가_전체_프로세스_실행(config);
  }

  /**
   * 1차 하향평가 저장 시나리오
   */
  async 일차하향평가_저장_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
  }> {
    return this.primaryScenario.일차하향평가_저장_시나리오를_실행한다(config);
  }

  // ===== 2차 하향평가 기능 위임 =====

  /**
   * 2차 하향평가 저장 (Upsert)
   */
  async 이차하향평가를_저장한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent?: string;
    downwardEvaluationScore?: number;
  }): Promise<any> {
    return this.secondaryScenario.이차하향평가를_저장한다(config);
  }

  /**
   * 2차 하향평가 제출
   */
  async 이차하향평가를_제출한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<any> {
    return this.secondaryScenario.이차하향평가를_제출한다(config);
  }

  /**
   * 하향평가 초기화 (2차)
   */
  async 이차하향평가를_초기화한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
  }): Promise<void> {
    return this.secondaryScenario.이차하향평가를_초기화한다(config);
  }

  /**
   * 2차 하향평가 전체 시나리오 실행
   */
  async 이차하향평가_전체_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
    제출결과: any;
    상세조회결과: any;
    대시보드조회결과: any;
  }> {
    return this.secondaryScenario.이차하향평가_전체_시나리오를_실행한다(config);
  }

  /**
   * 2차 하향평가 전체 프로세스 실행
   */
  async 이차하향평가_전체_프로세스_실행(config: {
    evaluateeId: string;
    evaluatorId?: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    selfEvaluationContent: string;
    selfEvaluationScore: number;
    performanceResult: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
    skipWbsAssignment?: boolean;
    skipSelfEvaluation?: boolean;
  }): Promise<{
    WBS할당결과?: {
      mappingCount: number;
      primaryEvaluatorId?: string;
      secondaryEvaluatorId?: string;
    };
    자기평가결과?: { selfEvaluationId: string };
    하향평가저장: any;
    하향평가제출: any;
  }> {
    return this.secondaryScenario.이차하향평가_전체_프로세스_실행(config);
  }

  /**
   * 2차 하향평가 저장 시나리오
   */
  async 이차하향평가_저장_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
  }> {
    return this.secondaryScenario.이차하향평가_저장_시나리오를_실행한다(config);
  }

  // ===== 복합 시나리오 기능 위임 =====

  /**
   * 1차/2차 하향평가 저장 후 제출 시나리오
   */
  async 하향평가_저장_후_제출_시나리오를_실행한다(config: {
    evaluateeId: string;
    periodId: string;
    wbsId: string;
    evaluatorId: string;
    evaluatorType: 'primary' | 'secondary';
    selfEvaluationId?: string;
    downwardEvaluationContent: string;
    downwardEvaluationScore: number;
  }): Promise<{
    저장결과: any;
    제출결과: any;
  }> {
    return this.complexScenario.하향평가_저장_후_제출_시나리오를_실행한다(config);
  }

  /**
   * 하향평가 관리 전체 시나리오
   */
  async 하향평가_관리_전체_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
    projectIds: string[];
    wbsItemIds: string[];
    evaluatorId: string;
    evaluateeId: string;
  }): Promise<{
    일차하향평가결과: any;
    이차하향평가결과: any;
    평가자별목록조회: any;
    피평가자별목록조회: any;
    일차필터링조회: any;
    이차필터링조회: any;
  }> {
    return this.complexScenario.하향평가_관리_전체_시나리오를_실행한다(config);
  }

  /**
   * 다른 피평가자로 1차 하향평가 저장 시나리오
   */
  async 다른_피평가자로_일차하향평가_저장_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
    wbsItemIds: string[];
    projectIds: string[];
    evaluatorId: string;
    excludeEmployeeIds: string[];
  }): Promise<{
    저장결과: any;
  }> {
    return this.complexScenario.다른_피평가자로_일차하향평가_저장_시나리오를_실행한다(config);
  }

  /**
   * 다른 피평가자로 2차 하향평가 저장 시나리오
   */
  async 다른_피평가자로_이차하향평가_저장_시나리오를_실행한다(config: {
    evaluationPeriodId: string;
    employeeIds: string[];
    wbsItemIds: string[];
    projectIds: string[];
    excludeEmployeeIds: string[];
  }): Promise<{
    저장결과: any;
  }> {
    return this.complexScenario.다른_피평가자로_이차하향평가_저장_시나리오를_실행한다(config);
  }

  // ===== 대시보드 검증 기능 위임 =====

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
    return this.dashboardScenario.하향평가_작성_후_대시보드_검증_시나리오를_실행한다(config);
  }

  /**
   * 대시보드 검증 포함 하향평가 전체 시나리오
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
    return this.dashboardScenario.대시보드_검증_포함_하향평가_시나리오를_실행한다(config);
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
    return this.dashboardScenario.대시보드_상태를_검증한다(config);
  }


}