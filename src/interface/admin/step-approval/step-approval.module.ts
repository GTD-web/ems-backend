import { Module } from '@nestjs/common';
import { StepApprovalController } from './step-approval.controller';
import { StepApprovalContextModule } from '@context/step-approval-context';

/**
 * 단계 승인 모듈
 */
@Module({
  imports: [StepApprovalContextModule],
  controllers: [StepApprovalController],
})
export class StepApprovalModule {}


