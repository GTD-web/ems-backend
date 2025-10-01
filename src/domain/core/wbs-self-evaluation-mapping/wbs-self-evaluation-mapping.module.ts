import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WbsSelfEvaluationMapping } from './wbs-self-evaluation-mapping.entity';
import { WbsSelfEvaluationMappingService } from './wbs-self-evaluation-mapping.service';

/**
 * WBS 자가평가 매핑 모듈
 * WBS 자가평가 매핑 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([WbsSelfEvaluationMapping])],
  providers: [WbsSelfEvaluationMappingService],
  exports: [WbsSelfEvaluationMappingService],
})
export class WbsSelfEvaluationMappingModule {}
