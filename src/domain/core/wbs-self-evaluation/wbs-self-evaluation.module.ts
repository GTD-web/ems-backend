import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsSelfEvaluation } from './wbs-self-evaluation.entity';
import { WbsSelfEvaluationService } from './wbs-self-evaluation.service';

/**
 * WBS 자가평가 모듈
 * WBS 자가평가 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([WbsSelfEvaluation])],
  providers: [WbsSelfEvaluationService],
  exports: [WbsSelfEvaluationService],
})
export class WbsSelfEvaluationModule {}
