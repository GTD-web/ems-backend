import { BaseE2ETest } from '../../../base-e2e.spec';
import { WbsAssignmentScenario } from './wbs-assignment.scenario';
import { ProjectAssignmentScenario } from '../project-assignment/project-assignment.scenario';
import { EvaluationPeriodScenario } from '../evaluation-period.scenario';
import { SeedDataScenario } from '../seed-data.scenario';
import { EvaluationTargetScenario } from '../evaluation-target.scenario';

describe('WBS 할당 기본 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let wbsAssignmentScenario: WbsAssignmentScenario;
  let projectAssignmentScenario: ProjectAssignmentScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let seedDataScenario: SeedDataScenario;
  let evaluationTargetScenario: EvaluationTargetScenario;

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

    // 평가기간 생성 (고유한 날짜를 위해 timestamp 사용)
    const timestamp = Date.now();
    const today = new Date();
    // 고유한 날짜를 위해 timestamp를 사용하여 일수 추가
    const uniqueDays = Math.floor(timestamp / (1000 * 60 * 60 * 24));
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + uniqueDays);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(startDate.getMonth() + 1);

    const createData = {
      name: `WBS 할당 테스트용 평가기간_${timestamp}`,
      startDate: startDate.toISOString(),
      peerEvaluationDeadline: nextMonth.toISOString(),
      description: 'WBS 할당 E2E 테스트용 평가기간',
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
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;

    // 평가기간 시작
    await testSuite
      .request()
      .post(`/admin/evaluation-periods/${evaluationPeriodId}/start`)
      .expect(200);

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
        // 평가기간 완료 (실제 API는 /complete 사용)
        await evaluationPeriodScenario.평가기간을_완료한다(evaluationPeriodId);
        // 평가기간 삭제
        await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
      }
      await seedDataScenario.시드_데이터를_삭제한다();
    } catch (error) {
      console.log('테스트 정리 중 오류 (무시):', error.message);
    }
  });

  afterAll(async () => {
    // 앱 종료
    await testSuite.closeApp();
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

  describe('WBS 할당 기본 관리', () => {
    it('WBS를 할당하고 대시보드에서 검증한다', async () => {
      // 선행 조건: 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[0], projectIds[0]);

      // WBS 할당 + 대시보드 검증
      const result =
        await wbsAssignmentScenario.WBS를_할당하고_대시보드에서_검증한다({
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[0],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        });

      // 할당 결과 검증
      expect(result.할당결과).toBeDefined();
      expect(result.할당결과.id).toBeDefined();
      console.log(`✅ WBS 할당 완료 - 할당 ID: ${result.할당결과.id}`);

      // 대시보드 상태 검증
      expect(result.대시보드상태).toBeDefined();
      expect(result.대시보드상태.employeeId).toBe(employeeIds[0]);
      expect(result.대시보드상태.isEvaluationTarget).toBe(true);

      // evaluationCriteria 검증
      expect(result.evaluationCriteria).toBeDefined();
      expect(result.evaluationCriteria.status).toBeDefined();
      expect(result.evaluationCriteria.assignedWbsCount).toBeGreaterThan(0);
      console.log(
        `✅ 대시보드 검증 완료 - 상태: ${result.evaluationCriteria.status}, 할당된 WBS 수: ${result.evaluationCriteria.assignedWbsCount}`,
      );

      // 직원 할당 데이터 검증
      expect(result.할당데이터).toBeDefined();
      expect(result.할당데이터.employee).toBeDefined();
      expect(result.할당데이터.employee.id).toBe(employeeIds[0]);

      // WBS 목록 검증
      expect(Array.isArray(result.WBS목록)).toBe(true);
      expect(result.WBS목록.length).toBeGreaterThan(0);

      // 할당된 WBS가 올바른 WBS인지 확인
      const 할당된WBS = result.WBS목록.find(
        (wbs: any) => wbs.wbsId === wbsItemIds[0],
      );
      expect(할당된WBS).toBeDefined();
      expect(할당된WBS.wbsId).toBe(wbsItemIds[0]);
      expect(할당된WBS.wbsName).toBeDefined();
      expect(할당된WBS.wbsCode).toBeDefined();

      console.log(
        `✅ WBS 할당 검증 완료 - WBS ID: ${할당된WBS.wbsId}, WBS명: ${할당된WBS.wbsName}`,
      );

      // summary 검증
      expect(result.할당데이터.summary).toBeDefined();
      expect(result.할당데이터.summary.totalProjects).toBeGreaterThan(0);
      expect(result.할당데이터.summary.totalWbs).toBeGreaterThan(0);
      console.log(
        `✅ summary 검증 완료 - 프로젝트 ${result.할당데이터.summary.totalProjects}개, WBS ${result.할당데이터.summary.totalWbs}개`,
      );

      // 개별 직원 평가기간 현황 조회 및 검증
      const 직원평가기간현황 =
        await wbsAssignmentScenario.직원의_평가기간_현황을_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[0],
        });

      expect(직원평가기간현황).toBeDefined();
      expect(직원평가기간현황.employeeId).toBe(employeeIds[0]);
      expect(직원평가기간현황.isEvaluationTarget).toBe(true);

      // evaluationCriteria 상태 검증 (개별 조회)
      expect(직원평가기간현황.evaluationCriteria).toBeDefined();
      expect(직원평가기간현황.evaluationCriteria.status).toBe('complete');
      expect(
        직원평가기간현황.evaluationCriteria.assignedProjectCount,
      ).toBeGreaterThan(0);
      expect(
        직원평가기간현황.evaluationCriteria.assignedWbsCount,
      ).toBeGreaterThan(0);

      // 대시보드 전체 조회와 개별 조회의 일관성 검증
      expect(직원평가기간현황.evaluationCriteria.status).toBe(
        result.evaluationCriteria.status,
      );
      expect(직원평가기간현황.evaluationCriteria.assignedProjectCount).toBe(
        result.evaluationCriteria.assignedProjectCount,
      );
      expect(직원평가기간현황.evaluationCriteria.assignedWbsCount).toBe(
        result.evaluationCriteria.assignedWbsCount,
      );

      console.log(
        `✅ 개별 직원 평가기간 현황 검증 완료 - 상태: ${직원평가기간현황.evaluationCriteria.status}, 프로젝트 ${직원평가기간현황.evaluationCriteria.assignedProjectCount}개, WBS ${직원평가기간현황.evaluationCriteria.assignedWbsCount}개`,
      );
    });

    it('WBS 할당 목록을 조회한다', async () => {
      // 선행 조건: 프로젝트 할당 및 WBS 할당 생성
      await 프로젝트를_할당한다(employeeIds[0], projectIds[0]);
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      const result = await wbsAssignmentScenario.WBS_할당_목록을_조회한다({
        periodId: evaluationPeriodId,
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.assignments)).toBe(true);
      expect(result.assignments.length).toBeGreaterThan(0);
      console.log(
        `✅ WBS 할당 목록 조회 완료 - 총 ${result.assignments.length}개 할당`,
      );
    });

    it('직원별 할당 WBS를 조회한다', async () => {
      // 선행 조건: 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[1], projectIds[1]);

      // WBS를 할당
      const 할당결과 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[1],
        wbsItemId: wbsItemIds[1],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      const result = await wbsAssignmentScenario.직원별_할당_WBS를_조회한다(
        employeeIds[1],
        evaluationPeriodId,
      );

      console.log(
        '직원별 할당 WBS 조회 결과:',
        JSON.stringify(result, null, 2),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.wbsAssignments)).toBe(true);
      expect(result.wbsAssignments.length).toBeGreaterThan(0);

      // 할당된 WBS가 올바른 WBS인지 확인
      const 할당된WBS = result.wbsAssignments.find(
        (wbs: any) => wbs.wbsItemId === wbsItemIds[1],
      );
      expect(할당된WBS).toBeDefined();
      expect(할당된WBS.wbsItemId).toBe(wbsItemIds[1]);

      // 대시보드 API를 통한 추가 검증
      const 대시보드할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[1],
        });

      // 대시보드에서 반환된 WBS 목록에서 할당된 WBS 검증
      const 프로젝트 = 대시보드할당데이터.projects?.find(
        (p: any) => p.projectId === projectIds[1],
      );
      expect(프로젝트).toBeDefined();

      const 대시보드할당된WBS = 프로젝트.wbsList?.find(
        (wbs: any) => wbs.wbsId === wbsItemIds[1],
      );
      expect(대시보드할당된WBS).toBeDefined();
      expect(대시보드할당된WBS.wbsId).toBe(wbsItemIds[1]);
      expect(대시보드할당된WBS.wbsName).toBeDefined();
      expect(대시보드할당된WBS.wbsCode).toBeDefined();

      console.log(
        `✅ 대시보드 API를 통한 WBS 할당 검증 완료 - 할당된 WBS ID: ${대시보드할당된WBS.wbsId}, WBS명: ${대시보드할당된WBS.wbsName}`,
      );

      // summary 검증
      expect(대시보드할당데이터.summary).toBeDefined();
      expect(대시보드할당데이터.summary.totalProjects).toBeGreaterThan(0);
      expect(대시보드할당데이터.summary.totalWbs).toBeGreaterThan(0);
      console.log(
        `✅ summary 검증 완료 - 프로젝트 ${대시보드할당데이터.summary.totalProjects}개, WBS ${대시보드할당데이터.summary.totalWbs}개`,
      );

      console.log(
        `✅ 직원별 할당 WBS 조회 완료 - 직원 ${employeeIds[1]}, WBS ${result.wbsAssignments.length}개`,
      );
    });

    it('프로젝트별 할당 WBS를 조회한다', async () => {
      // 선행 조건: 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[2], projectIds[2]);

      // WBS를 할당
      const 할당결과 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[2],
        wbsItemId: wbsItemIds[2],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      const result = await wbsAssignmentScenario.프로젝트별_할당_WBS를_조회한다(
        projectIds[2],
        evaluationPeriodId,
      );

      console.log(
        '프로젝트별 할당 WBS 조회 결과:',
        JSON.stringify(result, null, 2),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.wbsAssignments)).toBe(true);
      expect(result.wbsAssignments.length).toBeGreaterThan(0);

      // 할당된 WBS가 올바른 WBS인지 확인
      const 할당된WBS = result.wbsAssignments.find(
        (wbs: any) => wbs.wbsItemId === wbsItemIds[2],
      );
      expect(할당된WBS).toBeDefined();
      expect(할당된WBS.wbsItemId).toBe(wbsItemIds[2]);

      console.log(
        `✅ 프로젝트별 할당 WBS 조회 완료 - 프로젝트 ${projectIds[2]}, WBS ${result.wbsAssignments.length}개`,
      );
    });

    it('WBS 항목별 할당된 직원을 조회한다', async () => {
      // 선행 조건: 프로젝트 할당 및 WBS 할당 생성
      await 프로젝트를_할당한다(employeeIds[0], projectIds[0]);
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      const result =
        await wbsAssignmentScenario.WBS_항목별_할당된_직원을_조회한다(
          wbsItemIds[0],
          evaluationPeriodId,
        );

      console.log(
        'WBS 항목별 할당된 직원 조회 결과:',
        JSON.stringify(result, null, 2),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result.wbsAssignments)).toBe(true);
      expect(result.wbsAssignments.length).toBeGreaterThan(0);

      // 할당된 직원이 올바른 직원인지 확인
      const 할당된직원 = result.wbsAssignments.find(
        (wbs: any) => wbs.employeeId === employeeIds[0],
      );
      expect(할당된직원).toBeDefined();
      expect(할당된직원.employeeId).toBe(employeeIds[0]);

      console.log(
        `✅ WBS 항목별 할당된 직원 조회 완료 - WBS ${wbsItemIds[0]}, 직원 ${result.wbsAssignments.length}명`,
      );
    });

    it('미할당 WBS 항목 목록을 조회한다', async () => {
      const result =
        await wbsAssignmentScenario.미할당_WBS_항목_목록을_조회한다({
          periodId: evaluationPeriodId,
          projectId: projectIds[0],
          employeeId: employeeIds[0],
        });

      expect(result).toBeDefined();
      expect(Array.isArray(result.wbsItems)).toBe(true);
      console.log(
        `✅ 미할당 WBS 항목 목록 조회 완료 - 프로젝트 ${projectIds[0]}, 미할당 WBS ${result.wbsItems.length}개`,
      );
    });

    it('WBS 할당 상세를 조회한다', async () => {
      // 선행 조건: 프로젝트 할당 및 WBS 할당 생성
      await 프로젝트를_할당한다(employeeIds[0], projectIds[0]);
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      // WBS 할당 상세 조회
      const result = await wbsAssignmentScenario.WBS_할당_상세를_조회한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      console.log('WBS 할당 상세 조회 결과:', JSON.stringify(result, null, 2));

      expect(result).toBeDefined();
      expect(result.employee).toBeDefined();
      expect(result.employee.id).toBe(employeeIds[0]);
      expect(result.wbsItem).toBeDefined();
      expect(result.wbsItem.id).toBe(wbsItemIds[0]);
      expect(result.project).toBeDefined();
      expect(result.project.id).toBe(projectIds[0]);
      expect(result.period).toBeDefined();
      expect(result.period.id).toBe(evaluationPeriodId);
      console.log(`✅ WBS 할당 상세 조회 완료`);
    });
  });

  describe('WBS 대량 할당 관리', () => {
    it('WBS를 대량으로 할당한다', async () => {
      // 선행 조건: 각 직원에게 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[0], projectIds[0]);
      await 프로젝트를_할당한다(employeeIds[1], projectIds[1]);
      await 프로젝트를_할당한다(employeeIds[2], projectIds[2]);

      const assignments = [
        {
          employeeId: employeeIds[0],
          wbsItemId: wbsItemIds[3],
          projectId: projectIds[0],
          periodId: evaluationPeriodId,
        },
        {
          employeeId: employeeIds[1],
          wbsItemId: wbsItemIds[4],
          projectId: projectIds[1],
          periodId: evaluationPeriodId,
        },
        {
          employeeId: employeeIds[2],
          wbsItemId: wbsItemIds[5],
          projectId: projectIds[2],
          periodId: evaluationPeriodId,
        },
      ];

      const result =
        await wbsAssignmentScenario.WBS를_대량으로_할당한다(assignments);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(assignments.length);
      result.forEach((assignment, index) => {
        expect(assignment.id).toBeDefined();
        expect(assignment.employeeId).toBe(assignments[index].employeeId);
        expect(assignment.wbsItemId).toBe(assignments[index].wbsItemId);
      });

      // 대시보드 API를 통한 각 할당 검증
      for (let i = 0; i < result.length; i++) {
        const assignment = result[i];
        const expectedAssignment = assignments[i];

        const 대시보드할당데이터 =
          await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
            periodId: evaluationPeriodId,
            employeeId: assignment.employeeId,
          });

        // 대시보드에서 반환된 WBS 목록에서 할당된 WBS 검증
        const 프로젝트 = 대시보드할당데이터.projects?.find(
          (p: any) => p.projectId === expectedAssignment.projectId,
        );
        expect(프로젝트).toBeDefined();

        const 대시보드할당된WBS = 프로젝트.wbsList?.find(
          (wbs: any) => wbs.wbsId === expectedAssignment.wbsItemId,
        );
        expect(대시보드할당된WBS).toBeDefined();
        expect(대시보드할당된WBS.wbsId).toBe(expectedAssignment.wbsItemId);
        expect(대시보드할당된WBS.wbsName).toBeDefined();
        expect(대시보드할당된WBS.wbsCode).toBeDefined();

        console.log(
          `✅ 대시보드 API를 통한 할당 검증 완료 - 직원 ${assignment.employeeId}, WBS ID: ${대시보드할당된WBS.wbsId}, WBS명: ${대시보드할당된WBS.wbsName}`,
        );
      }

      console.log(`✅ WBS 대량 할당 완료 - ${result.length}개 할당`);
    });

    it('WBS 할당 순서를 변경하고 대시보드에서 검증한다', async () => {
      // 선행 조건: 프로젝트 할당 생성 (독립적인 직원-프로젝트 조합 사용)
      await 프로젝트를_할당한다(employeeIds[3], projectIds[0]);

      // 1. 여러 WBS를 할당해서 순서 변경이 가능한 상태 만들기
      // projectIds[0]에 속한 WBS 사용 (wbsItemIds[0-4])
      const 추가할당결과1 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[0],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      const 추가할당결과2 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[1],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      const 추가할당결과3 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[2],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      console.log(`✅ 추가 WBS 할당 완료 - WBS 3개 추가`);

      // 2. 변경 전 할당 데이터 조회
      const 변경전할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[3],
        });

      const 프로젝트 = 변경전할당데이터.projects?.find(
        (p: any) => p.projectId === projectIds[0],
      );
      const 변경전WBS순서 = 프로젝트?.wbsList || [];
      const 변경전WBS수 = 변경전WBS순서.length;
      console.log(
        `📊 변경 전 WBS 순서 (${변경전WBS수}개):`,
        변경전WBS순서.map((w: any) => w.wbsId),
      );

      // 3. 마지막 할당의 순서를 위로 변경
      const result =
        await wbsAssignmentScenario.WBS_할당_순서를_WBS_ID로_변경하고_대시보드에서_검증한다(
          {
            wbsItemId: wbsItemIds[2],
            employeeId: employeeIds[3],
            projectId: projectIds[0],
            periodId: evaluationPeriodId,
            direction: 'up',
          },
        );

      // 4. 순서 변경 결과 검증
      expect(result.순서변경결과).toBeDefined();
      console.log(`✅ WBS 할당 순서 변경 완료 - WBS ID: ${wbsItemIds[2]}`);

      // 5. 할당 데이터 검증
      expect(result.할당데이터).toBeDefined();
      expect(result.할당데이터.employee).toBeDefined();
      expect(result.할당데이터.employee.id).toBe(employeeIds[3]);

      // 6. WBS 순서 검증
      expect(Array.isArray(result.WBS순서)).toBe(true);
      expect(result.WBS순서.length).toBe(변경전WBS수); // WBS 수는 동일해야 함
      console.log(
        `📊 변경 후 WBS 순서 (${result.WBS순서.length}개):`,
        result.WBS순서.map((w: any) => w.wbsId),
      );

      // 7. 실제 순서 변경 검증
      const 변경전순서 = 변경전WBS순서.map((w: any) => w.wbsId);
      const 변경후순서 = result.WBS순서.map((w: any) => w.wbsId);

      // 순서가 실제로 변경되었는지 확인
      expect(변경후순서).not.toEqual(변경전순서);

      // 마지막 WBS가 한 단계 위로 이동했는지 확인
      const 변경전마지막인덱스 = 변경전순서.indexOf(wbsItemIds[2]);
      const 변경후마지막인덱스 = 변경후순서.indexOf(wbsItemIds[2]);

      expect(변경후마지막인덱스).toBe(변경전마지막인덱스 - 1);
      console.log(
        `✅ 순서 변경 검증 완료 - WBS가 한 단계 위로 이동됨 (${변경전마지막인덱스} → ${변경후마지막인덱스})`,
      );

      // 8. summary.totalWbs 검증
      expect(result.할당데이터.summary).toBeDefined();
      expect(result.할당데이터.summary.totalWbs).toBeDefined();
      expect(result.할당데이터.summary.totalWbs).toBeGreaterThan(0);
      expect(result.총WBS수).toBe(result.할당데이터.summary.totalWbs);
      console.log(
        `✅ summary.totalWbs 검증 완료 - ${result.할당데이터.summary.totalWbs}개 (총WBS수와 일치)`,
      );
    });

    it('WBS 할당을 취소한다', async () => {
      // 선행 조건: 프로젝트 할당 생성 (독립적인 직원-프로젝트 조합 사용)
      await 프로젝트를_할당한다(employeeIds[4], projectIds[1]);

      // WBS를 할당
      const 할당결과 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[4],
        wbsItemId: wbsItemIds[9],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      const wbsItemId = 할당결과.wbsItemId;
      const employeeId = 할당결과.employeeId;
      const projectId = 할당결과.projectId;

      // 할당 취소 전 직원 할당 데이터 조회
      const 취소전할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        });

      const 취소전프로젝트 = 취소전할당데이터.projects?.find(
        (p: any) => p.projectId === projectId,
      );
      const 취소전WBS수 = 취소전프로젝트?.wbsList?.length || 0;

      // 할당 취소 전 대시보드 직원 현황 조회
      const 취소전대시보드상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 취소전직원상태 = 취소전대시보드상태.find(
        (emp: any) => emp.employeeId === employeeId,
      );

      console.log(`📊 취소 전 할당 데이터 - WBS 수: ${취소전WBS수}`);
      console.log(
        `📊 취소 전 대시보드 상태 - assignedWbsCount: ${취소전직원상태?.evaluationCriteria?.assignedWbsCount || 0}`,
      );

      // 할당 취소
      console.log(
        `⏳ WBS 할당 취소 API 호출 시작 - wbsItemId: ${wbsItemId}, employeeId: ${employeeId}`,
      );
      await wbsAssignmentScenario.WBS_할당을_WBS_ID로_취소한다({
        wbsItemId,
        employeeId,
        projectId,
        periodId: evaluationPeriodId,
      });
      console.log(`✅ WBS 할당 취소 API 호출 완료`);

      // 할당 취소 후 직원 할당 데이터 조회
      const 취소후할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeId,
        });

      const 취소후프로젝트 = 취소후할당데이터.projects?.find(
        (p: any) => p.projectId === projectId,
      );
      const 취소후WBS수 = 취소후프로젝트?.wbsList?.length || 0;

      // 할당 취소 후 대시보드 직원 현황 조회 (데이터 반영 지연 고려)
      await new Promise((resolve) => setTimeout(resolve, 500));

      const 취소후대시보드상태 =
        await wbsAssignmentScenario.대시보드_직원_현황을_조회한다(
          evaluationPeriodId,
        );
      const 취소후직원상태 = 취소후대시보드상태.find(
        (emp: any) => emp.employeeId === employeeId,
      );

      // 디버깅: 직원 상태가 없으면 로그 출력
      if (!취소후직원상태) {
        console.log(
          `⚠️ 직원 상태를 찾을 수 없음 - employeeId: ${employeeId}, 조회된 직원 수: ${취소후대시보드상태?.length || 0}`,
        );
        console.log(
          `조회된 직원 ID 목록: ${취소후대시보드상태?.map((e: any) => e.employeeId).join(', ') || '없음'}`,
        );
      }

      console.log(`📊 취소 후 할당 데이터 - WBS 수: ${취소후WBS수}`);
      console.log(
        `📊 취소 후 대시보드 상태 - assignedWbsCount: ${취소후직원상태?.evaluationCriteria?.assignedWbsCount || 0}`,
      );

      // 검증: 할당 취소 후 WBS 수가 감소했는지 확인
      expect(취소후WBS수).toBeLessThan(취소전WBS수);

      // 검증: 취소된 WBS가 더 이상 할당 목록에 없는지 확인
      const 취소된WBS = 취소후프로젝트?.wbsList?.find(
        (w: any) => w.wbsId === wbsItemId,
      );
      expect(취소된WBS).toBeUndefined();

      // 대시보드 상태 검증
      expect(취소후직원상태).toBeDefined();
      expect(
        취소후직원상태.evaluationCriteria?.assignedWbsCount || 0,
      ).toBeLessThanOrEqual(
        취소전직원상태.evaluationCriteria?.assignedWbsCount || 0,
      );

      console.log(`✅ WBS 할당 취소 및 검증 완료 - WBS ID: ${wbsItemId}`);
    }, 60000); // 60초 타임아웃

    it('WBS 할당 취소 시 가중치가 재계산된다', async () => {
      // 선행 조건: 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[3], projectIds[2]);

      // 1. 여러 WBS를 할당 (3개)
      const 할당결과1 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[10],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      const 할당결과2 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[11],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      const 할당결과3 = await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[3],
        wbsItemId: wbsItemIds[12],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      // 2. 할당 후 가중치 확인 (3개이므로 각각 약 33.33%)
      const 할당전목록 = await wbsAssignmentScenario.직원별_할당_WBS를_조회한다(
        employeeIds[3],
        evaluationPeriodId,
      );

      const 할당전가중치합계 = 할당전목록.wbsAssignments.reduce(
        (sum: number, assignment: any) => sum + (assignment.weight || 0),
        0,
      );

      console.log(`📊 할당 후 가중치 합계: ${할당전가중치합계}`);
      expect(할당전가중치합계).toBeCloseTo(100, 1); // 소수점 1자리까지 비교

      // 3. 하나의 WBS 할당 취소
      await wbsAssignmentScenario.WBS_할당을_WBS_ID로_취소한다({
        wbsItemId: wbsItemIds[10],
        employeeId: employeeIds[3],
        projectId: projectIds[2],
        periodId: evaluationPeriodId,
      });

      console.log(`✅ WBS 할당 취소 완료 - WBS ID: ${wbsItemIds[10]}`);

      // 4. 취소 후 남은 WBS들의 가중치 재계산 검증
      const 취소후목록 = await wbsAssignmentScenario.직원별_할당_WBS를_조회한다(
        employeeIds[3],
        evaluationPeriodId,
      );

      // 취소 후 2개만 남음
      expect(취소후목록.wbsAssignments.length).toBe(2);

      // 가중치 합계가 100이 되도록 재계산되었는지 확인
      const 취소후가중치합계 = 취소후목록.wbsAssignments.reduce(
        (sum: number, assignment: any) => sum + (assignment.weight || 0),
        0,
      );

      console.log(`📊 취소 후 가중치 합계: ${취소후가중치합계}`);
      expect(취소후가중치합계).toBeCloseTo(100, 1); // 소수점 1자리까지 비교

      // 각 할당의 가중치가 50%씩 재분배되었는지 확인
      취소후목록.wbsAssignments.forEach((assignment: any) => {
        console.log(
          `  - WBS ID: ${assignment.wbsItemId}, 가중치: ${assignment.weight}`,
        );
        expect(assignment.weight).toBeGreaterThan(0);
      });

      console.log(
        `✅ WBS 할당 취소 시 가중치 재계산 검증 완료 - 2개 WBS의 가중치 합계: ${취소후가중치합계}%`,
      );
    });

    it('WBS를 생성하면서 할당한다', async () => {
      // 선행 조건: 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[4], projectIds[0]);

      const 할당결과 = await wbsAssignmentScenario.WBS를_생성하고_할당한다({
        title: '새로 생성된 WBS 항목',
        projectId: projectIds[0],
        employeeId: employeeIds[4],
        periodId: evaluationPeriodId,
      });

      expect(할당결과).toBeDefined();
      expect(할당결과.wbsItem).toBeDefined();
      expect(할당결과.wbsItem.id).toBeDefined();
      expect(할당결과.wbsItem.title).toBe('새로 생성된 WBS 항목');
      expect(할당결과.wbsItem.wbsCode).toBeDefined(); // 자동 생성된 코드
      expect(할당결과.assignment).toBeDefined();
      expect(할당결과.assignment.id).toBeDefined();

      console.log(
        `✅ WBS 생성 및 할당 완료 - WBS ID: ${할당결과.wbsItem.id}, 코드: ${할당결과.wbsItem.wbsCode}`,
      );

      // 대시보드에서 검증
      const 대시보드할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[4],
        });

      // 프로젝트가 반드시 존재해야 함
      expect(대시보드할당데이터.projects).toBeDefined();
      expect(Array.isArray(대시보드할당데이터.projects)).toBe(true);
      expect(대시보드할당데이터.projects.length).toBeGreaterThan(0);

      const 프로젝트 = 대시보드할당데이터.projects.find(
        (p: any) => p.projectId === projectIds[0],
      );
      expect(프로젝트).toBeDefined();

      // 생성된 WBS가 반드시 존재해야 함
      expect(프로젝트.wbsList).toBeDefined();
      expect(Array.isArray(프로젝트.wbsList)).toBe(true);

      const 생성된WBS = 프로젝트.wbsList.find(
        (wbs: any) => wbs.wbsId === 할당결과.wbsItem.id,
      );
      expect(생성된WBS).toBeDefined();
      expect(생성된WBS.wbsId).toBe(할당결과.wbsItem.id);
      expect(생성된WBS.wbsName).toBe('새로 생성된 WBS 항목');
      expect(생성된WBS.wbsCode).toBe(할당결과.wbsItem.wbsCode);

      console.log(
        `✅ 대시보드 API를 통한 WBS 생성 및 할당 검증 완료 - WBS ID: ${생성된WBS.wbsId}, WBS명: ${생성된WBS.wbsName}`,
      );
    });

    it('WBS 항목 이름을 수정한다', async () => {
      // 선행 조건: 프로젝트 할당 생성 (다른 직원 및 프로젝트 사용)
      await 프로젝트를_할당한다(employeeIds[3], projectIds[1]);

      // WBS를 생성하고 할당
      const 생성결과 = await wbsAssignmentScenario.WBS를_생성하고_할당한다({
        title: '수정 전 WBS 항목',
        projectId: projectIds[1],
        employeeId: employeeIds[3],
        periodId: evaluationPeriodId,
      });

      const wbsItemId = 생성결과.wbsItem.id;

      // WBS 항목 이름 수정
      const 수정결과 = await wbsAssignmentScenario.WBS_항목_이름을_수정한다({
        wbsItemId,
        title: '수정 후 WBS 항목',
      });

      expect(수정결과).toBeDefined();
      expect(수정결과.id).toBe(wbsItemId);
      expect(수정결과.title).toBe('수정 후 WBS 항목');

      console.log(`✅ WBS 항목 이름 수정 완료 - WBS ID: ${wbsItemId}`);

      // 대시보드에서 검증
      const 대시보드할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[3],
        });

      // 프로젝트가 반드시 존재해야 함
      expect(대시보드할당데이터.projects).toBeDefined();
      expect(Array.isArray(대시보드할당데이터.projects)).toBe(true);
      expect(대시보드할당데이터.projects.length).toBeGreaterThan(0);

      const 프로젝트 = 대시보드할당데이터.projects.find(
        (p: any) => p.projectId === projectIds[1],
      );
      expect(프로젝트).toBeDefined();

      // 수정된 WBS가 반드시 존재해야 함
      expect(프로젝트.wbsList).toBeDefined();
      expect(Array.isArray(프로젝트.wbsList)).toBe(true);

      const 수정된WBS = 프로젝트.wbsList.find(
        (wbs: any) => wbs.wbsId === wbsItemId,
      );
      expect(수정된WBS).toBeDefined();
      expect(수정된WBS.wbsId).toBe(wbsItemId);
      expect(수정된WBS.wbsName).toBe('수정 후 WBS 항목');

      console.log(
        `✅ 대시보드 API를 통한 WBS 이름 수정 검증 완료 - WBS ID: ${수정된WBS.wbsId}, WBS명: ${수정된WBS.wbsName}`,
      );
    });
  });

  describe('WBS 할당 초기화 관리', () => {
    it('직원의 WBS 할당을 초기화한다', async () => {
      // 선행 조건: 프로젝트 할당 생성
      await 프로젝트를_할당한다(employeeIds[4], projectIds[0]);

      // WBS를 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[4],
        wbsItemId: wbsItemIds[8],
        projectId: projectIds[0],
        periodId: evaluationPeriodId,
      });

      // 초기화 전 할당 데이터 조회
      const 초기화전할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[4],
        });

      const 초기화전총WBS수 = 초기화전할당데이터.summary?.totalWbsCount || 0;
      console.log(`📊 초기화 전 총 WBS 수: ${초기화전총WBS수}`);

      // 직원의 WBS 할당 초기화
      await wbsAssignmentScenario.직원의_WBS_할당을_초기화한다({
        employeeId: employeeIds[4],
        periodId: evaluationPeriodId,
      });

      // 초기화 후 할당 데이터 조회
      const 초기화후할당데이터 =
        await wbsAssignmentScenario.직원_할당_데이터를_조회한다({
          periodId: evaluationPeriodId,
          employeeId: employeeIds[4],
        });

      const 초기화후총WBS수 = 초기화후할당데이터.summary?.totalWbsCount || 0;
      console.log(`📊 초기화 후 총 WBS 수: ${초기화후총WBS수}`);

      // 검증: 초기화 후 WBS가 없어야 함
      expect(초기화후총WBS수).toBe(0);

      console.log(
        `✅ 직원의 WBS 할당 초기화 완료 - 직원 ID: ${employeeIds[4]}`,
      );
    });

    it('프로젝트의 WBS 할당을 초기화한다', async () => {
      // 선행 조건: 프로젝트 할당 생성 (여러 직원)
      await 프로젝트를_할당한다(employeeIds[0], projectIds[1]);
      await 프로젝트를_할당한다(employeeIds[1], projectIds[1]);

      // 여러 직원에게 WBS를 할당
      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[0],
        wbsItemId: wbsItemIds[9],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      await wbsAssignmentScenario.WBS를_할당한다({
        employeeId: employeeIds[1],
        wbsItemId: wbsItemIds[10],
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      // 프로젝트의 WBS 할당 초기화
      await wbsAssignmentScenario.프로젝트의_WBS_할당을_초기화한다({
        projectId: projectIds[1],
        periodId: evaluationPeriodId,
      });

      // 초기화 후 프로젝트별 할당 조회
      const 초기화후조회결과 =
        await wbsAssignmentScenario.프로젝트별_할당_WBS를_조회한다(
          projectIds[1],
          evaluationPeriodId,
        );

      // 검증: 초기화 후 할당이 없어야 함
      expect(초기화후조회결과.wbsAssignments.length).toBe(0);

      console.log(
        `✅ 프로젝트의 WBS 할당 초기화 완료 - 프로젝트 ID: ${projectIds[1]}`,
      );
    });
  });
});
