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
exports.GetWbsItemAssignmentsHandler = exports.GetWbsItemAssignmentsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
class GetWbsItemAssignmentsQuery {
    wbsItemId;
    periodId;
    constructor(wbsItemId, periodId) {
        this.wbsItemId = wbsItemId;
        this.periodId = periodId;
    }
}
exports.GetWbsItemAssignmentsQuery = GetWbsItemAssignmentsQuery;
let GetWbsItemAssignmentsHandler = class GetWbsItemAssignmentsHandler {
    wbsAssignmentRepository;
    constructor(wbsAssignmentRepository) {
        this.wbsAssignmentRepository = wbsAssignmentRepository;
    }
    async execute(query) {
        const { wbsItemId, periodId } = query;
        const assignments = await this.wbsAssignmentRepository.find({
            where: {
                wbsItemId,
                periodId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            order: {
                assignedDate: 'DESC',
            },
        });
        return assignments.map((assignment) => assignment.DTO로_변환한다());
    }
};
exports.GetWbsItemAssignmentsHandler = GetWbsItemAssignmentsHandler;
exports.GetWbsItemAssignmentsHandler = GetWbsItemAssignmentsHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetWbsItemAssignmentsQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], GetWbsItemAssignmentsHandler);
//# sourceMappingURL=get-wbs-item-assignments.handler.js.map