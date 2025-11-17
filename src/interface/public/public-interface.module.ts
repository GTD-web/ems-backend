import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EvaluationPeriodModule } from '@domain/core/evaluation-period/evaluation-period.module';
import { OrganizationManagementContextModule } from '@context/organization-management-context';
import { CronController } from './cron.controller';

/**
 * Public 인터페이스 모듈
 *
 * 인증이 필요 없는 공개 API 엔드포인트들을 제공합니다.
 * - 크론 작업 엔드포인트
 * - 헬스 체크 등
 */
@Module({
  imports: [
    ConfigModule,
    EvaluationPeriodModule, // EvaluationPeriodAutoPhaseService 사용
    OrganizationManagementContextModule, // EmployeeSyncService, DepartmentSyncService 사용
  ],
  controllers: [CronController],
  providers: [],
  exports: [],
})
export class PublicInterfaceModule {}

