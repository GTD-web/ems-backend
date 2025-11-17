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
exports.EvaluationActivityLogListResponseDto = exports.EvaluationActivityLogResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class EvaluationActivityLogResponseDto {
    id;
    periodId;
    employeeId;
    activityType;
    activityAction;
    activityTitle;
    activityDescription;
    relatedEntityType;
    relatedEntityId;
    performedBy;
    performedByName;
    activityMetadata;
    activityDate;
    createdAt;
    updatedAt;
    deletedAt;
    createdBy;
    updatedBy;
    version;
}
exports.EvaluationActivityLogResponseDto = EvaluationActivityLogResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '고유 식별자', example: 'uuid' }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가 기간 ID', example: 'period-123' }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '피평가자 ID', example: 'employee-456' }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활동 유형',
        example: 'wbs_self_evaluation',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "activityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활동 액션',
        example: 'created',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "activityAction", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 제목',
        example: 'WBS 자기평가 생성',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "activityTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 설명',
        example: '홍길동님이 WBS 자기평가를 생성했습니다.',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "activityDescription", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관련 엔티티 유형',
        example: 'wbs_self_evaluation',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "relatedEntityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관련 엔티티 ID',
        example: 'eval-789',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "relatedEntityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활동 수행자 ID',
        example: 'employee-456',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "performedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 수행자 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "performedByName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 메타데이터',
        example: { wbsItemId: 'wbs-123', evaluationId: 'eval-789' },
    }),
    __metadata("design:type", Object)
], EvaluationActivityLogResponseDto.prototype, "activityMetadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활동 일시',
        example: '2024-01-01T10:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationActivityLogResponseDto.prototype, "activityDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-01T10:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationActivityLogResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-01T10:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationActivityLogResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: null,
    }),
    __metadata("design:type", Date)
], EvaluationActivityLogResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: 'user-123',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: 'user-123',
    }),
    __metadata("design:type", String)
], EvaluationActivityLogResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], EvaluationActivityLogResponseDto.prototype, "version", void 0);
class EvaluationActivityLogListResponseDto {
    items;
    total;
    page;
    limit;
}
exports.EvaluationActivityLogListResponseDto = EvaluationActivityLogListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활동 내역 목록',
        type: [EvaluationActivityLogResponseDto],
    }),
    __metadata("design:type", Array)
], EvaluationActivityLogListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '전체 개수', example: 100 }),
    __metadata("design:type", Number)
], EvaluationActivityLogListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '현재 페이지', example: 1 }),
    __metadata("design:type", Number)
], EvaluationActivityLogListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '페이지 크기', example: 20 }),
    __metadata("design:type", Number)
], EvaluationActivityLogListResponseDto.prototype, "limit", void 0);
//# sourceMappingURL=evaluation-activity-log-response.dto.js.map