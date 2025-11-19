import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Observable } from 'rxjs';
export declare class AuditLogInterceptor implements NestInterceptor {
    private readonly commandBus;
    private readonly logger;
    private readonly excludePaths;
    constructor(commandBus: CommandBus);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private shouldExclude;
    private generateRequestId;
    private getClientIp;
    private sanitizeHeaders;
    private sanitizeBody;
    private sanitizeError;
}
