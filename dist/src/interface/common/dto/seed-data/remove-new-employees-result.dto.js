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
exports.RemoveNewEmployeesResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class RemoveNewEmployeesResultDto {
    success;
    message;
    removedCount;
    batchNumber;
    removedEmployees;
}
exports.RemoveNewEmployeesResultDto = RemoveNewEmployeesResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], RemoveNewEmployeesResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '메시지',
        example: '신규 입사자 5명이 성공적으로 삭제되었습니다.',
    }),
    __metadata("design:type", String)
], RemoveNewEmployeesResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제된 직원 수',
        example: 5,
    }),
    __metadata("design:type", Number)
], RemoveNewEmployeesResultDto.prototype, "removedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '배치 번호',
        example: 'NEW1732512345',
    }),
    __metadata("design:type", String)
], RemoveNewEmployeesResultDto.prototype, "batchNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '삭제된 직원 목록',
        type: [String],
        example: ['홍길동 (NEW1732512345001)', '김철수 (NEW1732512345002)'],
    }),
    __metadata("design:type", Array)
], RemoveNewEmployeesResultDto.prototype, "removedEmployees", void 0);
//# sourceMappingURL=remove-new-employees-result.dto.js.map