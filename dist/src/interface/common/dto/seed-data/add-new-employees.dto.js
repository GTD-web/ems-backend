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
exports.AddNewEmployeesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AddNewEmployeesDto {
    count;
}
exports.AddNewEmployeesDto = AddNewEmployeesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '추가할 신규 입사자 수',
        example: 5,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: '최소 1명 이상 입력해야 합니다.' }),
    (0, class_validator_1.Max)(100, { message: '최대 100명까지 한 번에 추가할 수 있습니다.' }),
    __metadata("design:type", Number)
], AddNewEmployeesDto.prototype, "count", void 0);
//# sourceMappingURL=add-new-employees.dto.js.map