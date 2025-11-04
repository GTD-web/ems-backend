import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEvaluationStepApproval } from './employee-evaluation-step-approval.entity';
import { EmployeeEvaluationStepApprovalService } from './employee-evaluation-step-approval.service';

/**
 * 직원 평가 단계 승인 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEvaluationStepApproval])],
  providers: [EmployeeEvaluationStepApprovalService],
  exports: [EmployeeEvaluationStepApprovalService],
})
export class EmployeeEvaluationStepApprovalModule {}


