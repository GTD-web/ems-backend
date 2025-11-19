import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonDomainModule } from '@domain/common/common-domain.module';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import {
  CreateAuditLogHandler,
  GetAuditLogListHandler,
  GetAuditLogDetailHandler,
} from './handlers';

/**
 * Audit 로그 컨텍스트 모듈
 *
 * Audit 로그 생성 및 조회 비즈니스 로직을 담당합니다.
 * Command와 Query는 모두 CommandBus/QueryBus를 통해 직접 사용합니다.
 */
@Module({
  imports: [
    CqrsModule,
    CommonDomainModule,
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [
    CreateAuditLogHandler,
    GetAuditLogListHandler,
    GetAuditLogDetailHandler,
  ],
  exports: [],
})
export class AuditLogContextModule {}
