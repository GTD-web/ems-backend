export interface AuditLogDto {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    version: number;
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
}
