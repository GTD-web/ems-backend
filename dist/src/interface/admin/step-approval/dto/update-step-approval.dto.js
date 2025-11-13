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
exports.UpdateStepApprovalDto = exports.StepApprovalStatusEnum = exports.StepTypeEnum = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../../decorators");
var StepTypeEnum;
(function (StepTypeEnum) {
    StepTypeEnum["CRITERIA"] = "criteria";
    StepTypeEnum["SELF"] = "self";
    StepTypeEnum["PRIMARY"] = "primary";
    StepTypeEnum["SECONDARY"] = "secondary";
})(StepTypeEnum || (exports.StepTypeEnum = StepTypeEnum = {}));
var StepApprovalStatusEnum;
(function (StepApprovalStatusEnum) {
    StepApprovalStatusEnum["PENDING"] = "pending";
    StepApprovalStatusEnum["APPROVED"] = "approved";
    StepApprovalStatusEnum["REVISION_REQUESTED"] = "revision_requested";
    StepApprovalStatusEnum["REVISION_COMPLETED"] = "revision_completed";
})(StepApprovalStatusEnum || (exports.StepApprovalStatusEnum = StepApprovalStatusEnum = {}));
class UpdateStepApprovalDto {
    status;
    revisionComment;
    approveSubsequentSteps;
}
exports.UpdateStepApprovalDto = UpdateStepApprovalDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '승인 상태',
        enum: StepApprovalStatusEnum,
        example: StepApprovalStatusEnum.APPROVED,
    }),
    (0, class_validator_1.IsEnum)(StepApprovalStatusEnum),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateStepApprovalDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '재작성 요청 코멘트 (status가 revision_requested인 경우 필수)',
        example: '평가기준이 명확하지 않습니다. 다시 작성해 주세요.',
    }),
    (0, class_validator_1.ValidateIf)((o) => o.status === StepApprovalStatusEnum.REVISION_REQUESTED),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateStepApprovalDto.prototype, "revisionComment", void 0);
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
], UpdateStepApprovalDto.prototype, "approveSubsequentSteps", void 0);
//# sourceMappingURL=update-step-approval.dto.js.map