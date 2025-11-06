import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@libs/database/base/base.entity';
import { AuditLogDto } from './audit-log.types';

/**
 * Audit 로그 엔티티
 *
 * 모든 HTTP 요청과 응답을 audit 로그로 저장합니다.
 */
@Entity('audit_log')
@Index(['userId'])
@Index(['employeeNumber'])
@Index(['requestStartTime'])
@Index(['requestMethod', 'requestStartTime'])
export class AuditLog extends BaseEntity<AuditLogDto> {
  @Column({
    type: 'varchar',
    length: 10,
    comment: 'HTTP 메서드',
  })
  requestMethod: string;

  @Column({
    type: 'text',
    comment: '요청 URL',
  })
  requestUrl: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '요청 경로',
  })
  requestPath?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '요청 헤더',
  })
  requestHeaders?: Record<string, string>;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '요청 본문',
  })
  requestBody?: any;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '요청 Query 파라미터',
  })
  requestQuery?: Record<string, any>;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '요청 IP 주소',
  })
  requestIp?: string;

  @Column({
    type: 'int',
    comment: '응답 상태 코드',
  })
  responseStatusCode: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '응답 본문',
  })
  responseBody?: any;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '사용자 ID',
  })
  userId?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '사용자 이메일',
  })
  userEmail?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '사용자 이름',
  })
  userName?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '직원 번호',
  })
  employeeNumber?: string;

  @Column({
    type: 'timestamp with time zone',
    comment: '요청 시작 시간',
  })
  requestStartTime: Date;

  @Column({
    type: 'timestamp with time zone',
    comment: '요청 종료 시간',
  })
  requestEndTime: Date;

  @Column({
    type: 'int',
    comment: '처리 시간 (ms)',
  })
  duration: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '요청 ID',
  })
  requestId?: string;

  /**
   * Audit 로그 엔티티를 DTO로 변환한다
   */
  DTO로_변환한다(): AuditLogDto {
    return {
      id: this.id,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      version: this.version,
      requestMethod: this.requestMethod,
      requestUrl: this.requestUrl,
      requestPath: this.requestPath,
      requestHeaders: this.requestHeaders,
      requestBody: this.requestBody,
      requestQuery: this.requestQuery,
      requestIp: this.requestIp,
      responseStatusCode: this.responseStatusCode,
      responseBody: this.responseBody,
      userId: this.userId,
      userEmail: this.userEmail,
      userName: this.userName,
      employeeNumber: this.employeeNumber,
      requestStartTime: this.requestStartTime,
      requestEndTime: this.requestEndTime,
      duration: this.duration,
      requestId: this.requestId,
    };
  }
}
