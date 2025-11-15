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
exports.EvaluationTargetStatusResponseDto = exports.EvaluationTargetMappingResponseDto = exports.EmployeeEvaluationPeriodsResponseDto = exports.EmployeeEvaluationPeriodMappingItemDto = exports.EvaluationTargetsResponseDto = exports.EvaluationTargetItemDto = exports.GetEvaluationTargetsQueryDto = exports.IncludeEvaluationTargetDto = exports.ExcludeEvaluationTargetDto = exports.RegisterBulkEvaluationTargetsDto = exports.RegisterEvaluationTargetDto = exports.EmployeeBasicInfoDto = exports.EvaluationPeriodBasicInfoDto = void 0;
const decorators_1 = require("../../../common/decorators");
const evaluation_period_types_1 = require("../../../../domain/core/evaluation-period/evaluation-period.types");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class EvaluationPeriodBasicInfoDto {
    id;
    name;
    startDate;
    endDate;
    status;
    currentPhase;
}
exports.EvaluationPeriodBasicInfoDto = EvaluationPeriodBasicInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationPeriodBasicInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기 평가',
    }),
    __metadata("design:type", String)
], EvaluationPeriodBasicInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 시작일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodBasicInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 기간 종료일',
        example: '2024-06-30T23:59:59.999Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationPeriodBasicInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 상태',
        enum: evaluation_period_types_1.EvaluationPeriodStatus,
        example: evaluation_period_types_1.EvaluationPeriodStatus.IN_PROGRESS,
    }),
    __metadata("design:type", String)
], EvaluationPeriodBasicInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '현재 진행 단계',
        enum: evaluation_period_types_1.EvaluationPeriodPhase,
        example: evaluation_period_types_1.EvaluationPeriodPhase.SELF_EVALUATION,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationPeriodBasicInfoDto.prototype, "currentPhase", void 0);
class EmployeeBasicInfoDto {
    id;
    employeeNumber;
    name;
    email;
    departmentName;
    rankName;
    status;
}
exports.EmployeeBasicInfoDto = EmployeeBasicInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 번호',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원명',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '과장',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "rankName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 상태',
        example: '재직중',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "status", void 0);
class RegisterEvaluationTargetDto {
}
exports.RegisterEvaluationTargetDto = RegisterEvaluationTargetDto;
class RegisterBulkEvaluationTargetsDto {
    employeeIds;
}
exports.RegisterBulkEvaluationTargetsDto = RegisterBulkEvaluationTargetsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID 목록',
        example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '223e4567-e89b-12d3-a456-426614174001',
        ],
        type: [String],
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RegisterBulkEvaluationTargetsDto.prototype, "employeeIds", void 0);
class ExcludeEvaluationTargetDto {
    excludeReason;
}
exports.ExcludeEvaluationTargetDto = ExcludeEvaluationTargetDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 사유',
        example: '휴직으로 인한 평가 제외',
        maxLength: 500,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ExcludeEvaluationTargetDto.prototype, "excludeReason", void 0);
class IncludeEvaluationTargetDto {
}
exports.IncludeEvaluationTargetDto = IncludeEvaluationTargetDto;
class GetEvaluationTargetsQueryDto {
    includeExcluded;
}
exports.GetEvaluationTargetsQueryDto = GetEvaluationTargetsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외된 대상자 포함 여부 (기본값: false, 가능값: "true", "false", "1", "0")',
        type: String,
        example: 'false',
        default: 'false',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBooleanStrict)(false, 'includeExcluded'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetEvaluationTargetsQueryDto.prototype, "includeExcluded", void 0);
class EvaluationTargetItemDto {
    id;
    employee;
    isExcluded;
    excludeReason;
    excludedBy;
    excludedAt;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    deletedAt;
    version;
}
exports.EvaluationTargetItemDto = EvaluationTargetItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '맵핑 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], EvaluationTargetItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], EvaluationTargetItemDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationTargetItemDto.prototype, "isExcluded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 대상 제외 사유',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetItemDto.prototype, "excludeReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리자 ID',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetItemDto.prototype, "excludedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리 일시',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetItemDto.prototype, "excludedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성자 ID',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    }),
    __metadata("design:type", String)
], EvaluationTargetItemDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetItemDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationTargetItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationTargetItemDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetItemDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], EvaluationTargetItemDto.prototype, "version", void 0);
class EvaluationTargetsResponseDto {
    evaluationPeriodId;
    targets;
}
exports.EvaluationTargetsResponseDto = EvaluationTargetsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationTargetsResponseDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상자 목록',
        type: [EvaluationTargetItemDto],
    }),
    __metadata("design:type", Array)
], EvaluationTargetsResponseDto.prototype, "targets", void 0);
class EmployeeEvaluationPeriodMappingItemDto {
    id;
    evaluationPeriod;
    isExcluded;
    excludeReason;
    excludedBy;
    excludedAt;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    deletedAt;
    version;
}
exports.EmployeeEvaluationPeriodMappingItemDto = EmployeeEvaluationPeriodMappingItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '맵핑 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: EvaluationPeriodBasicInfoDto,
    }),
    __metadata("design:type", EvaluationPeriodBasicInfoDto)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "isExcluded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 대상 제외 사유',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "excludeReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리자 ID',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "excludedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리 일시',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "excludedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성자 ID',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], EmployeeEvaluationPeriodMappingItemDto.prototype, "version", void 0);
class EmployeeEvaluationPeriodsResponseDto {
    employee;
    mappings;
}
exports.EmployeeEvaluationPeriodsResponseDto = EmployeeEvaluationPeriodsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], EmployeeEvaluationPeriodsResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 맵핑 목록',
        type: [EmployeeEvaluationPeriodMappingItemDto],
    }),
    __metadata("design:type", Array)
], EmployeeEvaluationPeriodsResponseDto.prototype, "mappings", void 0);
class EvaluationTargetMappingResponseDto {
    id;
    evaluationPeriodId;
    employeeId;
    employee;
    isExcluded;
    excludeReason;
    excludedBy;
    excludedAt;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
    deletedAt;
    version;
}
exports.EvaluationTargetMappingResponseDto = EvaluationTargetMappingResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '맵핑 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], EvaluationTargetMappingResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationTargetMappingResponseDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '223e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EvaluationTargetMappingResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], EvaluationTargetMappingResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationTargetMappingResponseDto.prototype, "isExcluded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 대상 제외 사유',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetMappingResponseDto.prototype, "excludeReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리자 ID',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetMappingResponseDto.prototype, "excludedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리 일시',
        type: 'string',
        format: 'date-time',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationTargetMappingResponseDto.prototype, "excludedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성자 ID',
        example: 'admin-user-id',
    }),
    __metadata("design:type", String)
], EvaluationTargetMappingResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정자 ID',
        example: 'admin-user-id',
    }),
    __metadata("design:type", String)
], EvaluationTargetMappingResponseDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationTargetMappingResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationTargetMappingResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시 (소프트 삭제)',
        type: 'string',
        format: 'date-time',
        example: null,
        nullable: true,
    }),
    __metadata("design:type", Date)
], EvaluationTargetMappingResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전 (낙관적 잠금용)',
        example: 1,
    }),
    __metadata("design:type", Number)
], EvaluationTargetMappingResponseDto.prototype, "version", void 0);
class EvaluationTargetStatusResponseDto {
    isEvaluationTarget;
    evaluationPeriod;
    employee;
}
exports.EvaluationTargetStatusResponseDto = EvaluationTargetStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationTargetStatusResponseDto.prototype, "isEvaluationTarget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: EvaluationPeriodBasicInfoDto,
    }),
    __metadata("design:type", EvaluationPeriodBasicInfoDto)
], EvaluationTargetStatusResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], EvaluationTargetStatusResponseDto.prototype, "employee", void 0);
//# sourceMappingURL=evaluation-target.dto.js.map