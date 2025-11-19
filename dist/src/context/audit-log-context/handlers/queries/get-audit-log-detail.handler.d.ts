import { IQueryHandler } from '@nestjs/cqrs';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogDto } from '@domain/common/audit-log/audit-log.types';
export declare class audit로그상세를조회한다 {
    readonly id: string;
    constructor(id: string);
}
export declare class GetAuditLogDetailHandler implements IQueryHandler<audit로그상세를조회한다, AuditLogDto | null> {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    execute(query: audit로그상세를조회한다): Promise<AuditLogDto | null>;
}
