import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { IEvaluationCriteriaManagementService } from './interfaces/evaluation-criteria-management.interface';

// Project Assignment Commands & Queries
import {
  BulkCreateProjectAssignmentCommand,
  CancelProjectAssignmentCommand,
  ChangeProjectAssignmentOrderCommand,
  CreateProjectAssignmentCommand,
  GetEmployeeProjectAssignmentsQuery,
  GetProjectAssignedEmployeesQuery,
  GetProjectAssignmentDetailQuery,
  GetProjectAssignmentListQuery,
  GetUnassignedEmployeesQuery,
  type ProjectAssignmentListResult,
} from './handlers/project-assignment';

// WBS Assignment Commands & Queries
import {
  BulkCreateWbsAssignmentCommand,
  CancelWbsAssignmentCommand,
  ChangeWbsAssignmentOrderCommand,
  CreateWbsAssignmentCommand,
  GetEmployeeWbsAssignmentsQuery,
  GetProjectWbsAssignmentsQuery,
  GetUnassignedWbsItemsQuery,
  GetWbsAssignmentDetailQuery,
  GetWbsAssignmentListQuery,
  GetWbsItemAssignmentsQuery,
  ResetEmployeeWbsAssignmentsCommand,
  ResetPeriodWbsAssignmentsCommand,
  ResetProjectWbsAssignmentsCommand,
  type WbsAssignmentListResult,
  type WbsAssignmentDetailResult,
} from './handlers/wbs-assignment';

// WBS Evaluation Criteria Commands & Queries
import {
  CreateWbsEvaluationCriteriaCommand,
  UpdateWbsEvaluationCriteriaCommand,
  DeleteWbsEvaluationCriteriaCommand,
  DeleteWbsItemEvaluationCriteriaCommand,
  GetWbsEvaluationCriteriaListQuery,
  GetWbsEvaluationCriteriaDetailQuery,
  GetWbsItemEvaluationCriteriaQuery,
} from './handlers/wbs-evaluation-criteria';

// Evaluation Line Commands & Queries
import {
  ConfigureEmployeeWbsEvaluationLineCommand,
  ConfigurePrimaryEvaluatorCommand,
  ConfigureSecondaryEvaluatorCommand,
  GetEmployeeEvaluationLineMappingsQuery,
  GetEmployeeEvaluationSettingsQuery,
  GetEvaluationLineListQuery,
  GetEvaluatorEmployeesQuery,
  GetUpdaterEvaluationLineMappingsQuery,
} from './handlers/evaluation-line';

import {
  ProjectInfoDto,
  EmployeeInfoDto,
} from '@interface/admin/evaluation-criteria/dto/project-assignment.dto';
import type { EvaluationLineMappingDto } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.types';
import type {
  EvaluationLineDto,
  EvaluationLineFilter,
} from '@domain/core/evaluation-line/evaluation-line.types';
import type {
  CreateEvaluationProjectAssignmentData,
  EvaluationProjectAssignmentDto,
  EvaluationProjectAssignmentFilter,
  OrderDirection,
} from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.types';
import type {
  CreateEvaluationWbsAssignmentData,
  EvaluationWbsAssignmentDto,
  EvaluationWbsAssignmentFilter,
  UpdateEvaluationWbsAssignmentData,
  OrderDirection as WbsOrderDirection,
} from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.types';
import type {
  CreateWbsEvaluationCriteriaData,
  UpdateWbsEvaluationCriteriaData,
  WbsEvaluationCriteriaDto,
  WbsEvaluationCriteriaFilter,
} from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.types';
import type { WbsItemDto } from '@domain/common/wbs-item/wbs-item.types';

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

  async 특정_평가기간에_직원에게_할당된_프로젝트를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<{ projects: ProjectInfoDto[] }> {
    const query = new GetEmployeeProjectAssignmentsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  async 프로젝트_할당_상세를_조회한다(
    assignmentId: string,
  ): Promise<EvaluationProjectAssignmentDto | null> {
    const query = new GetProjectAssignmentDetailQuery(assignmentId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트에_할당된_직원을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<{ employees: EmployeeInfoDto[] }> {
    const query = new GetProjectAssignedEmployeesQuery(projectId, periodId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트가_할당되지_않은_직원_목록을_조회한다(
    periodId: string,
    projectId?: string,
  ): Promise<{ employees: EmployeeInfoDto[] }> {
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

  async 프로젝트_할당_순서를_변경한다(
    assignmentId: string,
    direction: OrderDirection,
    updatedBy: string,
  ): Promise<EvaluationProjectAssignmentDto> {
    const command = new ChangeProjectAssignmentOrderCommand(
      assignmentId,
      direction,
      updatedBy,
    );
    return await this.commandBus.execute(command);
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

  async WBS_할당을_취소한다(id: string, cancelledBy: string): Promise<void> {
    const command = new CancelWbsAssignmentCommand(id, cancelledBy);
    await this.commandBus.execute(command);
  }

  async WBS_할당_목록을_조회한다(
    filter: EvaluationWbsAssignmentFilter,
    page?: number,
    limit?: number,
    orderBy?: string,
    orderDirection?: 'ASC' | 'DESC',
  ): Promise<WbsAssignmentListResult> {
    const query = new GetWbsAssignmentListQuery(
      filter,
      page,
      limit,
      orderBy,
      orderDirection,
    );
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_직원에게_할당된_WBS를_조회한다(
    employeeId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetEmployeeWbsAssignmentsQuery(employeeId, periodId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트의_WBS_할당을_조회한다(
    projectId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetProjectWbsAssignmentsQuery(projectId, periodId);
    return await this.queryBus.execute(query);
  }

  async WBS_할당_상세를_조회한다(
    employeeId: string,
    wbsItemId: string,
    projectId: string,
    periodId: string,
  ): Promise<WbsAssignmentDetailResult | null> {
    const query = new GetWbsAssignmentDetailQuery(
      employeeId,
      wbsItemId,
      projectId,
      periodId,
    );
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_WBS_항목에_할당된_직원을_조회한다(
    wbsItemId: string,
    periodId: string,
  ): Promise<EvaluationWbsAssignmentDto[]> {
    const query = new GetWbsItemAssignmentsQuery(wbsItemId, periodId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가기간에_프로젝트에서_할당되지_않은_WBS_항목_목록을_조회한다(
    projectId: string,
    periodId: string,
    employeeId?: string,
  ): Promise<WbsItemDto[]> {
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

  async WBS_할당_순서를_변경한다(
    assignmentId: string,
    direction: WbsOrderDirection,
    updatedBy: string,
  ): Promise<EvaluationWbsAssignmentDto> {
    const command = new ChangeWbsAssignmentOrderCommand(
      assignmentId,
      direction,
      updatedBy,
    );
    return await this.commandBus.execute(command);
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

  async 특정_직원의_평가라인_매핑을_조회한다(
    employeeId: string,
  ): Promise<EvaluationLineMappingDto[]> {
    const query = new GetEmployeeEvaluationLineMappingsQuery(employeeId);
    return await this.queryBus.execute(query);
  }

  async 특정_평가자가_평가해야_하는_피평가자_목록을_조회한다(
    evaluatorId: string,
  ): Promise<{
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

  async 특정_사용자가_수정한_평가라인_매핑을_조회한다(
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

  /**
   * 1차_평가자를_구성한다
   * 직원, WBS, 평가기간에 따라 1차 평가자를 지정하여 평가라인을 구성한다
   */
  async 일차_평가자를_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
      id: string;
      employeeId: string;
      evaluatorId: string;
      wbsItemId: string;
      evaluationLineId: string;
    };
  }> {
    const command = new ConfigurePrimaryEvaluatorCommand(
      employeeId,
      wbsItemId,
      periodId,
      evaluatorId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  /**
   * 2차_평가자를_구성한다
   * 직원, WBS, 평가기간에 따라 2차 평가자를 지정하여 평가라인을 구성한다
   */
  async 이차_평가자를_구성한다(
    employeeId: string,
    wbsItemId: string,
    periodId: string,
    evaluatorId: string,
    createdBy: string,
  ): Promise<{
    message: string;
    createdLines: number;
    createdMappings: number;
    mapping: {
      id: string;
      employeeId: string;
      evaluatorId: string;
      wbsItemId: string;
      evaluationLineId: string;
    };
  }> {
    const command = new ConfigureSecondaryEvaluatorCommand(
      employeeId,
      wbsItemId,
      periodId,
      evaluatorId,
      createdBy,
    );
    return await this.commandBus.execute(command);
  }

  // ============================================================================
  // WBS 평가기준 관리
  // ============================================================================

  async WBS_평가기준을_생성한다(
    data: CreateWbsEvaluationCriteriaData,
    createdBy: string,
  ): Promise<WbsEvaluationCriteriaDto> {
    const command = new CreateWbsEvaluationCriteriaCommand(data, createdBy);
    return await this.commandBus.execute(command);
  }

  async WBS_평가기준을_수정한다(
    id: string,
    data: UpdateWbsEvaluationCriteriaData,
    updatedBy: string,
  ): Promise<WbsEvaluationCriteriaDto> {
    const command = new UpdateWbsEvaluationCriteriaCommand(id, data, updatedBy);
    return await this.commandBus.execute(command);
  }

  /**
   * WBS 평가기준 저장 (Upsert)
   * - id가 없으면 생성
   * - id가 있으면 수정
   */
  async WBS_평가기준을_저장한다(
    wbsItemId: string,
    criteria: string,
    actionBy: string,
    id?: string,
  ): Promise<WbsEvaluationCriteriaDto> {
    if (id) {
      // 수정
      return await this.WBS_평가기준을_수정한다(id, { criteria }, actionBy);
    } else {
      // 생성
      return await this.WBS_평가기준을_생성한다(
        { wbsItemId, criteria },
        actionBy,
      );
    }
  }

  async WBS_평가기준을_삭제한다(id: string, deletedBy: string): Promise<void> {
    const command = new DeleteWbsEvaluationCriteriaCommand(id, deletedBy);
    await this.commandBus.execute(command);
  }

  async WBS_항목의_평가기준을_전체삭제한다(
    wbsItemId: string,
    deletedBy: string,
  ): Promise<void> {
    const command = new DeleteWbsItemEvaluationCriteriaCommand(
      wbsItemId,
      deletedBy,
    );
    await this.commandBus.execute(command);
  }

  async WBS_평가기준_목록을_조회한다(
    filter: WbsEvaluationCriteriaFilter,
  ): Promise<WbsEvaluationCriteriaDto[]> {
    const query = new GetWbsEvaluationCriteriaListQuery(filter);
    return await this.queryBus.execute(query);
  }

  async WBS_평가기준_상세를_조회한다(
    id: string,
  ): Promise<WbsEvaluationCriteriaDto | null> {
    const query = new GetWbsEvaluationCriteriaDetailQuery(id);
    return await this.queryBus.execute(query);
  }

  async 특정_WBS항목의_평가기준을_조회한다(
    wbsItemId: string,
  ): Promise<WbsEvaluationCriteriaDto[]> {
    const query = new GetWbsItemEvaluationCriteriaQuery(wbsItemId);
    return await this.queryBus.execute(query);
  }

  // ============================================================================
  // 통합 관리 기능 (MVP)
  // ============================================================================

  async 특정_평가기간에_직원의_평가설정을_통합_조회한다(
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
