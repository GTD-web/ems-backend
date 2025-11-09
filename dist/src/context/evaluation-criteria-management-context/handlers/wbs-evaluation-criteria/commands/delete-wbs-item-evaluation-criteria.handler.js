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
var DeleteWbsItemEvaluationCriteriaHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteWbsItemEvaluationCriteriaHandler = exports.DeleteWbsItemEvaluationCriteriaCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_evaluation_criteria_service_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service");
const wbs_assignment_weight_calculation_service_1 = require("../../../services/wbs-assignment-weight-calculation.service");
class DeleteWbsItemEvaluationCriteriaCommand {
    wbsItemId;
    deletedBy;
    constructor(wbsItemId, deletedBy) {
        this.wbsItemId = wbsItemId;
        this.deletedBy = deletedBy;
    }
}
exports.DeleteWbsItemEvaluationCriteriaCommand = DeleteWbsItemEvaluationCriteriaCommand;
let DeleteWbsItemEvaluationCriteriaHandler = DeleteWbsItemEvaluationCriteriaHandler_1 = class DeleteWbsItemEvaluationCriteriaHandler {
    wbsEvaluationCriteriaService;
    weightCalculationService;
    logger = new common_1.Logger(DeleteWbsItemEvaluationCriteriaHandler_1.name);
    constructor(wbsEvaluationCriteriaService, weightCalculationService) {
        this.wbsEvaluationCriteriaService = wbsEvaluationCriteriaService;
        this.weightCalculationService = weightCalculationService;
    }
    async execute(command) {
        const { wbsItemId, deletedBy } = command;
        this.logger.log(`WBS 항목 평가기준 전체 삭제 시작 - WBS 항목 ID: ${wbsItemId}, 삭제자: ${deletedBy}`);
        try {
            await this.wbsEvaluationCriteriaService.WBS항목_평가기준_전체삭제한다(wbsItemId, deletedBy);
            this.logger.log(`WBS 항목 평가기준 전체 삭제 완료 - WBS 항목 ID: ${wbsItemId}`);
            await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(wbsItemId);
            return true;
        }
        catch (error) {
            this.logger.error(`WBS 항목 평가기준 전체 삭제 실패 - WBS 항목 ID: ${wbsItemId}`, error.stack);
            throw error;
        }
    }
};
exports.DeleteWbsItemEvaluationCriteriaHandler = DeleteWbsItemEvaluationCriteriaHandler;
exports.DeleteWbsItemEvaluationCriteriaHandler = DeleteWbsItemEvaluationCriteriaHandler = DeleteWbsItemEvaluationCriteriaHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(DeleteWbsItemEvaluationCriteriaCommand),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], DeleteWbsItemEvaluationCriteriaHandler);
//# sourceMappingURL=delete-wbs-item-evaluation-criteria.handler.js.map