import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationLineMapping } from './evaluation-line-mapping.entity';
import { EvaluationLineMappingService } from './evaluation-line-mapping.service';
import { EvaluationLineMappingValidationService } from './evaluation-line-mapping-validation.service';

/**
 * 평가 라인 맵핑 모듈 (MVP 버전)
 * 평가 라인과 관련 엔티티 간의 관계를 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationLineMapping])],
  providers: [
    EvaluationLineMappingService,
    EvaluationLineMappingValidationService,
  ],
  exports: [
    EvaluationLineMappingService,
    EvaluationLineMappingValidationService,
  ],
})
export class EvaluationLineMappingModule {}
