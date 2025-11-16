import { BaseE2ETest } from '../../../base-e2e.spec';
import { EvaluationTargetScenario } from './evaluation-target.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 등록되지 않은 직원 조회 및 등록 시 1차 평가자 자동 할당 검증 시나리오 E2E 테스트
 *
 * 등록되지 않은 직원을 조회하고, 대상자로 등록한 후 1차 평가자가 자동으로 할당되는지 검증합니다.
 */
describe('등록되지 않은 직원 조회 및 등록 시 1차 평가자 자동 할당 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;

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
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
  });

  afterAll(async () => {
    // 테스트 결과를 JSON 파일로 저장
    const outputPath = path.join(
      __dirname,
      'unregistered-employee-registration-with-primary-evaluator-result.json',
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
      name: '등록되지 않은 직원 조회 및 등록 시 1차 평가자 자동 할당 검증 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description:
        '등록되지 않은 직원 조회 및 등록 시 1차 평가자 자동 할당 검증 E2E 테스트용 평가기간',
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

    // 테스트를 위해 일부 직원을 등록 해제하여 등록되지 않은 직원을 만듭니다
    // (평가기간 생성 시 모든 활성 직원이 자동으로 등록되므로)
    if (employeeIds.length > 0) {
      // 첫 번째 직원을 등록 해제 (나중에 다시 등록할 직원)
      await evaluationTargetScenario.평가대상자_등록을_해제한다(
        evaluationPeriodId,
        employeeIds[0],
      );
    }
  });

  describe('등록되지 않은 직원 조회 및 등록 시 1차 평가자 자동 할당 검증', () => {
    it('1단계: 등록되지 않은 직원 목록 조회', async () => {
      let unregisteredEmployees: any;
      let error: any;
      const testName = '1단계: 등록되지 않은 직원 목록 조회';

      try {
        // When - 등록되지 않은 직원 목록 조회
        unregisteredEmployees =
          await evaluationTargetScenario.등록되지_않은_직원_목록을_조회한다(
            evaluationPeriodId,
          );

        // Then - 조회 결과 검증
        expect(unregisteredEmployees).toBeDefined();
        expect(unregisteredEmployees.evaluationPeriodId).toBe(
          evaluationPeriodId,
        );
        expect(Array.isArray(unregisteredEmployees.employees)).toBe(true);
        expect(unregisteredEmployees.employees.length).toBeGreaterThan(0);

        // 직원 정보 검증
        const firstEmployee = unregisteredEmployees.employees[0];
        expect(firstEmployee.id).toBeDefined();
        expect(firstEmployee.employeeNumber).toBeDefined();
        expect(firstEmployee.name).toBeDefined();
        expect(firstEmployee.email).toBeDefined();
        expect(firstEmployee.status).toBe('재직중');

        // 직원명 기준 오름차순 정렬 확인
        const employeeNames = unregisteredEmployees.employees.map(
          (emp: any) => emp.name,
        );
        const sortedNames = [...employeeNames].sort();
        expect(employeeNames).toEqual(sortedNames);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            unregisteredEmployeeCount: unregisteredEmployees.employees.length,
            firstEmployee: {
              id: firstEmployee.id,
              employeeNumber: firstEmployee.employeeNumber,
              name: firstEmployee.name,
              email: firstEmployee.email,
              departmentName: firstEmployee.departmentName,
            },
            isSortedByName: employeeNames.every(
              (name: string, index: number) => name === sortedNames[index],
            ),
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('2단계: 등록되지 않은 직원을 대상자로 등록', async () => {
      let unregisteredEmployees: any;
      let registrationResult: any;
      let error: any;
      const testName = '2단계: 등록되지 않은 직원을 대상자로 등록';

      try {
        // Given - 등록되지 않은 직원 목록 조회
        unregisteredEmployees =
          await evaluationTargetScenario.등록되지_않은_직원_목록을_조회한다(
            evaluationPeriodId,
          );

        if (unregisteredEmployees.employees.length === 0) {
          throw new Error('등록되지 않은 직원이 없습니다.');
        }

        const targetEmployee = unregisteredEmployees.employees[0];

        // When - 등록되지 않은 직원을 대상자로 등록
        registrationResult =
          await evaluationTargetScenario.평가대상자를_단일_등록한다(
            evaluationPeriodId,
            targetEmployee.id,
          );

        // Then - 등록 결과 검증
        expect(registrationResult).toBeDefined();
        expect(registrationResult.id).toBeDefined();
        expect(registrationResult.evaluationPeriodId).toBe(evaluationPeriodId);
        expect(registrationResult.employeeId).toBe(targetEmployee.id);

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            employeeId: targetEmployee.id,
            employeeName: targetEmployee.name,
            registrationResult: {
              id: registrationResult.id,
              evaluationPeriodId: registrationResult.evaluationPeriodId,
              employeeId: registrationResult.employeeId,
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
            evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('3단계: 등록 후 1차 평가자 자동 할당 검증 (평가설정 통합 조회)', async () => {
      let unregisteredEmployees: any;
      let registrationResult: any;
      let evaluationSettings: any;
      let employeeDetail: any;
      let error: any;
      const testName =
        '3단계: 등록 후 1차 평가자 자동 할당 검증 (평가설정 통합 조회)';

      try {
        // Given - 등록되지 않은 직원 목록 조회 및 등록
        unregisteredEmployees =
          await evaluationTargetScenario.등록되지_않은_직원_목록을_조회한다(
            evaluationPeriodId,
          );

        if (unregisteredEmployees.employees.length === 0) {
          throw new Error('등록되지 않은 직원이 없습니다.');
        }

        const targetEmployee = unregisteredEmployees.employees[0];

        // 직원 상세 정보 조회 (managerId 확인용) - 전체 직원 목록에서 찾기
        const allEmployeesResponse = await testSuite
          .request()
          .get('/admin/employees')
          .query({ includeExcluded: 'false' })
          .expect(200);
        const allEmployees = allEmployeesResponse.body;
        employeeDetail = allEmployees.find(
          (emp: any) => emp.id === targetEmployee.id,
        );
        if (!employeeDetail) {
          throw new Error(`직원을 찾을 수 없습니다: ${targetEmployee.id}`);
        }

        // 등록되지 않은 직원을 대상자로 등록
        registrationResult =
          await evaluationTargetScenario.평가대상자를_단일_등록한다(
            evaluationPeriodId,
            targetEmployee.id,
          );

        // When - 직원 평가설정 통합 조회
        const evaluationSettingsResponse = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${targetEmployee.id}/period/${evaluationPeriodId}/settings`,
          )
          .expect(200);
        evaluationSettings = evaluationSettingsResponse.body;

        // Then - 1차 평가자 자동 할당 검증
        expect(evaluationSettings).toBeDefined();
        expect(evaluationSettings.evaluationLineMappings).toBeDefined();
        expect(Array.isArray(evaluationSettings.evaluationLineMappings)).toBe(
          true,
        );

        // PRIMARY 타입 매핑 찾기 (wbsItemId가 null인 매핑)
        const primaryMapping = evaluationSettings.evaluationLineMappings.find(
          (mapping: any) => mapping.wbsItemId === null,
        );

        if (employeeDetail.managerId) {
          // 부서장이 있는 경우 1차 평가자가 자동 할당되어야 함
          expect(primaryMapping).toBeDefined();
          expect(primaryMapping.evaluatorId).toBe(employeeDetail.managerId);
          expect(primaryMapping.evaluationLineId).toBeDefined();
        } else {
          // 부서장이 없는 경우 1차 평가자가 할당되지 않을 수 있음
          // 이 경우 primaryMapping이 없거나 evaluatorId가 null일 수 있음
          if (primaryMapping) {
            // 매핑이 있더라도 evaluatorId가 null일 수 있음
            // 이는 정상적인 동작일 수 있음
          }
        }

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            employeeId: targetEmployee.id,
            employeeName: targetEmployee.name,
            employeeManagerId: employeeDetail.managerId,
            registrationResult: {
              id: registrationResult.id,
              evaluationPeriodId: registrationResult.evaluationPeriodId,
              employeeId: registrationResult.employeeId,
            },
            evaluationSettings: {
              evaluationLineMappingsCount:
                evaluationSettings.evaluationLineMappings.length,
              primaryMapping: primaryMapping
                ? {
                    id: primaryMapping.id,
                    evaluatorId: primaryMapping.evaluatorId,
                    evaluationLineId: primaryMapping.evaluationLineId,
                    wbsItemId: primaryMapping.wbsItemId,
                  }
                : null,
              isPrimaryEvaluatorAssigned:
                primaryMapping && primaryMapping.evaluatorId !== null,
              primaryEvaluatorMatchesManager: employeeDetail.managerId
                ? primaryMapping?.evaluatorId === employeeDetail.managerId
                : null,
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
            evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('4단계: 등록 후 1차 평가자 자동 할당 검증 (대시보드 조회)', async () => {
      let unregisteredEmployees: any;
      let registrationResult: any;
      let dashboardStatus: any;
      let employeeDetail: any;
      let error: any;
      const testName =
        '4단계: 등록 후 1차 평가자 자동 할당 검증 (대시보드 조회)';

      try {
        // Given - 등록되지 않은 직원 목록 조회 및 등록
        unregisteredEmployees =
          await evaluationTargetScenario.등록되지_않은_직원_목록을_조회한다(
            evaluationPeriodId,
          );

        if (unregisteredEmployees.employees.length === 0) {
          throw new Error('등록되지 않은 직원이 없습니다.');
        }

        const targetEmployee = unregisteredEmployees.employees[0];

        // 직원 상세 정보 조회 (managerId 확인용) - 전체 직원 목록에서 찾기
        const allEmployeesResponse = await testSuite
          .request()
          .get('/admin/employees')
          .query({ includeExcluded: 'false' })
          .expect(200);
        const allEmployees = allEmployeesResponse.body;
        employeeDetail = allEmployees.find(
          (emp: any) => emp.id === targetEmployee.id,
        );
        if (!employeeDetail) {
          throw new Error(`직원을 찾을 수 없습니다: ${targetEmployee.id}`);
        }

        // 등록되지 않은 직원을 대상자로 등록
        registrationResult =
          await evaluationTargetScenario.평가대상자를_단일_등록한다(
            evaluationPeriodId,
            targetEmployee.id,
          );

        // When - 대시보드 조회 (단일 직원 조회)
        const dashboardStatusResponse = await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/employees/${targetEmployee.id}/status`,
          )
          .expect(200);
        dashboardStatus = dashboardStatusResponse.body;

        // Then - 해당 직원의 1차 평가자 자동 할당 검증
        // 대시보드 조회는 매핑이 없으면 null을 반환할 수 있음
        if (!dashboardStatus) {
          // 매핑이 없으면 테스트 실패 (등록 후 바로 조회하면 매핑이 있어야 함)
          throw new Error(
            `대시보드 조회 결과가 null입니다. 매핑이 제대로 등록되지 않았을 수 있습니다. 평가기간: ${evaluationPeriodId}, 직원: ${targetEmployee.id}`,
          );
        }

        const employeeStatus = dashboardStatus;

        expect(employeeStatus).toBeDefined();
        expect(employeeStatus.isEvaluationTarget).toBe(true);
        expect(employeeStatus.criteriaSetup).toBeDefined();
        expect(employeeStatus.criteriaSetup.evaluationLine).toBeDefined();
        expect(employeeStatus.downwardEvaluation).toBeDefined();
        expect(employeeStatus.downwardEvaluation.primary).toBeDefined();

        if (employeeDetail.managerId) {
          // 부서장이 있는 경우 1차 평가자가 자동 할당되어야 함
          expect(
            employeeStatus.criteriaSetup.evaluationLine.hasPrimaryEvaluator,
          ).toBe(true);
          expect(
            employeeStatus.downwardEvaluation.primary.evaluator,
          ).toBeDefined();
          expect(employeeStatus.downwardEvaluation.primary.evaluator.id).toBe(
            employeeDetail.managerId,
          );
        } else {
          // 부서장이 없는 경우 1차 평가자가 할당되지 않을 수 있음
          // 이 경우 hasPrimaryEvaluator가 false이거나 primaryEvaluator가 null일 수 있음
          expect(
            employeeStatus.criteriaSetup.evaluationLine.hasPrimaryEvaluator,
          ).toBe(false);
          expect(
            employeeStatus.downwardEvaluation.primary.evaluator,
          ).toBeNull();
        }

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            employeeId: targetEmployee.id,
            employeeName: targetEmployee.name,
            employeeManagerId: employeeDetail.managerId,
            registrationResult: {
              id: registrationResult.id,
              evaluationPeriodId: registrationResult.evaluationPeriodId,
              employeeId: registrationResult.employeeId,
            },
            dashboardStatus: {
              employeeId: employeeStatus.employeeId,
              employeeStatus: {
                isEvaluationTarget: employeeStatus.isEvaluationTarget,
                hasPrimaryEvaluator:
                  employeeStatus.criteriaSetup.evaluationLine
                    .hasPrimaryEvaluator,
                primaryEvaluatorId:
                  employeeStatus.downwardEvaluation.primary.evaluator?.id ||
                  null,
                primaryEvaluatorMatchesManager: employeeDetail.managerId
                  ? employeeStatus.evaluationLine.primaryEvaluator?.id ===
                    employeeDetail.managerId
                  : null,
              },
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
            evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });

    it('5단계: 전체 시나리오 통합 검증', async () => {
      let unregisteredEmployees: any;
      let registrationResult: any;
      let evaluationSettings: any;
      let dashboardStatus: any;
      let employeeDetail: any;
      let error: any;
      const testName = '5단계: 전체 시나리오 통합 검증';

      try {
        // 1. 등록되지 않은 직원 목록 조회
        unregisteredEmployees =
          await evaluationTargetScenario.등록되지_않은_직원_목록을_조회한다(
            evaluationPeriodId,
          );

        expect(unregisteredEmployees.employees.length).toBeGreaterThan(0);
        const targetEmployee = unregisteredEmployees.employees[0];

        // 2. 직원 상세 정보 조회 (managerId 확인용) - 전체 직원 목록에서 찾기
        const allEmployeesResponse = await testSuite
          .request()
          .get('/admin/employees')
          .query({ includeExcluded: 'false' })
          .expect(200);
        const allEmployees = allEmployeesResponse.body;
        employeeDetail = allEmployees.find(
          (emp: any) => emp.id === targetEmployee.id,
        );
        if (!employeeDetail) {
          throw new Error(`직원을 찾을 수 없습니다: ${targetEmployee.id}`);
        }

        // 3. 등록되지 않은 직원을 대상자로 등록
        registrationResult =
          await evaluationTargetScenario.평가대상자를_단일_등록한다(
            evaluationPeriodId,
            targetEmployee.id,
          );

        expect(registrationResult.id).toBeDefined();

        // 4. 평가설정 통합 조회로 1차 평가자 확인
        const evaluationSettingsResponse = await testSuite
          .request()
          .get(
            `/admin/evaluation-criteria/evaluation-lines/employee/${targetEmployee.id}/period/${evaluationPeriodId}/settings`,
          )
          .expect(200);
        evaluationSettings = evaluationSettingsResponse.body;

        const primaryMapping = evaluationSettings.evaluationLineMappings.find(
          (mapping: any) => mapping.wbsItemId === null,
        );

        // 5. 대시보드 조회로 1차 평가자 확인 (단일 직원 조회)
        const dashboardStatusResponse = await testSuite
          .request()
          .get(
            `/admin/dashboard/${evaluationPeriodId}/employees/${targetEmployee.id}/status`,
          )
          .expect(200);
        dashboardStatus = dashboardStatusResponse.body;

        const employeeStatus = dashboardStatus;

        // 6. 통합 검증
        if (employeeDetail.managerId) {
          // 부서장이 있는 경우
          expect(primaryMapping).toBeDefined();
          expect(primaryMapping.evaluatorId).toBe(employeeDetail.managerId);
          expect(
            employeeStatus.criteriaSetup.evaluationLine.hasPrimaryEvaluator,
          ).toBe(true);
          expect(
            employeeStatus.downwardEvaluation.primary.evaluator,
          ).toBeDefined();
          expect(employeeStatus.downwardEvaluation.primary.evaluator.id).toBe(
            employeeDetail.managerId,
          );
          expect(
            primaryMapping.evaluatorId ===
              employeeStatus.downwardEvaluation.primary.evaluator.id,
          ).toBe(true);
        }

        // 테스트 결과 저장 (성공)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            employeeId: targetEmployee.id,
            employeeName: targetEmployee.name,
            employeeManagerId: employeeDetail.managerId,
            registrationResult: {
              id: registrationResult.id,
              evaluationPeriodId: registrationResult.evaluationPeriodId,
              employeeId: registrationResult.employeeId,
            },
            evaluationSettings: {
              primaryMapping: primaryMapping
                ? {
                    evaluatorId: primaryMapping.evaluatorId,
                    evaluationLineId: primaryMapping.evaluationLineId,
                  }
                : null,
            },
            dashboardStatus: {
              hasPrimaryEvaluator:
                employeeStatus.criteriaSetup.evaluationLine.hasPrimaryEvaluator,
              primaryEvaluatorId:
                employeeStatus.downwardEvaluation.primary.evaluator?.id || null,
            },
            isConsistent: employeeDetail.managerId
              ? primaryMapping?.evaluatorId ===
                employeeStatus.downwardEvaluation.primary.evaluator?.id
              : null,
            passed: true,
          },
        });
      } catch (e) {
        error = e;
        // 테스트 결과 저장 (실패)
        testResults.push({
          testName,
          result: {
            evaluationPeriodId,
            passed: false,
            error: extractErrorMessage(error),
          },
        });
        throw e;
      }
    });
  });
});
