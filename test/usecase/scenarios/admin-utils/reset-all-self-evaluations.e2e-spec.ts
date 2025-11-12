import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { WbsSelfEvaluationApiClient } from '../api-clients/wbs-self-evaluation.api-client';
import { DownwardEvaluationApiClient } from '../api-clients/downward-evaluation.api-client';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { EvaluationLineApiClient } from '../api-clients/evaluation-line.api-client';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

/**
 * 모든 자기평가 리셋 검증 시나리오
 *
 * 테스트 목적:
 * - 모든 자기평가를 한 번에 리셋하는 기능 검증
 * - 자기평가에 연결된 하향평가도 함께 삭제되는지 확인
 * - 리셋 후 조회 시 제외되는지 확인
 * - 리셋 후 새로운 자기평가 생성이 가능한지 확인
 */
describe('모든 자기평가 리셋 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let wbsSelfEvaluationApiClient: WbsSelfEvaluationApiClient;
  let downwardEvaluationApiClient: DownwardEvaluationApiClient;
  let evaluationLineApiClient: EvaluationLineApiClient;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 및 API 클라이언트 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    wbsSelfEvaluationApiClient = new WbsSelfEvaluationApiClient(testSuite);
    downwardEvaluationApiClient = new DownwardEvaluationApiClient(testSuite);
    evaluationLineApiClient = new EvaluationLineApiClient(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    console.log('\n========== 테스트 데이터 준비 ==========');

    // 시드 데이터 생성
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
      employeeIds.length < 2 ||
      projectIds.length < 1 ||
      wbsItemIds.length < 2
    ) {
      throw new Error(
        '시드 데이터 생성 실패: 직원 2명 이상, 프로젝트 1개 이상, WBS 2개 이상 필요',
      );
    }

    // 평가기간 생성 및 시작
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '자기평가 리셋 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '자기평가 리셋 E2E 테스트용 평가기간',
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

    console.log(`✅ 평가기간 생성 및 시작: ${evaluationPeriodId}`);

    // 평가 대상자 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds.slice(0, 2),
    );

    console.log(`✅ 평가 대상자 2명 등록`);

    // 프로젝트 할당
    const projectId = projectIds[0];
    for (const employeeId of employeeIds.slice(0, 2)) {
      await projectAssignmentScenario.프로젝트를_할당한다({
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
      });
    }

    console.log(`✅ 프로젝트 할당 완료`);

    // WBS 할당
    for (const employeeId of employeeIds.slice(0, 2)) {
      for (const wbsItemId of wbsItemIds.slice(0, 2)) {
        await wbsAssignmentScenario.WBS를_할당한다({
          employeeId,
          wbsItemId,
          projectId,
          periodId: evaluationPeriodId,
        });
      }
    }

    console.log(`✅ WBS 할당 완료`);

    // 1차 평가자 구성
    await evaluationLineApiClient.configurePrimaryEvaluator({
      employeeId: employeeIds[0],
      periodId: evaluationPeriodId,
      evaluatorId: employeeIds[1],
    });

    await evaluationLineApiClient.configurePrimaryEvaluator({
      employeeId: employeeIds[1],
      periodId: evaluationPeriodId,
      evaluatorId: employeeIds[0],
    });

    console.log(`✅ 1차 평가자 구성 완료`);
    console.log('========== 테스트 데이터 준비 완료 ==========\n');
  });

  afterEach(async () => {
    console.log('\n========== 테스트 데이터 정리 ==========');

    try {
      // 시드 데이터 삭제 (평가기간도 함께 삭제됨)
      await seedDataScenario.시드_데이터를_삭제한다();
      console.log('✅ 시드 데이터 삭제 완료');
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }

    console.log('========== 테스트 데이터 정리 완료 ==========\n');
  });

  describe('성공 케이스', () => {
    it('여러 자기평가가 있을 때 모두 리셋할 수 있어야 한다', async () => {
      console.log('\n📍 모든 자기평가 리셋 테스트 시작');

      // Given: 여러 자기평가 생성
      const selfEvaluations: any[] = [];

      for (const employeeId of employeeIds.slice(0, 2)) {
        for (const wbsItemId of wbsItemIds.slice(0, 2)) {
          const selfEval =
            await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation({
              employeeId,
              wbsItemId,
              periodId: evaluationPeriodId,
              selfEvaluationContent: `자기평가 내용 - ${employeeId} - ${wbsItemId}`,
              selfEvaluationScore: 90,
              performanceResult: '우수한 성과',
            });

          selfEvaluations.push(selfEval);
          console.log(`✅ 자기평가 생성: ${selfEval.id}`);
        }
      }

      expect(selfEvaluations.length).toBeGreaterThanOrEqual(4);
      console.log(`📊 생성된 자기평가 개수: ${selfEvaluations.length}`);

      // 리셋 전 목록 조회
      const beforeResetEmployee1 =
        await wbsSelfEvaluationApiClient.getEmployeeSelfEvaluations(
          employeeIds[0],
          { periodId: evaluationPeriodId },
        );

      expect(beforeResetEmployee1.evaluations.length).toBeGreaterThan(0);
      console.log(
        `📊 리셋 전 직원1 자기평가 개수: ${beforeResetEmployee1.evaluations.length}`,
      );

      // When: 모든 자기평가 리셋
      const resetResult = await wbsSelfEvaluationApiClient.resetAll();

      console.log('✅ 모든 자기평가 리셋 완료');
      console.log(
        `   - 삭제된 자기평가: ${resetResult.deletedCounts.selfEvaluations}개`,
      );
      console.log(
        `   - 삭제된 하향평가: ${resetResult.deletedCounts.downwardEvaluations}개`,
      );

      // Then: 응답 검증
      expect(resetResult.deletedCounts).toBeDefined();
      expect(resetResult.deletedCounts.selfEvaluations).toBeGreaterThanOrEqual(
        selfEvaluations.length,
      );
      expect(resetResult.message).toContain('모든 자기평가 리셋 완료');

      // Then: 리셋 후 목록 조회 시 빈 배열 반환
      const afterResetEmployee1 =
        await wbsSelfEvaluationApiClient.getEmployeeSelfEvaluations(
          employeeIds[0],
          { periodId: evaluationPeriodId },
        );

      expect(afterResetEmployee1.evaluations).toBeDefined();
      expect(afterResetEmployee1.evaluations.length).toBe(0);

      console.log(
        `📊 리셋 후 직원1 자기평가 개수: ${afterResetEmployee1.evaluations.length}`,
      );
    });

    it('자기평가에 연결된 하향평가도 함께 삭제되어야 한다', async () => {
      console.log('\n📍 자기평가 + 하향평가 연계 삭제 테스트 시작');

      // Given: 자기평가 생성 및 1차 평가자에게 제출
      const employeeId = employeeIds[0];
      const wbsItemId = wbsItemIds[0];
      const evaluatorId = employeeIds[1];

      // 자기평가 생성
      const selfEval = await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation(
        {
          employeeId,
          wbsItemId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        },
      );

      console.log(`✅ 자기평가 생성: ${selfEval.id}`);

      // 자기평가 제출 (피평가자 → 1차 평가자)
      await wbsSelfEvaluationApiClient.submitWbsSelfEvaluationToEvaluator(
        selfEval.id,
      );
      console.log(`✅ 자기평가 제출 (피평가자 → 1차 평가자)`);

      // 1차 하향평가 생성 (1차 평가자가 작성)
      // beforeEach에서 이미 평가자 구성이 완료되었으므로 바로 생성
      const downwardEval = await downwardEvaluationApiClient.upsertPrimary({
        evaluatorId,
        evaluateeId: employeeId,
        wbsId: wbsItemId,
        periodId: evaluationPeriodId,
        selfEvaluationId: selfEval.id,
        downwardEvaluationContent: '하향평가 내용',
        downwardEvaluationScore: 80,
      });

      console.log(`✅ 하향평가 생성: ${downwardEval.id}`);

      // 리셋 전 확인
      const beforeResetSelfEval =
        await wbsSelfEvaluationApiClient.getWbsSelfEvaluationDetail(
          selfEval.id,
        );
      expect(beforeResetSelfEval.id).toBe(selfEval.id);

      // 하향평가 조회 (목록에서 확인)
      const downwardEvalsBeforeReset =
        await downwardEvaluationApiClient.getByEvaluator({
          evaluatorId,
          periodId: evaluationPeriodId,
        });

      const foundDownwardEval = downwardEvalsBeforeReset.evaluations.find(
        (e: any) => e.id === downwardEval.id,
      );
      expect(foundDownwardEval).toBeDefined();

      console.log(`📊 리셋 전 자기평가 존재 확인: ${beforeResetSelfEval.id}`);
      console.log(`📊 리셋 전 하향평가 존재 확인: ${foundDownwardEval.id}`);

      // When: 모든 자기평가 리셋
      const resetResult = await wbsSelfEvaluationApiClient.resetAll();

      console.log('✅ 모든 자기평가 리셋 완료');
      console.log(
        `   - 삭제된 자기평가: ${resetResult.deletedCounts.selfEvaluations}개`,
      );
      console.log(
        `   - 삭제된 하향평가: ${resetResult.deletedCounts.downwardEvaluations}개`,
      );

      // Then: 자기평가와 하향평가 모두 삭제 확인
      expect(resetResult.deletedCounts.selfEvaluations).toBeGreaterThanOrEqual(
        1,
      );
      expect(
        resetResult.deletedCounts.downwardEvaluations,
      ).toBeGreaterThanOrEqual(1);

      // Then: 리셋 후 조회 시 빈 목록 반환
      const afterResetSelfEvals =
        await wbsSelfEvaluationApiClient.getEmployeeSelfEvaluations(
          employeeId,
          { periodId: evaluationPeriodId },
        );
      expect(afterResetSelfEvals.evaluations.length).toBe(0);

      const afterResetDownwardEvals =
        await downwardEvaluationApiClient.getByEvaluator({
          evaluatorId,
          periodId: evaluationPeriodId,
        });

      const afterResetFoundDownward = afterResetDownwardEvals.evaluations.find(
        (e: any) => e.id === downwardEval.id,
      );
      expect(afterResetFoundDownward).toBeUndefined();

      console.log('✅ 리셋 후 자기평가 목록이 비어있음 확인');
      console.log('✅ 리셋 후 하향평가가 삭제됨 확인');
    });

    it('자기평가가 없을 때도 리셋이 성공해야 한다', async () => {
      console.log('\n📍 빈 데이터 리셋 테스트 시작');

      // Given: 자기평가 없음 (beforeEach에서 생성하지 않음)

      // When: 모든 자기평가 리셋
      const resetResult = await wbsSelfEvaluationApiClient.resetAll();

      console.log('✅ 빈 데이터 리셋 완료');
      console.log(
        `   - 삭제된 자기평가: ${resetResult.deletedCounts.selfEvaluations}개`,
      );
      console.log(
        `   - 삭제된 하향평가: ${resetResult.deletedCounts.downwardEvaluations}개`,
      );

      // Then: 응답 검증
      expect(resetResult.deletedCounts).toBeDefined();
      expect(resetResult.deletedCounts.selfEvaluations).toBe(0);
      expect(resetResult.deletedCounts.downwardEvaluations).toBe(0);
      expect(resetResult.message).toContain('모든 자기평가 리셋 완료');
    });

    it('리셋 후 새로운 자기평가 생성이 가능해야 한다', async () => {
      console.log('\n📍 리셋 후 재생성 테스트 시작');

      // Given: 자기평가 생성
      const employeeId = employeeIds[0];
      const wbsItemId = wbsItemIds[0];

      const firstSelfEval =
        await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation({
          employeeId,
          wbsItemId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '첫 번째 자기평가',
          selfEvaluationScore: 85,
        });

      console.log(`✅ 첫 번째 자기평가 생성: ${firstSelfEval.id}`);

      // When: 모든 자기평가 리셋
      await wbsSelfEvaluationApiClient.resetAll();
      console.log('✅ 모든 자기평가 리셋 완료');

      // Then: 리셋 후 새로운 자기평가 생성 가능
      const secondSelfEval =
        await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation({
          employeeId,
          wbsItemId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '두 번째 자기평가',
          selfEvaluationScore: 90,
        });

      console.log(`✅ 두 번째 자기평가 생성: ${secondSelfEval.id}`);

      expect(secondSelfEval.id).toBeDefined();
      expect(secondSelfEval.id).not.toBe(firstSelfEval.id);
      expect(secondSelfEval.selfEvaluationContent).toBe('두 번째 자기평가');
      expect(secondSelfEval.selfEvaluationScore).toBe(90);

      // 목록 조회로 재확인
      const selfEvaluations =
        await wbsSelfEvaluationApiClient.getEmployeeSelfEvaluations(
          employeeId,
          {
            periodId: evaluationPeriodId,
          },
        );

      expect(selfEvaluations.evaluations.length).toBe(1);
      expect(selfEvaluations.evaluations[0].id).toBe(secondSelfEval.id);

      console.log(
        `📊 리셋 후 재생성된 자기평가 개수: ${selfEvaluations.evaluations.length}`,
      );
    });

    it('여러 평가기간의 자기평가가 모두 리셋되어야 한다', async () => {
      console.log('\n📍 다중 평가기간 리셋 테스트 시작');

      // Given: 두 번째 평가기간 생성 (날짜 범위가 겹치지 않도록 설정)
      const today2 = new Date();
      today2.setMonth(today2.getMonth() + 2); // 2개월 후 시작
      const nextMonth2 = new Date(today2);
      nextMonth2.setMonth(today2.getMonth() + 1); // 그로부터 1개월 후 종료

      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const createData2 = {
        name: `자기평가 리셋 테스트용 2차 평가기간 ${uniqueId}`,
        startDate: today2.toISOString(),
        peerEvaluationDeadline: nextMonth2.toISOString(),
        description: '자기평가 리셋 E2E 테스트용 2차 평가기간',
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

      const createPeriod2Response = await testSuite
        .request()
        .post('/admin/evaluation-periods')
        .send(createData2)
        .expect(201);

      const period2Id = createPeriod2Response.body.id;

      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${period2Id}/start`)
        .expect(200);

      console.log(`✅ 두 번째 평가기간 생성 및 시작: ${period2Id}`);

      // 두 번째 평가기간에 평가 대상자 등록
      await evaluationTargetScenario.평가_대상자를_대량_등록한다(
        period2Id,
        employeeIds.slice(0, 2),
      );

      // 프로젝트 할당 및 WBS 할당
      const projectId = projectIds[0];
      for (const employeeId of employeeIds.slice(0, 2)) {
        await projectAssignmentScenario.프로젝트를_할당한다({
          employeeId,
          projectId,
          periodId: period2Id,
        });

        for (const wbsItemId of wbsItemIds.slice(0, 1)) {
          await wbsAssignmentScenario.WBS를_할당한다({
            employeeId,
            wbsItemId,
            projectId,
            periodId: period2Id,
          });
        }
      }

      // 첫 번째 평가기간 자기평가 생성
      const period1SelfEval =
        await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '1차 평가기간 자기평가',
          selfEvaluationScore: 85,
        });

      console.log(`✅ 1차 평가기간 자기평가 생성: ${period1SelfEval.id}`);

      // 두 번째 평가기간 자기평가 생성
      const period2SelfEval =
        await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: period2Id,
          selfEvaluationContent: '2차 평가기간 자기평가',
          selfEvaluationScore: 90,
        });

      console.log(`✅ 2차 평가기간 자기평가 생성: ${period2SelfEval.id}`);

      // When: 모든 자기평가 리셋
      const resetResult = await wbsSelfEvaluationApiClient.resetAll();

      console.log('✅ 모든 자기평가 리셋 완료');
      console.log(
        `   - 삭제된 자기평가: ${resetResult.deletedCounts.selfEvaluations}개`,
      );

      // Then: 두 평가기간의 자기평가 모두 삭제 확인
      expect(resetResult.deletedCounts.selfEvaluations).toBeGreaterThanOrEqual(
        2,
      );

      // 첫 번째 평가기간 조회
      const period1Evals =
        await wbsSelfEvaluationApiClient.getEmployeeSelfEvaluations(
          employeeIds[0],
          { periodId: evaluationPeriodId },
        );
      expect(period1Evals.evaluations.length).toBe(0);

      // 두 번째 평가기간 조회
      const period2Evals =
        await wbsSelfEvaluationApiClient.getEmployeeSelfEvaluations(
          employeeIds[0],
          { periodId: period2Id },
        );
      expect(period2Evals.evaluations.length).toBe(0);

      console.log('✅ 모든 평가기간의 자기평가가 리셋됨 확인');

      // 정리: 두 번째 평가기간 종료 후 삭제
      try {
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${period2Id}/end`)
          .expect(200);
      } catch (error) {
        // 이미 종료되었거나 찾을 수 없음
        console.log('두 번째 평가기간 종료 시도:', error.message);
      }

      try {
        await testSuite
          .request()
          .delete(`/admin/evaluation-periods/${period2Id}`)
          .expect(200);
      } catch (error) {
        // 이미 삭제되었거나 활성 상태임
        console.log('두 번째 평가기간 삭제 시도:', error.message);
      }
    });
  });

  describe('데이터 검증', () => {
    it('리셋 응답에 삭제된 개수가 포함되어야 한다', async () => {
      console.log('\n📍 리셋 응답 구조 검증 테스트');

      // Given: 자기평가 생성
      await wbsSelfEvaluationApiClient.upsertWbsSelfEvaluation({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '테스트 자기평가',
        selfEvaluationScore: 85,
      });

      // When: 리셋
      const resetResult = await wbsSelfEvaluationApiClient.resetAll();

      // Then: 응답 구조 검증
      expect(resetResult).toHaveProperty('deletedCounts');
      expect(resetResult.deletedCounts).toHaveProperty('selfEvaluations');
      expect(resetResult.deletedCounts).toHaveProperty('downwardEvaluations');
      expect(resetResult).toHaveProperty('message');

      expect(typeof resetResult.deletedCounts.selfEvaluations).toBe('number');
      expect(typeof resetResult.deletedCounts.downwardEvaluations).toBe(
        'number',
      );
      expect(typeof resetResult.message).toBe('string');

      console.log('✅ 응답 구조 검증 완료');
    });
  });
});
