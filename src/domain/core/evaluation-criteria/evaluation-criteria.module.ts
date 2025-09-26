import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationCriteria } from './evaluation-criteria.entity';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EvaluationCriteriaValidationService } from './evaluation-criteria-validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([EvaluationCriteria])],
  providers: [EvaluationCriteriaService, EvaluationCriteriaValidationService],
  exports: [EvaluationCriteriaService],
})
export class EvaluationCriteriaModule {}
