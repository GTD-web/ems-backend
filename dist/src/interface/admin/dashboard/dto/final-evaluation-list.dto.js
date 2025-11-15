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
exports.DashboardFinalEvaluationsByPeriodResponseDto = exports.EmployeeEvaluationItemDto = exports.EvaluationInfoDto = exports.PeriodInfoDto = exports.EmployeeInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class EmployeeInfoDto {
    id;
    name;
    employeeNumber;
    email;
    departmentName;
    rankName;
}
exports.EmployeeInfoDto = EmployeeInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원명',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '대리',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeInfoDto.prototype, "rankName", void 0);
class PeriodInfoDto {
    id;
    name;
    startDate;
}
exports.PeriodInfoDto = PeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], PeriodInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기',
    }),
    __metadata("design:type", String)
], PeriodInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 시작일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], PeriodInfoDto.prototype, "startDate", void 0);
class EvaluationInfoDto {
    id;
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
exports.EvaluationInfoDto = EvaluationInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급 (S, A, B, C, D 등)',
        example: 'A',
    }),
    __metadata("design:type", String)
], EvaluationInfoDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급 (T1, T2, T3)',
        enum: ['T1', 'T2', 'T3'],
        example: 'T2',
    }),
    __metadata("design:type", String)
], EvaluationInfoDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급 (u: 낮음, n: 중간, a: 높음)',
        enum: ['u', 'n', 'a'],
        example: 'n',
    }),
    __metadata("design:type", String)
], EvaluationInfoDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationInfoDto.prototype, "finalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationInfoDto.prototype, "isConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationInfoDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정자 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EvaluationInfoDto.prototype, "confirmedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationInfoDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationInfoDto.prototype, "updatedAt", void 0);
class EmployeeEvaluationItemDto {
    employee;
    evaluation;
}
exports.EmployeeEvaluationItemDto = EmployeeEvaluationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: () => EmployeeInfoDto,
    }),
    __metadata("design:type", EmployeeInfoDto)
], EmployeeEvaluationItemDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 정보',
        type: () => EvaluationInfoDto,
    }),
    __metadata("design:type", EvaluationInfoDto)
], EmployeeEvaluationItemDto.prototype, "evaluation", void 0);
class DashboardFinalEvaluationsByPeriodResponseDto {
    period;
    evaluations;
}
exports.DashboardFinalEvaluationsByPeriodResponseDto = DashboardFinalEvaluationsByPeriodResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: () => PeriodInfoDto,
    }),
    __metadata("design:type", PeriodInfoDto)
], DashboardFinalEvaluationsByPeriodResponseDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원별 최종평가 목록',
        type: [EmployeeEvaluationItemDto],
    }),
    __metadata("design:type", Array)
], DashboardFinalEvaluationsByPeriodResponseDto.prototype, "evaluations", void 0);
//# sourceMappingURL=final-evaluation-list.dto.js.map