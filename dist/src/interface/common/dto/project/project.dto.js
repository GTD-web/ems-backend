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
exports.SetSecondaryEvaluatorsResponseDto = exports.ProjectManagerListResponseDto = exports.ProjectManagerDto = exports.GetProjectManagersQueryDto = exports.ProjectListResponseDto = exports.ProjectResponseDto = exports.SetSecondaryEvaluatorsDto = exports.SelectableSecondaryEvaluatorInfoDto = exports.ManagerInfoDto = exports.GetProjectListQueryDto = exports.UpdateProjectDto = exports.CreateProjectDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const decorators_1 = require("../../decorators");
const project_types_1 = require("../../../../domain/common/project/project.types");
class CreateProjectDto {
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
}
exports.CreateProjectDto = CreateProjectDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 상태',
        enum: project_types_1.ProjectStatus,
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(project_types_1.ProjectStatus),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], CreateProjectDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], CreateProjectDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a UUID',
    }),
    __metadata("design:type", String)
], CreateProjectDto.prototype, "managerId", void 0);
class UpdateProjectDto {
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
}
exports.UpdateProjectDto = UpdateProjectDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 상태',
        enum: project_types_1.ProjectStatus,
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(project_types_1.ProjectStatus),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], UpdateProjectDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], UpdateProjectDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a UUID',
    }),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "managerId", void 0);
class GetProjectListQueryDto {
    page = 1;
    limit = 20;
    sortBy = 'createdAt';
    sortOrder = 'DESC';
    status;
    managerId;
    startDateFrom;
    startDateTo;
    endDateFrom;
    endDateTo;
}
exports.GetProjectListQueryDto = GetProjectListQueryDto;
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
], GetProjectListQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지당 항목 수',
        example: 20,
        default: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetProjectListQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 기준',
        enum: ['name', 'projectCode', 'startDate', 'endDate', 'createdAt'],
        example: 'createdAt',
        default: 'createdAt',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '정렬 방향',
        enum: ['ASC', 'DESC'],
        example: 'DESC',
        default: 'DESC',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 상태 필터',
        enum: project_types_1.ProjectStatus,
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(project_types_1.ProjectStatus),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'managerId must be a UUID',
    }),
    __metadata("design:type", String)
], GetProjectListQueryDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 범위 시작 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "startDateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일 범위 끝 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "startDateTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 범위 시작 (YYYY-MM-DD)',
        example: '2024-01-01',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "endDateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일 범위 끝 (YYYY-MM-DD)',
        example: '2024-12-31',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.OptionalDateToUTC)(),
    __metadata("design:type", Date)
], GetProjectListQueryDto.prototype, "endDateTo", void 0);
class ManagerInfoDto {
    id;
    name;
    email;
    phoneNumber;
    departmentName;
    rankName;
}
exports.ManagerInfoDto = ManagerInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매니저 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '전화번호',
        example: '010-1234-5678',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '팀장',
    }),
    __metadata("design:type", String)
], ManagerInfoDto.prototype, "rankName", void 0);
class SelectableSecondaryEvaluatorInfoDto {
    id;
    name;
    email;
    phoneNumber;
    departmentName;
    rankName;
}
exports.SelectableSecondaryEvaluatorInfoDto = SelectableSecondaryEvaluatorInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], SelectableSecondaryEvaluatorInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 이름',
        example: '김철수',
    }),
    __metadata("design:type", String)
], SelectableSecondaryEvaluatorInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '이메일',
        example: 'kim@example.com',
    }),
    __metadata("design:type", String)
], SelectableSecondaryEvaluatorInfoDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '전화번호',
        example: '010-1234-5678',
    }),
    __metadata("design:type", String)
], SelectableSecondaryEvaluatorInfoDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], SelectableSecondaryEvaluatorInfoDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '과장',
    }),
    __metadata("design:type", String)
], SelectableSecondaryEvaluatorInfoDto.prototype, "rankName", void 0);
class SetSecondaryEvaluatorsDto {
    evaluatorIds;
}
exports.SetSecondaryEvaluatorsDto = SetSecondaryEvaluatorsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 ID 목록 (직원 ID)',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440000',
            '650e8400-e29b-41d4-a716-446655440001',
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], SetSecondaryEvaluatorsDto.prototype, "evaluatorIds", void 0);
class ProjectResponseDto {
    id;
    name;
    projectCode;
    status;
    startDate;
    endDate;
    managerId;
    manager;
    selectableSecondaryEvaluators;
    createdAt;
    updatedAt;
    deletedAt;
    isActive;
    isCompleted;
    isCancelled;
}
exports.ProjectResponseDto = ProjectResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트명',
        example: 'EMS 프로젝트',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 코드',
        example: 'EMS-2024',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "projectCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 상태',
        enum: project_types_1.ProjectStatus,
        example: project_types_1.ProjectStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '시작일',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '종료일',
        example: '2024-12-31T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 ID',
        example: '11111111-1111-1111-1111-111111111111',
    }),
    __metadata("design:type", String)
], ProjectResponseDto.prototype, "managerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '프로젝트 매니저 정보',
        type: ManagerInfoDto,
    }),
    __metadata("design:type", ManagerInfoDto)
], ProjectResponseDto.prototype, "manager", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '선택 가능한 2차 평가자 목록',
        type: [SelectableSecondaryEvaluatorInfoDto],
    }),
    __metadata("design:type", Array)
], ProjectResponseDto.prototype, "selectableSecondaryEvaluators", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제일시',
        example: '2024-01-01T00:00:00.000Z',
    }),
    __metadata("design:type", Date)
], ProjectResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '완료 상태 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '취소 상태 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], ProjectResponseDto.prototype, "isCancelled", void 0);
class ProjectListResponseDto {
    projects;
    total;
    page;
    limit;
    totalPages;
}
exports.ProjectListResponseDto = ProjectListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '프로젝트 목록',
        type: [ProjectResponseDto],
    }),
    __metadata("design:type", Array)
], ProjectListResponseDto.prototype, "projects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 항목 수',
        example: 100,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지 번호',
        example: 1,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지당 항목 수',
        example: 20,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 페이지 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], ProjectListResponseDto.prototype, "totalPages", void 0);
class GetProjectManagersQueryDto {
    departmentId;
    search;
}
exports.GetProjectManagersQueryDto = GetProjectManagersQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서 ID로 필터링',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'departmentId must be a UUID',
    }),
    __metadata("design:type", String)
], GetProjectManagersQueryDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '검색어 (이름, 사번, 이메일)',
        example: '홍길동',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetProjectManagersQueryDto.prototype, "search", void 0);
class ProjectManagerDto {
    id;
    employeeNumber;
    name;
    email;
    departmentName;
    departmentCode;
    positionName;
    positionLevel;
    jobTitleName;
    hasManagementAuthority;
}
exports.ProjectManagerDto = ProjectManagerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID (UUID)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사번',
        example: 'E2023001',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "employeeNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '이메일',
        example: 'hong@example.com',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "departmentName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '부서 코드',
        example: 'DEV',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "departmentCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책명',
        example: '팀장',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "positionName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직책 레벨',
        example: 3,
    }),
    __metadata("design:type", Number)
], ProjectManagerDto.prototype, "positionLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직급명',
        example: '과장',
    }),
    __metadata("design:type", String)
], ProjectManagerDto.prototype, "jobTitleName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '관리 권한 보유 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], ProjectManagerDto.prototype, "hasManagementAuthority", void 0);
class ProjectManagerListResponseDto {
    managers;
    total;
}
exports.ProjectManagerListResponseDto = ProjectManagerListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'PM 목록',
        type: [ProjectManagerDto],
    }),
    __metadata("design:type", Array)
], ProjectManagerListResponseDto.prototype, "managers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 PM 수',
        example: 15,
    }),
    __metadata("design:type", Number)
], ProjectManagerListResponseDto.prototype, "total", void 0);
class SetSecondaryEvaluatorsResponseDto {
    count;
    evaluators;
}
exports.SetSecondaryEvaluatorsResponseDto = SetSecondaryEvaluatorsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '설정된 2차 평가자 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], SetSecondaryEvaluatorsResponseDto.prototype, "count", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '설정된 2차 평가자 목록',
        type: [SelectableSecondaryEvaluatorInfoDto],
    }),
    __metadata("design:type", Array)
], SetSecondaryEvaluatorsResponseDto.prototype, "evaluators", void 0);
//# sourceMappingURL=project.dto.js.map