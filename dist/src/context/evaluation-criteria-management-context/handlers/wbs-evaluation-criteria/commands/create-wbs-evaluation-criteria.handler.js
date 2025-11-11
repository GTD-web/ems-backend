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
var CreateWbsEvaluationCriteriaHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateWbsEvaluationCriteriaHandler = exports.CreateWbsEvaluationCriteriaCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_evaluation_criteria_service_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service");
const wbs_assignment_weight_calculation_service_1 = require("../../../services/wbs-assignment-weight-calculation.service");
class CreateWbsEvaluationCriteriaCommand {
    createData;
    createdBy;
    constructor(createData, createdBy) {
        this.createData = createData;
        this.createdBy = createdBy;
    }
}
exports.CreateWbsEvaluationCriteriaCommand = CreateWbsEvaluationCriteriaCommand;
let CreateWbsEvaluationCriteriaHandler = CreateWbsEvaluationCriteriaHandler_1 = class CreateWbsEvaluationCriteriaHandler {
    wbsEvaluationCriteriaService;
    weightCalculationService;
    logger = new common_1.Logger(CreateWbsEvaluationCriteriaHandler_1.name);
    constructor(wbsEvaluationCriteriaService, weightCalculationService) {
        this.wbsEvaluationCriteriaService = wbsEvaluationCriteriaService;
        this.weightCalculationService = weightCalculationService;
    }
    async execute(command) {
        const { createData, createdBy } = command;
        this.logger.log(`WBS 평가기준 생성 시작 - WBS 항목: ${createData.wbsItemId}, 기준: ${createData.criteria}`);
        try {
            const criteria = await this.wbsEvaluationCriteriaService.생성한다(createData);
            this.logger.log(`WBS 평가기준 생성 완료 - ID: ${criteria.id}`);
            await this.weightCalculationService.WBS별_할당된_직원_가중치를_재계산한다(createData.wbsItemId);
            return criteria.DTO로_변환한다();
        }
        catch (error) {
            this.logger.error(`WBS 평가기준 생성 실패 - WBS 항목: ${createData.wbsItemId}`, error.stack);
            throw error;
        }
    }
};
exports.CreateWbsEvaluationCriteriaHandler = CreateWbsEvaluationCriteriaHandler;
exports.CreateWbsEvaluationCriteriaHandler = CreateWbsEvaluationCriteriaHandler = CreateWbsEvaluationCriteriaHandler_1 = __decorate([
    (0, cqrs_1.CommandHandler)(CreateWbsEvaluationCriteriaCommand),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], CreateWbsEvaluationCriteriaHandler);
//# sourceMappingURL=create-wbs-evaluation-criteria.handler.js.map