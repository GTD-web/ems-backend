import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PeerEvaluation } from './peer-evaluation.entity';
import { PeerEvaluationService } from './peer-evaluation.service';

/**
 * 동료평가 모듈
 * 동료평가 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([PeerEvaluation])],
  providers: [PeerEvaluationService],
  exports: [PeerEvaluationService],
})
export class PeerEvaluationModule {}
