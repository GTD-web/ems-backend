import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Common Domain Modules (for Sync Services)
import { DepartmentModule } from '@domain/common/department/department.module';
import { EmployeeModule } from '@domain/common/employee/employee.module';

// Common Domain Entities
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

// Core Domain Entities - Phase 2-3
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';

// Core Domain Entities - Phase 4
import { WbsEvaluationCriteria } from '@domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';

// Core Domain Entities - Phase 5
import { Deliverable } from '@domain/core/deliverable/deliverable.entity';
import { DeliverableMapping } from '@domain/core/deliverable-mapping/deliverable-mapping.entity';

// Sub Domain Entities - Phase 6
import { QuestionGroup } from '@domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '@domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '@domain/sub/question-group-mapping/question-group-mapping.entity';

// Core Domain Entities - Phase 7
import { WbsSelfEvaluation } from '@domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '@domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '@domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '@domain/core/final-evaluation/final-evaluation.entity';

// Sub Domain Entities - Phase 8
import { EvaluationResponse } from '@domain/sub/evaluation-response/evaluation-response.entity';

// Generators
import {
  Phase1OrganizationGenerator,
  Phase2EvaluationPeriodGenerator,
  Phase3AssignmentGenerator,
  Phase4EvaluationCriteriaGenerator,
  Phase5DeliverableGenerator,
  Phase6QuestionGenerator,
  Phase7EvaluationGenerator,
  Phase8ResponseGenerator,
} from './generators';

// Handlers
import { CommandHandlers, QueryHandlers } from './handlers';

// Service
import { SeedDataService } from './seed-data.service';

@Module({
  imports: [
    CqrsModule,
    DepartmentModule, // For DepartmentSyncService
    EmployeeModule, // For EmployeeSyncService
    TypeOrmModule.forFeature([
      // Common (Phase 1)
      Department,
      Employee,
      Project,
      WbsItem,

      // Core (Phase 2-3)
      EvaluationPeriod,
      EvaluationPeriodEmployeeMapping,
      EvaluationProjectAssignment,
      EvaluationWbsAssignment,

      // Core (Phase 4)
      WbsEvaluationCriteria,
      EvaluationLine,
      EvaluationLineMapping,

      // Core (Phase 5)
      Deliverable,
      DeliverableMapping,

      // Sub (Phase 6)
      QuestionGroup,
      EvaluationQuestion,
      QuestionGroupMapping,

      // Core (Phase 7)
      WbsSelfEvaluation,
      DownwardEvaluation,
      PeerEvaluation,
      FinalEvaluation,

      // Sub (Phase 8)
      EvaluationResponse,
    ]),
  ],
  providers: [
    // Service
    SeedDataService,
    // Generators
    Phase1OrganizationGenerator,
    Phase2EvaluationPeriodGenerator,
    Phase3AssignmentGenerator,
    Phase4EvaluationCriteriaGenerator,
    Phase5DeliverableGenerator,
    Phase6QuestionGenerator,
    Phase7EvaluationGenerator,
    Phase8ResponseGenerator,
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [SeedDataService],
})
export class SeedDataContextModule {}
