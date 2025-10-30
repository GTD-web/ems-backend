import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../../evaluation-period.scenario';
import { SeedDataScenario } from '../../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../../api-clients/evaluation-period-management.api-client';
import { DashboardApiClient } from '../../../api-clients/dashboard.api-client';

/**
 * 평가기간 기준 설정 수동허용 E2E 테스트
 * 
 * 시나리오:
 * - 평가기간 생성 (POST /admin/evaluation-periods)
 * - 평가기간 시작 (POST /admin/evaluation-periods/{id}/start)
 * - 활성 평가기간 조회 (GET /admin/evaluation-periods/active)
 * - 평가기간 기준 설정 수동허용 (PATCH /admin/evaluation-periods/{id}/settings/criteria-permission)
 * - 활성 평가기간 조회 (GET /admin/evaluation-periods/active)
 * - 대시보드 직원 현황 조회 (GET /admin/dashboard/{evaluationPeriodId}/employees/status)
 */
describe('평가기간 기준 설정 수동허용 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let apiClient: EvaluationPeriodManagementApiClient;
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
    apiClient = new EvaluationPeriodManagementApiClient(testSuite);
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

  describe('평가기간 기준 설정 수동허용', () => {
    it('기준 설정 테스트용 평가기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '기준 설정 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: 'E2E 테스트용 평가기간',
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

      const result = await apiClient.createEvaluationPeriod(createData);
      
      expect(result.id).toBeDefined();
      expect(result.name).toBe(createData.name);
      expect(result.status).toBe('waiting');
      expect(result.currentPhase).toBe('waiting');

      evaluationPeriodId = result.id;
      console.log(`✅ 기준 설정 테스트용 평가기간 생성 완료: ${result.name} (${result.id})`);
    });

    it('평가기간을 시작한다', async () => {
      const result = await apiClient.startEvaluationPeriod(evaluationPeriodId);
      
      expect(result.success).toBe(true);
      
      console.log('✅ 평가기간 시작 완료');
    });

    it('평가기간 기준 설정 수동허용을 변경한다', async () => {
      const updateData = {
        allowManualSetting: true,
      };

      const result = await apiClient.updateCriteriaSettingPermission(evaluationPeriodId, updateData);

      expect(result.id).toBe(evaluationPeriodId);
      expect(result.criteriaSettingEnabled).toBe(true);

      console.log('✅ 평가기간 기준 설정 수동허용 변경 완료');
    });

    it('대시보드에서 평가기간 직원 현황을 조회한다', async () => {
      const result = await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // 첫 번째 직원의 평가기간 정보 확인
      const firstEmployee = result[0];
      expect(firstEmployee.evaluationPeriod).toBeDefined();
      expect(firstEmployee.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(firstEmployee.evaluationPeriod.name).toBe('기준 설정 테스트용 평가기간');
      expect(firstEmployee.evaluationPeriod.status).toBe('in-progress');
      expect(firstEmployee.evaluationPeriod.currentPhase).toBe('evaluation-setup');
      
      // currentPhase가 EvaluationPeriodPhase enum 값인지 확인
      const validPhases = ['waiting', 'evaluation-setup', 'performance', 'self-evaluation', 'peer-evaluation', 'closure'];
      expect(validPhases).toContain(firstEmployee.evaluationPeriod.currentPhase);
      
      // README.md 요구사항: evaluationPeriod.manualSettings.criteriaSettingEnabled 확인 (true)
      expect(firstEmployee.evaluationPeriod.manualSettings).toBeDefined();
      expect(firstEmployee.evaluationPeriod.manualSettings.criteriaSettingEnabled).toBe(true);
      expect(firstEmployee.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled).toBe(false);
      expect(firstEmployee.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled).toBe(false);
      
      console.log(`✅ 대시보드 직원 현황 조회 완료: ${result.length}명, currentPhase: ${firstEmployee.evaluationPeriod.currentPhase}`);
      console.log(`   - criteriaSettingEnabled: ${firstEmployee.evaluationPeriod.manualSettings.criteriaSettingEnabled} (기대값: true)`);
      console.log(`   - selfEvaluationSettingEnabled: ${firstEmployee.evaluationPeriod.manualSettings.selfEvaluationSettingEnabled} (기대값: false)`);
      console.log(`   - finalEvaluationSettingEnabled: ${firstEmployee.evaluationPeriod.manualSettings.finalEvaluationSettingEnabled} (기대값: false)`);
    });
  });

});
