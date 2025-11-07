import { Module } from '@nestjs/common';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { EvaluationWbsAssignmentModule } from '@domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { DeliverableModule } from '@domain/core/deliverable/deliverable.module';
import { DeliverableBusinessService } from './deliverable-business.service';

/**
 * 산출물 비즈니스 모듈
 */
@Module({
  imports: [
    PerformanceEvaluationContextModule,
    EvaluationActivityLogContextModule,
    EvaluationWbsAssignmentModule,
    DeliverableModule,
  ],
  providers: [DeliverableBusinessService],
  exports: [DeliverableBusinessService],
})
export class DeliverableBusinessModule {}
