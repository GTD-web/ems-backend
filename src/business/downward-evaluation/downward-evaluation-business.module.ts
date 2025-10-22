import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownwardEvaluationBusinessService } from './downward-evaluation-business.service';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationLineMapping } from '@domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { EvaluationLine } from '@domain/core/evaluation-line/evaluation-line.entity';

/**
 * 하향평가 비즈니스 모듈
 *
 * 하향평가 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationLineMapping, EvaluationLine]),
    PerformanceEvaluationContextModule,
    EvaluationCriteriaManagementContextModule,
  ],
  providers: [DownwardEvaluationBusinessService],
  exports: [DownwardEvaluationBusinessService],
})
export class DownwardEvaluationBusinessModule {}
