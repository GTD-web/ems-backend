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
exports.RemoveAllNewEmployeesResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class RemoveAllNewEmployeesResultDto {
    success;
    message;
    removedCount;
    removedEmployees;
}
exports.RemoveAllNewEmployeesResultDto = RemoveAllNewEmployeesResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], RemoveAllNewEmployeesResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '메시지',
        example: '모든 신규 입사자 15명이 성공적으로 삭제되었습니다.',
    }),
    __metadata("design:type", String)
], RemoveAllNewEmployeesResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제된 직원 수',
        example: 15,
    }),
    __metadata("design:type", Number)
], RemoveAllNewEmployeesResultDto.prototype, "removedCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제된 직원 목록',
        type: [String],
        example: ['홍길동 (NEW1732512345001)', '김철수 (NEW1732512345002)'],
    }),
    __metadata("design:type", Array)
], RemoveAllNewEmployeesResultDto.prototype, "removedEmployees", void 0);
//# sourceMappingURL=remove-all-new-employees-result.dto.js.map