import { Module } from '@nestjs/common';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { FinalEvaluationBusinessService } from './final-evaluation-business.service';

/**
 * 최종평가 비즈니스 모듈
 */
@Module({
  imports: [
    PerformanceEvaluationContextModule,
    EvaluationActivityLogContextModule,
  ],
  providers: [FinalEvaluationBusinessService],
  exports: [FinalEvaluationBusinessService],
})
export class FinalEvaluationBusinessModule {}

