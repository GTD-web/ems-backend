import { Module } from '@nestjs/common';
import { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context';
import { OrganizationManagementContextModule } from './organization-management-context/organization-management-context.module';
import { EvaluationCriteriaManagementContextModule } from './evaluation-criteria-management-context';

@Module({
  imports: [
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
  ],
  providers: [],
  exports: [
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
    EvaluationCriteriaManagementContextModule,
  ],
})
export class DomainContextModule {}
