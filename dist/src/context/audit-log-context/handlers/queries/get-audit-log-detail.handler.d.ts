import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';
export declare class GetAuditLogDetailQuery {
    readonly id: string;
    constructor(id: string);
}
export declare class GetAuditLogDetailHandler implements IQueryHandler<GetAuditLogDetailQuery, AuditLogDto | null> {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    execute(query: GetAuditLogDetailQuery): Promise<AuditLogDto | null>;
}
