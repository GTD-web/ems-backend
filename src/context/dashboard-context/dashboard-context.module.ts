import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationPeriodEmployeeMapping } from '../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.entity';
import { Employee } from '../../domain/common/employee/employee.entity';
import { EvaluationProjectAssignment } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.entity';
import { EvaluationWbsAssignment } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { WbsEvaluationCriteria } from '../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.entity';
import { EvaluationLine } from '../../domain/core/evaluation-line/evaluation-line.entity';
import { EvaluationLineMapping } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.entity';
import { WbsSelfEvaluation } from '../../domain/core/wbs-self-evaluation/wbs-self-evaluation.entity';
import { DownwardEvaluation } from '../../domain/core/downward-evaluation/downward-evaluation.entity';
import { PeerEvaluation } from '../../domain/core/peer-evaluation/peer-evaluation.entity';
import { FinalEvaluation } from '../../domain/core/final-evaluation/final-evaluation.entity';
import { QUERY_HANDLERS } from './handlers/queries';

/**
 * 대시보드 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 평가 관련 대시보드 정보 조회 기능을 제공합니다.
 * 평가 기간 요약, 부서별 진행 현황, 개인 대시보드 등의 정보를 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      EvaluationPeriod,
      EvaluationPeriodEmployeeMapping,
      Employee,
      EvaluationProjectAssignment,
      EvaluationWbsAssignment,
      WbsEvaluationCriteria,
      EvaluationLine,
      EvaluationLineMapping,
      WbsSelfEvaluation,
      DownwardEvaluation,
      PeerEvaluation,
      FinalEvaluation,
    ]),
  ],
  providers: [DashboardService, ...QUERY_HANDLERS],
  exports: [DashboardService],
})
export class DashboardContextModule {}
