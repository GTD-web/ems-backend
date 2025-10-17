import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CqrsModule } from '@nestjs/cqrs';
import { TestContextService } from './test-context.service';
import { DepartmentTestModule } from '../../domain/common/department/department-test.module';
import { EmployeeTestModule } from '../../domain/common/employee/employee-test.module';
import { ProjectTestModule } from '../../domain/common/project/project-test.module';
import { WbsItemTestModule } from '../../domain/common/wbs-item/wbs-item-test.module';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { EvaluationWbsAssignment } from '../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity';
import { QuestionGroup } from '../../domain/sub/question-group/question-group.entity';
import { EvaluationQuestion } from '../../domain/sub/evaluation-question/evaluation-question.entity';
import { QuestionGroupMapping } from '../../domain/sub/question-group-mapping/question-group-mapping.entity';
import { COMMAND_HANDLERS } from './commands';
import { QUERY_HANDLERS } from './queries';

/**
 * 테스트용 컨텍스트 모듈
 *
 * 테스트 시 사용할 통합 목데이터 생성 및 관리 기능을 제공합니다.
 * 부서, 직원, 프로젝트, WBS 항목, 평가기간을 연관지어 생성할 수 있습니다.
 * 실제 운영 환경에서는 사용하지 않습니다.
 *
 * CQRS 패턴을 사용하여 Command와 Query를 분리합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      EvaluationPeriod,
      EvaluationWbsAssignment,
      QuestionGroup,
      EvaluationQuestion,
      QuestionGroupMapping,
    ]),
    DepartmentTestModule,
    EmployeeTestModule,
    ProjectTestModule,
    WbsItemTestModule,
  ],
  providers: [TestContextService, ...COMMAND_HANDLERS, ...QUERY_HANDLERS],
  exports: [TestContextService],
})
export class TestContextModule {}
