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
exports.UpdateSecondaryStepApprovalResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const update_step_approval_dto_1 = require("./update-step-approval.dto");
class UpdateSecondaryStepApprovalResponseDto {
    id;
    evaluationPeriodEmployeeMappingId;
    evaluatorId;
    status;
    approvedBy;
    approvedAt;
    revisionRequestId;
    createdAt;
    updatedAt;
}
exports.UpdateSecondaryStepApprovalResponseDto = UpdateSecondaryStepApprovalResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자별 단계 승인 ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    __metadata("design:type", String)
], UpdateSecondaryStepApprovalResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간-직원 맵핑 ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    __metadata("design:type", String)
], UpdateSecondaryStepApprovalResponseDto.prototype, "evaluationPeriodEmployeeMappingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차 평가자 ID',
        example: '123e4567-e89b-12d3-a456-426614174002',
    }),
    __metadata("design:type", String)
], UpdateSecondaryStepApprovalResponseDto.prototype, "evaluatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '승인 상태',
        enum: update_step_approval_dto_1.StepApprovalStatusEnum,
        example: update_step_approval_dto_1.StepApprovalStatusEnum.APPROVED,
    }),
    __metadata("design:type", String)
], UpdateSecondaryStepApprovalResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '승인자 ID',
        example: '123e4567-e89b-12d3-a456-426614174003',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UpdateSecondaryStepApprovalResponseDto.prototype, "approvedBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '승인 일시',
        type: 'string',
        format: 'date-time',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UpdateSecondaryStepApprovalResponseDto.prototype, "approvedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 요청 ID',
        example: '123e4567-e89b-12d3-a456-426614174004',
        nullable: true,
    }),
    __metadata("design:type", Object)
], UpdateSecondaryStepApprovalResponseDto.prototype, "revisionRequestId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성 일시',
        type: 'string',
        format: 'date-time',
    }),
    __metadata("design:type", Date)
], UpdateSecondaryStepApprovalResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '수정 일시',
        type: 'string',
        format: 'date-time',
    }),
    __metadata("design:type", Date)
], UpdateSecondaryStepApprovalResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=update-secondary-step-approval-response.dto.js.map