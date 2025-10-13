import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { FinalEvaluation } from './final-evaluation.entity';
import { FinalEvaluationService } from './final-evaluation.service';
import { FinalEvaluationValidationService } from './final-evaluation-validation.service';

/**
 * 최종평가 모듈
 *
 * 최종평가 관련 엔티티, 서비스, 검증 서비스를 제공합니다.
 */
@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([FinalEvaluation])],
  providers: [FinalEvaluationService, FinalEvaluationValidationService],
  exports: [FinalEvaluationService, FinalEvaluationValidationService],
})
export class FinalEvaluationModule {}
