import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevisionRequestContextService } from './revision-request-context.service';
import { EvaluationRevisionRequestModule } from '@domain/sub/evaluation-revision-request';
import { Employee } from '@domain/common/employee/employee.entity';
import { EvaluationPeriod } from '@domain/core/evaluation-period/evaluation-period.entity';

/**
 * 재작성 요청 컨텍스트 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, EvaluationPeriod]),
    EvaluationRevisionRequestModule,
  ],
  providers: [RevisionRequestContextService],
  exports: [RevisionRequestContextService],
})
export class RevisionRequestContextModule {}
