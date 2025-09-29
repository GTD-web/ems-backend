import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationProjectAssignmentModule } from '../../domain/core/evaluation-project-assignment/evaluation-project-assignment.module';
import { EvaluationWbsAssignmentModule } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.module';
import { WbsEvaluationCriteriaModule } from '../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.module';
import { EvaluationLineModule } from '../../domain/core/evaluation-line/evaluation-line.module';
import { EvaluationLineMappingModule } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module';
import { EvaluationCriteriaManagementService } from './evaluation-criteria-management.service';

/**
 * 평가기준관리 컨텍스트 모듈
 *
 * 평가 기준 설정과 관련된 모든 기능을 통합 관리하는 컨텍스트입니다.
 * - 프로젝트 할당 관리
 * - WBS 할당 관리
 * - WBS 평가 기준 관리
 * - 평가 라인 관리
 * - 평가 라인 매핑 관리
 *
 * CQRS 패턴을 사용하여 명령과 조회를 분리하여 처리합니다.
 */
@Module({
  imports: [
    CqrsModule,
    EvaluationProjectAssignmentModule,
    EvaluationWbsAssignmentModule,
    WbsEvaluationCriteriaModule,
    EvaluationLineModule,
    EvaluationLineMappingModule,
  ],
  providers: [
    EvaluationCriteriaManagementService,
    // TODO: Command Handlers 추가
    // TODO: Query Handlers 추가
  ],
  exports: [EvaluationCriteriaManagementService],
})
export class EvaluationCriteriaManagementContextModule {}
