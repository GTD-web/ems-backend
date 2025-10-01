import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownwardEvaluation } from './downward-evaluation.entity';
import { DownwardEvaluationService } from './downward-evaluation.service';

/**
 * 하향평가 모듈
 * 하향평가 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DownwardEvaluation])],
  providers: [DownwardEvaluationService],
  exports: [DownwardEvaluationService],
})
export class DownwardEvaluationModule {}
