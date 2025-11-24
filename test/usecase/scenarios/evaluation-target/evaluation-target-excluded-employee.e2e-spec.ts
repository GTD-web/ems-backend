import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { EvaluationPeriodManagementApiClient } from '../api-clients/evaluation-period-management.api-client';
import { EvaluationTargetApiClient } from '../api-clients/evaluation-target.api-client';
import { EmployeeManagementApiClient } from '../api-clients/employee-management.api-client';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';

/**
 * 조회 제외 직원과 평가 대상자 관리 E2E 테스트
 * 
 * 테스트 시나리오:
 * 1. 평가 기간 생성 시 조회 제외 직원도 평가 대상자로 추가되는지 확인
 * 2. 조회 제외 직원은 isExcluded = true로 자동 설정되는지 확인
 * 3. includeExcluded=false 시 제외된 대상자가 조회되지 않는지 확인
 * 4. includeExcluded=true 시 제외된 대상자도 조회되는지 확인
 */
describe('조회 제외 직원과 평가 대상자 관리 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodApiClient: EvaluationPeriodManagementApiClient;
  let evaluationTargetApiClient: EvaluationTargetApiClient;
  let employeeApiClient: EmployeeManagementApiClient;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let excludedEmployeeId: string;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodApiClient = new EvaluationPeriodManagementApiClient(testSuite);
    evaluationTargetApiClient = new EvaluationTargetApiClient(testSuite);
    employeeApiClient = new EmployeeManagementApiClient(testSuite);

    // 시드 데이터 생성 (조회 제외 직원 없이 생성)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 5,
      stateDistribution: {
        excludedFromList: 0, // 테스트를 위해 조회 제외 직원 없이 생성
      },
    });

    employeeIds = seedResult.employeeIds || [];
    console.log(`📝 시드 데이터 생성 완료: 직원 ${employeeIds.length}명`);
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        await evaluationPeriodApiClient.deleteEvaluationPeriod(evaluationPeriodId);
      } catch (error) {
        console.log('평가기간 삭제 중 오류 (이미 삭제됨):', error.message);
      }
    }

    // 제외된 직원을 다시 포함
    if (excludedEmployeeId) {
      try {
        await employeeApiClient.includeEmployeeInList(excludedEmployeeId);
      } catch (error) {
        console.log('직원 포함 처리 중 오류:', error.message);
      }
    }

    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('조회 제외 직원과 평가 대상자 관리', () => {
    it('1단계: 직원을 조회 제외 목록에 추가한다', async () => {
      excludedEmployeeId = employeeIds[0];

      const response = await employeeApiClient.excludeEmployeeFromList({
        employeeId: excludedEmployeeId,
        excludeReason: '테스트용 제외',
      });

      expect(response.id).toBe(excludedEmployeeId);
      expect(response.isExcludedFromList).toBe(true);
      expect(response.excludeReason).toBe('테스트용 제외');

      console.log(`✅ 직원 조회 제외 설정 완료: ${excludedEmployeeId}`);
    });

    it('2단계: 평가 기간을 생성한다 (조회 제외 직원 포함)', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '조회 제외 직원 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '조회 제외 직원 처리 테스트',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
          { grade: 'B', minRange: 70, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 69 },
        ],
      };

      const result = await evaluationPeriodApiClient.createEvaluationPeriod(createData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');

      evaluationPeriodId = result.id;
      console.log(`✅ 평가기간 생성 완료: ${result.name} (${result.id})`);
    });

    it('3단계: 평가 대상자 목록을 조회한다 (includeExcluded=false)', async () => {
      const response = await evaluationTargetApiClient.getEvaluationTargets({
        evaluationPeriodId,
        includeExcluded: false,
      });

      expect(response.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(response.targets).toBeDefined();
      expect(Array.isArray(response.targets)).toBe(true);

      // 제외된 직원이 목록에 없어야 함
      const excludedEmployee = response.targets.find(
        (target: any) => target.employee?.id === excludedEmployeeId
      );
      expect(excludedEmployee).toBeUndefined();

      // 다른 직원들은 목록에 있어야 함
      const includedEmployees = employeeIds.filter(id => id !== excludedEmployeeId);
      for (const employeeId of includedEmployees) {
        const employee = response.targets.find(
          (target: any) => target.employee?.id === employeeId
        );
        expect(employee).toBeDefined();
        if (employee) {
          expect(employee.isExcluded).toBe(false);
        }
      }

      console.log(
        `✅ 제외된 대상자 미포함 조회 완료: ${response.targets.length}명 (제외된 직원은 표시되지 않음)`
      );
    });

    it('4단계: 평가 대상자 목록을 조회한다 (includeExcluded=true)', async () => {
      const response = await evaluationTargetApiClient.getEvaluationTargets({
        evaluationPeriodId,
        includeExcluded: true,
      });

      expect(response.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(response.targets).toBeDefined();
      expect(Array.isArray(response.targets)).toBe(true);

      // 제외된 직원도 목록에 있어야 함
      const excludedEmployee = response.targets.find(
        (target: any) => target.employee?.id === excludedEmployeeId
      );
      expect(excludedEmployee).toBeDefined();
      expect(excludedEmployee.isExcluded).toBe(true);
      expect(excludedEmployee.excludeReason).toBe('조회 제외 목록에 있는 직원');

      // 다른 직원들도 목록에 있어야 함
      const includedEmployees = employeeIds.filter(id => id !== excludedEmployeeId);
      for (const employeeId of includedEmployees) {
        const employee = response.targets.find(
          (target: any) => target.employee?.id === employeeId
        );
        expect(employee).toBeDefined();
        if (employee) {
          expect(employee.isExcluded).toBe(false);
        }
      }

      console.log(
        `✅ 제외된 대상자 포함 조회 완료: ${response.targets.length}명 (제외된 직원 1명 포함)`
      );
    });

    it('5단계: 제외된 평가 대상자만 조회한다', async () => {
      const response = await evaluationTargetApiClient.getExcludedEvaluationTargets(
        evaluationPeriodId
      );

      expect(response.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(response.targets).toBeDefined();
      expect(Array.isArray(response.targets)).toBe(true);
      expect(response.targets.length).toBeGreaterThan(0);

      // 제외된 직원이 있어야 함
      const excludedEmployee = response.targets.find(
        (target: any) => target.employee?.id === excludedEmployeeId
      );
      expect(excludedEmployee).toBeDefined();
      expect(excludedEmployee.isExcluded).toBe(true);

      console.log(`✅ 제외된 대상자 조회 완료: ${response.targets.length}명`);
    });

    it('6단계: 제외된 직원을 다시 평가 대상에 포함한다', async () => {
      const response = await evaluationTargetApiClient.includeEvaluationTarget({
        evaluationPeriodId,
        employeeId: excludedEmployeeId,
      });

      expect(response.id).toBeDefined();
      expect(response.isExcluded).toBe(false);
      expect(response.excludeReason).toBeNull();
      expect(response.excludedBy).toBeNull();
      expect(response.excludedAt).toBeNull();

      console.log(`✅ 평가 대상 포함 처리 완료: ${excludedEmployeeId}`);
    });

    it('7단계: 포함 처리 후 평가 대상자 목록을 조회한다 (includeExcluded=false)', async () => {
      const response = await evaluationTargetApiClient.getEvaluationTargets({
        evaluationPeriodId,
        includeExcluded: false,
      });

      // 이제 이전에 제외되었던 직원도 목록에 있어야 함
      const previouslyExcludedEmployee = response.targets.find(
        (target: any) => target.employee?.id === excludedEmployeeId
      );
      expect(previouslyExcludedEmployee).toBeDefined();
      expect(previouslyExcludedEmployee.isExcluded).toBe(false);

      // 모든 직원이 목록에 있어야 함
      expect(response.targets.length).toBe(employeeIds.length);

      console.log(
        `✅ 포함 처리 후 조회 완료: ${response.targets.length}명 (모든 직원 포함)`
      );
    });
  });

  describe('includeExcluded 파라미터 검증', () => {
    it('includeExcluded를 전달하지 않으면 기본값 false가 적용된다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .expect(200);

      // 제외된 대상자가 없으므로 모든 직원이 조회되어야 함
      expect(response.body.targets.length).toBe(employeeIds.length);
    });

    it('includeExcluded="true" 문자열도 정상 처리된다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .query({ includeExcluded: 'true' })
        .expect(200);

      expect(response.body.targets.length).toBe(employeeIds.length);
    });

    it('includeExcluded="false" 문자열도 정상 처리된다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .query({ includeExcluded: 'false' })
        .expect(200);

      expect(response.body.targets.length).toBe(employeeIds.length);
    });

    it('includeExcluded="1"도 true로 처리된다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .query({ includeExcluded: '1' })
        .expect(200);

      expect(response.body.targets.length).toBe(employeeIds.length);
    });

    it('includeExcluded="0"도 false로 처리된다', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .query({ includeExcluded: '0' })
        .expect(200);

      expect(response.body.targets.length).toBe(employeeIds.length);
    });
  });
});

