import { Module } from '@nestjs/common';
import { EvaluationPeriodManagementContextModule } from './evaluation-period-management-context';

@Module({
  imports: [EvaluationPeriodManagementContextModule],
  providers: [],
  exports: [EvaluationPeriodManagementContextModule],
})
export class DomainContextModule {}
