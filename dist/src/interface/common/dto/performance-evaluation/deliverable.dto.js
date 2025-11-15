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
exports.GetDeliverablesQueryDto = exports.DeliverableFilterDto = exports.BulkDeleteResultDto = exports.BulkCreateResultDto = exports.DeliverableListResponseDto = exports.DeliverableResponseDto = exports.BulkDeleteDeliverablesDto = exports.BulkCreateDeliverablesDto = exports.UpdateDeliverableDto = exports.CreateDeliverableDto = void 0;
const deliverable_types_1 = require("../../../../domain/core/deliverable/deliverable.types");
const decorators_1 = require("../../decorators");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateDeliverableDto {
    name;
    description;
    type;
    filePath;
    employeeId;
    wbsItemId;
    createdBy;
}
exports.CreateDeliverableDto = CreateDeliverableDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물명',
        example: 'API 설계 문서',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물 설명',
        example: 'RESTful API 설계 문서 v1.0',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물 유형',
        enum: deliverable_types_1.DeliverableType,
        example: deliverable_types_1.DeliverableType.DOCUMENT,
    }),
    (0, class_validator_1.IsEnum)(deliverable_types_1.DeliverableType),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '파일 경로',
        example: '/uploads/documents/api-design-v1.pdf',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateDeliverableDto.prototype, "createdBy", void 0);
class UpdateDeliverableDto {
    name;
    description;
    type;
    filePath;
    employeeId;
    wbsItemId;
    isActive;
    updatedBy;
}
exports.UpdateDeliverableDto = UpdateDeliverableDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물명',
        example: 'API 설계 문서 v2',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물 설명',
        example: 'RESTful API 설계 문서 v2.0',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물 유형',
        enum: deliverable_types_1.DeliverableType,
        example: deliverable_types_1.DeliverableType.DOCUMENT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(deliverable_types_1.DeliverableType),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '파일 경로',
        example: '/uploads/documents/api-design-v2.pdf',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID (재할당)',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID (재할당)',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활성 상태',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateDeliverableDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateDeliverableDto.prototype, "updatedBy", void 0);
class BulkCreateDeliverablesDto {
    deliverables;
}
exports.BulkCreateDeliverablesDto = BulkCreateDeliverablesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성할 산출물 목록',
        type: [CreateDeliverableDto],
        example: [
            {
                name: 'API 설계 문서',
                type: deliverable_types_1.DeliverableType.DOCUMENT,
                employeeId: '550e8400-e29b-41d4-a716-446655440000',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440001',
            },
            {
                name: '데이터베이스 스키마',
                type: deliverable_types_1.DeliverableType.CODE,
                employeeId: '550e8400-e29b-41d4-a716-446655440000',
                wbsItemId: '550e8400-e29b-41d4-a716-446655440002',
            },
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    __metadata("design:type", Array)
], BulkCreateDeliverablesDto.prototype, "deliverables", void 0);
class BulkDeleteDeliverablesDto {
    deliverableIds;
}
exports.BulkDeleteDeliverablesDto = BulkDeleteDeliverablesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제할 산출물 ID 목록',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011',
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkDeleteDeliverablesDto.prototype, "deliverableIds", void 0);
class DeliverableResponseDto {
    id;
    name;
    description;
    type;
    filePath;
    employeeId;
    wbsItemId;
    mappedDate;
    mappedBy;
    isActive;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
}
exports.DeliverableResponseDto = DeliverableResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물명',
        example: 'API 설계 문서',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물 설명',
        example: 'RESTful API 설계 문서 v1.0',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물 유형',
        enum: deliverable_types_1.DeliverableType,
        example: deliverable_types_1.DeliverableType.DOCUMENT,
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '파일 경로',
        example: '/uploads/documents/api-design-v1.pdf',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '매핑일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], DeliverableResponseDto.prototype, "mappedDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '매핑자 ID',
        example: '550e8400-e29b-41d4-a716-446655440020',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "mappedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태',
        example: true,
    }),
    __metadata("design:type", Boolean)
], DeliverableResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], DeliverableResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], DeliverableResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제일시',
        example: '2024-01-20T14:00:00Z',
    }),
    __metadata("design:type", Date)
], DeliverableResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: '550e8400-e29b-41d4-a716-446655440020',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: '550e8400-e29b-41d4-a716-446655440021',
    }),
    __metadata("design:type", String)
], DeliverableResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], DeliverableResponseDto.prototype, "version", void 0);
class DeliverableListResponseDto {
    deliverables;
    total;
}
exports.DeliverableListResponseDto = DeliverableListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '산출물 목록',
        type: [DeliverableResponseDto],
    }),
    __metadata("design:type", Array)
], DeliverableListResponseDto.prototype, "deliverables", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 산출물 개수',
        example: 15,
    }),
    __metadata("design:type", Number)
], DeliverableListResponseDto.prototype, "total", void 0);
class BulkCreateResultDto {
    successCount;
    failedCount;
    createdIds;
    failedItems;
}
exports.BulkCreateResultDto = BulkCreateResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 개수',
        example: 8,
    }),
    __metadata("design:type", Number)
], BulkCreateResultDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], BulkCreateResultDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 산출물 ID 목록',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011',
        ],
    }),
    __metadata("design:type", Array)
], BulkCreateResultDto.prototype, "createdIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 항목 목록',
        type: 'array',
        example: [
            {
                data: { name: 'Invalid Deliverable' },
                error: 'Validation failed',
            },
        ],
    }),
    __metadata("design:type", Array)
], BulkCreateResultDto.prototype, "failedItems", void 0);
class BulkDeleteResultDto {
    successCount;
    failedCount;
    failedIds;
}
exports.BulkDeleteResultDto = BulkDeleteResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 개수',
        example: 8,
    }),
    __metadata("design:type", Number)
], BulkDeleteResultDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], BulkDeleteResultDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 ID 목록',
        type: 'array',
        example: [
            {
                id: '550e8400-e29b-41d4-a716-446655440010',
                error: 'Deliverable not found',
            },
        ],
    }),
    __metadata("design:type", Array)
], BulkDeleteResultDto.prototype, "failedIds", void 0);
class DeliverableFilterDto {
    type;
    employeeId;
    wbsItemId;
    activeOnly;
}
exports.DeliverableFilterDto = DeliverableFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '산출물 유형',
        enum: deliverable_types_1.DeliverableType,
        example: deliverable_types_1.DeliverableType.DOCUMENT,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(deliverable_types_1.DeliverableType),
    __metadata("design:type", String)
], DeliverableFilterDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DeliverableFilterDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DeliverableFilterDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활성 산출물만 조회',
        example: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeliverableFilterDto.prototype, "activeOnly", void 0);
class GetDeliverablesQueryDto {
    activeOnly = true;
}
exports.GetDeliverablesQueryDto = GetDeliverablesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활성 산출물만 조회 (기본값: true, 가능값: "true", "false", "1", "0")',
        example: true,
        type: Boolean,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetDeliverablesQueryDto.prototype, "activeOnly", void 0);
//# sourceMappingURL=deliverable.dto.js.map