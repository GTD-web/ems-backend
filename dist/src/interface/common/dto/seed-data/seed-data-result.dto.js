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
exports.SeedDataResultDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class GeneratorResultItemDto {
    phase;
    entityCounts;
    generatedIds;
    duration;
    errors;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phase 이름',
        example: 'Phase1',
    }),
    __metadata("design:type", String)
], GeneratorResultItemDto.prototype, "phase", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 엔티티 개수',
        example: {
            Department: 10,
            Employee: 50,
            Project: 5,
            WbsItem: 50,
        },
    }),
    __metadata("design:type", Object)
], GeneratorResultItemDto.prototype, "entityCounts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '생성된 ID 목록',
        example: {
            departmentIds: ['uuid1', 'uuid2'],
            employeeIds: ['uuid3', 'uuid4'],
        },
    }),
    __metadata("design:type", Object)
], GeneratorResultItemDto.prototype, "generatedIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '소요 시간 (밀리초)',
        example: 1500,
    }),
    __metadata("design:type", Number)
], GeneratorResultItemDto.prototype, "duration", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '에러 목록 (선택사항)',
        required: false,
        example: [],
    }),
    __metadata("design:type", Array)
], GeneratorResultItemDto.prototype, "errors", void 0);
class SeedDataResultDto {
    success;
    message;
    results;
    totalDuration;
}
exports.SeedDataResultDto = SeedDataResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '시드 데이터 생성 성공 여부',
        example: true,
    }),
    __metadata("design:type", Boolean)
], SeedDataResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '메시지',
        example: '시드 데이터가 성공적으로 생성되었습니다.',
    }),
    __metadata("design:type", String)
], SeedDataResultDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Phase별 생성 결과',
        type: [GeneratorResultItemDto],
    }),
    __metadata("design:type", Array)
], SeedDataResultDto.prototype, "results", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '전체 소요 시간 (밀리초)',
        example: 5000,
    }),
    __metadata("design:type", Number)
], SeedDataResultDto.prototype, "totalDuration", void 0);
//# sourceMappingURL=seed-data-result.dto.js.map