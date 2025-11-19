import { Injectable } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
import {
  AuditLogFilter,
  AuditLogListResult,
} from '../../interfaces/audit-log-context.interface';

export class audit로그목록을조회한다 {
  constructor(
    public readonly filter: AuditLogFilter,
    public readonly page: number = 1,
    public readonly limit: number = 10,
  ) {}
}

@Injectable()
@QueryHandler(audit로그목록을조회한다)
export class GetAuditLogListHandler
  implements IQueryHandler<audit로그목록을조회한다, AuditLogListResult>
{
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async execute(query: audit로그목록을조회한다): Promise<AuditLogListResult> {
    const queryBuilder =
      this.auditLogRepository.createQueryBuilder('auditLog');

    if (query.filter.userId) {
      queryBuilder.andWhere('auditLog.userId = :userId', {
        userId: query.filter.userId,
      });
    }

    if (query.filter.userEmail) {
      queryBuilder.andWhere('auditLog.userEmail = :userEmail', {
        userEmail: query.filter.userEmail,
      });
    }

    if (query.filter.employeeNumber) {
      queryBuilder.andWhere('auditLog.employeeNumber = :employeeNumber', {
        employeeNumber: query.filter.employeeNumber,
      });
    }

    if (query.filter.requestMethod) {
      queryBuilder.andWhere('auditLog.requestMethod = :requestMethod', {
        requestMethod: query.filter.requestMethod,
      });
    }

    if (query.filter.requestUrl) {
      queryBuilder.andWhere('auditLog.requestUrl LIKE :requestUrl', {
        requestUrl: `%${query.filter.requestUrl}%`,
      });
    }

    if (query.filter.responseStatusCode) {
      queryBuilder.andWhere(
        'auditLog.responseStatusCode = :responseStatusCode',
        {
          responseStatusCode: query.filter.responseStatusCode,
        },
      );
    }

    if (query.filter.startDate) {
      queryBuilder.andWhere('auditLog.requestStartTime >= :startDate', {
        startDate: query.filter.startDate,
      });
    }

    if (query.filter.endDate) {
      queryBuilder.andWhere('auditLog.requestStartTime <= :endDate', {
        endDate: query.filter.endDate,
      });
    }

    queryBuilder.orderBy('auditLog.requestStartTime', 'DESC');

    const skip = (query.page - 1) * query.limit;
    queryBuilder.skip(skip).take(query.limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map((item) => item.DTO로_변환한다()),
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}

