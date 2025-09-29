import { Module } from '@nestjs/common';
import { DeliverableModule } from './deliverable/deliverable.module';
import { DeliverableMappingModule } from './deliverable-mapping/deliverable-mapping.module';
import { DownwardEvaluationModule } from './downward-evaluation/downward-evaluation.module';
import { DownwardEvaluationMappingModule } from './downward-evaluation-mapping/downward-evaluation-mapping.module';
import { EmployeeEvaluationStatusModule } from './employee-evaluation-status/employee-evaluation-status.module';
import { EmployeeEvaluationStatusMappingModule } from './employee-evaluation-status-mapping/employee-evaluation-status-mapping.module';
import { EvaluationLineModule } from './evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from './evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationPeriodModule } from './evaluation-period/evaluation-period.module';
import { PeerEvaluationModule } from './peer-evaluation/peer-evaluation.module';
import { PeerEvaluationMappingModule } from './peer-evaluation-mapping/peer-evaluation-mapping.module';
import { WbsEvaluationCriteriaModule } from './wbs-evaluation-criteria/wbs-evaluation-criteria.module';
import { WbsEvaluationModule } from './wbs-self-evaluation/wbs-self-evaluation.module';
import { WbsSelfEvaluationMappingModule } from './wbs-self-evaluation-mapping/wbs-self-evaluation-mapping.module';
import { EvaluationProjectAssignmentModule } from './evaluation-project-assignment';
import { EvaluationWbsAssignmentModule } from './evaluation-wbs-assignment';

/**
 * 코어 도메인 모듈
 *
 * 코어 도메인 관련 모든 모듈을 통합하여 제공합니다.
 */
@Module({
  imports: [
    // 평가 기간 및 설정 관리
    EvaluationPeriodModule,
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,

    // 평가 기준 관리
    WbsEvaluationCriteriaModule,

    // 평가자 및 상태 관리
    EvaluationLineModule,
    EmployeeEvaluationStatusModule,

    // 평가 데이터 관리
    WbsEvaluationModule,
    DownwardEvaluationModule,
    PeerEvaluationModule,

    // 산출물 관리
    DeliverableModule,

    // 매핑 테이블 관리
    EvaluationLineMappingModule,
    EmployeeEvaluationStatusMappingModule,
    WbsSelfEvaluationMappingModule,
    DownwardEvaluationMappingModule,
    PeerEvaluationMappingModule,
    DeliverableMappingModule,
  ],
  exports: [
    // 평가 기간 및 설정 관리
    EvaluationPeriodModule,
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,

    // 평가 기준 관리
    WbsEvaluationCriteriaModule,

    // 평가자 및 상태 관리
    EvaluationLineModule,
    EmployeeEvaluationStatusModule,

    // 평가 데이터 관리
    WbsEvaluationModule,
    DownwardEvaluationModule,
    PeerEvaluationModule,

    // 산출물 관리
    DeliverableModule,

    // 매핑 테이블 관리
    EvaluationLineMappingModule,
    EmployeeEvaluationStatusMappingModule,
    WbsSelfEvaluationMappingModule,
    DownwardEvaluationMappingModule,
    PeerEvaluationMappingModule,
    DeliverableMappingModule,
  ],
})
export class CoreDomainModule {}
