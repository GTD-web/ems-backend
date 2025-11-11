import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';
export declare class AuditLogInterceptor implements NestInterceptor {
    private readonly auditLogContextService;
    private readonly logger;
    private readonly excludePaths;
    constructor(auditLogContextService: AuditLogContextService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private shouldExclude;
    private generateRequestId;
    private getClientIp;
    private sanitizeHeaders;
    private sanitizeBody;
    private sanitizeError;
}
