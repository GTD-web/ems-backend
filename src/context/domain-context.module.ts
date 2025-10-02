import { Module } from '@nestjs/common';
import { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context/evaluation-period-management-context.module';
import { OrganizationManagementContextModule } from './organization-management-context/organization-management-context.module';
import { EvaluationCriteriaManagementContextModule } from './evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { PerformanceEvaluationContextModule } from './performance-evaluation-context/performance-evaluation-context.module';
import { TestContextModule } from './test-context/test-context.module';

@Module({
  imports: [
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
    PerformanceEvaluationContextModule,
    TestContextModule,
  ],
  providers: [],
  exports: [
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
    PerformanceEvaluationContextModule,
    TestContextModule,
  ],
})
export class DomainContextModule {}
