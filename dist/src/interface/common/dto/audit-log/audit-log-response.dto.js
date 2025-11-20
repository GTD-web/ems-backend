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
exports.AuditLogListResponseDto = exports.AuditLogResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuditLogResponseDto {
    id;
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
    createdAt;
}
exports.AuditLogResponseDto = AuditLogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Audit 로그 ID' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'HTTP 메서드' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "requestMethod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 URL' }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "requestUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 경로', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "requestPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 헤더', required: false }),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "requestHeaders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 본문', required: false }),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "requestBody", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 Query 파라미터', required: false }),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "requestQuery", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 IP 주소', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "requestIp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '응답 상태 코드' }),
    __metadata("design:type", Number)
], AuditLogResponseDto.prototype, "responseStatusCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '응답 본문', required: false }),
    __metadata("design:type", Object)
], AuditLogResponseDto.prototype, "responseBody", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '사용자 ID', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '사용자 이메일', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "userEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '사용자 이름', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "userName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '직원 번호', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 시작 시간' }),
    __metadata("design:type", Date)
], AuditLogResponseDto.prototype, "requestStartTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 종료 시간' }),
    __metadata("design:type", Date)
], AuditLogResponseDto.prototype, "requestEndTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '처리 시간 (ms)' }),
    __metadata("design:type", Number)
], AuditLogResponseDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '요청 ID', required: false }),
    __metadata("design:type", String)
], AuditLogResponseDto.prototype, "requestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성 시간' }),
    __metadata("design:type", Date)
], AuditLogResponseDto.prototype, "createdAt", void 0);
class AuditLogListResponseDto {
    items;
    total;
    page;
    limit;
    static 응답DTO로_변환한다(items, total, query) {
        const dto = new AuditLogListResponseDto();
        dto.items = items.map((item) => item.DTO로_변환한다());
        dto.total = total;
        dto.page = query.page;
        dto.limit = query.limit;
        return dto;
    }
}
exports.AuditLogListResponseDto = AuditLogListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Audit 로그 목록',
        type: [AuditLogResponseDto],
    }),
    __metadata("design:type", Array)
], AuditLogListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전체 개수' }),
    __metadata("design:type", Number)
], AuditLogListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '현재 페이지' }),
    __metadata("design:type", Number)
], AuditLogListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '페이지 크기' }),
    __metadata("design:type", Number)
], AuditLogListResponseDto.prototype, "limit", void 0);
//# sourceMappingURL=audit-log-response.dto.js.map