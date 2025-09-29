import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriodManagementService } from './evaluation-period-management.service';
import { COMMAND_HANDLERS } from './commands';
import { QUERY_HANDLERS } from './queries';

/**
 * 평가 기간 관리 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 평가 기간의 생성, 수정, 삭제, 상태 관리 등의 기능을 제공합니다.
 */
@Module({
  imports: [CqrsModule, EvaluationPeriodModule],
  providers: [
    EvaluationPeriodManagementService,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
  ],
  exports: [EvaluationPeriodManagementService],
})
export class EvaluationPeriodManagementContextModule {}
