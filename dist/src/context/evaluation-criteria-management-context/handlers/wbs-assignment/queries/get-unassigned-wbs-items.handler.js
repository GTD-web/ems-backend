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
exports.GetUnassignedWbsItemsHandler = exports.GetUnassignedWbsItemsQuery = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const evaluation_wbs_assignment_entity_1 = require("../../../../../domain/core/evaluation-wbs-assignment/evaluation-wbs-assignment.entity");
const wbs_item_entity_1 = require("../../../../../domain/common/wbs-item/wbs-item.entity");
class GetUnassignedWbsItemsQuery {
    projectId;
    periodId;
    employeeId;
    constructor(projectId, periodId, employeeId) {
        this.projectId = projectId;
        this.periodId = periodId;
        this.employeeId = employeeId;
    }
}
exports.GetUnassignedWbsItemsQuery = GetUnassignedWbsItemsQuery;
let GetUnassignedWbsItemsHandler = class GetUnassignedWbsItemsHandler {
    wbsAssignmentRepository;
    wbsItemRepository;
    constructor(wbsAssignmentRepository, wbsItemRepository) {
        this.wbsAssignmentRepository = wbsAssignmentRepository;
        this.wbsItemRepository = wbsItemRepository;
    }
    async execute(query) {
        const { projectId, periodId, employeeId } = query;
        const allWbsItems = await this.wbsItemRepository.find({
            where: {
                projectId,
                deletedAt: (0, typeorm_2.IsNull)(),
            },
            order: {
                wbsCode: 'ASC',
            },
        });
        const whereCondition = {
            projectId,
            periodId,
            deletedAt: (0, typeorm_2.IsNull)(),
        };
        if (employeeId) {
            whereCondition.employeeId = employeeId;
        }
        const assignedWbsItems = await this.wbsAssignmentRepository.find({
            where: whereCondition,
            select: ['wbsItemId'],
        });
        const assignedWbsItemIds = new Set(assignedWbsItems.map((a) => a.wbsItemId));
        return allWbsItems
            .filter((item) => !assignedWbsItemIds.has(item.id))
            .map((item) => item.DTO로_변환한다());
    }
};
exports.GetUnassignedWbsItemsHandler = GetUnassignedWbsItemsHandler;
exports.GetUnassignedWbsItemsHandler = GetUnassignedWbsItemsHandler = __decorate([
    (0, cqrs_1.QueryHandler)(GetUnassignedWbsItemsQuery),
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(evaluation_wbs_assignment_entity_1.EvaluationWbsAssignment)),
    __param(1, (0, typeorm_1.InjectRepository)(wbs_item_entity_1.WbsItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], GetUnassignedWbsItemsHandler);
//# sourceMappingURL=get-unassigned-wbs-items.handler.js.map