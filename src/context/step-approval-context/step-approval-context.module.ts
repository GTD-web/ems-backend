import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StepApprovalContextService } from './step-approval-context.service';
import { EmployeeEvaluationStepApprovalModule } from '@domain/sub/employee-evaluation-step-approval';
import { SecondaryEvaluationStepApprovalModule } from '@domain/sub/secondary-evaluation-step-approval';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { EvaluationPeriodEmployeeMapping } from '@domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';

/**
 * 단계 승인 컨텍스트 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      EvaluationPeriodEmployeeMapping,
      EvaluationLineMapping,
    ]),
    EmployeeEvaluationStepApprovalModule,
    SecondaryEvaluationStepApprovalModule,
    EvaluationRevisionRequestModule,
  ],
  providers: [StepApprovalContextService],
  exports: [StepApprovalContextService],
})
export class StepApprovalContextModule {}
