"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalEvaluationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const database_module_1 = require("../../../../libs/database/database.module");
const final_evaluation_entity_1 = require("./final-evaluation.entity");
const final_evaluation_service_1 = require("./final-evaluation.service");
const final_evaluation_validation_service_1 = require("./final-evaluation-validation.service");
let FinalEvaluationModule = class FinalEvaluationModule {
};
exports.FinalEvaluationModule = FinalEvaluationModule;
exports.FinalEvaluationModule = FinalEvaluationModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, typeorm_1.TypeOrmModule.forFeature([final_evaluation_entity_1.FinalEvaluation])],
        providers: [final_evaluation_service_1.FinalEvaluationService, final_evaluation_validation_service_1.FinalEvaluationValidationService],
        exports: [final_evaluation_service_1.FinalEvaluationService, final_evaluation_validation_service_1.FinalEvaluationValidationService],
    })
], FinalEvaluationModule);
//# sourceMappingURL=final-evaluation.module.js.map