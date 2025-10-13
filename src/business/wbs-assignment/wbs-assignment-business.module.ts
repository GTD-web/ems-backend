import { Module } from '@nestjs/common';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { WbsAssignmentBusinessService } from './wbs-assignment-business.service';

/**
 * WBS 할당 비즈니스 모듈
 */
@Module({
  imports: [EvaluationCriteriaManagementContextModule],
  providers: [WbsAssignmentBusinessService],
  exports: [WbsAssignmentBusinessService],
})
export class WbsAssignmentBusinessModule {}
