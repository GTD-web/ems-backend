import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RevisionRequestContextModule } from '@context/revision-request-context/revision-request-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { RevisionRequestBusinessService } from './revision-request-business.service';

/**
 * 재작성 요청 비즈니스 모듈
 *
 * 재작성 요청 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    RevisionRequestContextModule,
    EvaluationActivityLogContextModule,
  ],
  providers: [RevisionRequestBusinessService],
  exports: [RevisionRequestBusinessService],
})
export class RevisionRequestBusinessModule {}

