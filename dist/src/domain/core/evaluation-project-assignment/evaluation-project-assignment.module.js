"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationProjectAssignmentModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const database_module_1 = require("../../../../libs/database/database.module");
const evaluation_project_assignment_entity_1 = require("./evaluation-project-assignment.entity");
const evaluation_project_assignment_service_1 = require("./evaluation-project-assignment.service");
const evaluation_project_assignment_validation_service_1 = require("./evaluation-project-assignment-validation.service");
let EvaluationProjectAssignmentModule = class EvaluationProjectAssignmentModule {
};
exports.EvaluationProjectAssignmentModule = EvaluationProjectAssignmentModule;
exports.EvaluationProjectAssignmentModule = EvaluationProjectAssignmentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([evaluation_project_assignment_entity_1.EvaluationProjectAssignment]),
            database_module_1.DatabaseModule,
        ],
        providers: [
            evaluation_project_assignment_service_1.EvaluationProjectAssignmentService,
            evaluation_project_assignment_validation_service_1.EvaluationProjectAssignmentValidationService,
        ],
        exports: [
            typeorm_1.TypeOrmModule,
            evaluation_project_assignment_service_1.EvaluationProjectAssignmentService,
            evaluation_project_assignment_validation_service_1.EvaluationProjectAssignmentValidationService,
        ],
    })
], EvaluationProjectAssignmentModule);
//# sourceMappingURL=evaluation-project-assignment.module.js.map