import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { QuestionGroupModule } from '../../domain/sub/question-group/question-group.module';
import { EvaluationQuestionModule } from '../../domain/sub/evaluation-question/evaluation-question.module';
import { QuestionGroupMappingModule } from '../../domain/sub/question-group-mapping/question-group-mapping.module';
import { EvaluationResponseModule } from '../../domain/sub/evaluation-response/evaluation-response.module';
import { EvaluationQuestionManagementService } from './evaluation-question-management.service';
import { COMMAND_HANDLERS, QUERY_HANDLERS } from './handlers';

/**
 * 평가 질문 관리 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 평가 질문, 질문 그룹, 질문-그룹 매핑, 평가 응답 관리 기능을 제공합니다.
 * - 질문 그룹: 평가 질문을 그룹으로 관리
 * - 평가 질문: 평가에 사용되는 질문 관리
 * - 질문-그룹 매핑: 질문과 그룹의 N:M 관계 관리
 * - 평가 응답: 평가 질문에 대한 응답 관리
 */
@Module({
  imports: [
    CqrsModule,
    QuestionGroupModule,
    EvaluationQuestionModule,
    QuestionGroupMappingModule,
    EvaluationResponseModule,
  ],
  providers: [
    EvaluationQuestionManagementService,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
  ],
  exports: [EvaluationQuestionManagementService],
})
export class EvaluationQuestionManagementContextModule {}

