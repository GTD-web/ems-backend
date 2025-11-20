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
exports.GetAuditLogListQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const decorators_1 = require("../../decorators");
class GetAuditLogListQueryDto {
    userId;
    userEmail;
    employeeNumber;
    requestMethod;
    requestUrl;
    responseStatusCode;
    startDate;
    endDate;
    page;
    limit;
}
exports.GetAuditLogListQueryDto = GetAuditLogListQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '사용자 ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAuditLogListQueryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '사용자 이메일' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAuditLogListQueryDto.prototype, "userEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '직원 번호' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAuditLogListQueryDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'HTTP 메서드 (단일 값 또는 배열)',
        enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        type: [String],
        example: ['GET', 'POST'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalToArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GetAuditLogListQueryDto.prototype, "requestMethod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 URL 또는 호스트 (부분 일치, 단일 값 또는 배열)',
        type: [String],
        example: ['/admin', '/api'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalToArray)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GetAuditLogListQueryDto.prototype, "requestUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '응답 상태 코드 (단일 값 또는 배열)',
        type: [Number],
        example: [200, 201, 404],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalToArray)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], GetAuditLogListQueryDto.prototype, "responseStatusCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작 날짜 (ISO 8601)',
        example: '2024-01-01T00:00:00Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetAuditLogListQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료 날짜 (ISO 8601)',
        example: '2024-12-31T23:59:59Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetAuditLogListQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '페이지 번호', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetAuditLogListQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '페이지 크기', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetAuditLogListQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=get-audit-log-list-query.dto.js.map