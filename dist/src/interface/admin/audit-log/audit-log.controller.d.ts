import { QueryBus } from '@nestjs/cqrs';
import { AuditLogListResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
import { GetAuditLogListQueryDto } from '@interface/common/dto/audit-log/get-audit-log-list-query.dto';
import { AuditLogResponseDto } from '@interface/common/dto/audit-log/audit-log-response.dto';
export declare class AuditLogController {
    private readonly queryBus;
    constructor(queryBus: QueryBus);
    getAuditLogs(queryDto: GetAuditLogListQueryDto): Promise<AuditLogListResponseDto>;
    getAuditLogDetail(id: string): Promise<AuditLogResponseDto>;
}
