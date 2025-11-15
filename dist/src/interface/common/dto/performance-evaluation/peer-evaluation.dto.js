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
exports.UpsertPeerEvaluationAnswersResponseDto = exports.UpsertPeerEvaluationAnswersDto = exports.PeerEvaluationAnswerItemDto = exports.PeerEvaluationListResponseDto = exports.PeerEvaluationDetailResponseDto = exports.EvaluationPeriodInfoDto = exports.EvaluationQuestionInDetailDto = exports.AssignedEvaluateeDto = exports.GetEvaluatorAssignedEvaluateesQueryDto = exports.DepartmentInfoDto = exports.EmployeeInfoDto = exports.PeerEvaluationBasicDto = exports.BulkPeerEvaluationRequestResponseDto = exports.BulkRequestSummary = exports.PeerEvaluationRequestResult = exports.PeerEvaluationResponseDto = exports.PeerEvaluationFilterDto = exports.SubmitPeerEvaluationDto = exports.UpdatePeerEvaluationDto = exports.CreatePeerEvaluationBodyDto = exports.RequestMultiplePeerEvaluationsDto = exports.RequestPeerEvaluationToMultipleEvaluatorsDto = exports.RequestPeerEvaluationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const decorators_1 = require("../../decorators");
class RequestPeerEvaluationDto {
    evaluatorId;
    evaluateeId;
    periodId;
    requestDeadline;
    questionIds;
    requestedBy;
}
exports.RequestPeerEvaluationDto = RequestPeerEvaluationDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationDto.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 마감일 (ISO 8601 형식)',
        example: '2024-12-31T23:59:59Z',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], RequestPeerEvaluationDto.prototype, "requestDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 질문 ID 목록 (해당 질문들에 대해 작성 요청)',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011',
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RequestPeerEvaluationDto.prototype, "questionIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationDto.prototype, "requestedBy", void 0);
class RequestPeerEvaluationToMultipleEvaluatorsDto {
    evaluatorIds;
    evaluateeId;
    periodId;
    requestDeadline;
    questionIds;
    requestedBy;
}
exports.RequestPeerEvaluationToMultipleEvaluatorsDto = RequestPeerEvaluationToMultipleEvaluatorsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID 목록',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440000',
            '550e8400-e29b-41d4-a716-446655440001',
        ],
    }),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RequestPeerEvaluationToMultipleEvaluatorsDto.prototype, "evaluatorIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationToMultipleEvaluatorsDto.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationToMultipleEvaluatorsDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 마감일 (ISO 8601 형식)',
        example: '2024-12-31T23:59:59Z',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], RequestPeerEvaluationToMultipleEvaluatorsDto.prototype, "requestDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 질문 ID 목록 (해당 질문들에 대해 작성 요청)',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011',
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RequestPeerEvaluationToMultipleEvaluatorsDto.prototype, "questionIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestPeerEvaluationToMultipleEvaluatorsDto.prototype, "requestedBy", void 0);
class RequestMultiplePeerEvaluationsDto {
    evaluatorId;
    evaluateeIds;
    periodId;
    requestDeadline;
    questionIds;
    requestedBy;
}
exports.RequestMultiplePeerEvaluationsDto = RequestMultiplePeerEvaluationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestMultiplePeerEvaluationsDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID 목록',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440001',
            '550e8400-e29b-41d4-a716-446655440002',
        ],
    }),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RequestMultiplePeerEvaluationsDto.prototype, "evaluateeIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestMultiplePeerEvaluationsDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 마감일 (ISO 8601 형식)',
        example: '2024-12-31T23:59:59Z',
        type: String,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], RequestMultiplePeerEvaluationsDto.prototype, "requestDeadline", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 질문 ID 목록 (해당 질문들에 대해 작성 요청)',
        type: [String],
        example: [
            '550e8400-e29b-41d4-a716-446655440010',
            '550e8400-e29b-41d4-a716-446655440011',
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], RequestMultiplePeerEvaluationsDto.prototype, "questionIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RequestMultiplePeerEvaluationsDto.prototype, "requestedBy", void 0);
class CreatePeerEvaluationBodyDto {
    evaluatorId;
    peerEvaluationContent;
    peerEvaluationScore;
    createdBy;
}
exports.CreatePeerEvaluationBodyDto = CreatePeerEvaluationBodyDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 ID (추후 요청자 ID로 자동 입력)',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePeerEvaluationBodyDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '동료평가 내용',
        example: '동료로서 협업 능력이 우수합니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePeerEvaluationBodyDto.prototype, "peerEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '동료평가 점수 (1-5)',
        example: 4,
        minimum: 1,
        maximum: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreatePeerEvaluationBodyDto.prototype, "peerEvaluationScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePeerEvaluationBodyDto.prototype, "createdBy", void 0);
class UpdatePeerEvaluationDto {
    peerEvaluationContent;
    peerEvaluationScore;
}
exports.UpdatePeerEvaluationDto = UpdatePeerEvaluationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '동료평가 내용',
        example: '수정된 동료평가 내용입니다.',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePeerEvaluationDto.prototype, "peerEvaluationContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '동료평가 점수 (1-5)',
        example: 5,
        minimum: 1,
        maximum: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], UpdatePeerEvaluationDto.prototype, "peerEvaluationScore", void 0);
class SubmitPeerEvaluationDto {
}
exports.SubmitPeerEvaluationDto = SubmitPeerEvaluationDto;
class PeerEvaluationFilterDto {
    evaluatorId;
    evaluateeId;
    periodId;
    status;
    page;
    limit;
}
exports.PeerEvaluationFilterDto = PeerEvaluationFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PeerEvaluationFilterDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PeerEvaluationFilterDto.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PeerEvaluationFilterDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 상태',
        example: 'DRAFT',
        enum: ['DRAFT', 'SUBMITTED', 'COMPLETED'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['DRAFT', 'SUBMITTED', 'COMPLETED']),
    __metadata("design:type", String)
], PeerEvaluationFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 번호 (1부터 시작)',
        example: 1,
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PeerEvaluationFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '페이지 크기',
        example: 10,
        default: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PeerEvaluationFilterDto.prototype, "limit", void 0);
class PeerEvaluationResponseDto {
    id;
    message;
}
exports.PeerEvaluationResponseDto = PeerEvaluationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], PeerEvaluationResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '결과 메시지',
        example: '동료평가가 성공적으로 생성되었습니다.',
    }),
    __metadata("design:type", String)
], PeerEvaluationResponseDto.prototype, "message", void 0);
class PeerEvaluationRequestResult {
    evaluatorId;
    evaluateeId;
    success;
    evaluationId;
    error;
}
exports.PeerEvaluationRequestResult = PeerEvaluationRequestResult;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], PeerEvaluationRequestResult.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], PeerEvaluationRequestResult.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '요청 성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PeerEvaluationRequestResult.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성된 동료평가 ID (성공 시)',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], PeerEvaluationRequestResult.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '에러 정보 (실패 시)',
        example: {
            code: 'RESOURCE_NOT_FOUND',
            message: '평가자를 찾을 수 없습니다.',
        },
    }),
    __metadata("design:type", Object)
], PeerEvaluationRequestResult.prototype, "error", void 0);
class BulkRequestSummary {
    total;
    success;
    failed;
}
exports.BulkRequestSummary = BulkRequestSummary;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 요청 개수',
        example: 5,
    }),
    __metadata("design:type", Number)
], BulkRequestSummary.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공한 요청 개수',
        example: 3,
    }),
    __metadata("design:type", Number)
], BulkRequestSummary.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 요청 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], BulkRequestSummary.prototype, "failed", void 0);
class BulkPeerEvaluationRequestResponseDto {
    results;
    summary;
    message;
    ids;
    count;
}
exports.BulkPeerEvaluationRequestResponseDto = BulkPeerEvaluationRequestResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '개별 요청 결과 목록',
        type: [PeerEvaluationRequestResult],
    }),
    __metadata("design:type", Array)
], BulkPeerEvaluationRequestResponseDto.prototype, "results", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '요청 처리 요약',
        type: BulkRequestSummary,
    }),
    __metadata("design:type", BulkRequestSummary)
], BulkPeerEvaluationRequestResponseDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '결과 메시지',
        example: '5건 중 3건의 동료평가 요청이 성공적으로 생성되었습니다.',
    }),
    __metadata("design:type", String)
], BulkPeerEvaluationRequestResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성된 동료평가 요청 ID 목록 (deprecated: results 사용 권장)',
        type: [String],
        deprecated: true,
    }),
    __metadata("design:type", Array)
], BulkPeerEvaluationRequestResponseDto.prototype, "ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '생성된 요청 개수 (deprecated: summary.success 사용 권장)',
        deprecated: true,
    }),
    __metadata("design:type", Number)
], BulkPeerEvaluationRequestResponseDto.prototype, "count", void 0);
class PeerEvaluationBasicDto {
    id;
    evaluatorId;
    evaluateeId;
    periodId;
    evaluationDate;
    status;
    isCompleted;
    completedAt;
    requestDeadline;
    createdAt;
    updatedAt;
}
exports.PeerEvaluationBasicDto = PeerEvaluationBasicDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], PeerEvaluationBasicDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], PeerEvaluationBasicDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], PeerEvaluationBasicDto.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440003',
    }),
    __metadata("design:type", String)
], PeerEvaluationBasicDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationBasicDto.prototype, "evaluationDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 상태',
        example: 'pending',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], PeerEvaluationBasicDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 완료 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PeerEvaluationBasicDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 완료일',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationBasicDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 마감일',
        example: '2024-01-20T23:59:59Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationBasicDto.prototype, "requestDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationBasicDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationBasicDto.prototype, "updatedAt", void 0);
class EmployeeInfoDto {
    id;
    name;
    employeeNumber;
    email;
    departmentId;
    status;
    rankName;
    roles;
}
exports.EmployeeInfoDto = EmployeeInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 이름',
        example: '홍길동',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '사번',
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
    (0, swagger_1.ApiProperty)({
        description: '부서 ID',
        example: 'DEPT001',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "departmentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '직원 상태',
        example: 'ACTIVE',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '직급명',
        example: '과장',
    }),
    __metadata("design:type", String)
], EmployeeInfoDto.prototype, "rankName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '역할 목록',
        example: ['ROLE_USER', 'ROLE_ADMIN'],
        type: [String],
    }),
    __metadata("design:type", Array)
], EmployeeInfoDto.prototype, "roles", void 0);
class DepartmentInfoDto {
    id;
    name;
    code;
}
exports.DepartmentInfoDto = DepartmentInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], DepartmentInfoDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서명',
        example: '개발팀',
    }),
    __metadata("design:type", String)
], DepartmentInfoDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '부서 코드',
        example: 'DEPT001',
    }),
    __metadata("design:type", String)
], DepartmentInfoDto.prototype, "code", void 0);
class GetEvaluatorAssignedEvaluateesQueryDto {
    periodId;
    includeCompleted;
}
exports.GetEvaluatorAssignedEvaluateesQueryDto = GetEvaluatorAssignedEvaluateesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetEvaluatorAssignedEvaluateesQueryDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '완료된 평가 포함 여부',
        example: false,
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(false),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GetEvaluatorAssignedEvaluateesQueryDto.prototype, "includeCompleted", void 0);
class AssignedEvaluateeDto {
    evaluationId;
    evaluateeId;
    periodId;
    status;
    isCompleted;
    completedAt;
    requestDeadline;
    mappedDate;
    isActive;
    evaluatee;
    evaluateeDepartment;
    mappedBy;
}
exports.AssignedEvaluateeDto = AssignedEvaluateeDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], AssignedEvaluateeDto.prototype, "evaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], AssignedEvaluateeDto.prototype, "evaluateeId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], AssignedEvaluateeDto.prototype, "periodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 상태',
        example: 'pending',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], AssignedEvaluateeDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 완료 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], AssignedEvaluateeDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '완료 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], AssignedEvaluateeDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 마감일',
        example: '2024-01-20T23:59:59Z',
    }),
    __metadata("design:type", Date)
], AssignedEvaluateeDto.prototype, "requestDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매핑 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], AssignedEvaluateeDto.prototype, "mappedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태',
        example: true,
    }),
    __metadata("design:type", Boolean)
], AssignedEvaluateeDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], AssignedEvaluateeDto.prototype, "evaluatee", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '피평가자 부서 정보',
        type: DepartmentInfoDto,
    }),
    __metadata("design:type", Object)
], AssignedEvaluateeDto.prototype, "evaluateeDepartment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '요청자 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], AssignedEvaluateeDto.prototype, "mappedBy", void 0);
class EvaluationQuestionInDetailDto {
    id;
    text;
    minScore;
    maxScore;
    displayOrder;
    answer;
    score;
    answeredAt;
    answeredBy;
}
exports.EvaluationQuestionInDetailDto = EvaluationQuestionInDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], EvaluationQuestionInDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 내용',
        example: '프로젝트 수행 능력은 어떠한가요?',
    }),
    __metadata("design:type", String)
], EvaluationQuestionInDetailDto.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최소 점수',
        example: 1,
    }),
    __metadata("design:type", Number)
], EvaluationQuestionInDetailDto.prototype, "minScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '최대 점수',
        example: 5,
    }),
    __metadata("design:type", Number)
], EvaluationQuestionInDetailDto.prototype, "maxScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '표시 순서',
        example: 1,
    }),
    __metadata("design:type", Number)
], EvaluationQuestionInDetailDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '답변 내용',
        example: '팀원과의 협업 능력이 뛰어나며, 적극적으로 의견을 나눕니다.',
    }),
    __metadata("design:type", String)
], EvaluationQuestionInDetailDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '답변 점수',
        example: 4,
        minimum: 1,
        maximum: 5,
    }),
    __metadata("design:type", Number)
], EvaluationQuestionInDetailDto.prototype, "score", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '답변 작성일',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], EvaluationQuestionInDetailDto.prototype, "answeredAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '답변 작성자 ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], EvaluationQuestionInDetailDto.prototype, "answeredBy", void 0);
class EvaluationPeriodInfoDto {
    id;
    name;
    startDate;
    endDate;
    status;
}
exports.EvaluationPeriodInfoDto = EvaluationPeriodInfoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
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
        description: '시작일',
        example: '2024-01-01T00:00:00Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '종료일',
        example: '2024-06-30T23:59:59Z',
    }),
    __metadata("design:type", Date)
], EvaluationPeriodInfoDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '상태',
        example: 'in_progress',
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], EvaluationPeriodInfoDto.prototype, "status", void 0);
class PeerEvaluationDetailResponseDto {
    id;
    evaluationDate;
    status;
    isCompleted;
    completedAt;
    requestDeadline;
    mappedDate;
    isActive;
    createdAt;
    updatedAt;
    deletedAt;
    version;
    period;
    evaluator;
    evaluatorDepartment;
    evaluatee;
    evaluateeDepartment;
    mappedBy;
    questions;
}
exports.PeerEvaluationDetailResponseDto = PeerEvaluationDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], PeerEvaluationDetailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가일',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "evaluationDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 상태',
        example: 'pending',
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    }),
    __metadata("design:type", String)
], PeerEvaluationDetailResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가 완료 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PeerEvaluationDetailResponseDto.prototype, "isCompleted", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가 완료일',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '요청 마감일',
        example: '2024-01-20T23:59:59Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "requestDeadline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '매핑 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "mappedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '활성 상태',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PeerEvaluationDetailResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        example: '2024-01-15T09:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        example: '2024-01-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제 일시',
        example: '2024-01-15T11:00:00Z',
    }),
    __metadata("design:type", Date)
], PeerEvaluationDetailResponseDto.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '버전',
        example: 1,
    }),
    __metadata("design:type", Number)
], PeerEvaluationDetailResponseDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가기간 정보',
        type: EvaluationPeriodInfoDto,
    }),
    __metadata("design:type", Object)
], PeerEvaluationDetailResponseDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], PeerEvaluationDetailResponseDto.prototype, "evaluator", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '평가자 부서 정보',
        type: DepartmentInfoDto,
    }),
    __metadata("design:type", Object)
], PeerEvaluationDetailResponseDto.prototype, "evaluatorDepartment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], PeerEvaluationDetailResponseDto.prototype, "evaluatee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '피평가자 부서 정보',
        type: DepartmentInfoDto,
    }),
    __metadata("design:type", Object)
], PeerEvaluationDetailResponseDto.prototype, "evaluateeDepartment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '매핑자 정보',
        type: EmployeeInfoDto,
    }),
    __metadata("design:type", Object)
], PeerEvaluationDetailResponseDto.prototype, "mappedBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가질문 목록',
        type: [EvaluationQuestionInDetailDto],
    }),
    __metadata("design:type", Array)
], PeerEvaluationDetailResponseDto.prototype, "questions", void 0);
class PeerEvaluationListResponseDto {
    evaluations;
    total;
    page;
    limit;
}
exports.PeerEvaluationListResponseDto = PeerEvaluationListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 목록 (상세 정보 포함)',
        type: [PeerEvaluationDetailResponseDto],
    }),
    __metadata("design:type", Array)
], PeerEvaluationListResponseDto.prototype, "evaluations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 개수',
        example: 25,
    }),
    __metadata("design:type", Number)
], PeerEvaluationListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '현재 페이지',
        example: 1,
    }),
    __metadata("design:type", Number)
], PeerEvaluationListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '페이지 크기',
        example: 10,
    }),
    __metadata("design:type", Number)
], PeerEvaluationListResponseDto.prototype, "limit", void 0);
class PeerEvaluationAnswerItemDto {
    questionId;
    answer;
    score;
}
exports.PeerEvaluationAnswerItemDto = PeerEvaluationAnswerItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '질문 ID',
        example: '550e8400-e29b-41d4-a716-446655440010',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PeerEvaluationAnswerItemDto.prototype, "questionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '답변 내용',
        example: '팀원과의 협업 능력이 뛰어나며, 적극적으로 의견을 나눕니다.',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PeerEvaluationAnswerItemDto.prototype, "answer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '답변 점수',
        example: 4,
        minimum: 1,
        maximum: 5,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], PeerEvaluationAnswerItemDto.prototype, "score", void 0);
class UpsertPeerEvaluationAnswersDto {
    peerEvaluationId;
    answers;
}
exports.UpsertPeerEvaluationAnswersDto = UpsertPeerEvaluationAnswersDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '동료평가 ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpsertPeerEvaluationAnswersDto.prototype, "peerEvaluationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '답변 목록 (questionId, answer, score 쌍)',
        type: [PeerEvaluationAnswerItemDto],
        example: [
            {
                questionId: '550e8400-e29b-41d4-a716-446655440010',
                answer: '팀원과의 협업 능력이 뛰어나며, 적극적으로 의견을 나눕니다.',
                score: 4,
            },
            {
                questionId: '550e8400-e29b-41d4-a716-446655440011',
                answer: '업무 처리 속도가 빠르고 정확합니다.',
                score: 5,
            },
        ],
    }),
    (0, class_validator_1.ArrayNotEmpty)({ message: '답변 목록은 최소 1개 이상이어야 합니다.' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PeerEvaluationAnswerItemDto),
    __metadata("design:type", Array)
], UpsertPeerEvaluationAnswersDto.prototype, "answers", void 0);
class UpsertPeerEvaluationAnswersResponseDto {
    savedCount;
    message;
}
exports.UpsertPeerEvaluationAnswersResponseDto = UpsertPeerEvaluationAnswersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '저장/업데이트된 답변 개수',
        example: 2,
    }),
    __metadata("design:type", Number)
], UpsertPeerEvaluationAnswersResponseDto.prototype, "savedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '응답 메시지',
        example: '답변이 성공적으로 저장되었습니다.',
    }),
    __metadata("design:type", String)
], UpsertPeerEvaluationAnswersResponseDto.prototype, "message", void 0);
//# sourceMappingURL=peer-evaluation.dto.js.map