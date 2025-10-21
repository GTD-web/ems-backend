import { Module } from '@nestjs/common';
import { DomainContextModule } from '../../context/domain-context.module';
import { AuthContextModule } from '../../context/auth-context/auth-context.module';
import { EvaluationPeriodManagementContextModule } from '../../context/evaluation-period-management-context/evaluation-period-management-context.module';
import { EvaluationCriteriaManagementContextModule } from '../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { PerformanceEvaluationContextModule } from '../../context/performance-evaluation-context/performance-evaluation-context.module';
import { OrganizationManagementContextModule } from '../../context/organization-management-context/organization-management-context.module';
import { DashboardContextModule } from '../../context/dashboard-context/dashboard-context.module';
import { EvaluationQuestionManagementContextModule } from '../../context/evaluation-question-management-context/evaluation-question-management-context.module';
import { SeedDataContextModule } from '../../context/seed-data-context/seed-data-context.module';
import { BusinessModule } from '../../business/business.module';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EmployeeModule } from '../../domain/common/employee/employee.module';
import { AuthController } from './auth/auth.controller';
import { DashboardController } from './dashboard/dashboard.controller';
import { EvaluationPeriodManagementController } from './evaluation-period/evaluation-period-management.controller';
import { EvaluationTargetController } from './evaluation-period/evaluation-target.controller';
import { ProjectAssignmentManagementController } from './evaluation-criteria/project-assignment-management.controller';
import { WbsAssignmentManagementController } from './evaluation-criteria/wbs-assignment-management.controller';
import { EvaluationLineManagementController } from './evaluation-criteria/evaluation-line-management.controller';
import { WbsEvaluationCriteriaManagementController } from './evaluation-criteria/wbs-evaluation-criteria-management.controller';
import { WbsSelfEvaluationManagementController } from './performance-evaluation/wbs-self-evaluation-management.controller';
import { DownwardEvaluationManagementController } from './performance-evaluation/downward-evaluation-management.controller';
import { PeerEvaluationManagementController } from './performance-evaluation/peer-evaluation-management.controller';
import { FinalEvaluationManagementController } from './performance-evaluation/final-evaluation-management.controller';
import { EvaluationEditableStatusManagementController } from './performance-evaluation/evaluation-editable-status-management.controller';
import { EvaluationQuestionManagementController } from './performance-evaluation/evaluation-question-management.controller';
import { DeliverableManagementController } from './performance-evaluation/deliverable-management.controller';
import { EmployeeManagementController } from './employee-management/employee-management.controller';
import { SeedDataController } from './seed-data/seed-data.controller';

/**
 * 관리자 인터페이스 모듈
 *
 * 관리자 권한이 필요한 API 엔드포인트들을 제공합니다.
 * 도메인 컨텍스트를 주입받아 비즈니스 로직을 처리합니다.
 */
@Module({
  imports: [
    DomainContextModule, // 도메인 컨텍스트 모듈 주입
    AuthContextModule, // 인증 컨텍스트 모듈 주입
    EvaluationPeriodManagementContextModule, // 평가 기간 관리 컨텍스트 모듈 주입
    EvaluationCriteriaManagementContextModule, // 평가기준 관리 컨텍스트 모듈 주입
    PerformanceEvaluationContextModule, // 성과평가 컨텍스트 모듈 주입
    OrganizationManagementContextModule, // 조직 관리 컨텍스트 모듈 주입
    DashboardContextModule, // 대시보드 컨텍스트 모듈 주입
    EvaluationQuestionManagementContextModule, // 평가 질문 관리 컨텍스트 모듈 주입
    SeedDataContextModule, // 시드 데이터 컨텍스트 모듈 주입
    BusinessModule, // 비즈니스 레이어 모듈 주입
    EvaluationPeriodModule, // 평가 기간 모듈 주입
    EmployeeModule, // 직원 모듈 주입
  ],
  controllers: [
    AuthController, // 인증 컨트롤러
    DashboardController, // 대시보드 컨트롤러
    EvaluationPeriodManagementController, // 평가 기간 관리 컨트롤러
    EvaluationTargetController, // 평가 대상 관리 컨트롤러
    EmployeeManagementController, // 직원 관리 컨트롤러
    ProjectAssignmentManagementController, // 프로젝트 할당 관리 컨트롤러
    WbsAssignmentManagementController, // WBS 할당 관리 컨트롤러
    EvaluationLineManagementController, // 평가라인 관리 컨트롤러
    WbsEvaluationCriteriaManagementController, // WBS 평가기준 관리 컨트롤러
    WbsSelfEvaluationManagementController, // WBS 자기평가 관리 컨트롤러
    DownwardEvaluationManagementController, // 하향평가 관리 컨트롤러
    PeerEvaluationManagementController, // 동료평가 관리 컨트롤러
    FinalEvaluationManagementController, // 최종평가 관리 컨트롤러
    EvaluationEditableStatusManagementController, // 평가 수정 가능 상태 관리 컨트롤러
    EvaluationQuestionManagementController, // 평가 질문 관리 컨트롤러
    DeliverableManagementController, // 산출물 관리 컨트롤러
    SeedDataController, // 시드 데이터 컨트롤러
  ],
  providers: [],
  exports: [],
})
export class AdminInterfaceModule {}
