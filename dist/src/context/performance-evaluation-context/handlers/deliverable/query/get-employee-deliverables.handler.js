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
var GetEmployeeDeliverablesHandler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEmployeeDeliverablesHandler = exports.GetEmployeeDeliverablesQuery = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const deliverable_service_1 = require("../../../../../domain/core/deliverable/deliverable.service");
class GetEmployeeDeliverablesQuery {
    employeeId;
    activeOnly;
    constructor(employeeId, activeOnly = true) {
        this.employeeId = employeeId;
        this.activeOnly = activeOnly;
    }
}
exports.GetEmployeeDeliverablesQuery = GetEmployeeDeliverablesQuery;
let GetEmployeeDeliverablesHandler = GetEmployeeDeliverablesHandler_1 = class GetEmployeeDeliverablesHandler {
    deliverableService;
    logger = new common_1.Logger(GetEmployeeDeliverablesHandler_1.name);
    constructor(deliverableService) {
        this.deliverableService = deliverableService;
    }
    async execute(query) {
        this.logger.debug(`직원별 산출물 조회 - 직원: ${query.employeeId}`);
        const deliverables = await this.deliverableService.필터_조회한다({
            employeeId: query.employeeId,
            activeOnly: query.activeOnly,
            orderBy: 'createdAt',
            orderDirection: 'DESC',
        });
        this.logger.debug(`직원별 산출물 조회 완료 - 개수: ${deliverables.length}`);
        return deliverables;
    }
};
exports.GetEmployeeDeliverablesHandler = GetEmployeeDeliverablesHandler;
exports.GetEmployeeDeliverablesHandler = GetEmployeeDeliverablesHandler = GetEmployeeDeliverablesHandler_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, cqrs_1.QueryHandler)(GetEmployeeDeliverablesQuery),
    __metadata("design:paramtypes", [deliverable_service_1.DeliverableService])
], GetEmployeeDeliverablesHandler);
//# sourceMappingURL=get-employee-deliverables.handler.js.map