import { Module } from '@nestjs/common';
import { EvaluationTargetBusinessService } from './evaluation-target-business.service';
import { DomainContextModule } from '../../context/domain-context.module';
import { EvaluationLineMappingModule } from '../../domain/core/evaluation-line-mapping/evaluation-line-mapping.module';

/**
 * 평가 대상 비즈니스 모듈
 *
 * 평가 대상자 관련 비즈니스 로직의 오케스트레이션을 담당하는 모듈입니다.
 * Context 레이어의 서비스들을 조합하여 비즈니스 로직을 제공합니다.
 */
@Module({
  imports: [DomainContextModule, EvaluationLineMappingModule],
  providers: [EvaluationTargetBusinessService],
  exports: [EvaluationTargetBusinessService],
})
export class EvaluationTargetBusinessModule {}
