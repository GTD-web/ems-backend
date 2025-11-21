import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EvaluationCriteriaManagementContextModule } from '@context/evaluation-criteria-management-context/evaluation-criteria-management-context.module';
import { EvaluationActivityLogContextModule } from '@context/evaluation-activity-log-context/evaluation-activity-log-context.module';
import { ProjectAssignmentBusinessService } from './project-assignment-business.service';

/**
 * 프로젝트 할당 비즈니스 모듈
 *
 * 프로젝트 할당 관련 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    EvaluationCriteriaManagementContextModule,
    EvaluationActivityLogContextModule,
  ],
  providers: [ProjectAssignmentBusinessService],
  exports: [ProjectAssignmentBusinessService],
})
export class ProjectAssignmentBusinessModule {}

