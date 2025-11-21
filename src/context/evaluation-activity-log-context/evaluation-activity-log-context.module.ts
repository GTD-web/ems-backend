import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreDomainModule } from '@domain/core/core-domain.module';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import {
  CreateEvaluationActivityLogHandler,
  CreateStepApprovalActivityLogHandler,
  CreateRevisionCompletedActivityLogHandler,
  GetEvaluationActivityLogListHandler,
} from './handlers';

/**
 * 평가 활동 내역 컨텍스트 모듈
 *
 * 평가 활동 내역 저장 및 조회 비즈니스 로직을 담당합니다.
 * Command와 Query는 모두 CommandBus/QueryBus를 통해 직접 사용합니다.
 */
@Module({
  imports: [CqrsModule, CoreDomainModule, CommonDomainModule],
  providers: [
    CreateEvaluationActivityLogHandler,
    CreateStepApprovalActivityLogHandler,
    CreateRevisionCompletedActivityLogHandler,
    GetEvaluationActivityLogListHandler,
  ],
  exports: [],
})
export class EvaluationActivityLogContextModule {}
