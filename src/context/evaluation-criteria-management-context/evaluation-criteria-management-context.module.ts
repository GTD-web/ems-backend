import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationProjectAssignmentModule } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { EvaluationLineModule } from '@domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { ProjectModule } from '@domain/common/project/project.module';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { EvaluationCriteriaManagementService } from './evaluation-criteria-management.service';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Department } from '@domain/common/department/department.entity';
import { Project } from '@domain/common/project/project.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';

// Project Assignment Handlers
import {
  CreateProjectAssignmentHandler,
  CancelProjectAssignmentHandler,
  BulkCreateProjectAssignmentHandler,
  GetProjectAssignmentListHandler,
  GetEmployeeProjectAssignmentsHandler,
  GetProjectAssignedEmployeesHandler,
  GetProjectAssignmentDetailHandler,
  GetUnassignedEmployeesHandler,
} from './handlers/project-assignment';

// WBS Assignment Handlers
import {
  CreateWbsAssignmentHandler,
  UpdateWbsAssignmentHandler,
  CancelWbsAssignmentHandler,
  BulkCreateWbsAssignmentHandler,
  ResetPeriodWbsAssignmentsHandler,
  ResetProjectWbsAssignmentsHandler,
  ResetEmployeeWbsAssignmentsHandler,
  GetWbsAssignmentListHandler,
  GetEmployeeWbsAssignmentsHandler,
  GetProjectWbsAssignmentsHandler,
  GetWbsItemAssignmentsHandler,
  GetWbsAssignmentDetailHandler,
  GetUnassignedWbsItemsHandler,
} from './handlers/wbs-assignment';

// Evaluation Line Handlers
import {
  ConfigureEmployeeWbsEvaluationLineHandler,
  GetEvaluationLineListHandler,
  GetEmployeeEvaluationLineMappingsHandler,
  GetEvaluatorEmployeesHandler,
  GetUpdaterEvaluationLineMappingsHandler,
  GetEmployeeEvaluationSettingsHandler,
} from './handlers/evaluation-line';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

/**
 * 평가기준관리 컨텍스트 모듈 (MVP 버전)
 *
 * MVP에서는 핵심 기능만 제공합니다:
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 * - 평가라인 구성 관리
 *
 * CQRS 패턴을 사용하여 명령과 조회를 분리하여 처리합니다.
 * 각 핸들러는 기능별로 개별 파일로 분리되어 관리됩니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      EvaluationProjectAssignment,
      Employee,
      Department,
      Project,
      EvaluationPeriod,
      EvaluationWbsAssignment,
      WbsItem,
    ]),
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,
    EvaluationLineModule,
    EvaluationLineMappingModule,
    ProjectModule,
    EvaluationPeriodModule,
  ],
  providers: [
    EvaluationCriteriaManagementService,
    TransactionManagerService,
    // Project Assignment Command Handlers
    CreateProjectAssignmentHandler,
    CancelProjectAssignmentHandler,
    BulkCreateProjectAssignmentHandler,
    // Project Assignment Query Handlers
    GetProjectAssignmentListHandler,
    GetEmployeeProjectAssignmentsHandler,
    GetProjectAssignedEmployeesHandler,
    GetProjectAssignmentDetailHandler,
    GetUnassignedEmployeesHandler,
    // WBS Assignment Command Handlers
    CreateWbsAssignmentHandler,
    UpdateWbsAssignmentHandler,
    CancelWbsAssignmentHandler,
    BulkCreateWbsAssignmentHandler,
    ResetPeriodWbsAssignmentsHandler,
    ResetProjectWbsAssignmentsHandler,
    ResetEmployeeWbsAssignmentsHandler,
    // WBS Assignment Query Handlers
    GetWbsAssignmentListHandler,
    GetEmployeeWbsAssignmentsHandler,
    GetProjectWbsAssignmentsHandler,
    GetWbsItemAssignmentsHandler,
    GetWbsAssignmentDetailHandler,
    GetUnassignedWbsItemsHandler,
    // Evaluation Line Handlers
    ConfigureEmployeeWbsEvaluationLineHandler,
    GetEvaluationLineListHandler,
    GetEmployeeEvaluationLineMappingsHandler,
    GetEvaluatorEmployeesHandler,
    GetUpdaterEvaluationLineMappingsHandler,
    GetEmployeeEvaluationSettingsHandler,
  ],
  exports: [EvaluationCriteriaManagementService],
})
export class EvaluationCriteriaManagementContextModule {}
