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
exports.PeriodAllEvaluationEditableStatusResponseDto = exports.UpdatePeriodAllEvaluationEditableStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpdatePeriodAllEvaluationEditableStatusDto {
    isSelfEvaluationEditable;
    isPrimaryEvaluationEditable;
    isSecondaryEvaluationEditable;
    updatedBy;
}
exports.UpdatePeriodAllEvaluationEditableStatusDto = UpdatePeriodAllEvaluationEditableStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 수정 가능 여부',
        example: true,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePeriodAllEvaluationEditableStatusDto.prototype, "isSelfEvaluationEditable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차평가 수정 가능 여부',
        example: false,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePeriodAllEvaluationEditableStatusDto.prototype, "isPrimaryEvaluationEditable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차평가 수정 가능 여부',
        example: false,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePeriodAllEvaluationEditableStatusDto.prototype, "isSecondaryEvaluationEditable", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdatePeriodAllEvaluationEditableStatusDto.prototype, "updatedBy", void 0);
class PeriodAllEvaluationEditableStatusResponseDto {
    updatedCount;
    evaluationPeriodId;
    isSelfEvaluationEditable;
    isPrimaryEvaluationEditable;
    isSecondaryEvaluationEditable;
}
exports.PeriodAllEvaluationEditableStatusResponseDto = PeriodAllEvaluationEditableStatusResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '변경된 맵핑 개수',
        example: 25,
    }),
    __metadata("design:type", Number)
], PeriodAllEvaluationEditableStatusResponseDto.prototype, "updatedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '평가기간 ID',
        example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], PeriodAllEvaluationEditableStatusResponseDto.prototype, "evaluationPeriodId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '자기평가 수정 가능 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], PeriodAllEvaluationEditableStatusResponseDto.prototype, "isSelfEvaluationEditable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '1차평가 수정 가능 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PeriodAllEvaluationEditableStatusResponseDto.prototype, "isPrimaryEvaluationEditable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '2차평가 수정 가능 여부',
        example: false,
    }),
    __metadata("design:type", Boolean)
], PeriodAllEvaluationEditableStatusResponseDto.prototype, "isSecondaryEvaluationEditable", void 0);
//# sourceMappingURL=evaluation-editable-status.dto.js.map