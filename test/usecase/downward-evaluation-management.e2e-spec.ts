import { In } from 'typeorm';
import { BaseE2ETest } from '../base-e2e.spec';
import { SeedDataScenario } from './scenarios/seed-data.scenario';
import { EvaluationPeriodScenario } from './scenarios/evaluation-period.scenario';
import { DownwardEvaluationScenario } from './scenarios/downward-evaluation';

/**
 * 하향평가 관리 시나리오 E2E 테스트
 *
 * 1차/2차 하향평가의 전체 프로세스를 테스트합니다.
 * HTTP 엔드포인트만을 사용하여 실제 사용자 워크플로우를 검증합니다.
 */
describe('하향평가 관리 시나리오', () => {
  let testSuite: BaseE2ETest;
  let seedDataScenario: SeedDataScenario;
  let evaluationPeriodScenario: EvaluationPeriodScenario;
  let downwardEvaluationScenario: DownwardEvaluationScenario;

  let evaluationPeriodId: string;
  let employeeIds: string[];
  let wbsItemIds: string[];
  let projectIds: string[];
  let evaluatorId: string;
  let evaluateeId: string;
  let usedEmployeeIds: string[] = []; // 테스트에서 사용된 직원 ID 추적

  beforeAll(async () => {
    testSuite = new BaseE2ETest();
    await testSuite.initializeApp();

    // 시나리오 인스턴스 생성
    seedDataScenario = new SeedDataScenario(testSuite);
    evaluationPeriodScenario = new EvaluationPeriodScenario(testSuite);
    downwardEvaluationScenario = new DownwardEvaluationScenario(testSuite);

    // 1. MINIMAL 시나리오로 시드 데이터 생성 (프로젝트/WBS/직원만, 평가기간 제외)
    // 조직도 구조를 위해 부서 1개에 직원 5명 설정 (1명 부서장 + 4명 팀원)
    const { seedResponse } = await seedDataScenario.시드_데이터를_생성한다({
      scenario: 'minimal',
      clearExisting: true,
      projectCount: 2,
      wbsPerProject: 3,
      departmentCount: 1, // 한 부서에 모든 직원 배치
      employeeCount: 5, // 부서장 1명 + 팀원 4명
      useRealDepartments: false,
      useRealEmployees: false,
    });

    employeeIds = seedResponse.results[0].generatedIds?.employeeIds || [];
    projectIds = seedResponse.results[0].generatedIds?.projectIds || [];

    // WBS 항목은 데이터베이스에서 직접 조회
    const wbsItems = await testSuite.getRepository('WbsItem').find({
      where: { projectId: projectIds[0] },
      take: 3,
    });
    wbsItemIds = wbsItems.map((wbs) => wbs.id);

    console.log(
      `✅ MINIMAL 시드 데이터 생성 완료 - 부서: 1개, 직원: ${employeeIds.length}명, 프로젝트: ${projectIds.length}개, WBS: ${wbsItemIds.length}개`,
    );

    // 2. 평가기간 생성 API 엔드포인트 사용 (자동으로 평가 대상자 등록 및 1차 평가자 할당)
    console.log('📝 평가기간 생성 API 호출 (자동 평가라인 생성)...');
    const createPeriodResponse = await testSuite
      .request()
      .post('/admin/evaluation-periods')
      .send({
        name: '하향평가 테스트용 평가기간',
        startDate: '2024-01-01',
        peerEvaluationDeadline: '2024-12-31',
        description: '하향평가 E2E 테스트를 위한 평가기간',
        maxSelfEvaluationRate: 120,
        gradeRanges: [
          { grade: 'S', minRange: 95, maxRange: 100 },
          { grade: 'A', minRange: 85, maxRange: 94 },
          { grade: 'B', minRange: 70, maxRange: 84 },
          { grade: 'C', minRange: 60, maxRange: 69 },
        ],
      })
      .expect(201);

    evaluationPeriodId = createPeriodResponse.body.id;

    console.log(
      `✅ 평가기간 생성 완료 - ID: ${evaluationPeriodId} (자동으로 평가 대상자 및 1차 평가자 할당됨)`,
    );

    // 3. 직원들의 managerId 및 평가라인 매핑 확인
    const employees = await testSuite.getRepository('Employee').find({
      where: { id: In(employeeIds) },
      select: ['id', 'name', 'managerId', 'departmentId'],
    });

    // 4. 평가자와 피평가자 설정
    // managerId가 null인 직원이 부서장(1차 평가자)
    // managerId가 있는 직원이 팀원(피평가자)
    const departmentManagerEmployee = employees.find(
      (emp) => emp.managerId === null && emp.id !== employeeIds[0],
    );
    const teamMemberEmployee = employees.find(
      (emp) => emp.managerId === departmentManagerEmployee?.id,
    );

    if (!departmentManagerEmployee || !teamMemberEmployee) {
      throw new Error('부서장 또는 팀원을 찾을 수 없습니다.');
    }

    evaluatorId = departmentManagerEmployee.id; // 부서장 (1차 평가자)
    evaluateeId = teamMemberEmployee.id; // 팀원 (피평가자)

    console.log('📊 생성된 직원 목록:');
    employees.forEach((emp, index) => {
      console.log(
        `  [${index + 1}] ${emp.name} (${emp.id}) - managerId: ${emp.managerId}, deptId: ${emp.departmentId}`,
      );
    });

    // 5. 평가 대상자 매핑 확인 (평가기간 생성 시 자동 등록)
    const evaluationTargets = await testSuite
      .getRepository('EvaluationPeriodEmployeeMapping')
      .count({
        where: { evaluationPeriodId },
      });

    console.log(`📊 평가 대상자: ${evaluationTargets}명 (자동 등록됨)`);

    console.log(
      `✅ 조직도 구조 - 부서장(평가자): ${evaluatorId}, 팀원(피평가자): ${evaluateeId}`,
    );
  });

  afterAll(async () => {
    // 테스트 후 정리 - 생성된 평가기간 삭제
    try {
      await evaluationPeriodScenario.평가기간을_삭제한다(evaluationPeriodId);
    } catch (error) {
      console.log(
        `평가기간 삭제 실패 (이미 삭제되었을 수 있음): ${evaluationPeriodId}`,
      );
    }
    // 시드 데이터 정리
    await seedDataScenario.시드_데이터를_삭제한다();

    await testSuite.closeApp();
  });

  it('하향평가 관리 전체 시나리오를 실행한다', async () => {
    const result =
      await downwardEvaluationScenario.하향평가_관리_전체_시나리오를_실행한다({
        evaluationPeriodId,
        employeeIds,
        projectIds,
        wbsItemIds,
        evaluatorId,
        evaluateeId,
      });

    // 1차 하향평가 검증
    expect(result.일차하향평가결과.WBS할당결과.mappingCount).toBeGreaterThan(0);
    expect(result.일차하향평가결과.WBS할당결과.primaryEvaluatorId).toBe(
      evaluatorId,
    );
    expect(result.일차하향평가결과.자기평가결과.selfEvaluationId).toBeDefined();
    expect(result.일차하향평가결과.하향평가저장.id).toBeDefined();
    expect(result.일차하향평가결과.하향평가제출.isSubmitted).toBe(true);

    // 2차 하향평가 검증
    if (result.이차하향평가결과.WBS할당결과) {
      expect(result.이차하향평가결과.WBS할당결과.mappingCount).toBeGreaterThan(
        0,
      );
    }
    if (result.이차하향평가결과.자기평가결과) {
      expect(
        result.이차하향평가결과.자기평가결과.selfEvaluationId,
      ).toBeDefined();
    }
    // 2차 평가자가 없는 경우 id가 null일 수 있음
    if (result.이차하향평가결과.하향평가저장.id) {
      expect(result.이차하향평가결과.하향평가저장.id).toBeDefined();
      expect(result.이차하향평가결과.하향평가제출.isSubmitted).toBe(true);
    } else {
      console.log('⚠️ 2차 평가자가 없어 2차 하향평가를 건너뛰었습니다.');
    }

    // 평가자별 목록 조회 검증
    expect(result.평가자별목록조회.evaluatorId).toBe(evaluatorId);
    expect(result.평가자별목록조회.periodId).toBe(evaluationPeriodId);
    expect(Array.isArray(result.평가자별목록조회.evaluations)).toBe(true);

    // 피평가자별 목록 조회 검증
    expect(result.피평가자별목록조회.evaluateeId).toBe(evaluateeId);
    expect(result.피평가자별목록조회.periodId).toBe(evaluationPeriodId);
    expect(Array.isArray(result.피평가자별목록조회.evaluations)).toBe(true);
    expect(result.피평가자별목록조회.evaluations.length).toBeGreaterThanOrEqual(
      1,
    );

    // 1차 평가자 타입 필터링 검증
    expect(result.일차필터링조회.evaluatorId).toBe(evaluatorId);
    result.일차필터링조회.evaluations.forEach((evaluation: any) => {
      expect(evaluation.evaluationType).toBe('primary');
    });

    // 2차 평가자 타입 필터링 검증
    result.이차필터링조회.evaluations.forEach((evaluation: any) => {
      expect(evaluation.evaluationType).toBe('secondary');
    });

    console.log(
      `✅ 하향평가 관리 전체 시나리오 완료 - 1차: ${result.일차하향평가결과.하향평가저장.id}, 2차: ${result.이차하향평가결과.하향평가저장.id}`,
    );

    // 사용된 직원 ID 추적
    usedEmployeeIds.push(evaluateeId);
  });

  it('1차 하향평가 저장 시나리오를 실행한다 (다른 피평가자)', async () => {
    const result =
      await downwardEvaluationScenario.다른_피평가자로_일차하향평가_저장_시나리오를_실행한다(
        {
          evaluationPeriodId,
          employeeIds,
          wbsItemIds,
          projectIds,
          evaluatorId,
          excludeEmployeeIds: [evaluateeId, evaluatorId, ...usedEmployeeIds],
        },
      );

    if (result.저장결과) {
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBe(evaluatorId);
      expect(result.저장결과.message).toBeDefined();
      // 사용된 직원 추가 (result에서 피평가자 ID를 찾을 수 없으므로 모든 employeeIds를 확인해야 함)
    }
  });

  it('2차 하향평가 저장 시나리오를 실행한다 (다른 피평가자)', async () => {
    const result =
      await downwardEvaluationScenario.다른_피평가자로_이차하향평가_저장_시나리오를_실행한다(
        {
          evaluationPeriodId,
          employeeIds,
          wbsItemIds,
          projectIds,
          excludeEmployeeIds: [evaluateeId, evaluatorId, ...usedEmployeeIds],
        },
      );

    if (result.저장결과) {
      expect(result.저장결과.id).toBeDefined();
      expect(result.저장결과.evaluatorId).toBeDefined();
      expect(result.저장결과.message).toBeDefined();
      // 사용된 직원 ID 추적 - 2차 하향평가에서 사용된 피평가자
      if (result.저장결과.evaluateeId) {
        usedEmployeeIds.push(result.저장결과.evaluateeId);
      }
    }
  });

  it('1차/2차 하향평가 작성 후 대시보드에서 primary/secondary가 반환된다', async () => {
    const result =
      await downwardEvaluationScenario.대시보드_검증_포함_하향평가_시나리오를_실행한다(
        {
          evaluationPeriodId,
          employeeIds,
          wbsItemIds,
          projectIds,
          evaluatorId,
          excludeEmployeeIds: [evaluateeId, evaluatorId, ...usedEmployeeIds],
        },
      );

    // 검증
    expect(result.하향평가결과.WBS할당결과.mappingCount).toBeGreaterThan(0);
    expect(result.하향평가결과.자기평가결과.selfEvaluationId).toBeDefined();
    expect(result.하향평가결과.일차하향평가저장.id).toBeDefined();
    expect(result.하향평가결과.일차하향평가제출.isSubmitted).toBe(true);
    expect(
      result.하향평가결과.대시보드검증결과.대시보드검증결과.primary하향평가,
    ).toBeDefined();
    expect(
      result.하향평가결과.대시보드검증결과.대시보드검증결과.primary하향평가
        .assignedWbsCount,
    ).toBeGreaterThan(0);

    // 2차 하향평가가 있는 경우 검증
    if (result.하향평가결과.이차하향평가저장) {
      expect(result.하향평가결과.이차하향평가저장.id).toBeDefined();
      expect(result.하향평가결과.이차하향평가제출.isSubmitted).toBe(true);
      expect(
        result.하향평가결과.대시보드검증결과.대시보드검증결과.secondary하향평가,
      ).toBeDefined();
    }
  });
});
