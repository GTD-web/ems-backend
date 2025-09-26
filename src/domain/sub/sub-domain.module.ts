import { Module } from '@nestjs/common';
import { QuestionGroupModule } from './question-group/question-group.module';
import { EvaluationQuestionModule } from './evaluation-question/evaluation-question.module';
import { EvaluationResponseModule } from './evaluation-response/evaluation-response.module';

/**
 * Sub 도메인 모듈
 *
 * 핵심 평가 기능을 지원하는 부가적인 기능 관련 모든 모듈을 통합하여 제공합니다.
 * 질문 관리, 응답 관리 등의 유연한 확장 기능을 담당합니다.
 */
@Module({
  imports: [
    QuestionGroupModule,
    EvaluationQuestionModule,
    EvaluationResponseModule,
  ],
  exports: [
    QuestionGroupModule,
    EvaluationQuestionModule,
    EvaluationResponseModule,
  ],
})
export class SubDomainModule {}
