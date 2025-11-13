import { BaseE2ETest } from '../../../base-e2e.spec';
import { StepApprovalScenario } from './step-approval.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { WbsSelfEvaluationScenario } from '../performance-evaluation/wbs-self-evaluation/wbs-self-evaluation.scenario';
import { DownwardEvaluationScenario } from '../downward-evaluation/downward-evaluation.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';

/**
 * 단계 승인 관리 E2E 테스트
 *
 * 단계별 승인 상태 변경 및 승인 시 제출 상태 자동 변경을 검증합니다.
 */
describe('단계 승인 관리 E2E 테스트', () => {
  let testSuite: BaseE2ETest;
  let stepApprovalScenario: StepApprovalScenario;
  let seedDataScenario: SeedDataScenario;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    stepApprovalScenario = new StepApprovalScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
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
      name: '단계 승인 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '단계 승인 E2E 테스트용 평가기간',
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

    const evaluationPeriod =
      await evaluationPeriodScenario.평가기간을_생성한다(createData);
    evaluationPeriodId = evaluationPeriod.id;

    // 평가기간 시작
    await evaluationPeriodScenario.평가기간을_시작한다(evaluationPeriodId);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );

    // 초기 구성 데이터 생성 (프로젝트 할당, WBS 할당, 평가라인 구성)
    await stepApprovalScenario.초기_구성_데이터를_생성한다({
      evaluationPeriodId,
      employeeId: employeeIds[0], // 피평가자
      projectId: projectIds[0],
      wbsItemId: wbsItemIds[0],
      primaryEvaluatorId: employeeIds[1], // 1차 평가자
    });

    // 평가라인 조회하여 실제 평가자 설정
    const evaluationLineResponse = await testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/employee/${employeeIds[0]}/period/${evaluationPeriodId}/settings`,
      )
      .expect(200);

    // 1차 평가자 조회 (wbsItemId가 null인 매핑)
    let primaryMapping =
      evaluationLineResponse.body.evaluationLineMappings?.find(
        (line: any) => line.wbsItemId === null,
      );

    // 1차 평가자 매핑이 없으면 wbsItemId가 있는 매핑 중 첫 번째를 사용 (임시)
    if (
      !primaryMapping &&
      evaluationLineResponse.body.evaluationLineMappings?.length > 0
    ) {
      primaryMapping = evaluationLineResponse.body.evaluationLineMappings[0];
    }

    if (primaryMapping) {
      primaryEvaluatorId = primaryMapping.evaluatorId;
    } else {
      // 평가라인이 없으면 기본값 사용
      primaryEvaluatorId = employeeIds[1];
    }

    // 2차 평가자 조회 (wbsItemId가 있는 매핑 중 첫 번째)
    const secondaryMapping =
      evaluationLineResponse.body.evaluationLineMappings?.find(
        (line: any) => line.wbsItemId === wbsItemIds[0],
      );
    if (secondaryMapping) {
      secondaryEvaluatorId = secondaryMapping.evaluatorId;
    } else {
      // 평가라인이 없으면 기본값 사용
      secondaryEvaluatorId = employeeIds[2];
    }
  });

  describe('단계 승인 기본 관리', () => {
    describe('단계 승인 Enum 목록 조회', () => {
      it('단계 승인 Enum 목록을 조회한다', async () => {
        // When
        const result =
          await stepApprovalScenario.단계승인_Enum목록을_조회한다();

        // Then
        expect(result).toBeDefined();
        expect(result.steps).toBeDefined();
        expect(result.steps).toContain('criteria');
        expect(result.steps).toContain('self');
        expect(result.steps).toContain('primary');
        expect(result.steps).toContain('secondary');
        expect(result.statuses).toBeDefined();
        expect(result.statuses).toContain('pending');
        expect(result.statuses).toContain('approved');
        expect(result.statuses).toContain('revision_requested');
        expect(result.statuses).toContain('revision_completed');
      });
    });

    describe('자기평가 단계 승인 상태 변경', () => {
      it('자기평가를 pending에서 approved로 변경한다', async () => {
        // When
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // Then - 대시보드 API로 승인 상태 확인
        const statusData =
          await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(statusData).toBeDefined();
        expect(statusData.stepApproval).toBeDefined();
        expect(statusData.stepApproval.selfEvaluationStatus).toBe('approved');
      });

      it('자기평가를 approved에서 revision_requested로 변경한다', async () => {
        // Given - 자기평가 저장 및 제출
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

        await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
            projectId: projectIds[0],
          },
        );

        // Given - 먼저 approved로 변경
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // When - revision_requested로 변경
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // Then
        const statusData =
          await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(statusData.stepApproval.selfEvaluationStatus).toBe(
          'revision_requested',
        );
      });
    });
  });

  describe('승인 시 제출 상태 자동 변경 검증', () => {
    describe('자기평가 승인 시 제출 상태 자동 변경', () => {
      it('제출하지 않은 자기평가를 승인하면 제출 상태가 자동으로 변경된다', async () => {
        // Given - 자기평가 저장 (제출하지 않음)
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          },
        );

        // 승인 전 제출 상태 확인
        const 승인전_제출상태 =
          await stepApprovalScenario.자기평가_제출상태를_조회한다({
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          });

        const 승인전_자기평가 = 승인전_제출상태.evaluations.find(
          (e: any) => e.id === 저장결과.id,
        );
        expect(승인전_자기평가.submittedToEvaluator).toBe(false);
        expect(승인전_자기평가.submittedToManager).toBe(false);

        // When - 자기평가 단계 승인
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // Then - 제출 상태 자동 변경 확인 (자기평가 목록 API)
        const 승인후_제출상태 =
          await stepApprovalScenario.자기평가_제출상태를_조회한다({
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          });

        const 승인후_자기평가 = 승인후_제출상태.evaluations.find(
          (e: any) => e.id === 저장결과.id,
        );
        expect(승인후_자기평가.submittedToEvaluator).toBe(true);
        expect(승인후_자기평가.submittedToManager).toBe(true);
        expect(승인후_자기평가.submittedToEvaluatorAt).toBeDefined();
        expect(승인후_자기평가.submittedToManagerAt).toBeDefined();

        // Then - 대시보드 API로 제출 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(대시보드_상태.selfEvaluation.isSubmittedToEvaluator).toBe(true);

        // Then - 할당 데이터 API로 제출 상태 확인
        const 할당데이터 =
          await stepApprovalScenario.자기평가_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        // summary.selfEvaluation 검증 (wbsList 내 selfEvaluation은 제거됨)
        expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
          true,
        );
        expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
          true,
        );
      });

      it('이미 제출된 자기평가를 승인해도 에러 없이 처리된다 (idempotent)', async () => {
        // Given - 자기평가 저장 및 제출
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          },
        );

        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

        await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
            projectId: projectIds[0],
          },
        );

        // When - 이미 제출된 상태에서 승인
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // Then - 제출 상태는 이미 true이므로 변경되지 않음
        const 제출상태 =
          await stepApprovalScenario.자기평가_제출상태를_조회한다({
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          });

        const 자기평가 = 제출상태.evaluations.find(
          (e: any) => e.id === 저장결과.id,
        );
        expect(자기평가.submittedToEvaluator).toBe(true);
        expect(자기평가.submittedToManager).toBe(true);
      });
    });

    describe('1차 하향평가 승인 시 제출 상태 자동 변경', () => {
      it('제출하지 않은 1차 하향평가를 승인하면 제출 상태가 자동으로 변경된다', async () => {
        // Given - 자기평가 저장 (하향평가를 위한 선행 조건)
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // Given - 1차 하향평가 저장 (제출하지 않음)
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // 승인 전 제출 상태 확인
        const 승인전_제출상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_조회한다({
            evaluatorId: primaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인전_하향평가 = 승인전_제출상태.evaluations?.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인전_하향평가).toBeDefined();
        expect(승인전_하향평가.isCompleted).toBe(false);

        // When - 1차 하향평가 단계 승인
        await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
        });

        // Then - 제출 상태 자동 변경 확인
        const 승인후_제출상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_조회한다({
            evaluatorId: primaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인후_하향평가 = 승인후_제출상태.evaluations.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인후_하향평가.isCompleted).toBe(true);
        expect(승인후_하향평가.completedAt).toBeDefined();

        // Then - 대시보드 API로 제출 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_대시보드에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(대시보드_상태.downwardEvaluation.primary.isSubmitted).toBe(true);

        // Then - 할당 데이터 API로 제출 상태 확인
        const 할당데이터 =
          await stepApprovalScenario.일차하향평가_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        const wbs = 할당데이터.projects[0].wbsList.find(
          (w: any) => w.wbsId === wbsItemIds[0],
        );
        expect(wbs.primaryDownwardEvaluation.isCompleted).toBe(true);

        // Then - 통합 조회 API로 제출 상태 확인
        const 통합조회 =
          await stepApprovalScenario.일차하향평가_제출상태를_통합조회에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(통합조회.primaryDownwardEvaluation.isSubmitted).toBe(true);
      });
    });

    describe('2차 하향평가 승인 시 제출 상태 자동 변경', () => {
      it('제출하지 않은 2차 하향평가를 승인하면 제출 상태가 자동으로 변경된다', async () => {
        // Given - 자기평가 저장 (하향평가를 위한 선행 조건)
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // Given - 2차 하향평가 저장 (제출하지 않음)
        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '2차 하향평가 내용',
          downwardEvaluationScore: 85,
        });

        // 승인 전 제출 상태 확인
        const 승인전_제출상태 =
          await stepApprovalScenario.이차하향평가_제출상태를_조회한다({
            evaluatorId: secondaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인전_하향평가 = 승인전_제출상태.evaluations.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인전_하향평가).toBeDefined();
        expect(승인전_하향평가.isCompleted).toBe(false);

        // When - 2차 하향평가 단계 승인
        await stepApprovalScenario.이차하향평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          evaluatorId: secondaryEvaluatorId,
          status: 'approved',
        });

        // Then - 제출 상태 자동 변경 확인
        const 승인후_제출상태 =
          await stepApprovalScenario.이차하향평가_제출상태를_조회한다({
            evaluatorId: secondaryEvaluatorId,
            periodId: evaluationPeriodId,
            evaluateeId: employeeIds[0],
          });

        const 승인후_하향평가 = 승인후_제출상태.evaluations.find(
          (e: any) => e.employeeId === employeeIds[0],
        );
        expect(승인후_하향평가.isCompleted).toBe(true);
        expect(승인후_하향평가.completedAt).toBeDefined();

        // Then - 대시보드 API로 제출 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.이차하향평가_제출상태를_대시보드에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        const secondaryEvaluator =
          대시보드_상태.downwardEvaluation.secondary.evaluators.find(
            (e: any) => e.evaluator.id === secondaryEvaluatorId,
          );
        expect(secondaryEvaluator.isSubmitted).toBe(true);
      });
    });
  });

  describe('재작성 요청 생성 시 제출 상태 초기화 검증', () => {
    describe('자기평가 재작성 요청 생성 시 제출 상태 초기화', () => {
      it('제출된 자기평가에 재작성 요청을 생성하면 제출 상태가 초기화된다', async () => {
        // Given - 자기평가 저장 및 제출
        const 저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다(
          {
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          },
        );

        await wbsSelfEvaluationScenario.직원의_전체_WBS자기평가를_1차평가자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          },
        );

        await wbsSelfEvaluationScenario.프로젝트별_WBS자기평가를_관리자에게_제출한다(
          {
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
            projectId: projectIds[0],
          },
        );

        // 제출 상태 확인
        const 제출전_상태 =
          await stepApprovalScenario.자기평가_제출상태를_조회한다({
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          });

        const 제출전_자기평가 = 제출전_상태.evaluations.find(
          (e: any) => e.id === 저장결과.id,
        );
        expect(제출전_자기평가.submittedToManager).toBe(true);

        // When - 재작성 요청 생성
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // Then - 제출 상태 초기화 확인
        const 제출후_상태 =
          await stepApprovalScenario.자기평가_제출상태를_조회한다({
            employeeId: employeeIds[0],
            periodId: evaluationPeriodId,
          });

        const 제출후_자기평가 = 제출후_상태.evaluations.find(
          (e: any) => e.id === 저장결과.id,
        );
        // 재작성 요청 시 제출 상태 초기화
        expect(제출후_자기평가.submittedToManager).toBe(false);
        expect(제출후_자기평가.submittedToManagerAt).toBeNull();
        // submittedToEvaluator도 false로 변경되지만, At 필드는 유지됨 (기존 제출 이력)
        expect(제출후_자기평가.submittedToEvaluator).toBe(false);
        // submittedToEvaluatorAt는 이전 제출 날짜가 유지됨
        expect(제출후_자기평가.submittedToEvaluatorAt).toBeDefined();

        // Then - 할당 데이터 API로 제출 상태 확인
        const 할당데이터 =
          await stepApprovalScenario.자기평가_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        // summary.selfEvaluation 검증 - 재작성 요청 시 모든 제출 상태 초기화
        expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
          false,
        );
        expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
          false,
        );
      });
    });
  });

  describe('엣지 케이스 검증', () => {
    describe('재작성 요청 코멘트 누락', () => {
      it('revision_requested 상태인데 revisionComment를 누락하면 400 에러가 발생한다', async () => {
        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/step-approvals/${evaluationPeriodId}/employees/${employeeIds[0]}/self`,
          )
          .send({
            status: 'revision_requested',
            // revisionComment 누락
          })
          .expect(400);
      });

      it('revisionComment가 빈 문자열이면 400 에러가 발생한다', async () => {
        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/step-approvals/${evaluationPeriodId}/employees/${employeeIds[0]}/self`,
          )
          .send({
            status: 'revision_requested',
            revisionComment: '', // 빈 문자열
          })
          .expect(400);
      });
    });

    describe('존재하지 않는 리소스', () => {
      it('존재하지 않는 평가기간-직원 조합으로 요청하면 404 에러가 발생한다', async () => {
        // Given - 존재하지 않는 평가기간 ID
        const 존재하지않는_평가기간ID = '00000000-0000-0000-0000-000000000000';

        // When & Then
        await testSuite
          .request()
          .patch(
            `/admin/step-approvals/${존재하지않는_평가기간ID}/employees/${employeeIds[0]}/self`,
          )
          .send({
            status: 'approved',
          })
          .expect(404);
      });
    });
  });

  describe('하위 평가 자동 승인 기능 검증', () => {
    describe('자기평가 승인 시 하위 평가 자동 승인', () => {
      it('approveSubsequentSteps=true로 자기평가 승인 시 1차, 2차 하향평가도 함께 승인된다', async () => {
        // Given - 자기평가, 1차 하향평가, 2차 하향평가 저장
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // 1차 하향평가 저장
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // 2차 하향평가 저장
        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '2차 하향평가 내용',
          downwardEvaluationScore: 85,
        });

        // When - 자기평가 승인 (하위 평가 자동 승인 옵션 활성화)
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
          approveSubsequentSteps: true,
        });

        // Then - 자기평가 승인 상태 확인
        const 자기평가_대시보드_상태 =
          await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(자기평가_대시보드_상태.stepApproval.selfEvaluationStatus).toBe(
          'approved',
        );
        expect(
          자기평가_대시보드_상태.selfEvaluation.isSubmittedToEvaluator,
        ).toBe(true);

        // Then - 1차 하향평가 승인 상태 확인
        expect(
          자기평가_대시보드_상태.stepApproval.primaryEvaluationStatus,
        ).toBe('approved');
        expect(
          자기평가_대시보드_상태.downwardEvaluation.primary.isSubmitted,
        ).toBe(true);

        // Then - 2차 하향평가 승인 상태 확인
        const secondaryEvaluator =
          자기평가_대시보드_상태.downwardEvaluation.secondary.evaluators.find(
            (e: any) => e.evaluator.id === secondaryEvaluatorId,
          );
        expect(secondaryEvaluator).toBeDefined();
        expect(secondaryEvaluator.isSubmitted).toBe(true);

        // Then - 2차 하향평가 단계 승인 상태 확인 (대시보드 API에는 없으므로 직접 확인)
        const 통합조회 =
          await stepApprovalScenario.이차하향평가_제출상태를_통합조회에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(통합조회.secondaryDownwardEvaluation.isSubmitted).toBe(true);
      });

      it('approveSubsequentSteps=false로 자기평가 승인 시 현재 평가만 승인된다', async () => {
        // Given - 자기평가, 1차 하향평가, 2차 하향평가 저장
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // 1차 하향평가 저장
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // 2차 하향평가 저장
        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '2차 하향평가 내용',
          downwardEvaluationScore: 85,
        });

        // When - 자기평가 승인 (하위 평가 자동 승인 옵션 비활성화)
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
          approveSubsequentSteps: false,
        });

        // Then - 자기평가만 승인 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(대시보드_상태.stepApproval.selfEvaluationStatus).toBe(
          'approved',
        );
        expect(대시보드_상태.selfEvaluation.isSubmittedToEvaluator).toBe(true);

        // Then - 1차 하향평가는 승인되지 않음
        expect(대시보드_상태.stepApproval.primaryEvaluationStatus).not.toBe(
          'approved',
        );
        expect(대시보드_상태.downwardEvaluation.primary.isSubmitted).toBe(
          false,
        );

        // Then - 2차 하향평가는 승인되지 않음
        const secondaryEvaluator =
          대시보드_상태.downwardEvaluation.secondary.evaluators.find(
            (e: any) => e.evaluator.id === secondaryEvaluatorId,
          );
        if (secondaryEvaluator) {
          expect(secondaryEvaluator.isSubmitted).toBe(false);
        }
      });

      it('approveSubsequentSteps 파라미터 생략 시 현재 평가만 승인된다 (기본값 false)', async () => {
        // Given - 자기평가, 1차 하향평가 저장
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // When - 자기평가 승인 (approveSubsequentSteps 파라미터 생략)
        await stepApprovalScenario.자기평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
          // approveSubsequentSteps 생략
        });

        // Then - 자기평가만 승인됨
        const 대시보드_상태 =
          await stepApprovalScenario.자기평가_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: employeeIds[0],
          });

        expect(대시보드_상태.stepApproval.selfEvaluationStatus).toBe(
          'approved',
        );
        expect(대시보드_상태.stepApproval.primaryEvaluationStatus).not.toBe(
          'approved',
        );
      });
    });

    describe('1차 하향평가 승인 시 2차 하향평가 자동 승인', () => {
      it('approveSubsequentSteps=true로 1차 하향평가 승인 시 2차 하향평가도 함께 승인된다', async () => {
        // Given - 자기평가, 1차 하향평가, 2차 하향평가 저장
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '2차 하향평가 내용',
          downwardEvaluationScore: 85,
        });

        // When - 1차 하향평가 승인 (하위 평가 자동 승인 옵션 활성화)
        await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
          approveSubsequentSteps: true,
        });

        // Then - 1차 하향평가 승인 상태 확인
        const 대시보드_상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_대시보드에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(대시보드_상태.stepApproval.primaryEvaluationStatus).toBe(
          'approved',
        );
        expect(대시보드_상태.downwardEvaluation.primary.isSubmitted).toBe(true);

        // Then - 2차 하향평가도 승인됨
        const secondaryEvaluator =
          대시보드_상태.downwardEvaluation.secondary.evaluators.find(
            (e: any) => e.evaluator.id === secondaryEvaluatorId,
          );
        expect(secondaryEvaluator).toBeDefined();
        expect(secondaryEvaluator.isSubmitted).toBe(true);

        // Then - 2차 하향평가 제출 상태 확인
        const 통합조회 =
          await stepApprovalScenario.이차하향평가_제출상태를_통합조회에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(통합조회.secondaryDownwardEvaluation.isSubmitted).toBe(true);
      });

      it('approveSubsequentSteps=false로 1차 하향평가 승인 시 현재 평가만 승인된다', async () => {
        // Given - 자기평가, 1차 하향평가, 2차 하향평가 저장
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: employeeIds[0],
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: primaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        await downwardEvaluationScenario.이차하향평가를_저장한다({
          evaluateeId: employeeIds[0],
          periodId: evaluationPeriodId,
          wbsId: wbsItemIds[0],
          evaluatorId: secondaryEvaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '2차 하향평가 내용',
          downwardEvaluationScore: 85,
        });

        // When - 1차 하향평가 승인 (하위 평가 자동 승인 옵션 비활성화)
        await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: employeeIds[0],
          status: 'approved',
          approveSubsequentSteps: false,
        });

        // Then - 1차 하향평가만 승인됨
        const 대시보드_상태 =
          await stepApprovalScenario.일차하향평가_제출상태를_대시보드에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: employeeIds[0],
            },
          );

        expect(대시보드_상태.stepApproval.primaryEvaluationStatus).toBe(
          'approved',
        );
        expect(대시보드_상태.downwardEvaluation.primary.isSubmitted).toBe(true);

        // Then - 2차 하향평가는 승인되지 않음
        const secondaryEvaluator =
          대시보드_상태.downwardEvaluation.secondary.evaluators.find(
            (e: any) => e.evaluator.id === secondaryEvaluatorId,
          );
        if (secondaryEvaluator) {
          expect(secondaryEvaluator.isSubmitted).toBe(false);
        }
      });
    });
  });
});
