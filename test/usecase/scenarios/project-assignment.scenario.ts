import { BaseE2ETest } from '../../base-e2e.spec';

/**
 * 프로젝트 할당 시나리오
 *
 * 프로젝트 할당 및 대시보드 검증 관련 테스트 시나리오를 제공합니다.
 */
export class ProjectAssignmentScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * 프로젝트를 대량으로 할당합니다.
   */
  async 프로젝트를_대량으로_할당한다(
    periodId: string,
    projectIds: string[],
    employeeIds: string[],
  ): Promise<any[]> {
    const assignments = employeeIds.flatMap((employeeId) =>
      projectIds.map((projectId) => ({
        employeeId,
        projectId,
        periodId,
      })),
    );

    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/project-assignments/bulk')
      .send({ assignments })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(assignments.length);

    console.log(
      `✅ 프로젝트 대량 할당 완료: ${employeeIds.length}명 × ${projectIds.length}개 = ${response.body.length}건`,
    );

    return response.body;
  }

  /**
   * 직원의 할당 데이터를 조회합니다 (프로젝트, WBS 등).
   */
  async 직원_할당_데이터를_조회한다(
    periodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/employees/${employeeId}/assigned-data`)
      .expect(200);

    expect(response.body.evaluationPeriod).toBeDefined();
    expect(response.body.evaluationPeriod.id).toBe(periodId);
    expect(response.body.employee).toBeDefined();
    expect(response.body.employee.id).toBe(employeeId);
    expect(response.body.projects).toBeDefined();
    expect(Array.isArray(response.body.projects)).toBe(true);
    expect(response.body.summary).toBeDefined();

    return response.body;
  }

  /**
   * 프로젝트 할당 목록을 조회합니다.
   */
  async 프로젝트_할당_목록을_조회한다(
    periodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/project-assignments')
      .query({ periodId, employeeId })
      .expect(200);

    expect(response.body.assignments).toBeDefined();
    expect(Array.isArray(response.body.assignments)).toBe(true);

    return response.body;
  }

  /**
   * 프로젝트 할당을 취소합니다.
   */
  async 프로젝트_할당을_취소한다(assignmentId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/project-assignments/${assignmentId}`)
      .expect(200);

    console.log(`✅ 프로젝트 할당 취소 완료: ${assignmentId}`);
  }

  /**
   * 프로젝트 할당 순서를 변경합니다.
   */
  async 프로젝트_할당_순서를_변경한다(
    assignmentId: string,
    direction: 'up' | 'down',
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .patch(
        `/admin/evaluation-criteria/project-assignments/${assignmentId}/order`,
      )
      .query({ direction })
      .expect(200);

    expect(response.body.id).toBe(assignmentId);
    expect(response.body.displayOrder).toBeDefined();

    console.log(
      `✅ 프로젝트 할당 순서 변경 완료: ${assignmentId} (${direction})`,
    );

    return response.body;
  }

  /**
   * 프로젝트 할당 후 대시보드에서 검증하는 시나리오를 실행합니다.
   */
  async 프로젝트_할당_후_대시보드_검증_시나리오를_실행한다(
    periodId: string,
    employeeIds: string[],
    projectIds: string[],
  ): Promise<{
    totalAssignments: number;
    verifiedEmployees: number;
  }> {
    console.log('\n📝 프로젝트 할당 후 대시보드 검증 시나리오');

    // 1. 프로젝트 대량 할당
    const assignments = await this.프로젝트를_대량으로_할당한다(
      periodId,
      projectIds,
      employeeIds,
    );

    // 2. 각 직원별로 할당 데이터 검증
    console.log(`📝 ${employeeIds.length}명의 직원 할당 데이터 검증 시작`);

    for (const employeeId of employeeIds) {
      const assignedData = await this.직원_할당_데이터를_조회한다(
        periodId,
        employeeId,
      );

      // 프로젝트 배정 확인
      expect(assignedData.projects.length).toBe(projectIds.length);

      // 각 프로젝트 정보 검증
      assignedData.projects.forEach((project: any) => {
        expect(project.projectId).toBeDefined();
        expect(project.projectName).toBeDefined();
        expect(project.projectCode).toBeDefined();
        expect(project.assignedAt).toBeDefined();
        expect(project.wbsList).toBeDefined();
        expect(Array.isArray(project.wbsList)).toBe(true);

        // 할당한 프로젝트 ID에 포함되는지 확인
        expect(projectIds).toContain(project.projectId);
      });

      // summary 검증
      expect(assignedData.summary.totalProjects).toBe(projectIds.length);

      console.log(
        `  ✅ ${assignedData.employee.name}: ${assignedData.projects.length}개 프로젝트 배정 확인`,
      );
    }

    console.log('✅ 모든 직원의 프로젝트 할당 데이터 검증 완료');

    return {
      totalAssignments: assignments.length,
      verifiedEmployees: employeeIds.length,
    };
  }

  /**
   * 프로젝트 할당 취소 시나리오를 실행합니다.
   */
  async 프로젝트_할당_취소_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
  ): Promise<{
    assignmentId: string;
    projectCountBefore: number;
    projectCountAfter: number;
  }> {
    console.log('\n📝 프로젝트 할당 취소 시나리오');

    // 1. 할당 전 상태 조회
    const assignmentsBefore = await this.프로젝트_할당_목록을_조회한다(
      periodId,
      employeeId,
    );
    const assignmentCountBefore = assignmentsBefore.assignments.length;

    expect(assignmentCountBefore).toBeGreaterThan(0);
    console.log(`📊 할당 취소 전 프로젝트 수: ${assignmentCountBefore}개`);

    // 2. 첫 번째 할당 취소
    const firstAssignment = assignmentsBefore.assignments[0];
    const assignmentId = firstAssignment.id;

    await this.프로젝트_할당을_취소한다(assignmentId);

    // 3. 할당 후 상태 조회
    const assignmentsAfter = await this.프로젝트_할당_목록을_조회한다(
      periodId,
      employeeId,
    );
    const assignmentCountAfter = assignmentsAfter.assignments.length;

    expect(assignmentCountAfter).toBe(assignmentCountBefore - 1);
    console.log(
      `✅ 프로젝트 할당 취소 확인: ${assignmentCountBefore}개 → ${assignmentCountAfter}개`,
    );

    // 4. 대시보드에서도 확인
    const dashboardData = await this.직원_할당_데이터를_조회한다(
      periodId,
      employeeId,
    );

    expect(dashboardData.projects.length).toBe(assignmentCountAfter);
    expect(dashboardData.summary.totalProjects).toBe(assignmentCountAfter);
    console.log('✅ 대시보드에서 프로젝트 수 감소 확인');

    return {
      assignmentId,
      projectCountBefore: assignmentCountBefore,
      projectCountAfter: assignmentCountAfter,
    };
  }

  /**
   * 프로젝트 할당 순서 변경 시나리오를 실행합니다.
   */
  async 프로젝트_할당_순서_변경_시나리오를_실행한다(
    periodId: string,
    employeeId: string,
  ): Promise<{
    assignmentId: string;
    orderBefore: number;
    orderAfterDown: number;
    orderAfterUp: number;
  }> {
    console.log('\n📝 프로젝트 할당 순서 변경 시나리오');

    // 1. 할당 목록 조회 (최소 2개 이상 있어야 함)
    const assignments = await this.프로젝트_할당_목록을_조회한다(
      periodId,
      employeeId,
    );

    expect(assignments.assignments.length).toBeGreaterThanOrEqual(2);
    console.log(
      `📊 현재 할당된 프로젝트 수: ${assignments.assignments.length}개`,
    );

    // 2. 첫 번째 항목 선택 (displayOrder가 가장 작은 항목)
    const sortedAssignments = assignments.assignments.sort(
      (a: any, b: any) => a.displayOrder - b.displayOrder,
    );
    const firstAssignment = sortedAssignments[0];
    const assignmentId = firstAssignment.id;
    const orderBefore = firstAssignment.displayOrder;

    console.log(
      `📝 순서 변경 대상: ${firstAssignment.projectName || '프로젝트'} (순서: ${orderBefore})`,
    );

    // 3. 아래로 이동 (down)
    const afterDown = await this.프로젝트_할당_순서를_변경한다(
      assignmentId,
      'down',
    );
    const orderAfterDown = afterDown.displayOrder;

    expect(orderAfterDown).toBeGreaterThan(orderBefore);
    console.log(`✅ 아래로 이동 확인: 순서 ${orderBefore} → ${orderAfterDown}`);

    // 4. 위로 이동 (up) - 원래 위치로 복귀
    const afterUp = await this.프로젝트_할당_순서를_변경한다(
      assignmentId,
      'up',
    );
    const orderAfterUp = afterUp.displayOrder;

    expect(orderAfterUp).toBe(orderBefore);
    console.log(`✅ 위로 이동 확인: 순서 ${orderAfterDown} → ${orderAfterUp}`);

    // 5. 대시보드에서 순서 확인
    const dashboardData = await this.직원_할당_데이터를_조회한다(
      periodId,
      employeeId,
    );

    // 프로젝트가 assignedAt 순서대로 정렬되어 있는지 확인
    const projects = dashboardData.projects;
    expect(projects.length).toBeGreaterThan(0);
    console.log('✅ 대시보드에서 프로젝트 순서 확인');

    return {
      assignmentId,
      orderBefore,
      orderAfterDown,
      orderAfterUp,
    };
  }
}
