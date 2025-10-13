import { Module } from '@nestjs/common';
import { PeerEvaluationBusinessModule } from './peer-evaluation/peer-evaluation-business.module';

/**
 * 비즈니스 레이어 통합 모듈
 *
 * 비즈니스 로직 오케스트레이션을 담당하는 모든 비즈니스 모듈을 통합합니다.
 */
@Module({
  imports: [PeerEvaluationBusinessModule],
  exports: [PeerEvaluationBusinessModule],
})
export class BusinessModule {}
