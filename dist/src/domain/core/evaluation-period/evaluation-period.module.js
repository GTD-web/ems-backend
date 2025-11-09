"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationPeriodModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_period_entity_1 = require("./evaluation-period.entity");
const evaluation_period_service_1 = require("./evaluation-period.service");
const evaluation_period_validation_service_1 = require("./evaluation-period-validation.service");
const evaluation_period_auto_phase_service_1 = require("./evaluation-period-auto-phase.service");
const transaction_manager_service_1 = require("../../../../libs/database/transaction-manager.service");
let EvaluationPeriodModule = class EvaluationPeriodModule {
};
exports.EvaluationPeriodModule = EvaluationPeriodModule;
exports.EvaluationPeriodModule = EvaluationPeriodModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([evaluation_period_entity_1.EvaluationPeriod])],
        providers: [
            evaluation_period_service_1.EvaluationPeriodService,
            evaluation_period_validation_service_1.EvaluationPeriodValidationService,
            evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService,
            transaction_manager_service_1.TransactionManagerService,
            {
                provide: 'IEvaluationPeriodService',
                useClass: evaluation_period_service_1.EvaluationPeriodService,
            },
        ],
        exports: [
            evaluation_period_service_1.EvaluationPeriodService,
            evaluation_period_validation_service_1.EvaluationPeriodValidationService,
            evaluation_period_auto_phase_service_1.EvaluationPeriodAutoPhaseService,
            'IEvaluationPeriodService',
        ],
    })
], EvaluationPeriodModule);
//# sourceMappingURL=evaluation-period.module.js.map