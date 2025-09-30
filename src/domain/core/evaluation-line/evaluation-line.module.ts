import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationLine } from './evaluation-line.entity';
import { EvaluationLineService } from './evaluation-line.service';
import { EvaluationLineValidationService } from './evaluation-line-validation.service';

/**
 * 평가 라인 모듈 (MVP 버전)
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationLine])],
  providers: [EvaluationLineService, EvaluationLineValidationService],
  exports: [EvaluationLineService, EvaluationLineValidationService],
})
export class EvaluationLineModule {}
