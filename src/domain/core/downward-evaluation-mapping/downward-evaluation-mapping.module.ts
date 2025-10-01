import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownwardEvaluationMapping } from './downward-evaluation-mapping.entity';
import { DownwardEvaluationMappingService } from './downward-evaluation-mapping.service';

/**
 * 하향평가 매핑 모듈
 * 하향평가 매핑 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([DownwardEvaluationMapping])],
  providers: [DownwardEvaluationMappingService],
  exports: [DownwardEvaluationMappingService],
})
export class DownwardEvaluationMappingModule {}
