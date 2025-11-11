import { BaseE2ETest } from '../../../base-e2e.spec';
import { BaseFinalEvaluationScenario } from './base-final-evaluation.scenario';
import { FinalEvaluationDashboardScenario } from './final-evaluation-dashboard.scenario';

/**
 * 최종평가 시나리오 (메인)
 *
 * 엔드포인트만을 사용하여 최종평가 관련 기능을 테스트합니다.
 * 최종평가 저장, 확정, 확정 취소, 조회 등의 전체 워크플로우를 테스트합니다.
 *
 * 이 클래스는 분리된 시나리오 클래스들을 조합하여 사용합니다:
 * - BaseFinalEvaluationScenario: 기본 최종평가 기능
 * - FinalEvaluationDashboardScenario: 대시보드 검증 기능
 */
export class FinalEvaluationScenario extends BaseFinalEvaluationScenario {
  public dashboardScenario: FinalEvaluationDashboardScenario;

  constructor(testSuite: BaseE2ETest) {
    super(testSuite);
    this.dashboardScenario = new FinalEvaluationDashboardScenario(testSuite);
  }

  // ==================== 복합 시나리오 ====================

  /**
   * 최종평가 전체 시나리오를 실행한다
   */
  async 최종평가_전체_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    evaluationGrade: string;
    jobGrade: string;
    jobDetailedGrade: string;
    finalComments?: string;
  }): Promise<{
    저장결과: any;
    확정결과: any;
    확정취소결과: any;
    상세조회결과: any;
  }> {
    // 1. 최종평가 저장
    const 저장결과 = await this.최종평가를_저장한다(config);

    // 2. 최종평가 확정
    const 확정결과 = await this.최종평가를_확정한다(저장결과.id);

    // 3. 최종평가 확정 취소
    const 확정취소결과 = await this.최종평가_확정을_취소한다(저장결과.id);

    // 4. 상세 조회
    const 상세조회결과 = await this.최종평가_상세정보를_조회한다(저장결과.id);

    return {
      저장결과,
      확정결과,
      확정취소결과,
      상세조회결과,
    };
  }

  /**
   * 최종평가 Upsert 동작 시나리오를 실행한다
   */
  async 최종평가_Upsert_동작_시나리오를_실행한다(config: {
    employeeId: string;
    periodId: string;
    첫번째평가등급: string;
    첫번째직무등급: string;
    첫번째직무상세등급: string;
    두번째평가등급: string;
    두번째직무등급: string;
    두번째직무상세등급: string;
  }): Promise<{
    첫번째저장결과: any;
    첫번째상세조회결과: any;
    두번째저장결과: any;
    두번째상세조회결과: any;
  }> {
    // 1. 첫 번째 최종평가 저장 (생성)
    const 첫번째저장결과 = await this.최종평가를_저장한다({
      employeeId: config.employeeId,
      periodId: config.periodId,
      evaluationGrade: config.첫번째평가등급,
      jobGrade: config.첫번째직무등급,
      jobDetailedGrade: config.첫번째직무상세등급,
    });

    // 2. 첫 번째 상세 조회
    const 첫번째상세조회결과 = await this.최종평가_상세정보를_조회한다(
      첫번째저장결과.id,
    );

    // 3. 두 번째 최종평가 저장 (수정)
    const 두번째저장결과 = await this.최종평가를_저장한다({
      employeeId: config.employeeId,
      periodId: config.periodId,
      evaluationGrade: config.두번째평가등급,
      jobGrade: config.두번째직무등급,
      jobDetailedGrade: config.두번째직무상세등급,
    });

    // 4. 두 번째 상세 조회
    const 두번째상세조회결과 = await this.최종평가_상세정보를_조회한다(
      두번째저장결과.id,
    );

    return {
      첫번째저장결과,
      첫번째상세조회결과,
      두번째저장결과,
      두번째상세조회결과,
    };
  }
}
