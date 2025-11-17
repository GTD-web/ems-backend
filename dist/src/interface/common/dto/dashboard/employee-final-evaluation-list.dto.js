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
exports.EmployeeFinalEvaluationListResponseDto = exports.FinalEvaluationItemDto = exports.EvaluationPeriodInfoDto = exports.EmployeeBasicInfoDto = exports.GetEmployeeFinalEvaluationsQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../decorators");
class GetEmployeeFinalEvaluationsQueryDto {
    startDate;
    endDate;
}
exports.GetEmployeeFinalEvaluationsQueryDto = GetEmployeeFinalEvaluationsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조회 시작일 (평가기간 시작일 기준)',
        type: 'string',
        format: 'date',
        example: '2024-01-01',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetEmployeeFinalEvaluationsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '조회 종료일 (평가기간 시작일 기준)',
        type: 'string',
        format: 'date',
        example: '2024-12-31',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], GetEmployeeFinalEvaluationsQueryDto.prototype, "endDate", void 0);
class EmployeeBasicInfoDto {
    id;
    name;
    employeeNumber;
    email;
    departmentName;
    rankName;
}
exports.EmployeeBasicInfoDto = EmployeeBasicInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원명',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeBasicInfoDto.prototype, "employeeNumber", void 0);
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
    __metadata("design:type", Object)
], EmployeeBasicInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '대리',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeBasicInfoDto.prototype, "rankName", void 0);
class EvaluationPeriodInfoDto {
    id;
    name;
    startDate;
}
exports.EvaluationPeriodInfoDto = EvaluationPeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 시작일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "startDate", void 0);
class FinalEvaluationItemDto {
    id;
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
exports.FinalEvaluationItemDto = FinalEvaluationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], FinalEvaluationItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: () => EvaluationPeriodInfoDto,
    }),
    __metadata("design:type", EvaluationPeriodInfoDto)
], FinalEvaluationItemDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급 (S, A, B, C, D 등)',
        example: 'A',
    }),
    __metadata("design:type", String)
], FinalEvaluationItemDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급 (T1, T2, T3)',
        enum: ['T1', 'T2', 'T3'],
        example: 'T2',
    }),
    __metadata("design:type", String)
], FinalEvaluationItemDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급 (u: 낮음, n: 중간, a: 높음)',
        enum: ['u', 'n', 'a'],
        example: 'n',
    }),
    __metadata("design:type", String)
], FinalEvaluationItemDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationItemDto.prototype, "finalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], FinalEvaluationItemDto.prototype, "isConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationItemDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationItemDto.prototype, "confirmedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationItemDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationItemDto.prototype, "updatedAt", void 0);
class EmployeeFinalEvaluationListResponseDto {
    employee;
    finalEvaluations;
}
exports.EmployeeFinalEvaluationListResponseDto = EmployeeFinalEvaluationListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: () => EmployeeBasicInfoDto,
    }),
    __metadata("design:type", EmployeeBasicInfoDto)
], EmployeeFinalEvaluationListResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 목록 (평가기간별)',
        type: [FinalEvaluationItemDto],
    }),
    __metadata("design:type", Array)
], EmployeeFinalEvaluationListResponseDto.prototype, "finalEvaluations", void 0);
//# sourceMappingURL=employee-final-evaluation-list.dto.js.map