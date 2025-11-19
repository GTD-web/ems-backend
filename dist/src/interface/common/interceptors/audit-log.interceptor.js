"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuditLogInterceptor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const operators_1 = require("rxjs/operators");
const create_audit_log_handler_1 = require("../../../context/audit-log-context/handlers/commands/create-audit-log.handler");
let AuditLogInterceptor = AuditLogInterceptor_1 = class AuditLogInterceptor {
    commandBus;
    logger = new common_1.Logger(AuditLogInterceptor_1.name);
    excludePaths = [
        '/health',
        '/admin/api-docs',
        '/user/api-docs',
        '/evaluator/api-docs',
    ];
    constructor(commandBus) {
        this.commandBus = commandBus;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        if (request.method === 'GET') {
            return next.handle();
        }
        if (this.shouldExclude(request.path)) {
            return next.handle();
        }
        const startTime = new Date();
        const requestId = this.generateRequestId();
        const requestMethod = request.method;
        const requestUrl = request.originalUrl || request.url;
        const requestPath = request.route?.path || request.path;
        const requestHeaders = this.sanitizeHeaders(request.headers);
        const requestBody = this.sanitizeBody(request.body);
        const requestQuery = request.query || {};
        const requestIp = this.getClientIp(request);
        const user = request['user'];
        return next.handle().pipe((0, operators_1.tap)(async (data) => {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            try {
                const command = new create_audit_log_handler_1.audit로그를생성한다({
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
                await this.commandBus.execute(command);
            }
            catch (error) {
                this.logger.error('Audit 로그 생성 실패', error);
            }
        }), (0, operators_1.catchError)(async (error) => {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            try {
                const command = new create_audit_log_handler_1.audit로그를생성한다({
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
                await this.commandBus.execute(command);
            }
            catch (logError) {
                this.logger.error('Audit 로그 생성 실패', logError);
            }
            throw error;
        }));
    }
    shouldExclude(path) {
        return this.excludePaths.some((excludePath) => path.startsWith(excludePath));
    }
    generateRequestId() {
        return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    getClientIp(request) {
        return (request.headers['x-forwarded-for']?.split(',')[0] ||
            request.headers['x-real-ip'] ||
            request.ip ||
            request.socket.remoteAddress ||
            'unknown');
    }
    sanitizeHeaders(headers) {
        const sanitized = {};
        const excludeHeaders = ['authorization', 'cookie'];
        Object.keys(headers).forEach((key) => {
            if (!excludeHeaders.includes(key.toLowerCase())) {
                sanitized[key] = headers[key];
            }
        });
        return sanitized;
    }
    sanitizeBody(body) {
        if (!body)
            return null;
        const bodyString = JSON.stringify(body);
        const maxSize = 10 * 1024;
        if (bodyString.length > maxSize) {
            return {
                _truncated: true,
                _size: bodyString.length,
                _message: 'Response body too large, truncated',
            };
        }
        return body;
    }
    sanitizeError(error) {
        return {
            message: error.message,
            status: error.status,
            statusCode: error.statusCode,
            name: error.name,
        };
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = AuditLogInterceptor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cqrs_1.CommandBus])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map