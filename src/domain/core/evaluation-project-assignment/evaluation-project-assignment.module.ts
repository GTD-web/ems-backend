import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationProjectAssignment } from './evaluation-project-assignment.entity';

/**
 * 평가 프로젝트 할당 모듈
 *
 * 평가기간에 직원에게 할당된 프로젝트를 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationProjectAssignment])],
  providers: [],
  exports: [TypeOrmModule],
})
export class EvaluationProjectAssignmentModule {}
