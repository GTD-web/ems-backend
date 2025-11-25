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
exports.AddNewEmployeesResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AddNewEmployeesResultDto {
    success;
    message;
    addedCount;
    failedCount;
    batchNumber;
    errors;
    addedEmployeeIds;
}
exports.AddNewEmployeesResultDto = AddNewEmployeesResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], AddNewEmployeesResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '메시지',
        example: '신규 입사자 3명이 성공적으로 추가되었습니다.',
    }),
    __metadata("design:type", String)
], AddNewEmployeesResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '추가된 직원 수',
        example: 3,
    }),
    __metadata("design:type", Number)
], AddNewEmployeesResultDto.prototype, "addedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '실패한 직원 수',
        example: 0,
    }),
    __metadata("design:type", Number)
], AddNewEmployeesResultDto.prototype, "failedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '배치 번호 (되돌리기 시 사용, 직원 번호의 접두사 부분)',
        example: 'NEW1732512345',
    }),
    __metadata("design:type", String)
], AddNewEmployeesResultDto.prototype, "batchNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: '오류 목록 (실패한 경우)',
        type: [String],
        example: [],
    }),
    __metadata("design:type", Array)
], AddNewEmployeesResultDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '추가된 직원 ID 목록',
        type: [String],
        example: [
            '123e4567-e89b-12d3-a456-426614174000',
            '123e4567-e89b-12d3-a456-426614174001',
        ],
    }),
    __metadata("design:type", Array)
], AddNewEmployeesResultDto.prototype, "addedEmployeeIds", void 0);
//# sourceMappingURL=add-new-employees-result.dto.js.map