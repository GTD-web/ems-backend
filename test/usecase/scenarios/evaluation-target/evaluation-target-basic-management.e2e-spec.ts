import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { DashboardApiClient } from '../api-clients/dashboard.api-client';
import { EvaluationPeriodManagementApiClient } from '../api-clients/evaluation-period-management.api-client';
import { EvaluationTargetApiClient } from '../api-clients/evaluation-target.api-client';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../evaluation-target/evaluation-target.scenario';
import { SeedDataScenario } from '../seed-data.scenario';

/**
 * 평가대상 기본 관리 E2E 테스트
 * 
 * 시나리오:
 * - 평가기간 생성 (POST /admin/evaluation-periods)
 * - 평가기간 시작 (POST /admin/evaluation-periods/{id}/start)
 * - 평가대상자 대량 등록 (POST /admin/evaluation-periods/{evaluationPeriodId}/targets/bulk)
 * - 대시보드 조회 검증 (GET /admin/dashboard/{evaluationPeriodId}/employees/status)
 * - 평가대상자 단일 등록 (POST /admin/evaluation-periods/{evaluationPeriodId}/targets/{employeeId})
 * - 평가대상자 조회 (GET /admin/evaluation-periods/{evaluationPeriodId}/targets)
 * - 평가대상 여부 확인 (GET /admin/evaluation-periods/{evaluationPeriodId}/targets/{employeeId}/check)
 */
describe('평가대상 기본 관리 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;
  let apiClient: EvaluationPeriodManagementApiClient;
  let evaluationTargetApiClient: EvaluationTargetApiClient;
  let dashboardApiClient: DashboardApiClient;

  let evaluationPeriodId: string;
  let employeeIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
    apiClient = new EvaluationPeriodManagementApiClient(testSuite);
    evaluationTargetApiClient = new EvaluationTargetApiClient(testSuite);
    dashboardApiClient = new DashboardApiClient(testSuite);

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
    console.log(`📝 시드 데이터 생성 완료: 직원 ${employeeIds.length}명`);
  });

  afterAll(async () => {
    // 정리 작업
    if (evaluationPeriodId) {
      try {
        await apiClient.deleteEvaluationPeriod(evaluationPeriodId);
      } catch (error) {
        console.log('평가기간 삭제 중 오류 (이미 삭제됨):', error.message);
      }
    }
    
    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('평가대상 기본 관리', () => {
    it('평가기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '평가대상 관리 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '평가대상 관리 테스트용',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
          { grade: 'B', minRange: 70, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 69 },
        ],
      };

      const result = await apiClient.createEvaluationPeriod(createData);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');
      expect(result.currentPhase).toBe('waiting');
      
      evaluationPeriodId = result.id;
      console.log(`✅ 평가기간 생성 완료: ${result.name} (${result.id})`);
    });

    it('평가기간을 시작한다', async () => {
      const result = await apiClient.startEvaluationPeriod(evaluationPeriodId);
      
      expect(result.success).toBe(true);
      
      console.log('✅ 평가기간 시작 완료');
    });

    it('평가대상자를 대량 등록한다', async () => {
      const result = await evaluationTargetScenario.평가대상자를_대량_등록한다(
        evaluationPeriodId,
        employeeIds,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(employeeIds.length);
      
      // 응답 데이터 구조 확인을 위한 로그
      console.log('대량 등록 응답 구조 확인:', JSON.stringify(result[0], null, 2));
      
      // 각 등록된 대상자 검증
      result.forEach((target: any) => {
        expect(target.id).toBeDefined();
        expect(target.evaluationPeriodId).toBe(evaluationPeriodId);
        expect(target.employeeId).toBeDefined();
        expect(target.isExcluded).toBe(false);
        expect(target.excludeReason).toBeNull();
        expect(target.excludedBy).toBeNull();
        expect(target.excludedAt).toBeNull();
        expect(target.createdBy).toBeDefined();
        expect(target.createdAt).toBeDefined();
        expect(target.isNewEnrolled).toBe(true); // 신규 등록이므로 true여야 함
      });
      
      console.log(`✅ 평가대상자 대량 등록 완료: ${result.length}명`);
    });

    it('대시보드에서 평가기간 직원 현황을 조회한다', async () => {
      const result = await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // 첫 번째 직원의 평가기간 정보 확인
      const firstEmployee = result[0];
      expect(firstEmployee.evaluationPeriod).toBeDefined();
      expect(firstEmployee.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(firstEmployee.evaluationPeriod.name).toBe('평가대상 관리 테스트용 평가기간');
      
      // README.md 요구사항: isEvaluationTarget 확인 (true)
      expect(firstEmployee.isEvaluationTarget).toBe(true);
      
      // isNewEnrolled 확인 (신규 등록이므로 true여야 함)
      expect(firstEmployee.isNewEnrolled).toBe(true);
      
      // exclusionInfo 검증
      expect(firstEmployee.exclusionInfo).toBeDefined();
      expect(firstEmployee.exclusionInfo.isExcluded).toBe(false); // 등록된 직원은 제외되지 않음
      
      // README.md 요구사항: evaluationPeriod.id 와 생성된 평가기간 id 일치여부 확인
      expect(firstEmployee.evaluationPeriod.id).toBe(evaluationPeriodId);
      
      console.log(`✅ 대시보드 직원 현황 조회 완료: ${result.length}명, isEvaluationTarget: ${firstEmployee.isEvaluationTarget}, isNewEnrolled: ${firstEmployee.isNewEnrolled}`);
    });

    it('이미 등록된 직원의 중복 등록을 시도한다 (409 에러)', async () => {
      // 이미 대량 등록된 직원을 다시 등록 시도
      const alreadyRegisteredEmployeeId = employeeIds[0]; // 첫 번째 직원 사용
      
      // supertest를 직접 사용하여 409 에러를 명시적으로 기대
      await testSuite
        .request()
        .post(`/admin/evaluation-periods/${evaluationPeriodId}/targets/${alreadyRegisteredEmployeeId}`)
        .expect(409);
      
      console.log(`✅ 중복 등록 시도 시 409 에러 확인: ${alreadyRegisteredEmployeeId}`);
    });

    it('평가대상자를 조회한다 (includeExcluded=false)', async () => {
      const result = await evaluationTargetScenario.평가대상자_목록을_조회한다(
        evaluationPeriodId,
        false,
      );

      expect(result.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(Array.isArray(result.targets)).toBe(true);
      expect(result.targets.length).toBeGreaterThan(0);
      
      // 모든 대상자가 제외되지 않은 상태인지 확인
      result.targets.forEach((target: any) => {
        expect(target.isExcluded).toBe(false);
        expect(target.employee).toBeDefined();
        expect(target.id).toBeDefined();
        expect(target.createdBy).toBeDefined();
        expect(target.createdAt).toBeDefined();
      });
      
      console.log(`✅ 평가대상자 조회 완료 (includeExcluded=false): ${result.targets.length}명`);
    });

    it('평가대상자를 조회한다 (includeExcluded=true)', async () => {
      const result = await evaluationTargetScenario.평가대상자_목록을_조회한다(
        evaluationPeriodId,
        true,
      );

      expect(result.evaluationPeriodId).toBe(evaluationPeriodId);
      expect(Array.isArray(result.targets)).toBe(true);
      expect(result.targets.length).toBeGreaterThan(0);
      
      // 모든 대상자 정보 확인 (제외된 대상자도 포함)
      result.targets.forEach((target: any) => {
        expect(target.employee).toBeDefined();
        expect(target.id).toBeDefined();
        expect(target.createdBy).toBeDefined();
        expect(target.createdAt).toBeDefined();
        expect(typeof target.isExcluded).toBe('boolean');
      });
      
      console.log(`✅ 평가대상자 조회 완료 (includeExcluded=true): ${result.targets.length}명`);
    });

    it('평가대상 여부를 확인한다', async () => {
      const targetEmployeeId = employeeIds[0];
      
      const result = await evaluationTargetScenario.평가대상_여부를_확인한다(
        evaluationPeriodId,
        targetEmployeeId,
      );

      expect(result.isEvaluationTarget).toBe(true);
      expect(result.evaluationPeriod).toBeDefined();
      expect(result.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(result.employee).toBeDefined();
      expect(result.employee.id).toBe(targetEmployeeId);
      
      console.log(`✅ 평가대상 여부 확인 완료: ${targetEmployeeId}, isEvaluationTarget: ${result.isEvaluationTarget}`);
    });

    it('등록되지 않은 직원의 평가대상 여부를 확인한다', async () => {
      // 존재하지 않는 직원 ID로 요청
      const nonExistentEmployeeId = '00000000-0000-0000-0000-000000000000';
      
      const result = await evaluationTargetScenario.평가대상_여부를_확인한다(
        evaluationPeriodId,
        nonExistentEmployeeId,
      );

      expect(result.isEvaluationTarget).toBe(false);
      expect(result.evaluationPeriod).toBeDefined();
      expect(result.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(result.employee).toBeDefined();
      expect(result.employee.id).toBe(nonExistentEmployeeId);
      
      console.log(`✅ 등록되지 않은 직원의 평가대상 여부 확인 완료: ${nonExistentEmployeeId}, isEvaluationTarget: ${result.isEvaluationTarget}`);
    });

    it('대량 등록 후 개별 등록 해제를 수행한다', async () => {
      // 첫 번째 직원 등록 해제
      const firstEmployeeId = employeeIds[0];
      const unregisterResult1 = await evaluationTargetScenario.평가대상자_등록을_해제한다(
        evaluationPeriodId,
        firstEmployeeId,
      );

      expect(unregisterResult1.success).toBe(true);
      console.log(`✅ 첫 번째 직원 등록 해제 완료: ${firstEmployeeId}`);

      // 두 번째 직원 등록 해제
      const secondEmployeeId = employeeIds[1];
      const unregisterResult2 = await evaluationTargetScenario.평가대상자_등록을_해제한다(
        evaluationPeriodId,
        secondEmployeeId,
      );

      expect(unregisterResult2.success).toBe(true);
      console.log(`✅ 두 번째 직원 등록 해제 완료: ${secondEmployeeId}`);

      // 부분 해제 후 조회 - 해제된 직원들은 조회되지 않아야 함
      const remainingTargets = await evaluationTargetScenario.평가대상자_목록을_조회한다(
        evaluationPeriodId,
        false,
      );

      expect(remainingTargets.targets.length).toBe(employeeIds.length - 2);
      console.log(`✅ 부분 해제 후 남은 대상자 수: ${remainingTargets.targets.length}명`);
    });

    it('나머지 모든 대상자의 등록을 해제한다', async () => {
      // 나머지 전체 등록 해제
      const unregisterAllResult = await evaluationTargetScenario.모든_평가대상자_등록을_해제한다(
        evaluationPeriodId,
      );

      expect(unregisterAllResult.deletedCount).toBeGreaterThan(0);
      console.log(`✅ 전체 등록 해제 완료: ${unregisterAllResult.deletedCount}명`);

      // 최종 조회 - 빈 배열이 반환되어야 함
      const finalTargets = await evaluationTargetScenario.평가대상자_목록을_조회한다(
        evaluationPeriodId,
        false,
      );

      expect(finalTargets.targets.length).toBe(0);
      console.log(`✅ 최종 조회 결과: ${finalTargets.targets.length}명 (빈 배열)`);

      // 제외된 대상자 조회 - 등록 해제와 제외는 다른 개념이므로 빈 배열
      const excludedTargets = await evaluationTargetScenario.제외된_평가대상자_목록을_조회한다(
        evaluationPeriodId,
      );

      expect(excludedTargets.targets.length).toBe(0);
      console.log(`✅ 제외된 대상자 조회 결과: ${excludedTargets.targets.length}명 (등록 해제와 제외는 다른 개념)`);

      // 대시보드에서 등록 해제된 직원들의 상태 검증
      // 1. 기본 조회 (등록 해제된 직원 제외)
      const dashboardResultDefault = await dashboardApiClient.getEmployeesStatus(evaluationPeriodId, false);
      expect(Array.isArray(dashboardResultDefault)).toBe(true);
      expect(dashboardResultDefault.length).toBe(0);
      console.log(`✅ 대시보드 기본 조회: ${dashboardResultDefault.length}명 (등록 해제된 직원 제외)`);
      
      // 2. 등록 해제된 직원 포함 조회
      const dashboardResultWithUnregistered = await dashboardApiClient.getEmployeesStatus(evaluationPeriodId, true);
      expect(Array.isArray(dashboardResultWithUnregistered)).toBe(true);
      
      // 등록 해제된 직원들이 조회되어야 함 (isEvaluationTarget: false)
      expect(dashboardResultWithUnregistered.length).toBeGreaterThan(0);
      
      dashboardResultWithUnregistered.forEach((employee: any) => {
        expect(employee.isEvaluationTarget).toBe(false);
        expect(employee.evaluationPeriod).toBeDefined();
        expect(employee.evaluationPeriod.id).toBe(evaluationPeriodId);
        expect(employee.exclusionInfo).toBeDefined();
        expect(employee.exclusionInfo.isExcluded).toBe(false); // 등록 해제된 직원은 제외되지 않음
      });
      
      console.log(`✅ 대시보드 등록 해제 포함 조회: ${dashboardResultWithUnregistered.length}명, 모든 직원의 isEvaluationTarget: false`);
    });
  });

  describe('isNewEnrolled 필드 검증', () => {
    let newEvaluationPeriodId: string;
    let firstBatchEmployeeIds: string[];
    let secondBatchEmployeeIds: string[];

    beforeAll(async () => {
      // 새로운 평가기간 생성
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: 'isNewEnrolled 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: 'isNewEnrolled 검증용',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 90, maxRange: 100 },
          { grade: 'A', minRange: 80, maxRange: 89 },
          { grade: 'B', minRange: 70, maxRange: 79 },
          { grade: 'C', minRange: 0, maxRange: 69 },
        ],
      };

      const result = await apiClient.createEvaluationPeriod(createData);
      newEvaluationPeriodId = result.id;

      // 평가기간 시작
      await apiClient.startEvaluationPeriod(newEvaluationPeriodId);

      // 직원을 두 그룹으로 나눔 (첫 번째 배치: 3명, 두 번째 배치: 2명)
      firstBatchEmployeeIds = employeeIds.slice(0, 3);
      secondBatchEmployeeIds = employeeIds.slice(3, 5);

      console.log('✅ isNewEnrolled 테스트 환경 설정 완료');
    });

    afterAll(async () => {
      // 테스트용 평가기간 삭제
      if (newEvaluationPeriodId) {
        try {
          await apiClient.deleteEvaluationPeriod(newEvaluationPeriodId);
          console.log('✅ 테스트용 평가기간 삭제 완료');
        } catch (error) {
          console.log('테스트용 평가기간 삭제 중 오류:', error.message);
        }
      }
    });

    it('첫 번째 배치 대량 등록 시 모든 직원의 isNewEnrolled가 true여야 한다', async () => {
      const result = await evaluationTargetScenario.평가대상자를_대량_등록한다(
        newEvaluationPeriodId,
        firstBatchEmployeeIds,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(firstBatchEmployeeIds.length);

      // 모든 직원이 신규 등록이므로 isNewEnrolled가 true여야 함
      result.forEach((target: any) => {
        expect(target.isNewEnrolled).toBe(true);
        console.log(`직원 ${target.employeeId}: isNewEnrolled = ${target.isNewEnrolled}`);
      });

      console.log(`✅ 첫 번째 배치 등록 완료: ${result.length}명, 모든 직원 isNewEnrolled = true`);
    });

    it('대시보드에서 첫 번째 배치의 isNewEnrolled가 true로 조회되어야 한다', async () => {
      const result = await dashboardApiClient.getEmployeesStatus(newEvaluationPeriodId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(firstBatchEmployeeIds.length);

      // 모든 직원의 isNewEnrolled가 true여야 함
      result.forEach((employee: any) => {
        expect(employee.isNewEnrolled).toBe(true);
        expect(employee.isEvaluationTarget).toBe(true);
      });

      console.log(`✅ 대시보드 조회: ${result.length}명, 모든 직원 isNewEnrolled = true`);
    });

    it('두 번째 배치 대량 등록 시 신규 직원은 true, 기존 직원은 false여야 한다', async () => {
      // 두 번째 배치에는 신규 직원 포함
      const mixedEmployeeIds = [
        ...firstBatchEmployeeIds.slice(0, 1), // 기존 직원 1명
        ...secondBatchEmployeeIds, // 신규 직원 2명
      ];

      const result = await evaluationTargetScenario.평가대상자를_대량_등록한다(
        newEvaluationPeriodId,
        mixedEmployeeIds,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mixedEmployeeIds.length);

      // 첫 번째 직원은 기존 직원이므로 isNewEnrolled = false
      const existingEmployee = result.find(
        (t: any) => t.employeeId === firstBatchEmployeeIds[0],
      );
      expect(existingEmployee).toBeDefined();
      expect(existingEmployee.isNewEnrolled).toBe(false);

      // 나머지 두 직원은 신규 직원이므로 isNewEnrolled = true
      const newEmployees = result.filter((t: any) =>
        secondBatchEmployeeIds.includes(t.employeeId),
      );
      expect(newEmployees.length).toBe(2);
      newEmployees.forEach((target: any) => {
        expect(target.isNewEnrolled).toBe(true);
      });

      console.log(`✅ 두 번째 배치 등록 완료: 기존 1명(false), 신규 2명(true)`);
    });

    it('대시보드에서 신규/기존 직원 구분이 올바르게 조회되어야 한다', async () => {
      const result = await dashboardApiClient.getEmployeesStatus(newEvaluationPeriodId);

      expect(Array.isArray(result)).toBe(true);

      // 첫 번째 배치 직원들 중 재등록된 1명은 isNewEnrolled = false
      const reRegisteredEmployee = result.find(
        (e: any) => e.employeeId === firstBatchEmployeeIds[0],
      );
      expect(reRegisteredEmployee).toBeDefined();
      expect(reRegisteredEmployee.isNewEnrolled).toBe(false);

      // 첫 번째 배치에서 재등록되지 않은 직원들은 여전히 isNewEnrolled = true
      const unchangedEmployees = result.filter((e: any) =>
        firstBatchEmployeeIds.slice(1).includes(e.employeeId),
      );
      unchangedEmployees.forEach((employee: any) => {
        expect(employee.isNewEnrolled).toBe(true);
      });

      // 두 번째 배치 신규 직원들은 isNewEnrolled = true
      const newEmployees = result.filter((e: any) =>
        secondBatchEmployeeIds.includes(e.employeeId),
      );
      newEmployees.forEach((employee: any) => {
        expect(employee.isNewEnrolled).toBe(true);
      });

      console.log(`✅ 대시보드 구분 조회 성공: 기존 1명(false), 나머지 모두 신규(true)`);
    });

    it('단일 등록 시 isNewEnrolled가 true여야 한다', async () => {
      // 시드 데이터에 없는 새로운 직원 생성
      const newEmployeeResponse = await testSuite
        .request()
        .post('/admin/employees')
        .send({
          name: '신규 테스트 직원',
          email: 'new-test@example.com',
          employeeNumber: 'NEW001',
          departmentName: '테스트부서',
          rankName: '사원',
          status: '재직중',
        })
        .expect(201);

      const newEmployeeId = newEmployeeResponse.body.id;

      // 단일 등록
      const registerResponse = await testSuite
        .request()
        .post(`/admin/evaluation-periods/${newEvaluationPeriodId}/targets/${newEmployeeId}`)
        .expect(201);

      expect(registerResponse.body.isNewEnrolled).toBe(true);
      expect(registerResponse.body.evaluationPeriodId).toBe(newEvaluationPeriodId);
      expect(registerResponse.body.employeeId).toBe(newEmployeeId);

      console.log(`✅ 단일 등록 완료: isNewEnrolled = true`);

      // 대시보드에서도 확인
      const dashboardResult = await dashboardApiClient.getEmployeesStatus(newEvaluationPeriodId);
      const registeredEmployee = dashboardResult.find(
        (e: any) => e.employeeId === newEmployeeId,
      );

      expect(registeredEmployee).toBeDefined();
      expect(registeredEmployee.isNewEnrolled).toBe(true);

      console.log(`✅ 대시보드에서도 isNewEnrolled = true 확인`);

      // 생성한 직원 삭제
      await testSuite.request().delete(`/admin/employees/${newEmployeeId}`).expect(200);
    });
  });
});
