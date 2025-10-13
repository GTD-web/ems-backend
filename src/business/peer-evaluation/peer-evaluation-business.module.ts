import { Module } from '@nestjs/common';
import { PerformanceEvaluationContextModule } from '@context/performance-evaluation-context/performance-evaluation-context.module';
import { PeerEvaluationBusinessService } from './peer-evaluation-business.service';

/**
 * 동료평가 비즈니스 모듈
 */
@Module({
  imports: [PerformanceEvaluationContextModule],
  providers: [PeerEvaluationBusinessService],
  exports: [PeerEvaluationBusinessService],
})
export class PeerEvaluationBusinessModule {}
