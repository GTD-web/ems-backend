import { BaseE2ETest } from '../../../base-e2e.spec';

/**
 * WBS 할당 기본 시나리오 클래스
 * 
 * WBS 할당, 할당 취소, 순서 변경, 초기화 등의 기본 기능을 테스트합니다.
 */
export class WbsAssignmentBasicScenario {
  constructor(private readonly testSuite: BaseE2ETest) {}

  /**
   * WBS 할당을 생성합니다.
   */
  async WBS_할당을_생성한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    // 기존 할당 확인
    const existingAssignment = await this.testSuite.getRepository('EvaluationWbsAssignment').findOne({
      where: {
        employeeId,
        wbsItemId,
        projectId,
        periodId,
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      console.log(`⚠️ WBS 할당이 이미 존재합니다: ${existingAssignment.id}`);
      // 기존 할당이어도 평가라인 구성이 필요할 수 있으므로 할당 객체 반환
      return existingAssignment;
    }

    try {
      const response = await this.testSuite
        .request()
        .post('/admin/evaluation-criteria/wbs-assignments')
        .send({
          employeeId,
          wbsItemId,
          projectId,
          periodId,
        });

      if (response.status === 201) {
        return response.body;
      } else if (response.status === 409) {
        console.log(`⚠️ WBS 할당 충돌 - 기존 할당을 조회합니다`);
        const existingAssignment = await this.testSuite.getRepository('EvaluationWbsAssignment').findOne({
          where: {
            employeeId,
            wbsItemId,
            projectId,
            periodId,
            deletedAt: null,
          },
        });
        if (existingAssignment) {
          return existingAssignment;
        }
      }
      
      throw new Error(`Unexpected response status: ${response.status}`);
    } catch (error) {
      if (error.response?.status === 409) {
        console.log(`⚠️ WBS 할당 충돌 - 기존 할당을 조회합니다`);
        const existingAssignment = await this.testSuite.getRepository('EvaluationWbsAssignment').findOne({
          where: {
            employeeId,
            wbsItemId,
            projectId,
            periodId,
            deletedAt: null,
          },
        });
        if (existingAssignment) {
          return existingAssignment;
        }
      }
      throw error;
    }
  }

  /**
   * WBS 대량 할당을 생성합니다.
   */
  async WBS_대량_할당을_생성한다(
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
    }>,
  ): Promise<any[]> {
    const response = await this.testSuite
      .request()
      .post('/admin/evaluation-criteria/wbs-assignments/bulk')
      .send({ assignments })
      .expect(201);

    return response.body;
  }

  /**
   * WBS 할당을 취소합니다.
   */
  async WBS_할당을_취소한다(assignmentId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}`)
      .expect(200);
  }

  /**
   * WBS 할당 순서를 변경합니다.
   */
  async WBS_할당_순서를_변경한다(
    assignmentId: string,
    direction: 'up' | 'down',
  ): Promise<void> {
    await this.testSuite
      .request()
      .patch(`/admin/evaluation-criteria/wbs-assignments/${assignmentId}/order`)
      .query({ direction })
      .expect(200);
  }

  /**
   * 직원의 WBS 할당을 초기화합니다.
   */
  async 직원의_WBS_할당을_초기화한다(
    employeeId: string,
    periodId: string,
  ): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId}`)
      .expect(200);
  }

  /**
   * 프로젝트의 WBS 할당을 초기화합니다.
   */
  async 프로젝트의_WBS_할당을_초기화한다(
    projectId: string,
    periodId: string,
  ): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/project/${projectId}/period/${periodId}`)
      .expect(200);
  }

  /**
   * 평가기간의 WBS 할당을 초기화합니다.
   */
  async 평가기간의_WBS_할당을_초기화한다(periodId: string): Promise<void> {
    await this.testSuite
      .request()
      .delete(`/admin/evaluation-criteria/wbs-assignments/period/${periodId}`)
      .expect(200);
  }

  /**
   * 직원의 WBS 할당 목록을 조회합니다.
   */
  async 직원의_WBS_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/wbs-assignments/employee/${employeeId}/period/${periodId}`)
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트의 WBS 할당 목록을 조회합니다.
   */
  async 프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/evaluation-criteria/wbs-assignments/project/${projectId}/period/${periodId}`)
      .expect(200);

    return response.body;
  }

  /**
   * WBS 할당 목록을 조회합니다.
   */
  async WBS_할당_목록을_조회한다(filters: {
    periodId?: string;
    employeeId?: string;
    projectId?: string;
    wbsItemId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  } = {}): Promise<any> {
    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments')
      .query(filters)
      .expect(200);

    return response.body;
  }

  /**
   * 할당되지 않은 WBS 항목을 조회합니다.
   */
  async 할당되지_않은_WBS_항목을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<any> {
    const query: any = { projectId, periodId };
    if (employeeId) {
      query.employeeId = employeeId;
    }

    const response = await this.testSuite
      .request()
      .get('/admin/evaluation-criteria/wbs-assignments/unassigned')
      .query(query)
      .expect(200);

    return response.body;
  }

  /**
   * 직원의 할당 데이터를 대시보드에서 조회합니다.
   */
  async 직원_할당_데이터를_조회한다(
    periodId: string,
    employeeId: string,
  ): Promise<any> {
    const response = await this.testSuite
      .request()
      .get(`/admin/dashboard/${periodId}/employees/${employeeId}/assigned-data`)
      .expect(200);

    return response.body;
  }

  /**
   * 프로젝트를 대량으로 할당합니다.
   */
  async 프로젝트를_대량으로_할당한다(
    periodId: string,
    projectIds: string[],
    employeeIds: string[],
  ): Promise<any[]> {
    const assignments: any[] = [];
    for (const employeeId of employeeIds) {
      for (const projectId of projectIds) {
        // 기존 프로젝트 할당 확인
        const existingAssignments = await this.testSuite.getRepository('EvaluationProjectAssignment').find({
          where: {
            periodId,
            employeeId,
            projectId,
            deletedAt: null,
          },
        });

        if (existingAssignments.length > 0) {
          console.log(`📝 프로젝트 할당 이미 존재: employeeId=${employeeId}, projectId=${projectId}`);
          assignments.push(...existingAssignments);
          continue;
        }

        console.log(`📝 프로젝트 할당 생성 요청: employeeId=${employeeId}, projectId=${projectId}, periodId=${periodId}`);
        
        try {
          const response = await this.testSuite
            .request()
            .post('/admin/evaluation-criteria/project-assignments/bulk')
            .send({
              assignments: [{
                employeeId,
                projectId,
                periodId,
              }],
            })
            .expect(201);
          assignments.push(...response.body);
          console.log(`✅ 프로젝트 할당 생성 성공: ${response.body.length}개`);
        } catch (error) {
          console.error(`❌ 프로젝트 할당 생성 실패:`, error.response?.body || error.message);
          // 422 오류의 경우 기존 할당을 사용
          if (error.response?.status === 422) {
            console.log(`⚠️ 프로젝트 할당이 이미 존재하여 기존 할당을 사용합니다`);
            assignments.push(...existingAssignments);
          } else {
            throw error;
          }
        }
      }
    }
    return assignments;
  }
}
