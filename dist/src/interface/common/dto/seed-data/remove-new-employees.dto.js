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
exports.RemoveNewEmployeesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class RemoveNewEmployeesDto {
    batchNumber;
}
exports.RemoveNewEmployeesDto = RemoveNewEmployeesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '삭제할 직원 배치 번호 (직원 추가 시 생성된 타임스탬프, 예: NEW1234567890)',
        example: 'NEW1732512345',
        pattern: '^NEW[0-9]{10,13}$',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Matches)(/^NEW[0-9]{10,13}$/, {
        message: '배치 번호는 NEW로 시작하고 10-13자리 숫자가 따라와야 합니다. (예: NEW1234567890)',
    }),
    __metadata("design:type", String)
], RemoveNewEmployeesDto.prototype, "batchNumber", void 0);
//# sourceMappingURL=remove-new-employees.dto.js.map