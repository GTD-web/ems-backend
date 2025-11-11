"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationWbsAssignmentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const database_module_1 = require("../../../../libs/database/database.module");
const evaluation_wbs_assignment_entity_1 = require("./evaluation-wbs-assignment.entity");
const evaluation_wbs_assignment_service_1 = require("./evaluation-wbs-assignment.service");
const evaluation_wbs_assignment_validation_service_1 = require("./evaluation-wbs-assignment-validation.service");
let EvaluationWbsAssignmentModule = class EvaluationWbsAssignmentModule {
};
exports.EvaluationWbsAssignmentModule = EvaluationWbsAssignmentModule;
exports.EvaluationWbsAssignmentModule = EvaluationWbsAssignmentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment]),
            database_module_1.DatabaseModule,
        ],
        providers: [
            evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
            evaluation_wbs_assignment_validation_service_1.EvaluationWbsAssignmentValidationService,
        ],
        exports: [
            typeorm_1.TypeOrmModule,
            evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
            evaluation_wbs_assignment_validation_service_1.EvaluationWbsAssignmentValidationService,
        ],
    })
], EvaluationWbsAssignmentModule);
//# sourceMappingURL=evaluation-wbs-assignment.module.js.map