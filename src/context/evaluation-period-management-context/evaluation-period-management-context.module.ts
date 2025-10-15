import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationPeriodModule } from '../../domain/core/evaluation-period/evaluation-period.module';
import { EvaluationPeriodEmployeeMappingModule } from '../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.module';
import { EvaluationPeriod } from '../../domain/core/evaluation-period/evaluation-period.entity';
import { Employee } from '../../domain/common/employee/employee.entity';
import { EvaluationPeriodManagementContextService } from './evaluation-period-management.service';
import { COMMAND_HANDLERS, QUERY_HANDLERS } from './handlers';

/**
 * 평가 기간 관리 컨텍스트 모듈
 *
 * CQRS 패턴을 사용하여 평가 기간의 생성, 수정, 삭제, 상태 관리 및 평가 대상자 관리 기능을 제공합니다.
 */
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([EvaluationPeriod, Employee]),
    EvaluationPeriodModule,
    EvaluationPeriodEmployeeMappingModule,
  ],
  providers: [
    EvaluationPeriodManagementContextService,
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
  ],
  exports: [EvaluationPeriodManagementContextService],
})
export class EvaluationPeriodManagementContextModule {}
