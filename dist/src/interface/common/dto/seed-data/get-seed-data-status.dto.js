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
exports.GetSeedDataStatusDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class GetSeedDataStatusDto {
    hasData;
    entityCounts;
}
exports.GetSeedDataStatusDto = GetSeedDataStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '데이터 존재 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], GetSeedDataStatusDto.prototype, "hasData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '엔티티별 데이터 개수',
        example: {
            Department: 10,
            Employee: 50,
            Project: 5,
            WbsItem: 50,
            EvaluationPeriod: 1,
        },
    }),
    __metadata("design:type", Object)
], GetSeedDataStatusDto.prototype, "entityCounts", void 0);
//# sourceMappingURL=get-seed-data-status.dto.js.map