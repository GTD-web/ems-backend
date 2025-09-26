import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEvaluationStatus } from './employee-evaluation-status.entity';
import { EmployeeEvaluationStatusService } from './employee-evaluation-status.service';
import { EmployeeEvaluationStatusValidationService } from './employee-evaluation-status-validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEvaluationStatus])],
  providers: [
    EmployeeEvaluationStatusService,
    EmployeeEvaluationStatusValidationService,
  ],
  exports: [EmployeeEvaluationStatusService],
})
export class EmployeeEvaluationStatusModule {}
