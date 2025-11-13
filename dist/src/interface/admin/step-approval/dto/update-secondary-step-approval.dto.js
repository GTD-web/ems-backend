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
exports.UpdateSecondaryStepApprovalDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const update_step_approval_dto_1 = require("./update-step-approval.dto");
const decorators_1 = require("../../../decorators");
class UpdateSecondaryStepApprovalDto {
    status;
    revisionComment;
    approveSubsequentSteps;
}
exports.UpdateSecondaryStepApprovalDto = UpdateSecondaryStepApprovalDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '승인 상태',
        enum: update_step_approval_dto_1.StepApprovalStatusEnum,
        example: update_step_approval_dto_1.StepApprovalStatusEnum.APPROVED,
    }),
    (0, class_validator_1.IsEnum)(update_step_approval_dto_1.StepApprovalStatusEnum),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateSecondaryStepApprovalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 요청 코멘트 (status가 revision_requested인 경우 필수)',
        example: '평가 내용이 부족합니다. 보완해 주세요.',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.status === update_step_approval_dto_1.StepApprovalStatusEnum.REVISION_REQUESTED),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateSecondaryStepApprovalDto.prototype, "revisionComment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '하위 평가 자동 승인 여부 (true: 하위 평가도 함께 승인, false: 현재 평가만 승인)',
        example: false,
        type: Boolean,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, decorators_1.ToBoolean)(false),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSecondaryStepApprovalDto.prototype, "approveSubsequentSteps", void 0);
//# sourceMappingURL=update-secondary-step-approval.dto.js.map