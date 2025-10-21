import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { ProjectModule } from '@domain/common/project/project.module';
import { EvaluationLineMappingModule } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLineModule } from '@domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentModule } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { WbsEvaluationCriteriaModule } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.module';
import { TransactionManagerService } from '@libs/database/transaction-manager.service';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationCriteriaManagementService } from './evaluation-criteria-management.service';

// Project Assignment Handlers
import { PROJECT_ASSIGNMENT_HANDLERS } from './handlers/project-assignment';

// WBS Assignment Handlers
import { WBS_ASSIGNMENT_HANDLERS } from './handlers/wbs-assignment';

// Evaluation Line Handlers
import { EVALUATION_LINE_HANDLERS } from './handlers/evaluation-line';

// WBS Evaluation Criteria Handlers
import { WBS_EVALUATION_CRITERIA_HANDLERS } from './handlers/wbs-evaluation-criteria';

// Domain Modules
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';

import { WbsItemModule } from '@domain/common/wbs-item/wbs-item.module';
import { WbsAssignmentWeightCalculationService } from './services/wbs-assignment-weight-calculation.service';

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
      WbsEvaluationCriteria,
      EvaluationLine,
      EvaluationLineMapping,
    ]),
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,
    EvaluationLineModule,
    EvaluationLineMappingModule,
    WbsEvaluationCriteriaModule,
    ProjectModule,
    EvaluationPeriodModule,
    WbsItemModule,
  ],
  providers: [
    EvaluationCriteriaManagementService,
    TransactionManagerService,
    WbsAssignmentWeightCalculationService,
    // Project Assignment Handlers
    ...PROJECT_ASSIGNMENT_HANDLERS,
    // WBS Assignment Handlers
    ...WBS_ASSIGNMENT_HANDLERS,
    // Evaluation Line Handlers
    ...EVALUATION_LINE_HANDLERS,
    // WBS Evaluation Criteria Handlers
    ...WBS_EVALUATION_CRITERIA_HANDLERS,
  ],
  exports: [EvaluationCriteriaManagementService],
})
export class EvaluationCriteriaManagementContextModule {}
