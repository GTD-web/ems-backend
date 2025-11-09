import { BaseE2ETest } from '../../../base-e2e.spec';
import { DownwardEvaluationScenario } from './downward-evaluation.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

/**
 * 하향평가 기본 관리 시나리오 E2E 테스트
 *
 * 📋 테스트 범위:
 * - 1차/2차 하향평가의 저장, 제출 기본 흐름
 * - 단계 승인 상태 관리 (pending → approved)
 * - 1개 WBS 할당 기준의 단순 시나리오
 *
 * 🎯 특징:
 * - 기본적인 CRUD 및 상태 전환에 집중
 * - 직원 1명당 WBS 1개 할당 (단순 케이스)
 * - 대시보드 API 검증 포함
 */
describe('하향평가 기본 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 5,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    if (
      employeeIds.length === 0 ||
      projectIds.length === 0 ||
      wbsItemIds.length === 0
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원, 프로젝트 또는 WBS가 생성되지 않았습니다.',
      );
    }

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '하향평가 관리 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '하향평가 관리 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S+', minRange: 95, maxRange: 100 },
        { grade: 'S', minRange: 90, maxRange: 94 },
        { grade: 'A+', minRange: 85, maxRange: 89 },
        { grade: 'A', minRange: 80, maxRange: 84 },
        { grade: 'B+', minRange: 75, maxRange: 79 },
        { grade: 'B', minRange: 70, maxRange: 74 },
        { grade: 'C', minRange: 0, maxRange: 69 },
      ],
    };

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 프로젝트 할당 (프로젝트 1개만)
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      projectId: projectIds[0],
    });

    // 시드 데이터에서 생성된 WBS는 이미 프로젝트에 속해있으므로 바로 할당
    try {
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
      });
      console.log(`✅ WBS 할당 완료: ${wbsItemIds[0]}`);
    } catch (error) {
      console.error(`❌ WBS[0] 할당 실패, WBS[1] 시도: ${error.message}`);
      // 첫 번째 WBS 할당 실패 시 두 번째 WBS 시도
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[1],
        projectId: projectIds[0],
      });
      console.log(`✅ WBS 할당 완료: ${wbsItemIds[1]}`);
      // 테스트에서 사용할 WBS ID 업데이트
      wbsItemIds[0] = wbsItemIds[1];
    }
  });

  describe('1차 하향평가 저장 및 제출', () => {
    it('1차 하향평가 모든 WBS 평가 완료 시 단계 승인 상태(Step Approval Status)는 pending이 되고 승인 후 approved가 된다', async () => {
      const evaluateeId = employeeIds[0];
      const evaluatorId = employeeIds[1]; // 1차 평가자
      const wbsId = wbsItemIds[0];

      // 선행조건: 평가라인 설정 (1차 평가자)
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: evaluatorId,
        })
        .expect(201);

      // 선행조건: 자기평가 완료
      const selfEvaluationResult =
        await downwardEvaluationScenario.하향평가를_위한_자기평가_완료({
          employeeId: evaluateeId,
          wbsItemId: wbsId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 90,
          performanceResult: '성과 결과입니다.',
        });

      // Step 1: 1차 하향평가 저장
      const 저장결과 = await downwardEvaluationScenario.일차하향평가를_저장한다(
        {
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId,
          evaluatorId,
          selfEvaluationId: selfEvaluationResult.selfEvaluationId,
          downwardEvaluationContent: '1차 하향평가 내용입니다.',
          downwardEvaluationScore: 85,
        },
      );

      // 검증: 저장 결과 확인
      expect(저장결과).toBeDefined();
      expect(저장결과.id).toBeDefined();
      expect(저장결과.evaluatorId).toBe(evaluatorId);
      expect(저장결과.message).toBe(
        '1차 하향평가가 성공적으로 저장되었습니다.',
      );

      // Step 2: 저장 직후 대시보드 확인 (미제출 상태)
      const 저장후대시보드 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        )
        .expect(200);

      // 저장 후 검증: isCompleted가 false여야 함
      const 저장후WBS = 저장후대시보드.body.projects
        .flatMap((p: any) => p.wbsList)
        .find((w: any) => w.wbsId === wbsId);

      expect(저장후WBS).toBeDefined();
      expect(저장후WBS.primaryDownwardEvaluation).toBeDefined();
      expect(저장후WBS.primaryDownwardEvaluation.downwardEvaluationId).toBe(
        저장결과.id,
      );
      expect(저장후WBS.primaryDownwardEvaluation.isCompleted).toBe(false);
      expect(저장후WBS.primaryDownwardEvaluation.evaluationContent).toBe(
        '1차 하향평가 내용입니다.',
      );
      expect(저장후WBS.primaryDownwardEvaluation.score).toBe(85);
      // Step 3: 1차 하향평가 제출
      await downwardEvaluationScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId,
        evaluatorId,
      });

      // Step 4: 제출 후 대시보드 확인 (제출 상태)
      // 4-1. getEmployeeAssignedData - WBS별 제출 상태 확인
      const 제출후대시보드 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        )
        .expect(200);

      const 제출후WBS = 제출후대시보드.body.projects
        .flatMap((p: any) => p.wbsList)
        .find((w: any) => w.wbsId === wbsId);

      expect(제출후WBS).toBeDefined();
      expect(제출후WBS.primaryDownwardEvaluation).toBeDefined();
      expect(제출후WBS.primaryDownwardEvaluation.downwardEvaluationId).toBe(
        저장결과.id,
      );
      expect(제출후WBS.primaryDownwardEvaluation.isCompleted).toBe(true);
      expect(제출후WBS.primaryDownwardEvaluation.evaluationContent).toBe(
        '1차 하향평가 내용입니다.',
      );
      expect(제출후WBS.primaryDownwardEvaluation.score).toBe(85);
      expect(제출후WBS.primaryDownwardEvaluation.submittedAt).toBeDefined();

      // summary 검증
      expect(제출후대시보드.body.summary).toBeDefined();
      expect(
        제출후대시보드.body.summary.primaryDownwardEvaluation,
      ).toBeDefined();

      const 직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      expect(직원현황.body.downwardEvaluation).toBeDefined();
      expect(직원현황.body.downwardEvaluation.primary).toBeDefined();

      // 제출 완료 검증
      expect(직원현황.body.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(직원현황.body.downwardEvaluation.primary.assignedWbsCount).toBe(1);
      expect(
        직원현황.body.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(1);

      // status 검증: 제출 후에는 'pending'(승인 대기) 상태여야 함
      expect(직원현황.body.downwardEvaluation.primary.status).toBe('pending');

      // Step 5: 관리자가 1차 하향평가 단계를 승인한다
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${evaluationPeriodId}/employees/${evaluateeId}/primary`,
        )
        .send({
          status: 'approved',
        })
        .expect(200);

      // Step 6: 승인 후 대시보드에서 status가 'approved'로 변경되었는지 확인
      const 승인후직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      // 승인 후 status 검증: 'approved' 상태여야 함
      expect(승인후직원현황.body.downwardEvaluation).toBeDefined();
      expect(승인후직원현황.body.downwardEvaluation.primary).toBeDefined();
      expect(승인후직원현황.body.downwardEvaluation.primary.status).toBe(
        'approved',
      );

      const 전체직원현황 = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .query({ includeUnregistered: 'false' })
        .expect(200);

      const 해당직원현황 = 전체직원현황.body.find(
        (emp: any) => emp.employeeId === evaluateeId,
      );

      expect(해당직원현황).toBeDefined();
      expect(해당직원현황.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(해당직원현황.downwardEvaluation.primary.assignedWbsCount).toBe(1);
      expect(
        해당직원현황.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(1);

      // status 검증: 승인 후에는 'approved' 상태여야 함
      expect(해당직원현황.downwardEvaluation.primary.status).toBe('approved');

      const 통합정보 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/complete-status`,
        )
        .expect(200);

      expect(통합정보.body.primaryDownwardEvaluation).toBeDefined();
      expect(통합정보.body.primaryDownwardEvaluation.totalWbsCount).toBe(1);
      expect(통합정보.body.primaryDownwardEvaluation.completedCount).toBe(1);
      expect(통합정보.body.primaryDownwardEvaluation.isSubmitted).toBe(true);

      // status 검증: 승인 후에는 'approved' 상태여야 함
      expect(통합정보.body.primaryDownwardEvaluation.status).toBe('approved');
      // projects 내 WBS 정보도 확인
      const 통합정보WBS = 통합정보.body.projects.items
        .flatMap((p: any) => p.wbsList)
        .find((w: any) => w.wbsId === wbsId);

      expect(통합정보WBS).toBeDefined();
      expect(통합정보WBS.primaryDownwardEvaluation).toBeDefined();
      expect(통합정보WBS.primaryDownwardEvaluation.downwardEvaluationId).toBe(
        저장결과.id,
      );
      expect(통합정보WBS.primaryDownwardEvaluation.isCompleted).toBe(true);

      const 평가자담당목록 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
        )
        .expect(200);

      const 담당대상자 = 평가자담당목록.body.find(
        (target: any) => target.employeeId === evaluateeId,
      );

      // 담당대상자를 반드시 찾아야 함
      if (!담당대상자) {
        throw new Error(
          `❌ 테스트 실패: 평가자 ${evaluatorId}의 담당대상자 목록에서 피평가자 ${evaluateeId}를 찾을 수 없습니다. ` +
            `응답 직원 수: ${평가자담당목록.body.length}. ` +
            `beforeEach에서 평가라인 설정을 확인해주세요.`,
        );
      }

      // 이 엔드포인트는 primaryStatus 구조를 사용함
      expect(담당대상자.downwardEvaluation.isPrimary).toBe(true);
      expect(담당대상자.downwardEvaluation.primaryStatus).toBeDefined();
      expect(담당대상자.downwardEvaluation.primaryStatus.assignedWbsCount).toBe(
        1,
      );
      expect(
        담당대상자.downwardEvaluation.primaryStatus.completedEvaluationCount,
      ).toBe(1);
    });
  });

  describe('2차 하향평가 저장 및 제출', () => {
    it('2차 하향평가 모든 WBS 평가 완료 시 단계 승인 상태(Step Approval Status)는 pending이 되고 승인 후 approved가 된다', async () => {
      const evaluateeId = employeeIds[0];
      const secondaryEvaluatorId = employeeIds[2]; // 2차 평가자
      const wbsId = wbsItemIds[0];

      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/wbs/${wbsId}/period/${evaluationPeriodId}/secondary-evaluator`,
        )
        .send({
          evaluatorId: secondaryEvaluatorId,
        })
        .expect(201);

      const selfEvaluationResult =
        await downwardEvaluationScenario.하향평가를_위한_자기평가_완료({
          employeeId: evaluateeId,
          wbsItemId: wbsId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 90,
          performanceResult: '성과 결과입니다.',
        });

      // Step 1: 2차 하향평가 저장
      const 저장결과 = await downwardEvaluationScenario.이차하향평가를_저장한다(
        {
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId,
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: selfEvaluationResult.selfEvaluationId,
          downwardEvaluationContent: '2차 하향평가 내용입니다.',
          downwardEvaluationScore: 80,
        },
      );
      // 검증: 저장 결과 확인
      expect(저장결과).toBeDefined();
      expect(저장결과.id).toBeDefined();
      expect(저장결과.evaluatorId).toBe(secondaryEvaluatorId);
      expect(저장결과.message).toBe(
        '2차 하향평가가 성공적으로 저장되었습니다.',
      );

      // Step 2: 저장 직후 대시보드 확인 (미제출 상태)
      const 저장후대시보드 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        )
        .expect(200);

      // 저장 후 검증: isCompleted가 false여야 함
      const 저장후WBS = 저장후대시보드.body.projects
        .flatMap((p: any) => p.wbsList)
        .find((w: any) => w.wbsId === wbsId);

      expect(저장후WBS).toBeDefined();
      expect(저장후WBS.secondaryDownwardEvaluation).toBeDefined();
      expect(저장후WBS.secondaryDownwardEvaluation.downwardEvaluationId).toBe(
        저장결과.id,
      );
      expect(저장후WBS.secondaryDownwardEvaluation.isCompleted).toBe(false);
      expect(저장후WBS.secondaryDownwardEvaluation.evaluationContent).toBe(
        '2차 하향평가 내용입니다.',
      );
      expect(저장후WBS.secondaryDownwardEvaluation.score).toBe(80);
      await downwardEvaluationScenario.이차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId,
        evaluatorId: secondaryEvaluatorId,
      });

      const 제출후대시보드 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        )
        .expect(200);

      const 제출후WBS = 제출후대시보드.body.projects
        .flatMap((p: any) => p.wbsList)
        .find((w: any) => w.wbsId === wbsId);

      expect(제출후WBS).toBeDefined();
      expect(제출후WBS.secondaryDownwardEvaluation).toBeDefined();
      expect(제출후WBS.secondaryDownwardEvaluation.downwardEvaluationId).toBe(
        저장결과.id,
      );
      expect(제출후WBS.secondaryDownwardEvaluation.isCompleted).toBe(true);
      expect(제출후WBS.secondaryDownwardEvaluation.evaluationContent).toBe(
        '2차 하향평가 내용입니다.',
      );
      expect(제출후WBS.secondaryDownwardEvaluation.score).toBe(80);
      expect(제출후WBS.secondaryDownwardEvaluation.submittedAt).toBeDefined();

      // summary 검증
      expect(제출후대시보드.body.summary).toBeDefined();
      expect(
        제출후대시보드.body.summary.secondaryDownwardEvaluation,
      ).toBeDefined();

      const 직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      expect(직원현황.body.downwardEvaluation).toBeDefined();
      expect(직원현황.body.downwardEvaluation.secondary).toBeDefined();

      // 2차 하향평가는 evaluators 배열 구조
      const secondary평가자 =
        직원현황.body.downwardEvaluation.secondary.evaluators[0];
      expect(secondary평가자).toBeDefined();
      expect(secondary평가자.isSubmitted).toBe(true);
      expect(secondary평가자.assignedWbsCount).toBe(1);
      expect(secondary평가자.completedEvaluationCount).toBe(1);

      // status 검증: 제출 후에는 'pending'(승인 대기) 상태여야 함
      expect(secondary평가자.status).toBe('pending');

      // Step 3: 관리자가 2차 하향평가 단계를 승인한다 (평가자별)
      await testSuite
        .request()
        .patch(
          `/admin/step-approvals/${evaluationPeriodId}/employees/${evaluateeId}/secondary/${secondaryEvaluatorId}`,
        )
        .send({
          status: 'approved',
        })
        .expect(200);

      // Step 4: 승인 후 대시보드에서 status가 'approved'로 변경되었는지 확인
      const 승인후직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      // 승인 후 status 검증: 'approved' 상태여야 함
      const 승인후평가자 =
        승인후직원현황.body.downwardEvaluation.secondary.evaluators[0];
      expect(승인후평가자).toBeDefined();
      expect(승인후평가자.status).toBe('approved');

      // 4-3. getAllEmployeesEvaluationPeriodStatus - 전체 직원 목록에서 확인
      const 전체직원현황 = await testSuite
        .request()
        .get(`/admin/dashboard/${evaluationPeriodId}/employees/status`)
        .query({ includeUnregistered: 'false' })
        .expect(200);

      const 해당직원현황 = 전체직원현황.body.find(
        (emp: any) => emp.employeeId === evaluateeId,
      );

      expect(해당직원현황).toBeDefined();
      const 해당직원Secondary평가자 =
        해당직원현황.downwardEvaluation.secondary.evaluators[0];
      expect(해당직원Secondary평가자).toBeDefined();
      expect(해당직원Secondary평가자.isSubmitted).toBe(true);
      expect(해당직원Secondary평가자.assignedWbsCount).toBe(1);
      expect(해당직원Secondary평가자.completedEvaluationCount).toBe(1);

      // status 검증: 승인 후에는 'approved' 상태여야 함
      expect(해당직원Secondary평가자.status).toBe('approved');

      const 통합정보 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/complete-status`,
        )
        .expect(200);

      expect(통합정보.body.secondaryDownwardEvaluation).toBeDefined();
      expect(통합정보.body.secondaryDownwardEvaluation.totalWbsCount).toBe(1);
      expect(통합정보.body.secondaryDownwardEvaluation.completedCount).toBe(1);
      expect(통합정보.body.secondaryDownwardEvaluation.isSubmitted).toBe(true);

      // status 검증: 승인 후에는 'approved' 상태여야 함
      expect(통합정보.body.secondaryDownwardEvaluation.status).toBe('approved');

      // projects 내 WBS 정보도 확인
      const 통합정보WBS = 통합정보.body.projects.items
        .flatMap((p: any) => p.wbsList)
        .find((w: any) => w.wbsId === wbsId);

      expect(통합정보WBS).toBeDefined();
      expect(통합정보WBS.secondaryDownwardEvaluation).toBeDefined();
      expect(통합정보WBS.secondaryDownwardEvaluation.downwardEvaluationId).toBe(
        저장결과.id,
      );
      expect(통합정보WBS.secondaryDownwardEvaluation.isCompleted).toBe(true);

      const 평가자담당목록 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${secondaryEvaluatorId}/status`,
        )
        .expect(200);

      const 담당대상자 = 평가자담당목록.body.find(
        (target: any) => target.employeeId === evaluateeId,
      );

      // 담당대상자를 반드시 찾아야 함
      if (!담당대상자) {
        throw new Error(
          `❌ 테스트 실패: 평가자 ${secondaryEvaluatorId}의 담당대상자 목록에서 피평가자 ${evaluateeId}를 찾을 수 없습니다. ` +
            `응답 직원 수: ${평가자담당목록.body.length}. ` +
            `beforeEach에서 평가라인 설정을 확인해주세요.`,
        );
      }

      // 이 엔드포인트는 secondaryStatus 구조를 사용함
      expect(담당대상자.downwardEvaluation.isSecondary).toBe(true);
      expect(담당대상자.downwardEvaluation.secondaryStatus).toBeDefined();
      expect(
        담당대상자.downwardEvaluation.secondaryStatus.assignedWbsCount,
      ).toBe(1);
      expect(
        담당대상자.downwardEvaluation.secondaryStatus.completedEvaluationCount,
      ).toBe(1);
    });
  });
});
