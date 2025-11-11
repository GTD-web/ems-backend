import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditLogDto } from './audit-log.types';

/**
 * Audit 로그 도메인 서비스
 *
 * Audit 로그 엔티티의 데이터베이스 접근을 담당하는 서비스입니다.
 */
@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Audit 로그를 생성한다
   */
  async 생성한다(data: Partial<AuditLogDto>): Promise<AuditLogDto> {
    const auditLog = this.auditLogRepository.create({
      requestMethod: data.requestMethod,
      requestUrl: data.requestUrl,
      requestPath: data.requestPath,
      requestHeaders: data.requestHeaders,
      requestBody: data.requestBody,
      requestQuery: data.requestQuery,
      requestIp: data.requestIp,
      responseStatusCode: data.responseStatusCode,
      responseBody: data.responseBody,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      employeeNumber: data.employeeNumber,
      requestStartTime: data.requestStartTime,
      requestEndTime: data.requestEndTime,
      duration: data.duration,
      requestId: data.requestId,
    });

    const saved = await this.auditLogRepository.save(auditLog);
    return saved.DTO로_변환한다();
  }
}
