import { BaseE2ETest } from '../../../base-e2e.spec';
import { DownwardEvaluationScenario } from './downward-evaluation.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { ComplexDownwardEvaluationScenario } from './complex-downward-evaluation.scenario';

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
    it('1차 하향평가 저장 후 제출이 정상적으로 동작한다', async () => {
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

      console.log('✅ 1차 하향평가 저장 후 제출 시나리오 테스트 완료');
    });

    it('2차 하향평가 저장 후 제출이 정상적으로 동작한다', async () => {
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
    it('여러 직원에 대한 1차/2차 하향평가를 순차적으로 처리할 수 있다', async () => {
      console.log('\n=== 여러 직원에 대한 하향평가 순차 처리 테스트 시작 ===');

      const evaluateeIds = [employeeIds[0], employeeIds[3]];
      const evaluatorId = employeeIds[1];
      const results: Array<{
        저장결과: any;
        제출결과: any;
      }> = [];

      // 선행조건: 프로젝트 매니저 설정
      await testSuite
        .getRepository('Project')
        .update(projectIds[0], { managerId: employeeIds[2] });

      for (let i = 0; i < evaluateeIds.length; i++) {
        const evaluateeId = evaluateeIds[i];
        const wbsId = wbsItemIds[i];

        console.log(`\n[직원 ${i + 1}/${evaluateeIds.length}] 처리 중...`);
        console.log(`  피평가자: ${evaluateeId}`);
        console.log(`  WBS: ${wbsId}`);

        // WBS 할당
        try {
          await wbsAssignmentScenario.WBS를_할당한다({
            employeeId: evaluateeId,
            wbsItemId: wbsId,
            projectId: projectIds[0],
            periodId: evaluationPeriodId,
          });
        } catch (error) {
          console.log('  ⚠️ WBS 이미 할당됨');
        }

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
            selfEvaluationContent: `직원 ${i + 1}의 자기평가`,
            selfEvaluationScore: 85 + i * 5,
            performanceResult: `직원 ${i + 1}의 성과`,
          });

        // 1차 하향평가 저장 및 제출
        const result =
          await complexDownwardEvaluationScenario.하향평가_저장_후_제출_시나리오를_실행한다(
            {
              evaluateeId,
              periodId: evaluationPeriodId,
              wbsId,
              evaluatorId,
              evaluatorType: 'primary',
              selfEvaluationId: selfEvaluationResult.selfEvaluationId,
              downwardEvaluationContent: `직원 ${i + 1}에 대한 평가`,
              downwardEvaluationScore: 80 + i * 5,
            },
          );

        results.push(result);
        console.log(`  ✅ 직원 ${i + 1} 처리 완료`);
      }

      // 검증: 모든 평가가 정상적으로 처리되었는지 확인
      expect(results.length).toBe(evaluateeIds.length);
      results.forEach((result, index) => {
        expect(result.저장결과).toBeDefined();
        expect(result.저장결과.id).toBeDefined();
        expect(result.제출결과.isSubmitted).toBe(true);
        console.log(`  ✓ 직원 ${index + 1} 평가 ID: ${result.저장결과.id}`);
      });

      // 평가자별 목록 조회로 전체 검증
      const 평가자목록 =
        await downwardEvaluationScenario.평가자별_하향평가_목록을_조회한다({
          evaluatorId,
          periodId: evaluationPeriodId,
        });

      expect(평가자목록.evaluations.length).toBeGreaterThanOrEqual(
        evaluateeIds.length,
      );
      console.log(
        `\n  ✓ 평가자의 전체 평가 건수: ${평가자목록.evaluations.length}건`,
      );

      console.log('✅ 여러 직원에 대한 하향평가 순차 처리 테스트 완료');
    });
  });
});
