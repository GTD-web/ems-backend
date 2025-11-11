import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';
import { GetAuditLogListQueryDto } from './dto/get-audit-log-list-query.dto';
import { AuditLogResponseDto, AuditLogListResponseDto } from './dto/audit-log-response.dto';
export declare class AuditLogController {
    private readonly auditLogContextService;
    constructor(auditLogContextService: AuditLogContextService);
    getAuditLogs(query: GetAuditLogListQueryDto): Promise<AuditLogListResponseDto>;
    getAuditLogDetail(id: string): Promise<AuditLogResponseDto>;
}
