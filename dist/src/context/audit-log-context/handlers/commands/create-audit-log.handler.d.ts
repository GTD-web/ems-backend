import { ICommandHandler } from '@nestjs/cqrs';
import { AuditLogService } from '@domain/common/audit-log/audit-log.service';
import { CreateAuditLogDto, CreateAuditLogResult } from '../../interfaces/audit-log-context.interface';
export declare class CreateAuditLogCommand {
    readonly data: CreateAuditLogDto;
    constructor(data: CreateAuditLogDto);
}
export declare class CreateAuditLogHandler implements ICommandHandler<CreateAuditLogCommand, CreateAuditLogResult> {
    private readonly auditLogService;
    constructor(auditLogService: AuditLogService);
    execute(command: CreateAuditLogCommand): Promise<CreateAuditLogResult>;
}
