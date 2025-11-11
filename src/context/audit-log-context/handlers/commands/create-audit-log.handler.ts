import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import { AuditLogService } from '@domain/common/audit-log/audit-log.service';
import {
  CreateAuditLogDto,
  CreateAuditLogResult,
} from '../../interfaces/audit-log-context.interface';

export class CreateAuditLogCommand {
  constructor(public readonly data: CreateAuditLogDto) {}
}

@Injectable()
@CommandHandler(CreateAuditLogCommand)
export class CreateAuditLogHandler
  implements ICommandHandler<CreateAuditLogCommand, CreateAuditLogResult>
{
  constructor(private readonly auditLogService: AuditLogService) {}

  async execute(command: CreateAuditLogCommand): Promise<CreateAuditLogResult> {
    const auditLog = await this.auditLogService.생성한다(command.data);
    return {
      id: auditLog.id,
      createdAt: auditLog.createdAt,
    };
  }
}
