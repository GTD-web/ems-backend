import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';

export class GetAuditLogDetailQuery {
  constructor(public readonly id: string) {}
}

@Injectable()
@QueryHandler(GetAuditLogDetailQuery)
export class GetAuditLogDetailHandler
  implements IQueryHandler<GetAuditLogDetailQuery, AuditLogDto | null>
{
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async execute(query: GetAuditLogDetailQuery): Promise<AuditLogDto | null> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id: query.id },
    });

    return auditLog ? auditLog.DTO로_변환한다() : null;
  }
}
