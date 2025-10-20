import { Module } from '@nestjs/common';
import { AuthContextModule } from './auth-context/auth-context.module';
import { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context/evaluation-period-management-context.module';
import { OrganizationManagementContextModule } from './organization-management-context/organization-management-context.module';
import { EvaluationCriteriaManagementContextModule } from './evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { PerformanceEvaluationContextModule } from './performance-evaluation-context/performance-evaluation-context.module';
import { TestContextModule } from './test-context/test-context.module';
import { DashboardContextModule } from './dashboard-context/dashboard-context.module';
import { EvaluationQuestionManagementContextModule } from './evaluation-question-management-context/evaluation-question-management-context.module';
import { SeedDataContextModule } from './seed-data-context/seed-data-context.module';

@Module({
  imports: [
    AuthContextModule,
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
    PerformanceEvaluationContextModule,
    TestContextModule,
    DashboardContextModule,
    EvaluationQuestionManagementContextModule,
    SeedDataContextModule,
  ],
  providers: [],
  exports: [
    AuthContextModule,
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
    PerformanceEvaluationContextModule,
    TestContextModule,
    DashboardContextModule,
    EvaluationQuestionManagementContextModule,
    SeedDataContextModule,
  ],
})
export class DomainContextModule {}
