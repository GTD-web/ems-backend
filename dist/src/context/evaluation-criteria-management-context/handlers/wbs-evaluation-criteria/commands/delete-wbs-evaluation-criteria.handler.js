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
var DeleteWbsEvaluationCriteriaHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteWbsEvaluationCriteriaHandler = exports.DeleteWbsEvaluationCriteriaCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_evaluation_criteria_service_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service");
const wbs_assignment_weight_calculation_service_1 = require("../../../services/wbs-assignment-weight-calculation.service");
class DeleteWbsEvaluationCriteriaCommand {
    id;
    deletedBy;
    constructor(id, deletedBy) {
        this.id = id;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteWbsEvaluationCriteriaCommand = DeleteWbsEvaluationCriteriaCommand;
let DeleteWbsEvaluationCriteriaHandler = DeleteWbsEvaluationCriteriaHandler_1 = class DeleteWbsEvaluationCriteriaHandler {
    wbsEvaluationCriteriaService;
    weightCalculationService;
    logger = new common_1.Logger(DeleteWbsEvaluationCriteriaHandler_1.name);
    constructor(wbsEvaluationCriteriaService, weightCalculationService) {
        this.wbsEvaluationCriteriaService = wbsEvaluationCriteriaService;
        this.weightCalculationService = weightCalculationService;
    }
    async execute(command) {
        const { id, deletedBy } = command;
        this.logger.log(`WBS 평가기준 삭제 시작 - ID: ${id}, 삭제자: ${deletedBy}`);
        try {
            const criteria = await this.wbsEvaluationCriteriaService.ID로_조회한다(id);
            const wbsItemId = criteria?.wbsItemId;
            await this.wbsEvaluationCriteriaService.삭제한다(id, deletedBy);
            this.logger.log(`WBS 평가기준 삭제 완료 - ID: ${id}`);
            if (wbsItemId) {
                await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(wbsItemId);
            }
            return true;
        }
        catch (error) {
            this.logger.error(`WBS 평가기준 삭제 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
};
exports.DeleteWbsEvaluationCriteriaHandler = DeleteWbsEvaluationCriteriaHandler;
exports.DeleteWbsEvaluationCriteriaHandler = DeleteWbsEvaluationCriteriaHandler = DeleteWbsEvaluationCriteriaHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(DeleteWbsEvaluationCriteriaCommand),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], DeleteWbsEvaluationCriteriaHandler);
//# sourceMappingURL=delete-wbs-evaluation-criteria.handler.js.map