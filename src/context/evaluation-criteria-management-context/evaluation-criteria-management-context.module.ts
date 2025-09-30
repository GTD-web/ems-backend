import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentModule } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationWbsAssignmentModule } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { EvaluationLineModule } from '../../domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationCriteriaManagementService } from './evaluation-criteria-management.service';

// Project Assignment Command Handlers
import { CreateProjectAssignmentHandler } from './handlers/project-assignment/commands/create-project-assignment.handler';
import { UpdateProjectAssignmentHandler } from './handlers/project-assignment/commands/update-project-assignment.handler';
import { CancelProjectAssignmentHandler } from './handlers/project-assignment/commands/cancel-project-assignment.handler';
import { BulkCreateProjectAssignmentHandler } from './handlers/project-assignment/commands/bulk-create-project-assignment.handler';
import { ResetPeriodProjectAssignmentsHandler } from './handlers/project-assignment/commands/reset-period-project-assignments.handler';

// Project Assignment Query Handlers
import { GetProjectAssignmentListHandler } from './handlers/project-assignment/queries/get-project-assignment-list.handler';
import { GetEmployeeProjectAssignmentsHandler } from './handlers/project-assignment/queries/get-employee-project-assignments.handler';
import { GetProjectAssignedEmployeesHandler } from './handlers/project-assignment/queries/get-project-assigned-employees.handler';
import { GetProjectAssignmentDetailHandler } from './handlers/project-assignment/queries/get-project-assignment-detail.handler';
import { GetUnassignedEmployeesHandler } from './handlers/project-assignment/queries/get-unassigned-employees.handler';

// WBS Assignment Command Handlers
import { CreateWbsAssignmentHandler } from './handlers/wbs-assignment/commands/create-wbs-assignment.handler';
import { UpdateWbsAssignmentHandler } from './handlers/wbs-assignment/commands/update-wbs-assignment.handler';
import { CancelWbsAssignmentHandler } from './handlers/wbs-assignment/commands/cancel-wbs-assignment.handler';
import { BulkCreateWbsAssignmentHandler } from './handlers/wbs-assignment/commands/bulk-create-wbs-assignment.handler';
import { ResetPeriodWbsAssignmentsHandler } from './handlers/wbs-assignment/commands/reset-period-wbs-assignments.handler';
import { ResetProjectWbsAssignmentsHandler } from './handlers/wbs-assignment/commands/reset-project-wbs-assignments.handler';
import { ResetEmployeeWbsAssignmentsHandler } from './handlers/wbs-assignment/commands/reset-employee-wbs-assignments.handler';

// WBS Assignment Query Handlers
import { GetWbsAssignmentListHandler } from './handlers/wbs-assignment/queries/get-wbs-assignment-list.handler';
import { GetEmployeeWbsAssignmentsHandler } from './handlers/wbs-assignment/queries/get-employee-wbs-assignments.handler';
import { GetProjectWbsAssignmentsHandler } from './handlers/wbs-assignment/queries/get-project-wbs-assignments.handler';
import { GetWbsItemAssignmentsHandler } from './handlers/wbs-assignment/queries/get-wbs-item-assignments.handler';
import { GetWbsAssignmentDetailHandler } from './handlers/wbs-assignment/queries/get-wbs-assignment-detail.handler';
import { GetUnassignedWbsItemsHandler } from './handlers/wbs-assignment/queries/get-unassigned-wbs-items.handler';

// Evaluation Line Handlers
import { ConfigureEmployeeWbsEvaluationLineHandler } from './handlers/evaluation-line/commands/configure-employee-wbs-evaluation-line.handler';
import { GetEvaluationLineListHandler } from './handlers/evaluation-line/queries/get-evaluation-line-list.handler';
import { GetEmployeeEvaluationLineMappingsHandler } from './handlers/evaluation-line/queries/get-employee-evaluation-line-mappings.handler';
import { GetEvaluatorEmployeesHandler } from './handlers/evaluation-line/queries/get-evaluator-employees.handler';
import { GetUpdaterEvaluationLineMappingsHandler } from './handlers/evaluation-line/queries/get-updater-evaluation-line-mappings.handler';
import { GetEmployeeEvaluationSettingsHandler } from './handlers/evaluation-line/queries/get-employee-evaluation-settings.handler';

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
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,
    EvaluationLineModule,
    EvaluationLineMappingModule,
  ],
  providers: [
    EvaluationCriteriaManagementService,
    // Project Assignment Command Handlers
    CreateProjectAssignmentHandler,
    UpdateProjectAssignmentHandler,
    CancelProjectAssignmentHandler,
    BulkCreateProjectAssignmentHandler,
    ResetPeriodProjectAssignmentsHandler,
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
