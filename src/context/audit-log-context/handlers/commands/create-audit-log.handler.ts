import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AuditLogService } from '@domain/common/audit-log/audit-log.service';
import {
  CreateAuditLogDto,
  CreateAuditLogResult,
} from '../../interfaces/audit-log-context.interface';

export class audit로그를생성한다 {
  constructor(public readonly data: CreateAuditLogDto) {}
}

@Injectable()
@CommandHandler(audit로그를생성한다) 
export class CreateAuditLogHandler
  implements ICommandHandler<audit로그를생성한다, CreateAuditLogResult>
{
  constructor(private readonly auditLogService: AuditLogService) {}

  async execute(command: audit로그를생성한다): Promise<CreateAuditLogResult> {
    const auditLog = await this.auditLogService.생성한다(command.data);
    return {
      id: auditLog.id,
      createdAt: auditLog.createdAt,
    };
  }
}
