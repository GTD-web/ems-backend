import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationWbsAssignment } from './evaluation-wbs-assignment.entity';
import { EvaluationWbsAssignmentService } from './evaluation-wbs-assignment.service';
import { EvaluationWbsAssignmentValidationService } from './evaluation-wbs-assignment-validation.service';

/**
 * 평가 WBS 할당 모듈
 *
 * 평가기간에 직원에게 할당된 WBS 항목을 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationWbsAssignment]),
    DatabaseModule,
  ],
  providers: [
    EvaluationWbsAssignmentService,
    EvaluationWbsAssignmentValidationService,
  ],
  exports: [
    TypeOrmModule,
    EvaluationWbsAssignmentService,
    EvaluationWbsAssignmentValidationService,
  ],
})
export class EvaluationWbsAssignmentModule {}
