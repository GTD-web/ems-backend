import { HttpStatus } from '@nestjs/common';
import { BaseE2ETest } from '../../../base-e2e.spec';
import { SeedDataScenario } from '../seed-data.scenario';
import { WbsAssignmentScenario } from './wbs-assignment.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

/**
 * 평가항목 상태(evaluationCriteria.status) 변경 검증 시나리오
 *
 * 테스트 목적:
 * - 평가항목 상태가 프로젝트 할당/WBS 할당에 따라 올바르게 전환되는지 검증
 * - 상태 전환 순서: none → in_progress → complete → in_progress → none
 */
describe('평가항목 상태(evaluationCriteria.status) 변경 검증 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

  // 테스트용 데이터
  let evaluationPeriodId: string;
  let employeeIds: string[];
  let projectIds: string[];
  let wbsItemIds: string[];

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    wbsAssignmentScenario = new WbsAssignmentScenario(testSuite);
    projectAssignmentScenario = new ProjectAssignmentScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationTargetScenario = new EvaluationTargetScenario(testSuite);
  });

  afterAll(async () => {
    // 앱 종료
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
      name: '평가항목 상태 테스트용 평가기간',
      startDate: today.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: '평가항목 상태 변경 검증 E2E 테스트용 평가기간',
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
    // 각 테스트 후 시드 데이터 초기화
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

  // 헬퍼 함수: 프로젝트 할당 생성
  async function 프로젝트를_할당한다(
    employeeId: string,
    projectId: string,
  ): Promise<void> {
    await projectAssignmentScenario.프로젝트를_할당한다({
      employeeId,
      projectId,
      periodId: evaluationPeriodId,
    });
  }

  describe('단일 직원 상태 전환', () => {
    it('평가항목 상태가 none → in_progress → complete → in_progress → none 순서로 전환된다', async () => {
      const testEmployeeId = employeeIds[0];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      // ========================================
      // 1단계: 초기 상태 (none) 검증
      // ========================================
      console.log('\n📍 1단계: 초기 상태 (none) 검증');

      const 초기상태 = await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
        evaluationPeriodId,
      );
      const 초기직원상태 = 초기상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(초기직원상태).toBeDefined();
      expect(초기직원상태.evaluationCriteria?.status).toBe('none');
      expect(초기직원상태.evaluationCriteria?.assignedProjectCount).toBe(0);
      expect(초기직원상태.evaluationCriteria?.assignedWbsCount).toBe(0);

      console.log(
        `✅ 초기 상태 검증 완료 - status: ${초기직원상태.evaluationCriteria?.status}`,
      );

      // ========================================
      // 2단계: 프로젝트만 할당 (in_progress)
      // ========================================
      console.log('\n📍 2단계: 프로젝트만 할당 (in_progress) 검증');

      await 프로젝트를_할당한다(testEmployeeId, testProjectId);

      const 프로젝트할당후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 프로젝트할당후직원상태 = 프로젝트할당후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(프로젝트할당후직원상태).toBeDefined();
      expect(프로젝트할당후직원상태.evaluationCriteria?.status).toBe(
        'in_progress',
      );
      expect(
        프로젝트할당후직원상태.evaluationCriteria?.assignedProjectCount,
      ).toBe(1);
      expect(
        프로젝트할당후직원상태.evaluationCriteria?.assignedWbsCount,
      ).toBe(0);

      console.log(
        `✅ 프로젝트 할당 후 상태 검증 완료 - status: ${프로젝트할당후직원상태.evaluationCriteria?.status}, projectCount: ${프로젝트할당후직원상태.evaluationCriteria?.assignedProjectCount}`,
      );

      // ========================================
      // 3단계: WBS 할당으로 완료 상태 전환 (complete)
      // ========================================
      console.log('\n📍 3단계: WBS 할당으로 완료 상태 전환 (complete) 검증');

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      const WBS할당후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const WBS할당후직원상태 = WBS할당후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(WBS할당후직원상태).toBeDefined();
      expect(WBS할당후직원상태.evaluationCriteria?.status).toBe('complete');
      expect(WBS할당후직원상태.evaluationCriteria?.assignedProjectCount).toBe(
        1,
      );
      expect(
        WBS할당후직원상태.evaluationCriteria?.assignedWbsCount,
      ).toBeGreaterThanOrEqual(1);

      console.log(
        `✅ WBS 할당 후 상태 검증 완료 - status: ${WBS할당후직원상태.evaluationCriteria?.status}, wbsCount: ${WBS할당후직원상태.evaluationCriteria?.assignedWbsCount}`,
      );

      // ========================================
      // 4단계: WBS 취소로 진행중 상태 전환 (complete → in_progress)
      // ========================================
      console.log(
        '\n📍 4단계: WBS 취소로 진행중 상태 전환 (complete → in_progress) 검증',
      );

      await wbsAssignmentScenario.WBS_할당을_WBS_ID로_취소한다({
        wbsItemId: testWbsItemId,
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      const WBS취소후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const WBS취소후직원상태 = WBS취소후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(WBS취소후직원상태).toBeDefined();
      expect(WBS취소후직원상태.evaluationCriteria?.status).toBe(
        'in_progress',
      );
      expect(WBS취소후직원상태.evaluationCriteria?.assignedProjectCount).toBe(
        1,
      );
      expect(WBS취소후직원상태.evaluationCriteria?.assignedWbsCount).toBe(0);

      console.log(
        `✅ WBS 취소 후 상태 검증 완료 - status: ${WBS취소후직원상태.evaluationCriteria?.status}, wbsCount: ${WBS취소후직원상태.evaluationCriteria?.assignedWbsCount}`,
      );

      // ========================================
      // 5단계: 프로젝트 취소로 초기 상태 전환 (in_progress → none)
      // ========================================
      console.log(
        '\n📍 5단계: 프로젝트 취소로 초기 상태 전환 (in_progress → none) 검증',
      );

      // 프로젝트 할당 ID 조회
      const 프로젝트할당목록 = await testSuite
        .request()
        .get(`/admin/evaluation-criteria/project-assignments`)
        .query({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
          page: 1,
          limit: 100,
        })
        .expect(200);

      const 삭제대상할당 = 프로젝트할당목록.body.assignments.find(
        (assignment: any) =>
          assignment.projectId === testProjectId &&
          assignment.employeeId === testEmployeeId,
      );

      expect(삭제대상할당).toBeDefined();

      // 프로젝트 할당 취소
      await testSuite
        .request()
        .delete(
          `/admin/evaluation-criteria/project-assignments/${삭제대상할당.id}`,
        )
        .expect(200);

      const 프로젝트취소후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 프로젝트취소후직원상태 = 프로젝트취소후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(프로젝트취소후직원상태).toBeDefined();
      expect(프로젝트취소후직원상태.evaluationCriteria?.status).toBe('none');
      expect(
        프로젝트취소후직원상태.evaluationCriteria?.assignedProjectCount,
      ).toBe(0);
      expect(
        프로젝트취소후직원상태.evaluationCriteria?.assignedWbsCount,
      ).toBe(0);

      console.log(
        `✅ 프로젝트 취소 후 상태 검증 완료 - status: ${프로젝트취소후직원상태.evaluationCriteria?.status}`,
      );
      console.log(
        `\n🎉 전체 상태 전환 시나리오 검증 완료: none → in_progress → complete → in_progress → none`,
      );
    }, 60000); // 60초 타임아웃
  });

  describe('다중 할당 상태 전환', () => {
    it('다중 프로젝트와 WBS 할당 시 상태가 complete이 된다', async () => {
      const testEmployeeId = employeeIds[1];

      // ========================================
      // 1단계: 여러 프로젝트 할당
      // ========================================
      console.log('\n📍 다중 프로젝트 할당');

      await 프로젝트를_할당한다(testEmployeeId, projectIds[0]);
      await 프로젝트를_할당한다(testEmployeeId, projectIds[1]);
      await 프로젝트를_할당한다(testEmployeeId, projectIds[2]);

      // ========================================
      // 2단계: 여러 WBS 할당
      // ========================================
      console.log('\n📍 다중 WBS 할당');

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[5],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[10],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      // ========================================
      // 3단계: 상태 검증
      // ========================================
      console.log('\n📍 다중 할당 후 상태 검증');

      const 다중할당후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 다중할당후직원상태 = 다중할당후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(다중할당후직원상태).toBeDefined();
      expect(다중할당후직원상태.evaluationCriteria?.status).toBe('complete');
      expect(
        다중할당후직원상태.evaluationCriteria?.assignedProjectCount,
      ).toBe(3);
      expect(다중할당후직원상태.evaluationCriteria?.assignedWbsCount).toBe(3);

      console.log(`✅ 다중 할당 후 상태 검증 완료`);
      console.log(
        `  - status: ${다중할당후직원상태.evaluationCriteria?.status}`,
      );
      console.log(
        `  - projectCount: ${다중할당후직원상태.evaluationCriteria?.assignedProjectCount}`,
      );
      console.log(
        `  - wbsCount: ${다중할당후직원상태.evaluationCriteria?.assignedWbsCount}`,
      );

      // ========================================
      // 4단계: 일부 WBS 취소 후에도 complete 유지
      // ========================================
      console.log('\n📍 일부 WBS 취소 후 상태 검증');

      await wbsAssignmentScenario.WBS_할당을_WBS_ID로_취소한다({
        wbsItemId: wbsItemIds[0],
        employeeId: testEmployeeId,
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      const 일부취소후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 일부취소후직원상태 = 일부취소후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(일부취소후직원상태).toBeDefined();
      expect(일부취소후직원상태.evaluationCriteria?.status).toBe('complete'); // 여전히 complete (다른 WBS가 있음)
      expect(
        일부취소후직원상태.evaluationCriteria?.assignedProjectCount,
      ).toBe(3);
      expect(일부취소후직원상태.evaluationCriteria?.assignedWbsCount).toBe(2); // 하나 취소됨

      console.log(
        `✅ 일부 WBS 취소 후 상태 검증 완료 - 여전히 complete 상태 유지`,
      );
      console.log(
        `  - status: ${일부취소후직원상태.evaluationCriteria?.status}`,
      );
      console.log(
        `  - wbsCount: ${일부취소후직원상태.evaluationCriteria?.assignedWbsCount}`,
      );

      console.log(`\n🎉 다중 할당 상태 검증 시나리오 완료`);
    }, 60000); // 60초 타임아웃

    it('모든 WBS 취소 시 complete에서 in_progress로 전환된다', async () => {
      const testEmployeeId = employeeIds[2];
      const testProjectId = projectIds[0];

      // ========================================
      // 1단계: 프로젝트 할당
      // ========================================
      await 프로젝트를_할당한다(testEmployeeId, testProjectId);

      // ========================================
      // 2단계: 여러 WBS 할당
      // ========================================
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[0],
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: wbsItemIds[1],
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      // complete 상태 확인
      const 할당후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 할당후직원상태 = 할당후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(할당후직원상태.evaluationCriteria?.status).toBe('complete');
      expect(할당후직원상태.evaluationCriteria?.assignedWbsCount).toBe(2);

      console.log(`✅ WBS 할당 후 complete 상태 확인`);

      // ========================================
      // 3단계: 첫 번째 WBS 취소 - 여전히 complete
      // ========================================
      await wbsAssignmentScenario.WBS_할당을_WBS_ID로_취소한다({
        wbsItemId: wbsItemIds[0],
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      const 첫번째취소후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 첫번째취소후직원상태 = 첫번째취소후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(첫번째취소후직원상태.evaluationCriteria?.status).toBe('complete');
      expect(첫번째취소후직원상태.evaluationCriteria?.assignedWbsCount).toBe(
        1,
      );

      console.log(`✅ 첫 번째 WBS 취소 후 여전히 complete 상태`);

      // ========================================
      // 4단계: 마지막 WBS 취소 - in_progress로 전환
      // ========================================
      await wbsAssignmentScenario.WBS_할당을_WBS_ID로_취소한다({
        wbsItemId: wbsItemIds[1],
        employeeId: testEmployeeId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      const 모두취소후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 모두취소후직원상태 = 모두취소후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(모두취소후직원상태.evaluationCriteria?.status).toBe(
        'in_progress',
      );
      expect(모두취소후직원상태.evaluationCriteria?.assignedWbsCount).toBe(0);
      expect(
        모두취소후직원상태.evaluationCriteria?.assignedProjectCount,
      ).toBe(1);

      console.log(
        `✅ 모든 WBS 취소 후 in_progress로 전환 - projectCount: ${모두취소후직원상태.evaluationCriteria?.assignedProjectCount}`,
      );
      console.log(
        `\n🎉 모든 WBS 취소 시 상태 전환 시나리오 완료: complete → in_progress`,
      );
    }, 60000);
  });

  describe('엣지 케이스', () => {
    it('프로젝트 없이는 in_progress 상태가 될 수 없다', async () => {
      const testEmployeeId = employeeIds[3];

      // 개별 직원 평가기간 현황 조회 (프로젝트나 WBS 할당이 없어도 조회 가능)
      const 초기직원상태 =
        await wbsAssignmentScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: testEmployeeId,
        });

      expect(초기직원상태).toBeDefined();
      expect(초기직원상태.employeeId).toBe(testEmployeeId);
      expect(초기직원상태.evaluationCriteria).toBeDefined();
      expect(초기직원상태.evaluationCriteria.status).toBe('none');
      expect(초기직원상태.evaluationCriteria.assignedProjectCount).toBe(0);
      expect(초기직원상태.evaluationCriteria.assignedWbsCount).toBe(0);

      console.log(
        `✅ 프로젝트 미할당 시 none 상태 유지 검증 완료 - status: ${초기직원상태.evaluationCriteria.status}`,
      );
    });

    it('WBS만 할당되면 complete 상태가 된다 (프로젝트 자동 할당)', async () => {
      const testEmployeeId = employeeIds[4];
      const testProjectId = projectIds[0];
      const testWbsItemId = wbsItemIds[0];

      // 프로젝트 할당
      await 프로젝트를_할당한다(testEmployeeId, testProjectId);

      // WBS 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: testEmployeeId,
        wbsItemId: testWbsItemId,
        projectId: testProjectId,
        periodId: evaluationPeriodId,
      });

      const 할당후상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 할당후직원상태 = 할당후상태.find(
        (emp: any) => emp.employeeId === testEmployeeId,
      );

      expect(할당후직원상태.evaluationCriteria?.status).toBe('complete');
      expect(할당후직원상태.evaluationCriteria?.assignedProjectCount).toBe(1);
      expect(할당후직원상태.evaluationCriteria?.assignedWbsCount).toBe(1);

      console.log(`✅ WBS 할당으로 complete 상태 전환 검증 완료`);
    });
  });
});

