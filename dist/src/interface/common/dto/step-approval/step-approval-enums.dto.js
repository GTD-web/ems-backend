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
exports.StepApprovalEnumsResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const update_step_approval_dto_1 = require("./update-step-approval.dto");
class StepApprovalEnumsResponseDto {
    steps;
    statuses;
}
exports.StepApprovalEnumsResponseDto = StepApprovalEnumsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '가능한 단계 목록',
        enum: update_step_approval_dto_1.StepTypeEnum,
        isArray: true,
        example: ['criteria', 'self', 'primary', 'secondary'],
    }),
    __metadata("design:type", Array)
], StepApprovalEnumsResponseDto.prototype, "steps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '가능한 승인 상태 목록',
        enum: update_step_approval_dto_1.StepApprovalStatusEnum,
        isArray: true,
        example: ['pending', 'approved', 'revision_requested', 'revision_completed'],
    }),
    __metadata("design:type", Array)
], StepApprovalEnumsResponseDto.prototype, "statuses", void 0);
//# sourceMappingURL=step-approval-enums.dto.js.map