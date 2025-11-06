import { Module } from '@nestjs/common';
import { StepApprovalController } from './step-approval.controller';
import { StepApprovalContextModule } from '@context/step-approval-context';
import { WbsSelfEvaluationBusinessModule } from '@business/wbs-self-evaluation/wbs-self-evaluation-business.module';

/**
 * 단계 승인 모듈
 */
@Module({
  imports: [StepApprovalContextModule, WbsSelfEvaluationBusinessModule],
  controllers: [StepApprovalController],
})
export class StepApprovalModule {}
