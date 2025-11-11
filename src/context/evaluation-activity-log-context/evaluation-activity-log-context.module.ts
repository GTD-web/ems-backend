import { Module } from '@nestjs/common';
import { CoreDomainModule } from '@domain/core/core-domain.module';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import { EvaluationActivityLogContextService } from './evaluation-activity-log-context.service';

/**
 * 평가 활동 내역 컨텍스트 모듈
 * 평가 활동 내역 저장 및 조회 비즈니스 로직을 담당합니다.
 */
@Module({
  imports: [CoreDomainModule, CommonDomainModule],
  providers: [EvaluationActivityLogContextService],
  exports: [EvaluationActivityLogContextService],
})
export class EvaluationActivityLogContextModule {}
