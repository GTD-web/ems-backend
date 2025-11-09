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
exports.CreateEvaluationPeriodCommandHandler = exports.CreateEvaluationPeriodCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const evaluation_period_service_1 = require("../../../../../domain/core/evaluation-period/evaluation-period.service");
class CreateEvaluationPeriodCommand {
    createData;
    createdBy;
    constructor(createData, createdBy) {
        this.createData = createData;
        this.createdBy = createdBy;
    }
}
exports.CreateEvaluationPeriodCommand = CreateEvaluationPeriodCommand;
let CreateEvaluationPeriodCommandHandler = class CreateEvaluationPeriodCommandHandler {
    evaluationPeriodService;
    constructor(evaluationPeriodService) {
        this.evaluationPeriodService = evaluationPeriodService;
    }
    async execute(command) {
        const { createData, createdBy } = command;
        const createDto = {
            name: createData.name,
            startDate: createData.startDate,
            description: createData.description,
            peerEvaluationDeadline: createData.peerEvaluationDeadline,
            maxSelfEvaluationRate: createData.maxSelfEvaluationRate,
            gradeRanges: createData.gradeRanges,
        };
        const createdPeriod = await this.evaluationPeriodService.생성한다(createDto, createdBy);
        return createdPeriod;
    }
};
exports.CreateEvaluationPeriodCommandHandler = CreateEvaluationPeriodCommandHandler;
exports.CreateEvaluationPeriodCommandHandler = CreateEvaluationPeriodCommandHandler = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.CommandHandler)(CreateEvaluationPeriodCommand),
    __metadata("design:paramtypes", [evaluation_period_service_1.EvaluationPeriodService])
], CreateEvaluationPeriodCommandHandler);
//# sourceMappingURL=create-evaluation-period.handler.js.map