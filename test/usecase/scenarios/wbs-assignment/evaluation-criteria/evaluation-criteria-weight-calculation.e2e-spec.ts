import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../../base-e2e.spec';
import { SeedDataScenario } from '../../seed-data.scenario';
import { ProjectAssignmentScenario } from '../../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../../evaluation-target.scenario';
import { DashboardApiClient } from '../../api-clients/dashboard.api-client';
import { WbsAssignmentApiClient } from '../../api-clients/wbs-assignment.api-client';
import { ProjectAssignmentApiClient } from '../../api-clients/project-assignment.api-client';
import { EvaluationPeriodManagementApiClient } from '../../api-clients/evaluation-period-management.api-client';
import { WbsEvaluationCriteriaApiClient } from '../../api-clients/wbs-evaluation-criteria.api-client';

/**
 * 평가기준 중요도(importance) 기반 가중치(weight) 자동 계산 시나리오
 *
 * 테스트 목적:
 * - importance 값에 따라 weight가 자동으로 계산되는지 검증
 * - 가중치 재계산이 올바르게 동작하는지 검증
 */
describe('평가기준 중요도 기반 가중치 자동 계산 시나리오', () => {
  let testSuite: BaseE2ETest;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // API 클라이언트
  let dashboardApiClient: DashboardApiClient;
  let wbsAssignmentApiClient: WbsAssignmentApiClient;
  let projectAssignmentApiClient: ProjectAssignmentApiClient;
  let wbsEvaluationCriteriaApiClient: WbsEvaluationCriteriaApiClient;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);

    // API 클라이언트 인스턴스 생성
    dashboardApiClient = new DashboardApiClient(testSuite);
    wbsAssignmentApiClient = new WbsAssignmentApiClient(testSuite);
    projectAssignmentApiClient = new ProjectAssignmentApiClient(testSuite);
    wbsEvaluationCriteriaApiClient = new WbsEvaluationCriteriaApiClient(
      testSuite,
    );
  });

  afterAll(async () => {
    await testSuite.closeApp();
  });

  beforeEach(async () => {
    // 각 테스트마다 시드 데이터를 새로 생성
    const seedResult = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 3,
      wbsPerProject: 5,
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
      name: '가중치 계산 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '가중치 자동 계산 E2E 테스트용 평가기간',
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

    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send(createData)
      .expect(HttpStatus.CREATED);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(HttpStatus.OK);

    // 직원들을 평가 대상으로 등록
    await evaluationTargetScenario.평가_대상자를_대량_등록한다(
      evaluationPeriodId,
      employeeIds,
    );
  });

  afterEach(async () => {
    // 각 테스트 후 정리
    try {
      if (evaluationPeriodId) {
        await testSuite
          .request()
          .post(`/admin/evaluation-periods/${evaluationPeriodId}/end`)
          .expect(HttpStatus.OK);

        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      }
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  describe('가중치(weight) 자동 계산 검증', () => {
    it('importance 값에 따라 weight가 올바르게 계산되어야 한다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];

      console.log('\n📍 importance 기반 가중치 계산 검증 시작');

      // 1. 프로젝트 할당
      await projectAssignmentApiClient.create({
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 1단계: 프로젝트 할당 완료');

      // 2. WBS 할당 (3개)
      const wbsIds = [wbsItemIds[0], wbsItemIds[1], wbsItemIds[2]];

      for (const wbsId of wbsIds) {
        await wbsAssignmentApiClient.create({
          employeeId: testEmployeeId,
          wbsItemId: wbsId,
          projectId: testProjectId,
          periodId: evaluationPeriodId,
        });
      }

      console.log(`📍 2단계: ${wbsIds.length}개 WBS 할당 완료`);

      // 3. 평가기준 중요도(importance) 설정
      const importanceValues = [3, 5, 2];
      const criteriaIds: string[] = [];

      console.log('\n📍 3단계: 평가기준 importance 설정:');

      for (let i = 0; i < wbsIds.length; i++) {
        const 평가기준조회 =
          await wbsEvaluationCriteriaApiClient.getWbsEvaluationCriteriaList({
            wbsItemId: wbsIds[i],
          });

        const criteriaId = 평가기준조회.criteria[0].id;
        const criteriaContent = 평가기준조회.criteria[0].criteria;
        criteriaIds.push(criteriaId);

        // POST로 upsert (importance 업데이트)
        await wbsEvaluationCriteriaApiClient.upsertWbsEvaluationCriteria({
          wbsItemId: wbsIds[i],
          criteria: criteriaContent || '',
          importance: importanceValues[i],
        });

        console.log(`  - WBS ${i + 1} importance 설정: ${importanceValues[i]}`);
      }

      // 4. 가중치 재계산 트리거 (임시 WBS 할당 후 삭제)
      await wbsAssignmentApiClient.create({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[3],
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // 할당 취소로 가중치 재계산 트리거
      await wbsAssignmentApiClient.cancelByWbs({
        wbsItemId: wbsItemIds[3],
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      console.log('📍 4단계: 가중치 재계산 트리거 완료');

      // 5. 대시보드 API를 통한 가중치 검증
      const 할당데이터 = await dashboardApiClient.getEmployeeAssignedData({
        periodId: evaluationPeriodId,
        employeeId: testEmployeeId,
      });

      const 프로젝트 = 할당데이터.projects.find(
        (p: any) => p.projectId === testProjectId,
      );

      expect(프로젝트).toBeDefined();
      expect(프로젝트.wbsList).toBeDefined();
      expect(프로젝트.wbsList.length).toBe(3);

      // 가중치 계산 공식 검증
      const importanceSum = importanceValues.reduce((a, b) => a + b, 0); // 3 + 5 + 2 = 10
      const expectedWeights = importanceValues.map(
        (imp) => (imp / importanceSum) * 100,
      ); // [30, 50, 20]

      console.log('\n📊 가중치 계산 공식 검증:');
      console.log(`  - importance 합계: ${importanceSum}`);

      let totalWeight = 0;
      for (let i = 0; i < wbsIds.length; i++) {
        const wbs = 프로젝트.wbsList.find((w: any) => w.wbsId === wbsIds[i]);
        expect(wbs).toBeDefined();

        const actualWeight = wbs.weight || 0;
        const expectedWeight = expectedWeights[i];

        console.log(`  - WBS ${i + 1} (importance: ${importanceValues[i]}):`);
        console.log(`    · 예상 weight: ${expectedWeight.toFixed(2)}%`);
        console.log(`    · 실제 weight: ${actualWeight.toFixed(2)}%`);

        // 각 WBS의 weight가 importance 비율과 일치하는지 확인
        expect(actualWeight).toBeCloseTo(expectedWeight, 1); // 소수점 1자리까지 비교

        totalWeight += actualWeight;
      }

      // 가중치 합계 검증
      console.log(`\n📊 가중치 합계: ${totalWeight.toFixed(2)}%`);
      expect(totalWeight).toBeCloseTo(100, 1); // 모든 WBS의 weight 합계가 100인지 확인

      console.log('✅ importance 기반 가중치 자동 계산 검증 완료');
    });
  });
});





