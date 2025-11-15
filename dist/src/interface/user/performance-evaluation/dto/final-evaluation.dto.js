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
exports.FinalEvaluationListResponseDto = exports.FinalEvaluationListItemDto = exports.FinalEvaluationDetailDto = exports.PeriodBasicInfoDto = exports.EmployeeBasicInfoDto = exports.FinalEvaluationBasicDto = exports.FinalEvaluationResponseDto = exports.FinalEvaluationFilterDto = exports.CancelConfirmationBodyDto = exports.ConfirmFinalEvaluationBodyDto = exports.UpdateFinalEvaluationBodyDto = exports.UpsertFinalEvaluationBodyDto = void 0;
const final_evaluation_types_1 = require("../../../../domain/core/final-evaluation/final-evaluation.types");
const decorators_1 = require("../../../common/decorators");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class UpsertFinalEvaluationBodyDto {
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
}
exports.UpsertFinalEvaluationBodyDto = UpsertFinalEvaluationBodyDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급 (예: S, A, B, C, D)',
        example: 'A',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertFinalEvaluationBodyDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급',
        enum: final_evaluation_types_1.JobGrade,
        example: final_evaluation_types_1.JobGrade.T2,
    }),
    (0, class_validator_1.IsEnum)(final_evaluation_types_1.JobGrade),
    __metadata("design:type", String)
], UpsertFinalEvaluationBodyDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급',
        enum: final_evaluation_types_1.JobDetailedGrade,
        example: final_evaluation_types_1.JobDetailedGrade.N,
    }),
    (0, class_validator_1.IsEnum)(final_evaluation_types_1.JobDetailedGrade),
    __metadata("design:type", String)
], UpsertFinalEvaluationBodyDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpsertFinalEvaluationBodyDto.prototype, "finalComments", void 0);
class UpdateFinalEvaluationBodyDto {
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    updatedBy;
}
exports.UpdateFinalEvaluationBodyDto = UpdateFinalEvaluationBodyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가등급',
        example: 'A',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFinalEvaluationBodyDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직무등급',
        enum: final_evaluation_types_1.JobGrade,
        example: final_evaluation_types_1.JobGrade.T2,
    }),
    (0, class_validator_1.IsEnum)(final_evaluation_types_1.JobGrade),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFinalEvaluationBodyDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직무 상세등급',
        enum: final_evaluation_types_1.JobDetailedGrade,
        example: final_evaluation_types_1.JobDetailedGrade.N,
    }),
    (0, class_validator_1.IsEnum)(final_evaluation_types_1.JobDetailedGrade),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFinalEvaluationBodyDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFinalEvaluationBodyDto.prototype, "finalComments", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateFinalEvaluationBodyDto.prototype, "updatedBy", void 0);
class ConfirmFinalEvaluationBodyDto {
}
exports.ConfirmFinalEvaluationBodyDto = ConfirmFinalEvaluationBodyDto;
class CancelConfirmationBodyDto {
}
exports.CancelConfirmationBodyDto = CancelConfirmationBodyDto;
class FinalEvaluationFilterDto {
    employeeId;
    periodId;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    confirmedOnly;
    page;
    limit;
}
exports.FinalEvaluationFilterDto = FinalEvaluationFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FinalEvaluationFilterDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: '234e5678-e89b-12d3-a456-426614174001',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FinalEvaluationFilterDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가등급',
        example: 'A',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FinalEvaluationFilterDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직무등급',
        enum: final_evaluation_types_1.JobGrade,
        example: final_evaluation_types_1.JobGrade.T2,
    }),
    (0, class_validator_1.IsEnum)(final_evaluation_types_1.JobGrade),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FinalEvaluationFilterDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직무 상세등급',
        enum: final_evaluation_types_1.JobDetailedGrade,
        example: final_evaluation_types_1.JobDetailedGrade.N,
    }),
    (0, class_validator_1.IsEnum)(final_evaluation_types_1.JobDetailedGrade),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FinalEvaluationFilterDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정된 평가만 조회',
        example: true,
    }),
    (0, decorators_1.ToBoolean)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FinalEvaluationFilterDto.prototype, "confirmedOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호 (1부터 시작)',
        example: 1,
        default: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FinalEvaluationFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 10,
        default: 10,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], FinalEvaluationFilterDto.prototype, "limit", void 0);
class FinalEvaluationResponseDto {
    id;
    message;
}
exports.FinalEvaluationResponseDto = FinalEvaluationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], FinalEvaluationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 메시지',
        example: '최종평가가 성공적으로 저장되었습니다.',
    }),
    __metadata("design:type", String)
], FinalEvaluationResponseDto.prototype, "message", void 0);
class FinalEvaluationBasicDto {
    id;
    employeeId;
    periodId;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    isConfirmed;
    confirmedAt;
    confirmedBy;
    createdAt;
    updatedAt;
}
exports.FinalEvaluationBasicDto = FinalEvaluationBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '234e5678-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급',
        example: 'A',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급',
        enum: final_evaluation_types_1.JobGrade,
        example: final_evaluation_types_1.JobGrade.T2,
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급',
        enum: final_evaluation_types_1.JobDetailedGrade,
        example: final_evaluation_types_1.JobDetailedGrade.N,
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "finalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], FinalEvaluationBasicDto.prototype, "isConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationBasicDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정자 ID',
        example: '660e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "confirmedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-10T09:00:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationBasicDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-12T14:30:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationBasicDto.prototype, "updatedAt", void 0);
class EmployeeBasicInfoDto {
    id;
    name;
    employeeNumber;
    email;
}
exports.EmployeeBasicInfoDto = EmployeeBasicInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'employee@example.com',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "email", void 0);
class PeriodBasicInfoDto {
    id;
    name;
    startDate;
    status;
}
exports.PeriodBasicInfoDto = PeriodBasicInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '234e5678-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], PeriodBasicInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기 평가',
    }),
    __metadata("design:type", String)
], PeriodBasicInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시작일',
        example: '2024-01-01T00:00:00Z',
    }),
    __metadata("design:type", Date)
], PeriodBasicInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상태',
        example: 'in_progress',
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], PeriodBasicInfoDto.prototype, "status", void 0);
class FinalEvaluationDetailDto {
    id;
    employee;
    period;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    isConfirmed;
    confirmedAt;
    confirmedBy;
    createdAt;
    updatedAt;
    createdBy;
    updatedBy;
    version;
}
exports.FinalEvaluationDetailDto = FinalEvaluationDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], FinalEvaluationDetailDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: PeriodBasicInfoDto,
    }),
    __metadata("design:type", PeriodBasicInfoDto)
], FinalEvaluationDetailDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급',
        example: 'A',
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급',
        enum: final_evaluation_types_1.JobGrade,
        example: final_evaluation_types_1.JobGrade.T2,
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급',
        enum: final_evaluation_types_1.JobDetailedGrade,
        example: final_evaluation_types_1.JobDetailedGrade.N,
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "finalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], FinalEvaluationDetailDto.prototype, "isConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Object)
], FinalEvaluationDetailDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정자 ID',
        example: '660e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", Object)
], FinalEvaluationDetailDto.prototype, "confirmedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-10T09:00:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-12T14:30:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationDetailDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '수정자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], FinalEvaluationDetailDto.prototype, "updatedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], FinalEvaluationDetailDto.prototype, "version", void 0);
class FinalEvaluationListItemDto {
    id;
    employee;
    period;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    finalComments;
    isConfirmed;
    confirmedAt;
    confirmedBy;
    createdAt;
    updatedAt;
}
exports.FinalEvaluationListItemDto = FinalEvaluationListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '345e6789-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], FinalEvaluationListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], FinalEvaluationListItemDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: PeriodBasicInfoDto,
    }),
    __metadata("design:type", PeriodBasicInfoDto)
], FinalEvaluationListItemDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급',
        example: 'A',
    }),
    __metadata("design:type", String)
], FinalEvaluationListItemDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급',
        enum: final_evaluation_types_1.JobGrade,
        example: final_evaluation_types_1.JobGrade.T2,
    }),
    __metadata("design:type", String)
], FinalEvaluationListItemDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급',
        enum: final_evaluation_types_1.JobDetailedGrade,
        example: final_evaluation_types_1.JobDetailedGrade.N,
    }),
    __metadata("design:type", String)
], FinalEvaluationListItemDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
    }),
    __metadata("design:type", String)
], FinalEvaluationListItemDto.prototype, "finalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], FinalEvaluationListItemDto.prototype, "isConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Object)
], FinalEvaluationListItemDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정자 ID',
        example: '660e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", Object)
], FinalEvaluationListItemDto.prototype, "confirmedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-10T09:00:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationListItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-12T14:30:00Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationListItemDto.prototype, "updatedAt", void 0);
class FinalEvaluationListResponseDto {
    evaluations;
    total;
    page;
    limit;
}
exports.FinalEvaluationListResponseDto = FinalEvaluationListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 목록',
        type: [FinalEvaluationListItemDto],
    }),
    __metadata("design:type", Array)
], FinalEvaluationListResponseDto.prototype, "evaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 개수',
        example: 25,
    }),
    __metadata("design:type", Number)
], FinalEvaluationListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지',
        example: 1,
    }),
    __metadata("design:type", Number)
], FinalEvaluationListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 10,
    }),
    __metadata("design:type", Number)
], FinalEvaluationListResponseDto.prototype, "limit", void 0);
//# sourceMappingURL=final-evaluation.dto.js.map