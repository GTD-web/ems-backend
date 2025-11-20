import { AuditLog } from '@domain/common/audit-log/audit-log.entity';
export declare class AuditLogResponseDto {
    id: string;
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
    createdAt: Date;
}
export declare class AuditLogListResponseDto {
    items: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    static 응답DTO로_변환한다(items: AuditLog[], total: number, query: {
        page: number;
        limit: number;
    }): AuditLogListResponseDto;
}
