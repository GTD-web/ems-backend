import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

// Common Domain Entities
import { Department } from '@domain/common/department/department.entity';
import { Employee } from '@domain/common/employee/employee.entity';
import { Project } from '@domain/common/project/project.entity';
import { WbsItem } from '@domain/common/wbs-item/wbs-item.entity';

// Core Domain Entities
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationProjectAssignment } from '@domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
// TODO: Phase 4-8 entities 추가

// Generators
import {
  Phase1OrganizationGenerator,
  Phase2EvaluationPeriodGenerator,
  Phase3To8FullCycleGenerator,
} from './generators';

// Handlers
import { CommandHandlers, QueryHandlers } from './handlers';

// Service
import { SeedDataService } from './seed-data.service';

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      // Common
      Department,
      Employee,
      Project,
      WbsItem,
      // Core
      EvaluationPeriod,
      EvaluationPeriodEmployeeMapping,
      EvaluationProjectAssignment,
      EvaluationWbsAssignment,
      // TODO: Phase 4-8 entities 추가
    ]),
  ],
  providers: [
    // Service
    SeedDataService,
    // Generators
    Phase1OrganizationGenerator,
    Phase2EvaluationPeriodGenerator,
    Phase3To8FullCycleGenerator,
    // Handlers
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [SeedDataService],
})
export class SeedDataContextModule {}
