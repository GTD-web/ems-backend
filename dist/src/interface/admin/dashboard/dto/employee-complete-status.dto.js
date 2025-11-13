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
exports.EmployeeCompleteStatusResponseDto = exports.ProjectsWithCountDto = exports.DownwardEvaluationStatusDto = exports.SelfEvaluationStatusDto = exports.PerformanceStatusDto = exports.WbsCriteriaStatusDto = exports.EvaluationLineWithEvaluatorsDto = exports.EvaluatorInfoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const employee_assigned_data_dto_1 = require("./employee-assigned-data.dto");
const employee_assigned_data_dto_2 = require("./employee-assigned-data.dto");
const employee_evaluation_period_status_dto_1 = require("./employee-evaluation-period-status.dto");
const employee_evaluation_period_status_dto_2 = require("./employee-evaluation-period-status.dto");
const employee_evaluation_period_status_dto_3 = require("./employee-evaluation-period-status.dto");
const employee_assigned_data_dto_3 = require("./employee-assigned-data.dto");
class EvaluatorInfoDto {
    id;
    name;
    employeeNumber;
    email;
    departmentName;
    rankName;
}
exports.EvaluatorInfoDto = EvaluatorInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자명',
        example: '김평가',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 사번',
        example: 'EMP002',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'kim@example.com',
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
        nullable: true,
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '과장',
        nullable: true,
    }),
    __metadata("design:type", String)
], EvaluatorInfoDto.prototype, "rankName", void 0);
class EvaluationLineWithEvaluatorsDto {
    status;
    hasPrimaryEvaluator;
    hasSecondaryEvaluator;
    primaryEvaluator;
    secondaryEvaluators;
}
exports.EvaluationLineWithEvaluatorsDto = EvaluationLineWithEvaluatorsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 지정 완료 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], EvaluationLineWithEvaluatorsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PRIMARY 라인 평가자 지정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationLineWithEvaluatorsDto.prototype, "hasPrimaryEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SECONDARY 라인 평가자 지정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationLineWithEvaluatorsDto.prototype, "hasSecondaryEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'PRIMARY 평가자 정보',
        type: () => EvaluatorInfoDto,
        nullable: true,
    }),
    (0, class_transformer_1.Type)(() => EvaluatorInfoDto),
    __metadata("design:type", Object)
], EvaluationLineWithEvaluatorsDto.prototype, "primaryEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SECONDARY 평가자 목록',
        type: () => [EvaluatorInfoDto],
    }),
    (0, class_transformer_1.Type)(() => EvaluatorInfoDto),
    __metadata("design:type", Array)
], EvaluationLineWithEvaluatorsDto.prototype, "secondaryEvaluators", void 0);
class WbsCriteriaStatusDto {
    status;
    totalWbsCount;
    wbsWithCriteriaCount;
}
exports.WbsCriteriaStatusDto = WbsCriteriaStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 평가기준 설정 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], WbsCriteriaStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], WbsCriteriaStatusDto.prototype, "totalWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준이 설정된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], WbsCriteriaStatusDto.prototype, "wbsWithCriteriaCount", void 0);
class PerformanceStatusDto {
    status;
    totalWbsCount;
    completedCount;
}
exports.PerformanceStatusDto = PerformanceStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과 입력 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], PerformanceStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PerformanceStatusDto.prototype, "totalWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과가 입력된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PerformanceStatusDto.prototype, "completedCount", void 0);
class SelfEvaluationStatusDto {
    status;
    totalCount;
    completedCount;
    isSubmittedToEvaluator;
    isSubmittedToManager;
    totalScore;
    grade;
}
exports.SelfEvaluationStatusDto = SelfEvaluationStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 진행 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'in_progress',
    }),
    __metadata("design:type", String)
], SelfEvaluationStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 자기평가 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SelfEvaluationStatusDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 WBS 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SelfEvaluationStatusDto.prototype, "completedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자가 1차 평가자에게 자기평가 제출 완료 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SelfEvaluationStatusDto.prototype, "isSubmittedToEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자가 관리자에게 자기평가 제출 완료 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SelfEvaluationStatusDto.prototype, "isSubmittedToManager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 자기평가 총점 (0-100)',
        example: 85.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SelfEvaluationStatusDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 자기평가 등급 (예: S+, A-, B 등)',
        example: 'A-',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SelfEvaluationStatusDto.prototype, "grade", void 0);
class DownwardEvaluationStatusDto {
    status;
    totalWbsCount;
    completedCount;
    isSubmitted;
    totalScore;
    grade;
}
exports.DownwardEvaluationStatusDto = DownwardEvaluationStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 통합 상태 (진행 상태 + 승인 상태)',
        enum: ['complete', 'in_progress', 'none', 'pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], DownwardEvaluationStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationStatusDto.prototype, "totalWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], DownwardEvaluationStatusDto.prototype, "completedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 하향평가가 제출되었는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], DownwardEvaluationStatusDto.prototype, "isSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 하향평가 총점 (0-100)',
        example: 85.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], DownwardEvaluationStatusDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 하향평가 등급 (예: S+, A-, B 등)',
        example: 'A-',
        nullable: true,
    }),
    __metadata("design:type", Object)
], DownwardEvaluationStatusDto.prototype, "grade", void 0);
class ProjectsWithCountDto {
    totalCount;
    items;
}
exports.ProjectsWithCountDto = ProjectsWithCountDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 프로젝트 수',
        example: 2,
    }),
    __metadata("design:type", Number)
], ProjectsWithCountDto.prototype, "totalCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 목록',
        type: () => [employee_assigned_data_dto_3.AssignedProjectWithWbsDto],
    }),
    (0, class_transformer_1.Type)(() => employee_assigned_data_dto_3.AssignedProjectWithWbsDto),
    __metadata("design:type", Array)
], ProjectsWithCountDto.prototype, "items", void 0);
class EmployeeCompleteStatusResponseDto {
    evaluationPeriod;
    employee;
    isEvaluationTarget;
    exclusionInfo;
    evaluationLine;
    wbsCriteria;
    performance;
    selfEvaluation;
    primaryDownwardEvaluation;
    secondaryDownwardEvaluation;
    peerEvaluation;
    finalEvaluation;
    projects;
}
exports.EmployeeCompleteStatusResponseDto = EmployeeCompleteStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 정보',
        type: () => employee_assigned_data_dto_1.EvaluationPeriodInfoDto,
    }),
    (0, class_transformer_1.Type)(() => employee_assigned_data_dto_1.EvaluationPeriodInfoDto),
    __metadata("design:type", employee_assigned_data_dto_1.EvaluationPeriodInfoDto)
], EmployeeCompleteStatusResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 정보',
        type: () => employee_assigned_data_dto_2.EmployeeInfoDto,
    }),
    (0, class_transformer_1.Type)(() => employee_assigned_data_dto_2.EmployeeInfoDto),
    __metadata("design:type", employee_assigned_data_dto_2.EmployeeInfoDto)
], EmployeeCompleteStatusResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 여부 (제외되지 않고 삭제되지 않은 경우)',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EmployeeCompleteStatusResponseDto.prototype, "isEvaluationTarget", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 정보',
        type: () => employee_evaluation_period_status_dto_1.ExclusionInfoDto,
    }),
    (0, class_transformer_1.Type)(() => employee_evaluation_period_status_dto_1.ExclusionInfoDto),
    __metadata("design:type", employee_evaluation_period_status_dto_1.ExclusionInfoDto)
], EmployeeCompleteStatusResponseDto.prototype, "exclusionInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 정보 (평가자 포함)',
        type: () => EvaluationLineWithEvaluatorsDto,
    }),
    (0, class_transformer_1.Type)(() => EvaluationLineWithEvaluatorsDto),
    __metadata("design:type", EvaluationLineWithEvaluatorsDto)
], EmployeeCompleteStatusResponseDto.prototype, "evaluationLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 평가기준 상태',
        type: () => WbsCriteriaStatusDto,
    }),
    (0, class_transformer_1.Type)(() => WbsCriteriaStatusDto),
    __metadata("design:type", WbsCriteriaStatusDto)
], EmployeeCompleteStatusResponseDto.prototype, "wbsCriteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과 입력 상태',
        type: () => PerformanceStatusDto,
    }),
    (0, class_transformer_1.Type)(() => PerformanceStatusDto),
    __metadata("design:type", PerformanceStatusDto)
], EmployeeCompleteStatusResponseDto.prototype, "performance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 상태 (점수/등급 포함)',
        type: () => SelfEvaluationStatusDto,
    }),
    (0, class_transformer_1.Type)(() => SelfEvaluationStatusDto),
    __metadata("design:type", SelfEvaluationStatusDto)
], EmployeeCompleteStatusResponseDto.prototype, "selfEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 하향평가 상태 (점수/등급 포함)',
        type: () => DownwardEvaluationStatusDto,
    }),
    (0, class_transformer_1.Type)(() => DownwardEvaluationStatusDto),
    __metadata("design:type", DownwardEvaluationStatusDto)
], EmployeeCompleteStatusResponseDto.prototype, "primaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 하향평가 상태 (점수/등급 포함)',
        type: () => DownwardEvaluationStatusDto,
    }),
    (0, class_transformer_1.Type)(() => DownwardEvaluationStatusDto),
    __metadata("design:type", DownwardEvaluationStatusDto)
], EmployeeCompleteStatusResponseDto.prototype, "secondaryDownwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 진행 정보',
        type: () => employee_evaluation_period_status_dto_2.PeerEvaluationInfoDto,
    }),
    (0, class_transformer_1.Type)(() => employee_evaluation_period_status_dto_2.PeerEvaluationInfoDto),
    __metadata("design:type", employee_evaluation_period_status_dto_2.PeerEvaluationInfoDto)
], EmployeeCompleteStatusResponseDto.prototype, "peerEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 정보',
        type: () => employee_evaluation_period_status_dto_3.FinalEvaluationInfoDto,
    }),
    (0, class_transformer_1.Type)(() => employee_evaluation_period_status_dto_3.FinalEvaluationInfoDto),
    __metadata("design:type", employee_evaluation_period_status_dto_3.FinalEvaluationInfoDto)
], EmployeeCompleteStatusResponseDto.prototype, "finalEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 목록 (카운트 포함)',
        type: () => ProjectsWithCountDto,
    }),
    (0, class_transformer_1.Type)(() => ProjectsWithCountDto),
    __metadata("design:type", ProjectsWithCountDto)
], EmployeeCompleteStatusResponseDto.prototype, "projects", void 0);
//# sourceMappingURL=employee-complete-status.dto.js.map