"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationActivityLogContextModule = void 0;
const common_1 = require("@nestjs/common");
const core_domain_module_1 = require("../../domain/core/core-domain.module");
const common_domain_module_1 = require("../../domain/common/common-domain.module");
const evaluation_activity_log_context_service_1 = require("./evaluation-activity-log-context.service");
let EvaluationActivityLogContextModule = class EvaluationActivityLogContextModule {
};
exports.EvaluationActivityLogContextModule = EvaluationActivityLogContextModule;
exports.EvaluationActivityLogContextModule = EvaluationActivityLogContextModule = __decorate([
    (0, common_1.Module)({
        imports: [core_domain_module_1.CoreDomainModule, common_domain_module_1.CommonDomainModule],
        providers: [evaluation_activity_log_context_service_1.EvaluationActivityLogContextService],
        exports: [evaluation_activity_log_context_service_1.EvaluationActivityLogContextService],
    })
], EvaluationActivityLogContextModule);
//# sourceMappingURL=evaluation-activity-log-context.module.js.map