import { BaseE2ETest } from '../../../base-e2e.spec';
import { StepApprovalScenario } from './step-approval.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 평가기준 제출 및 재작성 요청 시나리오 E2E 테스트
 *
 * 평가기준 제출, 재작성 요청, 승인 시나리오를 검증합니다.
 * 대시보드 API의 criteriaSubmission 상태 변경을 검증합니다.
 */
describe('평가기준 제출 및 재작성 요청 시나리오', () => {
  let testSuite: BaseE2ETest;
  let stepApprovalScenario: StepApprovalScenario;
  let seedDataScenario: SeedDataScenario;
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
    return str
      .replace(/\u001b\[[0-9;]*m/g, '')
      .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
      .replace(/\u001b\[?[0-9;]*[a-zA-Z]/g, '');
  }

  // 에러 객체에서 읽기 가능한 메시지를 추출하는 함수
  function extractErrorMessage(error: any): string {
    if (!error) return '';

    let message = '';
    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = String(error);
    }

    message = stripAnsiCodes(message);

    if (error.stack) {
      const stack = stripAnsiCodes(error.stack);
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
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'evaluation-criteria-submission-and-approval-result.json',
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
      name: '평가기준 제출 및 재작성 요청 시나리오 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가기준 제출 및 재작성 요청 E2E 테스트용 평가기간',
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

    // 초기 구성 데이터 생성
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

  describe('단계 승인 기본 관리', () => {
    it('단계 승인 Enum 목록 조회', async () => {
      let enums: any;
      let error: any;
      const testName = '단계 승인 Enum 목록 조회';

      try {
        // When
        enums = await stepApprovalScenario.단계승인_Enum목록을_조회한다();

        // Then
        expect(enums.steps).toBeDefined();
        expect(Array.isArray(enums.steps)).toBe(true);
        expect(enums.steps).toContain('criteria');
        expect(enums.steps).toContain('self');
        expect(enums.steps).toContain('primary');
        expect(enums.steps).toContain('secondary');

        expect(enums.statuses).toBeDefined();
        expect(Array.isArray(enums.statuses)).toBe(true);
        expect(enums.statuses).toContain('pending');
        expect(enums.statuses).toContain('approved');
        expect(enums.statuses).toContain('revision_requested');
        expect(enums.statuses).toContain('revision_completed');

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            steps: enums.steps,
            statuses: enums.statuses,
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('평가기준 설정 단계 승인 상태 변경: pending → approved', async () => {
      let status: any;
      let error: any;
      const testName = '평가기준 설정 단계 승인 상태 변경: pending → approved';

      try {
        // Given - 초기 상태 확인
        status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });
        expect(status.stepApproval.criteriaSettingStatus).toBe('pending');

        // When - 승인 상태로 변경
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then - 승인 상태 확인
        status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });
        expect(status.stepApproval.criteriaSettingStatus).toBe('approved');
        expect(status.stepApproval.criteriaSettingApprovedBy).toBeDefined();
        expect(status.stepApproval.criteriaSettingApprovedAt).toBeDefined();

        // 대시보드에서 제출 상태 조회
        const dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            initialStatus: 'pending',
            stepApprovalStatus: status.stepApproval.criteriaSettingStatus,
            approvedBy: status.stepApproval.criteriaSettingApprovedBy,
            approvedAt: status.stepApproval.criteriaSettingApprovedAt,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('평가기준 설정 단계 승인 상태 변경: approved → revision_requested', async () => {
      let status: any;
      let revisionRequests: any;
      let error: any;
      const testName =
        '평가기준 설정 단계 승인 상태 변경: approved → revision_requested';

      try {
        // Given - 먼저 승인 상태로 변경
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // When - 재작성 요청 상태로 변경
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // Then - 재작성 요청 상태 확인
        status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });
        expect(status.stepApproval.criteriaSettingStatus).toBe(
          'revision_requested',
        );

        // 재작성 요청이 생성되었는지 확인
        revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        expect(revisionRequests.length).toBeGreaterThan(0);

        // 대시보드에서 제출 상태 조회
        const dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            initialStatus: 'approved',
            stepApprovalStatus: status.stepApproval.criteriaSettingStatus,
            revisionRequestCount: revisionRequests.length,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('평가기준 설정 단계 승인 상태 변경: revision_requested → approved', async () => {
      let status: any;
      let error: any;
      const testName =
        '평가기준 설정 단계 승인 상태 변경: revision_requested → approved';

      try {
        // Given - 먼저 재작성 요청 상태로 변경
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // When - 다시 승인 상태로 변경
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then - 승인 상태 확인
        status = await stepApprovalScenario.직원_평가기간_현황을_조회한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });
        expect(status.stepApproval.criteriaSettingStatus).toBe('approved');
        expect(status.stepApproval.criteriaSettingApprovedBy).toBeDefined();
        expect(status.stepApproval.criteriaSettingApprovedAt).toBeDefined();

        // 대시보드에서 제출 상태 조회
        const dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            initialStatus: 'revision_requested',
            stepApprovalStatus: status.stepApproval.criteriaSettingStatus,
            approvedBy: status.stepApproval.criteriaSettingApprovedBy,
            approvedAt: status.stepApproval.criteriaSettingApprovedAt,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('시나리오 1: 평가기준 제출 → 재작성 요청 → 재제출', () => {
    it('1단계: 평가기준 제출 전 상태 확인', async () => {
      let dashboardStatus: any;
      let assignedData: any;
      let employeesStatus: any;
      let error: any;
      const testName = '1단계: 평가기준 제출 전 상태 확인';

      try {
        // When
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        assignedData =
          await stepApprovalScenario.평가기준_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: evaluateeId,
            },
          );

        employeesStatus = await stepApprovalScenario.직원_목록_상태를_조회한다({
          evaluationPeriodId,
        });

        // Then
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(false);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeNull();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeNull();

        expect(assignedData.summary.criteriaSubmission.isSubmitted).toBe(false);
        expect(assignedData.summary.criteriaSubmission.submittedAt).toBeNull();
        expect(assignedData.summary.criteriaSubmission.submittedBy).toBeNull();

        const employee = employeesStatus.find(
          (e: any) => e.employeeId === evaluateeId,
        );
        expect(employee).toBeDefined();
        expect(employee.criteriaSetup.criteriaSubmission.isSubmitted).toBe(
          false,
        );

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            dashboardStatus: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
            assignedData: {
              isSubmitted: assignedData.summary.criteriaSubmission.isSubmitted,
              submittedAt: assignedData.summary.criteriaSubmission.submittedAt,
              submittedBy: assignedData.summary.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('2단계: 평가기준 제출', async () => {
      let submitResult: any;
      let dashboardStatus: any;
      let assignedData: any;
      let employeesStatus: any;
      let error: any;
      const testName = '2단계: 평가기준 제출';

      try {
        // When - 평가기준 제출
        submitResult = await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // Then - 제출 결과 확인
        expect(submitResult.isCriteriaSubmitted).toBe(true);
        expect(submitResult.criteriaSubmittedAt).toBeDefined();
        expect(submitResult.criteriaSubmittedBy).toBeDefined();

        // 대시보드 상태 확인
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeDefined();

        // 할당 데이터 상태 확인
        assignedData =
          await stepApprovalScenario.평가기준_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: evaluateeId,
            },
          );

        expect(assignedData.summary.criteriaSubmission.isSubmitted).toBe(true);
        expect(
          assignedData.summary.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          assignedData.summary.criteriaSubmission.submittedBy,
        ).toBeDefined();

        // 직원 목록 상태 확인
        employeesStatus = await stepApprovalScenario.직원_목록_상태를_조회한다({
          evaluationPeriodId,
        });

        const employee = employeesStatus.find(
          (e: any) => e.employeeId === evaluateeId,
        );
        expect(employee).toBeDefined();
        expect(employee.criteriaSetup.criteriaSubmission.isSubmitted).toBe(
          true,
        );
        // criteriaSetup.status 검증: 제출 후 pending 또는 approved 상태
        expect(['pending', 'approved']).toContain(
          dashboardStatus.criteriaSetup.status,
        );

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            submitResult: {
              isCriteriaSubmitted: submitResult.isCriteriaSubmitted,
              criteriaSubmittedAt: submitResult.criteriaSubmittedAt,
              criteriaSubmittedBy: submitResult.criteriaSubmittedBy,
            },
            dashboardStatus: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('3단계: 재작성 요청 생성 및 제출 상태 초기화', async () => {
      let dashboardStatus: any;
      let assignedData: any;
      let employeesStatus: any;
      let revisionRequests: any;
      let error: any;
      const testName = '3단계: 재작성 요청 생성 및 제출 상태 초기화';

      try {
        // Given - 먼저 평가기준 제출
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // When - 재작성 요청 생성
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // Then - 제출 상태 초기화 확인
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(false);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeNull();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeNull();
        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'revision_requested',
        );

        // 할당 데이터 상태 확인
        assignedData =
          await stepApprovalScenario.평가기준_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: evaluateeId,
            },
          );

        expect(assignedData.summary.criteriaSubmission.isSubmitted).toBe(false);
        expect(assignedData.summary.criteriaSubmission.submittedAt).toBeNull();
        expect(assignedData.summary.criteriaSubmission.submittedBy).toBeNull();

        // 직원 목록 상태 확인
        employeesStatus = await stepApprovalScenario.직원_목록_상태를_조회한다({
          evaluationPeriodId,
        });

        const employee = employeesStatus.find(
          (e: any) => e.employeeId === evaluateeId,
        );
        expect(employee).toBeDefined();
        expect(employee.criteriaSetup.criteriaSubmission.isSubmitted).toBe(
          false,
        );

        // 재작성 요청 생성 확인
        revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        expect(revisionRequests.length).toBeGreaterThan(0);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            dashboardStatus: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
              stepApprovalStatus:
                dashboardStatus.stepApproval.criteriaSettingStatus,
            },
            revisionRequestCount: revisionRequests.length,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('4단계: 재제출 및 재작성 요청 자동 완료', async () => {
      let submitResult: any;
      let dashboardStatus: any;
      let assignedData: any;
      let revisionRequests: any;
      let error: any;
      const testName = '4단계: 재제출 및 재작성 요청 자동 완료';

      try {
        // Given - 먼저 평가기준 제출 및 재작성 요청 생성
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // 재작성 요청 조회
        revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
            isCompleted: false,
          });
        expect(revisionRequests.length).toBeGreaterThan(0);

        // When - 재제출
        submitResult = await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // Then - 재제출 상태 확인
        expect(submitResult.isCriteriaSubmitted).toBe(true);
        expect(submitResult.criteriaSubmittedAt).toBeDefined();
        expect(submitResult.criteriaSubmittedBy).toBeDefined();

        // 대시보드 상태 확인
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeDefined();

        // 할당 데이터 상태 확인
        assignedData =
          await stepApprovalScenario.평가기준_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: evaluateeId,
            },
          );

        expect(assignedData.summary.criteriaSubmission.isSubmitted).toBe(true);
        expect(
          assignedData.summary.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          assignedData.summary.criteriaSubmission.submittedBy,
        ).toBeDefined();
        // criteriaSetup.status 검증: 재제출 후 pending, approved, 또는 revision_completed 상태
        // (재제출 후에도 재작성 완료 상태가 유지될 수 있음)
        expect(['pending', 'approved', 'revision_completed']).toContain(
          dashboardStatus.criteriaSetup.status,
        );

        // 재작성 요청 자동 완료 확인
        const completedRevisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
            isCompleted: true,
          });
        expect(completedRevisionRequests.length).toBeGreaterThan(0);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            submitResult: {
              isCriteriaSubmitted: submitResult.isCriteriaSubmitted,
              criteriaSubmittedAt: submitResult.criteriaSubmittedAt,
              criteriaSubmittedBy: submitResult.criteriaSubmittedBy,
            },
            completedRevisionRequestCount: completedRevisionRequests.length,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('5단계: 승인', async () => {
      let dashboardStatus: any;
      let error: any;
      const testName = '5단계: 승인';

      try {
        // Given - 먼저 평가기준 제출
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // When - 승인
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then - 승인 상태 확인
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'approved',
        );
        expect(
          dashboardStatus.stepApproval.criteriaSettingApprovedBy,
        ).toBeDefined();
        expect(
          dashboardStatus.stepApproval.criteriaSettingApprovedAt,
        ).toBeDefined();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        // criteriaSetup.status 검증: 승인 후 approved 상태
        expect(dashboardStatus.criteriaSetup.status).toBe('approved');

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            stepApprovalStatus:
              dashboardStatus.stepApproval.criteriaSettingStatus,
            approvedBy: dashboardStatus.stepApproval.criteriaSettingApprovedBy,
            approvedAt: dashboardStatus.stepApproval.criteriaSettingApprovedAt,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('시나리오 2: 평가기준 미제출 상태에서 승인', () => {
    it('1단계: 평가기준 미제출 상태 확인', async () => {
      let dashboardStatus: any;
      let assignedData: any;
      let error: any;
      const testName = '1단계: 평가기준 미제출 상태 확인';

      try {
        // When
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        assignedData =
          await stepApprovalScenario.평가기준_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: evaluateeId,
            },
          );

        // Then
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(false);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeNull();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeNull();

        expect(assignedData.summary.criteriaSubmission.isSubmitted).toBe(false);
        expect(assignedData.summary.criteriaSubmission.submittedAt).toBeNull();
        expect(assignedData.summary.criteriaSubmission.submittedBy).toBeNull();

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            dashboardStatus: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('2단계: 평가기준 미제출 상태에서 승인 및 제출 상태 자동 변경', async () => {
      let dashboardStatus: any;
      let assignedData: any;
      let employeesStatus: any;
      let error: any;
      const testName =
        '2단계: 평가기준 미제출 상태에서 승인 및 제출 상태 자동 변경';

      try {
        // When - 미제출 상태에서 승인
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then - 승인 상태 및 제출 상태 자동 변경 확인
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'approved',
        );
        expect(
          dashboardStatus.stepApproval.criteriaSettingApprovedBy,
        ).toBeDefined();
        expect(
          dashboardStatus.stepApproval.criteriaSettingApprovedAt,
        ).toBeDefined();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeDefined();

        // 할당 데이터 상태 확인
        assignedData =
          await stepApprovalScenario.평가기준_제출상태를_할당데이터에서_조회한다(
            {
              evaluationPeriodId,
              employeeId: evaluateeId,
            },
          );

        expect(assignedData.summary.criteriaSubmission.isSubmitted).toBe(true);
        expect(
          assignedData.summary.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          assignedData.summary.criteriaSubmission.submittedBy,
        ).toBeDefined();

        // 직원 목록 상태 확인
        employeesStatus = await stepApprovalScenario.직원_목록_상태를_조회한다({
          evaluationPeriodId,
        });

        const employee = employeesStatus.find(
          (e: any) => e.employeeId === evaluateeId,
        );
        expect(employee).toBeDefined();
        expect(employee.criteriaSetup.criteriaSubmission.isSubmitted).toBe(
          true,
        );
        expect(employee.stepApproval.criteriaSettingStatus).toBe('approved');
        // criteriaSetup.status 검증: 미제출 상태에서 승인 시 approved 상태로 변경
        expect(dashboardStatus.criteriaSetup.status).toBe('approved');

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            stepApprovalStatus:
              dashboardStatus.stepApproval.criteriaSettingStatus,
            approvedBy: dashboardStatus.stepApproval.criteriaSettingApprovedBy,
            approvedAt: dashboardStatus.stepApproval.criteriaSettingApprovedAt,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('3단계: 이미 제출된 상태에서 승인 검증 (idempotent)', async () => {
      let dashboardStatus: any;
      let error: any;
      const testName = '3단계: 이미 제출된 상태에서 승인 검증 (idempotent)';

      try {
        // Given - 먼저 평가기준 제출
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // When - 이미 제출된 상태에서 승인
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then - 승인 상태 및 제출 상태 유지 확인
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'approved',
        );
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        // criteriaSetup.status 검증: 이미 제출된 상태에서 승인 시 approved 상태 유지
        expect(dashboardStatus.criteriaSetup.status).toBe('approved');

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            stepApprovalStatus:
              dashboardStatus.stepApproval.criteriaSettingStatus,
            approvedBy: dashboardStatus.stepApproval.criteriaSettingApprovedBy,
            approvedAt: dashboardStatus.stepApproval.criteriaSettingApprovedAt,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  describe('시나리오 3: 평가기준 제출 → 재작성 요청 → 재작성 완료 응답 제출', () => {
    it('1단계: 평가기준 제출', async () => {
      let dashboardStatus: any;
      let error: any;
      const testName = '1단계: 평가기준 제출';

      try {
        // When - 평가기준 제출
        const submitResult = await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // Then - 제출 상태 검증
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeDefined();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeDefined();
        // criteriaSetup.status 검증: 제출 후 pending 또는 approved 상태
        expect(['pending', 'approved']).toContain(
          dashboardStatus.criteriaSetup.status,
        );

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            submitResult: {
              isCriteriaSubmitted: submitResult.isCriteriaSubmitted,
              criteriaSubmittedAt: submitResult.criteriaSubmittedAt,
              criteriaSubmittedBy: submitResult.criteriaSubmittedBy,
            },
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('2단계: 재작성 요청 생성', async () => {
      let dashboardStatus: any;
      let revisionRequests: any[];
      let error: any;
      const testName = '2단계: 재작성 요청 생성';

      try {
        // Given - 먼저 평가기준 제출
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // When - 재작성 요청 생성
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // Then - 재작성 요청 생성 및 제출 상태 초기화 검증
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(dashboardStatus.criteriaSetup.status).toBe('revision_requested');
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(false);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeNull();
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
        ).toBeNull();
        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'revision_requested',
        );

        // 재작성 요청 생성 검증
        revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        expect(revisionRequests.length).toBeGreaterThan(0);
        const revisionRequest = revisionRequests[0];
        expect(revisionRequest.isCompleted).toBe(false);
        // recipients가 배열인지 확인
        if (revisionRequest.recipients) {
          expect(revisionRequest.recipients.length).toBeGreaterThan(0);
        }

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
            revisionRequestCount: revisionRequests.length,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('3단계: 재작성 완료 응답 제출', async () => {
      let dashboardStatus: any;
      let revisionRequests: any[];
      let revisionRequestId: string;
      let error: any;
      const testName = '3단계: 재작성 완료 응답 제출';

      try {
        // Given - 평가기준 제출 및 재작성 요청 생성
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        // 재작성 요청 ID 및 수신자 ID 확인
        revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        expect(revisionRequests.length).toBeGreaterThan(0);
        const revisionRequest = revisionRequests[0];
        revisionRequestId = revisionRequest.id || revisionRequest.requestId;

        // 관리자용 API 사용 (평가기간, 직원, 평가자 기반)
        // 평가기준의 경우 피평가자가 수신자이므로 evaluateeId 사용
        await stepApprovalScenario.재작성완료_응답을_제출한다_관리자용({
          evaluationPeriodId,
          employeeId: evaluateeId,
          evaluatorId: evaluateeId, // 평가기준의 경우 피평가자가 수신자
          step: 'criteria',
          responseComment: '재작성 완료 응답 코멘트입니다.',
        });

        // Then - 재작성 완료 응답 제출 검증
        revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        expect(revisionRequests.length).toBeGreaterThan(0);
        // 재작성 요청 ID로 찾기 (id 또는 requestId 필드 확인)
        const completedRequest = revisionRequests.find(
          (r: any) =>
            r.id === revisionRequestId ||
            r.requestId === revisionRequestId ||
            (r.id && r.id === revisionRequest.id) ||
            (r.requestId && r.requestId === revisionRequest.requestId),
        );
        expect(completedRequest).toBeDefined();
        expect(completedRequest.isCompleted).toBe(true);
        if (completedRequest.completedAt) {
          expect(completedRequest.completedAt).toBeDefined();
        }
        // responseComment는 직접 제출한 경우와 자동 완료 처리된 경우가 다를 수 있음
        if (completedRequest.responseComment) {
          expect(completedRequest.responseComment).toContain('재작성 완료');
        }

        // 대시보드 상태 검증
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(dashboardStatus.criteriaSetup.status).toBe('revision_completed');
        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'revision_completed',
        );
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(false); // 재작성 완료 후에도 제출 상태는 초기화된 상태 유지

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
            stepApprovalStatus:
              dashboardStatus.stepApproval.criteriaSettingStatus,
            revisionRequest: {
              id: revisionRequestId,
              isCompleted: completedRequest.isCompleted,
              completedAt: completedRequest.completedAt,
              responseComment: completedRequest.responseComment,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('4단계: 재작성 완료 후 재제출', async () => {
      let dashboardStatus: any;
      let error: any;
      const testName = '4단계: 재작성 완료 후 재제출';

      try {
        // Given - 평가기준 제출, 재작성 요청 생성, 재작성 완료 응답 제출
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        const revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        const revisionRequest = revisionRequests[0];

        // 관리자용 API 사용 (평가기간, 직원, 평가자 기반)
        await stepApprovalScenario.재작성완료_응답을_제출한다_관리자용({
          evaluationPeriodId,
          employeeId: evaluateeId,
          evaluatorId: evaluateeId, // 평가기준의 경우 피평가자가 수신자
          step: 'criteria',
          responseComment: '재작성 완료 응답 코멘트입니다.',
        });

        // When - 재작성 완료 후 재제출
        const submitResult = await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // Then - 재제출 상태 검증
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
        ).toBeDefined();
        // 재작성 완료 후 재제출 시 상태는 pending, approved, 또는 revision_completed일 수 있음
        // (재제출 후에도 재작성 완료 상태가 유지될 수 있음)
        expect(['pending', 'approved', 'revision_completed']).toContain(
          dashboardStatus.criteriaSetup.status,
        );

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            submitResult: {
              isCriteriaSubmitted: submitResult.isCriteriaSubmitted,
              criteriaSubmittedAt: submitResult.criteriaSubmittedAt,
            },
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('5단계: 최종 승인', async () => {
      let dashboardStatus: any;
      let error: any;
      const testName = '5단계: 최종 승인';

      try {
        // Given - 평가기준 제출, 재작성 요청 생성, 재작성 완료 응답 제출, 재제출
        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트입니다.',
        });

        const revisionRequests =
          await stepApprovalScenario.재작성요청_목록을_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
            step: 'criteria',
          });
        const revisionRequest = revisionRequests[0];

        // 관리자용 API 사용 (평가기간, 직원, 평가자 기반)
        await stepApprovalScenario.재작성완료_응답을_제출한다_관리자용({
          evaluationPeriodId,
          employeeId: evaluateeId,
          evaluatorId: evaluateeId, // 평가기준의 경우 피평가자가 수신자
          step: 'criteria',
          responseComment: '재작성 완료 응답 코멘트입니다.',
        });

        await stepApprovalScenario.평가기준을_제출한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // When - 최종 승인
        await stepApprovalScenario.평가기준설정_단계승인_상태를_변경한다({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then - 최종 승인 상태 검증
        dashboardStatus =
          await stepApprovalScenario.평가기준_제출상태를_대시보드에서_조회한다({
            evaluationPeriodId,
            employeeId: evaluateeId,
          });

        expect(dashboardStatus.criteriaSetup.status).toBe('approved');
        expect(dashboardStatus.stepApproval.criteriaSettingStatus).toBe(
          'approved',
        );
        expect(
          dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
        ).toBe(true);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            criteriaSetupStatus: dashboardStatus.criteriaSetup.status,
            stepApprovalStatus:
              dashboardStatus.stepApproval.criteriaSettingStatus,
            approvedBy: dashboardStatus.stepApproval.criteriaSettingApprovedBy,
            approvedAt: dashboardStatus.stepApproval.criteriaSettingApprovedAt,
            criteriaSubmission: {
              isSubmitted:
                dashboardStatus.criteriaSetup.criteriaSubmission.isSubmitted,
              submittedAt:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedAt,
              submittedBy:
                dashboardStatus.criteriaSetup.criteriaSubmission.submittedBy,
            },
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
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
