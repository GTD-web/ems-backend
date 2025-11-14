import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditLogContextService } from '@context/audit-log-context/audit-log-context.service';

/**
 * Audit 로그 인터셉터
 *
 * POST, PUT, PATCH, DELETE 등의 HTTP 요청과 응답을 audit 로그로 저장합니다.
 * GET 요청은 제외됩니다.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  // 제외할 경로 목록
  private readonly excludePaths = [
    '/health',
    '/admin/api-docs',
    '/user/api-docs',
    '/evaluator/api-docs',
  ];

  constructor(
    private readonly auditLogContextService: AuditLogContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // GET 메소드는 audit 로그에서 제외
    if (request.method === 'GET') {
      return next.handle();
    }

    // 제외할 경로 확인
    if (this.shouldExclude(request.path)) {
      return next.handle();
    }

    const startTime = new Date();
    const requestId = this.generateRequestId();

    // 요청 정보 추출
    const requestMethod = request.method;
    const requestUrl = request.originalUrl || request.url;
    const requestPath = request.route?.path || request.path;
    const requestHeaders = this.sanitizeHeaders(request.headers);
    const requestBody = this.sanitizeBody(request.body);
    const requestQuery = request.query || {};
    const requestIp = this.getClientIp(request);
    const user = request['user']; // JwtAuthGuard에서 주입된 사용자 정보

    return next.handle().pipe(
      tap(async (data) => {
        // 정상 응답 처리
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        try {
          await this.auditLogContextService.audit로그를생성한다({
            requestMethod,
            requestUrl,
            requestPath,
            requestHeaders,
            requestBody,
            requestQuery,
            requestIp,
            responseStatusCode: response.statusCode,
            responseBody: this.sanitizeBody(data),
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            employeeNumber: user?.employeeNumber,
            requestStartTime: startTime,
            requestEndTime: endTime,
            duration,
            requestId,
          });
        } catch (error) {
          // Audit 로깅 실패 시에도 메인 요청은 정상 처리
          this.logger.error('Audit 로그 생성 실패', error);
        }
      }),
      catchError(async (error) => {
        // 에러 응답 처리
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();

        try {
          await this.auditLogContextService.audit로그를생성한다({
            requestMethod,
            requestUrl,
            requestPath,
            requestHeaders,
            requestBody,
            requestQuery,
            requestIp,
            responseStatusCode: error.status || 500,
            responseBody: this.sanitizeError(error),
            userId: user?.id,
            userEmail: user?.email,
            userName: user?.name,
            employeeNumber: user?.employeeNumber,
            requestStartTime: startTime,
            requestEndTime: endTime,
            duration,
            requestId,
          });
        } catch (logError) {
          // Audit 로깅 실패 시에도 메인 요청은 정상 처리
          this.logger.error('Audit 로그 생성 실패', logError);
        }

        throw error;
      }),
    );
  }

  /**
   * 제외할 경로인지 확인한다
   */
  private shouldExclude(path: string): boolean {
    return this.excludePaths.some((excludePath) =>
      path.startsWith(excludePath),
    );
  }

  /**
   * 요청 ID 생성
   */
  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 클라이언트 IP 주소 추출
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * 헤더 정제 (민감 정보 제거)
   */
  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const excludeHeaders = ['authorization', 'cookie'];

    Object.keys(headers).forEach((key) => {
      if (!excludeHeaders.includes(key.toLowerCase())) {
        sanitized[key] = headers[key];
      }
    });

    return sanitized;
  }

  /**
   * 본문 정제 (대용량 데이터 제한)
   */
  private sanitizeBody(body: any): any {
    if (!body) return null;

    const bodyString = JSON.stringify(body);
    const maxSize = 10 * 1024; // 10KB

    if (bodyString.length > maxSize) {
      return {
        _truncated: true,
        _size: bodyString.length,
        _message: 'Response body too large, truncated',
      };
    }

    return body;
  }

  /**
   * 에러 정보 정제
   */
  private sanitizeError(error: any): any {
    return {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      name: error.name,
    };
  }
}

