"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_line_entity_1 = require("./evaluation-line.entity");
const evaluation_line_service_1 = require("./evaluation-line.service");
const evaluation_line_validation_service_1 = require("./evaluation-line-validation.service");
let EvaluationLineModule = class EvaluationLineModule {
};
exports.EvaluationLineModule = EvaluationLineModule;
exports.EvaluationLineModule = EvaluationLineModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([evaluation_line_entity_1.EvaluationLine])],
        providers: [evaluation_line_service_1.EvaluationLineService, evaluation_line_validation_service_1.EvaluationLineValidationService],
        exports: [evaluation_line_service_1.EvaluationLineService, evaluation_line_validation_service_1.EvaluationLineValidationService],
    })
], EvaluationLineModule);
//# sourceMappingURL=evaluation-line.module.js.map