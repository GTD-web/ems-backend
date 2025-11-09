import { BaseE2ETest } from '../../../base-e2e.spec';
import { DownwardEvaluationScenario } from './downward-evaluation.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { ComplexDownwardEvaluationScenario } from './complex-downward-evaluation.scenario';

/**
 * 복합 하향평가 시나리오 E2E 테스트
 * 
 * 📋 테스트 범위:
 * - 여러 WBS가 할당된 복잡한 시나리오
 * - 일부 WBS만 평가한 경우의 상태 관리 (in_progress)
 * - 1차/2차 하향평가 전체 워크플로우
 * - 다양한 직원/평가자 조합
 * 
 * 🎯 특징:
 * - 직원 1명당 WBS 3개 할당 (복잡한 케이스)
 * - 평가 진행 상태(Evaluation Progress Status) 검증
 * - 다중 직원/프로젝트 시나리오
 * 
 * ⚠️ 참고:
 * - 단계 승인 상태 테스트는 downward-evaluation-basic-management.e2e-spec.ts에서 관리
 */
describe('복합 하향평가 시나리오', () => {
  let testSuite: BaseE2ETest;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let complexDownwardEvaluationScenario: ComplexDownwardEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    complexDownwardEvaluationScenario = new ComplexDownwardEvaluationScenario(
      testSuite,
    );
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1,
      employeeCount: 6,
    });

    employeeIds = seedResult.employeeIds || [];
    projectIds = seedResult.projectIds || [];
    wbsItemIds = seedResult.wbsItemIds || [];

    console.log('\n=== 시드 데이터 생성 결과 ===');
    console.log(`직원 수: ${employeeIds.length}`);
    console.log(`프로젝트 수: ${projectIds.length}`);
    console.log(`WBS 수: ${wbsItemIds.length}`);

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
      name: '복합 하향평가 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '복합 하향평가 E2E 테스트용 평가기간',
      maxSelfEvaluationRate: 120,
      gradeRanges: [
        { grade: 'S', minRange: 90, maxRange: 100 },
        { grade: 'A', minRange: 80, maxRange: 89 },
        { grade: 'B', minRange: 70, maxRange: 79 },
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

    // 선행조건: 직원 간 관리자 관계 설정 (2차 하향평가를 위해 필요)
    console.log('\n=== 직원 관계 설정 시작 ===');
    // employeeIds[1]을 employeeIds[0], [3], [4], [5]의 관리자로 설정
    for (const empId of [
      employeeIds[0],
      employeeIds[3],
      employeeIds[4],
      employeeIds[5],
    ]) {
      if (empId && empId !== employeeIds[1]) {
        await testSuite
          .getRepository('Employee')
          .update(empId, { managerId: employeeIds[1] });
      }
    }
    console.log(`✅ 관리자 관계 설정 완료 (관리자: ${employeeIds[1]})`);

    // 선행조건: 프로젝트 매니저 설정 (2차 하향평가를 위해 필요)
    await testSuite
      .getRepository('Project')
      .update(projectIds[0], { managerId: employeeIds[2] });
    console.log(`✅ 프로젝트 매니저 설정 완료 (매니저: ${employeeIds[2]})`);

    // 선행조건: 프로젝트 할당 (여러 직원에게)
    console.log('\n=== 프로젝트 할당 시작 ===');
    const targetEmployees = [employeeIds[0], employeeIds[3], employeeIds[4]];
    for (const empId of targetEmployees) {
      if (empId) {
        await projectAssignmentScenario.프로젝트를_할당한다({
          employeeId: empId,
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        });
        console.log(`  ✅ 프로젝트 할당 완료: ${empId}`);
      }
    }

    // 선행조건: WBS 할당 (여러 직원에게 각각 WBS 할당)
    console.log('\n=== WBS 할당 시작 ===');
    // employeeIds[0]에게 3개의 WBS 할당
    for (let i = 0; i < 3 && i < wbsItemIds.length; i++) {
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[i],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });
      console.log(`  ✅ WBS 할당 완료 (${employeeIds[0]}): ${wbsItemIds[i]}`);
    }

    // employeeIds[3]에게 WBS 할당 (다른 피평가자 시나리오용)
    if (employeeIds[3] && wbsItemIds[3]) {
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[3],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });
      console.log(`  ✅ WBS 할당 완료 (${employeeIds[3]}): ${wbsItemIds[3]}`);
    }

    // employeeIds[4]에게 WBS 할당 (다른 피평가자 시나리오용)
    if (employeeIds[4] && wbsItemIds[4]) {
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[4],
        wbsItemId: wbsItemIds[4],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });
      console.log(`  ✅ WBS 할당 완료 (${employeeIds[4]}): ${wbsItemIds[4]}`);
    }

    console.log('=== 선행조건 설정 완료 ===');
  });

  describe('하향평가 저장 후 제출 시나리오', () => {
    it('1차 하향평가 일부 WBS만 평가 시 in_progress 상태가 된다', async () => {
      const evaluateeId = employeeIds[0];
      const evaluatorId = employeeIds[1];
      const wbsId = wbsItemIds[0];

      console.log('\n=== 1차 하향평가 저장 후 제출 시나리오 테스트 시작 ===');

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

      // 테스트: 1차 하향평가 저장 후 제출 시나리오 실행
      const result =
        await complexDownwardEvaluationScenario.하향평가_저장_후_제출_시나리오를_실행한다(
          {
            evaluateeId,
            periodId: evaluationPeriodId,
            wbsId,
            evaluatorId,
            evaluatorType: 'primary',
            selfEvaluationId: selfEvaluationResult.selfEvaluationId,
            downwardEvaluationContent: '1차 하향평가 내용입니다.',
            downwardEvaluationScore: 85,
          },
        );

      // 검증
      expect(result.저장결과).toBeDefined();
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBe(evaluatorId);
      expect(result.제출결과).toBeDefined();
      expect(result.제출결과.isSubmitted).toBe(true);

      // 대시보드에서 status 확인
      const 직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      expect(직원현황.body.downwardEvaluation).toBeDefined();
      expect(직원현황.body.downwardEvaluation.primary).toBeDefined();

      // ⚠️ 중요: employeeIds[0]에게는 3개의 WBS가 할당되었지만 1개만 평가했으므로
      // status는 'in_progress'가 되어야 함 (completedEvaluationCount < assignedWbsCount)
      expect(직원현황.body.downwardEvaluation.primary.status).toBe(
        'in_progress',
      );
      expect(직원현황.body.downwardEvaluation.primary.assignedWbsCount).toBe(3);
      expect(
        직원현황.body.downwardEvaluation.primary.completedEvaluationCount,
      ).toBe(1);

      console.log('✅ 1차 하향평가 저장 후 제출 시나리오 테스트 완료');
    });

    it('2차 하향평가 일부 WBS만 평가 시 in_progress 상태가 된다', async () => {
      const evaluateeId = employeeIds[0];
      const primaryEvaluatorId = employeeIds[1];
      const secondaryEvaluatorId = employeeIds[2];
      const wbsId = wbsItemIds[0];

      console.log('\n=== 2차 하향평가 저장 후 제출 시나리오 테스트 시작 ===');

      // 선행조건: 평가라인 설정 (1차 평가자)
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
        )
        .send({
          evaluatorId: primaryEvaluatorId,
        })
        .expect(201);

      // 선행조건: 평가라인 설정 (2차 평가자)
      await testSuite
        .request()
        .post(
          `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/wbs/${wbsId}/period/${evaluationPeriodId}/secondary-evaluator`,
        )
        .send({
          evaluatorId: secondaryEvaluatorId,
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

      // 테스트: 2차 하향평가 저장 후 제출 시나리오 실행
      const result =
        await complexDownwardEvaluationScenario.하향평가_저장_후_제출_시나리오를_실행한다(
          {
            evaluateeId,
            periodId: evaluationPeriodId,
            wbsId,
            evaluatorId: secondaryEvaluatorId,
            evaluatorType: 'secondary',
            selfEvaluationId: selfEvaluationResult.selfEvaluationId,
            downwardEvaluationContent: '2차 하향평가 내용입니다.',
            downwardEvaluationScore: 80,
          },
        );

      // 검증
      expect(result.저장결과).toBeDefined();
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBe(secondaryEvaluatorId);
      expect(result.제출결과).toBeDefined();
      expect(result.제출결과.isSubmitted).toBe(true);

      // 대시보드에서 status 확인
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
        직원현황.body.downwardEvaluation.secondary.evaluators.find(
          (e: any) => e.evaluator.id === secondaryEvaluatorId,
        );

      expect(secondary평가자).toBeDefined();

      // 실제 데이터 로그로 확인
      console.log(`\n  📊 2차 평가자 (${secondaryEvaluatorId}) 상태 확인:`);
      console.log(`     status: ${secondary평가자.status}`);
      console.log(`     assignedWbsCount: ${secondary평가자.assignedWbsCount}`);
      console.log(
        `     completedEvaluationCount: ${secondary평가자.completedEvaluationCount}`,
      );
      console.log(`     isSubmitted: ${secondary평가자.isSubmitted}`);

      // ⚠️ employeeIds[0]에게는 3개의 WBS가 할당되었지만 1개만 평가했으므로
      // status는 'in_progress'가 되어야 함
      expect(secondary평가자.assignedWbsCount).toBeGreaterThan(1);
      expect(secondary평가자.completedEvaluationCount).toBeGreaterThan(0);
      expect(secondary평가자.completedEvaluationCount).toBeLessThan(
        secondary평가자.assignedWbsCount,
      );
      expect(secondary평가자.status).toBe('in_progress');

      console.log('✅ 2차 하향평가 저장 후 제출 시나리오 테스트 완료');
    });
  });

  describe('하향평가 관리 전체 시나리오', () => {
    it('1차/2차 하향평가와 목록 조회가 모두 정상적으로 동작한다', async () => {
      const evaluateeId = employeeIds[0];
      const evaluatorId = employeeIds[1];

      console.log('\n=== 하향평가 관리 전체 시나리오 테스트 시작 ===');

      // 선행조건: 프로젝트 매니저 설정 (2차 평가자를 위해)
      await testSuite
        .getRepository('Project')
        .update(projectIds[0], { managerId: employeeIds[2] });

      // 테스트: 하향평가 관리 전체 시나리오 실행
      const result =
        await complexDownwardEvaluationScenario.하향평가_관리_전체_시나리오를_실행한다(
          {
            evaluationPeriodId,
            employeeIds,
            projectIds,
            wbsItemIds,
            evaluatorId,
            evaluateeId,
          },
        );

      // 검증: 1차 하향평가 결과
      expect(result.일차하향평가결과).toBeDefined();
      expect(result.일차하향평가결과.하향평가저장).toBeDefined();
      expect(result.일차하향평가결과.하향평가저장.id).toBeDefined();
      expect(result.일차하향평가결과.하향평가제출).toBeDefined();
      expect(result.일차하향평가결과.하향평가제출.isSubmitted).toBe(true);

      console.log(
        `  ✓ 1차 하향평가 ID: ${result.일차하향평가결과.하향평가저장.id}`,
      );

      // 검증: 2차 하향평가 결과
      expect(result.이차하향평가결과).toBeDefined();
      expect(result.이차하향평가결과.하향평가저장).toBeDefined();
      expect(result.이차하향평가결과.하향평가저장.id).toBeDefined();
      expect(result.이차하향평가결과.하향평가제출).toBeDefined();
      expect(result.이차하향평가결과.하향평가제출.isSubmitted).toBe(true);

      console.log(
        `  ✓ 2차 하향평가 ID: ${result.이차하향평가결과.하향평가저장.id}`,
      );

      // 검증: 평가자별 목록 조회
      expect(result.평가자별목록조회).toBeDefined();
      expect(result.평가자별목록조회.evaluations).toBeDefined();
      expect(Array.isArray(result.평가자별목록조회.evaluations)).toBe(true);
      expect(result.평가자별목록조회.evaluations.length).toBeGreaterThan(0);

      console.log(
        `  ✓ 평가자별 목록 조회 결과: ${result.평가자별목록조회.evaluations.length}건`,
      );

      // 검증: 피평가자별 목록 조회
      expect(result.피평가자별목록조회).toBeDefined();
      expect(result.피평가자별목록조회.evaluations).toBeDefined();
      expect(Array.isArray(result.피평가자별목록조회.evaluations)).toBe(true);
      expect(result.피평가자별목록조회.evaluations.length).toBeGreaterThan(0);

      console.log(
        `  ✓ 피평가자별 목록 조회 결과: ${result.피평가자별목록조회.evaluations.length}건`,
      );

      // 검증: 1차 필터링 조회
      expect(result.일차필터링조회).toBeDefined();
      expect(result.일차필터링조회.evaluations).toBeDefined();
      expect(Array.isArray(result.일차필터링조회.evaluations)).toBe(true);

      console.log(
        `  ✓ 1차 필터링 조회 결과: ${result.일차필터링조회.evaluations.length}건`,
      );

      // 검증: 2차 필터링 조회
      expect(result.이차필터링조회).toBeDefined();
      expect(result.이차필터링조회.evaluations).toBeDefined();
      expect(Array.isArray(result.이차필터링조회.evaluations)).toBe(true);

      console.log(
        `  ✓ 2차 필터링 조회 결과: ${result.이차필터링조회.evaluations.length}건`,
      );

      // 검증: 대시보드 status 확인
      const 직원현황 = await testSuite
        .request()
        .get(
          `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
        )
        .expect(200);

      expect(직원현황.body.downwardEvaluation).toBeDefined();
      expect(직원현황.body.downwardEvaluation.primary).toBeDefined();

      // ⚠️ 중요: employeeIds[0]에게는 3개의 WBS가 할당되었지만
      // 전체 시나리오에서는 2개만 평가했으므로 (wbsItemIds[0]는 1차, wbsItemIds[1]는 2차)
      // 1차 평가자 입장에서는 3개 중 1개만 평가 → in_progress
      console.log(
        `\n  📊 1차 하향평가 상태: ${직원현황.body.downwardEvaluation.primary.status}`,
      );
      console.log(
        `     할당 WBS: ${직원현황.body.downwardEvaluation.primary.assignedWbsCount}개`,
      );
      console.log(
        `     완료 평가: ${직원현황.body.downwardEvaluation.primary.completedEvaluationCount}개`,
      );

      expect(직원현황.body.downwardEvaluation.primary.status).toBe(
        'in_progress',
      );
      expect(직원현황.body.downwardEvaluation.primary.assignedWbsCount).toBe(3);

      console.log('✅ 하향평가 관리 전체 시나리오 테스트 완료');
    });
  });

  describe('다른 피평가자 하향평가 저장 시나리오', () => {
    it('다른 피평가자로 1차 하향평가를 저장할 수 있다', async () => {
      const evaluatorId = employeeIds[1];
      const excludeEmployeeIds = [employeeIds[0], evaluatorId];

      console.log(
        '\n=== 다른 피평가자로 1차 하향평가 저장 시나리오 테스트 시작 ===',
      );
      console.log(`평가자 ID: ${evaluatorId}`);
      console.log(`제외할 직원 IDs: ${excludeEmployeeIds.join(', ')}`);

      // 테스트: 다른 피평가자로 1차 하향평가 저장 시나리오 실행
      const result =
        await complexDownwardEvaluationScenario.다른_피평가자로_일차하향평가_저장_시나리오를_실행한다(
          {
            evaluationPeriodId,
            employeeIds,
            wbsItemIds,
            projectIds,
            evaluatorId,
            excludeEmployeeIds,
          },
        );

      // 검증
      expect(result.저장결과).toBeDefined();
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBe(evaluatorId);
      expect(result.저장결과.message).toContain('1차 하향평가');

      console.log(`  ✓ 저장된 평가 ID: ${result.저장결과.id}`);
      console.log('✅ 다른 피평가자로 1차 하향평가 저장 시나리오 테스트 완료');
    });

    it('다른 피평가자로 2차 하향평가를 저장할 수 있다', async () => {
      const excludeEmployeeIds = [employeeIds[0], employeeIds[1]];

      console.log(
        '\n=== 다른 피평가자로 2차 하향평가 저장 시나리오 테스트 시작 ===',
      );
      console.log(`제외할 직원 IDs: ${excludeEmployeeIds.join(', ')}`);

      // 선행조건: 프로젝트 매니저 설정
      await testSuite
        .getRepository('Project')
        .update(projectIds[0], { managerId: employeeIds[2] });

      // 테스트: 다른 피평가자로 2차 하향평가 저장 시나리오 실행
      const result =
        await complexDownwardEvaluationScenario.다른_피평가자로_이차하향평가_저장_시나리오를_실행한다(
          {
            evaluationPeriodId,
            employeeIds,
            wbsItemIds,
            projectIds,
            excludeEmployeeIds,
          },
        );

      // 검증
      expect(result.저장결과).toBeDefined();
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBeDefined();
      expect(result.저장결과.message).toContain('2차 하향평가');

      console.log(`  ✓ 저장된 평가 ID: ${result.저장결과.id}`);
      console.log(`  ✓ 평가자 ID: ${result.저장결과.evaluatorId}`);
      console.log('✅ 다른 피평가자로 2차 하향평가 저장 시나리오 테스트 완료');
    });
  });

  describe('복합 시나리오 조합 테스트', () => {
    describe('평가 진행 상태 (Evaluation Progress Status)', () => {
      it('1차 하향평가 일부 WBS만 평가 시 평가 진행 상태(Evaluation Progress Status)는 in_progress가 된다', async () => {
        console.log(
          '\n=== 1차 하향평가 일부 WBS만 평가 시 평가 진행 상태 테스트 시작 ===',
        );

        const evaluateeId = employeeIds[0]; // beforeEach에서 3개 WBS 할당됨
        const evaluatorId = employeeIds[1];
        const wbsId = wbsItemIds[0];

        // 선행조건: 프로젝트 매니저 설정
        await testSuite
          .getRepository('Project')
          .update(projectIds[0], { managerId: employeeIds[2] });

        // 평가라인 설정
        await testSuite
          .request()
          .post(
            `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
          )
          .send({
            evaluatorId,
          })
          .expect(201);

        // 자기평가 완료
        const selfEvaluationResult =
          await downwardEvaluationScenario.하향평가를_위한_자기평가_완료({
            employeeId: evaluateeId,
            wbsItemId: wbsId,
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
            performanceResult: '성과 결과',
          });

        // 1차 하향평가 저장 및 제출 (1개만 평가)
        const result =
          await complexDownwardEvaluationScenario.하향평가_저장_후_제출_시나리오를_실행한다(
            {
              evaluateeId,
              periodId: evaluationPeriodId,
              wbsId,
              evaluatorId,
              evaluatorType: 'primary',
              selfEvaluationId: selfEvaluationResult.selfEvaluationId,
              downwardEvaluationContent: '1차 하향평가 내용',
              downwardEvaluationScore: 80,
            },
          );

        // 검증: 저장 및 제출 성공
        expect(result.저장결과).toBeDefined();
        expect(result.저장결과.id).toBeDefined();
        expect(result.제출결과.isSubmitted).toBe(true);

        // 대시보드 상태 확인
        const 직원현황 = await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/employees/${evaluateeId}/status`,
          )
          .expect(200);

        expect(직원현황.body.downwardEvaluation).toBeDefined();
        expect(직원현황.body.downwardEvaluation.primary).toBeDefined();

        const assignedCount =
          직원현황.body.downwardEvaluation.primary.assignedWbsCount;
        const completedCount =
          직원현황.body.downwardEvaluation.primary.completedEvaluationCount;
        const status = 직원현황.body.downwardEvaluation.primary.status;

        console.log(`\n  📊 평가 진행 상태 확인:`);
        console.log(`     할당 WBS: ${assignedCount}개`);
        console.log(`     완료 평가: ${completedCount}개`);
        console.log(`     평가 진행 상태 (Evaluation Progress): ${status}`);

        // ⚠️ 중요: 3개 WBS 중 1개만 평가 완료
        // → 평가 진행 상태 = 'in_progress' (일부만 완료)
        expect(assignedCount).toBe(3);
        expect(completedCount).toBe(1);
        expect(completedCount).toBeLessThan(assignedCount);
        expect(status).toBe('in_progress');

        console.log(
          '✅ 1차 하향평가 일부 WBS만 평가 시 평가 진행 상태 테스트 완료',
        );
      });
    });

    // ⚠️ 단계 승인 상태 테스트는 downward-evaluation-basic-management.e2e-spec.ts에서 관리합니다.
    // - 1차/2차 하향평가 저장, 제출, 승인 프로세스
    // - pending → approved 상태 전환 검증
  });
});
