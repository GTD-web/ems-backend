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
var DeleteAllWbsEvaluationCriteriaHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteAllWbsEvaluationCriteriaHandler = exports.DeleteAllWbsEvaluationCriteriaCommand = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const wbs_evaluation_criteria_service_1 = require("../../../../../domain/core/wbs-evaluation-criteria/wbs-evaluation-criteria.service");
class DeleteAllWbsEvaluationCriteriaCommand {
    deletedBy;
    constructor(deletedBy) {
        this.deletedBy = deletedBy;
    }
}
exports.DeleteAllWbsEvaluationCriteriaCommand = DeleteAllWbsEvaluationCriteriaCommand;
let DeleteAllWbsEvaluationCriteriaHandler = DeleteAllWbsEvaluationCriteriaHandler_1 = class DeleteAllWbsEvaluationCriteriaHandler {
    wbsEvaluationCriteriaService;
    logger = new common_1.Logger(DeleteAllWbsEvaluationCriteriaHandler_1.name);
    constructor(wbsEvaluationCriteriaService) {
        this.wbsEvaluationCriteriaService = wbsEvaluationCriteriaService;
    }
    async execute(command) {
        const { deletedBy } = command;
        this.logger.log(`모든 WBS 평가기준 삭제 시작 - 삭제자: ${deletedBy}`);
        try {
            await this.wbsEvaluationCriteriaService.모든_평가기준을_삭제한다(deletedBy);
            this.logger.log('모든 WBS 평가기준 삭제 완료');
            return true;
        }
        catch (error) {
            this.logger.error('모든 WBS 평가기준 삭제 실패', error.stack);
            throw error;
        }
    }
};
exports.DeleteAllWbsEvaluationCriteriaHandler = DeleteAllWbsEvaluationCriteriaHandler;
exports.DeleteAllWbsEvaluationCriteriaHandler = DeleteAllWbsEvaluationCriteriaHandler = DeleteAllWbsEvaluationCriteriaHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(DeleteAllWbsEvaluationCriteriaCommand),
    __metadata("design:paramtypes", [wbs_evaluation_criteria_service_1.WbsEvaluationCriteriaService])
], DeleteAllWbsEvaluationCriteriaHandler);
//# sourceMappingURL=delete-all-wbs-evaluation-criteria.handler.js.map