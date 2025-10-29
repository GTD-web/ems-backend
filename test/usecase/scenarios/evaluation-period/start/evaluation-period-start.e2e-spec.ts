import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';

/**
 * 평가기간 시작 E2E 테스트
 * 
 * 시나리오:
 * - 평가기간 생성 (POST /admin/evaluation-periods)
 * - 평가기간 시작 (POST /admin/evaluation-periods/{id}/start)
 * - 활성 평가기간 조회 (GET /admin/evaluation-periods/active)
 * - 대시보드 직원 현황 조회 (GET /admin/dashboard/{evaluationPeriodId}/employees/status)
 *   - evaluationPeriod.status 확인 (in-progress)
 *   - evaluationPeriod.currentPhase 확인 (evaluation-setup)
 */
describe('평가기간 시작 E2E 테스트', () => {
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

  describe('평가기간 시작', () => {
    it('시작 테스트용 평가기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '시작 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '시작 테스트용',
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
      console.log(`✅ 시작 테스트용 평가기간 생성 완료: ${result.name} (${result.id})`);
    });

    it('평가기간을 시작한다', async () => {
      const result = await apiClient.startEvaluationPeriod(evaluationPeriodId);
      
      expect(result.success).toBe(true);
      
      console.log('✅ 평가기간 시작 완료');
    });

    it('활성 평가기간을 조회한다', async () => {
      const result = await apiClient.getActiveEvaluationPeriods();
      
      expect(Array.isArray(result)).toBe(true);
      
      const startedPeriod = result.find(period => period.id === evaluationPeriodId);
      expect(startedPeriod).toBeDefined();
      expect(startedPeriod.status).toBe('in-progress');
      expect(startedPeriod.currentPhase).toBe('evaluation-setup');
      
      console.log('✅ 활성 평가기간 조회 완료 - 시작된 평가기간이 활성 목록에 포함됨');
    });

    it('대시보드에서 평가기간 직원 현황을 조회한다', async () => {
      const result = await dashboardApiClient.getEmployeesStatus(evaluationPeriodId);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // 첫 번째 직원의 평가기간 정보 확인
      const firstEmployee = result[0];
      expect(firstEmployee.evaluationPeriod).toBeDefined();
      expect(firstEmployee.evaluationPeriod.id).toBe(evaluationPeriodId);
      expect(firstEmployee.evaluationPeriod.name).toBe('시작 테스트용 평가기간');
      
      // README.md 요구사항: evaluationPeriod.status 확인 (in-progress)
      expect(firstEmployee.evaluationPeriod.status).toBe('in-progress');
      
      // README.md 요구사항: evaluationPeriod.currentPhase 확인 (evaluation-setup)
      expect(firstEmployee.evaluationPeriod.currentPhase).toBe('evaluation-setup');
      
      // currentPhase가 EvaluationPeriodPhase enum 값인지 확인
      const validPhases = ['waiting', 'evaluation-setup', 'performance', 'self-evaluation', 'peer-evaluation', 'closure'];
      expect(validPhases).toContain(firstEmployee.evaluationPeriod.currentPhase);
      
      console.log(`✅ 대시보드 직원 현황 조회 완료: ${result.length}명, status: ${firstEmployee.evaluationPeriod.status}, currentPhase: ${firstEmployee.evaluationPeriod.currentPhase}`);
    });


  });

});
