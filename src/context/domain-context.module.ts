import { Module } from '@nestjs/common';
import { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context';
import { OrganizationManagementContextModule } from './organization-management-context/organization-management-context.module';

@Module({
  imports: [
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
  ],
  providers: [],
  exports: [
    EvaluationPeriodManagementContextModule,
    OrganizationManagementContextModule,
  ],
})
export class DomainContextModule {}
