"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationLineBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_criteria_management_context_module_1 = require("../../context/evaluation-criteria-management-context/evaluation-criteria-management-context.module");
const evaluation_activity_log_context_module_1 = require("../../context/evaluation-activity-log-context/evaluation-activity-log-context.module");
const evaluation_line_business_service_1 = require("./evaluation-line-business.service");
let EvaluationLineBusinessModule = class EvaluationLineBusinessModule {
};
exports.EvaluationLineBusinessModule = EvaluationLineBusinessModule;
exports.EvaluationLineBusinessModule = EvaluationLineBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            evaluation_criteria_management_context_module_1.EvaluationCriteriaManagementContextModule,
            evaluation_activity_log_context_module_1.EvaluationActivityLogContextModule,
        ],
        providers: [evaluation_line_business_service_1.EvaluationLineBusinessService],
        exports: [evaluation_line_business_service_1.EvaluationLineBusinessService],
    })
], EvaluationLineBusinessModule);
//# sourceMappingURL=evaluation-line-business.module.js.map