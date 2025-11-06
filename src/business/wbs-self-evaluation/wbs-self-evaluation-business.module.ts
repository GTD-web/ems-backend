import { Module } from '@nestjs/common';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { StepApprovalContextModule } from '@context/step-approval-context/step-approval-context.module';
import { WbsSelfEvaluationBusinessService } from './wbs-self-evaluation-business.service';

/**
 * WBS 자기평가 비즈니스 모듈
 */
@Module({
  imports: [
    PerformanceEvaluationContextModule,
    RevisionRequestContextModule,
    StepApprovalContextModule,
  ],
  providers: [WbsSelfEvaluationBusinessService],
  exports: [WbsSelfEvaluationBusinessService],
})
export class WbsSelfEvaluationBusinessModule {}
