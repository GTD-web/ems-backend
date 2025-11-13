import { BaseE2ETest } from '../../../base-e2e.spec';
import { StepApprovalScenario } from './step-approval.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { WbsSelfEvaluationScenario } from '../performance-evaluation/wbs-self-evaluation/wbs-self-evaluation.scenario';
import { DownwardEvaluationScenario } from '../downward-evaluation/downward-evaluation.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 1차 하향평가 대시보드 상태 검증 E2E 테스트
 *
 * 1차 하향평가의 모든 상태(none, in_progress, pending, approved, revision_requested, revision_completed)를 검증합니다.
 */
describe('1차 하향평가 대시보드 상태 검증 (모든 상태)', () => {
  let testSuite: BaseE2ETest;
  let stepApprovalScenario: StepApprovalScenario;
  let seedDataScenario: SeedDataScenario;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let primaryEvaluatorId: string;

  let evaluateeId: string;
  let evaluatorId: string;
  let testWbsItemIds: string[];

  // 테스트 결과 저장용
  const testResults: any[] = [];

  // ANSI 이스케이프 코드를 제거하는 헬퍼 함수
  function stripAnsiCodes(str: string): string {
    if (!str) return str;
    // ANSI 이스케이프 시퀀스 제거 (예: \u001b[2m, \u001b[31m 등)
    return str
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[?[0-9;]*[a-zA-Z]/g, '');
  }

  // 에러 객체에서 읽기 가능한 메시지를 추출하는 함수
  function extractErrorMessage(error: any): string {
    if (!error) return '';

    // 에러 메시지 추출
    let message = '';
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = String(error);
    }

    // ANSI 코드 제거
    message = stripAnsiCodes(message);

    // 스택 트레이스가 있으면 추가 (ANSI 코드 제거)
    if (error.stack) {
      const stack = stripAnsiCodes(error.stack);
      // 메시지와 스택이 다르면 스택 추가
      if (stack && !stack.includes(message)) {
        message = `${message}\n\nStack:\n${stack}`;
      }
    }

    return message;
  }

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
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'primary-downward-evaluation-dashboard-status-result.json',
    );
    const output = {
      timestamp: new Date().toISOString(),
      testResults: testResults,
    };

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ 테스트 결과가 저장되었습니다: ${outputPath}`);

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
      name: '1차 하향평가 대시보드 상태 검증 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '1차 하향평가 대시보드 상태 검증 E2E 테스트용 평가기간',
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

    // 테스트용 변수 설정
    evaluateeId = employeeIds[0];
    primaryEvaluatorId = employeeIds[1]; // 1차 평가자 (기본값)
    evaluatorId = primaryEvaluatorId;
    testWbsItemIds = wbsItemIds.slice(0, 2); // 테스트용 WBS 2개 사용

    // 초기 구성 데이터 생성 (프로젝트 할당은 첫 번째 호출에서만 생성됨)
    for (const wbsItemId of testWbsItemIds) {
      await stepApprovalScenario.초기_구성_데이터를_생성한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        projectId: projectIds[0],
        wbsItemId,
        primaryEvaluatorId: evaluatorId,
      });
    }

    // 평가라인 조회하여 실제 평가자 설정
    const evaluationLineResponse = await testSuite
      .request()
      .get(
        `/admin/evaluation-criteria/evaluation-lines/employee/${evaluateeId}/period/${evaluationPeriodId}/settings`,
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
      evaluatorId = primaryEvaluatorId;
    }
  });

  it('상태 1: none - 평가할 WBS가 없으면 primary.status는 none이어야 한다', async () => {
    let status: any;
    let error: any;
    const testName =
      '상태 1: none - 평가할 WBS가 없으면 primary.status는 none이어야 한다';

    try {
      // Given - WBS 할당이 없는 상태 (다른 직원 사용)
      const 다른직원 = employeeIds[3];

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: 다른직원,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe('none');
      expect(status.downwardEvaluation.primary.assignedWbsCount).toBe(0);

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: 다른직원,
          status: status.downwardEvaluation.primary.status,
          assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
          expectedStatus: 'none',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          status: status?.downwardEvaluation?.primary?.status,
          assignedWbsCount:
            status?.downwardEvaluation?.primary?.assignedWbsCount,
          expectedStatus: 'none',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 2: none - 하향평가가 하나도 없으면 primary.status는 none이어야 한다', async () => {
    let status: any;
    let error: any;
    const testName =
      '상태 2: none - 하향평가가 하나도 없으면 primary.status는 none이어야 한다';

    try {
      // Given - WBS 할당은 있지만 하향평가가 없는 상태

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe('none');
      expect(
        status.downwardEvaluation.primary.assignedWbsCount,
      ).toBeGreaterThan(0);
      expect(status.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            status.downwardEvaluation.primary.completedEvaluationCount,
          expectedStatus: 'none',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          assignedWbsCount:
            status?.downwardEvaluation?.primary?.assignedWbsCount,
          completedEvaluationCount:
            status?.downwardEvaluation?.primary?.completedEvaluationCount,
          expectedStatus: 'none',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 2-1: in_progress - 하향평가를 작성만 해도(제출 전) primary.status는 in_progress이어야 한다', async () => {
    let status: any;
    let error: any;
    const testName =
      '상태 2-1: in_progress - 하향평가를 작성만 해도(제출 전) primary.status는 in_progress이어야 한다';

    try {
      // Given - 자기평가 저장
      const 자기평가결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

      // Given - 1차 하향평가 저장만 (제출하지 않음)
      await downwardEvaluationScenario.일차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: testWbsItemIds[0],
        evaluatorId,
        selfEvaluationId: 자기평가결과.id,
        downwardEvaluationContent: '1차 하향평가 내용',
        downwardEvaluationScore: 90,
      });

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then - 작성만 해도 in_progress 상태가 되어야 함
      expect(status.downwardEvaluation.primary.status).toBe('in_progress');
      // 제출하지 않았으므로 completedEvaluationCount는 0이어야 함
      expect(status.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      // 하지만 할당된 WBS는 있음
      expect(
        status.downwardEvaluation.primary.assignedWbsCount,
      ).toBeGreaterThan(0);

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            status.downwardEvaluation.primary.completedEvaluationCount,
          expectedStatus: 'in_progress',
          passed: true,
          validation: {
            hasAssignedWbs:
              status.downwardEvaluation.primary.assignedWbsCount > 0,
            hasNoCompletedEvaluations:
              status.downwardEvaluation.primary.completedEvaluationCount === 0,
            isInProgressWithoutSubmission: true,
          },
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          assignedWbsCount:
            status?.downwardEvaluation?.primary?.assignedWbsCount,
          completedEvaluationCount:
            status?.downwardEvaluation?.primary?.completedEvaluationCount,
          expectedStatus: 'in_progress',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 3: in_progress - 일부만 완료되었으면 primary.status는 in_progress이어야 한다', async () => {
    let status: any;
    let error: any;
    const testName =
      '상태 3: in_progress - 일부만 완료되었으면 primary.status는 in_progress이어야 한다';

    try {
      // Given - 자기평가 저장
      const 자기평가결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

      // Given - 1차 하향평가 저장 (일부만)
      await downwardEvaluationScenario.일차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: testWbsItemIds[0],
        evaluatorId,
        selfEvaluationId: 자기평가결과.id,
        downwardEvaluationContent: '1차 하향평가 내용',
        downwardEvaluationScore: 90,
      });

      // Given - 1차 하향평가 제출 (완료 처리를 위해)
      await downwardEvaluationScenario.일차하향평가를_제출한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: testWbsItemIds[0],
        evaluatorId,
      });

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe('in_progress');
      expect(
        status.downwardEvaluation.primary.completedEvaluationCount,
      ).toBeGreaterThan(0); // 최소 1개는 완료되어야 함
      expect(
        status.downwardEvaluation.primary.completedEvaluationCount,
      ).toBeLessThan(status.downwardEvaluation.primary.assignedWbsCount);

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            status.downwardEvaluation.primary.completedEvaluationCount,
          expectedStatus: 'in_progress',
          passed: true,
          validation: {
            hasCompletedEvaluations:
              status.downwardEvaluation.primary.completedEvaluationCount > 0,
            isPartialCompletion:
              status.downwardEvaluation.primary.completedEvaluationCount <
              status.downwardEvaluation.primary.assignedWbsCount,
          },
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          assignedWbsCount:
            status?.downwardEvaluation?.primary?.assignedWbsCount,
          completedEvaluationCount:
            status?.downwardEvaluation?.primary?.completedEvaluationCount,
          expectedStatus: 'in_progress',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 4: pending - 모든 평가가 제출되면서 승인상태가 대기중이면 primary.status는 pending이어야 한다', async () => {
    let status: any;
    let error: any;
    const testName =
      '상태 4: pending - 모든 평가가 제출되면서 승인상태가 대기중이면 primary.status는 pending이어야 한다';

    try {
      // Given - 자기평가 저장
      const 자기평가결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

      // Given - 모든 WBS에 대해 1차 하향평가 저장 및 제출
      for (const wbsItemId of testWbsItemIds) {
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // Given - 1차 하향평가 제출 (완료 처리를 위해)
        await downwardEvaluationScenario.일차하향평가를_제출한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
        });
      }

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe('pending');
      expect(status.downwardEvaluation.primary.completedEvaluationCount).toBe(
        status.downwardEvaluation.primary.assignedWbsCount,
      );
      expect(status.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(status.stepApproval.primaryEvaluationStatus).toBe('pending');

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
          completedEvaluationCount:
            status.downwardEvaluation.primary.completedEvaluationCount,
          isSubmitted: status.downwardEvaluation.primary.isSubmitted,
          stepApprovalStatus: status.stepApproval.primaryEvaluationStatus,
          expectedStatus: 'pending',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          assignedWbsCount:
            status?.downwardEvaluation?.primary?.assignedWbsCount,
          completedEvaluationCount:
            status?.downwardEvaluation?.primary?.completedEvaluationCount,
          isSubmitted: status?.downwardEvaluation?.primary?.isSubmitted,
          stepApprovalStatus: status?.stepApproval?.primaryEvaluationStatus,
          expectedStatus: 'pending',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 5: approved - 모든 평가가 완료되고 승인되었으면 primary.status는 approved이어야 한다', async () => {
    let status: any;
    let error: any;
    const testName =
      '상태 5: approved - 모든 평가가 완료되고 승인되었으면 primary.status는 approved이어야 한다';

    try {
      // Given - 자기평가 저장
      const 자기평가결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

      // Given - 모든 WBS에 대해 1차 하향평가 저장
      for (const wbsItemId of testWbsItemIds) {
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });
      }

      // Given - 1차 하향평가 단계 승인
      await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        status: 'approved',
      });

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe('approved');
      expect(status.stepApproval.primaryEvaluationStatus).toBe('approved');
      expect(status.stepApproval.primaryEvaluationApprovedBy).toBeDefined();
      expect(status.stepApproval.primaryEvaluationApprovedAt).toBeDefined();

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          stepApprovalStatus: status.stepApproval.primaryEvaluationStatus,
          approvedBy: status.stepApproval.primaryEvaluationApprovedBy,
          approvedAt: status.stepApproval.primaryEvaluationApprovedAt,
          expectedStatus: 'approved',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          stepApprovalStatus: status?.stepApproval?.primaryEvaluationStatus,
          approvedBy: status?.stepApproval?.primaryEvaluationApprovedBy,
          approvedAt: status?.stepApproval?.primaryEvaluationApprovedAt,
          expectedStatus: 'approved',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 6: revision_requested - 재작성 요청되었으면 primary.status는 revision_requested이어야 한다', async () => {
    let status: any;
    let revisionRequests: any;
    let error: any;
    const testName =
      '상태 6: revision_requested - 재작성 요청되었으면 primary.status는 revision_requested이어야 한다';

    try {
      // Given - 모든 WBS에 대해 자기평가 저장 및 1차 하향평가 저장 및 제출
      for (const wbsItemId of testWbsItemIds) {
        // 자기평가 저장
        const 자기평가결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: evaluateeId,
            wbsItemId: wbsItemId,
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
          });

        // 1차 하향평가 저장
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });

        // 1차 하향평가 제출 (완료 처리를 위해)
        await downwardEvaluationScenario.일차하향평가를_제출한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
        });
      }

      // Given - 1차 하향평가 단계 재작성 요청
      // 재작성 요청이 있으면 제출 여부와 상관없이 revision_requested 상태로 표시됨
      await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        status: 'revision_requested',
        revisionComment: '재작성 요청 코멘트입니다.',
      });

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe(
        'revision_requested',
      );
      expect(status.stepApproval.primaryEvaluationStatus).toBe(
        'revision_requested',
      );

      // 재작성 요청이 생성되었는지 확인
      revisionRequests = await stepApprovalScenario.재작성요청_목록을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        step: 'primary',
      });
      expect(revisionRequests.length).toBeGreaterThan(0);

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          stepApprovalStatus: status.stepApproval.primaryEvaluationStatus,
          revisionRequestCount: revisionRequests.length,
          expectedStatus: 'revision_requested',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          stepApprovalStatus: status?.stepApproval?.primaryEvaluationStatus,
          revisionRequestCount: revisionRequests?.length,
          expectedStatus: 'revision_requested',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 7: revision_completed - 재작성 완료되었으면 primary.status는 revision_completed이어야 한다', async () => {
    let status: any;
    let revisionRequests: any;
    let requestId: string | undefined;
    let error: any;
    const testName =
      '상태 7: revision_completed - 재작성 완료되었으면 primary.status는 revision_completed이어야 한다';

    try {
      // Given - 자기평가 저장
      const 자기평가결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

      // Given - 모든 WBS에 대해 1차 하향평가 저장
      for (const wbsItemId of testWbsItemIds) {
        await downwardEvaluationScenario.일차하향평가를_저장한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
          selfEvaluationId: 자기평가결과.id,
          downwardEvaluationContent: '1차 하향평가 내용',
          downwardEvaluationScore: 90,
        });
      }

      // Given - 1차 하향평가 단계 재작성 요청
      await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        status: 'revision_requested',
        revisionComment: '재작성 요청 코멘트입니다.',
      });

      // Given - 재작성 요청 조회
      revisionRequests = await stepApprovalScenario.재작성요청_목록을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        step: 'primary',
        isCompleted: false,
      });
      expect(revisionRequests.length).toBeGreaterThan(0);
      const revisionRequest = revisionRequests[0];
      requestId = revisionRequest.requestId;
      const recipientId = revisionRequest.recipientId;

      if (!requestId) {
        throw new Error('재작성 요청 ID를 찾을 수 없습니다.');
      }

      if (!recipientId) {
        throw new Error('재작성 요청 수신자 ID를 찾을 수 없습니다.');
      }

      // Given - 재작성 완료 응답 제출 (관리자용 API 사용 - 1차 평가자가 수신자)
      await stepApprovalScenario.재작성완료_응답을_제출한다_관리자용({
        evaluationPeriodId,
        employeeId: evaluateeId,
        evaluatorId: recipientId, // 1차 평가자 ID
        step: 'primary',
        responseComment: '재작성 완료 응답 코멘트입니다.',
      });

      // When
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // Then
      expect(status.downwardEvaluation.primary.status).toBe(
        'revision_completed',
      );
      expect(status.stepApproval.primaryEvaluationStatus).toBe(
        'revision_completed',
      );

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status.downwardEvaluation.primary.status,
          stepApprovalStatus: status.stepApproval.primaryEvaluationStatus,
          requestId: requestId,
          expectedStatus: 'revision_completed',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          status: status?.downwardEvaluation?.primary?.status,
          stepApprovalStatus: status?.stepApproval?.primaryEvaluationStatus,
          requestId: requestId,
          expectedStatus: 'revision_completed',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });

  it('상태 전환: none → in_progress → pending → approved 순서로 상태가 변경되어야 한다', async () => {
    let status: any;
    let statusTransitions: any[] = [];
    let error: any;
    const testName =
      '상태 전환: none → in_progress → pending → approved 순서로 상태가 변경되어야 한다';

    try {
      // 0단계: none 상태 (WBS 할당은 있지만 하향평가가 없는 상태)
      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });
      expect(status.downwardEvaluation.primary.status).toBe('none');
      expect(
        status.downwardEvaluation.primary.assignedWbsCount,
      ).toBeGreaterThan(0);
      expect(status.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      );
      statusTransitions.push({
        step: '0단계',
        status: 'none',
        actualStatus: status.downwardEvaluation.primary.status,
        assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
        completedEvaluationCount:
          status.downwardEvaluation.primary.completedEvaluationCount,
        passed: status.downwardEvaluation.primary.status === 'none',
      });

      // Given - 자기평가 저장
      const 자기평가결과 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
        });

      // 1단계: in_progress 상태 (하향평가를 작성만 한 상태, 제출 전)
      await downwardEvaluationScenario.일차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: testWbsItemIds[0],
        evaluatorId,
        selfEvaluationId: 자기평가결과.id,
        downwardEvaluationContent: '1차 하향평가 내용',
        downwardEvaluationScore: 90,
      });

      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });
      expect(status.downwardEvaluation.primary.status).toBe('in_progress');
      expect(status.downwardEvaluation.primary.completedEvaluationCount).toBe(
        0,
      ); // 제출하지 않았으므로 0
      statusTransitions.push({
        step: '1단계',
        status: 'in_progress',
        actualStatus: status.downwardEvaluation.primary.status,
        completedEvaluationCount:
          status.downwardEvaluation.primary.completedEvaluationCount,
        passed: status.downwardEvaluation.primary.status === 'in_progress',
      });

      // 2단계: pending 상태 (모든 WBS 완료 및 제출)
      // 두 번째 WBS에 대한 자기평가 저장
      const 자기평가결과2 =
        await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: testWbsItemIds[1],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용 2',
          selfEvaluationScore: 85,
        });

      // 두 번째 WBS에 대한 1차 하향평가 저장
      await downwardEvaluationScenario.일차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: testWbsItemIds[1],
        evaluatorId,
        selfEvaluationId: 자기평가결과2.id,
        downwardEvaluationContent: '1차 하향평가 내용 2',
        downwardEvaluationScore: 90,
      });

      // 모든 WBS에 대해 1차 하향평가 제출
      for (const wbsItemId of testWbsItemIds) {
        await downwardEvaluationScenario.일차하향평가를_제출한다({
          evaluateeId,
          periodId: evaluationPeriodId,
          wbsId: wbsItemId,
          evaluatorId,
        });
      }

      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });
      expect(status.downwardEvaluation.primary.status).toBe('pending');
      expect(status.downwardEvaluation.primary.completedEvaluationCount).toBe(
        status.downwardEvaluation.primary.assignedWbsCount,
      );
      expect(status.downwardEvaluation.primary.isSubmitted).toBe(true);
      expect(status.stepApproval.primaryEvaluationStatus).toBe('pending');
      statusTransitions.push({
        step: '2단계',
        status: 'pending',
        actualStatus: status.downwardEvaluation.primary.status,
        completedEvaluationCount:
          status.downwardEvaluation.primary.completedEvaluationCount,
        assignedWbsCount: status.downwardEvaluation.primary.assignedWbsCount,
        isSubmitted: status.downwardEvaluation.primary.isSubmitted,
        stepApprovalStatus: status.stepApproval.primaryEvaluationStatus,
        passed: status.downwardEvaluation.primary.status === 'pending',
      });

      // 3단계: approved 상태 (승인)
      await stepApprovalScenario.일차하향평가_단계승인_상태를_변경한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
        status: 'approved',
      });

      status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });
      expect(status.downwardEvaluation.primary.status).toBe('approved');
      expect(status.stepApproval.primaryEvaluationStatus).toBe('approved');
      expect(status.stepApproval.primaryEvaluationApprovedBy).toBeDefined();
      expect(status.stepApproval.primaryEvaluationApprovedAt).toBeDefined();
      statusTransitions.push({
        step: '3단계',
        status: 'approved',
        actualStatus: status.downwardEvaluation.primary.status,
        stepApprovalStatus: status.stepApproval.primaryEvaluationStatus,
        approvedBy: status.stepApproval.primaryEvaluationApprovedBy,
        approvedAt: status.stepApproval.primaryEvaluationApprovedAt,
        passed: status.downwardEvaluation.primary.status === 'approved',
      });

      // 테스트 결과 저장 (성공)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          statusTransitions,
          finalStatus: status.downwardEvaluation.primary.status,
          expectedFinalStatus: 'approved',
          passed: true,
        },
      });
    } catch (e) {
      error = e;
      // 테스트 결과 저장 (실패)
      testResults.push({
        testName,
        result: {
          employeeId: evaluateeId,
          statusTransitions,
          finalStatus: status?.downwardEvaluation?.primary?.status,
          expectedFinalStatus: 'approved',
          passed: false,
          error: extractErrorMessage(error),
        },
      });
      throw e;
    }
  });
});
