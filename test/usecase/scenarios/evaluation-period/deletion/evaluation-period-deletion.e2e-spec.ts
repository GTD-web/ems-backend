import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { SeedDataScenario } from '../../seed-data.scenario';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';

/**
 * 평가기간 삭제 E2E 테스트
 * 
 * 시나리오:
 * - 평가기간 생성 (POST /admin/evaluation-periods)
 * - 평가기간 목록 조회 (GET /admin/evaluation-periods)
 * - 평가기간 삭제 (DELETE /admin/evaluation-periods/{id})
 * - 삭제 후 목록 조회 (GET /admin/evaluation-periods)
 */
describe('평가기간 삭제 E2E 테스트', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let apiClient: EvaluationPeriodManagementApiClient;

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
    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('평가기간 삭제', () => {
    it('삭제 테스트용 평가기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '삭제 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '삭제 테스트용',
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
      
      evaluationPeriodId = result.id;
      console.log(`✅ 삭제 테스트용 평가기간 생성 완료: ${result.name} (${result.id})`);
    });

    it('생성된 평가기간 목록을 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriods({ page: 1, limit: 10 });
      
      const targetPeriod = result.items.find(item => item.id === evaluationPeriodId);
      expect(targetPeriod).toBeDefined();
      expect(targetPeriod.name).toBe('삭제 테스트용 평가기간');
      expect(targetPeriod.status).toBe('waiting');
      
      console.log('✅ 삭제 전 평가기간 목록 조회 완료');
    });

    it('평가기간을 삭제한다', async () => {
      await apiClient.deleteEvaluationPeriod(evaluationPeriodId);
      
      console.log('✅ 평가기간 삭제 완료');
    });

    it('삭제 후 평가기간 목록을 조회한다', async () => {
      const result = await apiClient.getEvaluationPeriods({ page: 1, limit: 10 });
      
      const deletedPeriod = result.items.find(item => item.id === evaluationPeriodId);
      expect(deletedPeriod).toBeUndefined();
      
      console.log('✅ 삭제 후 평가기간 목록 조회 완료 - 삭제된 평가기간이 목록에서 제외됨');
    });
  });

});
