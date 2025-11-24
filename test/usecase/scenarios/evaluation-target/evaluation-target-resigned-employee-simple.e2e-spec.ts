import { INestApplication } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { EvaluationPeriodManagementApiClient } from '../api-clients/evaluation-period-management.api-client';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';

/**
 * 퇴사 직원 제외 검증 E2E 테스트 (간소화)
 * 
 * 테스트 시나리오:
 * 1. 퇴사자를 포함한 시드 데이터 생성
 * 2. 평가 기간 생성 시 재직중 직원만 평가 대상자로 추가되는지 확인
 */
describe('퇴사 직원 제외 검증 E2E 테스트 (간소화)', () => {
  let app: INestApplication;
  let testSuite: BaseE2ETest;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodApiClient: EvaluationPeriodManagementApiClient;

  let evaluationPeriodId: string;
  let allEmployeeIds: string[];
  let activeEmployeeCount: number;

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();
    app = testSuite.app;

    // 시나리오 인스턴스 생성
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodApiClient = new EvaluationPeriodManagementApiClient(testSuite);

    // 시드 데이터 생성 (퇴사자 포함)
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 1,
      wbsPerProject: 2,
      departmentCount: 1,
      employeeCount: 5,
      stateDistribution: {
        excludedFromList: 0,
        employeeStatus: {
          active: 0.6,    // 60% 재직중
          onLeave: 0.1,   // 10% 휴직중
          resigned: 0.3,  // 30% 퇴사
        },
      },
    });

    allEmployeeIds = seedResult.employeeIds || [];
    
    // 재직중 직원 수 계산
    const employeeRepository = testSuite.app.get('EmployeeRepository');
    const activeEmployees = await employeeRepository.find({
      where: { status: '재직중', deletedAt: null },
    });
    activeEmployeeCount = activeEmployees.length;

    console.log(`📝 시드 데이터 생성 완료: 전체 ${allEmployeeIds.length}명, 재직중 ${activeEmployeeCount}명`);
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

    await seedDataScenario.시드_데이터를_삭제한다();
    await testSuite.closeApp();
  });

  describe('평가 기간 생성 시 재직중 직원만 포함', () => {
    it('1단계: 평가 기간을 생성한다', async () => {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      const createData = {
        name: '퇴사 직원 제외 테스트용 평가기간',
        startDate: today.toISOString(),
        peerEvaluationDeadline: nextMonth.toISOString(),
        description: '퇴사 직원이 평가 대상자에서 제외되는지 확인',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 121, maxRange: 1000 },
          { grade: 'A+', minRange: 111, maxRange: 120 },
          { grade: 'A', minRange: 101, maxRange: 110 },
          { grade: 'B+', minRange: 91, maxRange: 100 },
          { grade: 'B', minRange: 81, maxRange: 90 },
          { grade: 'C', minRange: 71, maxRange: 80 },
          { grade: 'D', minRange: 0, maxRange: 70 },
        ],
      };

      const response = await evaluationPeriodApiClient.createEvaluationPeriod(createData);

      evaluationPeriodId = response.id;
      expect(evaluationPeriodId).toBeDefined();

      console.log(`✅ 평가기간 생성 완료: ${response.name} (${evaluationPeriodId})`);
    });

    it('2단계: 평가 대상자 목록을 조회하여 재직중 직원만 포함되었는지 확인', async () => {
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .query({ includeExcluded: 'false' })
        .expect(200);

      console.log(`평가 대상자 수: ${response.body.targets.length}명`);
      console.log(`재직중 직원 수: ${activeEmployeeCount}명`);

      // 모든 대상자가 '재직중' 상태여야 함
      const allStatuses = response.body.targets.map((t: any) => t.employee?.status);
      const uniqueStatuses = [...new Set(allStatuses)];
      
      console.log(`대상자 상태: ${uniqueStatuses.join(', ')}`);

      expect(uniqueStatuses).toEqual(['재직중']);

      // 재직중 직원 수와 평가 대상자 수가 일치해야 함
      expect(response.body.targets.length).toBe(activeEmployeeCount);

      console.log(
        `✅ 재직중 직원만 평가 대상자로 등록 확인: ${response.body.targets.length}명`,
      );
    });

    it('3단계: 퇴사 및 휴직 직원이 제외되었는지 확인', async () => {
      const employeeRepository = testSuite.app.get('EmployeeRepository');
      
      // 퇴사 및 휴직 직원 조회
      const nonActiveEmployees = await employeeRepository.find({
        where: [
          { status: '퇴사', deletedAt: null },
          { status: '휴직중', deletedAt: null },
        ],
      });

      console.log(`퇴사/휴직 직원 수: ${nonActiveEmployees.length}명`);

      // 평가 대상자 조회
      const response = await testSuite
        .request()
        .get(`/admin/evaluation-periods/${evaluationPeriodId}/targets`)
        .query({ includeExcluded: 'false' })
        .expect(200);

      // 퇴사/휴직 직원이 평가 대상자에 포함되지 않아야 함
      for (const nonActiveEmployee of nonActiveEmployees) {
        const found = response.body.targets.find(
          (t: any) => t.employee?.id === nonActiveEmployee.id,
        );

        expect(found).toBeUndefined();
        console.log(
          `✅ ${nonActiveEmployee.status} 직원 제외 확인: ${nonActiveEmployee.name}`,
        );
      }
    });
  });
});

