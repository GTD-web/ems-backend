export declare class GetAuditLogListQueryDto {
    userId?: string;
    userEmail?: string;
    employeeNumber?: string;
    requestMethod?: string;
    requestUrl?: string;
    responseStatusCode?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
