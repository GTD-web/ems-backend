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
exports.EvaluationPeriodListResponseDto = exports.EvaluationPeriodResponseDto = exports.GradeRangeResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const evaluation_period_types_1 = require("../../../../domain/core/evaluation-period/evaluation-period.types");
class GradeRangeResponseDto {
    grade;
    minRange;
    maxRange;
}
exports.GradeRangeResponseDto = GradeRangeResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급',
        example: 'S',
    }),
    __metadata("design:type", String)
], GradeRangeResponseDto.prototype, "grade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최소 범위',
        example: 90,
        minimum: 0,
        maximum: 200,
    }),
    __metadata("design:type", Number)
], GradeRangeResponseDto.prototype, "minRange", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최대 범위',
        example: 100,
        minimum: 0,
        maximum: 200,
    }),
    __metadata("design:type", Number)
], GradeRangeResponseDto.prototype, "maxRange", void 0);
class EvaluationPeriodResponseDto {
    id;
    name;
    startDate;
    description;
    status;
    currentPhase;
    evaluationSetupDeadline;
    performanceDeadline;
    selfEvaluationDeadline;
    peerEvaluationDeadline;
    completedDate;
    criteriaSettingEnabled;
    selfEvaluationSettingEnabled;
    finalEvaluationSettingEnabled;
    maxSelfEvaluationRate;
    gradeRanges;
    createdAt;
    updatedAt;
}
exports.EvaluationPeriodResponseDto = EvaluationPeriodResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 고유 식별자',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationPeriodResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간명',
        example: '2024년 상반기 평가',
    }),
    __metadata("design:type", String)
], EvaluationPeriodResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 시작일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기간 설명',
        example: '2024년 상반기 직원 평가를 진행합니다.',
    }),
    __metadata("design:type", String)
], EvaluationPeriodResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 상태',
        enum: evaluation_period_types_1.EvaluationPeriodStatus,
        example: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
    }),
    __metadata("design:type", String)
], EvaluationPeriodResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '현재 진행 단계',
        enum: evaluation_period_types_1.EvaluationPeriodPhase,
        example: evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION,
    }),
    __metadata("design:type", String)
], EvaluationPeriodResponseDto.prototype, "currentPhase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가설정 단계 마감일',
        example: '2024-01-15T23:59:59.999Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "evaluationSetupDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '업무 수행 단계 마감일',
        example: '2024-05-31T23:59:59.999Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "performanceDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기 평가 단계 마감일',
        example: '2024-06-15T23:59:59.999Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "selfEvaluationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하향/동료평가 단계 마감일',
        example: '2024-06-30T23:59:59.999Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "peerEvaluationDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 완료일',
        example: '2024-07-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "completedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기준 설정 수동 허용 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodResponseDto.prototype, "criteriaSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기 평가 설정 수동 허용 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodResponseDto.prototype, "selfEvaluationSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향/동료평가 설정 수동 허용 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodResponseDto.prototype, "finalEvaluationSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 달성률 최대값 (%)',
        example: 120,
        minimum: 100,
        maximum: 200,
    }),
    __metadata("design:type", Number)
], EvaluationPeriodResponseDto.prototype, "maxSelfEvaluationRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '등급 구간 설정',
        type: [GradeRangeResponseDto],
    }),
    __metadata("design:type", Array)
], EvaluationPeriodResponseDto.prototype, "gradeRanges", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodResponseDto.prototype, "updatedAt", void 0);
class EvaluationPeriodListResponseDto {
    items;
    total;
    page;
    limit;
}
exports.EvaluationPeriodListResponseDto = EvaluationPeriodListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 목록',
        type: [EvaluationPeriodResponseDto],
    }),
    __metadata("design:type", Array)
], EvaluationPeriodListResponseDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 데이터 개수',
        example: 25,
    }),
    __metadata("design:type", Number)
], EvaluationPeriodListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지',
        example: 1,
    }),
    __metadata("design:type", Number)
], EvaluationPeriodListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 10,
    }),
    __metadata("design:type", Number)
], EvaluationPeriodListResponseDto.prototype, "limit", void 0);
//# sourceMappingURL=evaluation-period-response.dto.js.map