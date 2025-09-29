import { Module } from '@nestjs/common';
import { DomainContextModule } from '../../context/domain-context.module';
import { EvaluationManagementController } from './evaluation-management.controller';

/**
 * 관리자 인터페이스 모듈
 * 
 * 관리자 권한이 필요한 API 엔드포인트들을 제공합니다.
 * 도메인 컨텍스트를 주입받아 비즈니스 로직을 처리합니다.
 */
@Module({
  imports: [
    DomainContextModule, // 도메인 컨텍스트 모듈 주입
  ],
  controllers: [
    EvaluationManagementController, // 평가 관리 컨트롤러
  ],
  providers: [],
  exports: [],
})
export class AdminInterfaceModule {}
