import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { WbsEvaluationCriteria } from './wbs-evaluation-criteria.entity';
import { WbsEvaluationCriteriaService } from './wbs-evaluation-criteria.service';
import { WbsEvaluationCriteriaValidationService } from './wbs-evaluation-criteria-validation.service';

@Module({
  imports: [TypeOrmModule.forFeature([WbsEvaluationCriteria]), DatabaseModule],
  providers: [
    WbsEvaluationCriteriaService,
    WbsEvaluationCriteriaValidationService,
  ],
  exports: [
    WbsEvaluationCriteriaService,
    WbsEvaluationCriteriaValidationService,
  ],
})
export class WbsEvaluationCriteriaModule {}
