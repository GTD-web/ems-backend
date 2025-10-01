import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeerEvaluationMapping } from './peer-evaluation-mapping.entity';
import { PeerEvaluationMappingService } from './peer-evaluation-mapping.service';

/**
 * 동료평가 매핑 모듈
 * 동료평가 매핑 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PeerEvaluationMapping])],
  providers: [PeerEvaluationMappingService],
  exports: [PeerEvaluationMappingService],
})
export class PeerEvaluationMappingModule {}
