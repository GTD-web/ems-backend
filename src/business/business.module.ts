import { Module } from '@nestjs/common';
import { PeerEvaluationBusinessModule } from './peer-evaluation/peer-evaluation-business.module';
import { WbsAssignmentBusinessModule } from './wbs-assignment/wbs-assignment-business.module';
import { EvaluationPeriodBusinessModule } from './evaluation-period/evaluation-period-business.module';
import { DownwardEvaluationBusinessModule } from './downward-evaluation/downward-evaluation-business.module';
import { WbsSelfEvaluationBusinessModule } from './wbs-self-evaluation/wbs-self-evaluation-business.module';
import { StepApprovalBusinessModule } from './step-approval/step-approval-business.module';
import { DeliverableBusinessModule } from './deliverable/deliverable-business.module';
import { RevisionRequestBusinessModule } from './revision-request/revision-request-business.module';

/**
 * 비즈니스 레이어 통합 모듈
 *
 * 비즈니스 로직 오케스트레이션을 담당하는 모든 비즈니스 모듈을 통합합니다.
 */
@Module({
  imports: [
    PeerEvaluationBusinessModule,
    WbsAssignmentBusinessModule,
    DownwardEvaluationBusinessModule,
    EvaluationPeriodBusinessModule,
    WbsSelfEvaluationBusinessModule,
    StepApprovalBusinessModule,
    DeliverableBusinessModule,
  ],
  exports: [
    PeerEvaluationBusinessModule,
    WbsAssignmentBusinessModule,
    DownwardEvaluationBusinessModule,
    EvaluationPeriodBusinessModule,
    WbsSelfEvaluationBusinessModule,
    StepApprovalBusinessModule,
    DeliverableBusinessModule,
    RevisionRequestBusinessModule,
  ],
})
export class BusinessModule {}
