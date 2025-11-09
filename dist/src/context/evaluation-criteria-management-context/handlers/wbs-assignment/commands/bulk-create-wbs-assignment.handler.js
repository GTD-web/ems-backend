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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkCreateWbsAssignmentHandler = exports.BulkCreateWbsAssignmentCommand = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_service_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.service");
const wbs_assignment_validation_service_1 = require("../../../services/wbs-assignment-validation.service");
const wbs_assignment_weight_calculation_service_1 = require("../../../services/wbs-assignment-weight-calculation.service");
class BulkCreateWbsAssignmentCommand {
    assignments;
    assignedBy;
    constructor(assignments, assignedBy) {
        this.assignments = assignments;
        this.assignedBy = assignedBy;
    }
}
exports.BulkCreateWbsAssignmentCommand = BulkCreateWbsAssignmentCommand;
let BulkCreateWbsAssignmentHandler = class BulkCreateWbsAssignmentHandler {
    dataSource;
    wbsAssignmentService;
    validationService;
    weightCalculationService;
    constructor(dataSource, wbsAssignmentService, validationService, weightCalculationService) {
        this.dataSource = dataSource;
        this.wbsAssignmentService = wbsAssignmentService;
        this.validationService = validationService;
        this.weightCalculationService = weightCalculationService;
    }
    async execute(command) {
        const { assignments, assignedBy } = command;
        return await this.dataSource.transaction(async (manager) => {
            const results = [];
            for (const data of assignments) {
                await this.validationService.할당생성비즈니스규칙검증한다(data, manager);
                const assignment = await this.wbsAssignmentService.생성한다(data, manager);
                results.push(assignment.DTO로_변환한다());
            }
            const employeePeriodSet = new Set();
            assignments.forEach((data) => {
                employeePeriodSet.add(`${data.employeeId}:${data.periodId}`);
            });
            for (const key of employeePeriodSet) {
                const [employeeId, periodId] = key.split(':');
                await this.weightCalculationService.직원_평가기간_가중치를_재계산한다(employeeId, periodId, manager);
            }
            return results;
        });
    }
};
exports.BulkCreateWbsAssignmentHandler = BulkCreateWbsAssignmentHandler;
exports.BulkCreateWbsAssignmentHandler = BulkCreateWbsAssignmentHandler = __decorate([
    (0, cqrs_1.CommandHandler)(BulkCreateWbsAssignmentCommand),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource,
        evaluation_wbs_assignment_service_1.EvaluationWbsAssignmentService,
        wbs_assignment_validation_service_1.WbsAssignmentValidationService,
        wbs_assignment_weight_calculation_service_1.WbsAssignmentWeightCalculationService])
], BulkCreateWbsAssignmentHandler);
//# sourceMappingURL=bulk-create-wbs-assignment.handler.js.map