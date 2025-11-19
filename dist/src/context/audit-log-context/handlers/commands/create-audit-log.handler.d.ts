import { ICommandHandler } from '@nestjs/cqrs';
import { AuditLogService } from '@domain/common/audit-log/audit-log.service';
import { CreateAuditLogDto, CreateAuditLogResult } from '../../interfaces/audit-log-context.interface';
export declare class audit로그를생성한다 {
    readonly data: CreateAuditLogDto;
    constructor(data: CreateAuditLogDto);
}
export declare class CreateAuditLogHandler implements ICommandHandler<audit로그를생성한다, CreateAuditLogResult> {
    private readonly auditLogService;
    constructor(auditLogService: AuditLogService);
    execute(command: audit로그를생성한다): Promise<CreateAuditLogResult>;
}
