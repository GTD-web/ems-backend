import { BaseE2ETest } from '../../../base-e2e.spec';
import { RevisionRequestScenario } from './revision-request.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';

describe('재작성 요청 시나리오', () => {
  let testSuite: BaseE2ETest;
  let revisionRequestScenario: RevisionRequestScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let evaluateeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    revisionRequestScenario = new RevisionRequestScenario(testSuite);
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

    // 평가자 및 피평가자 설정
    evaluateeId = employeeIds[0];
    primaryEvaluatorId = employeeIds[1];
    secondaryEvaluatorId = employeeIds[2];

    // 평가기간 생성
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createData = {
      name: '재작성 요청 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '재작성 요청 E2E 테스트용 평가기간',
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

    // 프로젝트 할당
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: evaluateeId,
      projectId: projectIds[0],
    });

    // WBS 할당
    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: evaluateeId,
      wbsItemId: wbsItemIds[0],
      projectId: projectIds[0],
    });

    // 평가라인 매핑 명시적 생성 (1차 평가자)
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/primary-evaluator`,
      )
      .send({
        evaluatorId: primaryEvaluatorId,
      })
      .expect(201);

    // 평가라인 매핑 명시적 생성 (2차 평가자)
    await testSuite
      .request()
      .post(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/wbs/${wbsItemIds[0]}/period/${evaluationPeriodId}/secondary-evaluator`,
      )
      .send({
        evaluatorId: secondaryEvaluatorId,
      })
      .expect(201);
  });

  describe('시나리오 1: 자기평가 재작성 요청 및 완료', () => {
    let requestId: string;

    beforeEach(async () => {
      // 선행 조건: 자기평가 제출
      await revisionRequestScenario.자기평가를_제출한다({
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용입니다.',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과입니다.',
      });
    });

    describe('1-1. 자기평가 재작성 요청 생성', () => {
      it('자기평가 재작성 요청을 생성하고 검증한다', async () => {
        // When - 재작성 요청 생성
        await revisionRequestScenario.자기평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          revisionComment: '자기평가 내용을 보완해주세요.',
        });

        // Then - 재작성 요청 목록 조회
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'self',
          });

        expect(재작성요청목록).toBeDefined();
        // 자기평가 재작성 요청은 2개 생성됨 (피평가자 + 1차 평가자)
        expect(재작성요청목록.length).toBe(2);

        // 피평가자에게 보낸 재작성 요청
        const 피평가자요청 = 재작성요청목록.find(
          (req: any) => req.recipientType === 'evaluatee',
        );
        expect(피평가자요청).toBeDefined();
        expect(피평가자요청.requestId).toBeDefined();
        expect(피평가자요청.evaluationPeriod.id).toBe(evaluationPeriodId);
        expect(피평가자요청.employee.id).toBe(evaluateeId);
        expect(피평가자요청.step).toBe('self');
        expect(피평가자요청.comment).toBe('자기평가 내용을 보완해주세요.');
        expect(피평가자요청.recipientId).toBe(evaluateeId);
        expect(피평가자요청.recipientType).toBe('evaluatee');
        expect(피평가자요청.isRead).toBe(false);
        expect(피평가자요청.readAt).toBeNull();
        expect(피평가자요청.isCompleted).toBe(false);
        expect(피평가자요청.completedAt).toBeNull();
        expect(피평가자요청.responseComment).toBeNull();
        expect(피평가자요청.approvalStatus).toBe('revision_requested');

        // 1차 평가자에게 보낸 재작성 요청
        const 평가자요청 = 재작성요청목록.find(
          (req: any) => req.recipientType === 'primary_evaluator',
        );
        expect(평가자요청).toBeDefined();
        expect(평가자요청.recipientId).toBe(primaryEvaluatorId);
        expect(평가자요청.recipientType).toBe('primary_evaluator');
        expect(평가자요청.step).toBe('self');

        // 피평가자 요청 ID 저장 (이후 테스트에서 사용)
        requestId = 피평가자요청.requestId;
      });
    });

    describe('1-2. 재작성 요청 목록 조회', () => {
      beforeEach(async () => {
        // 재작성 요청 생성
        await revisionRequestScenario.자기평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          revisionComment: '자기평가 내용을 보완해주세요.',
        });

        // requestId 조회 (피평가자 요청)
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'self',
          });
        const 피평가자요청 = 재작성요청목록.find(
          (req: any) => req.recipientType === 'evaluatee',
        );
        requestId = 피평가자요청?.requestId;
      });

      it('관리자가 전체 재작성 요청 목록을 조회한다', async () => {
        // When - 관리자가 전체 재작성 요청 목록 조회
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
          });

        // Then - 검증
        expect(재작성요청목록).toBeDefined();
        expect(재작성요청목록.length).toBeGreaterThan(0);

        const 해당요청 = 재작성요청목록.find(
          (req: any) => req.requestId === requestId,
        );
        expect(해당요청).toBeDefined();
      });

      it('직원이 자신의 재작성 요청 목록을 조회한다', async () => {
        // When - 직원(피평가자)이 내 재작성 요청 목록 조회
        const 내재작성요청목록 =
          await revisionRequestScenario.내_재작성요청_목록을_조회한다(
            evaluateeId,
            {
              evaluationPeriodId,
            },
          );

        // Then - 검증 (피평가자에게 온 요청만 조회됨)
        expect(내재작성요청목록).toBeDefined();
        expect(내재작성요청목록.length).toBe(1); // 피평가자에게 온 요청 1개

        // 자신에게 할당된 재작성 요청만 조회됨
        const 피평가자요청 = 내재작성요청목록[0];
        expect(피평가자요청.recipientId).toBe(evaluateeId);
        expect(피평가자요청.recipientType).toBe('evaluatee');
      });
    });

    describe('1-3. 읽지 않은 재작성 요청 수 조회', () => {
      beforeEach(async () => {
        // 재작성 요청 생성
        await revisionRequestScenario.자기평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          revisionComment: '자기평가 내용을 보완해주세요.',
        });
      });

      it('읽지 않은 재작성 요청 수를 조회한다', async () => {
        // When - 읽지 않은 재작성 요청 수 조회 (피평가자)
        const 읽지않은수 =
          await revisionRequestScenario.읽지않은_재작성요청수를_조회한다(
            evaluateeId,
          );

        // Then - 검증 (피평가자에게 온 요청 1개)
        expect(읽지않은수).toBe(1);
      });
    });

    describe('1-4. 재작성 요청 읽음 처리', () => {
      beforeEach(async () => {
        // 재작성 요청 생성
        await revisionRequestScenario.자기평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          revisionComment: '자기평가 내용을 보완해주세요.',
        });

        // requestId 조회 (피평가자 요청만)
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'self',
          });
        const 피평가자요청 = 재작성요청목록.find(
          (req: any) => req.recipientType === 'evaluatee',
        );
        requestId = 피평가자요청?.requestId;
      });

      it('재작성 요청을 읽음 처리하고 검증한다', async () => {
        // Given - 읽음 처리 전 상태 확인
        const 읽음처리전수 =
          await revisionRequestScenario.읽지않은_재작성요청수를_조회한다(
            evaluateeId,
          );
        expect(읽음처리전수).toBe(1);

        // When - 읽음 처리
        await revisionRequestScenario.재작성요청을_읽음처리한다(
          requestId,
          evaluateeId,
        );

        // Then - 읽음 상태 확인
        const 읽음처리후목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'self',
          });

        const 읽음처리후요청 = 읽음처리후목록.find(
          (req: any) =>
            req.requestId === requestId &&
            req.recipientType === 'evaluatee',
        );
        expect(읽음처리후요청).toBeDefined();
        expect(읽음처리후요청.isRead).toBe(true);
        expect(읽음처리후요청.readAt).not.toBeNull();

        // 읽지 않은 요청 수 감소 확인
        const 읽음처리후수 =
          await revisionRequestScenario.읽지않은_재작성요청수를_조회한다(
            evaluateeId,
          );
        expect(읽음처리후수).toBe(0); // 1 → 0
      });
    });

    describe('1-5. 재작성 완료 응답 제출', () => {
      beforeEach(async () => {
        // 재작성 요청 생성
        await revisionRequestScenario.자기평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          revisionComment: '자기평가 내용을 보완해주세요.',
        });

        // requestId 조회 (피평가자 요청만)
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'self',
          });
        const 피평가자요청 = 재작성요청목록.find(
          (req: any) => req.recipientType === 'evaluatee',
        );
        requestId = 피평가자요청?.requestId;

        // 읽음 처리
        await revisionRequestScenario.재작성요청을_읽음처리한다(
          requestId,
          evaluateeId,
        );
      });

      it('재작성 완료 응답을 제출하고 검증한다', async () => {
        // When - 재작성 완료 응답 제출
        await revisionRequestScenario.재작성완료_응답을_제출한다(
          requestId,
          evaluateeId,
          '자기평가 내용을 수정하여 재제출하였습니다.',
        );

        // Then - 완료 상태 확인
        const 완료후목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'self',
          });

        const 완료후요청 = 완료후목록.find(
          (req: any) =>
            req.requestId === requestId &&
            req.recipientType === 'evaluatee',
        );
        expect(완료후요청).toBeDefined();
        expect(완료후요청.isCompleted).toBe(true);
        expect(완료후요청.completedAt).not.toBeNull();
        expect(완료후요청.responseComment).toBe(
          '자기평가 내용을 수정하여 재제출하였습니다.',
        );

        // 피평가자만 완료했으므로 아직 pending으로 변경되지 않음
        // (1차 평가자도 완료해야 pending으로 변경됨)
        // 실제로는 'revision_completed' 상태일 수 있음 (모든 수신자 완료 시)
        expect(['revision_requested', 'revision_completed', 'pending']).toContain(
          완료후요청.approvalStatus,
        );
      });
    });
  });

  describe('시나리오 2: 1차 하향평가 재작성 요청 및 완료', () => {
    let requestId: string;
    let selfEvaluationId: string;

    beforeEach(async () => {
      // 선행 조건: 자기평가 제출
      const { selfEvaluationId: 자기평가ID } =
        await revisionRequestScenario.자기평가를_제출한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      selfEvaluationId = 자기평가ID;

      // 선행 조건: 1차 하향평가 제출
      await revisionRequestScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
        selfEvaluationId,
        downwardEvaluationContent: '1차 하향평가 내용입니다.',
        downwardEvaluationScore: 90,
      });
    });

    describe('2-1. 1차 하향평가 재작성 요청 생성 및 완료', () => {
      it('1차 하향평가 재작성 요청을 생성하고 완료 응답을 제출한다', async () => {
        // Given - 재작성 요청 생성
        await revisionRequestScenario.일차하향평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          revisionComment: '1차 하향평가 점수를 재검토해주세요.',
        });

        // 재작성 요청 ID 조회
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'primary',
          });

        expect(재작성요청목록).toBeDefined();
        expect(재작성요청목록.length).toBeGreaterThan(0);

        const 재작성요청 = 재작성요청목록[0];
        requestId = 재작성요청.requestId;

        // Then - 재작성 요청 구조 검증
        expect(재작성요청.requestId).toBeDefined();
        expect(재작성요청.step).toBe('primary');
        expect(재작성요청.comment).toBe('1차 하향평가 점수를 재검토해주세요.');
        expect(재작성요청.recipientId).toBe(primaryEvaluatorId);
        expect(재작성요청.recipientType).toBe('primary_evaluator');
        expect(재작성요청.isRead).toBe(false);
        expect(재작성요청.isCompleted).toBe(false);

        // 1차 평가자가 재작성 요청 목록 조회
        const 평가자재작성요청목록 =
          await revisionRequestScenario.내_재작성요청_목록을_조회한다(
            primaryEvaluatorId,
            {
              evaluationPeriodId,
              step: 'primary',
            },
          );

        expect(평가자재작성요청목록).toBeDefined();
        expect(평가자재작성요청목록.length).toBeGreaterThan(0);

        // When - 1차 평가자가 재작성 완료 응답 제출
        await revisionRequestScenario.재작성완료_응답을_제출한다(
          requestId,
          primaryEvaluatorId,
          '1차 하향평가 점수를 재검토하여 수정하였습니다.',
        );

        // Then - 완료 상태 확인
        const 완료후목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'primary',
          });

        const 완료후요청 = 완료후목록.find(
          (req: any) => req.requestId === requestId,
        );
        expect(완료후요청.isCompleted).toBe(true);
        expect(완료후요청.completedAt).not.toBeNull();
        expect(완료후요청.responseComment).toBe(
          '1차 하향평가 점수를 재검토하여 수정하였습니다.',
        );
        // 재작성 완료 후 상태는 'pending' 또는 'revision_completed'일 수 있음
        expect(['pending', 'revision_completed']).toContain(
          완료후요청.approvalStatus,
        );
      });
    });
  });

  describe('시나리오 3: 2차 하향평가 재작성 요청 및 완료', () => {
    let requestId: string;
    let selfEvaluationId: string;

    beforeEach(async () => {
      // 선행 조건: 자기평가 제출
      const { selfEvaluationId: 자기평가ID } =
        await revisionRequestScenario.자기평가를_제출한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      selfEvaluationId = 자기평가ID;

      // 선행 조건: 2차 하향평가 제출
      await revisionRequestScenario.이차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: secondaryEvaluatorId,
        selfEvaluationId,
        downwardEvaluationContent: '2차 하향평가 내용입니다.',
        downwardEvaluationScore: 95,
      });
    });

    describe('3-1. 2차 하향평가 재작성 요청 생성 및 완료', () => {
      it('2차 하향평가 재작성 요청을 생성하고 완료 응답을 제출한다', async () => {
        // Given - 재작성 요청 생성
        await revisionRequestScenario.이차하향평가_재작성요청을_생성한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          evaluatorId: secondaryEvaluatorId,
          revisionComment: '2차 하향평가 내용을 보완해주세요.',
        });

        // 재작성 요청 ID 조회
        const 재작성요청목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'secondary',
          });

        expect(재작성요청목록).toBeDefined();
        expect(재작성요청목록.length).toBeGreaterThan(0);

        const 재작성요청 = 재작성요청목록[0];
        requestId = 재작성요청.requestId;

        // Then - 재작성 요청 구조 검증
        expect(재작성요청.requestId).toBeDefined();
        expect(재작성요청.step).toBe('secondary');
        expect(재작성요청.comment).toBe('2차 하향평가 내용을 보완해주세요.');
        expect(재작성요청.recipientId).toBe(secondaryEvaluatorId);
        expect(재작성요청.recipientType).toBe('secondary_evaluator');

        // 2차 평가자가 재작성 요청 목록 조회
        const 평가자재작성요청목록 =
          await revisionRequestScenario.내_재작성요청_목록을_조회한다(
            secondaryEvaluatorId,
            {
              evaluationPeriodId,
              step: 'secondary',
            },
          );

        expect(평가자재작성요청목록).toBeDefined();
        expect(평가자재작성요청목록.length).toBeGreaterThan(0);

        // When - 2차 평가자가 재작성 완료 응답 제출
        await revisionRequestScenario.재작성완료_응답을_제출한다(
          requestId,
          secondaryEvaluatorId,
          '2차 하향평가 내용을 보완하였습니다.',
        );

        // Then - 완료 상태 확인
        const 완료후목록 =
          await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'secondary',
          });

        const 완료후요청 = 완료후목록.find(
          (req: any) => req.requestId === requestId,
        );
        expect(완료후요청.isCompleted).toBe(true);
        expect(완료후요청.completedAt).not.toBeNull();
        expect(완료후요청.responseComment).toBe(
          '2차 하향평가 내용을 보완하였습니다.',
        );
        // 재작성 완료 후 상태는 'pending' 또는 'revision_completed'일 수 있음
        expect(['pending', 'revision_completed']).toContain(
          완료후요청.approvalStatus,
        );
      });
    });
  });

  describe('시나리오 4: 관리자용 재작성 완료 응답 제출', () => {
    let selfEvaluationId: string;

    beforeEach(async () => {
      // 선행 조건: 자기평가 제출
      const { selfEvaluationId: 자기평가ID } =
        await revisionRequestScenario.자기평가를_제출한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      selfEvaluationId = 자기평가ID;

      // 선행 조건: 1차 하향평가 제출
      await revisionRequestScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
        selfEvaluationId,
        downwardEvaluationContent: '1차 하향평가 내용입니다.',
        downwardEvaluationScore: 90,
      });

      // 재작성 요청 생성
      await revisionRequestScenario.일차하향평가_재작성요청을_생성한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        revisionComment: '1차 하향평가 점수를 재검토해주세요.',
      });
    });

    it('관리자가 평가자 대신 재작성 완료 응답을 제출한다', async () => {
      // When - 관리자가 평가자 대신 재작성 완료 응답 제출
      await revisionRequestScenario.관리자가_재작성완료_응답을_제출한다(
        evaluationPeriodId,
        evaluateeId,
        primaryEvaluatorId,
        'primary',
        '관리자가 대신 재작성 완료 처리합니다.',
      );

      // Then - 완료 상태 확인
      const 완료후목록 =
        await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          step: 'primary',
        });

      expect(완료후목록).toBeDefined();
      expect(완료후목록.length).toBeGreaterThan(0);

      const 완료후요청 = 완료후목록[0];
      expect(완료후요청.isCompleted).toBe(true);
      expect(완료후요청.completedAt).not.toBeNull();
      expect(완료후요청.responseComment).toBe(
        '관리자가 대신 재작성 완료 처리합니다.',
      );
      // 재작성 완료 후 상태는 'pending' 또는 'revision_completed'일 수 있음
      expect(['pending', 'revision_completed']).toContain(
        완료후요청.approvalStatus,
      );
    });
  });

  describe('시나리오 5: 필터링 및 검색 기능 검증', () => {
    let selfEvaluationId: string;

    beforeEach(async () => {
      // 선행 조건: 자기평가 제출
      const { selfEvaluationId: 자기평가ID } =
        await revisionRequestScenario.자기평가를_제출한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용입니다.',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과입니다.',
        });

      selfEvaluationId = 자기평가ID;

      // 선행 조건: 1차 하향평가 제출
      await revisionRequestScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
        selfEvaluationId,
        downwardEvaluationContent: '1차 하향평가 내용입니다.',
        downwardEvaluationScore: 90,
      });

      // 여러 재작성 요청 생성
      await revisionRequestScenario.자기평가_재작성요청을_생성한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        revisionComment: '자기평가 내용을 보완해주세요.',
      });

      await revisionRequestScenario.일차하향평가_재작성요청을_생성한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        revisionComment: '1차 하향평가 점수를 재검토해주세요.',
      });
    });

    it('단계별 필터링을 검증한다', async () => {
      // When - 자기평가 단계 재작성 요청 조회
      const 자기평가요청목록 =
        await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
          evaluationPeriodId,
          step: 'self',
        });

      // Then - 자기평가 단계만 조회됨
      expect(자기평가요청목록).toBeDefined();
      expect(자기평가요청목록.length).toBeGreaterThan(0);
      const 모두자기평가 = 자기평가요청목록.every(
        (req: any) => req.step === 'self',
      );
      expect(모두자기평가).toBe(true);

      // When - 1차 하향평가 단계 재작성 요청 조회
      const 일차하향평가요청목록 =
        await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
          evaluationPeriodId,
          step: 'primary',
        });

      // Then - 1차 하향평가 단계만 조회됨
      expect(일차하향평가요청목록).toBeDefined();
      expect(일차하향평가요청목록.length).toBeGreaterThan(0);
      const 모두일차하향평가 = 일차하향평가요청목록.every(
        (req: any) => req.step === 'primary',
      );
      expect(모두일차하향평가).toBe(true);
    });

    it('읽음 상태별 필터링을 검증한다', async () => {
      // When - 미읽음 재작성 요청 조회
      const 미읽음요청목록 =
        await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
          evaluationPeriodId,
          isRead: false,
        });

      // Then - 미읽음 상태만 조회됨
      expect(미읽음요청목록).toBeDefined();
      expect(미읽음요청목록.length).toBeGreaterThan(0);
      const 모두미읽음 = 미읽음요청목록.every(
        (req: any) => req.isRead === false,
      );
      expect(모두미읽음).toBe(true);
    });

    it('완료 상태별 필터링을 검증한다', async () => {
      // When - 미완료 재작성 요청 조회
      const 미완료요청목록 =
        await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
          evaluationPeriodId,
          isCompleted: false,
        });

      // Then - 미완료 상태만 조회됨
      expect(미완료요청목록).toBeDefined();
      expect(미완료요청목록.length).toBeGreaterThan(0);
      const 모두미완료 = 미완료요청목록.every(
        (req: any) => req.isCompleted === false,
      );
      expect(모두미완료).toBe(true);
    });

    it('복합 필터링을 검증한다', async () => {
      // When - 평가기간 + 단계 + 미완료 필터링
      const 복합필터결과 =
        await revisionRequestScenario.전체_재작성요청_목록을_조회한다({
          evaluationPeriodId,
          step: 'self',
          isCompleted: false,
        });

      // Then - 모든 조건을 만족하는 요청만 조회됨
      expect(복합필터결과).toBeDefined();
      const 모든조건충족 = 복합필터결과.every(
        (req: any) =>
          req.evaluationPeriod.id === evaluationPeriodId &&
          req.step === 'self' &&
          req.isCompleted === false,
      );
      expect(모든조건충족).toBe(true);
    });
  });
});

