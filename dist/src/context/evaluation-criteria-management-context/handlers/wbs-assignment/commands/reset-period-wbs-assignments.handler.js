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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPeriodWbsAssignmentsHandler = exports.ResetPeriodWbsAssignmentsCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
class ResetPeriodWbsAssignmentsCommand {
    periodId;
    resetBy;
    constructor(periodId, resetBy) {
        this.periodId = periodId;
        this.resetBy = resetBy;
    }
}
exports.ResetPeriodWbsAssignmentsCommand = ResetPeriodWbsAssignmentsCommand;
let ResetPeriodWbsAssignmentsHandler = class ResetPeriodWbsAssignmentsHandler {
    wbsAssignmentService;
    constructor(wbsAssignmentService) {
        this.wbsAssignmentService = wbsAssignmentService;
    }
    async execute(command) {
        const { periodId, resetBy } = command;
        await this.wbsAssignmentService.평가기간_할당_전체삭제한다(periodId, resetBy);
    }
};
exports.ResetPeriodWbsAssignmentsHandler = ResetPeriodWbsAssignmentsHandler;
exports.ResetPeriodWbsAssignmentsHandler = ResetPeriodWbsAssignmentsHandler = __decorate([
    (0, cqrs_1.CommandHandler)(ResetPeriodWbsAssignmentsCommand),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService])
], ResetPeriodWbsAssignmentsHandler);
//# sourceMappingURL=reset-period-wbs-assignments.handler.js.map