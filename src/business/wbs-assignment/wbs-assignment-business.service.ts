import { Injectable, Logger } from '@nestjs/common';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import type {
  CreateEvaluationWbsAssignmentData,
  OrderDirection,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

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
        },
        params.assignedBy,
      );
    }

    // 3. 알림 발송 (추후 구현)
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

    this.logger.log('WBS 할당 및 평가기준 생성, 알림 발송 완료', {
      assignmentId: assignment.id,
    });

    return assignment;
  }

  /**
   * WBS 할당을 취소하고 관련 알림을 발송한다
   */
  async WBS_할당을_취소한다(params: {
    assignmentId: string;
    cancelledBy: string;
  }): Promise<void> {
    this.logger.log('WBS 할당 취소 비즈니스 로직 시작', {
      assignmentId: params.assignmentId,
    });

    // 1. 할당 정보 조회 (삭제 전에 wbsItemId를 알아야 함)
    const assignment =
      await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
        params.assignmentId,
      );

    if (!assignment) {
      this.logger.warn('할당을 찾을 수 없습니다', {
        assignmentId: params.assignmentId,
      });
      return;
    }

    const wbsItemId = assignment.wbsItemId;

    // 2. WBS 할당 취소 (컨텍스트 호출)
    await this.evaluationCriteriaManagementService.WBS_할당을_취소한다(
      params.assignmentId,
      params.cancelledBy,
    );

    // 3. 해당 WBS 항목에 다른 할당이 있는지 확인
    const remainingAssignments =
      await this.evaluationCriteriaManagementService.특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
        wbsItemId,
        assignment.periodId,
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
      criteriaDeleted: remainingAssignments.length === 0,
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
            },
            params.assignedBy,
          );
        }
      }),
    );

    // 3. 각 직원에게 알림 발송 (추후 구현)
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

    this.logger.log('WBS 대량 할당, 평가기준 생성 및 알림 발송 완료', {
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
  async WBS_할당_상세를_조회한다(assignmentId: string): Promise<any> {
    this.logger.log('WBS 할당 상세 조회 비즈니스 로직', {
      assignmentId,
    });

    return await this.evaluationCriteriaManagementService.WBS_할당_상세를_조회한다(
      assignmentId,
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
  ): Promise<string[]> {
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
}
