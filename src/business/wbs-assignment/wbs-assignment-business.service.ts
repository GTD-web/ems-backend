import { Injectable, Logger } from '@nestjs/common';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { EmployeeService } from '@domain/common/employee/employee.service';
import { ProjectService } from '@domain/common/project/project.service';
import type {
  CreateEvaluationWbsAssignmentData,
  OrderDirection,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

/**
 * WBS 할당 비즈니스 서비스
 *
 * WBS 할당 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 여러 컨텍스트 서비스 조율
 * - 알림 서비스 연동 (추후)
 * - 복합 비즈니스 로직 처리
 */
@Injectable()
export class WbsAssignmentBusinessService {
  private readonly logger = new Logger(WbsAssignmentBusinessService.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly employeeService: EmployeeService,
    private readonly projectService: ProjectService,
    // private readonly notificationService: NotificationService, // TODO: 알림 서비스 추가 시 주입
    // private readonly organizationManagementService: OrganizationManagementService, // TODO: 조직 관리 서비스 추가 시 주입
  ) {}

  /**
   * WBS를 할당하고 관련 알림을 발송한다
   */
  async WBS를_할당한다(params: {
    employeeId: string;
    wbsItemId: string;
    projectId: string;
    periodId: string;
    assignedBy: string;
  }): Promise<any> {
    this.logger.log('WBS 할당 비즈니스 로직 시작', {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
    });

    // 1. WBS 할당 생성 (컨텍스트 호출)
    const data: CreateEvaluationWbsAssignmentData = {
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
      periodId: params.periodId,
      assignedBy: params.assignedBy,
    };

    const assignment =
      await this.evaluationCriteriaManagementService.WBS를_할당한다(
        data,
        params.assignedBy,
      );

    // 2. WBS 평가기준 자동 생성 (없는 경우)
    const existingCriteria =
      await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
        params.wbsItemId,
      );

    if (!existingCriteria || existingCriteria.length === 0) {
      this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
        wbsItemId: params.wbsItemId,
      });

      await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다(
        {
          wbsItemId: params.wbsItemId,
          criteria: '', // 빈 평가기준으로 생성
          importance: 5, // 기본 중요도
        },
        params.assignedBy,
      );
    }

    // 3. 평가라인 자동 구성
    await this.평가라인을_자동으로_구성한다(
      params.employeeId,
      params.wbsItemId,
      params.projectId,
      params.periodId,
      params.assignedBy,
    );

    // 4. 알림 발송 (추후 구현)
    // TODO: WBS 할당 알림 발송
    // await this.notificationService.send({
    //   type: 'WBS_ASSIGNED',
    //   recipientId: params.employeeId,
    //   data: {
    //     wbsItemId: params.wbsItemId,
    //     projectId: params.projectId,
    //     periodId: params.periodId,
    //   },
    // });

    this.logger.log('WBS 할당, 평가기준 생성, 평가라인 구성 완료', {
      assignmentId: assignment.id,
    });

    return assignment;
  }

  /**
   * WBS 할당을 취소하고 관련 평가기준을 정리한다
   *
   * 비즈니스 규칙:
   * - 마지막 할당 취소 시 해당 WBS의 평가기준도 자동 삭제
   *
   * 참고:
   * - 컨텍스트 레벨에서 멱등성 보장 (할당이 없어도 성공 처리)
   * - 비즈니스 서비스는 평가기준 정리만 수행하므로, 할당이 없으면 조기 반환
   */
  async WBS_할당을_취소한다(params: {
    assignmentId: string;
    cancelledBy: string;
  }): Promise<void> {
    this.logger.log('WBS 할당 취소 비즈니스 로직 시작', {
      assignmentId: params.assignmentId,
    });

    // 1. 할당 정보 조회 (평가기준 정리를 위해 wbsItemId와 periodId 필요)
    // 목록 조회를 통해 assignmentId로 할당을 찾습니다
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        {},
        1,
        10000,
      );

    const assignment = allAssignments.assignments.find(
      (a) => a.id === params.assignmentId,
    );

    // 할당이 없으면 평가기준 정리할 것이 없으므로 조기 반환
    // (컨텍스트에서 취소는 이미 멱등성을 보장함)
    if (!assignment) {
      this.logger.log(
        'WBS 할당을 찾을 수 없습니다. 평가기준 정리를 생략합니다.',
        {
          assignmentId: params.assignmentId,
        },
      );
      return;
    }

    const wbsItemId = assignment.wbsItemId;
    const periodId = assignment.periodId;

    // 2. WBS 할당 취소 (컨텍스트 호출 - 멱등성 보장됨)
    await this.evaluationCriteriaManagementService.WBS_할당을_취소한다(
      params.assignmentId,
      params.cancelledBy,
    );

    // 3. 해당 WBS 항목에 다른 할당이 있는지 확인
    const remainingAssignments =
      await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
        wbsItemId,
        periodId,
      );

    // 4. 마지막 할당이었다면 평가기준 삭제
    if (!remainingAssignments || remainingAssignments.length === 0) {
      this.logger.log('마지막 WBS 할당이 취소되어 평가기준을 삭제합니다', {
        wbsItemId,
      });

      await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
        wbsItemId,
        params.cancelledBy,
      );
    }

    // 5. 알림 발송 (추후 구현)
    // TODO: WBS 할당 취소 알림 발송
    // await this.notificationService.send({
    //   type: 'WBS_ASSIGNMENT_CANCELLED',
    //   recipientId: assignment.employeeId,
    //   data: {
    //     assignmentId: params.assignmentId,
    //   },
    // });

    this.logger.log('WBS 할당 취소 및 평가기준 정리 완료', {
      assignmentId: params.assignmentId,
      criteriaDeleted:
        !remainingAssignments || remainingAssignments.length === 0,
    });
  }

  /**
   * WBS를 대량으로 할당하고 관련 알림을 발송한다
   */
  async WBS를_대량으로_할당한다(params: {
    assignments: Array<{
      employeeId: string;
      wbsItemId: string;
      projectId: string;
      periodId: string;
      assignedBy: string;
    }>;
    assignedBy: string;
  }): Promise<any[]> {
    this.logger.log('WBS 대량 할당 비즈니스 로직 시작', {
      count: params.assignments.length,
    });

    // 1. WBS 대량 할당 (컨텍스트 호출)
    const assignmentsData: CreateEvaluationWbsAssignmentData[] =
      params.assignments.map((assignment) => ({
        employeeId: assignment.employeeId,
        wbsItemId: assignment.wbsItemId,
        projectId: assignment.projectId,
        periodId: assignment.periodId,
        assignedBy: params.assignedBy,
      }));

    const assignments =
      await this.evaluationCriteriaManagementService.WBS를_대량으로_할당한다(
        assignmentsData,
        params.assignedBy,
      );

    // 2. 각 WBS 항목에 대해 평가기준 자동 생성 (없는 경우)
    const uniqueWbsItemIds = [
      ...new Set(params.assignments.map((a) => a.wbsItemId)),
    ];

    await Promise.all(
      uniqueWbsItemIds.map(async (wbsItemId) => {
        const existingCriteria =
          await this.evaluationCriteriaManagementService.특정_WBS항목의_평가기준을_조회한다(
            wbsItemId,
          );

        if (!existingCriteria || existingCriteria.length === 0) {
          this.logger.log('WBS 평가기준이 없어 빈 기준을 생성합니다', {
            wbsItemId,
          });

          await this.evaluationCriteriaManagementService.WBS_평가기준을_생성한다(
            {
              wbsItemId,
              criteria: '', // 빈 평가기준으로 생성
              importance: 5, // 기본 중요도
            },
            params.assignedBy,
          );
        }
      }),
    );

    // 3. 각 할당에 대해 평가라인 자동 구성
    await Promise.all(
      params.assignments.map(async (assignment) => {
        await this.평가라인을_자동으로_구성한다(
          assignment.employeeId,
          assignment.wbsItemId,
          assignment.projectId,
          assignment.periodId,
          params.assignedBy,
        );
      }),
    );

    // 4. 각 직원에게 알림 발송 (추후 구현)
    // TODO: 대량 할당 알림 발송
    // const uniqueEmployeeIds = [
    //   ...new Set(params.assignments.map((a) => a.employeeId)),
    // ];
    // await Promise.all(
    //   uniqueEmployeeIds.map((employeeId) =>
    //     this.notificationService.send({
    //       type: 'WBS_BULK_ASSIGNED',
    //       recipientId: employeeId,
    //       data: {
    //         assignmentCount: assignments.filter(
    //           (a) => a.employeeId === employeeId,
    //         ).length,
    //       },
    //     }),
    //   ),
    // );

    this.logger.log('WBS 대량 할당, 평가기준 생성, 평가라인 구성 완료', {
      count: assignments.length,
    });

    return assignments;
  }

  /**
   * WBS 할당 순서를 변경한다
   */
  async WBS_할당_순서를_변경한다(params: {
    assignmentId: string;
    direction: OrderDirection;
    updatedBy: string;
  }): Promise<any> {
    this.logger.log('WBS 할당 순서 변경 비즈니스 로직 시작', {
      assignmentId: params.assignmentId,
      direction: params.direction,
    });

    // WBS 할당 순서 변경 (컨텍스트 호출)
    const assignment =
      await this.evaluationCriteriaManagementService.WBS_할당_순서를_변경한다(
        params.assignmentId,
        params.direction,
        params.updatedBy,
      );

    this.logger.log('WBS 할당 순서 변경 완료', {
      assignmentId: params.assignmentId,
    });

    return assignment;
  }

  /**
   * 평가기간의 WBS 할당을 초기화하고 관련 알림을 발송한다
   */
  async 평가기간의_WBS_할당을_초기화한다(params: {
    periodId: string;
    resetBy: string;
  }): Promise<void> {
    this.logger.log('평가기간 WBS 할당 초기화 비즈니스 로직 시작', {
      periodId: params.periodId,
    });

    // 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        { periodId: params.periodId },
        1,
        10000,
      );

    const affectedWbsItemIds = [
      ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
    ];

    // 2. 평가기간 WBS 할당 초기화 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.평가기간의_WBS_할당을_초기화한다(
      params.periodId,
      params.resetBy,
    );

    // 3. 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 삭제)
    await Promise.all(
      affectedWbsItemIds.map(async (wbsItemId) => {
        const remainingAssignments =
          await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
            wbsItemId,
            params.periodId,
          );

        if (!remainingAssignments || remainingAssignments.length === 0) {
          this.logger.log('고아 평가기준 삭제', { wbsItemId });
          await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
            wbsItemId,
            params.resetBy,
          );
        }
      }),
    );

    // 4. 관련 직원들에게 알림 발송 (추후 구현)
    // TODO: 평가기간 WBS 할당 초기화 알림 발송
    // const affectedEmployees = await this.getAffectedEmployees(params.periodId);
    // await Promise.all(
    //   affectedEmployees.map((employeeId) =>
    //     this.notificationService.send({
    //       type: 'PERIOD_WBS_ASSIGNMENTS_RESET',
    //       recipientId: employeeId,
    //       data: {
    //         periodId: params.periodId,
    //       },
    //     }),
    //   ),
    // );

    this.logger.log('평가기간 WBS 할당 초기화 및 평가기준 정리 완료', {
      periodId: params.periodId,
      cleanedWbsItems: affectedWbsItemIds.length,
    });
  }

  /**
   * 프로젝트의 WBS 할당을 초기화하고 관련 알림을 발송한다
   */
  async 프로젝트의_WBS_할당을_초기화한다(params: {
    projectId: string;
    periodId: string;
    resetBy: string;
  }): Promise<void> {
    this.logger.log('프로젝트 WBS 할당 초기화 비즈니스 로직 시작', {
      projectId: params.projectId,
      periodId: params.periodId,
    });

    // 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        { projectId: params.projectId, periodId: params.periodId },
        1,
        10000,
      );

    const affectedWbsItemIds = [
      ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
    ];

    // 2. 프로젝트 WBS 할당 초기화 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.프로젝트의_WBS_할당을_초기화한다(
      params.projectId,
      params.periodId,
      params.resetBy,
    );

    // 3. 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 삭제)
    await Promise.all(
      affectedWbsItemIds.map(async (wbsItemId) => {
        const remainingAssignments =
          await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
            wbsItemId,
            params.periodId,
          );

        if (!remainingAssignments || remainingAssignments.length === 0) {
          this.logger.log('고아 평가기준 삭제', { wbsItemId });
          await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
            wbsItemId,
            params.resetBy,
          );
        }
      }),
    );

    // 4. 관련 직원들에게 알림 발송 (추후 구현)
    // TODO: 프로젝트 WBS 할당 초기화 알림 발송
    // const affectedEmployees = await this.getAffectedEmployeesByProject(
    //   params.projectId,
    //   params.periodId,
    // );
    // await Promise.all(
    //   affectedEmployees.map((employeeId) =>
    //     this.notificationService.send({
    //       type: 'PROJECT_WBS_ASSIGNMENTS_RESET',
    //       recipientId: employeeId,
    //       data: {
    //         projectId: params.projectId,
    //         periodId: params.periodId,
    //       },
    //     }),
    //   ),
    // );

    this.logger.log('프로젝트 WBS 할당 초기화 및 평가기준 정리 완료', {
      projectId: params.projectId,
      cleanedWbsItems: affectedWbsItemIds.length,
    });
  }

  /**
   * 직원의 WBS 할당을 초기화하고 관련 알림을 발송한다
   */
  async 직원의_WBS_할당을_초기화한다(params: {
    employeeId: string;
    periodId: string;
    resetBy: string;
  }): Promise<void> {
    this.logger.log('직원 WBS 할당 초기화 비즈니스 로직 시작', {
      employeeId: params.employeeId,
      periodId: params.periodId,
    });

    // 1. 초기화 전 모든 할당 조회하여 영향받는 WBS 항목 ID 수집
    const allAssignments =
      await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
        { employeeId: params.employeeId, periodId: params.periodId },
        1,
        10000,
      );

    const affectedWbsItemIds = [
      ...new Set(allAssignments.assignments.map((a) => a.wbsItemId)),
    ];

    // 2. 직원 WBS 할당 초기화 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.직원의_WBS_할당을_초기화한다(
      params.employeeId,
      params.periodId,
      params.resetBy,
    );

    // 3. 고아 평가기준 정리 (할당이 없는 WBS 항목의 평가기준 삭제)
    await Promise.all(
      affectedWbsItemIds.map(async (wbsItemId) => {
        const remainingAssignments =
          await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
            wbsItemId,
            params.periodId,
          );

        if (!remainingAssignments || remainingAssignments.length === 0) {
          this.logger.log('고아 평가기준 삭제', { wbsItemId });
          await this.evaluationCriteriaManagementService.WBS_항목의_평가기준을_전체삭제한다(
            wbsItemId,
            params.resetBy,
          );
        }
      }),
    );

    // 4. 직원에게 알림 발송 (추후 구현)
    // TODO: 직원 WBS 할당 초기화 알림 발송
    // await this.notificationService.send({
    //   type: 'EMPLOYEE_WBS_ASSIGNMENTS_RESET',
    //   recipientId: params.employeeId,
    //   data: {
    //     periodId: params.periodId,
    //   },
    // });

    this.logger.log('직원 WBS 할당 초기화 및 평가기준 정리 완료', {
      employeeId: params.employeeId,
      cleanedWbsItems: affectedWbsItemIds.length,
    });
  }

  /**
   * WBS 할당 목록을 조회한다
   */
  async WBS_할당_목록을_조회한다(params: {
    periodId?: string;
    employeeId?: string;
    wbsItemId?: string;
    projectId?: string;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<any> {
    this.logger.log('WBS 할당 목록 조회 비즈니스 로직', {
      periodId: params.periodId,
      employeeId: params.employeeId,
    });

    const filter = {
      periodId: params.periodId,
      employeeId: params.employeeId,
      wbsItemId: params.wbsItemId,
      projectId: params.projectId,
    };

    return await this.evaluationCriteriaManagementService.WBS_할당_목록을_조회한다(
      filter,
      params.page,
      params.limit,
      params.orderBy,
      params.orderDirection,
    );
  }

  /**
   * WBS 할당 상세를 조회한다
   */
  async WBS_할당_상세를_조회한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<any> {
    this.logger.log('WBS 할당 상세 조회 비즈니스 로직', {
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 직원에게 할당된 WBS를 조회한다
   */
  async 특정_평가기간에_직원에게_할당된_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<any[]> {
    this.logger.log('직원 WBS 할당 조회 비즈니스 로직', {
      employeeId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_직원에게_할당된_WBS를_조회한다(
      employeeId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트의 WBS 할당을 조회한다
   */
  async 특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<any[]> {
    this.logger.log('프로젝트 WBS 할당 조회 비즈니스 로직', {
      projectId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
      projectId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 WBS 항목에 할당된 직원을 조회한다
   */
  async 특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<any[]> {
    this.logger.log('WBS 항목 할당 직원 조회 비즈니스 로직', {
      wbsItemId,
      periodId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
      wbsItemId,
      periodId,
    );
  }

  /**
   * 특정 평가기간에 프로젝트에서 할당되지 않은 WBS 항목 목록을 조회한다
   */
  async 특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<WbsItemDto[]> {
    this.logger.log('할당되지 않은 WBS 항목 조회 비즈니스 로직', {
      projectId,
      periodId,
      employeeId,
    });

    return await this.evaluationCriteriaManagementService.특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
      projectId,
      periodId,
      employeeId,
    );
  }

  /**
   * 평가라인을 자동으로 구성한다
   * - 1차 평가자: 피평가자의 담당 평가자 (Employee.managerId)
   * - 2차 평가자: 프로젝트 PM (Project.managerId)
   */
  private async 평가라인을_자동으로_구성한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
    createdBy: string,
  ): Promise<void> {
    try {
      this.logger.log('평가라인 자동 구성 시작', {
        employeeId,
        wbsItemId,
        projectId,
      });

      // 1. 직원 정보 조회 (담당 평가자 확인)
      const employee = await this.employeeService.ID로_조회한다(employeeId);
      if (!employee) {
        this.logger.warn('직원을 찾을 수 없습니다', { employeeId });
        return;
      }

      // 2. 프로젝트 정보 조회 (PM 확인)
      const project = await this.projectService.ID로_조회한다(projectId);
      if (!project) {
        this.logger.warn('프로젝트를 찾을 수 없습니다', { projectId });
        return;
      }

      // 3. 1차 평가자 구성 (담당 평가자) - Upsert 방식
      if (employee.managerId) {
        this.logger.log('1차 평가자(담당 평가자) 구성', {
          evaluatorId: employee.managerId,
        });

        try {
          await this.evaluationCriteriaManagementService.일차_평가자를_구성한다(
            employeeId,
            wbsItemId,
            periodId,
            employee.managerId,
            createdBy,
          );
        } catch (error) {
          this.logger.error('1차 평가자 구성 실패', {
            error: error.message,
            employeeId,
            evaluatorId: employee.managerId,
          });
        }
      } else {
        this.logger.warn('담당 평가자(managerId)가 설정되지 않았습니다', {
          employeeId,
        });
      }

      // 4. 2차 평가자 구성 (프로젝트 PM) - Upsert 방식
      if (project.managerId) {
        // PM이 담당 평가자와 동일한 경우 2차 평가자 설정 안 함
        if (project.managerId === employee.managerId) {
          this.logger.log(
            'PM과 담당 평가자가 동일하여 2차 평가자를 구성하지 않습니다',
            { managerId: project.managerId },
          );
        } else {
          this.logger.log('2차 평가자(프로젝트 PM) 구성', {
            evaluatorId: project.managerId,
          });

          try {
            await this.evaluationCriteriaManagementService.이차_평가자를_구성한다(
              employeeId,
              wbsItemId,
              periodId,
              project.managerId,
              createdBy,
            );
          } catch (error) {
            this.logger.error('2차 평가자 구성 실패', {
              error: error.message,
              employeeId,
              evaluatorId: project.managerId,
            });
          }
        }
      } else {
        this.logger.warn('프로젝트 PM(managerId)이 설정되지 않았습니다', {
          projectId,
        });
      }

      this.logger.log('평가라인 자동 구성 완료', {
        employeeId,
        wbsItemId,
        primaryEvaluator: employee.managerId,
        secondaryEvaluator:
          project.managerId !== employee.managerId ? project.managerId : null,
      });
    } catch (error) {
      this.logger.error('평가라인 자동 구성 중 오류 발생', {
        error: error.message,
        employeeId,
        wbsItemId,
        projectId,
      });
      // 평가라인 구성 실패는 치명적이지 않으므로 에러를 throw하지 않음
    }
  }
}
