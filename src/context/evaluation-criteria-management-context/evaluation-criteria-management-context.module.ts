import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentModule } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationWbsAssignmentModule } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { WbsEvaluationCriteriaModule } from '../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.module';
import { EvaluationLineModule } from '../../domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationCriteriaManagementService } from './evaluation-criteria-management.service';

// Project Assignment Command Handlers
import {
  CreateProjectAssignmentHandler,
  UpdateProjectAssignmentHandler,
  CancelProjectAssignmentHandler,
  BulkCreateProjectAssignmentHandler,
  ResetPeriodProjectAssignmentsHandler,
} from './commands';

// Project Assignment Query Handlers
import {
  GetProjectAssignmentListHandler,
  GetEmployeeProjectAssignmentsHandler,
  GetProjectAssignedEmployeesHandler,
  GetProjectAssignmentDetailHandler,
  GetUnassignedEmployeesHandler,
} from './queries';

// WBS Assignment Command Handlers
import {
  CreateWbsAssignmentHandler,
  UpdateWbsAssignmentHandler,
  CancelWbsAssignmentHandler,
  BulkCreateWbsAssignmentHandler,
  ResetPeriodWbsAssignmentsHandler,
  ResetProjectWbsAssignmentsHandler,
  ResetEmployeeWbsAssignmentsHandler,
} from './commands/wbs-assignment.command-handlers';

// WBS Assignment Query Handlers
import {
  GetWbsAssignmentListHandler,
  GetEmployeeWbsAssignmentsHandler,
  GetProjectWbsAssignmentsHandler,
  GetWbsItemAssignmentsHandler,
  GetWbsAssignmentDetailHandler,
  GetUnassignedWbsItemsHandler,
} from './queries/wbs-assignment.query-handlers';

/**
 * 평가기준관리 컨텍스트 모듈
 *
 * 평가 기준 설정과 관련된 모든 기능을 통합 관리하는 컨텍스트입니다.
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 * - WBS 평가 기준 관리
 * - 평가 라인 관리
 * - 평가 라인 매핑 관리
 *
 * CQRS 패턴을 사용하여 명령과 조회를 분리하여 처리합니다.
 */
@Module({
  imports: [
    CqrsModule,
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,
    WbsEvaluationCriteriaModule,
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
  ],
  exports: [EvaluationCriteriaManagementService],
})
export class EvaluationCriteriaManagementContextModule {}
