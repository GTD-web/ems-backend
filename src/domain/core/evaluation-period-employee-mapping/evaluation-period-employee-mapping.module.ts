import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationPeriodEmployeeMapping } from './evaluation-period-employee-mapping.entity';
import { EvaluationPeriodEmployeeMappingService } from './evaluation-period-employee-mapping.service';

/**
 * 평가기간-직원 맵핑 모듈
 * 평가기간별 평가 대상자 관리 기능을 제공합니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationPeriodEmployeeMapping])],
  providers: [EvaluationPeriodEmployeeMappingService],
  exports: [EvaluationPeriodEmployeeMappingService],
})
export class EvaluationPeriodEmployeeMappingModule {}

