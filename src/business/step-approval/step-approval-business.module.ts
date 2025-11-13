import { Module } from '@nestjs/common';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { StepApprovalContextModule } from '@context/step-approval-context/step-approval-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { StepApprovalBusinessService } from './step-approval-business.service';

/**
 * 단계 승인 비즈니스 모듈
 *
 * 단계 승인 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    PerformanceEvaluationContextModule,
    StepApprovalContextModule,
    EvaluationActivityLogContextModule,
    EvaluationCriteriaManagementContextModule,
  ],
  providers: [StepApprovalBusinessService],
  exports: [StepApprovalBusinessService],
})
export class StepApprovalBusinessModule {}
