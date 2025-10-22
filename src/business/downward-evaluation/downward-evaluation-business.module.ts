import { Module } from '@nestjs/common';
import { DownwardEvaluationBusinessService } from './downward-evaluation-business.service';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationPeriodManagementContextModule } from '@context/evaluation-period-management-context/evaluation-period-management-context.module';

/**
 * 하향평가 비즈니스 모듈
 *
 * 하향평가 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    PerformanceEvaluationContextModule,
    EvaluationCriteriaManagementContextModule,
    EvaluationPeriodManagementContextModule,
  ],
  providers: [DownwardEvaluationBusinessService],
  exports: [DownwardEvaluationBusinessService],
})
export class DownwardEvaluationBusinessModule {}
