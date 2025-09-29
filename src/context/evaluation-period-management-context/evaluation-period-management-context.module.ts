import { Module } from '@nestjs/common';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriodManagementService } from './evaluation-period-management.service';

/**
 * 평가 기간 관리 컨텍스트 모듈
 *
 * 평가 기간의 생성, 수정, 삭제, 상태 관리 등의 기능을 제공합니다.
 */
@Module({
  imports: [EvaluationPeriodModule],
  providers: [EvaluationPeriodManagementService],
  exports: [EvaluationPeriodManagementService],
})
export class EvaluationPeriodManagementContextModule {}
