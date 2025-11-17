import { BaseE2ETest } from '../../../../../base-e2e.spec';
import { WbsSelfEvaluationScenario } from '../wbs-self-evaluation.scenario';
import { SeedDataScenario } from '../../../seed-data.scenario';
import { EvaluationPeriodScenario } from '../../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../../evaluation-target.scenario';
import { WbsAssignmentScenario } from '../../../wbs-assignment/wbs-assignment.scenario';
import { ProjectAssignmentScenario } from '../../../project-assignment/project-assignment.scenario';
import * as fs from 'fs';
import * as path from 'path';

/**
 * WBS 자기평가 제출 시나리오 E2E 테스트 - 피평가자 → 1차 평가자 제출
 *
 * 피평가자가 자기평가를 작성하고 1차 평가자에게 제출하는 프로세스를 검증합니다.
 * 대시보드 API의 selfEvaluation 상태 변경을 검증합니다.
 */
describe('WBS 자기평가 제출 시나리오 - 피평가자 → 1차 평가자 제출', () => {
  let testSuite: BaseE2ETest;
  let wbsSelfEvaluationScenario: WbsSelfEvaluationScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

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
    wbsSelfEvaluationScenario = new WbsSelfEvaluationScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'wbs-self-evaluation-submit-to-evaluator-result.json',
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
      name: 'WBS 자기평가 제출 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'WBS 자기평가 제출 E2E 테스트용 평가기간',
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

    // 프로젝트 할당
    await projectAssignmentScenario.프로젝트를_할당한다({
      periodId: evaluationPeriodId,
      employeeId: employeeIds[0],
      projectId: projectIds[0],
    });

    // WBS 할당
    for (const wbsItemId of wbsItemIds.slice(0, 3)) {
      await wbsAssignmentScenario.WBS를_할당한다({
        periodId: evaluationPeriodId,
        employeeId: employeeIds[0],
        projectId: projectIds[0],
        wbsItemId,
      });
    }
  });

  describe('시나리오 1: 피평가자 → 1차 평가자 제출', () => {
    it('1-1. 자기평가 작성 및 저장 후 대시보드 상태 검증', async () => {
      let 저장결과: any;
      let 대시보드현황: any;
      let 할당데이터: any;
      let 전체직원현황: any;
      let error: any;
      const testName = '1-1. 자기평가 작성 및 저장 후 대시보드 상태 검증';

      try {
        const employeeId = employeeIds[0];
        const wbsItemId = wbsItemIds[0];

        // Given - 자기평가 저장
        저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId,
          wbsItemId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과',
        });

        // Then - 저장 검증
        expect(저장결과.id).toBeDefined();
        expect(저장결과.employeeId).toBe(employeeId);
        expect(저장결과.wbsItemId).toBe(wbsItemId);
        expect(저장결과.periodId).toBe(evaluationPeriodId);
        expect(저장결과.selfEvaluationContent).toBe('자기평가 내용');
        expect(저장결과.selfEvaluationScore).toBe(85);
        expect(저장결과.performanceResult).toBe('성과 결과');
        expect(저장결과.submittedToEvaluator).toBe(false);
        expect(저장결과.submittedToManager).toBe(false);

        // 대시보드 API 저장 후 검증
        // 1. 개별 직원 평가기간 현황 조회
        대시보드현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        expect(대시보드현황.employeeId).toBe(employeeId);
        expect(대시보드현황.selfEvaluation.status).toBe('in_progress');
        expect(대시보드현황.selfEvaluation.totalMappingCount).toBeGreaterThan(
          0,
        );
        expect(대시보드현황.selfEvaluation.completedMappingCount).toBe(0);
        expect(대시보드현황.selfEvaluation.isSubmittedToEvaluator).toBe(false);
        expect(대시보드현황.selfEvaluation.isSubmittedToManager).toBe(false);
        expect(대시보드현황.selfEvaluation.totalScore).toBeNull();
        expect(대시보드현황.selfEvaluation.grade).toBeNull();

        // 2. 직원 할당 데이터 조회
        할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        expect(할당데이터.employee.id).toBe(employeeId);
        expect(할당데이터.summary.selfEvaluation.totalSelfEvaluations).toBe(1);
        expect(
          할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
        ).toBe(0);
        expect(할당데이터.summary.selfEvaluation.isSubmittedToEvaluator).toBe(
          false,
        );
        expect(할당데이터.summary.selfEvaluation.submittedToManagerCount).toBe(
          0,
        );
        expect(할당데이터.summary.selfEvaluation.isSubmittedToManager).toBe(
          false,
        );
        expect(할당데이터.summary.selfEvaluation.totalScore).toBeNull();
        expect(할당데이터.summary.selfEvaluation.grade).toBeNull();

        // 3. 대시보드 전체 직원 현황 조회
        전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 전체직원현황.find(
          (e: any) => e.employeeId === employeeId,
        );
        expect(직원정보).toBeDefined();
        expect(직원정보.selfEvaluation.status).toBe('in_progress');
        expect(직원정보.selfEvaluation.completedMappingCount).toBe(0);
        expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(false);
        expect(직원정보.selfEvaluation.isSubmittedToManager).toBe(false);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId,
            저장결과: {
              id: 저장결과.id,
              submittedToEvaluator: 저장결과.submittedToEvaluator,
              submittedToManager: 저장결과.submittedToManager,
            },
            대시보드현황: {
              status: 대시보드현황.selfEvaluation.status,
              totalMappingCount: 대시보드현황.selfEvaluation.totalMappingCount,
              completedMappingCount:
                대시보드현황.selfEvaluation.completedMappingCount,
              isSubmittedToEvaluator:
                대시보드현황.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                대시보드현황.selfEvaluation.isSubmittedToManager,
            },
            할당데이터: {
              totalSelfEvaluations:
                할당데이터.summary.selfEvaluation.totalSelfEvaluations,
              submittedToEvaluatorCount:
                할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
              isSubmittedToEvaluator:
                할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                할당데이터.summary.selfEvaluation.isSubmittedToManager,
            },
            전체직원현황: {
              status: 직원정보.selfEvaluation.status,
              completedMappingCount:
                직원정보.selfEvaluation.completedMappingCount,
              isSubmittedToEvaluator:
                직원정보.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                직원정보.selfEvaluation.isSubmittedToManager,
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
            저장결과: 저장결과,
            대시보드현황: 대시보드현황?.selfEvaluation,
            할당데이터: 할당데이터?.summary?.selfEvaluation,
            전체직원현황: 전체직원현황,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('1-2. 피평가자 → 1차 평가자 제출 후 대시보드 상태 검증 (단일 자기평가)', async () => {
      let 저장결과: any;
      let 제출결과: any;
      let 제출전_대시보드현황: any;
      let 제출후_대시보드현황: any;
      let 제출전_할당데이터: any;
      let 제출후_할당데이터: any;
      let 제출전_전체직원현황: any;
      let 제출후_전체직원현황: any;
      let error: any;
      const testName =
        '1-2. 피평가자 → 1차 평가자 제출 후 대시보드 상태 검증 (단일 자기평가)';

      try {
        const employeeId = employeeIds[0];
        const wbsItemId = wbsItemIds[0];

        // Given - 자기평가 저장
        저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId,
          wbsItemId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과',
        });

        // 제출 전 대시보드 상태 조회
        제출전_대시보드현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        제출전_할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        제출전_전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        // When - 피평가자 → 1차 평가자 제출
        제출결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
            저장결과.id,
          );

        // Then - 제출 검증
        expect(제출결과.submittedToEvaluator).toBe(true);
        expect(제출결과.submittedToEvaluatorAt).toBeDefined();
        expect(제출결과.submittedToManager).toBe(false);
        expect(제출결과.submittedToManagerAt).toBeNull();
        expect(제출결과.selfEvaluationContent).toBe('자기평가 내용');
        expect(제출결과.selfEvaluationScore).toBe(85);
        expect(제출결과.performanceResult).toBe('성과 결과');

        // 대시보드 API 제출 후 검증
        // 1. 개별 직원 평가기간 현황 조회
        제출후_대시보드현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        // 단일 자기평가인 경우 isSubmittedToEvaluator는 true
        expect(제출후_대시보드현황.selfEvaluation.isSubmittedToEvaluator).toBe(
          true,
        );
        expect(제출후_대시보드현황.selfEvaluation.isSubmittedToManager).toBe(
          false,
        ); // 관리자 제출 전이므로 false
        expect(제출후_대시보드현황.selfEvaluation.completedMappingCount).toBe(
          0,
        ); // 관리자 제출 전이므로 변경 없음
        expect(제출후_대시보드현황.selfEvaluation.status).toBe('in_progress');
        expect(제출후_대시보드현황.selfEvaluation.totalScore).toBeNull();
        expect(제출후_대시보드현황.selfEvaluation.grade).toBeNull();

        // 2. 직원 할당 데이터 조회
        제출후_할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        expect(
          제출후_할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
        ).toBe(1);
        expect(
          제출후_할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
        ).toBe(true); // 단일 자기평가인 경우
        expect(
          제출후_할당데이터.summary.selfEvaluation.submittedToManagerCount,
        ).toBe(0);
        expect(
          제출후_할당데이터.summary.selfEvaluation.isSubmittedToManager,
        ).toBe(false);
        expect(제출후_할당데이터.summary.selfEvaluation.totalScore).toBeNull();
        expect(제출후_할당데이터.summary.selfEvaluation.grade).toBeNull();

        // 3. 대시보드 전체 직원 현황 조회
        제출후_전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 제출후_전체직원현황.find(
          (e: any) => e.employeeId === employeeId,
        );
        expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(true);
        expect(직원정보.selfEvaluation.isSubmittedToManager).toBe(false);
        expect(직원정보.selfEvaluation.completedMappingCount).toBe(0);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId,
            제출결과: {
              id: 제출결과.id,
              submittedToEvaluator: 제출결과.submittedToEvaluator,
              submittedToEvaluatorAt: 제출결과.submittedToEvaluatorAt,
              submittedToManager: 제출결과.submittedToManager,
            },
            제출전후_비교: {
              대시보드현황: {
                제출전: {
                  isSubmittedToEvaluator:
                    제출전_대시보드현황.selfEvaluation.isSubmittedToEvaluator,
                  isSubmittedToManager:
                    제출전_대시보드현황.selfEvaluation.isSubmittedToManager,
                  completedMappingCount:
                    제출전_대시보드현황.selfEvaluation.completedMappingCount,
                },
                제출후: {
                  isSubmittedToEvaluator:
                    제출후_대시보드현황.selfEvaluation.isSubmittedToEvaluator,
                  isSubmittedToManager:
                    제출후_대시보드현황.selfEvaluation.isSubmittedToManager,
                  completedMappingCount:
                    제출후_대시보드현황.selfEvaluation.completedMappingCount,
                },
              },
              할당데이터: {
                제출전: {
                  submittedToEvaluatorCount:
                    제출전_할당데이터.summary.selfEvaluation
                      .submittedToEvaluatorCount,
                  isSubmittedToEvaluator:
                    제출전_할당데이터.summary.selfEvaluation
                      .isSubmittedToEvaluator,
                  isSubmittedToManager:
                    제출전_할당데이터.summary.selfEvaluation
                      .isSubmittedToManager,
                },
                제출후: {
                  submittedToEvaluatorCount:
                    제출후_할당데이터.summary.selfEvaluation
                      .submittedToEvaluatorCount,
                  isSubmittedToEvaluator:
                    제출후_할당데이터.summary.selfEvaluation
                      .isSubmittedToEvaluator,
                  isSubmittedToManager:
                    제출후_할당데이터.summary.selfEvaluation
                      .isSubmittedToManager,
                },
              },
            },
            전체직원현황: {
              isSubmittedToEvaluator:
                직원정보.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                직원정보.selfEvaluation.isSubmittedToManager,
              completedMappingCount:
                직원정보.selfEvaluation.completedMappingCount,
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
            제출결과: 제출결과,
            제출후_대시보드현황: 제출후_대시보드현황?.selfEvaluation,
            제출후_할당데이터: 제출후_할당데이터?.summary?.selfEvaluation,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('1-3. 피평가자 → 1차 평가자 제출 후 대시보드 상태 검증 (다중 자기평가)', async () => {
      let 저장결과1: any;
      let 저장결과2: any;
      let 제출결과1: any;
      let 제출후_대시보드현황: any;
      let 제출후_할당데이터: any;
      let error: any;
      const testName =
        '1-3. 피평가자 → 1차 평가자 제출 후 대시보드 상태 검증 (다중 자기평가)';

      try {
        const employeeId = employeeIds[0];

        // Given - 자기평가 2개 저장
        저장결과1 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId,
          wbsItemId: wbsItemIds[0],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용 1',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과 1',
        });

        저장결과2 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId,
          wbsItemId: wbsItemIds[1],
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용 2',
          selfEvaluationScore: 90,
          performanceResult: '성과 결과 2',
        });

        // When - 첫 번째 자기평가만 제출
        제출결과1 =
          await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
            저장결과1.id,
          );

        // Then - 제출 검증
        expect(제출결과1.submittedToEvaluator).toBe(true);

        // 대시보드 API 제출 후 검증
        // 1. 개별 직원 평가기간 현황 조회
        제출후_대시보드현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        // 다중 자기평가 중 일부만 제출한 경우 isSubmittedToEvaluator는 false
        expect(제출후_대시보드현황.selfEvaluation.totalMappingCount).toBe(2);
        expect(제출후_대시보드현황.selfEvaluation.isSubmittedToEvaluator).toBe(
          false, // 일부만 제출
        );
        expect(제출후_대시보드현황.selfEvaluation.isSubmittedToManager).toBe(
          false, // 관리자 제출 전이므로 false
        );
        expect(제출후_대시보드현황.selfEvaluation.completedMappingCount).toBe(
          0,
        );

        // 2. 직원 할당 데이터 조회
        제출후_할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        expect(
          제출후_할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
        ).toBe(1);
        expect(
          제출후_할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
        ).toBe(false); // 일부만 제출
        expect(
          제출후_할당데이터.summary.selfEvaluation.isSubmittedToManager,
        ).toBe(false); // 관리자 제출 전이므로 false

        // 3. 대시보드 전체 직원 현황 조회
        const 제출후_전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 제출후_전체직원현황.find(
          (e: any) => e.employeeId === employeeId,
        );
        expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(false);
        expect(직원정보.selfEvaluation.isSubmittedToManager).toBe(false);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId,
            저장결과: {
              저장1: 저장결과1.id,
              저장2: 저장결과2.id,
            },
            제출결과: {
              id: 제출결과1.id,
              submittedToEvaluator: 제출결과1.submittedToEvaluator,
            },
            대시보드현황: {
              totalMappingCount:
                제출후_대시보드현황.selfEvaluation.totalMappingCount,
              isSubmittedToEvaluator:
                제출후_대시보드현황.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                제출후_대시보드현황.selfEvaluation.isSubmittedToManager,
              completedMappingCount:
                제출후_대시보드현황.selfEvaluation.completedMappingCount,
            },
            할당데이터: {
              submittedToEvaluatorCount:
                제출후_할당데이터.summary.selfEvaluation
                  .submittedToEvaluatorCount,
              isSubmittedToEvaluator:
                제출후_할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                제출후_할당데이터.summary.selfEvaluation.isSubmittedToManager,
            },
            전체직원현황: {
              isSubmittedToEvaluator:
                직원정보.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                직원정보.selfEvaluation.isSubmittedToManager,
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
            제출결과: 제출결과1,
            제출후_대시보드현황: 제출후_대시보드현황?.selfEvaluation,
            제출후_할당데이터: 제출후_할당데이터?.summary?.selfEvaluation,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('1-4. 피평가자 → 1차 평가자 제출 취소 (원복) 후 대시보드 상태 검증', async () => {
      let 저장결과: any;
      let 제출결과: any;
      let 취소결과: any;
      let 취소전_대시보드현황: any;
      let 취소후_대시보드현황: any;
      let 취소전_할당데이터: any;
      let 취소후_할당데이터: any;
      let error: any;
      const testName =
        '1-4. 피평가자 → 1차 평가자 제출 취소 (원복) 후 대시보드 상태 검증';

      try {
        const employeeId = employeeIds[0];
        const wbsItemId = wbsItemIds[0];

        // Given - 자기평가 저장 및 제출
        저장결과 = await wbsSelfEvaluationScenario.WBS자기평가를_저장한다({
          employeeId,
          wbsItemId,
          periodId: evaluationPeriodId,
          selfEvaluationContent: '자기평가 내용',
          selfEvaluationScore: 85,
          performanceResult: '성과 결과',
        });

        제출결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자에게_제출한다(
            저장결과.id,
          );

        // 취소 전 상태 조회
        취소전_대시보드현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        취소전_할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        // When - 1차 평가자 제출 취소
        취소결과 =
          await wbsSelfEvaluationScenario.WBS자기평가를_1차평가자_제출_취소한다(
            저장결과.id,
          );

        // Then - 취소 검증
        expect(취소결과.submittedToEvaluator).toBe(false);
        expect(취소결과.submittedToEvaluatorAt).toBeDefined(); // Reset 시 제출 일시는 유지
        expect(취소결과.submittedToManager).toBe(false);
        expect(취소결과.submittedToManagerAt).toBeNull();
        expect(취소결과.selfEvaluationContent).toBe('자기평가 내용');
        expect(취소결과.selfEvaluationScore).toBe(85);
        expect(취소결과.performanceResult).toBe('성과 결과');

        // 대시보드 API 취소 후 검증
        // 1. 개별 직원 평가기간 현황 조회
        취소후_대시보드현황 =
          await wbsSelfEvaluationScenario.직원의_평가기간_현황을_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        expect(취소후_대시보드현황.selfEvaluation.isSubmittedToEvaluator).toBe(
          false,
        );
        expect(취소후_대시보드현황.selfEvaluation.isSubmittedToManager).toBe(
          false,
        );
        expect(취소후_대시보드현황.selfEvaluation.completedMappingCount).toBe(
          0,
        );
        expect(취소후_대시보드현황.selfEvaluation.status).toBe('in_progress');
        expect(취소후_대시보드현황.selfEvaluation.totalScore).toBeNull();
        expect(취소후_대시보드현황.selfEvaluation.grade).toBeNull();

        // 2. 직원 할당 데이터 조회
        취소후_할당데이터 =
          await wbsSelfEvaluationScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId,
          });

        expect(
          취소후_할당데이터.summary.selfEvaluation.submittedToEvaluatorCount,
        ).toBe(0);
        expect(
          취소후_할당데이터.summary.selfEvaluation.isSubmittedToEvaluator,
        ).toBe(false);
        expect(
          취소후_할당데이터.summary.selfEvaluation.submittedToManagerCount,
        ).toBe(0);
        expect(
          취소후_할당데이터.summary.selfEvaluation.isSubmittedToManager,
        ).toBe(false);

        // 3. 대시보드 전체 직원 현황 조회
        const 취소후_전체직원현황 =
          await wbsSelfEvaluationScenario.전체_직원_현황을_조회한다(
            evaluationPeriodId,
          );

        const 직원정보 = 취소후_전체직원현황.find(
          (e: any) => e.employeeId === employeeId,
        );
        expect(직원정보.selfEvaluation.isSubmittedToEvaluator).toBe(false);
        expect(직원정보.selfEvaluation.isSubmittedToManager).toBe(false);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            employeeId,
            취소결과: {
              id: 취소결과.id,
              submittedToEvaluator: 취소결과.submittedToEvaluator,
              submittedToEvaluatorAt: 취소결과.submittedToEvaluatorAt,
              submittedToManager: 취소결과.submittedToManager,
            },
            취소전후_비교: {
              대시보드현황: {
                취소전: {
                  isSubmittedToEvaluator:
                    취소전_대시보드현황.selfEvaluation.isSubmittedToEvaluator,
                  isSubmittedToManager:
                    취소전_대시보드현황.selfEvaluation.isSubmittedToManager,
                },
                취소후: {
                  isSubmittedToEvaluator:
                    취소후_대시보드현황.selfEvaluation.isSubmittedToEvaluator,
                  isSubmittedToManager:
                    취소후_대시보드현황.selfEvaluation.isSubmittedToManager,
                },
              },
              할당데이터: {
                취소전: {
                  submittedToEvaluatorCount:
                    취소전_할당데이터.summary.selfEvaluation
                      .submittedToEvaluatorCount,
                  isSubmittedToEvaluator:
                    취소전_할당데이터.summary.selfEvaluation
                      .isSubmittedToEvaluator,
                  isSubmittedToManager:
                    취소전_할당데이터.summary.selfEvaluation
                      .isSubmittedToManager,
                },
                취소후: {
                  submittedToEvaluatorCount:
                    취소후_할당데이터.summary.selfEvaluation
                      .submittedToEvaluatorCount,
                  isSubmittedToEvaluator:
                    취소후_할당데이터.summary.selfEvaluation
                      .isSubmittedToEvaluator,
                  isSubmittedToManager:
                    취소후_할당데이터.summary.selfEvaluation
                      .isSubmittedToManager,
                },
              },
            },
            전체직원현황: {
              isSubmittedToEvaluator:
                직원정보.selfEvaluation.isSubmittedToEvaluator,
              isSubmittedToManager:
                직원정보.selfEvaluation.isSubmittedToManager,
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
            취소결과: 취소결과,
            취소후_대시보드현황: 취소후_대시보드현황?.selfEvaluation,
            취소후_할당데이터: 취소후_할당데이터?.summary?.selfEvaluation,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
