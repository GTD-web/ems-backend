import { Module } from '@nestjs/common';
import { AdminInterfaceModule } from './admin/admin-interface.module';

/**
 * 인터페이스 모듈
 * 
 * 모든 API 인터페이스 모듈들을 통합 관리합니다.
 * - 관리자 인터페이스
 * - 사용자 인터페이스 (향후 추가)
 * - 공개 인터페이스 (향후 추가)
 */
@Module({
  imports: [
    AdminInterfaceModule, // 관리자 인터페이스 모듈
    // UserInterfaceModule,   // TODO: 사용자 인터페이스 모듈 (향후 추가)
    // PublicInterfaceModule, // TODO: 공개 인터페이스 모듈 (향후 추가)
  ],
  controllers: [],
  providers: [],
  exports: [
    AdminInterfaceModule,
    // UserInterfaceModule,
    // PublicInterfaceModule,
  ],
})
export class InterfaceModule {}
