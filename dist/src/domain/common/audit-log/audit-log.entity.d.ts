import { BaseEntity } from '@libs/database/base/base.entity';
import { AuditLogDto } from './audit-log.types';
export declare class AuditLog extends BaseEntity<AuditLogDto> {
    requestMethod: string;
    requestUrl: string;
    requestPath?: string;
    requestHeaders?: Record<string, string>;
    requestBody?: any;
    requestQuery?: Record<string, any>;
    requestIp?: string;
    responseStatusCode: number;
    responseBody?: any;
    userId?: string;
    userEmail?: string;
    userName?: string;
    employeeNumber?: string;
    requestStartTime: Date;
    requestEndTime: Date;
    duration: number;
    requestId?: string;
    DTO로_변환한다(): AuditLogDto;
}
