import { Module } from '@nestjs/common';
import { DomainContextModule } from '../../context/domain-context.module';
import { EvaluationPeriodManagementContextModule } from '../../context/evaluation-period-management-context/evaluation-period-management-context.module';
import { EvaluationCriteriaManagementContextModule } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { PerformanceEvaluationContextModule } from '../../context/performance-evaluation-context/performance-evaluation-context.module';
import { BusinessModule } from '../../business/business.module';
import { EvaluationPeriodManagementController } from './evaluation-period/evaluation-period-management.controller';
import { ProjectAssignmentManagementController } from './evaluation-criteria/project-assignment-management.controller';
import { WbsAssignmentManagementController } from './evaluation-criteria/wbs-assignment-management.controller';
import { EvaluationLineManagementController } from './evaluation-criteria/evaluation-line-management.controller';
import { WbsEvaluationCriteriaManagementController } from './evaluation-criteria/wbs-evaluation-criteria-management.controller';
import { WbsSelfEvaluationManagementController } from './performance-evaluation/wbs-self-evaluation-management.controller';
import { DownwardEvaluationManagementController } from './performance-evaluation/downward-evaluation-management.controller';
import { PeerEvaluationManagementController } from './performance-evaluation/peer-evaluation-management.controller';

/**
 * 관리자 인터페이스 모듈
 *
 * 관리자 권한이 필요한 API 엔드포인트들을 제공합니다.
 * 도메인 컨텍스트를 주입받아 비즈니스 로직을 처리합니다.
 */
@Module({
  imports: [
    DomainContextModule, // 도메인 컨텍스트 모듈 주입
    EvaluationPeriodManagementContextModule, // 평가 기간 관리 컨텍스트 모듈 주입
    EvaluationCriteriaManagementContextModule, // 평가기준 관리 컨텍스트 모듈 주입
    PerformanceEvaluationContextModule, // 성과평가 컨텍스트 모듈 주입
    BusinessModule, // 비즈니스 레이어 모듈 주입
  ],
  controllers: [
    EvaluationPeriodManagementController, // 평가 기간 관리 컨트롤러
    ProjectAssignmentManagementController, // 프로젝트 할당 관리 컨트롤러
    WbsAssignmentManagementController, // WBS 할당 관리 컨트롤러
    EvaluationLineManagementController, // 평가라인 관리 컨트롤러
    WbsEvaluationCriteriaManagementController, // WBS 평가기준 관리 컨트롤러
    WbsSelfEvaluationManagementController, // WBS 자기평가 관리 컨트롤러
    DownwardEvaluationManagementController, // 하향평가 관리 컨트롤러
    PeerEvaluationManagementController, // 동료평가 관리 컨트롤러
  ],
  providers: [],
  exports: [],
})
export class AdminInterfaceModule {}
