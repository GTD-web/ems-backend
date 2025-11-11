"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WbsEvaluationCriteriaModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const database_module_1 = require("../../../../libs/database/database.module");
const wbs_evaluation_criteria_entity_1 = require("./wbs-evaluation-criteria.entity");
const wbs_evaluation_criteria_service_1 = require("./wbs-evaluation-criteria.service");
const wbs_evaluation_criteria_validation_service_1 = require("./wbs-evaluation-criteria-validation.service");
let WbsEvaluationCriteriaModule = class WbsEvaluationCriteriaModule {
};
exports.WbsEvaluationCriteriaModule = WbsEvaluationCriteriaModule;
exports.WbsEvaluationCriteriaModule = WbsEvaluationCriteriaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([wbs_evaluation_criteria_entity_1.WbsEvaluationCriteria]), database_module_1.DatabaseModule],
        providers: [
            wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
            wbs_evaluation_criteria_validation_service_1.WbsEvaluationCriteriaValidationService,
        ],
        exports: [
            wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
            wbs_evaluation_criteria_validation_service_1.WbsEvaluationCriteriaValidationService,
        ],
    })
], WbsEvaluationCriteriaModule);
//# sourceMappingURL=wbs-evaluation-criteria.module.js.map