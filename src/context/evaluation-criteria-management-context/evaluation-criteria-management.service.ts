import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IEvaluationCriteriaManagementService } from './interfaces/evaluation-criteria-management.interface';

// Project Assignment Commands & Queries
import { BulkCreateProjectAssignmentCommand } from './handlers/project-assignment/commands/bulk-create-project-assignment.handler';
import { CancelProjectAssignmentCommand } from './handlers/project-assignment/commands/cancel-project-assignment.handler';
import { CreateProjectAssignmentCommand } from './handlers/project-assignment/commands/create-project-assignment.handler';
import { ResetPeriodProjectAssignmentsCommand } from './handlers/project-assignment/commands/reset-period-project-assignments.handler';
import { UpdateProjectAssignmentCommand } from './handlers/project-assignment/commands/update-project-assignment.handler';
import { GetEmployeeProjectAssignmentsQuery } from './handlers/project-assignment/queries/get-employee-project-assignments.handler';
import { GetProjectAssignedEmployeesQuery } from './handlers/project-assignment/queries/get-project-assigned-employees.handler';
import { GetProjectAssignmentDetailQuery } from './handlers/project-assignment/queries/get-project-assignment-detail.handler';
import {
  GetProjectAssignmentListQuery,
  ProjectAssignmentListResult,
} from './handlers/project-assignment/queries/get-project-assignment-list.handler';
import { GetUnassignedEmployeesQuery } from './handlers/project-assignment/queries/get-unassigned-employees.handler';

// WBS Assignment Commands & Queries
import { BulkCreateWbsAssignmentCommand } from './handlers/wbs-assignment/commands/bulk-create-wbs-assignment.handler';
import { CancelWbsAssignmentCommand } from './handlers/wbs-assignment/commands/cancel-wbs-assignment.handler';
import { CreateWbsAssignmentCommand } from './handlers/wbs-assignment/commands/create-wbs-assignment.handler';
import { ResetEmployeeWbsAssignmentsCommand } from './handlers/wbs-assignment/commands/reset-employee-wbs-assignments.handler';
import { ResetPeriodWbsAssignmentsCommand } from './handlers/wbs-assignment/commands/reset-period-wbs-assignments.handler';
import { ResetProjectWbsAssignmentsCommand } from './handlers/wbs-assignment/commands/reset-project-wbs-assignments.handler';
import { UpdateWbsAssignmentCommand } from './handlers/wbs-assignment/commands/update-wbs-assignment.handler';
import { GetEmployeeWbsAssignmentsQuery } from './handlers/wbs-assignment/queries/get-employee-wbs-assignments.handler';
import { GetProjectWbsAssignmentsQuery } from './handlers/wbs-assignment/queries/get-project-wbs-assignments.handler';
import { GetUnassignedWbsItemsQuery } from './handlers/wbs-assignment/queries/get-unassigned-wbs-items.handler';
import { GetWbsAssignmentDetailQuery } from './handlers/wbs-assignment/queries/get-wbs-assignment-detail.handler';
import {
  GetWbsAssignmentListQuery,
  WbsAssignmentListResult,
} from './handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';
import { GetWbsItemAssignmentsQuery } from './handlers/wbs-assignment/queries/get-wbs-item-assignments.handler';

// Evaluation Line Commands & Queries
import { ConfigureEmployeeWbsEvaluationLineCommand } from './handlers/evaluation-line/commands/configure-employee-wbs-evaluation-line.handler';
import { GetEvaluatorEmployeesQuery } from './handlers/evaluation-line/queries/get-evaluator-employees.handler';
import { GetEmployeeEvaluationLineMappingsQuery } from './handlers/evaluation-line/queries/get-employee-evaluation-line-mappings.handler';
import { GetEmployeeEvaluationSettingsQuery } from './handlers/evaluation-line/queries/get-employee-evaluation-settings.handler';
import { GetEvaluationLineListQuery } from './handlers/evaluation-line/queries/get-evaluation-line-list.handler';
import { GetUpdaterEvaluationLineMappingsQuery } from './handlers/evaluation-line/queries/get-updater-evaluation-line-mappings.handler';

import type { EvaluationLineMappingDto } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type {
  EvaluationLineDto,
  EvaluationLineFilter,
} from '../../domain/core/evaluation-line/evaluation-line.types';
import type {
  CreateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentDto,
  EvaluationProjectAssignmentFilter,
  UpdateEvaluationProjectAssignmentData,
} from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type {
  CreateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentDto,
  EvaluationWbsAssignmentFilter,
  UpdateEvaluationWbsAssignmentData,
} from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';

/**
 * 평가기준관리 서비스 (MVP 버전)
 *
 * MVP에서는 핵심 기능인 프로젝트 할당과 WBS 할당 관리만 제공합니다.
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 */
@Injectable()
export class EvaluationCriteriaManagementService
  implements IEvaluationCriteriaManagementService
{
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  // ============================================================================
  // 프로젝트 할당 관리
  // ============================================================================

  async 프로젝트를_할당한다(
    data: CreateEvaluationProjectAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    const command = new CreateProjectAssignmentCommand(data, assignedBy);
    return await this.commandBus.execute(command);
  }

  async 프로젝트_할당을_수정한다(
    id: string,
    data: UpdateEvaluationProjectAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    const command = new UpdateProjectAssignmentCommand(id, data, updatedBy);
    return await this.commandBus.execute(command);
  }

  async 프로젝트_할당을_취소한다(
    id: string,
    cancelledBy: string,
  ): Promise<void> {
    const command = new CancelProjectAssignmentCommand(id, cancelledBy);
    await this.commandBus.execute(command);
  }

  async 프로젝트_할당_목록을_조회한다(
    filter: EvaluationProjectAssignmentFilter,
  ): Promise<ProjectAssignmentListResult> {
    const query = new GetProjectAssignmentListQuery(filter);
    return await this.queryBus.execute(query);
  }

  async 직원의_프로젝트_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const query = new GetEmployeeProjectAssignmentsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null> {
    const query = new GetProjectAssignmentDetailQuery(assignmentId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const query = new GetProjectAssignedEmployeesQuery(projectId, periodId);
    return await this.queryBus.execute(query);
  }

  async 할당되지_않은_직원_목록을_조회한다(
    periodId: string,
    projectId?: string,
  ): Promise<string[]> {
    const query = new GetUnassignedEmployeesQuery(periodId, projectId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트를_대량으로_할당한다(
    assignments: CreateEvaluationProjectAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationProjectAssignmentDto[]> {
    const command = new BulkCreateProjectAssignmentCommand(
      assignments,
      assignedBy,
    );
    return await this.commandBus.execute(command);
  }

  async 평가기간의_프로젝트_할당을_초기화한다(
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetPeriodProjectAssignmentsCommand(periodId, resetBy);
    await this.commandBus.execute(command);
  }

  // ============================================================================
  // WBS 할당 관리
  // ============================================================================

  async WBS를_할당한다(
    data: CreateEvaluationWbsAssignmentData,
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto> {
    const command = new CreateWbsAssignmentCommand(data, assignedBy);
    return await this.commandBus.execute(command);
  }

  async WBS_할당을_수정한다(
    id: string,
    data: UpdateEvaluationWbsAssignmentData,
    updatedBy: string,
  ): Promise<EvaluationWbsAssignmentDto> {
    const command = new UpdateWbsAssignmentCommand(id, data, updatedBy);
    return await this.commandBus.execute(command);
  }

  async WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void> {
    const command = new CancelWbsAssignmentCommand(id, cancelledBy);
    await this.commandBus.execute(command);
  }

  async WBS_할당_목록을_조회한다(
    filter: EvaluationWbsAssignmentFilter,
  ): Promise<WbsAssignmentListResult> {
    const query = new GetWbsAssignmentListQuery(filter);
    return await this.queryBus.execute(query);
  }

  async 직원의_WBS_할당을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetEmployeeWbsAssignmentsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetProjectWbsAssignmentsQuery(projectId, periodId);
    return await this.queryBus.execute(query);
  }

  async WBS_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationWbsAssignmentDto | null> {
    const query = new GetWbsAssignmentDetailQuery(assignmentId);
    return await this.queryBus.execute(query);
  }

  async WBS_항목의_할당을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetWbsItemAssignmentsQuery(wbsItemId, periodId);
    return await this.queryBus.execute(query);
  }

  async 할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<string[]> {
    const query = new GetUnassignedWbsItemsQuery(
      projectId,
      periodId,
      employeeId,
    );
    return await this.queryBus.execute(query);
  }

  async WBS를_대량으로_할당한다(
    assignments: CreateEvaluationWbsAssignmentData[],
    assignedBy: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const command = new BulkCreateWbsAssignmentCommand(assignments, assignedBy);
    return await this.commandBus.execute(command);
  }

  async 평가기간의_WBS_할당을_초기화한다(
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetPeriodWbsAssignmentsCommand(periodId, resetBy);
    await this.commandBus.execute(command);
  }

  async 프로젝트의_WBS_할당을_초기화한다(
    projectId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetProjectWbsAssignmentsCommand(
      projectId,
      periodId,
      resetBy,
    );
    await this.commandBus.execute(command);
  }

  async 직원의_WBS_할당을_초기화한다(
    employeeId: string,
    periodId: string,
    resetBy: string,
  ): Promise<void> {
    const command = new ResetEmployeeWbsAssignmentsCommand(
      employeeId,
      periodId,
      resetBy,
    );
    await this.commandBus.execute(command);
  }

  // ============================================================================
  // 평가라인 관리 (CQRS 패턴)
  // ============================================================================

  async 평가라인_목록을_조회한다(
    filter: EvaluationLineFilter,
  ): Promise<EvaluationLineDto[]> {
    const query = new GetEvaluationLineListQuery(filter);
    return await this.queryBus.execute(query);
  }

  async 직원의_평가라인_매핑을_조회한다(
    employeeId: string,
  ): Promise<EvaluationLineMappingDto[]> {
    const query = new GetEmployeeEvaluationLineMappingsQuery(employeeId);
    return await this.queryBus.execute(query);
  }

  async 평가자별_피평가자_목록을_조회한다(evaluatorId: string): Promise<{
    evaluatorId: string;
    employees: {
      employeeId: string;
      wbsItemId?: string;
      evaluationLineId: string;
      createdBy?: string;
      updatedBy?: string;
      createdAt: Date;
      updatedAt: Date;
    }[];
  }> {
    const query = new GetEvaluatorEmployeesQuery(evaluatorId);
    return await this.queryBus.execute(query);
  }

  async 수정자별_평가라인_매핑을_조회한다(
    updatedBy: string,
  ): Promise<EvaluationLineMappingDto[]> {
    const query = new GetUpdaterEvaluationLineMappingsQuery(updatedBy);
    return await this.queryBus.execute(query);
  }

  // ============================================================================
  // 평가라인 구성 관리 (핵심 기능)
  // ============================================================================

  /**
   * 직원-WBS별 평가라인을 구성한다
   * 각 직원의 각 WBS 항목마다 개별적으로 평가라인을 구성한다
   */
  async 직원_WBS별_평가라인을_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
  }> {
    const command = new ConfigureEmployeeWbsEvaluationLineCommand(
      employeeId,
      wbsItemId,
      periodId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  // ============================================================================
  // 통합 관리 기능 (MVP)
  // ============================================================================

  async 직원의_평가설정을_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{
    projectAssignments: EvaluationProjectAssignmentDto[];
    wbsAssignments: EvaluationWbsAssignmentDto[];
    evaluationLineMappings: EvaluationLineMappingDto[];
  }> {
    const query = new GetEmployeeEvaluationSettingsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }
}
