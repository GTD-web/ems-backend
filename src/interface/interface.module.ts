import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AdminInterfaceModule } from './admin/admin-interface.module';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import { AuthContextModule } from '@context/auth-context';
import { AuditLogContextModule } from '@context/audit-log-context/audit-log-context.module';
import { OrganizationManagementContextModule } from '@context/organization-management-context';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { UserInterfaceModule } from './user/user-interface.module';

/**
 * 인터페이스 모듈
 *
 * 모든 API 인터페이스 모듈들을 통합 관리합니다.
 * - 관리자 인터페이스
 * - 사용자 인터페이스 (향후 추가)
 * - 공개 인터페이스 (향후 추가)
 *
 * JWT 인증 가드와 Audit 로그 인터셉터를 전역으로 적용합니다.
 */
@Module({
  imports: [
    CommonDomainModule, // SSO 서비스 사용을 위한 도메인 모듈
    AuthContextModule, // Auth Context 모듈 (JWT 인증 가드에서 사용)
    AuditLogContextModule, // Audit 로그 컨텍스트 모듈
    OrganizationManagementContextModule, // 조직 관리 컨텍스트 모듈 (RolesGuard에서 사용)
    AdminInterfaceModule, // 관리자 인터페이스 모듈
    UserInterfaceModule, // 사용자 인터페이스 모듈
    // PublicInterfaceModule, // TODO: 공개 인터페이스 모듈 (향후 추가)
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // JWT 인증 가드를 전역으로 적용
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor, // Audit 로그 인터셉터를 전역으로 적용
    },
  ],
  exports: [
    AdminInterfaceModule,
    // UserInterfaceModule,
    // PublicInterfaceModule,
  ],
})
export class InterfaceModule {}
