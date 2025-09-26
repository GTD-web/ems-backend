import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EvaluationPeriod } from './evaluation-period.entity';
import { EvaluationPeriodService } from './evaluation-period.service';
import { EvaluationPeriodValidationService } from './evaluation-period-validation.service';

/**
 * 평가 기간 도메인 모듈
 * 평가 기간의 생명주기와 상태를 관리하는 도메인 모듈입니다.
 */
@Module({
  imports: [TypeOrmModule.forFeature([EvaluationPeriod])],
  providers: [
    EvaluationPeriodService,
    EvaluationPeriodValidationService,
    {
      provide: 'IEvaluationPeriodService',
      useClass: EvaluationPeriodService,
    },
  ],
  exports: [
    EvaluationPeriodService,
    EvaluationPeriodValidationService,
    'IEvaluationPeriodService',
  ],
})
export class EvaluationPeriodModule {}
