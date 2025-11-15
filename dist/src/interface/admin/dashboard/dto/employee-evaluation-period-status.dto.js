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
exports.EmployeeEvaluationPeriodStatusResponseDto = exports.StepApprovalInfoDto = exports.SecondaryEvaluationStatusDto = exports.ExclusionInfoDto = exports.FinalEvaluationInfoDto = exports.PeerEvaluationInfoDto = exports.DownwardEvaluationInfoDto = exports.SecondaryDownwardEvaluationDto = exports.SecondaryEvaluatorDto = exports.PrimaryDownwardEvaluationDto = exports.SelfEvaluationInfoDto = exports.PerformanceInputDto = exports.CriteriaSetupDto = exports.CriteriaSubmissionInfoDto = exports.EvaluationLineInfoDto = exports.WbsCriteriaInfoDto = exports.EvaluationCriteriaInfoDto = exports.EvaluatorInfoDto = exports.EmployeeInfoDto = exports.EvaluationPeriodInfoDto = exports.EvaluationPeriodManualSettingsDto = exports.GetEmployeeEvaluationPeriodStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class GetEmployeeEvaluationPeriodStatusDto {
    evaluationPeriodId;
    employeeId;
}
exports.GetEmployeeEvaluationPeriodStatusDto = GetEmployeeEvaluationPeriodStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetEmployeeEvaluationPeriodStatusDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetEmployeeEvaluationPeriodStatusDto.prototype, "employeeId", void 0);
class EvaluationPeriodManualSettingsDto {
    criteriaSettingEnabled;
    selfEvaluationSettingEnabled;
    finalEvaluationSettingEnabled;
}
exports.EvaluationPeriodManualSettingsDto = EvaluationPeriodManualSettingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기준 설정 수동 허용 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodManualSettingsDto.prototype, "criteriaSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기 평가 설정 수동 허용 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodManualSettingsDto.prototype, "selfEvaluationSettingEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향/동료평가 설정 수동 허용 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], EvaluationPeriodManualSettingsDto.prototype, "finalEvaluationSettingEnabled", void 0);
class EvaluationPeriodInfoDto {
    id;
    name;
    status;
    currentPhase;
    startDate;
    endDate;
    manualSettings;
}
exports.EvaluationPeriodInfoDto = EvaluationPeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간명',
        example: '2024년 상반기 평가',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 기간 상태',
        example: 'IN_PROGRESS',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 평가 단계',
        example: 'SELF_EVALUATION',
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "currentPhase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 시작일',
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 종료일',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T23:59:59.999Z',
        nullable: true,
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수동 설정 상태 정보',
        type: () => EvaluationPeriodManualSettingsDto,
    }),
    __metadata("design:type", EvaluationPeriodManualSettingsDto)
], EvaluationPeriodInfoDto.prototype, "manualSettings", void 0);
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
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '대리',
        nullable: true,
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "rankName", void 0);
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
class EvaluationCriteriaInfoDto {
    status;
    assignedProjectCount;
    assignedWbsCount;
}
exports.EvaluationCriteriaInfoDto = EvaluationCriteriaInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가항목 설정 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], EvaluationCriteriaInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 프로젝트 수',
        example: 2,
    }),
    __metadata("design:type", Number)
], EvaluationCriteriaInfoDto.prototype, "assignedProjectCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '할당된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], EvaluationCriteriaInfoDto.prototype, "assignedWbsCount", void 0);
class WbsCriteriaInfoDto {
    status;
    wbsWithCriteriaCount;
}
exports.WbsCriteriaInfoDto = WbsCriteriaInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 평가기준 설정 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], WbsCriteriaInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준이 설정된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], WbsCriteriaInfoDto.prototype, "wbsWithCriteriaCount", void 0);
class EvaluationLineInfoDto {
    status;
    hasPrimaryEvaluator;
    hasSecondaryEvaluator;
}
exports.EvaluationLineInfoDto = EvaluationLineInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 지정 완료 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], EvaluationLineInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PRIMARY 라인 평가자 지정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationLineInfoDto.prototype, "hasPrimaryEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'SECONDARY 라인 평가자 지정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EvaluationLineInfoDto.prototype, "hasSecondaryEvaluator", void 0);
class CriteriaSubmissionInfoDto {
    isSubmitted;
    submittedAt;
    submittedBy;
}
exports.CriteriaSubmissionInfoDto = CriteriaSubmissionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], CriteriaSubmissionInfoDto.prototype, "isSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 제출 일시',
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], CriteriaSubmissionInfoDto.prototype, "submittedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 제출 처리자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], CriteriaSubmissionInfoDto.prototype, "submittedBy", void 0);
class CriteriaSetupDto {
    status;
    evaluationCriteria;
    wbsCriteria;
    evaluationLine;
    criteriaSubmission;
}
exports.CriteriaSetupDto = CriteriaSetupDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 설정 상태 (계산된 상태)',
        enum: ['none', 'in_progress', 'pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'none',
    }),
    __metadata("design:type", String)
], CriteriaSetupDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가항목 설정 정보',
        type: () => EvaluationCriteriaInfoDto,
    }),
    __metadata("design:type", EvaluationCriteriaInfoDto)
], CriteriaSetupDto.prototype, "evaluationCriteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'WBS 평가기준 설정 정보',
        type: () => WbsCriteriaInfoDto,
    }),
    __metadata("design:type", WbsCriteriaInfoDto)
], CriteriaSetupDto.prototype, "wbsCriteria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가라인 지정 정보',
        type: () => EvaluationLineInfoDto,
    }),
    __metadata("design:type", EvaluationLineInfoDto)
], CriteriaSetupDto.prototype, "evaluationLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 제출 상태',
        type: () => CriteriaSubmissionInfoDto,
    }),
    __metadata("design:type", CriteriaSubmissionInfoDto)
], CriteriaSetupDto.prototype, "criteriaSubmission", void 0);
class PerformanceInputDto {
    status;
    totalWbsCount;
    inputCompletedCount;
}
exports.PerformanceInputDto = PerformanceInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과 입력 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], PerformanceInputDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PerformanceInputDto.prototype, "totalWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과가 입력된 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PerformanceInputDto.prototype, "inputCompletedCount", void 0);
class SelfEvaluationInfoDto {
    status;
    totalMappingCount;
    completedMappingCount;
    isSubmittedToEvaluator;
    isSubmittedToManager;
    totalScore;
    grade;
}
exports.SelfEvaluationInfoDto = SelfEvaluationInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 진행 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'in_progress',
    }),
    __metadata("design:type", String)
], SelfEvaluationInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 WBS 자기평가 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SelfEvaluationInfoDto.prototype, "totalMappingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 WBS 자기평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SelfEvaluationInfoDto.prototype, "completedMappingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자가 1차 평가자에게 자기평가 제출 완료 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SelfEvaluationInfoDto.prototype, "isSubmittedToEvaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 평가자가 관리자에게 자기평가 제출 완료 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SelfEvaluationInfoDto.prototype, "isSubmittedToManager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 자기평가 총점 (0-100)',
        example: 85.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SelfEvaluationInfoDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 자기평가 등급 (예: S+, A-, B 등)',
        example: 'A-',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SelfEvaluationInfoDto.prototype, "grade", void 0);
class PrimaryDownwardEvaluationDto {
    evaluator;
    status;
    assignedWbsCount;
    completedEvaluationCount;
    isSubmitted;
    totalScore;
    grade;
}
exports.PrimaryDownwardEvaluationDto = PrimaryDownwardEvaluationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 평가자 정보',
        type: () => EvaluatorInfoDto,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PrimaryDownwardEvaluationDto.prototype, "evaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 하향평가 통합 상태 (진행 상태 + 승인 상태)',
        enum: ['complete', 'in_progress', 'none', 'pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], PrimaryDownwardEvaluationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], PrimaryDownwardEvaluationDto.prototype, "assignedWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 평가 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], PrimaryDownwardEvaluationDto.prototype, "completedEvaluationCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 하향평가가 제출되었는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PrimaryDownwardEvaluationDto.prototype, "isSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 1차 하향평가 총점 (0-100)',
        example: 85.5,
        nullable: true,
    }),
    __metadata("design:type", Object)
], PrimaryDownwardEvaluationDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 1차 하향평가 등급 (예: S+, A-, B 등)',
        example: 'A-',
        nullable: true,
    }),
    __metadata("design:type", Object)
], PrimaryDownwardEvaluationDto.prototype, "grade", void 0);
class SecondaryEvaluatorDto {
    evaluator;
    status;
    assignedWbsCount;
    completedEvaluationCount;
    isSubmitted;
}
exports.SecondaryEvaluatorDto = SecondaryEvaluatorDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 정보',
        type: () => EvaluatorInfoDto,
    }),
    __metadata("design:type", EvaluatorInfoDto)
], SecondaryEvaluatorDto.prototype, "evaluator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 하향평가 통합 상태 (진행 상태 + 승인 상태)',
        enum: ['complete', 'in_progress', 'none', 'pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], SecondaryEvaluatorDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 WBS 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SecondaryEvaluatorDto.prototype, "assignedWbsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 평가 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], SecondaryEvaluatorDto.prototype, "completedEvaluationCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 하향평가가 제출되었는지 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SecondaryEvaluatorDto.prototype, "isSubmitted", void 0);
class SecondaryDownwardEvaluationDto {
    status;
    evaluators;
    isSubmitted;
    totalScore;
    grade;
}
exports.SecondaryDownwardEvaluationDto = SecondaryDownwardEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가 전체 통합 상태 (모든 평가자 통합)',
        enum: ['complete', 'in_progress', 'none', 'pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], SecondaryDownwardEvaluationDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 목록',
        type: () => [SecondaryEvaluatorDto],
    }),
    __metadata("design:type", Array)
], SecondaryDownwardEvaluationDto.prototype, "evaluators", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '모든 2차 평가자가 제출했는지 통합 상태',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SecondaryDownwardEvaluationDto.prototype, "isSubmitted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '가중치 기반 2차 하향평가 총점 (0-100)',
        example: 82.3,
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryDownwardEvaluationDto.prototype, "totalScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 등급 기준에 따른 2차 하향평가 등급 (예: S+, A-, B 등)',
        example: 'B+',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryDownwardEvaluationDto.prototype, "grade", void 0);
class DownwardEvaluationInfoDto {
    primary;
    secondary;
}
exports.DownwardEvaluationInfoDto = DownwardEvaluationInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 하향평가 정보',
        type: () => PrimaryDownwardEvaluationDto,
    }),
    __metadata("design:type", PrimaryDownwardEvaluationDto)
], DownwardEvaluationInfoDto.prototype, "primary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 하향평가 정보',
        type: () => SecondaryDownwardEvaluationDto,
    }),
    __metadata("design:type", SecondaryDownwardEvaluationDto)
], DownwardEvaluationInfoDto.prototype, "secondary", void 0);
class PeerEvaluationInfoDto {
    status;
    totalRequestCount;
    completedRequestCount;
}
exports.PeerEvaluationInfoDto = PeerEvaluationInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 진행 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'in_progress',
    }),
    __metadata("design:type", String)
], PeerEvaluationInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '총 동료평가 요청 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], PeerEvaluationInfoDto.prototype, "totalRequestCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료된 동료평가 수',
        example: 1,
    }),
    __metadata("design:type", Number)
], PeerEvaluationInfoDto.prototype, "completedRequestCount", void 0);
class FinalEvaluationInfoDto {
    status;
    evaluationGrade;
    jobGrade;
    jobDetailedGrade;
    isConfirmed;
    confirmedAt;
}
exports.FinalEvaluationInfoDto = FinalEvaluationInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 진행 상태',
        enum: ['complete', 'in_progress', 'none'],
        example: 'complete',
    }),
    __metadata("design:type", String)
], FinalEvaluationInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가등급 (S, A, B, C, D 등)',
        example: 'A',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationInfoDto.prototype, "evaluationGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직무등급 (T1, T2, T3)',
        example: 'T2',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationInfoDto.prototype, "jobGrade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직무 상세등급 (u, n, a)',
        example: 'n',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationInfoDto.prototype, "jobDetailedGrade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확정 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], FinalEvaluationInfoDto.prototype, "isConfirmed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '확정일시',
        type: 'string',
        format: 'date-time',
        example: '2024-06-30T15:00:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], FinalEvaluationInfoDto.prototype, "confirmedAt", void 0);
class ExclusionInfoDto {
    isExcluded;
    excludeReason;
    excludedAt;
}
exports.ExclusionInfoDto = ExclusionInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ExclusionInfoDto.prototype, "isExcluded", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 사유',
        example: '휴직',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ExclusionInfoDto.prototype, "excludeReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '제외 처리 일시',
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z',
        nullable: true,
    }),
    __metadata("design:type", Object)
], ExclusionInfoDto.prototype, "excludedAt", void 0);
class SecondaryEvaluationStatusDto {
    evaluatorId;
    evaluatorName;
    evaluatorEmployeeNumber;
    evaluatorEmail;
    status;
    approvedBy;
    approvedAt;
    revisionRequestId;
    revisionComment;
    isRevisionCompleted;
    revisionCompletedAt;
    responseComment;
}
exports.SecondaryEvaluationStatusDto = SecondaryEvaluationStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStatusDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStatusDto.prototype, "evaluatorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 사번',
        example: 'EMP001',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStatusDto.prototype, "evaluatorEmployeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStatusDto.prototype, "evaluatorEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '확인 상태',
        enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'pending',
    }),
    __metadata("design:type", String)
], SecondaryEvaluationStatusDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '승인자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStatusDto.prototype, "approvedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '승인 일시',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStatusDto.prototype, "approvedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 요청 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStatusDto.prototype, "revisionRequestId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 요청 코멘트',
        example: '평가 내용을 보완해 주세요.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStatusDto.prototype, "revisionComment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재작성 완료 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], SecondaryEvaluationStatusDto.prototype, "isRevisionCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 완료 일시',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStatusDto.prototype, "revisionCompletedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 완료 응답 코멘트',
        example: '평가 완료했습니다.',
        nullable: true,
    }),
    __metadata("design:type", Object)
], SecondaryEvaluationStatusDto.prototype, "responseComment", void 0);
class StepApprovalInfoDto {
    criteriaSettingStatus;
    criteriaSettingApprovedBy;
    criteriaSettingApprovedAt;
    selfEvaluationStatus;
    selfEvaluationApprovedBy;
    selfEvaluationApprovedAt;
    primaryEvaluationStatus;
    primaryEvaluationApprovedBy;
    primaryEvaluationApprovedAt;
    secondaryEvaluationStatuses;
    secondaryEvaluationStatus;
    secondaryEvaluationApprovedBy;
    secondaryEvaluationApprovedAt;
}
exports.StepApprovalInfoDto = StepApprovalInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 설정 확인 상태',
        enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'pending',
    }),
    __metadata("design:type", String)
], StepApprovalInfoDto.prototype, "criteriaSettingStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 설정 승인자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "criteriaSettingApprovedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기준 설정 승인 일시',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "criteriaSettingApprovedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 확인 상태',
        enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'pending',
    }),
    __metadata("design:type", String)
], StepApprovalInfoDto.prototype, "selfEvaluationStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 승인자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "selfEvaluationApprovedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '자기평가 승인 일시',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "selfEvaluationApprovedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차 하향평가 확인 상태',
        enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'pending',
    }),
    __metadata("design:type", String)
], StepApprovalInfoDto.prototype, "primaryEvaluationStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 하향평가 승인자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "primaryEvaluationApprovedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '1차 하향평가 승인 일시',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "primaryEvaluationApprovedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 하향평가 확인 상태 (평가자별)',
        type: () => [SecondaryEvaluationStatusDto],
        isArray: true,
        example: [
            {
                evaluatorId: '123e4567-e89b-12d3-a456-426614174003',
                evaluatorName: '홍길동',
                evaluatorEmployeeNumber: 'EMP001',
                evaluatorEmail: 'hong@example.com',
                status: 'pending',
                approvedBy: null,
                approvedAt: null,
                revisionRequestId: null,
                revisionComment: null,
                isRevisionCompleted: false,
                revisionCompletedAt: null,
            },
        ],
    }),
    (0, class_transformer_1.Type)(() => SecondaryEvaluationStatusDto),
    __metadata("design:type", Array)
], StepApprovalInfoDto.prototype, "secondaryEvaluationStatuses", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 하향평가 확인 상태 (최종 상태, 모든 평가자 완료 여부 기반, 하위 호환성)',
        enum: ['pending', 'approved', 'revision_requested', 'revision_completed'],
        example: 'pending',
    }),
    __metadata("design:type", String)
], StepApprovalInfoDto.prototype, "secondaryEvaluationStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '2차 하향평가 승인자 ID (하위 호환성)',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "secondaryEvaluationApprovedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '2차 하향평가 승인 일시 (하위 호환성)',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], StepApprovalInfoDto.prototype, "secondaryEvaluationApprovedAt", void 0);
class EmployeeEvaluationPeriodStatusResponseDto {
    mappingId;
    employeeId;
    isEvaluationTarget;
    evaluationPeriod;
    employee;
    exclusionInfo;
    criteriaSetup;
    performanceInput;
    selfEvaluation;
    downwardEvaluation;
    stepApproval;
    peerEvaluation;
    finalEvaluation;
}
exports.EmployeeEvaluationPeriodStatusResponseDto = EmployeeEvaluationPeriodStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '맵핑 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "mappingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "employeeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 여부 (제외되지 않고 삭제되지 않은 경우)',
        example: true,
    }),
    __metadata("design:type", Boolean)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "isEvaluationTarget", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 정보',
        type: () => EvaluationPeriodInfoDto,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "evaluationPeriod", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직원 정보',
        type: () => EmployeeInfoDto,
        nullable: true,
    }),
    __metadata("design:type", Object)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "employee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 대상 제외 정보',
        type: () => ExclusionInfoDto,
    }),
    __metadata("design:type", ExclusionInfoDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "exclusionInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기준 설정 정보 (평가항목, WBS 평가기준, 평가라인을 통합)',
        type: () => CriteriaSetupDto,
    }),
    __metadata("design:type", CriteriaSetupDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "criteriaSetup", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성과 입력 정보',
        type: () => PerformanceInputDto,
    }),
    (0, class_transformer_1.Type)(() => PerformanceInputDto),
    __metadata("design:type", PerformanceInputDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "performanceInput", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 진행 정보',
        type: () => SelfEvaluationInfoDto,
    }),
    __metadata("design:type", SelfEvaluationInfoDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "selfEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '하향평가 진행 정보',
        type: () => DownwardEvaluationInfoDto,
    }),
    __metadata("design:type", DownwardEvaluationInfoDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "downwardEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '단계별 확인 상태 정보',
        type: () => StepApprovalInfoDto,
    }),
    __metadata("design:type", StepApprovalInfoDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "stepApproval", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 진행 정보',
        type: () => PeerEvaluationInfoDto,
    }),
    __metadata("design:type", PeerEvaluationInfoDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "peerEvaluation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '최종평가 정보',
        type: () => FinalEvaluationInfoDto,
    }),
    __metadata("design:type", FinalEvaluationInfoDto)
], EmployeeEvaluationPeriodStatusResponseDto.prototype, "finalEvaluation", void 0);
//# sourceMappingURL=employee-evaluation-period-status.dto.js.map