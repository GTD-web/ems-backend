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
exports.AllEmployeesFinalEvaluationsResponseDto = exports.EmployeeWithFinalEvaluationsDto = exports.FinalEvaluationBasicDto = exports.PeriodBasicDto = exports.EmployeeBasicDto = exports.GetAllEmployeesFinalEvaluationsQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../decorators");
class GetAllEmployeesFinalEvaluationsQueryDto {
    startDate;
    endDate;
}
exports.GetAllEmployeesFinalEvaluationsQueryDto = GetAllEmployeesFinalEvaluationsQueryDto;
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
], GetAllEmployeesFinalEvaluationsQueryDto.prototype, "startDate", void 0);
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
], GetAllEmployeesFinalEvaluationsQueryDto.prototype, "endDate", void 0);
class EmployeeBasicDto {
    id;
    name;
    employeeNumber;
    email;
    departmentName;
    rankName;
    status;
    hireDate;
}
exports.EmployeeBasicDto = EmployeeBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원명',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeBasicDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], EmployeeBasicDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], EmployeeBasicDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeBasicDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '대리',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeBasicDto.prototype, "rankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 상태',
        enum: ['재직중', '휴직중', '퇴사'],
        example: '재직중',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeBasicDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '입사일',
        type: 'string',
        format: 'date',
        example: '2024-01-01',
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeBasicDto.prototype, "hireDate", void 0);
class PeriodBasicDto {
    id;
    name;
    startDate;
}
exports.PeriodBasicDto = PeriodBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], PeriodBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기',
    }),
    __metadata("design:type", String)
], PeriodBasicDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 시작일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], PeriodBasicDto.prototype, "startDate", void 0);
class FinalEvaluationBasicDto {
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
exports.FinalEvaluationBasicDto = FinalEvaluationBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가등급 (S, A, B, C, D 등)',
        example: 'A',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무등급 (T1, T2, T3)',
        enum: ['T1', 'T2', 'T3'],
        example: 'T2',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직무 상세등급 (u: 낮음, n: 중간, a: 높음)',
        enum: ['u', 'n', 'a'],
        example: 'n',
    }),
    __metadata("design:type", String)
], FinalEvaluationBasicDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최종 평가 의견',
        example: '전반적으로 우수한 성과를 보였습니다.',
        nullable: true,
    }),
    __metadata("design:type", Object)
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
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationBasicDto.prototype, "confirmedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationBasicDto.prototype, "confirmedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-01T09:00:00.000Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationBasicDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
    }),
    __metadata("design:type", Date)
], FinalEvaluationBasicDto.prototype, "updatedAt", void 0);
class EmployeeWithFinalEvaluationsDto {
    employee;
    finalEvaluations;
}
exports.EmployeeWithFinalEvaluationsDto = EmployeeWithFinalEvaluationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: () => EmployeeBasicDto,
    }),
    __metadata("design:type", EmployeeBasicDto)
], EmployeeWithFinalEvaluationsDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 목록 (평가기간 배열 순서와 매칭됨, 해당 평가기간에 평가가 없으면 해당 인덱스는 null)',
        type: [FinalEvaluationBasicDto],
        isArray: true,
        example: [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                evaluationGrade: 'A',
                jobGrade: 'T2',
                jobDetailedGrade: 'n',
                finalComments: '우수한 성과를 보였습니다.',
                isConfirmed: true,
                confirmedAt: '2024-07-15T10:30:00.000Z',
                confirmedBy: '123e4567-e89b-12d3-a456-426614174001',
                createdAt: '2024-07-10T14:20:00.000Z',
                updatedAt: '2024-07-15T10:30:00.000Z',
            },
            null,
        ],
    }),
    __metadata("design:type", Array)
], EmployeeWithFinalEvaluationsDto.prototype, "finalEvaluations", void 0);
class AllEmployeesFinalEvaluationsResponseDto {
    evaluationPeriods;
    employees;
}
exports.AllEmployeesFinalEvaluationsResponseDto = AllEmployeesFinalEvaluationsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 목록 (시작일 내림차순 정렬)',
        type: [PeriodBasicDto],
    }),
    __metadata("design:type", Array)
], AllEmployeesFinalEvaluationsResponseDto.prototype, "evaluationPeriods", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원별 최종평가 목록 (사번 오름차순 정렬)',
        type: [EmployeeWithFinalEvaluationsDto],
    }),
    __metadata("design:type", Array)
], AllEmployeesFinalEvaluationsResponseDto.prototype, "employees", void 0);
//# sourceMappingURL=all-employees-final-evaluations.dto.js.map