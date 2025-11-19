import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecondaryEvaluationStepApproval } from './secondary-evaluation-step-approval.entity';
import { SecondaryEvaluationStepApprovalService } from './secondary-evaluation-step-approval.service';

/**
 * 2차 평가자별 단계 승인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([SecondaryEvaluationStepApproval])],
  providers: [SecondaryEvaluationStepApprovalService],
  exports: [SecondaryEvaluationStepApprovalService],
})
export class SecondaryEvaluationStepApprovalModule {}

