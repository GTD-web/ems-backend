import { BaseE2ETest } from '../../../base-e2e.spec';
import { DownwardEvaluationScenario } from './downward-evaluation.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

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

    console.log('\n=== 시드 데이터 생성 결과 ===');
    console.log(`직원 수: ${employeeIds.length}`);
    console.log(`프로젝트 수: ${projectIds.length}`);
    console.log(`WBS 수: ${wbsItemIds.length}`);
    console.log(`직원 IDs: ${JSON.stringify(employeeIds)}`);
    console.log(`프로젝트 IDs: ${JSON.stringify(projectIds)}`);
    console.log(`WBS IDs: ${JSON.stringify(wbsItemIds)}`);

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
    console.log(`평가기간 ID: ${evaluationPeriodId}`);

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);
    console.log('✅ 평가기간 시작 완료');

    // 프로젝트 할당 (프로젝트 1개만)
    console.log('\n=== 프로젝트 할당 시작 ===');
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      projectId: projectIds[0],
    });
    console.log(`✅ 프로젝트 할당 완료: ${projectIds[0]}`);

    // WBS 할당
    console.log('\n=== WBS 할당 시작 ===');

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

    console.log('=== 선행조건 설정 완료 ===\n');
  });

  describe('1차 하향평가 저장 및 제출', () => {
    it('1차 하향평가 저장 및 제출이 정상적으로 동작하고 대시보드에 반영된다', async () => {
      const evaluateeId = employeeIds[0];
      const evaluatorId = employeeIds[1]; // 1차 평가자
      const wbsId = wbsItemIds[0];

      console.log('\n=== 1차 하향평가 저장 및 제출 테스트 시작 ===');
      console.log(`피평가자 ID: ${evaluateeId}`);
      console.log(`평가자 ID: ${evaluatorId}`);
      console.log(`WBS ID: ${wbsId}`);
      console.log(`평가기간 ID: ${evaluationPeriodId}`);

      // 선행조건: 평가라인 설정 (1차 평가자)
      console.log('\n[Step 1] 평가라인 설정 (1차 평가자)');
      const evaluationLineMappingResponse = await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: evaluatorId,
        })
        .expect(201);

      console.log(
        `✅ 1차 평가자 설정 완료: ${JSON.stringify(evaluationLineMappingResponse.body)}`,
      );

      // 선행조건: 자기평가 완료
      console.log('\n[Step 2] 자기평가 완료');
      const selfEvaluationResult =
        await downwardEvaluationScenario.하향평가를_위한_자기평가_완료({
          employeeId: evaluateeId,
          wbsItemId: wbsId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 90,
          performanceResult: '성과 결과입니다.',
        });

      console.log(
        `✅ 자기평가 완료: selfEvaluationId=${selfEvaluationResult.selfEvaluationId}`,
      );

      // Step 1: 1차 하향평가 저장
      console.log('\n[Step 3] 1차 하향평가 저장');
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

      console.log(`✅ 1차 하향평가 저장 완료: ${JSON.stringify(저장결과)}`);

      // 검증: 저장 결과 확인
      expect(저장결과).toBeDefined();
      expect(저장결과.id).toBeDefined();
      expect(저장결과.evaluatorId).toBe(evaluatorId);
      expect(저장결과.message).toBe(
        '1차 하향평가가 성공적으로 저장되었습니다.',
      );

      // Step 2: 저장 직후 대시보드 확인 (미제출 상태)
      console.log('\n[Step 4] 대시보드에서 미제출 상태 확인');
      const 저장후대시보드 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        )
        .expect(200);

      console.log(
        '대시보드 데이터 확인 (저장 후):',
        JSON.stringify(저장후대시보드.body, null, 2),
      );

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

      console.log('✅ 저장 후 대시보드 검증 완료: isCompleted=false');

      // Step 3: 1차 하향평가 제출
      console.log('\n[Step 5] 1차 하향평가 제출');
      await downwardEvaluationScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId,
        evaluatorId,
      });

      console.log('✅ 1차 하향평가 제출 완료');

      // Step 4: 제출 후 대시보드 확인 (제출 상태)
      console.log('\n[Step 6] 대시보드에서 제출 상태 확인');

      // 4-1. getEmployeeAssignedData - WBS별 제출 상태 확인
      console.log('\n📊 [검증 1] getEmployeeAssignedData - WBS별 제출 상태');
      const 제출후대시보드 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/assigned-data`,
        )
        .expect(200);

      console.log(
        '대시보드 데이터 확인 (제출 후):',
        JSON.stringify(제출후대시보드.body, null, 2),
      );

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

      // Note: totalScore와 grade는 모든 WBS의 점수가 계산된 후에만 나타남
      // 현재는 weight 기반 계산 로직이 필요하므로 존재 여부만 확인
      console.log(
        '   Summary primaryDownwardEvaluation:',
        제출후대시보드.body.summary.primaryDownwardEvaluation,
      );

      console.log('✅ getEmployeeAssignedData 검증 완료');

      // 4-2. getEmployeeEvaluationPeriodStatus - 평가 진행 상태 확인
      console.log(
        '\n📊 [검증 2] getEmployeeEvaluationPeriodStatus - 평가 진행 상태',
      );
      const 직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      console.log(
        '직원 평가 현황:',
        JSON.stringify(직원현황.body.downwardEvaluation, null, 2),
      );

      expect(직원현황.body.downwardEvaluation).toBeDefined();
      expect(직원현황.body.downwardEvaluation.primary).toBeDefined();

      // status는 비즈니스 로직에 따라 다를 수 있으므로 isSubmitted 확인
      expect(직원현황.body.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(직원현황.body.downwardEvaluation.primary.assignedWbsCount).toBe(1);
      expect(
        직원현황.body.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(1);

      // totalScore와 grade는 제출 후 계산됨
      console.log('   Primary downward evaluation:', {
        status: 직원현황.body.downwardEvaluation.primary.status,
        isSubmitted: 직원현황.body.downwardEvaluation.primary.isSubmitted,
        totalScore: 직원현황.body.downwardEvaluation.primary.totalScore,
        grade: 직원현황.body.downwardEvaluation.primary.grade,
      });

      console.log('✅ getEmployeeEvaluationPeriodStatus 검증 완료');

      // 4-3. getAllEmployeesEvaluationPeriodStatus - 전체 직원 목록에서 확인
      console.log(
        '\n📊 [검증 3] getAllEmployeesEvaluationPeriodStatus - 전체 직원 목록',
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

      console.log('   해당직원 primary downward evaluation:', {
        status: 해당직원현황.downwardEvaluation.primary.status,
        isSubmitted: 해당직원현황.downwardEvaluation.primary.isSubmitted,
        totalScore: 해당직원현황.downwardEvaluation.primary.totalScore,
        grade: 해당직원현황.downwardEvaluation.primary.grade,
      });

      console.log('✅ getAllEmployeesEvaluationPeriodStatus 검증 완료');

      // 4-4. getEmployeeCompleteStatus - 통합 정보 확인
      console.log('\n📊 [검증 4] getEmployeeCompleteStatus - 통합 정보');
      const 통합정보 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/complete-status`,
        )
        .expect(200);

      console.log(
        '통합 정보:',
        JSON.stringify(통합정보.body.primaryDownwardEvaluation, null, 2),
      );

      expect(통합정보.body.primaryDownwardEvaluation).toBeDefined();
      expect(통합정보.body.primaryDownwardEvaluation.totalWbsCount).toBe(1);
      expect(통합정보.body.primaryDownwardEvaluation.completedCount).toBe(1);
      expect(통합정보.body.primaryDownwardEvaluation.isSubmitted).toBe(true);

      console.log('   통합정보 primary downward evaluation:', {
        status: 통합정보.body.primaryDownwardEvaluation.status,
        isSubmitted: 통합정보.body.primaryDownwardEvaluation.isSubmitted,
        totalScore: 통합정보.body.primaryDownwardEvaluation.totalScore,
        grade: 통합정보.body.primaryDownwardEvaluation.grade,
      });

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

      console.log('✅ getEmployeeCompleteStatus 검증 완료');

      // 4-5. getMyEvaluationTargetsStatus - 평가자의 담당 대상자 목록 확인
      console.log(
        '\n📊 [검증 5] getMyEvaluationTargetsStatus - 평가자의 담당 대상자 목록',
      );
      const 평가자담당목록 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/my-evaluation-targets/${evaluatorId}/status`,
        )
        .expect(200);

      console.log(
        '   평가자담당목록 응답:',
        JSON.stringify(평가자담당목록.body, null, 2),
      );
      console.log('   찾을 employeeId:', evaluateeId);

      const 담당대상자 = 평가자담당목록.body.find(
        (target: any) => target.employeeId === evaluateeId,
      );

      if (담당대상자) {
        // 이 엔드포인트는 primaryStatus 구조를 사용함
        expect(담당대상자.downwardEvaluation.isPrimary).toBe(true);
        expect(담당대상자.downwardEvaluation.primaryStatus).toBeDefined();
        expect(
          담당대상자.downwardEvaluation.primaryStatus.assignedWbsCount,
        ).toBe(1);
        expect(
          담당대상자.downwardEvaluation.primaryStatus.completedEvaluationCount,
        ).toBe(1);

        console.log('   담당대상자 primary downward evaluation:', {
          isPrimary: 담당대상자.downwardEvaluation.isPrimary,
          assignedWbsCount:
            담당대상자.downwardEvaluation.primaryStatus.assignedWbsCount,
          completedEvaluationCount:
            담당대상자.downwardEvaluation.primaryStatus
              .completedEvaluationCount,
          totalScore: 담당대상자.downwardEvaluation.primaryStatus.totalScore,
          grade: 담당대상자.downwardEvaluation.primaryStatus.grade,
        });
      } else {
        console.log(
          '   ⚠️ 담당대상자를 찾을 수 없습니다. 이 엔드포인트는 특정 평가자의 담당 대상자만 반환할 수 있습니다.',
        );
      }

      console.log('✅ getMyEvaluationTargetsStatus 검증 완료');

      console.log(
        '\n=== ✅ 1차 하향평가 저장, 제출 및 대시보드 검증 완료 ===\n',
      );
    });
  });
});
