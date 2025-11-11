"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodBusinessModule = void 0;
const common_1 = require("@nestjs/common");
const evaluation_period_business_service_1 = require("./evaluation-period-business.service");
const domain_context_module_1 = require("../../context/domain-context.module");
let EvaluationPeriodBusinessModule = class EvaluationPeriodBusinessModule {
};
exports.EvaluationPeriodBusinessModule = EvaluationPeriodBusinessModule;
exports.EvaluationPeriodBusinessModule = EvaluationPeriodBusinessModule = __decorate([
    (0, common_1.Module)({
        imports: [domain_context_module_1.DomainContextModule],
        providers: [evaluation_period_business_service_1.EvaluationPeriodBusinessService],
        exports: [evaluation_period_business_service_1.EvaluationPeriodBusinessService],
    })
], EvaluationPeriodBusinessModule);
//# sourceMappingURL=evaluation-period-business.module.js.map