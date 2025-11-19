import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogFilter, AuditLogListResult } from '../../interfaces/audit-log-context.interface';
export declare class audit로그목록을조회한다 {
    readonly filter: AuditLogFilter;
    readonly page: number;
    readonly limit: number;
    constructor(filter: AuditLogFilter, page?: number, limit?: number);
}
export declare class GetAuditLogListHandler implements IQueryHandler<audit로그목록을조회한다, AuditLogListResult> {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    execute(query: audit로그목록을조회한다): Promise<AuditLogListResult>;
}
