import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationWbsAssignment } from './evaluation-wbs-assignment.entity';

/**
 * 평가 WBS 할당 모듈
 *
 * 평가기간에 직원에게 할당된 WBS 항목을 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationWbsAssignment])],
  providers: [],
  exports: [TypeOrmModule],
})
export class EvaluationWbsAssignmentModule {}
