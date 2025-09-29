import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@libs/database/database.module';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';
import { EvaluationProjectAssignmentService } from './evaluation-project-assignment.service';
import { EvaluationProjectAssignmentValidationService } from './evaluation-project-assignment-validation.service';

/**
 * 평가 프로젝트 할당 모듈
 *
 * 평가기간에 직원에게 할당된 프로젝트를 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EvaluationProjectAssignment]),
    DatabaseModule,
  ],
  providers: [
    EvaluationProjectAssignmentService,
    EvaluationProjectAssignmentValidationService,
  ],
  exports: [
    TypeOrmModule,
    EvaluationProjectAssignmentService,
    EvaluationProjectAssignmentValidationService,
  ],
})
export class EvaluationProjectAssignmentModule {}
