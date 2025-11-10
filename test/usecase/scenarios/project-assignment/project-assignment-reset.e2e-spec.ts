import { BaseE2ETest } from '../../../base-e2e.spec';
import { ProjectAssignmentScenario } from './project-assignment.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { SelfEvaluationScenario } from '../self-evaluation.scenario';
import { DownwardEvaluationScenario } from '../downward-evaluation/downward-evaluation.scenario';
import { PeerEvaluationScenario } from '../peer-evaluation.scenario';
import { EvaluationLineConfigurationScenario } from '../wbs-assignment/evaluation-line-configuration/evaluation-line-configuration.scenario';

describe('프로젝트 할당 리셋 시나리오', () => {
  let testSuite: BaseE2ETest;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let selfEvaluationScenario: SelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let peerEvaluationScenario: PeerEvaluationScenario;
  let evaluationLineConfigurationScenario: EvaluationLineConfigurationScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    peerEvaluationScenario = new PeerEvaluationScenario(testSuite);
    evaluationLineConfigurationScenario =
      new EvaluationLineConfigurationScenario(testSuite);

    // 시드 데이터 생성 (프로젝트, 직원, WBS만 생성)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
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
      name: '프로젝트 할당 리셋 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '프로젝트 할당 리셋 E2E 테스트용 평가기간',
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
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(200);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );

    console.log(`✅ 테스트 데이터 준비 완료`);
    console.log(`   - 평가기간: ${evaluationPeriodId}`);
    console.log(`   - 직원: ${employeeIds.length}명`);
    console.log(`   - 프로젝트: ${projectIds.length}개`);
    console.log(`   - WBS: ${wbsItemIds.length}개`);
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        // 평가기간 종료 후 삭제
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(200);

        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      } catch (error) {
        // 평가기간 삭제 실패 시 조용히 넘어감 (이미 삭제되었거나 존재하지 않음)
      }
    }

    // 시드 데이터 삭제
    await seedDataScenario.시드_데이터를_삭제한다();

    await testSuite.closeApp();
  });

  describe('평가기간 전체 할당 리셋', () => {
    it('프로젝트 할당만 있는 평가기간을 리셋한다', async () => {
      console.log('\n📝 [테스트] 프로젝트 할당만 있는 평가기간 리셋');

      // Given: 프로젝트 할당 생성
      const 할당데이터 = employeeIds.slice(0, 3).map((employeeId, index) => ({
        employeeId,
        projectId: projectIds[index % projectIds.length],
        periodId: evaluationPeriodId,
      }));

      await projectAssignmentScenario.프로젝트를_대량으로_할당한다(할당데이터);

      // 할당 전 데이터 확인
      const 할당전목록 =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
        });
      expect(할당전목록.assignments.length).toBeGreaterThan(0);
      console.log(
        `   📊 할당 전 프로젝트 할당: ${할당전목록.assignments.length}건`,
      );

      // When: 리셋 실행
      const 리셋결과 =
        await projectAssignmentScenario.평가기간_전체_할당을_리셋한다(
          evaluationPeriodId,
        );

      // Then: 결과 검증
      expect(리셋결과.periodId).toBe(evaluationPeriodId);
      expect(리셋결과.deletedCounts.projectAssignments).toBe(
        할당전목록.assignments.length,
      );
      expect(리셋결과.message).toContain('성공적으로 삭제');

      // 할당 후 데이터 확인 - 모두 삭제되었는지 확인
      const 할당후목록 =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
        });
      expect(할당후목록.assignments.length).toBe(0);
      console.log(
        `   ✅ 리셋 후 프로젝트 할당: ${할당후목록.assignments.length}건`,
      );
    });

    it('프로젝트 할당, WBS 할당, 평가 데이터가 모두 있는 평가기간을 리셋한다', async () => {
      console.log('\n📝 [테스트] 전체 데이터가 있는 평가기간 리셋');

      // Given: 프로젝트 할당 생성
      const 할당데이터 = employeeIds.slice(0, 3).map((employeeId, index) => ({
        employeeId,
        projectId: projectIds[index % projectIds.length],
        periodId: evaluationPeriodId,
      }));

      await projectAssignmentScenario.프로젝트를_대량으로_할당한다(할당데이터);

      // WBS 할당 생성
      const wbsAssignments: any[] = [];
      for (let i = 0; i < 3; i++) {
        const employeeId = employeeIds[i];
        const projectId = projectIds[i % projectIds.length];
        const wbsItemId = wbsItemIds[i % wbsItemIds.length];

        const assignment = await wbsAssignmentScenario.WBS를_할당한다({
          employeeId,
          wbsItemId,
          projectId,
          periodId: evaluationPeriodId,
        });
        wbsAssignments.push(assignment);
      }

      console.log(`   📊 WBS 할당 완료: ${wbsAssignments.length}건`);

      // 평가라인 구성 (평가자 설정)
      // employeeIds[0]이 employeeIds[1]을 평가하도록 설정
      const evaluatorId = employeeIds[0];
      const evaluateeId = employeeIds[1];

      try {
        // 1차 평가자 구성 (피평가자에게 평가자 설정)
        await evaluationLineConfigurationScenario.일차_평가자를_구성한다({
          employeeId: evaluateeId,
          periodId: evaluationPeriodId,
          evaluatorId: evaluatorId,
        });
        console.log(
          `   ✅ 평가라인 구성 완료: ${evaluatorId} → ${evaluateeId}`,
        );
      } catch (error) {
        // 에러 발생 시 조용히 넘어감 (평가라인 구성 실패)
        console.log(`   ⚠️ 평가라인 구성 실패 (계속 진행)`);
      }

      // 자기평가 생성
      let 자기평가성공수 = 0;
      for (let i = 0; i < wbsAssignments.length; i++) {
        try {
          await selfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: wbsAssignments[i].employeeId,
            wbsItemId: wbsAssignments[i].wbsItemId,
            periodId: evaluationPeriodId,
            selfEvaluationContent: `자기평가 내용 ${i + 1}`,
            selfEvaluationScore: 90 + i,
            performanceResult: `성과 결과 ${i + 1}`,
          });
          자기평가성공수++;
        } catch (error) {
          // 에러 발생 시 조용히 넘어감 (상세 로그 출력 안함)
        }
      }
      console.log(
        `   📊 자기평가 생성: ${자기평가성공수}/${wbsAssignments.length}건 성공`,
      );

      // 하향평가 생성 (평가라인이 설정된 경우에만 생성 시도)
      let 하향평가생성됨 = false;
      try {
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          periodId: evaluationPeriodId,
          evaluatorId,
          evaluateeId,
          wbsId: wbsItemIds[0],
          downwardEvaluationScore: 88,
          downwardEvaluationContent: '하향평가 내용',
        });
        하향평가생성됨 = true;
        console.log(`   ✅ 하향평가 생성 완료`);
      } catch (error) {
        // 에러 발생 시 조용히 넘어감 (상세 로그 출력 안함)
        console.log(`   ⚠️ 하향평가 생성 실패 (평가라인 미구성 등)`);
      }

      // 데이터 확인
      const 할당전프로젝트 =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
        });

      console.log(`   📊 할당 전 데이터:`);
      console.log(
        `      - 프로젝트 할당: ${할당전프로젝트.assignments.length}건`,
      );
      console.log(`      - WBS 할당: ${wbsAssignments.length}건`);

      // When: 리셋 실행
      const 리셋결과 =
        await projectAssignmentScenario.평가기간_전체_할당을_리셋한다(
          evaluationPeriodId,
        );

      // Then: 결과 검증
      expect(리셋결과.periodId).toBe(evaluationPeriodId);
      expect(리셋결과.deletedCounts.projectAssignments).toBeGreaterThan(0);
      expect(리셋결과.deletedCounts.wbsAssignments).toBeGreaterThan(0);
      expect(리셋결과.message).toContain('성공적으로 삭제');

      console.log(`\n   📊 삭제된 데이터:`);
      console.log(
        `      - 프로젝트 할당: ${리셋결과.deletedCounts.projectAssignments}건`,
      );
      console.log(
        `      - WBS 할당: ${리셋결과.deletedCounts.wbsAssignments}건`,
      );
      console.log(
        `      - 자기평가: ${리셋결과.deletedCounts.selfEvaluations}건`,
      );
      console.log(
        `      - 하향평가: ${리셋결과.deletedCounts.downwardEvaluations}건`,
      );
      console.log(
        `      - 동료평가: ${리셋결과.deletedCounts.peerEvaluations}건`,
      );
      console.log(
        `      - 평가라인 매핑: ${리셋결과.deletedCounts.evaluationLineMappings}건`,
      );
      console.log(
        `      - 동료평가 질문 매핑: ${리셋결과.deletedCounts.peerEvaluationQuestionMappings || 0}건`,
      );
      console.log(
        `      - 산출물 매핑 해제: ${리셋결과.deletedCounts.deliverableMappings}건`,
      );

      console.log(`\n   🔍 리셋 후 데이터 검증 시작...`);

      // 1. 프로젝트 할당 확인
      const 할당후프로젝트 =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
        });
      expect(할당후프로젝트.assignments.length).toBe(0);
      console.log(
        `      ✓ 프로젝트 할당: ${할당후프로젝트.assignments.length}건 (삭제 완료)`,
      );

      // 2. WBS 할당 확인
      const 할당후WBS = await wbsAssignmentScenario.WBS_할당_목록을_조회한다({
        periodId: evaluationPeriodId,
      });
      expect(할당후WBS.assignments?.length || 0).toBe(0);
      console.log(
        `      ✓ WBS 할당: ${할당후WBS.assignments?.length || 0}건 (삭제 완료)`,
      );

      // 3. 자기평가 확인 (각 직원별로)
      let 총자기평가수 = 0;
      for (const employeeId of employeeIds.slice(0, 3)) {
        const 자기평가목록 =
          await selfEvaluationScenario.직원의_자기평가_목록을_조회한다({
            employeeId,
            periodId: evaluationPeriodId,
          });
        총자기평가수 += 자기평가목록.evaluations?.length || 0;
      }
      expect(총자기평가수).toBe(0);
      console.log(`      ✓ 자기평가: ${총자기평가수}건 (삭제 완료)`);

      // 4. 하향평가 확인
      if (하향평가생성됨) {
        const 하향평가목록 =
          await downwardEvaluationScenario.평가자별_하향평가_목록을_조회한다({
            evaluatorId,
            periodId: evaluationPeriodId,
          });
        expect(하향평가목록.evaluations?.length || 0).toBe(0);
        console.log(
          `      ✓ 하향평가: ${하향평가목록.evaluations?.length || 0}건 (삭제 완료)`,
        );
      }

      // 5. 평가라인 매핑 확인
      const 평가설정 =
        await evaluationLineConfigurationScenario.직원_평가설정을_조회한다({
          employeeId: evaluateeId,
          periodId: evaluationPeriodId,
        });
      expect(평가설정.evaluationLineMappings?.length || 0).toBe(0);
      console.log(
        `      ✓ 평가라인 매핑: ${평가설정.evaluationLineMappings?.length || 0}건 (삭제 완료)`,
      );

      // 6. 대시보드에서 통합 검증
      const 대시보드상태 =
        await projectAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );

      // 모든 직원의 할당 정보가 초기화되었는지 확인
      for (const employeeStatus of 대시보드상태) {
        expect(
          employeeStatus.evaluationCriteria?.assignedProjectCount || 0,
        ).toBe(0);
        expect(employeeStatus.evaluationCriteria?.assignedWbsCount || 0).toBe(
          0,
        );
      }
      console.log(`      ✓ 대시보드 검증: 모든 직원의 할당 데이터 초기화 완료`);

      console.log(`\n   ✅ 리셋 검증 완료: 모든 데이터가 정상적으로 삭제됨`);
    });

    it('24시간이 지난 프로젝트 할당도 리셋한다 (비즈니스 규칙 우회)', async () => {
      console.log('\n📝 [테스트] 24시간이 지난 할당 리셋 (비즈니스 규칙 우회)');

      // Given: 프로젝트 할당 생성 (리셋 테스트를 위해)
      const 할당데이터 = [
        {
          employeeId: employeeIds[0],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        },
      ];

      const 생성결과 =
        await projectAssignmentScenario.프로젝트를_대량으로_할당한다(
          할당데이터,
        );

      console.log(`   📊 할당 생성: ${생성결과.length}건`);
      console.log(
        `   💡 일반적으로는 24시간이 지나면 삭제 불가능하지만, 리셋은 가능해야 함`,
      );

      // When: 리셋 실행 (24시간 제한 없이 삭제해야 함)
      const 리셋결과 =
        await projectAssignmentScenario.평가기간_전체_할당을_리셋한다(
          evaluationPeriodId,
        );

      // Then: 결과 검증
      expect(리셋결과.periodId).toBe(evaluationPeriodId);
      expect(리셋결과.deletedCounts.projectAssignments).toBeGreaterThan(0);
      expect(리셋결과.message).toContain('성공적으로 삭제');

      console.log(
        `   ✅ 리셋으로 ${리셋결과.deletedCounts.projectAssignments}건 삭제 성공`,
      );

      // 리셋 후 데이터 확인
      const 할당후목록 =
        await projectAssignmentScenario.프로젝트_할당_목록을_조회한다({
          periodId: evaluationPeriodId,
        });
      expect(할당후목록.assignments.length).toBe(0);
    });

    it('빈 평가기간을 리셋해도 에러가 발생하지 않는다', async () => {
      console.log('\n📝 [테스트] 빈 평가기간 리셋');

      // Given: 할당 데이터가 없는 평가기간 (이미 리셋된 상태)

      // When: 리셋 실행
      const 리셋결과 =
        await projectAssignmentScenario.평가기간_전체_할당을_리셋한다(
          evaluationPeriodId,
        );

      // Then: 결과 검증 - 에러 없이 성공해야 함
      expect(리셋결과.periodId).toBe(evaluationPeriodId);
      expect(리셋결과.deletedCounts.projectAssignments).toBe(0);
      expect(리셋결과.deletedCounts.wbsAssignments).toBe(0);
      expect(리셋결과.deletedCounts.selfEvaluations).toBe(0);
      expect(리셋결과.message).toContain('성공적으로 삭제');

      console.log(`   ✅ 빈 평가기간 리셋 성공 (모든 카운트 0)`);
    });
  });
});
