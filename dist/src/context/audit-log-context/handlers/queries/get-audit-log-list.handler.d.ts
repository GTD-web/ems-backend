import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogFilter, AuditLogListResult } from '../../interfaces/audit-log-context.interface';
export declare class GetAuditLogListQuery {
    readonly filter: AuditLogFilter;
    readonly page: number;
    readonly limit: number;
    constructor(filter: AuditLogFilter, page?: number, limit?: number);
}
export declare class GetAuditLogListHandler implements IQueryHandler<GetAuditLogListQuery, AuditLogListResult> {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    execute(query: GetAuditLogListQuery): Promise<AuditLogListResult>;
}
