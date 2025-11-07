import { In } from 'typeorm';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { BaseDownwardEvaluationScenario } from './base-downward-evaluation.scenario';
import { PrimaryDownwardEvaluationScenario } from './primary-downward-evaluation.scenario';
import { SecondaryDownwardEvaluationScenario } from './secondary-downward-evaluation.scenario';
import { DownwardEvaluationDashboardScenario } from './downward-evaluation-dashboard.scenario';

/**
 * 복합 하향평가 시나리오
 *
 * 여러 하향평가 시나리오를 조합하여 복잡한 워크플로우를 제공합니다.
 * 1차/2차 하향평가의 전체 프로세스와 관리 기능을 포함합니다.
 */
export class ComplexDownwardEvaluationScenario {
  private baseScenario: BaseDownwardEvaluationScenario;
  private primaryScenario: PrimaryDownwardEvaluationScenario;
  private secondaryScenario: SecondaryDownwardEvaluationScenario;
  private dashboardScenario: DownwardEvaluationDashboardScenario;

  constructor(private readonly testSuite: BaseE2ETest) {
    this.baseScenario = new BaseDownwardEvaluationScenario(testSuite);
    this.primaryScenario = new PrimaryDownwardEvaluationScenario(testSuite);
    this.secondaryScenario = new SecondaryDownwardEvaluationScenario(testSuite);
    this.dashboardScenario = new DownwardEvaluationDashboardScenario(testSuite);
  }

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
    console.log(
      `📝 ${config.evaluatorType === 'primary' ? '1차' : '2차'} 하향평가 저장 후 제출 시나리오 시작...`,
    );

    // 1. 저장
    const 저장결과 =
      config.evaluatorType === 'primary'
        ? await this.primaryScenario.일차하향평가를_저장한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
            selfEvaluationId: config.selfEvaluationId,
            downwardEvaluationContent: config.downwardEvaluationContent,
            downwardEvaluationScore: config.downwardEvaluationScore,
          })
        : await this.secondaryScenario.이차하향평가를_저장한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
            selfEvaluationId: config.selfEvaluationId,
            downwardEvaluationContent: config.downwardEvaluationContent,
            downwardEvaluationScore: config.downwardEvaluationScore,
          });

    // 2. 제출
    const 제출결과 =
      config.evaluatorType === 'primary'
        ? await this.primaryScenario.일차하향평가를_제출한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
          })
        : await this.secondaryScenario.이차하향평가를_제출한다({
            evaluateeId: config.evaluateeId,
            periodId: config.periodId,
            wbsId: config.wbsId,
            evaluatorId: config.evaluatorId,
          });

    // 검증
    expect(저장결과.id).toBeDefined();
    expect(저장결과.evaluatorId).toBe(config.evaluatorId);
    expect(제출결과.isSubmitted).toBe(true);

    console.log(
      `✅ ${config.evaluatorType === 'primary' ? '1차' : '2차'} 하향평가 저장 후 제출 시나리오 완료`,
    );

    return { 저장결과, 제출결과 };
  }

  /**
   * 하향평가 관리 전체 시나리오
   * - 1차/2차 하향평가 저장 및 제출
   * - 평가자별/피평가자별 목록 조회
   * - 평가자 타입별 필터링 조회
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
    console.log('🚀 하향평가 관리 전체 시나리오 시작...');

    // 0. 1차 평가자 설정 (평가 권한 부여)
    try {
      await this.testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${config.evaluateeId}/period/${config.evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: config.evaluatorId,
        })
        .expect(201);
      console.log('✅ 1차 평가자 설정 완료');
    } catch (error) {
      console.log('⚠️ 1차 평가자 설정 실패 (이미 설정되었을 수 있음)');
    }

    // 1. 1차 하향평가 전체 프로세스
    const 일차하향평가결과 =
      await this.primaryScenario.일차하향평가_전체_프로세스_실행({
        evaluateeId: config.evaluateeId,
        wbsItemId: config.wbsItemIds[0],
        projectId: config.projectIds[0],
        periodId: config.evaluationPeriodId,
        evaluatorId: config.evaluatorId,
        selfEvaluationContent: '1차 하향평가를 위한 자기평가',
        selfEvaluationScore: 90,
        performanceResult: '우수한 성과를 달성했습니다.',
        downwardEvaluationContent:
          '업무 수행 능력이 뛰어나며 팀에 기여도가 높습니다.',
        downwardEvaluationScore: 95,
      });

    // 2. 2차 하향평가 전체 프로세스
    const 이차하향평가결과 =
      await this.secondaryScenario.이차하향평가_전체_프로세스_실행({
        evaluateeId: config.evaluateeId,
        wbsItemId: config.wbsItemIds[1],
        projectId: config.projectIds[0],
        periodId: config.evaluationPeriodId,
        selfEvaluationContent: '2차 하향평가를 위한 자기평가',
        selfEvaluationScore: 85,
        performanceResult: '목표를 달성했습니다.',
        downwardEvaluationContent:
          '전반적으로 우수한 성과를 보였으며, 지속적인 발전을 기대합니다.',
        downwardEvaluationScore: 88,
      });

    // 3. 평가자별 하향평가 목록 조회
    const 평가자별목록조회 =
      await this.baseScenario.평가자별_하향평가_목록을_조회한다({
        evaluatorId: config.evaluatorId,
        periodId: config.evaluationPeriodId,
      });

    // 4. 피평가자별 하향평가 목록 조회
    const 피평가자별목록조회 =
      await this.baseScenario.피평가자별_하향평가_목록을_조회한다({
        evaluateeId: config.evaluateeId,
        periodId: config.evaluationPeriodId,
      });

    // 5. 1차 평가자 타입으로 필터링 조회
    const 일차필터링조회 =
      await this.baseScenario.평가자별_하향평가_목록을_조회한다({
        evaluatorId: config.evaluatorId,
        periodId: config.evaluationPeriodId,
        evaluatorType: 'primary',
      });

    // 6. 2차 평가자 타입으로 필터링 조회
    const 이차평가자 = config.employeeIds[2] || config.employeeIds[0];
    const 이차필터링조회 =
      await this.baseScenario.평가자별_하향평가_목록을_조회한다({
        evaluatorId: 이차평가자,
        periodId: config.evaluationPeriodId,
        evaluatorType: 'secondary',
      });

    console.log('✅ 하향평가 관리 전체 시나리오 완료!');

    return {
      일차하향평가결과,
      이차하향평가결과,
      평가자별목록조회,
      피평가자별목록조회,
      일차필터링조회,
      이차필터링조회,
    };
  }

  /**
   * 다른 피평가자로 1차 하향평가 저장 시나리오 (E2E 테스트용)
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
    console.log('🚀 다른 피평가자로 1차 하향평가 저장 시나리오 시작...');

    // 다른 팀원 찾기 (excludeEmployeeIds가 아닌 다른 직원, managerId가 있는 직원만)
    const employees = await this.testSuite.getRepository('Employee').find({
      where: { id: In(config.employeeIds) },
      select: ['id', 'managerId'],
    });

    const 다른팀원 = employees.find(
      (emp) =>
        !config.excludeEmployeeIds.includes(emp.id) && emp.managerId !== null,
    );

    if (!다른팀원) {
      throw new Error(
        `❌ 테스트 실패: managerId가 있는 다른 팀원을 찾을 수 없습니다. ` +
          `전체 직원 수: ${employees.length}, ` +
          `제외할 직원 수: ${config.excludeEmployeeIds.length}. ` +
          `beforeEach에서 충분한 시드 데이터와 관리자 관계를 설정해주세요.`,
      );
    }

    // WBS 할당
    try {
      await this.testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId: 다른팀원.id,
          wbsItemId: config.wbsItemIds[2] || config.wbsItemIds[0],
          projectId: config.projectIds[0],
          periodId: config.evaluationPeriodId,
        })
        .expect(201);
    } catch (error) {
      console.log('⚠️ WBS 할당 실패 (이미 할당되었을 수 있음)');
    }

    // 평가라인 설정 (1차 평가자)
    try {
      await this.testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${다른팀원.id}/period/${config.evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: config.evaluatorId,
        })
        .expect(201);
      console.log('✅ 1차 평가자 설정 완료');
    } catch (error) {
      console.log('⚠️ 1차 평가자 설정 실패 (이미 설정되었을 수 있음)');
    }

    // 1차 하향평가 저장
    const result =
      await this.primaryScenario.일차하향평가_저장_시나리오를_실행한다({
        evaluateeId: 다른팀원.id,
        periodId: config.evaluationPeriodId,
        wbsId: config.wbsItemIds[2] || config.wbsItemIds[0],
        evaluatorId: config.evaluatorId,
        downwardEvaluationContent: '저장 시나리오 테스트 - 1차 평가',
        downwardEvaluationScore: 92,
      });

    console.log(
      `✅ 다른 피평가자로 1차 하향평가 저장 시나리오 완료 (ID: ${result.저장결과.id})`,
    );

    return result;
  }

  /**
   * 다른 피평가자로 2차 하향평가 저장 시나리오 (E2E 테스트용)
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
    console.log('🚀 다른 피평가자로 2차 하향평가 저장 시나리오 시작...');

    // 다른 팀원 찾기: WBS 할당을 받은 직원 중에서 찾기
    const employees = await this.testSuite.getRepository('Employee').find({
      where: { id: In(config.employeeIds) },
      select: ['id', 'managerId'],
    });

    // excludeEmployeeIds가 아니고, managerId가 있는 직원들
    const 후보팀원들 = employees.filter(
      (emp) =>
        !config.excludeEmployeeIds.includes(emp.id) && emp.managerId !== null,
    );

    if (후보팀원들.length < 1) {
      throw new Error(
        `❌ 테스트 실패: managerId가 있는 충분한 팀원이 없습니다. ` +
          `전체 직원 수: ${employees.length}, ` +
          `제외할 직원 수: ${config.excludeEmployeeIds.length}. ` +
          `beforeEach에서 충분한 시드 데이터와 관리자 관계를 설정해주세요.`,
      );
    }

    // 각 후보 직원의 2차 평가자 매핑이 있는지 확인
    let 다른팀원: any = null;
    let 평가라인매핑: any = null;

    for (const emp of 후보팀원들) {
      const mappings = await this.testSuite
        .getRepository('EvaluationLineMapping')
        .createQueryBuilder('mapping')
        .where('mapping.employeeId = :employeeId', { employeeId: emp.id })
        .andWhere('mapping.wbsItemId IS NOT NULL') // 2차 평가자 매핑만
        .andWhere('mapping.deletedAt IS NULL')
        .getMany();

      if (mappings.length > 0 && mappings[0].evaluatorId !== emp.id) {
        다른팀원 = emp;
        평가라인매핑 = mappings[0];
        console.log(
          `✅ 적합한 팀원 발견: ${emp.id}, 2차 평가자 매핑 수: ${mappings.length}`,
        );
        break;
      }
    }

    if (!다른팀원 || !평가라인매핑) {
      throw new Error(
        `❌ 테스트 실패: 2차 평가자 매핑이 있는 적합한 팀원을 찾을 수 없습니다. ` +
          `후보 팀원 수: ${후보팀원들.length}. ` +
          `beforeEach에서 WBS 할당과 2차 평가자 매핑을 설정해주세요.`,
      );
    }

    console.log(
      `🔍 선택된 다른 팀원: ${다른팀원.id}, managerId: ${다른팀원.managerId}`,
    );
    console.log(
      `🔍 2차 평가자 매핑: evaluatorId=${평가라인매핑.evaluatorId}, wbsItemId=${평가라인매핑.wbsItemId}`,
    );

    // 2차 평가자가 피평가자 본인인지 확인
    if (평가라인매핑.evaluatorId === 다른팀원.id) {
      throw new Error(
        `❌ 테스트 실패: 2차 평가자가 피평가자 본인입니다. ` +
          `피평가자: ${다른팀원.id}, 평가자: ${평가라인매핑.evaluatorId}. ` +
          `beforeEach에서 올바른 평가자 관계를 설정해주세요.`,
      );
    }

    // 2차 하향평가 저장
    const result =
      await this.secondaryScenario.이차하향평가_저장_시나리오를_실행한다({
        evaluateeId: 다른팀원.id,
        periodId: config.evaluationPeriodId,
        wbsId: 평가라인매핑.wbsItemId!,
        evaluatorId: 평가라인매핑.evaluatorId,
        downwardEvaluationContent: '저장 시나리오 테스트 - 2차 평가',
        downwardEvaluationScore: 87,
      });

    console.log(
      `✅ 다른 피평가자로 2차 하향평가 저장 시나리오 완료 (ID: ${result.저장결과.id})`,
    );

    return result;
  }
}
