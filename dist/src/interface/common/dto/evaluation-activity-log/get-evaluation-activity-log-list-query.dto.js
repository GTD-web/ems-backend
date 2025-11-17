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
exports.GetEvaluationActivityLogListQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GetEvaluationActivityLogListQueryDto {
    activityType;
    startDate;
    endDate;
    page;
    limit;
}
exports.GetEvaluationActivityLogListQueryDto = GetEvaluationActivityLogListQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 유형',
        example: 'wbs_self_evaluation',
        enum: [
            'wbs_self_evaluation',
            'downward_evaluation',
            'peer_evaluation',
            'additional_evaluation',
            'deliverable',
            'evaluation_status',
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetEvaluationActivityLogListQueryDto.prototype, "activityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 시작일 (ISO 8601 형식, 예: 2024-01-01T00:00:00Z). 입력하지 않으면 전체 기간 조회',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetEvaluationActivityLogListQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '활동 종료일 (ISO 8601 형식, 예: 2024-01-31T23:59:59Z). 입력하지 않으면 전체 기간 조회',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetEvaluationActivityLogListQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호 (1부터 시작)',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetEvaluationActivityLogListQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 20,
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetEvaluationActivityLogListQueryDto.prototype, "limit", void 0);
//# sourceMappingURL=get-evaluation-activity-log-list-query.dto.js.map