import { Module } from '@nestjs/common';
import { QuestionGroupModule } from './question-group/question-group.module';
import { EvaluationQuestionModule } from './evaluation-question/evaluation-question.module';
import { QuestionGroupMappingModule } from './question-group-mapping/question-group-mapping.module';
import { EvaluationResponseModule } from './evaluation-response/evaluation-response.module';
import { EmployeeEvaluationStepApprovalModule } from './employee-evaluation-step-approval/employee-evaluation-step-approval.module';
import { SecondaryEvaluationStepApprovalModule } from './secondary-evaluation-step-approval/secondary-evaluation-step-approval.module';
import { EvaluationRevisionRequestModule } from './evaluation-revision-request/evaluation-revision-request.module';

/**
 * Sub 도메인 모듈
 *
 * 핵심 평가 기능을 지원하는 부가적인 기능 관련 모든 모듈을 통합하여 제공합니다.
 * 질문 관리, 응답 관리, 단계별 승인 관리, 재작성 요청 관리 등의 유연한 확장 기능을 담당합니다.
 */
@Module({
  imports: [
    QuestionGroupModule,
    EvaluationQuestionModule,
    QuestionGroupMappingModule,
    EvaluationResponseModule,
    EmployeeEvaluationStepApprovalModule,
    SecondaryEvaluationStepApprovalModule,
    EvaluationRevisionRequestModule,
  ],
  exports: [
    QuestionGroupModule,
    EvaluationQuestionModule,
    QuestionGroupMappingModule,
    EvaluationResponseModule,
    EmployeeEvaluationStepApprovalModule,
    SecondaryEvaluationStepApprovalModule,
    EvaluationRevisionRequestModule,
  ],
})
export class SubDomainModule {}
