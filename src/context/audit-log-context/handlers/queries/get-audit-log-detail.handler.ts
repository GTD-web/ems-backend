import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';

export class audit로그상세를조회한다 {
  constructor(public readonly id: string) {}
}

@Injectable()
@QueryHandler(audit로그상세를조회한다)
export class GetAuditLogDetailHandler
  implements IQueryHandler<audit로그상세를조회한다, AuditLogDto | null>
{
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async execute(query: audit로그상세를조회한다): Promise<AuditLogDto | null> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id: query.id },
    });

    return auditLog ? auditLog.DTO로_변환한다() : null;
  }
}
