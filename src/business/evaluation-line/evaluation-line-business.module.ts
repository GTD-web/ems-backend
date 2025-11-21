import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { EvaluationLineBusinessService } from './evaluation-line-business.service';

/**
 * 평가라인 구성 비즈니스 모듈
 */
@Module({
  imports: [
    CqrsModule,
    EvaluationCriteriaManagementContextModule,
    EvaluationActivityLogContextModule,
  ],
  providers: [EvaluationLineBusinessService],
  exports: [EvaluationLineBusinessService],
})
export class EvaluationLineBusinessModule {}

