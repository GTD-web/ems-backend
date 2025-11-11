import { Module } from '@nestjs/common';
import { DeliverableModule } from './deliverable/deliverable.module';
import { DownwardEvaluationModule } from './downward-evaluation/downward-evaluation.module';
import { EvaluationLineModule } from './evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from './evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationPeriodModule } from './evaluation-period/evaluation-period.module';
import { EvaluationPeriodEmployeeMappingModule } from './evaluation-period-employee-mapping/evaluation-period-employee-mapping.module';
import { PeerEvaluationModule } from './peer-evaluation/peer-evaluation.module';
import { PeerEvaluationQuestionMappingModule } from './peer-evaluation-question-mapping/peer-evaluation-question-mapping.module';
import { FinalEvaluationModule } from './final-evaluation/final-evaluation.module';
import { WbsEvaluationCriteriaModule } from './wbs-evaluation-criteria/wbs-evaluation-criteria.module';
import { WbsSelfEvaluationModule } from './wbs-self-evaluation/wbs-self-evaluation.module';
import { EvaluationWbsAssignmentModule } from './evaluation-wbs-assignment';
import { EvaluationProjectAssignmentModule } from './evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationActivityLogModule } from './evaluation-activity-log/evaluation-activity-log.module';

/**
 * 코어 도메인 모듈
 *
 * 코어 도메인 관련 모든 모듈을 통합하여 제공합니다.
 */
@Module({
  imports: [
    // 평가 기간 및 설정 관리
    EvaluationPeriodModule,
    EvaluationPeriodEmployeeMappingModule,
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,

    // 평가 기준 관리
    WbsEvaluationCriteriaModule,

    // 평가자 및 상태 관리
    EvaluationLineModule,

    // 평가 데이터 관리
    WbsSelfEvaluationModule,
    DownwardEvaluationModule,
    PeerEvaluationModule,
    FinalEvaluationModule,

    // 산출물 관리
    DeliverableModule,

    // 평가 활동 내역 관리
    EvaluationActivityLogModule,

    // 매핑 테이블 관리
    EvaluationLineMappingModule,
    PeerEvaluationQuestionMappingModule,
  ],
  exports: [
    // 평가 기간 및 설정 관리
    EvaluationPeriodModule,
    EvaluationPeriodEmployeeMappingModule,
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,

    // 평가 기준 관리
    WbsEvaluationCriteriaModule,

    // 평가자 및 상태 관리
    EvaluationLineModule,

    // 평가 데이터 관리
    WbsSelfEvaluationModule,
    DownwardEvaluationModule,
    PeerEvaluationModule,
    FinalEvaluationModule,

    // 산출물 관리
    DeliverableModule,

    // 평가 활동 내역 관리
    EvaluationActivityLogModule,

    // 매핑 테이블 관리
    EvaluationLineMappingModule,
    PeerEvaluationQuestionMappingModule,
  ],
})
export class CoreDomainModule {}
