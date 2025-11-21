import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementService } from '@context/evaluation-criteria-management-context/evaluation-criteria-management.service';
import { 평가활동내역을생성한다 } from '@context/evaluation-activity-log-context/handlers';
import type {
  EvaluationProjectAssignmentDto,
  CreateEvaluationProjectAssignmentData,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';

/**
 * 프로젝트 할당 비즈니스 서비스
 *
 * 프로젝트 할당 관련 비즈니스 로직을 오케스트레이션합니다.
 * - 프로젝트 할당 생성
 * - 프로젝트 할당 취소
 * - 프로젝트 대량 할당
 * - 활동 내역 자동 기록
 */
@Injectable()
export class ProjectAssignmentBusinessService {
  private readonly logger = new Logger(ProjectAssignmentBusinessService.name);

  constructor(
    private readonly evaluationCriteriaManagementService: EvaluationCriteriaManagementService,
    private readonly commandBus: CommandBus,
  ) {}

  /**
   * 프로젝트를 할당한다 (활동 내역 기록 포함)
   */
  async 프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    this.logger.log('프로젝트 할당 시작', {
      employeeId: data.employeeId,
      projectId: data.projectId,
      periodId: data.periodId,
    });

    // 프로젝트 할당 생성
    const assignment =
      await this.evaluationCriteriaManagementService.프로젝트를_할당한다(
        data,
        assignedBy,
      );

    // 활동 내역 기록
    try {
      await this.commandBus.execute(
        new 평가활동내역을생성한다(
          data.periodId,
          data.employeeId,
          'project_assignment',
          'created',
          '프로젝트 할당',
          undefined, // activityDescription
          'project_assignment',
          assignment.id,
          assignedBy,
          undefined, // performedByName
          {
            projectId: data.projectId,
          },
        ),
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 프로젝트 할당은 정상 처리
      this.logger.warn('프로젝트 할당 생성 활동 내역 기록 실패', {
        assignmentId: assignment.id,
        error: error.message,
      });
    }

    this.logger.log('프로젝트 할당 완료', { assignmentId: assignment.id });

    return assignment;
  }

  /**
   * 프로젝트를 대량으로 할당한다 (활동 내역 기록 포함)
   */
  async 프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    this.logger.log('프로젝트 대량 할당 시작', {
      count: assignments.length,
    });

    // 프로젝트 대량 할당 생성
    const results =
      await this.evaluationCriteriaManagementService.프로젝트를_대량으로_할당한다(
        assignments,
        assignedBy,
      );

    // 각 할당에 대해 활동 내역 기록
    for (const assignment of results) {
      try {
        const assignmentData = assignments.find(
          (a) =>
            a.employeeId === assignment.employeeId &&
            a.projectId === assignment.projectId &&
            a.periodId === assignment.periodId,
        );

        if (assignmentData) {
          await this.commandBus.execute(
            new 평가활동내역을생성한다(
              assignmentData.periodId,
              assignmentData.employeeId,
              'project_assignment',
              'created',
              '프로젝트 할당',
              undefined, // activityDescription
              'project_assignment',
              assignment.id,
              assignedBy,
              undefined, // performedByName
              {
                projectId: assignmentData.projectId,
              },
            ),
          );
        }
      } catch (error) {
        // 활동 내역 기록 실패 시에도 프로젝트 할당은 정상 처리
        this.logger.warn('프로젝트 할당 생성 활동 내역 기록 실패', {
          assignmentId: assignment.id,
          error: error.message,
        });
      }
    }

    this.logger.log('프로젝트 대량 할당 완료', {
      count: results.length,
    });

    return results;
  }

  /**
   * 프로젝트 할당을 취소한다 (활동 내역 기록 포함)
   */
  async 프로젝트_할당을_취소한다(
    id: string,
    cancelledBy: string,
  ): Promise<void> {
    this.logger.log('프로젝트 할당 취소 시작', { assignmentId: id });

    // 할당 정보 조회 (활동 내역 기록을 위해 취소 전에 조회)
    const assignment =
      await this.evaluationCriteriaManagementService.프로젝트_할당_상세를_조회한다(
        id,
      );

    if (!assignment) {
      throw new Error(
        `프로젝트 할당 ID ${id}에 해당하는 할당을 찾을 수 없습니다.`,
      );
    }

    // 프로젝트 할당 취소
    await this.evaluationCriteriaManagementService.프로젝트_할당을_취소한다(
      id,
      cancelledBy,
    );

    // 활동 내역 기록
    try {
      await this.commandBus.execute(
        new 평가활동내역을생성한다(
          assignment.periodId,
          assignment.employeeId,
          'project_assignment',
          'cancelled',
          '프로젝트 할당 취소',
          undefined, // activityDescription
          'project_assignment',
          id,
          cancelledBy,
          undefined, // performedByName
          {
            projectId: assignment.projectId,
          },
        ),
      );
    } catch (error) {
      // 활동 내역 기록 실패 시에도 프로젝트 할당 취소는 정상 처리
      this.logger.warn('프로젝트 할당 취소 활동 내역 기록 실패', {
        assignmentId: id,
        error: error.message,
      });
    }

    this.logger.log('프로젝트 할당 취소 완료', { assignmentId: id });
  }

  /**
   * 프로젝트 할당을 프로젝트 ID로 취소한다 (활동 내역 기록 포함)
   */
  async 프로젝트_할당을_프로젝트_ID로_취소한다(
    employeeId: string,
    projectId: string,
    periodId: string,
    cancelledBy: string,
  ): Promise<void> {
    this.logger.log('프로젝트 할당 취소 시작 (프로젝트 ID 기반)', {
      employeeId,
      projectId,
      periodId,
    });

    // 할당 목록 조회하여 할당 ID 찾기 (활동 내역 기록을 위해 취소 전에 조회)
    const assignmentList =
      await this.evaluationCriteriaManagementService.프로젝트_할당_목록을_조회한다(
        {
          employeeId,
          projectId,
          periodId,
          page: 1,
          limit: 1,
        },
      );

    const assignmentId =
      assignmentList.assignments && assignmentList.assignments.length > 0
        ? assignmentList.assignments[0].id
        : null;

    // 프로젝트 할당 취소
    await this.evaluationCriteriaManagementService.프로젝트_할당을_프로젝트_ID로_취소한다(
      employeeId,
      projectId,
      periodId,
      cancelledBy,
    );

    // 활동 내역 기록 (할당이 있었던 경우에만)
    if (assignmentId) {
      try {
        await this.commandBus.execute(
          new 평가활동내역을생성한다(
            periodId,
            employeeId,
            'project_assignment',
            'cancelled',
            '프로젝트 할당 취소',
            undefined, // activityDescription
            'project_assignment',
            assignmentId,
            cancelledBy,
            undefined, // performedByName
            {
              projectId,
            },
          ),
        );
      } catch (error) {
        // 활동 내역 기록 실패 시에도 프로젝트 할당 취소는 정상 처리
        this.logger.warn('프로젝트 할당 취소 활동 내역 기록 실패', {
          assignmentId,
          error: error.message,
        });
      }
    }

    this.logger.log('프로젝트 할당 취소 완료 (프로젝트 ID 기반)', {
      employeeId,
      projectId,
      periodId,
    });
  }
}
