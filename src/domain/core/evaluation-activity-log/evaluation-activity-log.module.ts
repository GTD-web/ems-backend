import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationActivityLog } from './evaluation-activity-log.entity';
import { EvaluationActivityLogService } from './evaluation-activity-log.service';

/**
 * 평가 활동 내역 모듈
 * 평가 활동 내역 관련 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationActivityLog])],
  providers: [EvaluationActivityLogService],
  exports: [EvaluationActivityLogService],
})
export class EvaluationActivityLogModule {}

