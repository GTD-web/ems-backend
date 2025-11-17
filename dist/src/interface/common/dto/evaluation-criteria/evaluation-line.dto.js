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
exports.BatchConfigureSecondaryEvaluatorResponseDto = exports.BatchSecondaryEvaluatorResultItemDto = exports.BatchConfigureSecondaryEvaluatorDto = exports.BatchSecondaryEvaluatorAssignmentItemDto = exports.BatchConfigurePrimaryEvaluatorResponseDto = exports.BatchPrimaryEvaluatorResultItemDto = exports.BatchConfigurePrimaryEvaluatorDto = exports.BatchPrimaryEvaluatorAssignmentItemDto = exports.PrimaryEvaluatorsByPeriodResponseDto = exports.PrimaryEvaluatorInfoDto = exports.EvaluatorsByPeriodResponseDto = exports.EvaluatorInfoDto = exports.EvaluatorTypeQueryDto = exports.ConfigureEvaluatorResponseDto = exports.ConfigureSecondaryEvaluatorDto = exports.ConfigurePrimaryEvaluatorDto = exports.EmployeeEvaluationSettingsResponseDto = exports.EvaluatorEmployeesResponseDto = exports.EmployeeEvaluationLineMappingsResponseDto = exports.EvaluationLineMappingDto = exports.EvaluationLineDto = exports.ConfigureEmployeeWbsEvaluationLineResponseDto = exports.ConfigureEmployeeWbsEvaluationLineDto = exports.EvaluationLineFilterDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class EvaluationLineFilterDto {
    evaluatorType;
    isRequired;
    isAutoAssigned;
}
exports.EvaluationLineFilterDto = EvaluationLineFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '평가자 유형', example: 'primary' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['primary', 'secondary', 'additional']),
    __metadata("design:type", String)
], EvaluationLineFilterDto.prototype, "evaluatorType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '필수 평가자 여부', example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], EvaluationLineFilterDto.prototype, "isRequired", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '자동 할당 여부', example: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], EvaluationLineFilterDto.prototype, "isAutoAssigned", void 0);
class ConfigureEmployeeWbsEvaluationLineDto {
    employeeId;
    wbsItemId;
    periodId;
    createdBy;
}
exports.ConfigureEmployeeWbsEvaluationLineDto = ConfigureEmployeeWbsEvaluationLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConfigureEmployeeWbsEvaluationLineDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConfigureEmployeeWbsEvaluationLineDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConfigureEmployeeWbsEvaluationLineDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConfigureEmployeeWbsEvaluationLineDto.prototype, "createdBy", void 0);
class ConfigureEmployeeWbsEvaluationLineResponseDto {
    message;
    createdLines;
    createdMappings;
}
exports.ConfigureEmployeeWbsEvaluationLineResponseDto = ConfigureEmployeeWbsEvaluationLineResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '결과 메시지',
        example: '평가라인 구성이 완료되었습니다.',
    }),
    __metadata("design:type", String)
], ConfigureEmployeeWbsEvaluationLineResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성된 평가라인 수', example: 2 }),
    __metadata("design:type", Number)
], ConfigureEmployeeWbsEvaluationLineResponseDto.prototype, "createdLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성된 매핑 수', example: 5 }),
    __metadata("design:type", Number)
], ConfigureEmployeeWbsEvaluationLineResponseDto.prototype, "createdMappings", void 0);
class EvaluationLineDto {
    id;
    evaluatorType;
    order;
    isRequired;
    isAutoAssigned;
    createdAt;
    updatedAt;
}
exports.EvaluationLineDto = EvaluationLineDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 ID',
        example: 'g2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    }),
    __metadata("design:type", String)
], EvaluationLineDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가자 유형', example: 'primary' }),
    __metadata("design:type", String)
], EvaluationLineDto.prototype, "evaluatorType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '평가 순서', example: 1 }),
    __metadata("design:type", Number)
], EvaluationLineDto.prototype, "order", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '필수 평가자 여부', example: true }),
    __metadata("design:type", Boolean)
], EvaluationLineDto.prototype, "isRequired", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '자동 할당 여부', example: false }),
    __metadata("design:type", Boolean)
], EvaluationLineDto.prototype, "isAutoAssigned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], EvaluationLineDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수정일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], EvaluationLineDto.prototype, "updatedAt", void 0);
class EvaluationLineMappingDto {
    id;
    employeeId;
    evaluatorId;
    wbsItemId;
    evaluationLineId;
    createdBy;
    updatedBy;
    createdAt;
    updatedAt;
}
exports.EvaluationLineMappingDto = EvaluationLineMappingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매핑 ID',
        example: 'h3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 ID',
        example: 'g2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "evaluationLineId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    }),
    __metadata("design:type", String)
], EvaluationLineMappingDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], EvaluationLineMappingDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '수정일시', example: '2024-10-01T09:00:00Z' }),
    __metadata("design:type", Date)
], EvaluationLineMappingDto.prototype, "updatedAt", void 0);
class EmployeeEvaluationLineMappingsResponseDto {
    employeeId;
    mappings;
}
exports.EmployeeEvaluationLineMappingsResponseDto = EmployeeEvaluationLineMappingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationLineMappingsResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 매핑 목록',
        type: [EvaluationLineMappingDto],
    }),
    __metadata("design:type", Array)
], EmployeeEvaluationLineMappingsResponseDto.prototype, "mappings", void 0);
class EvaluatorEmployeesResponseDto {
    evaluatorId;
    employees;
}
exports.EvaluatorEmployeesResponseDto = EvaluatorEmployeesResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], EvaluatorEmployeesResponseDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 목록',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                employeeId: { type: 'string', format: 'uuid' },
                wbsItemId: { type: 'string', format: 'uuid' },
                evaluationLineId: { type: 'string', format: 'uuid' },
                createdBy: { type: 'string', format: 'uuid' },
                updatedBy: { type: 'string', format: 'uuid' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
            },
        },
    }),
    __metadata("design:type", Array)
], EvaluatorEmployeesResponseDto.prototype, "employees", void 0);
class EmployeeEvaluationSettingsResponseDto {
    employeeId;
    periodId;
    projectAssignments;
    wbsAssignments;
    evaluationLineMappings;
}
exports.EmployeeEvaluationSettingsResponseDto = EmployeeEvaluationSettingsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationSettingsResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationSettingsResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 할당 목록',
        type: 'array',
        items: { type: 'object' },
    }),
    __metadata("design:type", Array)
], EmployeeEvaluationSettingsResponseDto.prototype, "projectAssignments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 할당 목록',
        type: 'array',
        items: { type: 'object' },
    }),
    __metadata("design:type", Array)
], EmployeeEvaluationSettingsResponseDto.prototype, "wbsAssignments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 매핑 목록',
        type: [EvaluationLineMappingDto],
    }),
    __metadata("design:type", Array)
], EmployeeEvaluationSettingsResponseDto.prototype, "evaluationLineMappings", void 0);
class ConfigurePrimaryEvaluatorDto {
    evaluatorId;
}
exports.ConfigurePrimaryEvaluatorDto = ConfigurePrimaryEvaluatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConfigurePrimaryEvaluatorDto.prototype, "evaluatorId", void 0);
class ConfigureSecondaryEvaluatorDto {
    evaluatorId;
}
exports.ConfigureSecondaryEvaluatorDto = ConfigureSecondaryEvaluatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConfigureSecondaryEvaluatorDto.prototype, "evaluatorId", void 0);
class ConfigureEvaluatorResponseDto {
    message;
    createdLines;
    createdMappings;
    mapping;
}
exports.ConfigureEvaluatorResponseDto = ConfigureEvaluatorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '결과 메시지',
        example: '평가라인 구성이 완료되었습니다.',
    }),
    __metadata("design:type", String)
], ConfigureEvaluatorResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성된 평가라인 수', example: 1 }),
    __metadata("design:type", Number)
], ConfigureEvaluatorResponseDto.prototype, "createdLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '생성된 매핑 수', example: 1 }),
    __metadata("design:type", Number)
], ConfigureEvaluatorResponseDto.prototype, "createdMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 매핑 정보',
        type: 'object',
        properties: {
            id: { type: 'string', format: 'uuid' },
            employeeId: { type: 'string', format: 'uuid' },
            evaluatorId: { type: 'string', format: 'uuid' },
            wbsItemId: { type: 'string', format: 'uuid' },
            evaluationLineId: { type: 'string', format: 'uuid' },
        },
    }),
    __metadata("design:type", Object)
], ConfigureEvaluatorResponseDto.prototype, "mapping", void 0);
class EvaluatorTypeQueryDto {
    type;
}
exports.EvaluatorTypeQueryDto = EvaluatorTypeQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 유형 (primary: 1차만, secondary: 2차만, all: 전체)',
        enum: ['primary', 'secondary', 'all'],
        default: 'all',
        example: 'all',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['primary', 'secondary', 'all']),
    __metadata("design:type", String)
], EvaluatorTypeQueryDto.prototype, "type", void 0);
class EvaluatorInfoDto {
    evaluatorId;
    evaluatorName;
    departmentName;
    evaluatorType;
    evaluateeCount;
}
exports.EvaluatorInfoDto = EvaluatorInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "evaluatorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 유형 (primary: 1차, secondary: 2차)',
        enum: ['primary', 'secondary'],
        example: 'primary',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "evaluatorType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '담당 피평가자 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], EvaluatorInfoDto.prototype, "evaluateeCount", void 0);
class EvaluatorsByPeriodResponseDto {
    periodId;
    type;
    evaluators;
}
exports.EvaluatorsByPeriodResponseDto = EvaluatorsByPeriodResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    __metadata("design:type", String)
], EvaluatorsByPeriodResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '조회된 평가자 유형',
        enum: ['primary', 'secondary', 'all'],
        example: 'all',
    }),
    __metadata("design:type", String)
], EvaluatorsByPeriodResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 목록',
        type: [EvaluatorInfoDto],
    }),
    __metadata("design:type", Array)
], EvaluatorsByPeriodResponseDto.prototype, "evaluators", void 0);
class PrimaryEvaluatorInfoDto extends EvaluatorInfoDto {
}
exports.PrimaryEvaluatorInfoDto = PrimaryEvaluatorInfoDto;
class PrimaryEvaluatorsByPeriodResponseDto extends EvaluatorsByPeriodResponseDto {
}
exports.PrimaryEvaluatorsByPeriodResponseDto = PrimaryEvaluatorsByPeriodResponseDto;
class BatchPrimaryEvaluatorAssignmentItemDto {
    employeeId;
    evaluatorId;
}
exports.BatchPrimaryEvaluatorAssignmentItemDto = BatchPrimaryEvaluatorAssignmentItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorAssignmentItemDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorAssignmentItemDto.prototype, "evaluatorId", void 0);
class BatchConfigurePrimaryEvaluatorDto {
    assignments;
}
exports.BatchConfigurePrimaryEvaluatorDto = BatchConfigurePrimaryEvaluatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자 할당 목록',
        type: [BatchPrimaryEvaluatorAssignmentItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BatchPrimaryEvaluatorAssignmentItemDto),
    __metadata("design:type", Array)
], BatchConfigurePrimaryEvaluatorDto.prototype, "assignments", void 0);
class BatchPrimaryEvaluatorResultItemDto {
    employeeId;
    evaluatorId;
    status;
    message;
    mapping;
    error;
}
exports.BatchPrimaryEvaluatorResultItemDto = BatchPrimaryEvaluatorResultItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorResultItemDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorResultItemDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리 결과 (success: 성공, error: 실패)',
        enum: ['success', 'error'],
    }),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorResultItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '결과 메시지',
    }),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorResultItemDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성된 매핑 정보',
    }),
    __metadata("design:type", Object)
], BatchPrimaryEvaluatorResultItemDto.prototype, "mapping", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '에러 메시지 (실패 시)',
    }),
    __metadata("design:type", String)
], BatchPrimaryEvaluatorResultItemDto.prototype, "error", void 0);
class BatchConfigurePrimaryEvaluatorResponseDto {
    periodId;
    totalCount;
    successCount;
    failureCount;
    createdLines;
    createdMappings;
    results;
}
exports.BatchConfigurePrimaryEvaluatorResponseDto = BatchConfigurePrimaryEvaluatorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    __metadata("design:type", String)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 처리 건수',
        example: 5,
    }),
    __metadata("design:type", Number)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 건수',
        example: 4,
    }),
    __metadata("design:type", Number)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 건수',
        example: 1,
    }),
    __metadata("design:type", Number)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "failureCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 평가라인 수',
        example: 1,
    }),
    __metadata("design:type", Number)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "createdLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 매핑 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "createdMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리 결과 목록',
        type: [BatchPrimaryEvaluatorResultItemDto],
    }),
    __metadata("design:type", Array)
], BatchConfigurePrimaryEvaluatorResponseDto.prototype, "results", void 0);
class BatchSecondaryEvaluatorAssignmentItemDto {
    employeeId;
    wbsItemId;
    evaluatorId;
}
exports.BatchSecondaryEvaluatorAssignmentItemDto = BatchSecondaryEvaluatorAssignmentItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorAssignmentItemDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorAssignmentItemDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorAssignmentItemDto.prototype, "evaluatorId", void 0);
class BatchConfigureSecondaryEvaluatorDto {
    assignments;
}
exports.BatchConfigureSecondaryEvaluatorDto = BatchConfigureSecondaryEvaluatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 할당 목록',
        type: [BatchSecondaryEvaluatorAssignmentItemDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BatchSecondaryEvaluatorAssignmentItemDto),
    __metadata("design:type", Array)
], BatchConfigureSecondaryEvaluatorDto.prototype, "assignments", void 0);
class BatchSecondaryEvaluatorResultItemDto {
    employeeId;
    wbsItemId;
    evaluatorId;
    status;
    message;
    mapping;
    error;
}
exports.BatchSecondaryEvaluatorResultItemDto = BatchSecondaryEvaluatorResultItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 직원 ID',
        example: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    }),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorResultItemDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 항목 ID',
        example: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    }),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorResultItemDto.prototype, "wbsItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 ID',
        example: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    }),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorResultItemDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리 결과 (success: 성공, error: 실패)',
        enum: ['success', 'error'],
    }),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorResultItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '결과 메시지',
    }),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorResultItemDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성된 매핑 정보',
    }),
    __metadata("design:type", Object)
], BatchSecondaryEvaluatorResultItemDto.prototype, "mapping", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '에러 메시지 (실패 시)',
    }),
    __metadata("design:type", String)
], BatchSecondaryEvaluatorResultItemDto.prototype, "error", void 0);
class BatchConfigureSecondaryEvaluatorResponseDto {
    periodId;
    totalCount;
    successCount;
    failureCount;
    createdLines;
    createdMappings;
    results;
}
exports.BatchConfigureSecondaryEvaluatorResponseDto = BatchConfigureSecondaryEvaluatorResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    }),
    __metadata("design:type", String)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 처리 건수',
        example: 5,
    }),
    __metadata("design:type", Number)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 건수',
        example: 4,
    }),
    __metadata("design:type", Number)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "successCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패 건수',
        example: 1,
    }),
    __metadata("design:type", Number)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "failureCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 평가라인 수',
        example: 1,
    }),
    __metadata("design:type", Number)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "createdLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 매핑 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "createdMappings", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '처리 결과 목록',
        type: [BatchSecondaryEvaluatorResultItemDto],
    }),
    __metadata("design:type", Array)
], BatchConfigureSecondaryEvaluatorResponseDto.prototype, "results", void 0);
//# sourceMappingURL=evaluation-line.dto.js.map