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
var UpdateWbsEvaluationCriteriaHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWbsEvaluationCriteriaHandler = exports.UpdateWbsEvaluationCriteriaCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_evaluation_criteria_service_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service");
const wbs_assignment_weight_calculation_service_1 = require("../../../services/wbs-assignment-weight-calculation.service");
class UpdateWbsEvaluationCriteriaCommand {
    id;
    updateData;
    updatedBy;
    constructor(id, updateData, updatedBy) {
        this.id = id;
        this.updateData = updateData;
        this.updatedBy = updatedBy;
    }
}
exports.UpdateWbsEvaluationCriteriaCommand = UpdateWbsEvaluationCriteriaCommand;
let UpdateWbsEvaluationCriteriaHandler = UpdateWbsEvaluationCriteriaHandler_1 = class UpdateWbsEvaluationCriteriaHandler {
    wbsEvaluationCriteriaService;
    weightCalculationService;
    logger = new common_1.Logger(UpdateWbsEvaluationCriteriaHandler_1.name);
    constructor(wbsEvaluationCriteriaService, weightCalculationService) {
        this.wbsEvaluationCriteriaService = wbsEvaluationCriteriaService;
        this.weightCalculationService = weightCalculationService;
    }
    async execute(command) {
        const { id, updateData, updatedBy } = command;
        this.logger.log(`WBS 평가기준 수정 시작 - ID: ${id}, 수정자: ${updatedBy}`);
        try {
            const criteria = await this.wbsEvaluationCriteriaService.업데이트한다(id, updateData, updatedBy);
            this.logger.log(`WBS 평가기준 수정 완료 - ID: ${id}`);
            if (updateData.importance !== undefined) {
                await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(criteria.wbsItemId);
            }
            return criteria.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`WBS 평가기준 수정 실패 - ID: ${id}`, error.stack);
            throw error;
        }
    }
};
exports.UpdateWbsEvaluationCriteriaHandler = UpdateWbsEvaluationCriteriaHandler;
exports.UpdateWbsEvaluationCriteriaHandler = UpdateWbsEvaluationCriteriaHandler = UpdateWbsEvaluationCriteriaHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(UpdateWbsEvaluationCriteriaCommand),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], UpdateWbsEvaluationCriteriaHandler);
//# sourceMappingURL=update-wbs-evaluation-criteria.handler.js.map