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
var UnregisterAllEvaluationTargetsHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnregisterAllEvaluationTargetsHandler = exports.UnregisterAllEvaluationTargetsCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const evaluation_period_employee_mapping_service_1 = require("../../../../../domain/core/evaluation-period-employee-mapping/evaluation-period-employee-mapping.service");
class UnregisterAllEvaluationTargetsCommand {
    evaluationPeriodId;
    constructor(evaluationPeriodId) {
        this.evaluationPeriodId = evaluationPeriodId;
    }
}
exports.UnregisterAllEvaluationTargetsCommand = UnregisterAllEvaluationTargetsCommand;
let UnregisterAllEvaluationTargetsHandler = UnregisterAllEvaluationTargetsHandler_1 = class UnregisterAllEvaluationTargetsHandler {
    evaluationPeriodEmployeeMappingService;
    logger = new common_1.Logger(UnregisterAllEvaluationTargetsHandler_1.name);
    constructor(evaluationPeriodEmployeeMappingService) {
        this.evaluationPeriodEmployeeMappingService = evaluationPeriodEmployeeMappingService;
    }
    async execute(command) {
        const { evaluationPeriodId } = command;
        this.logger.log(`평가기간 전체 대상자 등록 해제 시작 - 평가기간: ${evaluationPeriodId}`);
        try {
            const deletedCount = await this.evaluationPeriodEmployeeMappingService.평가기간의_모든_대상자를_해제한다(evaluationPeriodId);
            this.logger.log(`평가기간 전체 대상자 등록 해제 완료 - 평가기간: ${evaluationPeriodId}, 삭제 수: ${deletedCount}`);
            return deletedCount;
        }
        catch (error) {
            this.logger.error(`평가기간 전체 대상자 등록 해제 실패 - 평가기간: ${evaluationPeriodId}`, error.stack);
            throw error;
        }
    }
};
exports.UnregisterAllEvaluationTargetsHandler = UnregisterAllEvaluationTargetsHandler;
exports.UnregisterAllEvaluationTargetsHandler = UnregisterAllEvaluationTargetsHandler = UnregisterAllEvaluationTargetsHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(UnregisterAllEvaluationTargetsCommand),
    __metadata("design:paramtypes", [evaluation_period_employee_mapping_service_1.EvaluationPeriodEmployeeMappingService])
], UnregisterAllEvaluationTargetsHandler);
//# sourceMappingURL=unregister-all-evaluation-targets.handler.js.map