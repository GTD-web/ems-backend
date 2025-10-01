import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectModule } from '@domain/common/project/project.module';
import { EvaluationLineMappingModule } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationLineModule } from '@domain/core/evaluation-line/evaluation-line.module';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentModule } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationCriteriaManagementService } from './evaluation-criteria-management.service';

// Project Assignment Handlers
import {
  BulkCreateProjectAssignmentHandler,
  CancelProjectAssignmentHandler,
  CreateProjectAssignmentHandler,
  GetEmployeeProjectAssignmentsHandler,
  GetProjectAssignedEmployeesHandler,
  GetProjectAssignmentDetailHandler,
  GetProjectAssignmentListHandler,
  GetUnassignedEmployeesHandler,
} from './handlers/project-assignment';

// WBS Assignment Handlers
import {
  BulkCreateWbsAssignmentHandler,
  CancelWbsAssignmentHandler,
  CreateWbsAssignmentHandler,
  GetEmployeeWbsAssignmentsHandler,
  GetProjectWbsAssignmentsHandler,
  GetUnassignedWbsItemsHandler,
  GetWbsAssignmentDetailHandler,
  GetWbsAssignmentListHandler,
  GetWbsItemAssignmentsHandler,
  ResetEmployeeWbsAssignmentsHandler,
  ResetPeriodWbsAssignmentsHandler,
  ResetProjectWbsAssignmentsHandler,
} from './handlers/wbs-assignment';

// Evaluation Line Handlers
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import {
  ConfigureEmployeeWbsEvaluationLineHandler,
  GetEmployeeEvaluationLineMappingsHandler,
  GetEmployeeEvaluationSettingsHandler,
  GetEvaluationLineListHandler,
  GetEvaluatorEmployeesHandler,
  GetUpdaterEvaluationLineMappingsHandler,
} from './handlers/evaluation-line';
import { WbsItemModule } from '@domain/common/wbs-item/wbs-item.module';

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
    ]),
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,
    EvaluationLineModule,
    EvaluationLineMappingModule,
    ProjectModule,
    EvaluationPeriodModule,
    WbsItemModule,
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
