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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../libs/database/base/base.entity");
let AuditLog = class AuditLog extends base_entity_1.BaseEntity {
    requestMethod;
    requestUrl;
    requestPath;
    requestHeaders;
    requestBody;
    requestQuery;
    requestIp;
    responseStatusCode;
    responseBody;
    userId;
    userEmail;
    userName;
    employeeNumber;
    requestStartTime;
    requestEndTime;
    duration;
    requestId;
    DTO로_변환한다() {
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
};
exports.AuditLog = AuditLog;
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 10,
        comment: 'HTTP 메서드',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        comment: '요청 URL',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'text',
        nullable: true,
        comment: '요청 경로',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestPath", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: '요청 헤더',
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "requestHeaders", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: '요청 본문',
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "requestBody", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: '요청 Query 파라미터',
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "requestQuery", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '요청 IP 주소',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestIp", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '응답 상태 코드',
    }),
    __metadata("design:type", Number)
], AuditLog.prototype, "responseStatusCode", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'jsonb',
        nullable: true,
        comment: '응답 본문',
    }),
    __metadata("design:type", Object)
], AuditLog.prototype, "responseBody", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '사용자 ID',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '사용자 이메일',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "userEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '사용자 이름',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
        comment: '직원 번호',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "employeeNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '요청 시작 시간',
    }),
    __metadata("design:type", Date)
], AuditLog.prototype, "requestStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp with time zone',
        comment: '요청 종료 시간',
    }),
    __metadata("design:type", Date)
], AuditLog.prototype, "requestEndTime", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'int',
        comment: '처리 시간 (ms)',
    }),
    __metadata("design:type", Number)
], AuditLog.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 255,
        nullable: true,
        comment: '요청 ID',
    }),
    __metadata("design:type", String)
], AuditLog.prototype, "requestId", void 0);
exports.AuditLog = AuditLog = __decorate([
    (0, typeorm_1.Entity)('audit_log'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['employeeNumber']),
    (0, typeorm_1.Index)(['requestStartTime']),
    (0, typeorm_1.Index)(['requestMethod', 'requestStartTime'])
], AuditLog);
//# sourceMappingURL=audit-log.entity.js.map