"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecondaryEvaluationStepApprovalModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const secondary_evaluation_step_approval_entity_1 = require("./secondary-evaluation-step-approval.entity");
const secondary_evaluation_step_approval_service_1 = require("./secondary-evaluation-step-approval.service");
let SecondaryEvaluationStepApprovalModule = class SecondaryEvaluationStepApprovalModule {
};
exports.SecondaryEvaluationStepApprovalModule = SecondaryEvaluationStepApprovalModule;
exports.SecondaryEvaluationStepApprovalModule = SecondaryEvaluationStepApprovalModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([secondary_evaluation_step_approval_entity_1.SecondaryEvaluationStepApproval])],
        providers: [secondary_evaluation_step_approval_service_1.SecondaryEvaluationStepApprovalService],
        exports: [secondary_evaluation_step_approval_service_1.SecondaryEvaluationStepApprovalService],
    })
], SecondaryEvaluationStepApprovalModule);
//# sourceMappingURL=secondary-evaluation-step-approval.module.js.map