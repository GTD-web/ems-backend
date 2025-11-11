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
var ClearWbsSelfEvaluationHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearWbsSelfEvaluationHandler = exports.ClearWbsSelfEvaluationCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_self_evaluation_service_1 = require("../../../../../domain/core/wbs-self-evaluation/wbs-self-evaluation.service");
class ClearWbsSelfEvaluationCommand {
    evaluationId;
    clearedBy;
    constructor(evaluationId, clearedBy) {
        this.evaluationId = evaluationId;
        this.clearedBy = clearedBy;
    }
}
exports.ClearWbsSelfEvaluationCommand = ClearWbsSelfEvaluationCommand;
let ClearWbsSelfEvaluationHandler = ClearWbsSelfEvaluationHandler_1 = class ClearWbsSelfEvaluationHandler {
    wbsSelfEvaluationService;
    logger = new common_1.Logger(ClearWbsSelfEvaluationHandler_1.name);
    constructor(wbsSelfEvaluationService) {
        this.wbsSelfEvaluationService = wbsSelfEvaluationService;
    }
    async execute(command) {
        this.logger.log(`WBS 자기평가 내용 초기화: ${command.evaluationId}`);
        const evaluation = await this.wbsSelfEvaluationService.내용을_초기화한다(command.evaluationId, command.clearedBy);
        return evaluation.DTO로_변환한다();
    }
};
exports.ClearWbsSelfEvaluationHandler = ClearWbsSelfEvaluationHandler;
exports.ClearWbsSelfEvaluationHandler = ClearWbsSelfEvaluationHandler = ClearWbsSelfEvaluationHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(ClearWbsSelfEvaluationCommand),
    __metadata("design:paramtypes", [wbs_self_evaluation_service_1.WbsSelfEvaluationService])
], ClearWbsSelfEvaluationHandler);
//# sourceMappingURL=clear-wbs-self-evaluation.handler.js.map