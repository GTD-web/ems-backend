import { BaseE2ETest } from '../../../base-e2e.spec';
import { EvaluationActivityLogScenario } from './evaluation-activity-log.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { WbsAssignmentScenario } from '../wbs-assignment/wbs-assignment.scenario';
import { SelfEvaluationScenario } from '../self-evaluation.scenario';
import { DownwardEvaluationScenario } from '../performance-evaluation/downward-evaluation/downward-evaluation.scenario';
import { DeliverableScenario } from '../deliverable.scenario';
import { EvaluationLineApiClient } from '../api-clients/evaluation-line.api-client';
import { WbsEvaluationCriteriaApiClient } from '../api-clients/wbs-evaluation-criteria.api-client';
import { WbsSelfEvaluationApiClient } from '../api-clients/wbs-self-evaluation.api-client';
import { StepApprovalApiClient } from '../api-clients/step-approval.api-client';
import * as fs from 'fs';
import * as path from 'path';

describe('평가 활동 내역 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let activityLogScenario: EvaluationActivityLogScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let selfEvaluationScenario: SelfEvaluationScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;
  let deliverableScenario: DeliverableScenario;

  // API 클라이언트
  let evaluationLineApiClient: EvaluationLineApiClient;
  let wbsEvaluationCriteriaApiClient: WbsEvaluationCriteriaApiClient;
  let wbsSelfEvaluationApiClient: WbsSelfEvaluationApiClient;
  let stepApprovalApiClient: StepApprovalApiClient;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];
  let primaryEvaluatorId: string;
  let secondaryEvaluatorId: string;
  let evaluateeId: string;

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
    activityLogScenario = new EvaluationActivityLogScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    selfEvaluationScenario = new SelfEvaluationScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);
    deliverableScenario = new DeliverableScenario(testSuite);

    // API 클라이언트 인스턴스 생성
    evaluationLineApiClient = new EvaluationLineApiClient(testSuite);
    wbsEvaluationCriteriaApiClient = new WbsEvaluationCriteriaApiClient(
      testSuite,
    );
    wbsSelfEvaluationApiClient = new WbsSelfEvaluationApiClient(testSuite);
    stepApprovalApiClient = new StepApprovalApiClient(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'evaluation-activity-log-test-result.json',
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

    // 평가기간 생성 및 시작
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const createdPeriod = await evaluationPeriodScenario.평가기간을_생성한다({
      name: '활동 내역 검증 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '활동 내역 검증 테스트용 평가기간',
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
    });

    await evaluationPeriodScenario.평가기간을_시작한다(createdPeriod.id);

    evaluationPeriodId = createdPeriod.id;

    // 평가자 및 피평가자 설정
    evaluateeId = employeeIds[0];
    primaryEvaluatorId = employeeIds[1];
    secondaryEvaluatorId = employeeIds[2];

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

    await wbsAssignmentScenario.WBS를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: evaluateeId,
      wbsItemId: wbsItemIds[1],
      projectId: projectIds[0],
    });

    // 1차 평가자 구성
    await evaluationLineApiClient.configurePrimaryEvaluator({
      employeeId: evaluateeId,
      periodId: evaluationPeriodId,
      evaluatorId: primaryEvaluatorId,
    });

    // 2차 평가자 구성
    await evaluationLineApiClient.configureSecondaryEvaluator({
      employeeId: evaluateeId,
      wbsItemId: wbsItemIds[0],
      periodId: evaluationPeriodId,
      evaluatorId: secondaryEvaluatorId,
    });

    // 피평가자를 현재 사용자로 설정 (활동 내역의 performedBy가 올바르게 저장되도록)
    const evaluatee = await testSuite
      .getRepository('Employee')
      .findOne({ where: { id: evaluateeId } });

    if (evaluatee) {
      testSuite.setCurrentUser({
        id: evaluatee.id,
        email: evaluatee.email || 'test@example.com',
        name: evaluatee.name,
        employeeNumber: evaluatee.employeeNumber,
      });
    }
  });

  // ==================== 시나리오 1: WBS 자기평가 제출 활동 내역 검증 ====================

  describe('시나리오 1: WBS 자기평가 제출 활동 내역 검증', () => {
    it('자기평가 관리자 제출 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '자기평가 관리자 제출 시 활동 내역이 생성된다';

      try {
        // Given: 자기평가 작성
        const selfEvaluation =
          await selfEvaluationScenario.WBS자기평가를_저장한다({
            employeeId: evaluateeId,
            wbsItemId: wbsItemIds[0],
            periodId: evaluationPeriodId,
            selfEvaluationContent: '자기평가 내용',
            selfEvaluationScore: 85,
            performanceResult: '성과 결과',
          });

        // When: 자기평가 제출
        await selfEvaluationScenario.직원의_전체_WBS자기평가를_제출한다({
          employeeId: evaluateeId,
          periodId: evaluationPeriodId,
        });

        // Then: 활동 내역 검증
        await activityLogScenario.WBS자기평가_제출_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
          activityTitle: 'WBS 자기평가 제출',
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'wbs_self_evaluation',
            activityAction: 'submitted',
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('자기평가 1차 평가자 제출 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '자기평가 1차 평가자 제출 시 활동 내역이 생성된다';

      try {
        // Given: 자기평가 작성
        await selfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과',
        });

        // When: 자기평가 1차 평가자 제출
        await wbsSelfEvaluationApiClient.submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
          {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
          },
        );

        // Then: 활동 내역 검증
        await activityLogScenario.WBS자기평가_제출_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
          activityTitle: 'WBS 자기평가 제출 (1차 평가자)',
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'wbs_self_evaluation',
            activityAction: 'submitted',
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('자기평가 1차 평가자 제출 취소 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '자기평가 1차 평가자 제출 취소 시 활동 내역이 생성된다';

      try {
        // Given: 자기평가 작성 및 1차 평가자 제출
        await selfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과',
        });

        await wbsSelfEvaluationApiClient.submitAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
          {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
          },
        );

        // When: 자기평가 1차 평가자 제출 취소
        await wbsSelfEvaluationApiClient.resetAllWbsSelfEvaluationsToEvaluatorByEmployeePeriod(
          {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
          },
        );

        // Then: 활동 내역 검증
        await activityLogScenario.WBS자기평가_제출취소_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'wbs_self_evaluation',
            activityAction: 'cancelled',
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  // ==================== 시나리오 2: 하향평가 제출 활동 내역 검증 ====================

  describe('시나리오 2: 하향평가 제출 활동 내역 검증', () => {
    beforeEach(async () => {
      // 선행 조건: 자기평가 작성 및 제출
      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과',
      });

      await selfEvaluationScenario.직원의_전체_WBS자기평가를_제출한다({
        employeeId: evaluateeId,
        periodId: evaluationPeriodId,
      });

      // 하향평가 저장
      await downwardEvaluationScenario.일차하향평가를_저장한다({
        evaluateeId,
        periodId: evaluationPeriodId,
        wbsId: wbsItemIds[0],
        evaluatorId: primaryEvaluatorId,
        downwardEvaluationContent: '1차 하향평가 내용',
        downwardEvaluationScore: 90,
      });
    });

    it('하향평가 일괄 제출 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '하향평가 일괄 제출 시 활동 내역이 생성된다';

      try {
        // 1차 평가자를 현재 사용자로 설정 (제출자)
        const evaluator = await testSuite
          .getRepository('Employee')
          .findOne({ where: { id: primaryEvaluatorId } });

        if (evaluator) {
          testSuite.setCurrentUser({
            id: evaluator.id,
            email: evaluator.email || 'test@example.com',
            name: evaluator.name,
            employeeNumber: evaluator.employeeNumber,
          });
        }

        // When: 하향평가 일괄 제출
        const submitResult =
          await downwardEvaluationScenario.피평가자의_모든_하향평가를_일괄_제출한다(
            {
              evaluateeId,
              periodId: evaluationPeriodId,
              evaluatorId: primaryEvaluatorId,
              evaluationType: 'primary',
            },
          );

        // Then: 활동 내역 검증
        await activityLogScenario.하향평가_일괄제출_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: primaryEvaluatorId,
          evaluationType: 'primary',
          submittedCount: submitResult.submittedCount,
          skippedCount: submitResult.skippedCount,
          failedCount: submitResult.failedCount,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'downward_evaluation',
            activityAction: 'submitted',
            evaluationType: 'primary',
            submittedCount: submitResult.submittedCount,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  // ==================== 시나리오 3: 산출물 관리 활동 내역 검증 ====================

  describe('시나리오 3: 산출물 관리 활동 내역 검증', () => {
    it('산출물 생성 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '산출물 생성 시 활동 내역이 생성된다';

      try {
        // When: 산출물 생성
        const deliverable = await deliverableScenario.산출물을_생성한다({
          name: '테스트 산출물',
          type: 'document',
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          description: '테스트 설명',
        });

        // Then: 활동 내역 검증
        await activityLogScenario.산출물_생성_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
          relatedEntityId: deliverable.id,
          deliverableName: '테스트 산출물',
          deliverableType: 'document',
          wbsItemId: wbsItemIds[0],
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'deliverable',
            activityAction: 'created',
            relatedEntityId: deliverable.id,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('산출물 수정 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '산출물 수정 시 활동 내역이 생성된다';

      try {
        // Given: 산출물 생성
        const deliverable = await deliverableScenario.산출물을_생성한다({
          name: '테스트 산출물',
          type: 'document',
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
        });

        // When: 산출물 수정
        await deliverableScenario.산출물을_수정한다({
          id: deliverable.id,
          name: '수정된 산출물',
          updatedBy: evaluateeId,
        });

        // Then: 활동 내역 검증
        await activityLogScenario.산출물_수정_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
          relatedEntityId: deliverable.id,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'deliverable',
            activityAction: 'updated',
            relatedEntityId: deliverable.id,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('산출물 삭제 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '산출물 삭제 시 활동 내역이 생성된다';

      try {
        // Given: 산출물 생성
        const deliverable = await deliverableScenario.산출물을_생성한다({
          name: '테스트 산출물',
          type: 'document',
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
        });

        // When: 산출물 삭제
        await deliverableScenario.산출물을_삭제한다(deliverable.id);

        // Then: 활동 내역 검증
        await activityLogScenario.산출물_삭제_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
          relatedEntityId: deliverable.id,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            activityType: 'deliverable',
            activityAction: 'deleted',
            relatedEntityId: deliverable.id,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  // ==================== 시나리오 4: 단계 승인 상태 변경 활동 내역 검증 ====================

  describe('시나리오 4: 단계 승인 상태 변경 활동 내역 검증', () => {
    beforeEach(async () => {
      // 선행 조건: 평가기준 제출
      await wbsEvaluationCriteriaApiClient.submitEvaluationCriteria({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });
    });

    it('평가기준 설정 승인 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '평가기준 설정 승인 시 활동 내역이 생성된다';

      try {
        // Given: 평가기준 제출 완료 상태
        // 1차 평가자를 현재 사용자로 설정 (승인자)
        const evaluator = await testSuite
          .getRepository('Employee')
          .findOne({ where: { id: primaryEvaluatorId } });

        if (evaluator) {
          testSuite.setCurrentUser({
            id: evaluator.id,
            email: evaluator.email || 'test@example.com',
            name: evaluator.name,
            employeeNumber: evaluator.employeeNumber,
          });
        }

        // When: 평가기준 설정 승인
        await stepApprovalApiClient.updateCriteriaStepApproval({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'approved',
        });

        // Then: 활동 내역 검증
        await activityLogScenario.단계승인_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: primaryEvaluatorId, // 승인자는 1차 평가자로 가정
          step: 'criteria',
          action: 'approved',
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            step: 'criteria',
            action: 'approved',
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('평가기준 설정 재작성 요청 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '평가기준 설정 재작성 요청 시 활동 내역이 생성된다';

      try {
        // Given: 평가기준 제출 완료 상태
        // 1차 평가자를 현재 사용자로 설정 (재작성 요청자)
        const evaluator = await testSuite
          .getRepository('Employee')
          .findOne({ where: { id: primaryEvaluatorId } });

        if (evaluator) {
          testSuite.setCurrentUser({
            id: evaluator.id,
            email: evaluator.email || 'test@example.com',
            name: evaluator.name,
            employeeNumber: evaluator.employeeNumber,
          });
        }

        // When: 평가기준 설정 재작성 요청
        await stepApprovalApiClient.updateCriteriaStepApproval({
          evaluationPeriodId,
          employeeId: evaluateeId,
          status: 'revision_requested',
          revisionComment: '재작성 요청 코멘트',
        });

        // Then: 활동 내역 검증
        await activityLogScenario.단계승인_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: primaryEvaluatorId,
          step: 'criteria',
          action: 'revision_requested',
          revisionComment: '재작성 요청 코멘트',
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            step: 'criteria',
            action: 'revision_requested',
            revisionComment: '재작성 요청 코멘트',
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  // ==================== 시나리오 5: 재작성 완료 활동 내역 검증 ====================

  describe('시나리오 5: 재작성 완료 활동 내역 검증', () => {
    let revisionRequestId: string;

    beforeEach(async () => {
      // 선행 조건: 재작성 요청 생성
      // 평가기준 제출
      await wbsEvaluationCriteriaApiClient.submitEvaluationCriteria({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // 재작성 요청 생성
      await stepApprovalApiClient.updateCriteriaStepApproval({
        evaluationPeriodId,
        employeeId: evaluateeId,
        status: 'revision_requested',
        revisionComment: '재작성 요청',
      });

      // 재작성 요청 ID 조회 (실제 구현에 따라 조정 필요)
      revisionRequestId = 'mock-request-id'; // TODO: 실제 재작성 요청 ID 조회
    });

    it.skip('재작성 완료 응답 제출 시 활동 내역이 생성된다', async () => {
      // When: 재작성 완료 응답 제출
      await testSuite
        .request()
        .post(`/admin/revision-requests/${revisionRequestId}/complete`)
        .send({
          responseComment: '재작성 완료 응답',
        })
        .expect(200);

      // Then: 활동 내역 검증
      await activityLogScenario.재작성완료_활동내역을_검증한다({
        periodId: evaluationPeriodId,
        employeeId: evaluateeId,
        performedBy: evaluateeId,
        step: 'criteria',
        requestId: revisionRequestId,
        responseComment: '재작성 완료 응답',
        allCompleted: true,
      });
    });
  });

  // ==================== 시나리오 6: 평가기준 제출 활동 내역 검증 ====================

  describe('시나리오 6: 평가기준 제출 활동 내역 검증', () => {
    it('평가기준 제출 시 활동 내역이 생성된다', async () => {
      let error: any;
      const testName = '평가기준 제출 시 활동 내역이 생성된다';

      try {
        // When: 평가기준 제출
        await wbsEvaluationCriteriaApiClient.submitEvaluationCriteria({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // Then: 활동 내역 검증
        await activityLogScenario.평가기준_제출_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            performedBy: evaluateeId,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  // ==================== 시나리오 7: 활동 내역 필터링 및 조회 검증 ====================

  describe('시나리오 7: 활동 내역 필터링 및 조회 검증', () => {
    beforeEach(async () => {
      // 다양한 활동 내역 생성
      // 1. 평가기준 제출
      await wbsEvaluationCriteriaApiClient.submitEvaluationCriteria({
        evaluationPeriodId,
        employeeId: evaluateeId,
      });

      // 2. 자기평가 제출
      await selfEvaluationScenario.WBS자기평가를_저장한다({
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
        periodId: evaluationPeriodId,
        selfEvaluationContent: '자기평가 내용',
        selfEvaluationScore: 85,
        performanceResult: '성과 결과',
      });

      await selfEvaluationScenario.직원의_전체_WBS자기평가를_제출한다({
        employeeId: evaluateeId,
        periodId: evaluationPeriodId,
      });

      // 3. 산출물 생성
      await deliverableScenario.산출물을_생성한다({
        name: '테스트 산출물',
        type: 'document',
        employeeId: evaluateeId,
        wbsItemId: wbsItemIds[0],
      });
    });

    it('활동 유형별 필터링이 정상 작동한다', async () => {
      let error: any;
      const testName = '활동 유형별 필터링이 정상 작동한다';

      try {
        // When & Then: 활동 유형별 필터링 검증
        await activityLogScenario.활동_유형별_필터링을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          activityType: 'wbs_self_evaluation',
        });

        await activityLogScenario.활동_유형별_필터링을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          activityType: 'deliverable',
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('날짜 범위 필터링이 정상 작동한다', async () => {
      let error: any;
      const testName = '날짜 범위 필터링이 정상 작동한다';

      try {
        // When & Then: 날짜 범위 필터링 검증
        await activityLogScenario.날짜_범위_필터링을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-12-31T23:59:59Z',
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('페이지네이션이 정상 작동한다', async () => {
      let error: any;
      const testName = '페이지네이션이 정상 작동한다';

      try {
        // When & Then: 페이지네이션 검증
        await activityLogScenario.페이지네이션을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          page: 1,
          limit: 2,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('활동 내역이 최신순으로 정렬된다', async () => {
      let error: any;
      const testName = '활동 내역이 최신순으로 정렬된다';

      try {
        // When & Then: 정렬 검증
        await activityLogScenario.정렬을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });

  // ==================== 시나리오 8: 활동 내역 통합 검증 ====================

  describe('시나리오 8: 활동 내역 통합 검증', () => {
    it('전체 평가 프로세스에서 활동 내역이 올바르게 생성된다', async () => {
      let error: any;
      const testName = '전체 평가 프로세스에서 활동 내역이 올바르게 생성된다';

      try {
        // 1. 평가기준 제출
        await wbsEvaluationCriteriaApiClient.submitEvaluationCriteria({
          evaluationPeriodId,
          employeeId: evaluateeId,
        });

        await activityLogScenario.평가기준_제출_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
        });

        // 2. 자기평가 제출
        await selfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과',
        });

        await selfEvaluationScenario.직원의_전체_WBS자기평가를_제출한다({
          employeeId: evaluateeId,
          periodId: evaluationPeriodId,
        });

        await activityLogScenario.WBS자기평가_제출_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
        });

        // 3. 산출물 생성
        const deliverable = await deliverableScenario.산출물을_생성한다({
          name: '테스트 산출물',
          type: 'document',
          employeeId: evaluateeId,
          wbsItemId: wbsItemIds[0],
        });

        await activityLogScenario.산출물_생성_활동내역을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          performedBy: evaluateeId,
          relatedEntityId: deliverable.id,
          deliverableName: '테스트 산출물',
          deliverableType: 'document',
          wbsItemId: wbsItemIds[0],
        });

        // 4. 전체 활동 내역 조회 및 검증
        const allActivities = await activityLogScenario.활동_내역을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
          limit: 10,
        });

        // 최소 3개의 활동 내역이 있어야 함
        expect(allActivities.items.length).toBeGreaterThanOrEqual(3);

        // 정렬 확인
        await activityLogScenario.정렬을_검증한다({
          periodId: evaluationPeriodId,
          employeeId: evaluateeId,
        });

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId: evaluateeId,
            periodId: evaluationPeriodId,
            totalActivities: allActivities.items.length,
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
            periodId: evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
