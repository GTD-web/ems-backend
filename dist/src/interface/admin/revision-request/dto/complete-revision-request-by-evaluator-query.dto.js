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
exports.CompleteRevisionRequestByEvaluatorQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const get_revision_requests_query_dto_1 = require("./get-revision-requests-query.dto");
class CompleteRevisionRequestByEvaluatorQueryDto {
    step;
}
exports.CompleteRevisionRequestByEvaluatorQueryDto = CompleteRevisionRequestByEvaluatorQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: '재작성 요청 단계',
        enum: get_revision_requests_query_dto_1.RevisionRequestStepEnum,
        example: get_revision_requests_query_dto_1.RevisionRequestStepEnum.SECONDARY,
    }),
    (0, class_validator_1.IsEnum)(get_revision_requests_query_dto_1.RevisionRequestStepEnum),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompleteRevisionRequestByEvaluatorQueryDto.prototype, "step", void 0);
//# sourceMappingURL=complete-revision-request-by-evaluator-query.dto.js.map