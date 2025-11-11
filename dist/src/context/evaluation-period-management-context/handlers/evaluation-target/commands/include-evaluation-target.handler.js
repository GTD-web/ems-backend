"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IncludeEvaluationTargetHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncludeEvaluationTargetHandler = exports.IncludeEvaluationTargetCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
class IncludeEvaluationTargetCommand {
    evaluationPeriodId;
    employeeId;
    updatedBy;
    constructor(evaluationPeriodId, employeeId, updatedBy) {
        this.evaluationPeriodId = evaluationPeriodId;
        this.employeeId = employeeId;
        this.updatedBy = updatedBy;
    }
}
exports.IncludeEvaluationTargetCommand = IncludeEvaluationTargetCommand;
let IncludeEvaluationTargetHandler = IncludeEvaluationTargetHandler_1 = class IncludeEvaluationTargetHandler {
    evaluationPeriodEmployeeMappingService;
    logger = new common_1.Logger(IncludeEvaluationTargetHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
    }
    async execute(command) {
        const { evaluationPeriodId, employeeId, updatedBy } = command;
        this.logger.log(`평가 대상 포함 시작 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
        try {
            const result = await this.evaluationPeriodEmployeeMappingService.평가대상에_포함한다(evaluationPeriodId, employeeId, { updatedBy });
            this.logger.log(`평가 대상 포함 완료 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`평가 대상 포함 실패 - 평가기간: ${evaluationPeriodId}, 직원: ${employeeId}`, error.stack);
            throw error;
        }
    }
};
exports.IncludeEvaluationTargetHandler = IncludeEvaluationTargetHandler;
exports.IncludeEvaluationTargetHandler = IncludeEvaluationTargetHandler = IncludeEvaluationTargetHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(IncludeEvaluationTargetCommand),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService])
], IncludeEvaluationTargetHandler);
//# sourceMappingURL=include-evaluation-target.handler.js.map