import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogDto } from './audit-log.types';
export declare class AuditLogService {
    private readonly auditLogRepository;
    constructor(auditLogRepository: Repository<AuditLog>);
    생성한다(data: Partial<AuditLogDto>): Promise<AuditLogDto>;
}
